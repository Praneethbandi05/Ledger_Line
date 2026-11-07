package com.ledgerline.dto.account;

import com.ledgerline.enums.AccountType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public class CreateAccountRequest {

    @NotNull(message = "Account type is required (SAVINGS or CHECKING)")
    private AccountType accountType;

    @Pattern(regexp = "^[A-Z]{3}$", message = "Currency must be a 3-letter uppercase ISO code (e.g., USD)")
    private String currency = "USD";

    public CreateAccountRequest() {}

    public CreateAccountRequest(AccountType accountType, String currency) {
        this.accountType = accountType;
        this.currency = currency != null ? currency : "USD";
    }

    public AccountType getAccountType() {
        return accountType;
    }

    public void setAccountType(AccountType accountType) {
        this.accountType = accountType;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }
}
