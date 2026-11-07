package com.ledgerline.dto;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class ErrorResponse {
    private boolean success;
    private int status;
    private String error;
    private String message;
    private String path;
    private Instant timestamp;
    private List<ValidationErrorItem> validationErrors;

    public ErrorResponse() {
        this.success = false;
        this.timestamp = Instant.now();
        this.validationErrors = new ArrayList<>();
    }

    public ErrorResponse(int status, String error, String message, String path) {
        this.success = false;
        this.status = status;
        this.error = error;
        this.message = message;
        this.path = path;
        this.timestamp = Instant.now();
        this.validationErrors = new ArrayList<>();
    }

    public ErrorResponse(int status, String error, String message, String path, List<ValidationErrorItem> validationErrors) {
        this.success = false;
        this.status = status;
        this.error = error;
        this.message = message;
        this.path = path;
        this.timestamp = Instant.now();
        this.validationErrors = validationErrors != null ? validationErrors : new ArrayList<>();
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public int getStatus() {
        return status;
    }

    public void setStatus(int status) {
        this.status = status;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }

    public List<ValidationErrorItem> getValidationErrors() {
        return validationErrors;
    }

    public void setValidationErrors(List<ValidationErrorItem> validationErrors) {
        this.validationErrors = validationErrors;
    }
}
