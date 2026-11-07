package com.ledgerline.enums;

public enum Role {
    ADMIN,
    CUSTOMER,
    AUDITOR;

    public String getAuthority() {
        return "ROLE_" + this.name();
    }
}
