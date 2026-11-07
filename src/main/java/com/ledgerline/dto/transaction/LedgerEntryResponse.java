package com.ledgerline.dto.transaction;

import com.ledgerline.entity.LedgerEntry;
import com.ledgerline.enums.EntryType;

import java.math.BigDecimal;
import java.time.Instant;

public class LedgerEntryResponse {

    private Long id;
    private String accountNumber;
    private EntryType entryType;
    private BigDecimal amount;
    private BigDecimal balanceAfter;
    private String currency;
    private String description;
    private Instant createdAt;

    public LedgerEntryResponse() {}

    public LedgerEntryResponse(LedgerEntry entry) {
        this.id = entry.getId();
        if (entry.getAccount() != null) {
            this.accountNumber = entry.getAccount().getAccountNumber();
        }
        this.entryType = entry.getEntryType();
        this.amount = entry.getAmount();
        this.balanceAfter = entry.getBalanceAfter();
        this.currency = entry.getCurrency();
        this.description = entry.getDescription();
        this.createdAt = entry.getCreatedAt();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getAccountNumber() {
        return accountNumber;
    }

    public void setAccountNumber(String accountNumber) {
        this.accountNumber = accountNumber;
    }

    public EntryType getEntryType() {
        return entryType;
    }

    public void setEntryType(EntryType entryType) {
        this.entryType = entryType;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public BigDecimal getBalanceAfter() {
        return balanceAfter;
    }

    public void setBalanceAfter(BigDecimal balanceAfter) {
        this.balanceAfter = balanceAfter;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
