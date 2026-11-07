package com.ledgerline.security;

import com.ledgerline.entity.Account;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

@Component
public class AccountOwnershipValidator {

    private static final Logger log = LoggerFactory.getLogger(AccountOwnershipValidator.class);

    private final SecurityContextHelper securityContextHelper;

    public AccountOwnershipValidator(SecurityContextHelper securityContextHelper) {
        this.securityContextHelper = securityContextHelper;
    }

    /**
     * Validates that the current user has rights to view or read the given account.
     * ADMIN and AUDITOR can inspect accounts.
     * CUSTOMER can ONLY access their own account.
     */
    public void validateAccountReadAccess(Account account) {
        if (securityContextHelper.isAdmin() || securityContextHelper.isAuditor()) {
            return;
        }

        Long currentUserId = securityContextHelper.getCurrentUserId();
        if (account.getUser() == null || !account.getUser().getId().equals(currentUserId)) {
            log.warn("IDOR attempt detected: User {} attempted to read account {} owned by user {}",
                    securityContextHelper.getCurrentUsername(),
                    account.getAccountNumber(),
                    account.getUser() != null ? account.getUser().getId() : "null");
            throw new AccessDeniedException("Access denied: You do not have ownership of account " + account.getAccountNumber());
        }
    }

    /**
     * Validates that the current user has rights to modify or execute financial operations on the given account.
     * AUDITOR CANNOT modify accounts or move money.
     * CUSTOMER can only execute on their own account.
     * ADMIN can manage accounts.
     */
    public void validateAccountWriteAccess(Account account) {
        if (securityContextHelper.isAuditor()) {
            log.warn("Auditor {} attempted financial or modification operation on account {}",
                    securityContextHelper.getCurrentUsername(), account.getAccountNumber());
            throw new AccessDeniedException("Access denied: Auditors hold strictly read-only permissions and cannot modify accounts or execute financial transactions");
        }

        if (securityContextHelper.isAdmin()) {
            return;
        }

        Long currentUserId = securityContextHelper.getCurrentUserId();
        if (account.getUser() == null || !account.getUser().getId().equals(currentUserId)) {
            log.warn("IDOR modification attempt detected: User {} attempted to operate on account {} owned by user {}",
                    securityContextHelper.getCurrentUsername(),
                    account.getAccountNumber(),
                    account.getUser() != null ? account.getUser().getId() : "null");
            throw new AccessDeniedException("Access denied: You do not have ownership of account " + account.getAccountNumber());
        }
    }
}
