package com.ledgerline.security;

import com.ledgerline.enums.Role;
import com.ledgerline.exception.LedgerLineException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class SecurityContextHelper {

    public CustomUserDetails getCurrentUserDetails() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || !(authentication.getPrincipal() instanceof CustomUserDetails)) {
            throw new LedgerLineException("No authenticated user principal in security context", HttpStatus.UNAUTHORIZED);
        }
        return (CustomUserDetails) authentication.getPrincipal();
    }

    public Long getCurrentUserId() {
        return getCurrentUserDetails().getId();
    }

    public String getCurrentUsername() {
        return getCurrentUserDetails().getUsername();
    }

    public Role getCurrentRole() {
        return getCurrentUserDetails().getRole();
    }

    public boolean isAdmin() {
        return Role.ADMIN.equals(getCurrentRole());
    }

    public boolean isAuditor() {
        return Role.AUDITOR.equals(getCurrentRole());
    }

    public boolean isCustomer() {
        return Role.CUSTOMER.equals(getCurrentRole());
    }
}
