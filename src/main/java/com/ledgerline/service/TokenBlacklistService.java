package com.ledgerline.service;

import com.ledgerline.entity.TokenBlacklist;
import com.ledgerline.repository.TokenBlacklistRepository;
import com.ledgerline.security.JwtTokenProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Date;
import java.util.HexFormat;

@Service
public class TokenBlacklistService {

    private static final Logger log = LoggerFactory.getLogger(TokenBlacklistService.class);

    private final TokenBlacklistRepository tokenBlacklistRepository;
    private final JwtTokenProvider jwtTokenProvider;

    public TokenBlacklistService(TokenBlacklistRepository tokenBlacklistRepository, JwtTokenProvider jwtTokenProvider) {
        this.tokenBlacklistRepository = tokenBlacklistRepository;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Transactional
    public void blacklistToken(String token) {
        if (token == null || token.isBlank()) {
            return;
        }

        try {
            Date expiration = jwtTokenProvider.getExpirationDateFromToken(token);
            String tokenHash = hashToken(token);

            TokenBlacklist blacklisted = new TokenBlacklist(tokenHash, expiration.toInstant());
            tokenBlacklistRepository.save(blacklisted);
            log.info("Token successfully blacklisted until {}", expiration);
        } catch (Exception e) {
            log.warn("Failed to extract expiry or blacklist token: {}", e.getMessage());
            // Fallback: blacklist with standard 24h default if unparseable
            String tokenHash = hashToken(token);
            tokenBlacklistRepository.save(new TokenBlacklist(tokenHash, Instant.now().plusSeconds(86400)));
        }
    }

    @Transactional(readOnly = true)
    public boolean isTokenBlacklisted(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }
        String tokenHash = hashToken(token);
        return tokenBlacklistRepository.existsByTokenHash(tokenHash);
    }

    public String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }
}
