package com.ledgerline.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ledgerline.dto.transaction.AccountStatementResponse;
import com.ledgerline.dto.transaction.DepositRequest;
import com.ledgerline.dto.transaction.LedgerEntryResponse;
import com.ledgerline.dto.transaction.TransactionResponse;
import com.ledgerline.dto.transaction.TransferRequest;
import com.ledgerline.dto.transaction.WithdrawalRequest;
import com.ledgerline.entity.Account;
import com.ledgerline.entity.IdempotencyKey;
import com.ledgerline.entity.LedgerEntry;
import com.ledgerline.entity.Transaction;
import com.ledgerline.entity.User;
import com.ledgerline.enums.AccountStatus;
import com.ledgerline.enums.EntryType;
import com.ledgerline.enums.TransactionStatus;
import com.ledgerline.enums.TransactionType;
import com.ledgerline.exception.BusinessRuleViolationException;
import com.ledgerline.exception.IdempotencyConflictException;
import com.ledgerline.exception.MissingIdempotencyKeyException;
import com.ledgerline.exception.ResourceNotFoundException;
import com.ledgerline.ledger.DoubleEntryLedgerEngine;
import com.ledgerline.repository.AccountRepository;
import com.ledgerline.repository.IdempotencyKeyRepository;
import com.ledgerline.repository.LedgerEntryRepository;
import com.ledgerline.repository.TransactionRepository;
import com.ledgerline.repository.UserRepository;
import com.ledgerline.security.AccountOwnershipValidator;
import com.ledgerline.security.SecurityContextHelper;
import com.ledgerline.util.IdempotencyPayloadHasher;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class TransactionService {

    private static final Logger log = LoggerFactory.getLogger(TransactionService.class);

    private static final String SYSTEM_DEPOSIT_CLEARING_ACC = "ACC-SYS-CLEARING-DEPOSIT";
    private static final String SYSTEM_WITHDRAWAL_CLEARING_ACC = "ACC-SYS-CLEARING-WITHDRAWAL";

    private final TransactionRepository transactionRepository;
    private final LedgerEntryRepository ledgerEntryRepository;
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final IdempotencyKeyRepository idempotencyKeyRepository;
    private final DoubleEntryLedgerEngine ledgerEngine;
    private final SecurityContextHelper securityContextHelper;
    private final AccountOwnershipValidator accountOwnershipValidator;
    private final ObjectMapper objectMapper;
    private final AuditService auditService;

    public TransactionService(
            TransactionRepository transactionRepository,
            LedgerEntryRepository ledgerEntryRepository,
            AccountRepository accountRepository,
            UserRepository userRepository,
            IdempotencyKeyRepository idempotencyKeyRepository,
            DoubleEntryLedgerEngine ledgerEngine,
            SecurityContextHelper securityContextHelper,
            AccountOwnershipValidator accountOwnershipValidator,
            ObjectMapper objectMapper,
            AuditService auditService) {
        this.transactionRepository = transactionRepository;
        this.ledgerEntryRepository = ledgerEntryRepository;
        this.accountRepository = accountRepository;
        this.userRepository = userRepository;
        this.idempotencyKeyRepository = idempotencyKeyRepository;
        this.ledgerEngine = ledgerEngine;
        this.securityContextHelper = securityContextHelper;
        this.accountOwnershipValidator = accountOwnershipValidator;
        this.objectMapper = objectMapper;
        this.auditService = auditService;
    }

    /**
     * Executes an authorized deposit into a customer account.
     * Guaranteed double-entry balanced with system deposit clearing.
     * Guaranteed idempotent using persistent database records and payload hash matching.
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public TransactionResponse deposit(DepositRequest request, String idempotencyKey) {
        validateIdempotencyKey(idempotencyKey);
        String cleanKey = idempotencyKey.trim();
        String requestHash = IdempotencyPayloadHasher.computeHash(request, objectMapper);

        // Fast-path idempotency replay check before acquiring locks
        Optional<TransactionResponse> cached = checkExistingIdempotency(cleanKey, requestHash);
        if (cached.isPresent()) {
            return cached.get();
        }

        validatePositiveAmount(request.getAmount());
        BigDecimal amount = request.getAmount().setScale(2, RoundingMode.HALF_EVEN);

        // Lock customer account
        Account customerAccount = accountRepository.findByAccountNumberWithLock(request.getAccountNumber().trim())
                .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + request.getAccountNumber()));

        // Double-check idempotency under lock in case of concurrent execution
        cached = checkExistingIdempotency(cleanKey, requestHash);
        if (cached.isPresent()) {
            return cached.get();
        }

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

        TransactionResponse response = new TransactionResponse(completedTx);
        recordIdempotency(cleanKey, requestHash, "/api/v1/transactions/deposit", response);

        auditService.recordEvent(currentUser.getUsername(), currentUser.getRole().name(), "DEPOSIT",
                "ACCOUNT", customerAccount.getAccountNumber(), "SUCCESS",
                String.format("Deposit of $%s into account %s [Reference: %s]", amount, customerAccount.getAccountNumber(), reference));

        return response;
    }

    /**
     * Executes an authorized withdrawal from a customer account.
     * Guaranteed double-entry balanced with system withdrawal clearing.
     * Guaranteed idempotent using persistent database records and payload hash matching.
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public TransactionResponse withdraw(WithdrawalRequest request, String idempotencyKey) {
        validateIdempotencyKey(idempotencyKey);
        String cleanKey = idempotencyKey.trim();
        String requestHash = IdempotencyPayloadHasher.computeHash(request, objectMapper);

        // Fast-path check
        Optional<TransactionResponse> cached = checkExistingIdempotency(cleanKey, requestHash);
        if (cached.isPresent()) {
            return cached.get();
        }

        validatePositiveAmount(request.getAmount());
        BigDecimal amount = request.getAmount().setScale(2, RoundingMode.HALF_EVEN);

        // Lock customer account
        Account customerAccount = accountRepository.findByAccountNumberWithLock(request.getAccountNumber().trim())
                .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + request.getAccountNumber()));

        // Double check under lock
        cached = checkExistingIdempotency(cleanKey, requestHash);
        if (cached.isPresent()) {
            return cached.get();
        }

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
        List<LedgerEntry> entries;
        try {
            entries = ledgerEngine.bookWithdrawal(savedTx, customerAccount, withdrawalClearing);
        } catch (BusinessRuleViolationException e) {
            auditService.recordSecurityEvent(currentUser.getUsername(), currentUser.getRole().name(), "WITHDRAWAL_FAILED",
                    "ACCOUNT", customerAccount.getAccountNumber(), "REJECTED",
                    String.format("Withdrawal of $%s rejected: %s", amount, e.getMessage()));
            throw e;
        }

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

        TransactionResponse response = new TransactionResponse(completedTx);
        recordIdempotency(cleanKey, requestHash, "/api/v1/transactions/withdraw", response);

        auditService.recordEvent(currentUser.getUsername(), currentUser.getRole().name(), "WITHDRAWAL",
                "ACCOUNT", customerAccount.getAccountNumber(), "SUCCESS",
                String.format("Withdrawal of $%s from account %s [Reference: %s]", amount, customerAccount.getAccountNumber(), reference));

        return response;
    }

    /**
     * Executes an authorized internal transfer between two accounts.
     * Employs deterministic lock ordering on account IDs to eliminate deadlocks.
     * Guaranteed idempotent using persistent database records and payload hash matching.
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public TransactionResponse transfer(TransferRequest request, String idempotencyKey) {
        validateIdempotencyKey(idempotencyKey);
        String cleanKey = idempotencyKey.trim();
        String requestHash = IdempotencyPayloadHasher.computeHash(request, objectMapper);

        // Fast-path check
        Optional<TransactionResponse> cached = checkExistingIdempotency(cleanKey, requestHash);
        if (cached.isPresent()) {
            return cached.get();
        }

        validatePositiveAmount(request.getAmount());
        BigDecimal amount = request.getAmount().setScale(2, RoundingMode.HALF_EVEN);

        String sourceAccNum = request.getSourceAccountNumber().trim();
        String destAccNum = request.getDestinationAccountNumber().trim();

        if (sourceAccNum.equalsIgnoreCase(destAccNum)) {
            throw new BusinessRuleViolationException("Cannot transfer funds to the same account: " + sourceAccNum);
        }

        // Determine deterministic locking order by primary key ID without hydrating entities into persistence context
        Long sourceId = accountRepository.findIdByAccountNumber(sourceAccNum)
                .orElseThrow(() -> new ResourceNotFoundException("Source account not found: " + sourceAccNum));
        Long destId = accountRepository.findIdByAccountNumber(destAccNum)
                .orElseThrow(() -> new ResourceNotFoundException("Destination account not found: " + destAccNum));

        // DETERMINISTIC LOCKING: Lock the account with the smaller ID first to prevent deadlocks
        Account sourceAccount;
        Account destinationAccount;
        if (sourceId < destId) {
            sourceAccount = accountRepository.findByIdWithLock(sourceId).orElseThrow();
            destinationAccount = accountRepository.findByIdWithLock(destId).orElseThrow();
        } else {
            destinationAccount = accountRepository.findByIdWithLock(destId).orElseThrow();
            sourceAccount = accountRepository.findByIdWithLock(sourceId).orElseThrow();
        }

        // Enforce ownership: only the owner or an admin can transfer FROM the source account
        accountOwnershipValidator.validateAccountWriteAccess(sourceAccount);
        validateAccountIsActive(sourceAccount);
        validateAccountIsActive(destinationAccount);

        if (!sourceAccount.getCurrency().equalsIgnoreCase(destinationAccount.getCurrency())) {
            throw new BusinessRuleViolationException(
                    "Cross-currency transfers are currently unsupported (" + sourceAccount.getCurrency() + " to " + destinationAccount.getCurrency() + ")");
        }

        // Double check under lock
        cached = checkExistingIdempotency(cleanKey, requestHash);
        if (cached.isPresent()) {
            return cached.get();
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
        List<LedgerEntry> entries;
        try {
            entries = ledgerEngine.bookTransfer(savedTx, sourceAccount, destinationAccount);
        } catch (BusinessRuleViolationException e) {
            auditService.recordSecurityEvent(currentUser.getUsername(), currentUser.getRole().name(), "TRANSFER_FAILED",
                    "ACCOUNT", sourceAccount.getAccountNumber(), "REJECTED",
                    String.format("Transfer of $%s rejected: %s", amount, e.getMessage()));
            throw e;
        }

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

        TransactionResponse response = new TransactionResponse(completedTx);
        recordIdempotency(cleanKey, requestHash, "/api/v1/transactions/transfer", response);

        auditService.recordEvent(currentUser.getUsername(), currentUser.getRole().name(), "TRANSFER",
                "ACCOUNT", sourceAccount.getAccountNumber(), "SUCCESS",
                String.format("Transfer of $%s from %s to %s [Reference: %s]",
                        amount, sourceAccount.getAccountNumber(), destinationAccount.getAccountNumber(), reference));

        return response;
    }

    /**
     * Retrieves transactions for the authenticated customer.
     */
    @Transactional(readOnly = true)
    public List<TransactionResponse> getMyTransactions() {
        String username = securityContextHelper.getCurrentUsername();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        List<Transaction> transactions = transactionRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getId());
        return transactions.stream().map(TransactionResponse::new).toList();
    }

    /**
     * Retrieves transactions for a specific account, enforcing customer ownership.
     */
    @Transactional(readOnly = true)
    public List<TransactionResponse> getAccountTransactions(Long accountId) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with ID: " + accountId));

        accountOwnershipValidator.validateAccountReadAccess(account);

        List<Transaction> transactions = transactionRepository.findByAccountIdOrderByCreatedAtDesc(accountId);
        return transactions.stream().map(TransactionResponse::new).toList();
    }

    /**
     * Retrieves an official account statement including totals and transactions.
     */
    @Transactional(readOnly = true)
    public AccountStatementResponse getAccountStatement(Long accountId) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with ID: " + accountId));

        accountOwnershipValidator.validateAccountReadAccess(account);

        List<Transaction> transactions = transactionRepository.findByAccountIdOrderByCreatedAtDesc(accountId);
        List<TransactionResponse> txResponses = transactions.stream()
                .map(TransactionResponse::new)
                .toList();

        List<LedgerEntry> entries = ledgerEntryRepository.findByAccountIdOrderByCreatedAtDesc(accountId);
        BigDecimal totalDebits = entries.stream()
                .filter(e -> e.getEntryType() == EntryType.DEBIT)
                .map(LedgerEntry::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalCredits = entries.stream()
                .filter(e -> e.getEntryType() == EntryType.CREDIT)
                .map(LedgerEntry::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new AccountStatementResponse(
                account.getAccountNumber(),
                account.getAccountType().name(),
                account.getCurrency(),
                account.getBalance(),
                totalDebits,
                totalCredits,
                transactions.size(),
                txResponses
        );
    }

    /**
     * Retrieves a single transaction by reference, enforcing ownership/auditor checks.
     */
    @Transactional(readOnly = true)
    public TransactionResponse getTransactionByReference(String reference) {
        Transaction tx = transactionRepository.findByReference(reference)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found: " + reference));

        boolean isAuditorOrAdmin = securityContextHelper.isAuditor() || securityContextHelper.isAdmin();
        if (!isAuditorOrAdmin) {
            String currentUsername = securityContextHelper.getCurrentUsername();
            boolean isInitiator = tx.getInitiatedBy() != null && tx.getInitiatedBy().getUsername().equalsIgnoreCase(currentUsername);
            boolean isSourceOwner = tx.getSourceAccount() != null && tx.getSourceAccount().getUser().getUsername().equalsIgnoreCase(currentUsername);
            boolean isDestOwner = tx.getDestinationAccount() != null && tx.getDestinationAccount().getUser().getUsername().equalsIgnoreCase(currentUsername);

            if (!isInitiator && !isSourceOwner && !isDestOwner) {
                throw new AccessDeniedException("Access denied: You do not have permission to view transaction " + reference);
            }
        }

        return new TransactionResponse(tx);
    }

    /**
     * Auditor and Admin: View all transactions across the platform.
     */
    @Transactional(readOnly = true)
    public List<TransactionResponse> getAllTransactionsForAuditorOrAdmin() {
        return transactionRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(TransactionResponse::new)
                .toList();
    }

    /**
     * Auditor and Admin: View full double-entry ledger entries.
     */
    @Transactional(readOnly = true)
    public List<LedgerEntryResponse> getAllLedgerEntriesForAuditorOrAdmin() {
        return ledgerEntryRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(LedgerEntryResponse::new)
                .toList();
    }

    // -------------------------------------------------------------
    // Idempotency Validation and Persistence Helpers
    // -------------------------------------------------------------

    private void validateIdempotencyKey(String key) {
        if (key == null || key.trim().isEmpty()) {
            throw new MissingIdempotencyKeyException("Missing required 'Idempotency-Key' HTTP header for financial operations");
        }
        String trimmed = key.trim();
        if (trimmed.length() < 8 || trimmed.length() > 100) {
            throw new BusinessRuleViolationException("Idempotency-Key must be between 8 and 100 characters in length");
        }
    }

    private Optional<TransactionResponse> checkExistingIdempotency(String idempotencyKey, String requestHash) {
        Optional<IdempotencyKey> existingOpt = idempotencyKeyRepository.findByIdempotencyKey(idempotencyKey);
        if (existingOpt.isPresent()) {
            IdempotencyKey existing = existingOpt.get();
            if (!existing.getRequestHash().equals(requestHash)) {
                log.warn("Idempotency key conflict: Key '{}' reused with mismatched request payload", idempotencyKey);
                throw new IdempotencyConflictException(
                        "Idempotency key '" + idempotencyKey + "' has already been used with a different request payload.");
            }
            log.info("Idempotent replay detected for key: {}. Returning original cached result.", idempotencyKey);
            try {
                TransactionResponse cached = objectMapper.readValue(existing.getResponseBody(), TransactionResponse.class);
                return Optional.of(cached);
            } catch (JsonProcessingException e) {
                log.error("Failed to deserialize cached idempotency response for key: {}", idempotencyKey, e);
                throw new IllegalStateException("Corrupted cached idempotency payload", e);
            }
        }
        return Optional.empty();
    }

    private void recordIdempotency(String idempotencyKey, String requestHash, String endpoint, TransactionResponse response) {
        try {
            String json = objectMapper.writeValueAsString(response);
            Instant expiresAt = Instant.now().plus(Duration.ofDays(7));
            IdempotencyKey keyEntity = new IdempotencyKey(
                    idempotencyKey,
                    requestHash,
                    endpoint,
                    "POST",
                    201,
                    json,
                    expiresAt
            );
            idempotencyKeyRepository.save(keyEntity);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize idempotency response payload", e);
        }
    }

    // -------------------------------------------------------------
    // Internal Helper Methods
    // -------------------------------------------------------------

    private void validatePositiveAmount(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleViolationException("Transaction amount must be strictly greater than zero");
        }
    }

    private void validateAccountIsActive(Account account) {
        if (account.getStatus() != AccountStatus.ACTIVE) {
            throw new BusinessRuleViolationException("Account " + account.getAccountNumber() + " is " + account.getStatus() + " and cannot transact");
        }
    }

    private User getCurrentAuthenticatedUser() {
        String username = securityContextHelper.getCurrentUsername();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found: " + username));
    }

    private String generateTransactionReference(String prefix) {
        SecureRandom random = new SecureRandom();
        long randomPart = Math.abs(random.nextLong()) % 1_000_000_000L;
        return String.format("%s-%d-%09d", prefix, Instant.now().toEpochMilli(), randomPart);
    }
}
