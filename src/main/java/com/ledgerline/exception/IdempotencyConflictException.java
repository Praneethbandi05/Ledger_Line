package com.ledgerline.exception;

import org.springframework.http.HttpStatus;

public class IdempotencyConflictException extends LedgerLineException {

    public IdempotencyConflictException(String message) {
        super(message, HttpStatus.CONFLICT);
    }
}
