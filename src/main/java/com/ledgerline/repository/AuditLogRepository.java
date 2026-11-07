package com.ledgerline.repository;

import com.ledgerline.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findAllByOrderByCreatedAtDesc();

    List<AuditLog> findByActorUsernameOrderByCreatedAtDesc(String actorUsername);

    List<AuditLog> findByActionOrderByCreatedAtDesc(String action);

    List<AuditLog> findByResourceIdOrderByCreatedAtDesc(String resourceId);

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
