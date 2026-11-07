package com.ledgerline.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.Immutable;

import java.time.Instant;

@Entity
@Table(name = "audit_logs")
@Immutable
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "actor_username", nullable = false, length = 50, updatable = false)
    private String actorUsername;

    @Column(name = "actor_role", nullable = false, length = 20, updatable = false)
    private String actorRole;

    @Column(name = "action", nullable = false, length = 50, updatable = false)
    private String action;

    @Column(name = "resource_type", length = 50, updatable = false)
    private String resourceType;

    @Column(name = "resource_id", length = 100, updatable = false)
    private String resourceId;

    @Column(name = "result", nullable = false, length = 20, updatable = false)
    private String result;

    @Column(name = "ip_address", length = 45, updatable = false)
    private String ipAddress;

    @Column(name = "user_agent", length = 255, updatable = false)
    private String userAgent;

    @Column(name = "details", columnDefinition = "TEXT", updatable = false)
    private String details;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public AuditLog() {}

    public AuditLog(String actorUsername, String actorRole, String action,
                    String resourceType, String resourceId, String result,
                    String ipAddress, String userAgent, String details) {
        this.actorUsername = actorUsername;
        this.actorRole = actorRole;
        this.action = action;
        this.resourceType = resourceType;
        this.resourceId = resourceId;
        this.result = result;
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
        this.details = details;
        this.createdAt = Instant.now();
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
