package com.ledgerline.controller;

import com.ledgerline.dto.ApiResponse;
import com.ledgerline.dto.transaction.DepositRequest;
import com.ledgerline.dto.transaction.LedgerEntryResponse;
import com.ledgerline.dto.transaction.TransactionResponse;
import com.ledgerline.dto.transaction.TransferRequest;
import com.ledgerline.dto.transaction.WithdrawalRequest;
import com.ledgerline.service.TransactionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/transactions")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @PostMapping("/deposit")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN', 'AUDITOR')")
    public ResponseEntity<ApiResponse<TransactionResponse>> deposit(@Valid @RequestBody DepositRequest request) {
        TransactionResponse response = transactionService.deposit(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Deposit completed successfully", response));
    }

    @PostMapping("/withdraw")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN', 'AUDITOR')")
    public ResponseEntity<ApiResponse<TransactionResponse>> withdraw(@Valid @RequestBody WithdrawalRequest request) {
        TransactionResponse response = transactionService.withdraw(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Withdrawal completed successfully", response));
    }

    @PostMapping("/transfer")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN', 'AUDITOR')")
    public ResponseEntity<ApiResponse<TransactionResponse>> transfer(@Valid @RequestBody TransferRequest request) {
        TransactionResponse response = transactionService.transfer(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Transfer completed successfully", response));
    }

    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<TransactionResponse>>> getMyTransactions() {
        List<TransactionResponse> transactions = transactionService.getMyTransactions();
        return ResponseEntity.ok(ApiResponse.success("Transaction history retrieved", transactions));
    }

    @GetMapping("/account/{accountId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN', 'AUDITOR')")
    public ResponseEntity<ApiResponse<List<TransactionResponse>>> getAccountTransactions(@PathVariable Long accountId) {
        List<TransactionResponse> transactions = transactionService.getAccountTransactions(accountId);
        return ResponseEntity.ok(ApiResponse.success("Account transactions retrieved", transactions));
    }

    @GetMapping("/{reference}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN', 'AUDITOR')")
    public ResponseEntity<ApiResponse<TransactionResponse>> getTransactionByReference(@PathVariable String reference) {
        TransactionResponse transaction = transactionService.getTransactionByReference(reference);
        return ResponseEntity.ok(ApiResponse.success("Transaction retrieved", transaction));
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR')")
    public ResponseEntity<ApiResponse<List<TransactionResponse>>> getAllTransactions() {
        List<TransactionResponse> transactions = transactionService.getAllTransactionsForAuditorOrAdmin();
        return ResponseEntity.ok(ApiResponse.success("All transactions retrieved", transactions));
    }

    @GetMapping("/ledger")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR')")
    public ResponseEntity<ApiResponse<List<LedgerEntryResponse>>> getLedgerEntries() {
        List<LedgerEntryResponse> entries = transactionService.getAllLedgerEntriesForAuditorOrAdmin();
        return ResponseEntity.ok(ApiResponse.success("Complete double-entry ledger entries retrieved", entries));
    }
}
