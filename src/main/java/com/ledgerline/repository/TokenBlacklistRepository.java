package com.ledgerline.repository;

import com.ledgerline.entity.TokenBlacklist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;

@Repository
public interface TokenBlacklistRepository extends JpaRepository<TokenBlacklist, String> {

    boolean existsByTokenHash(String tokenHash);

    @Modifying
    @Query("DELETE FROM TokenBlacklist t WHERE t.expiresAt < :now")
    void deleteExpiredTokens(@Param("now") Instant now);
}
