package com.ledgerline.dto.transaction;

import com.ledgerline.entity.Transaction;
import com.ledgerline.enums.TransactionStatus;
import com.ledgerline.enums.TransactionType;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class TransactionResponse {

    private Long id;
    private String reference;
    private String sourceAccountNumber;
    private String destinationAccountNumber;
    private BigDecimal amount;
    private String currency;
    private TransactionType transactionType;
    private TransactionStatus status;
    private String description;
    private String initiatedByUsername;
    private List<LedgerEntryResponse> ledgerEntries = new ArrayList<>();
    private Instant createdAt;

    public TransactionResponse() {}

    public TransactionResponse(Transaction tx) {
        this.id = tx.getId();
        this.reference = tx.getReference();
        if (tx.getSourceAccount() != null) {
            this.sourceAccountNumber = tx.getSourceAccount().getAccountNumber();
        }
        if (tx.getDestinationAccount() != null) {
            this.destinationAccountNumber = tx.getDestinationAccount().getAccountNumber();
        }
        this.amount = tx.getAmount();
        this.currency = tx.getCurrency();
        this.transactionType = tx.getTransactionType();
        this.status = tx.getStatus();
        this.description = tx.getDescription();
        if (tx.getInitiatedBy() != null) {
            this.initiatedByUsername = tx.getInitiatedBy().getUsername();
        }
        if (tx.getLedgerEntries() != null) {
            this.ledgerEntries = tx.getLedgerEntries()
                    .stream()
                    .map(LedgerEntryResponse::new)
                    .toList();
        }
        this.createdAt = tx.getCreatedAt();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getReference() {
        return reference;
    }

    public void setReference(String reference) {
        this.reference = reference;
    }

    public String getSourceAccountNumber() {
        return sourceAccountNumber;
    }

    public void setSourceAccountNumber(String sourceAccountNumber) {
        this.sourceAccountNumber = sourceAccountNumber;
    }

    public String getDestinationAccountNumber() {
        return destinationAccountNumber;
    }

    public void setDestinationAccountNumber(String destinationAccountNumber) {
        this.destinationAccountNumber = destinationAccountNumber;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public TransactionType getTransactionType() {
        return transactionType;
    }

    public void setTransactionType(TransactionType transactionType) {
        this.transactionType = transactionType;
    }

    public TransactionStatus getStatus() {
        return status;
    }

    public void setStatus(TransactionStatus status) {
        this.status = status;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getInitiatedByUsername() {
        return initiatedByUsername;
    }

    public void setInitiatedByUsername(String initiatedByUsername) {
        this.initiatedByUsername = initiatedByUsername;
    }

    public List<LedgerEntryResponse> getLedgerEntries() {
        return ledgerEntries;
    }

    public void setLedgerEntries(List<LedgerEntryResponse> ledgerEntries) {
        this.ledgerEntries = ledgerEntries;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
