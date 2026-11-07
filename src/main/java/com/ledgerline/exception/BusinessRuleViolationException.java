package com.ledgerline.exception;

import org.springframework.http.HttpStatus;

public class BusinessRuleViolationException extends LedgerLineException {
    public BusinessRuleViolationException(String message) {
        super(message, HttpStatus.UNPROCESSABLE_ENTITY);
    }
}
