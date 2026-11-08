package com.ledgerline.controller;

import com.ledgerline.dto.ApiResponse;
import com.ledgerline.dto.audit.AuditLogResponse;
import com.ledgerline.dto.common.PaginatedResponse;
import com.ledgerline.service.AuditService;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/audit")
public class AuditController {

    private final AuditService auditService;

    public AuditController(AuditService auditService) {
        this.auditService = auditService;
    }

    @GetMapping("/logs")
    @PreAuthorize("hasAnyRole('AUDITOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<?>> getAuditLogs(
            @RequestParam(required = false) String actor,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String resourceId,
            @RequestParam(required = false) Integer page,
            @RequestParam(defaultValue = "20") int size) {

        if (page != null) {
            Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, Math.min(100, size)));
            PaginatedResponse<AuditLogResponse> paginated = auditService.getLogsPaginatedWithFilters(actor, action, resourceId, pageable);
            return ResponseEntity.ok(ApiResponse.success("Audit trail logs retrieved (paginated)", paginated));
        }

        if (actor != null && !actor.isBlank()) {
            return ResponseEntity.ok(ApiResponse.success("Audit logs for actor retrieved", auditService.getLogsByActor(actor.trim())));
        }
        if (action != null && !action.isBlank()) {
            return ResponseEntity.ok(ApiResponse.success("Audit logs for action retrieved", auditService.getLogsByAction(action.trim())));
        }
        if (resourceId != null && !resourceId.isBlank()) {
            return ResponseEntity.ok(ApiResponse.success("Audit logs for resource retrieved", auditService.getLogsByResourceId(resourceId.trim())));
        }

        List<AuditLogResponse> logs = auditService.getAllLogs();
        return ResponseEntity.ok(ApiResponse.success("Audit trail logs retrieved", logs));
    }

    @GetMapping("/logs/actor/{username}")
    @PreAuthorize("hasAnyRole('AUDITOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<AuditLogResponse>>> getLogsByActor(@PathVariable String username) {
        List<AuditLogResponse> logs = auditService.getLogsByActor(username);
        return ResponseEntity.ok(ApiResponse.success("Audit logs for actor retrieved", logs));
    }

    @GetMapping("/logs/action/{action}")
    @PreAuthorize("hasAnyRole('AUDITOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<AuditLogResponse>>> getLogsByAction(@PathVariable String action) {
        List<AuditLogResponse> logs = auditService.getLogsByAction(action);
        return ResponseEntity.ok(ApiResponse.success("Audit logs for action retrieved", logs));
    }

    @GetMapping("/logs/resource/{resourceId}")
    @PreAuthorize("hasAnyRole('AUDITOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<AuditLogResponse>>> getLogsByResource(@PathVariable String resourceId) {
        List<AuditLogResponse> logs = auditService.getLogsByResourceId(resourceId);
        return ResponseEntity.ok(ApiResponse.success("Audit logs for resource retrieved", logs));
    }
}
