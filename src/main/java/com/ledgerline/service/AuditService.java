package com.ledgerline.service;

import com.ledgerline.dto.audit.AuditLogResponse;
import com.ledgerline.entity.AuditLog;
import com.ledgerline.repository.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.List;

@Service
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    /**
     * Records an immutable append-only audit log entry.
     */
    @Transactional
    public AuditLog recordEvent(String actorUsername, String actorRole, String action,
                                String resourceType, String resourceId, String result, String details) {

        String ipAddress = resolveClientIp();
        String userAgent = resolveUserAgent();

        AuditLog entry = new AuditLog(
                actorUsername != null ? actorUsername : "ANONYMOUS",
                actorRole != null ? actorRole : "NONE",
                action,
                resourceType,
                resourceId,
                result,
                ipAddress,
                userAgent,
                details
        );

        AuditLog saved = auditLogRepository.save(entry);
        log.info("AUDIT_TRAIL: [Action={}] [Actor={}/{}] [Resource={}:{}] [Result={}]",
                action, actorUsername, actorRole, resourceType, resourceId, result);

        return saved;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public AuditLog recordSecurityEvent(String actorUsername, String actorRole, String action,
                                        String resourceType, String resourceId, String result, String details) {
        return recordEvent(actorUsername, actorRole, action, resourceType, resourceId, result, details);
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponse> getAllLogs() {
        return auditLogRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(AuditLogResponse::new)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponse> getLogsByActor(String actorUsername) {
        return auditLogRepository.findByActorUsernameOrderByCreatedAtDesc(actorUsername)
                .stream()
                .map(AuditLogResponse::new)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponse> getLogsByAction(String action) {
        return auditLogRepository.findByActionOrderByCreatedAtDesc(action)
                .stream()
                .map(AuditLogResponse::new)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponse> getLogsByResourceId(String resourceId) {
        return auditLogRepository.findByResourceIdOrderByCreatedAtDesc(resourceId)
                .stream()
                .map(AuditLogResponse::new)
                .toList();
    }

    private String resolveClientIp() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                String xForwardedFor = request.getHeader("X-Forwarded-For");
                if (xForwardedFor != null && !xForwardedFor.isBlank()) {
                    return xForwardedFor.split(",")[0].trim();
                }
                return request.getRemoteAddr();
            }
        } catch (Exception ignored) {}
        return "127.0.0.1";
    }

    private String resolveUserAgent() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                String ua = request.getHeader("User-Agent");
                if (ua != null) {
                    return ua.length() > 250 ? ua.substring(0, 250) : ua;
                }
            }
        } catch (Exception ignored) {}
        return "Unknown";
    }
}
