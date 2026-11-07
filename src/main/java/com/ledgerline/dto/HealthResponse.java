package com.ledgerline.dto;

import java.time.Instant;
import java.util.Map;

public class HealthResponse {
    private String status;
    private String application;
    private Instant timestamp;
    private Map<String, Object> components;

    public HealthResponse() {
        this.timestamp = Instant.now();
    }

    public HealthResponse(String status, String application, Map<String, Object> components) {
        this.status = status;
        this.application = application;
        this.components = components;
        this.timestamp = Instant.now();
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getApplication() {
        return application;
    }

    public void setApplication(String application) {
        this.application = application;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }

    public Map<String, Object> getComponents() {
        return components;
    }

    public void setComponents(Map<String, Object> components) {
        this.components = components;
    }
}
