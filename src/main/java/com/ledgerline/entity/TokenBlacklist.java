package com.ledgerline.entity;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "token_blacklist", indexes = {
    @Index(name = "idx_token_blacklist_expires_at", columnList = "expires_at")
})
public class TokenBlacklist {

    @Id
    @Column(name = "token_hash", nullable = false, length = 64)
    private String tokenHash;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "invalidated_at", nullable = false)
    private Instant invalidatedAt = Instant.now();

    public TokenBlacklist() {}

    public TokenBlacklist(String tokenHash, Instant expiresAt) {
        this.tokenHash = tokenHash;
        this.expiresAt = expiresAt;
        this.invalidatedAt = Instant.now();
    }

    public String getTokenHash() {
        return tokenHash;
    }

    public void setTokenHash(String tokenHash) {
        this.tokenHash = tokenHash;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }

    public Instant getInvalidatedAt() {
        return invalidatedAt;
    }

    public void setInvalidatedAt(Instant invalidatedAt) {
        this.invalidatedAt = invalidatedAt;
    }
}
