package com.ledgerline.entity;

import com.ledgerline.enums.AccountStatus;
import com.ledgerline.enums.AccountType;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;

@Entity
@Table(name = "accounts", indexes = {
    @Index(name = "idx_accounts_account_number", columnList = "account_number", unique = true),
    @Index(name = "idx_accounts_user_id", columnList = "user_id")
})
public class Account {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "account_number", nullable = false, unique = true, length = 30)
    private String accountNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "account_type", nullable = false, length = 20)
    private AccountType accountType;

    @Column(nullable = false, length = 3)
    private String currency = "USD";

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal balance = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_EVEN);

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AccountStatus status = AccountStatus.ACTIVE;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public Account() {}

    public Account(String accountNumber, User user, AccountType accountType, String currency, BigDecimal initialBalance) {
        this.accountNumber = accountNumber;
        this.user = user;
        this.accountType = accountType;
        this.currency = currency != null ? currency : "USD";
        this.balance = (initialBalance != null ? initialBalance : BigDecimal.ZERO).setScale(2, RoundingMode.HALF_EVEN);
        this.status = AccountStatus.ACTIVE;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
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

    public String getAccountNumber() {
        return accountNumber;
    }

    public void setAccountNumber(String accountNumber) {
        this.accountNumber = accountNumber;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
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

    public BigDecimal getBalance() {
        return balance;
    }

    public void setBalance(BigDecimal balance) {
        this.balance = balance != null ? balance.setScale(2, RoundingMode.HALF_EVEN) : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_EVEN);
    }

    public AccountStatus getStatus() {
        return status;
    }

    public void setStatus(AccountStatus status) {
        this.status = status;
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
