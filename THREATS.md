# Threat Model — Balance Vault Security Verification

**Project:** Balance Vault — Institutional Financial Ledger Platform
**Version:** 1.0.0

This document identifies 19 threat categories relevant to a financial transaction platform, describes the attack scenario for each, details the implemented mitigation, and links to the automated test that verifies it.

---

## Threat Matrix

| ID            | Category                              | Severity     | Mitigation Summary                                                              | Verified By                                                        |
|---------------|---------------------------------------|:------------:|---------------------------------------------------------------------------------|--------------------------------------------------------------------|
| THREAT-01     | IDOR — Account Access                 | **Critical** | `AccountOwnershipValidator` checks JWT principal against account owner.         | `AuthorizationIntegrationTest#shouldPreventCustomerFromAccessingAnotherCustomerAccount` |
| THREAT-02     | Privilege Escalation via Registration | **High**     | `RegisterRequest` DTO has no role field; service always assigns `CUSTOMER`.     | `AuthenticationIntegrationTest#shouldRegisterCustomerSuccessfully` |
| THREAT-03     | Function-Level Authorization Bypass   | **High**     | `@PreAuthorize("hasRole('ADMIN')")` on admin controller; URL filter chain.      | `AuthorizationIntegrationTest#shouldPreventCustomerFromAccessingAdminApis` |
| THREAT-04     | Auditor Write Access Violation        | **High**     | `validateAccountWriteAccess()` blocks auditors from financial operations.       | `AuthorizationIntegrationTest#shouldPreventAuditorFromExecutingFinancialOperations` |
| THREAT-05     | Token Replay After Logout             | **Medium**   | SHA-256 token hash stored in `token_blacklist`; checked on every request.       | `AuthenticationIntegrationTest#shouldInvalidateTokenOnLogout` |
| THREAT-06     | JWT Tampering                         | **High**     | HMAC-SHA256 signature validation; tampered tokens return `401 Unauthorized`.   | `AuthenticationIntegrationTest#shouldRejectInvalidOrTamperedToken` |
| THREAT-07     | Plaintext Password Storage            | **Critical** | BCrypt hashing with individual salts; `@JsonIgnore` on password field.          | `AuthenticationIntegrationTest#shouldRegisterCustomerSuccessfully` |
| THREAT-08     | Overdraft / Negative Balance          | **Critical** | Service-layer balance check; DB constraint `chk_account_balance_non_negative`. | `FinancialOperationsIntegrationTest#shouldRejectWithdrawalWhenBalanceIsInsufficient` |
| THREAT-09     | Precision Exploitation                | **High**     | `BigDecimal` scale 2, HALF_EVEN rounding; sub-cent amounts rejected.           | `DoubleEntryLedgerEngineTest#shouldRejectZeroOrNegativeAmounts` |
| THREAT-10     | Transfer Deadlock                     | **High**     | Locks acquired in ascending PK order, eliminating circular waits.              | `FinancialOperationsIntegrationTest#shouldTransferFundsBetweenAccounts` |
| THREAT-11     | Unbalanced Ledger / Book Drift        | **Critical** | `DoubleEntryLedgerEngine` validates Σ(Debits) = Σ(Credits) before commit.     | `DoubleEntryLedgerEngineTest#shouldThrowWhenDebitsDoNotEqualCredits` |
| THREAT-12     | IDOR — Money Movement                 | **Critical** | `validateAccountWriteAccess()` checks JWT principal against source account.    | `FinancialOperationsIntegrationTest#shouldPreventCustomerFromWithdrawingFromAnotherCustomerAccount` |
| THREAT-13     | Duplicate Execution / Replay Attack   | **Critical** | Persistent idempotency engine with SHA-256 payload hash; `409` on tamper.     | `IdempotencyIntegrationTest#shouldReplayDepositWithoutDoubleCredit` |
| THREAT-14     | Concurrent Overdraft Race Condition   | **Critical** | Pessimistic row locking (`SELECT ... FOR UPDATE`) synchronizes concurrent withdrawals. | `ConcurrencyStressIntegrationTest#testConcurrentWithdrawalsPreventOverdraft` |
| THREAT-15     | Audit Record Tampering                | **High**     | `audit_logs` marked `@Immutable`; repository blocks delete operations.         | `AuditTrailIntegrationTest#shouldEnforceAuditTrailImmutability` |
| THREAT-16     | Ledger Entry Tampering                | **Critical** | `ledger_entries` marked `@Immutable`; delete throws `UnsupportedOperationException`. | `DoubleEntryLedgerIntegrationTest#shouldPreventDeletionOfHistoricalLedgerEntries` |
| THREAT-17     | Credential Leakage in Audit Logs      | **Critical** | `AuditService` never logs passwords or tokens; sanitized metadata only.        | `AuditTrailIntegrationTest#shouldNeverContainSensitiveCredentialsInAuditLogs` |
| THREAT-18     | Audit Log Access by Customers         | **High**     | `@PreAuthorize("hasAnyRole('AUDITOR', 'ADMIN')")` on audit endpoints.          | `AuditTrailIntegrationTest#shouldPreventCustomerFromViewingAuditLogs` |
| THREAT-19     | IDOR — Account Statements             | **High**     | `validateAccountReadAccess()` validates JWT principal against statement owner. | `AuditTrailIntegrationTest#shouldPreventCustomerFromViewingAnotherCustomerStatement` |

