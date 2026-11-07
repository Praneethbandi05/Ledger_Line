package com.ledgerline.dto.account;

import com.ledgerline.entity.Account;
import com.ledgerline.enums.AccountStatus;
import com.ledgerline.enums.AccountType;

import java.math.BigDecimal;
import java.time.Instant;

public class AccountResponse {

    private Long id;
    private String accountNumber;
    private Long userId;
    private String ownerUsername;
    private String ownerFullName;
    private AccountType accountType;
    private String currency;
    private BigDecimal balance;
    private AccountStatus status;
    private Instant createdAt;

    public AccountResponse() {}

    public AccountResponse(Account account) {
        this.id = account.getId();
        this.accountNumber = account.getAccountNumber();
        if (account.getUser() != null) {
            this.userId = account.getUser().getId();
            this.ownerUsername = account.getUser().getUsername();
            this.ownerFullName = account.getUser().getFullName();
        }
        this.accountType = account.getAccountType();
        this.currency = account.getCurrency();
        this.balance = account.getBalance();
        this.status = account.getStatus();
        this.createdAt = account.getCreatedAt();
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

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getOwnerUsername() {
        return ownerUsername;
    }

    public void setOwnerUsername(String ownerUsername) {
        this.ownerUsername = ownerUsername;
    }

    public String getOwnerFullName() {
        return ownerFullName;
    }

    public void setOwnerFullName(String ownerFullName) {
        this.ownerFullName = ownerFullName;
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
        this.balance = balance;
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
}
