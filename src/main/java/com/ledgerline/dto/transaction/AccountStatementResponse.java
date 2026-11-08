package com.ledgerline.dto.transaction;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public class AccountStatementResponse {

    private String accountNumber;
    private String accountType;
    private String currency;
    private BigDecimal currentBalance;
    private BigDecimal totalDebits;
    private BigDecimal totalCredits;
    private int transactionCount;
    private Instant generatedAt;
    private List<TransactionResponse> transactions;

    public AccountStatementResponse() {
        this.generatedAt = Instant.now();
    }

    public AccountStatementResponse(
            String accountNumber,
            String accountType,
            String currency,
            BigDecimal currentBalance,
            BigDecimal totalDebits,
            BigDecimal totalCredits,
            int transactionCount,
            List<TransactionResponse> transactions) {
        this.accountNumber = accountNumber;
        this.accountType = accountType;
        this.currency = currency;
        this.currentBalance = currentBalance;
        this.totalDebits = totalDebits;
        this.totalCredits = totalCredits;
        this.transactionCount = transactionCount;
        this.transactions = transactions;
        this.generatedAt = Instant.now();
    }

    public String getAccountNumber() {
        return accountNumber;
    }

    public void setAccountNumber(String accountNumber) {
        this.accountNumber = accountNumber;
    }

    public String getAccountType() {
        return accountType;
    }

    public void setAccountType(String accountType) {
        this.accountType = accountType;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public BigDecimal getCurrentBalance() {
        return currentBalance;
    }

    public void setCurrentBalance(BigDecimal currentBalance) {
        this.currentBalance = currentBalance;
    }

    public BigDecimal getTotalDebits() {
        return totalDebits;
    }

    public void setTotalDebits(BigDecimal totalDebits) {
        this.totalDebits = totalDebits;
    }

    public BigDecimal getTotalCredits() {
        return totalCredits;
    }

    public void setTotalCredits(BigDecimal totalCredits) {
        this.totalCredits = totalCredits;
    }

    public int getTransactionCount() {
        return transactionCount;
    }

    public void setTransactionCount(int transactionCount) {
        this.transactionCount = transactionCount;
    }

    public Instant getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(Instant generatedAt) {
        this.generatedAt = generatedAt;
    }

    public List<TransactionResponse> getTransactions() {
        return transactions;
    }

    public void setTransactions(List<TransactionResponse> transactions) {
        this.transactions = transactions;
    }
}
