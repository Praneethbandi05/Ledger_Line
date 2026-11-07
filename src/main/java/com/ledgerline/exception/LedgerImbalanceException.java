package com.ledgerline.exception;

import org.springframework.http.HttpStatus;

public class LedgerImbalanceException extends LedgerLineException {
    public LedgerImbalanceException(String message) {
        super(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
