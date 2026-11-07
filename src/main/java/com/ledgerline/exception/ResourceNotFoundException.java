package com.ledgerline.exception;

import org.springframework.http.HttpStatus;

public class ResourceNotFoundException extends LedgerLineException {
    public ResourceNotFoundException(String message) {
        super(message, HttpStatus.NOT_FOUND);
    }
}
