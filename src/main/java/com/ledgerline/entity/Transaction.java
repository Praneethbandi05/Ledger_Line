package com.ledgerline.entity;

import com.ledgerline.enums.TransactionStatus;
import com.ledgerline.enums.TransactionType;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "transactions", indexes = {
    @Index(name = "idx_transactions_reference", columnList = "reference", unique = true),
    @Index(name = "idx_transactions_source_account", columnList = "source_account_id"),
    @Index(name = "idx_transactions_destination_account", columnList = "destination_account_id"),
    @Index(name = "idx_transactions_created_at", columnList = "created_at"),
    @Index(name = "idx_transactions_status", columnList = "status")
})
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String reference;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_account_id")
    private Account sourceAccount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "destination_account_id")
    private Account destinationAccount;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 3)
    private String currency = "USD";

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false, length = 20)
    private TransactionType transactionType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TransactionStatus status = TransactionStatus.PENDING;

    @Column(length = 255)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "initiated_by_user_id", nullable = false)
    private User initiatedBy;

    @OneToMany(mappedBy = "transaction", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<LedgerEntry> ledgerEntries = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public Transaction() {}

    public Transaction(
            String reference,
            Account sourceAccount,
            Account destinationAccount,
            BigDecimal amount,
            String currency,
            TransactionType transactionType,
            TransactionStatus status,
            String description,
            User initiatedBy) {
        this.reference = reference;
        this.sourceAccount = sourceAccount;
        this.destinationAccount = destinationAccount;
        this.amount = amount != null ? amount.setScale(2, RoundingMode.HALF_EVEN) : BigDecimal.ZERO;
        this.currency = currency != null ? currency : "USD";
        this.transactionType = transactionType;
        this.status = status != null ? status : TransactionStatus.PENDING;
        this.description = description;
        this.initiatedBy = initiatedBy;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public void addLedgerEntry(LedgerEntry entry) {
        ledgerEntries.add(entry);
        entry.setTransaction(this);
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
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

    public Account getSourceAccount() {
        return sourceAccount;
    }

    public void setSourceAccount(Account sourceAccount) {
        this.sourceAccount = sourceAccount;
    }

    public Account getDestinationAccount() {
        return destinationAccount;
    }

    public void setDestinationAccount(Account destinationAccount) {
        this.destinationAccount = destinationAccount;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount != null ? amount.setScale(2, RoundingMode.HALF_EVEN) : BigDecimal.ZERO;
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

    public User getInitiatedBy() {
        return initiatedBy;
    }

    public void setInitiatedBy(User initiatedBy) {
        this.initiatedBy = initiatedBy;
    }

    public List<LedgerEntry> getLedgerEntries() {
        return ledgerEntries;
    }

    public void setLedgerEntries(List<LedgerEntry> ledgerEntries) {
        this.ledgerEntries = ledgerEntries;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