---

## Detailed Threat Descriptions

### THREAT-01: Insecure Direct Object Reference on Account Access

**Attack:** An authenticated customer observes account IDs from their own requests and calls `GET /api/v1/accounts/{targetAccountId}` to read another customer's balance or statement.

**Mitigation:**
- The backend never trusts customer-supplied IDs for ownership decisions.
- Identity is derived exclusively from `SecurityContextHolder.getContext().getAuthentication()`.
- `AccountOwnershipValidator.validateAccountReadAccess(account)` verifies that the authenticated user is an admin, auditor, or the account's registered owner.
- Unauthorized attempts return `403 Forbidden`.

---

### THREAT-02: Privilege Escalation via Registration

**Attack:** A malicious user sends `"role": "ADMIN"` in the registration request body to elevate their own access level.

**Mitigation:**
- The `RegisterRequest` DTO contains no `role` field.
- `AuthService.register()` explicitly assigns `Role.CUSTOMER` unconditionally during entity construction.
- Any role field in the request body is silently ignored.

---

### THREAT-03: Function-Level Authorization Bypass

**Attack:** A regular customer navigates directly to administrative endpoints such as `GET /api/v1/admin/users` to inspect other users or modify user statuses.

**Mitigation:**
- `@EnableMethodSecurity(prePostEnabled = true)` is configured on the security configuration class.
- `AdminController` is annotated with `@PreAuthorize("hasRole('ADMIN')")`.
- The HTTP security filter chain enforces `.requestMatchers("/api/v1/admin/**").hasRole("ADMIN")`.
- Unauthorized access returns a RFC-7807 formatted `403 Forbidden` through a custom access denied handler.

---

### THREAT-04: Auditor Write Access Violation

**Attack:** An internal user with `AUDITOR` role attempts to trigger a deposit, withdrawal, or transfer.

**Mitigation:**
- `AccountOwnershipValidator.validateAccountWriteAccess(account)` calls `securityContextHelper.isAuditor()`.
- If the principal holds the AUDITOR role, the write operation is rejected with `403 Forbidden` before any financial logic executes.
- Auditors are restricted to read-only endpoints only.

---

### THREAT-05: Stateless Token Replay After Logout

**Attack:** A user logs out on a shared device. Someone retrieves the JWT from browser storage or proxy logs and replays it to access their account.

**Mitigation:**
- A persistent `token_blacklist` table stores SHA-256 hashes of revoked tokens upon logout.
- Raw tokens are never stored; only the hash is persisted along with its expiration timestamp.
- `JwtAuthenticationFilter` checks every incoming token against `tokenBlacklistService.isTokenBlacklisted()` before processing the request.
- Blacklisted tokens are rejected with `401 Unauthorized`.

---

### THREAT-06: JWT Tampering and Algorithm Confusion

**Attack:** An attacker modifies the JWT payload (e.g., changing the username or role) or the signature to forge authentication.

**Mitigation:**
- JJWT 0.12.6 validates the HMAC-SHA256 signature using the configured secret key on every request.
- Any modification to the token header, payload, or signature invalidates the hash and returns `401 Unauthorized`.

---

### THREAT-07: Plaintext Password Storage

**Attack:** The database is exfiltrated or leaked. If passwords are stored in plaintext, all user credentials are immediately compromised.

**Mitigation:**
- All passwords are hashed with BCrypt, which incorporates an individual random salt per password.
- The `password` field in the `User` entity is annotated `@JsonIgnore`, preventing it from appearing in any serialized API response or log statement.

---

### THREAT-08: Overdraft and Negative Balance Exploitation

**Attack:** A customer submits a withdrawal or transfer request for an amount exceeding their current balance.

**Mitigation:**
- `DoubleEntryLedgerEngine` verifies `account.getBalance() >= requestedAmount` before modifying any state.
- Insufficient funds throw a `422 Unprocessable Entity` with a descriptive message.
- As a second line of defense, the database enforces a `CHECK (balance >= 0)` constraint on the `accounts` table, which causes any balance update that would produce a negative value to fail at the persistence layer.

---

### THREAT-09: Floating-Point Precision Exploitation

**Attack:** An attacker crafts sub-cent amounts or relies on floating-point rounding to gain fractional currency over many transactions.

**Mitigation:**
- All financial values use `BigDecimal` with scale 2 and `RoundingMode.HALF_EVEN` throughout the codebase.
- The use of `double` or `float` for monetary values is prohibited.
- Amounts below 0.01 are rejected before processing.

---

### THREAT-10: Deadlock on Bidirectional Transfers

**Attack:** Alice transfers to Bob while Bob simultaneously transfers to Alice. Standard lock acquisition order can produce a circular wait (deadlock).

