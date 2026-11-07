package com.ledgerline.exception;

import org.springframework.http.HttpStatus;

public class LedgerLineException extends RuntimeException {
    private final HttpStatus status;

    public LedgerLineException(String message) {
        super(message);
        this.status = HttpStatus.BAD_REQUEST;
    }

    public LedgerLineException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public LedgerLineException(String message, Throwable cause, HttpStatus status) {
        super(message, cause);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
