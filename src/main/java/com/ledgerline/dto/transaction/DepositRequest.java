package com.ledgerline.dto.transaction;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public class DepositRequest {

    @NotBlank(message = "Destination account number is required")
    private String accountNumber;

    @NotNull(message = "Deposit amount is required")
    @Positive(message = "Deposit amount must be strictly positive")
    @DecimalMin(value = "0.01", message = "Deposit amount must be at least 0.01")
    private BigDecimal amount;

    private String description;

    public DepositRequest() {}

    public DepositRequest(String accountNumber, BigDecimal amount, String description) {
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