**Mitigation:**
- `TransactionService` acquires pessimistic locks in deterministic ascending primary key order: first `min(sourceId, destinationId)`, then `max(sourceId, destinationId)`.
- This ordering eliminates all circular waits regardless of transfer direction.
- Verified under concurrent load in `ConcurrencyStressIntegrationTest`.

---

### THREAT-11: Unbalanced Books / Ledger Invariant Drift

**Attack:** A code defect or malicious modification causes one account to be credited without a matching debit, or the debit and credit amounts differ.

**Mitigation:**
- `DoubleEntryLedgerEngine.validateDoubleEntryBalance()` verifies that Σ(Debits) equals Σ(Credits) equals the transaction amount before any database write.
- All balance updates, ledger entries, and audit log insertions occur within a single `@Transactional` boundary. Any failure rolls back all changes atomically.

---

### THREAT-12: IDOR on Money Movement Operations

**Attack:** An attacker supplies another customer's account number as the source account in a withdrawal or transfer to drain the victim's balance.

**Mitigation:**
- `AccountOwnershipValidator.validateAccountWriteAccess(account)` checks the authenticated JWT principal against the source account's registered owner.
- Unauthorized attempts return `403 Forbidden` before any ledger operation begins.

---

### THREAT-13: Duplicate Financial Execution and Replay Attacks

**Attack:** A network retry, browser double-submit, or deliberate replay sends the same money movement request twice with the same `Idempotency-Key`.

**Mitigation:**
- The `Idempotency-Key` header is mandatory on all deposit, withdrawal, and transfer endpoints.
- The key and a SHA-256 hash of the canonical request payload are persisted in the `idempotency_keys` table with a unique constraint.
- Exact replays return the original response without re-executing.
- Replays with a modified payload but the same key return `409 Conflict`, detecting tampered requests.

---

### THREAT-14: Concurrent Overdraft Race Condition

**Attack:** An attacker submits 10 simultaneous withdrawal requests for $100 each against a $500 balance, hoping that balance checks pass in parallel before any update commits.

**Mitigation:**
- `SELECT ... FOR UPDATE` pessimistic locks are acquired on account rows before reading balances.
- This serializes concurrent requests at the database engine level, ensuring each transaction sees the post-update balance from all prior transactions.
- Stress testing confirms exactly 5 withdrawals succeed and 5 fail with `422 Insufficient funds`; balance never drops below $0.00.

---

### THREAT-15: Audit Record Tampering

**Attack:** An administrator or attacker with database access attempts to delete or modify audit records to conceal unauthorized transactions or access events.

**Mitigation:**
- The `AuditLog` entity is annotated `@org.hibernate.annotations.Immutable` with all column mappings marked `updatable = false`.
- `AuditLogRepository` overrides all delete methods to throw `UnsupportedOperationException`, blocking deletion at the application layer.
- Audit records are accessible only to users with `AUDITOR` or `ADMIN` roles.

---

### THREAT-16: Historical Ledger Entry Tampering

**Attack:** An attacker attempts to delete or modify double-entry ledger records to conceal embezzlement or balance manipulation.

**Mitigation:**
- The `LedgerEntry` entity is annotated `@org.hibernate.annotations.Immutable` with all columns marked `updatable = false`.
- `LedgerEntryRepository` overrides delete methods to throw `UnsupportedOperationException`.
- Each ledger record is linked to its parent transaction and cannot be inserted without passing the `validateDoubleEntryBalance` invariant check.

---

### THREAT-17: Credential and Token Leakage in Audit Logs

**Attack:** Passwords or JWT tokens are accidentally written to audit logs, exposing them to internal users with audit read access.

**Mitigation:**
- `AuditService` logs only sanitized metadata: action type, actor username, resource identifier, and outcome.
- Passwords and Authorization header values are never passed to or recorded by the audit service.
- Automated tests verify that audit records for login events contain no password or token values.

---

### THREAT-18: Customer Access to Audit Logs

**Attack:** A customer calls `GET /api/v1/audit/logs` to view platform-wide security events or activity from other users.

**Mitigation:**
- The audit endpoint is annotated `@PreAuthorize("hasAnyRole('AUDITOR', 'ADMIN')")`.
- Customer requests return `403 Forbidden` before any query executes.

---

### THREAT-19: IDOR on Account Statements

**Attack:** A customer calls `GET /api/v1/transactions/statement/{accountId}` with another user's account ID to download their transaction history.

**Mitigation:**
- `AccountOwnershipValidator.validateAccountReadAccess(account)` verifies the requesting user is the account owner, an admin, or an auditor.
- Unauthorized requests return `403 Forbidden`.

---

## Acknowledged Limitations

The following risks are understood and documented for future hardening:

**Token blacklist scalability.** The current implementation queries PostgreSQL on every authenticated request to check the blacklist. Under sustained high traffic, this adds database load. A production deployment serving many concurrent users should cache blacklisted tokens in an in-memory store such as Redis with a TTL matching the token expiration.

**Login rate limiting.** The platform does not currently enforce rate limits or account lockout after repeated failed login attempts. A brute-force attack can make unlimited password guesses. A production deployment should apply IP-based and username-based rate limiting, with temporary account lockout after a configurable number of consecutive failures.
