package com.ledgerline.service;

import com.ledgerline.dto.transaction.DepositRequest;
import com.ledgerline.dto.transaction.LedgerEntryResponse;
import com.ledgerline.dto.transaction.TransactionResponse;
import com.ledgerline.dto.transaction.TransferRequest;
import com.ledgerline.dto.transaction.WithdrawalRequest;
import com.ledgerline.entity.Account;
import com.ledgerline.entity.LedgerEntry;
import com.ledgerline.entity.Transaction;
import com.ledgerline.entity.User;
import com.ledgerline.enums.AccountStatus;
import com.ledgerline.enums.TransactionStatus;
import com.ledgerline.enums.TransactionType;
import com.ledgerline.exception.BusinessRuleViolationException;
import com.ledgerline.exception.ResourceNotFoundException;
import com.ledgerline.ledger.DoubleEntryLedgerEngine;
import com.ledgerline.repository.AccountRepository;
import com.ledgerline.repository.LedgerEntryRepository;
import com.ledgerline.repository.TransactionRepository;
import com.ledgerline.repository.UserRepository;
import com.ledgerline.security.AccountOwnershipValidator;
import com.ledgerline.security.SecurityContextHelper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.List;

@Service
public class TransactionService {

    private static final Logger log = LoggerFactory.getLogger(TransactionService.class);

    private static final String SYSTEM_DEPOSIT_CLEARING_ACC = "ACC-SYS-CLEARING-DEPOSIT";
    private static final String SYSTEM_WITHDRAWAL_CLEARING_ACC = "ACC-SYS-CLEARING-WITHDRAWAL";

    private final TransactionRepository transactionRepository;
    private final LedgerEntryRepository ledgerEntryRepository;
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final DoubleEntryLedgerEngine ledgerEngine;
    private final SecurityContextHelper securityContextHelper;
    private final AccountOwnershipValidator accountOwnershipValidator;

    public TransactionService(
            TransactionRepository transactionRepository,
            LedgerEntryRepository ledgerEntryRepository,
            AccountRepository accountRepository,
            UserRepository userRepository,
            DoubleEntryLedgerEngine ledgerEngine,
            SecurityContextHelper securityContextHelper,
            AccountOwnershipValidator accountOwnershipValidator) {
        this.transactionRepository = transactionRepository;
        this.ledgerEntryRepository = ledgerEntryRepository;
        this.accountRepository = accountRepository;
        this.userRepository = userRepository;
        this.ledgerEngine = ledgerEngine;
        this.securityContextHelper = securityContextHelper;
        this.accountOwnershipValidator = accountOwnershipValidator;
    }

