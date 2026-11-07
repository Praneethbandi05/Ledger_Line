package com.ledgerline.dto.transaction;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public class WithdrawalRequest {

    @NotBlank(message = "Source account number is required")
    private String accountNumber;

    @NotNull(message = "Withdrawal amount is required")
    @Positive(message = "Withdrawal amount must be strictly positive")
    @DecimalMin(value = "0.01", message = "Withdrawal amount must be at least 0.01")
    private BigDecimal amount;

    private String description;

    public WithdrawalRequest() {}

    public WithdrawalRequest(String accountNumber, BigDecimal amount, String description) {
        this.accountNumber = accountNumber;
        this.amount = amount;
        this.description = description;
    }

    public String getAccountNumber() {
        return accountNumber;
    }

    public void setAccountNumber(String accountNumber) {
        this.accountNumber = accountNumber;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
