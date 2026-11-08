package com.ledgerline.repository;

import com.ledgerline.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findAllByOrderByCreatedAtDesc();

    Page<AuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<AuditLog> findByActorUsernameOrderByCreatedAtDesc(String actorUsername);

    List<AuditLog> findByActionOrderByCreatedAtDesc(String action);

    List<AuditLog> findByResourceIdOrderByCreatedAtDesc(String resourceId);

    @Query("SELECT a FROM AuditLog a WHERE " +
           "(:actor IS NULL OR LOWER(a.actorUsername) = LOWER(:actor)) AND " +
           "(:action IS NULL OR UPPER(a.action) = UPPER(:action)) AND " +
           "(:resourceId IS NULL OR a.resourceId = :resourceId) " +
           "ORDER BY a.createdAt DESC")
    Page<AuditLog> findWithFilters(
            @Param("actor") String actor,
            @Param("action") String action,
            @Param("resourceId") String resourceId,
            Pageable pageable);

    // Enforce append-only semantics by disabling delete operations
    @Override
    default void deleteById(Long id) {
        throw new UnsupportedOperationException("Audit records are strictly append-only and cannot be deleted");
    }

    @Override
    default void delete(AuditLog entity) {
        throw new UnsupportedOperationException("Audit records are strictly append-only and cannot be deleted");
    }

    @Override
    default void deleteAll(Iterable<? extends AuditLog> entities) {
        throw new UnsupportedOperationException("Audit records are strictly append-only and cannot be deleted");
    }

    @Override
    default void deleteAll() {
        throw new UnsupportedOperationException("Audit records are strictly append-only and cannot be deleted");
    }
}