    /**
     * Executes an authorized deposit into a customer account.
     * Guaranteed double-entry balanced with system deposit clearing.
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public TransactionResponse deposit(DepositRequest request) {
        validatePositiveAmount(request.getAmount());
        BigDecimal amount = request.getAmount().setScale(2, RoundingMode.HALF_EVEN);

        // Lock customer account
        Account customerAccount = accountRepository.findByAccountNumberWithLock(request.getAccountNumber().trim())
                .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + request.getAccountNumber()));

        // Enforce account write access & auditor restriction
        accountOwnershipValidator.validateAccountWriteAccess(customerAccount);
        validateAccountIsActive(customerAccount);

        // Lock system clearing account
        Account depositClearing = accountRepository.findByAccountNumberWithLock(SYSTEM_DEPOSIT_CLEARING_ACC)
                .orElseThrow(() -> new IllegalStateException("System clearing account missing: " + SYSTEM_DEPOSIT_CLEARING_ACC));

        User currentUser = getCurrentAuthenticatedUser();
        String reference = generateTransactionReference("DEP");

        Transaction transaction = new Transaction(
                reference,
                depositClearing,
                customerAccount,
                amount,
                customerAccount.getCurrency(),
                TransactionType.DEPOSIT,
                TransactionStatus.PENDING,
                request.getDescription() != null ? request.getDescription().trim() : "Funds deposit",
                currentUser
        );

        Transaction savedTx = transactionRepository.save(transaction);

        // Book balanced entries through the ledger engine
        List<LedgerEntry> entries = ledgerEngine.bookDeposit(savedTx, customerAccount, depositClearing);
        for (LedgerEntry entry : entries) {
            savedTx.addLedgerEntry(entry);
        }

        // Persist updated account balances
        accountRepository.save(customerAccount);
        accountRepository.save(depositClearing);

        savedTx.setStatus(TransactionStatus.COMPLETED);
        Transaction completedTx = transactionRepository.save(savedTx);

        log.info("Deposit COMPLETED: Reference={}, Account={}, Amount=${}",
                reference, customerAccount.getAccountNumber(), amount);

        return new TransactionResponse(completedTx);
    }

    /**
     * Executes an authorized withdrawal from a customer account.
     * Guaranteed double-entry balanced with system withdrawal clearing.
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public TransactionResponse withdraw(WithdrawalRequest request) {
        validatePositiveAmount(request.getAmount());
        BigDecimal amount = request.getAmount().setScale(2, RoundingMode.HALF_EVEN);

        // Lock customer account
        Account customerAccount = accountRepository.findByAccountNumberWithLock(request.getAccountNumber().trim())
                .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + request.getAccountNumber()));

        // Enforce ownership: only the owner or an admin can withdraw
        accountOwnershipValidator.validateAccountWriteAccess(customerAccount);
        validateAccountIsActive(customerAccount);

        // Lock system withdrawal clearing account
        Account withdrawalClearing = accountRepository.findByAccountNumberWithLock(SYSTEM_WITHDRAWAL_CLEARING_ACC)
                .orElseThrow(() -> new IllegalStateException("System clearing account missing: " + SYSTEM_WITHDRAWAL_CLEARING_ACC));

        User currentUser = getCurrentAuthenticatedUser();
        String reference = generateTransactionReference("WDL");

        Transaction transaction = new Transaction(
                reference,
                customerAccount,
                withdrawalClearing,
                amount,
                customerAccount.getCurrency(),
                TransactionType.WITHDRAWAL,
                TransactionStatus.PENDING,
                request.getDescription() != null ? request.getDescription().trim() : "Funds withdrawal",
                currentUser
        );

        Transaction savedTx = transactionRepository.save(transaction);

        // Book balanced entries through the ledger engine (enforces balance >= amount)
        List<LedgerEntry> entries = ledgerEngine.bookWithdrawal(savedTx, customerAccount, withdrawalClearing);
        for (LedgerEntry entry : entries) {
            savedTx.addLedgerEntry(entry);
        }

        // Persist updated account balances
        accountRepository.save(customerAccount);
        accountRepository.save(withdrawalClearing);

        savedTx.setStatus(TransactionStatus.COMPLETED);
        Transaction completedTx = transactionRepository.save(savedTx);

        log.info("Withdrawal COMPLETED: Reference={}, Account={}, Amount=${}",
                reference, customerAccount.getAccountNumber(), amount);

        return new TransactionResponse(completedTx);
    }

    /**
     * Executes an authorized internal transfer between two accounts.
     * Employs deterministic lock ordering on account IDs to eliminate deadlocks.
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public TransactionResponse transfer(TransferRequest request) {
        validatePositiveAmount(request.getAmount());
        BigDecimal amount = request.getAmount().setScale(2, RoundingMode.HALF_EVEN);

        String sourceAccNum = request.getSourceAccountNumber().trim();
        String destAccNum = request.getDestinationAccountNumber().trim();

        if (sourceAccNum.equalsIgnoreCase(destAccNum)) {
            throw new BusinessRuleViolationException("Cannot transfer funds to the same account: " + sourceAccNum);
        }

        // Preliminary lookup to determine deterministic locking order
        Account preSource = accountRepository.findByAccountNumber(sourceAccNum)
                .orElseThrow(() -> new ResourceNotFoundException("Source account not found: " + sourceAccNum));
        Account preDest = accountRepository.findByAccountNumber(destAccNum)
                .orElseThrow(() -> new ResourceNotFoundException("Destination account not found: " + destAccNum));

        // Enforce ownership: only the owner or an admin can transfer FROM the source account
        accountOwnershipValidator.validateAccountWriteAccess(preSource);
        validateAccountIsActive(preSource);
        validateAccountIsActive(preDest);

        if (!preSource.getCurrency().equalsIgnoreCase(preDest.getCurrency())) {
            throw new BusinessRuleViolationException(
                    "Cross-currency transfers are currently unsupported (" + preSource.getCurrency() + " to " + preDest.getCurrency() + ")");
        }

        // DETERMINISTIC LOCKING: Lock the account with the smaller ID first to prevent deadlocks
        Account sourceAccount;
        Account destinationAccount;
        if (preSource.getId() < preDest.getId()) {
            sourceAccount = accountRepository.findByIdWithLock(preSource.getId()).orElseThrow();
            destinationAccount = accountRepository.findByIdWithLock(preDest.getId()).orElseThrow();
        } else {
            destinationAccount = accountRepository.findByIdWithLock(preDest.getId()).orElseThrow();
            sourceAccount = accountRepository.findByIdWithLock(preSource.getId()).orElseThrow();
        }

        User currentUser = getCurrentAuthenticatedUser();
        String reference = generateTransactionReference("TRF");

        Transaction transaction = new Transaction(
                reference,
                sourceAccount,
                destinationAccount,
                amount,
                sourceAccount.getCurrency(),
                TransactionType.TRANSFER,
                TransactionStatus.PENDING,
                request.getDescription() != null ? request.getDescription().trim() : "Internal transfer",
                currentUser
        );

        Transaction savedTx = transactionRepository.save(transaction);

        // Book balanced entries through the ledger engine (enforces source balance >= amount)
        List<LedgerEntry> entries = ledgerEngine.bookTransfer(savedTx, sourceAccount, destinationAccount);
        for (LedgerEntry entry : entries) {
            savedTx.addLedgerEntry(entry);
        }

        // Persist updated account balances
        accountRepository.save(sourceAccount);
        accountRepository.save(destinationAccount);

        savedTx.setStatus(TransactionStatus.COMPLETED);
        Transaction completedTx = transactionRepository.save(savedTx);

        log.info("Transfer COMPLETED: Reference={}, From={}, To={}, Amount=${}",
                reference, sourceAccount.getAccountNumber(), destinationAccount.getAccountNumber(), amount);

        return new TransactionResponse(completedTx);
    }

    @Transactional(readOnly = true)
    public TransactionResponse getTransactionByReference(String reference) {
        Transaction tx = transactionRepository.findByReference(reference)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with reference: " + reference));

        validateTransactionReadAccess(tx);
        return new TransactionResponse(tx);
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> getMyTransactions() {
        Long currentUserId = securityContextHelper.getCurrentUserId();
        return transactionRepository.findByUserIdOrderByCreatedAtDesc(currentUserId)
                .stream()
                .map(TransactionResponse::new)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> getAccountTransactions(Long accountId) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with ID: " + accountId));

        accountOwnershipValidator.validateAccountReadAccess(account);

        return transactionRepository.findByAccountIdOrderByCreatedAtDesc(accountId)
                .stream()
                .map(TransactionResponse::new)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> getAllTransactionsForAuditorOrAdmin() {
        return transactionRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(TransactionResponse::new)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<LedgerEntryResponse> getAllLedgerEntriesForAuditorOrAdmin() {
        return ledgerEntryRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(LedgerEntryResponse::new)
                .toList();
    }

    private void validateTransactionReadAccess(Transaction tx) {
        if (securityContextHelper.isAdmin() || securityContextHelper.isAuditor()) {
            return;
        }

        Long currentUserId = securityContextHelper.getCurrentUserId();
        boolean isOwner = (tx.getSourceAccount() != null && tx.getSourceAccount().getUser() != null && tx.getSourceAccount().getUser().getId().equals(currentUserId))
                || (tx.getDestinationAccount() != null && tx.getDestinationAccount().getUser() != null && tx.getDestinationAccount().getUser().getId().equals(currentUserId));

        if (!isOwner) {
            throw new AccessDeniedException("Access denied: You do not have permission to view transaction " + tx.getReference());
        }
    }

    private void validateAccountIsActive(Account account) {
        if (account.getStatus() != AccountStatus.ACTIVE) {
            throw new BusinessRuleViolationException("Account " + account.getAccountNumber() + " is " + account.getStatus() + " and cannot execute transactions");
        }
    }

    private void validatePositiveAmount(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleViolationException("Transaction amount must be strictly positive and greater than zero");
        }
        if (amount.compareTo(new BigDecimal("0.01")) < 0) {
            throw new BusinessRuleViolationException("Transaction amount must be at least 0.01");
        }
    }

    private User getCurrentAuthenticatedUser() {
        Long userId = securityContextHelper.getCurrentUserId();
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found: " + userId));
    }

    private String generateTransactionReference(String prefix) {
        SecureRandom random = new SecureRandom();
        long timestamp = Instant.now().toEpochMilli();
        int randomPart = 1000 + random.nextInt(9000);
        return "TXN-" + prefix + "-" + timestamp + "-" + randomPart;
    }
}
