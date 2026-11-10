package com.ledgerline.controller;

import com.ledgerline.dto.ApiResponse;
import com.ledgerline.dto.account.AccountResponse;
import com.ledgerline.dto.account.CreateAccountRequest;
import com.ledgerline.service.AccountService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/accounts")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<AccountResponse>>> getMyAccounts() {
        List<AccountResponse> accounts = accountService.getMyAccounts();
        return ResponseEntity.ok(ApiResponse.success("Accounts retrieved successfully", accounts));
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR')")
    public ResponseEntity<ApiResponse<List<AccountResponse>>> getAllAccounts() {
        List<AccountResponse> accounts = accountService.getAllAccountsForAuditorOrAdmin();
        return ResponseEntity.ok(ApiResponse.success("All system accounts retrieved", accounts));
    }

    @GetMapping("/{accountId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN', 'AUDITOR')")
    public ResponseEntity<ApiResponse<AccountResponse>> getAccountById(@PathVariable Long accountId) {
        AccountResponse account = accountService.getAccountById(accountId);
        return ResponseEntity.ok(ApiResponse.success("Account details retrieved", account));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
    public ResponseEntity<ApiResponse<AccountResponse>> createAccount(@Valid @RequestBody CreateAccountRequest request) {
        AccountResponse account = accountService.createAccount(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Account request processed successfully", account));
    }

    @PutMapping("/{accountId}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AccountResponse>> approveAccount(@PathVariable Long accountId) {
        AccountResponse account = accountService.approveAccount(accountId);
        return ResponseEntity.ok(ApiResponse.success("Account approved and activated successfully", account));
    }

    @PutMapping("/{accountId}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AccountResponse>> rejectAccount(@PathVariable Long accountId) {
        AccountResponse account = accountService.rejectAccount(accountId);
        return ResponseEntity.ok(ApiResponse.success("Account request rejected", account));
    }

    @PostMapping("/{accountId}/financial-operation-check")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN', 'AUDITOR')")
    public ResponseEntity<ApiResponse<AccountResponse>> testFinancialOperationCheck(@PathVariable Long accountId) {
        AccountResponse account = accountService.performFinancialOperationCheck(accountId);
        return ResponseEntity.ok(ApiResponse.success("Financial operation authorized", account));
    }
}
