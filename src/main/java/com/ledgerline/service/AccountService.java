package com.ledgerline.service;

import com.ledgerline.dto.account.AccountResponse;
import com.ledgerline.dto.account.CreateAccountRequest;
import com.ledgerline.entity.Account;
import com.ledgerline.entity.User;
import com.ledgerline.enums.AccountType;
import com.ledgerline.exception.ResourceNotFoundException;
import com.ledgerline.repository.AccountRepository;
import com.ledgerline.repository.UserRepository;
import com.ledgerline.security.AccountOwnershipValidator;
import com.ledgerline.security.SecurityContextHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.util.List;

@Service
public class AccountService {

    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final SecurityContextHelper securityContextHelper;
    private final AccountOwnershipValidator accountOwnershipValidator;
    private final AuditService auditService;

    public AccountService(
            AccountRepository accountRepository,
            UserRepository userRepository,
            SecurityContextHelper securityContextHelper,
            AccountOwnershipValidator accountOwnershipValidator,
            AuditService auditService) {
        this.accountRepository = accountRepository;
        this.userRepository = userRepository;
        this.securityContextHelper = securityContextHelper;
        this.accountOwnershipValidator = accountOwnershipValidator;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<AccountResponse> getMyAccounts() {
        Long currentUserId = securityContextHelper.getCurrentUserId();
        return accountRepository.findByUserId(currentUserId)
                .stream()
                .map(AccountResponse::new)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AccountResponse> getAllAccountsForAuditorOrAdmin() {
        return accountRepository.findAll()
                .stream()
                .map(AccountResponse::new)
                .toList();
    }

    @Transactional(readOnly = true)
    public AccountResponse getAccountById(Long accountId) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with ID: " + accountId));

        // BACKEND IDOR VALIDATION: Validate read ownership
        accountOwnershipValidator.validateAccountReadAccess(account);

        return new AccountResponse(account);
    }

    @Transactional
    public AccountResponse createAccount(CreateAccountRequest request) {
        // Derive user identity strictly from security context
        Long currentUserId = securityContextHelper.getCurrentUserId();
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + currentUserId));

        String accountNumber = generateUniqueAccountNumber();
        Account account = new Account(
                accountNumber,
                currentUser,
                request.getAccountType() != null ? request.getAccountType() : AccountType.CHECKING,
                request.getCurrency() != null ? request.getCurrency() : "USD",
                BigDecimal.ZERO
        );

        Account saved = accountRepository.save(account);
        auditService.recordEvent(currentUser.getUsername(), currentUser.getRole().name(), "ACCOUNT_CREATE",
                "ACCOUNT", saved.getAccountNumber(), "SUCCESS",
                "Account created of type " + saved.getAccountType() + " with currency " + saved.getCurrency());

        return new AccountResponse(saved);
    }

    @Transactional
    public AccountResponse performFinancialOperationCheck(Long accountId) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with ID: " + accountId));

        // BACKEND WRITE / FINANCIAL OPERATION VALIDATION:
        // Blocks AUDITOR from financial operations
        // Blocks CUSTOMER from operating on accounts they do not own
        accountOwnershipValidator.validateAccountWriteAccess(account);

        return new AccountResponse(account);
    }

    private String generateUniqueAccountNumber() {
        SecureRandom random = new SecureRandom();
        String candidate;
        do {
            int randomPart = 100000 + random.nextInt(900000);
            candidate = "ACC-" + randomPart;
        } while (accountRepository.existsByAccountNumber(candidate));
        return candidate;
    }
}
