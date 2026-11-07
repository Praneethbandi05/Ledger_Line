package com.ledgerline.controller;

import com.ledgerline.dto.ApiResponse;
import com.ledgerline.dto.audit.AuditLogResponse;
import com.ledgerline.service.AuditService;
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
    public ResponseEntity<ApiResponse<List<AuditLogResponse>>> getAllAuditLogs() {
        List<AuditLogResponse> logs = auditService.getAllLogs();
        return ResponseEntity.ok(ApiResponse.success("Audit trail logs retrieved", logs));
    }

    @GetMapping("/logs/actor/{username}")
    @PreAuthorize("hasAnyRole('AUDITOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<AuditLogResponse>>> getLogsByActor(@PathVariable String username) {
        List<AuditLogResponse> logs = auditService.getLogsByActor(username);
        return ResponseEntity.ok(ApiResponse.success("Audit logs for actor retrieved", logs));
    }

    @GetMapping("/logs/resource/{resourceId}")
    @PreAuthorize("hasAnyRole('AUDITOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<AuditLogResponse>>> getLogsByResource(@PathVariable String resourceId) {
        List<AuditLogResponse> logs = auditService.getLogsByResourceId(resourceId);
        return ResponseEntity.ok(ApiResponse.success("Audit logs for resource retrieved", logs));
    }
}
