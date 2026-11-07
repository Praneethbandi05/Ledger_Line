package com.ledgerline.repository;

import com.ledgerline.entity.LedgerEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LedgerEntryRepository extends JpaRepository<LedgerEntry, Long> {

    List<LedgerEntry> findByTransactionIdOrderByCreatedAtAsc(Long transactionId);

    List<LedgerEntry> findByAccountIdOrderByCreatedAtDesc(Long accountId);

    List<LedgerEntry> findAllByOrderByCreatedAtDesc();

    @Query("SELECT le FROM LedgerEntry le WHERE le.account.user.id = :userId ORDER BY le.createdAt DESC")
    List<LedgerEntry> findByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId);
}
