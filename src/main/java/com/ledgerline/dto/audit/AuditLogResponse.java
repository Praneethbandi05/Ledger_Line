package com.ledgerline.dto.audit;

import com.ledgerline.entity.AuditLog;

import java.time.Instant;

public class AuditLogResponse {

    private Long id;
    private String actorUsername;
    private String actorRole;
    private String action;
    private String resourceType;
    private String resourceId;
    private String result;
    private String ipAddress;
    private String userAgent;
    private String details;
    private Instant createdAt;

    public AuditLogResponse() {}

    public AuditLogResponse(AuditLog log) {
        this.id = log.getId();
        this.actorUsername = log.getActorUsername();
        this.actorRole = log.getActorRole();
        this.action = log.getAction();
        this.resourceType = log.getResourceType();
        this.resourceId = log.getResourceId();
        this.result = log.getResult();
        this.ipAddress = log.getIpAddress();
        this.userAgent = log.getUserAgent();
        this.details = log.getDetails();
        this.createdAt = log.getCreatedAt();
    }

    public Long getId() {
        return id;
    }

    public String getActorUsername() {
        return actorUsername;
    }

    public String getActorRole() {
        return actorRole;
    }

    public String getAction() {
        return action;
    }

    public String getResourceType() {
        return resourceType;
    }

    public String getResourceId() {
        return resourceId;
    }

    public String getResult() {
        return result;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public String getDetails() {
        return details;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
