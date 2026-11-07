package com.ledgerline.exception;

import org.springframework.http.HttpStatus;

public class MissingIdempotencyKeyException extends LedgerLineException {

    public MissingIdempotencyKeyException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}
