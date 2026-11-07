# THREATS.md – Threat Model & Security Verification Matrix

Project: **LEDGERLINE – Money Movement With a Ledger You Can Prove**  
Assessment: **Snovasys 2026 Fresher Hiring Assessment**  
Version: 1.0.0 (Post Phase 2: Authentication & Authorisation)

---

## Threat Matrix & Mitigation Index

| Threat ID | Threat Category | Severity | Attack Scenario | Mitigation Strategy | Verification Test |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **THREAT-01** | Broken Object Level Authorization (IDOR) | **Critical** | Customer Alice accesses Bob's account (`GET /api/v1/accounts/{bobAccountId}`) using her own valid JWT. | `AccountOwnershipValidator` validates in domain service that `account.getUser().getId().equals(currentUserId)`. Returns `403 Forbidden`. | [`AuthorizationIntegrationTest#shouldPreventCustomerFromAccessingAnotherCustomerAccount`](file:///d:/Final%20Project/LegderLine/src/test/java/com/ledgerline/security/AuthorizationIntegrationTest.java#L87-L99) |
| **THREAT-02** | Privilege Escalation (Registration) | **High** | Attacker passes `"role": "ADMIN"` in registration payload. | `RegisterRequest` DTO has no role field. `AuthService` explicitly enforces `Role.CUSTOMER`. | [`AuthenticationIntegrationTest#shouldRegisterCustomerSuccessfully`](file:///d:/Final%20Project/LegderLine/src/test/java/com/ledgerline/security/AuthenticationIntegrationTest.java#L69-L93) |
| **THREAT-03** | Broken Function Level Authorization | **High** | Customer attempts to invoke `/api/v1/admin/**` endpoints. | Spring Security `@PreAuthorize("hasRole('ADMIN')")` and URL filter chain matchers reject non-admin users with `403 Forbidden`. | [`AuthorizationIntegrationTest#shouldPreventCustomerFromAccessingAdminApis`](file:///d:/Final%20Project/LegderLine/src/test/java/com/ledgerline/security/AuthorizationIntegrationTest.java#L111-L121) |
| **THREAT-04** | Auditor Role Boundary Violation | **High** | Auditor attempts money movement or account balance modification. | `AccountOwnershipValidator.validateAccountWriteAccess()` blocks `AUDITOR` from write operations with `403 Forbidden`. | [`AuthorizationIntegrationTest#shouldPreventAuditorFromExecutingFinancialOperations`](file:///d:/Final%20Project/LegderLine/src/test/java/com/ledgerline/security/AuthorizationIntegrationTest.java#L140-L152) |
| **THREAT-05** | Token Replay After Logout | **Medium** | Stolen or intercepted JWT used after customer logs out. | Token SHA-256 hash stored in `token_blacklist` table upon logout. `JwtAuthenticationFilter` rejects blacklisted tokens with `401 Unauthorized`. | [`AuthenticationIntegrationTest#shouldInvalidateTokenOnLogout`](file:///d:/Final%20Project/LegderLine/src/test/java/com/ledgerline/security/AuthenticationIntegrationTest.java#L125-L151) |
| **THREAT-06** | JWT Tampering & Algorithm Confusion | **High** | Attacker modifies JWT claims or signature. | JJWT 0.12.6 validates HMAC-SHA256 signature using secret key. Tampered tokens fail validation and return `401 Unauthorized`. | [`AuthenticationIntegrationTest#shouldRejectInvalidOrTamperedToken`](file:///d:/Final%20Project/LegderLine/src/test/java/com/ledgerline/security/AuthenticationIntegrationTest.java#L115-L123) |
| **THREAT-07** | Plaintext Password Leakage | **Critical** | Database compromised or leaked via backups. | Passwords hashed using BCrypt with individual salts. Password field marked `@JsonIgnore` and never exposed in responses or logs. | [`AuthenticationIntegrationTest#shouldRegisterCustomerSuccessfully`](file:///d:/Final%20Project/LegderLine/src/test/java/com/ledgerline/security/AuthenticationIntegrationTest.java#L88-L92) |

---

## Detailed Threat Scenarios & Mitigations

### 1. THREAT-01: Insecure Direct Object Reference (IDOR) on Account Access
- **Attack Vector:** An authenticated customer intercepts or inspects application requests, observes incremental or guessed account IDs, and calls `GET /api/v1/accounts/{targetAccountId}` to inspect balances or account statements of another customer.
- **Vulnerability Root Cause:** Systems relying solely on authentication filters without domain-level ownership checks allow any authenticated user to query any object ID.
- **Implemented Mitigation:**
  1. The backend **never** relies on customer IDs provided by the frontend.
  2. The authenticated user identity is derived strictly from `SecurityContextHolder.getContext().getAuthentication()`.
  3. `AccountOwnershipValidator.validateAccountReadAccess(account)` verifies that either:
     - The user holds `ADMIN` or `AUDITOR` permissions, OR
     - `account.getUser().getId().equals(currentUserId)`.
  4. If ownership does not match, an `AccessDeniedException` is thrown, returning `403 Forbidden`.
- **Automated Test:** [`AuthorizationIntegrationTest#shouldPreventCustomerFromAccessingAnotherCustomerAccount`](file:///d:/Final%20Project/LegderLine/src/test/java/com/ledgerline/security/AuthorizationIntegrationTest.java#L87-L99).

---

### 2. THREAT-02: Privilege Escalation via Registration Injection
- **Attack Vector:** A malicious actor sends a registration payload containing elevated role attributes:
  ```json
  {
    "username": "attacker",
    "email": "attacker@evil.com",
    "password": "Password@123",
    "fullName": "Evil Actor",
    "role": "ADMIN"
  }
  ```
- **Vulnerability Root Cause:** Mass assignment vulnerabilities in ORM entities when request bodies bind directly to entity models.
- **Implemented Mitigation:**
  1. Request payloads bind strictly to dedicated DTO `RegisterRequest`, which contains no `role` field.
  2. `AuthService.register()` explicitly assigns `Role.CUSTOMER` during `User` entity construction.
- **Automated Test:** [`AuthenticationIntegrationTest#shouldRegisterCustomerSuccessfully`](file:///d:/Final%20Project/LegderLine/src/test/java/com/ledgerline/security/AuthenticationIntegrationTest.java#L69-L93).

---

### 3. THREAT-03: Function-Level Authorization Bypass
- **Attack Vector:** A customer navigates directly to administrative endpoints (e.g. `GET /api/v1/admin/users` or `PATCH /api/v1/admin/users/{id}/status`) to inspect other users or alter user statuses.
- **Implemented Mitigation:**
  1. Configured `@EnableMethodSecurity(prePostEnabled = true)` on `SecurityConfig`.
  2. Annotated `AdminController` with `@PreAuthorize("hasRole('ADMIN')")`.
  3. Configured HTTP security filter chain: `.requestMatchers("/api/v1/admin/**").hasRole("ADMIN")`.
  4. Any unauthorized attempt triggers `CustomAccessDeniedHandler`, returning RFC-7807 formatted `403 Forbidden`.
- **Automated Test:** [`AuthorizationIntegrationTest#shouldPreventCustomerFromAccessingAdminApis`](file:///d:/Final%20Project/LegderLine/src/test/java/com/ledgerline/security/AuthorizationIntegrationTest.java#L111-L121).

---

### 4. THREAT-04: Auditor Role Boundary Violation
- **Attack Vector:** An internal user holding the `AUDITOR` role attempts to trigger money movement (deposit, withdrawal, transfer) or alter account configurations.
- **Implemented Mitigation:**
  1. `AccountOwnershipValidator.validateAccountWriteAccess(account)` inspects `securityContextHelper.isAuditor()`.
  2. If the user is an auditor, write operations are immediately rejected with `403 Forbidden`.
  3. Auditors are restricted to read-only endpoints (`/api/v1/accounts/all`, `/api/v1/accounts/{id}`).
- **Automated Test:** [`AuthorizationIntegrationTest#shouldPreventAuditorFromExecutingFinancialOperations`](file:///d:/Final%20Project/LegderLine/src/test/java/com/ledgerline/security/AuthorizationIntegrationTest.java#L140-L152).

---

### 5. THREAT-05: Stateless Token Replay Post-Logout
- **Attack Vector:** A user logs out on a public or shared computer. A subsequent user or attacker retrieves the JWT from browser storage or proxy logs and replays it.
- **Implemented Mitigation:**
  1. Implemented a persistent `token_blacklist` table in PostgreSQL.
  2. The raw JWT is never stored; instead, a SHA-256 hash of the token is recorded along with its expiration timestamp.
  3. `JwtAuthenticationFilter` checks every incoming Bearer token against `tokenBlacklistService.isTokenBlacklisted()`.
  4. Blacklisted tokens are rejected immediately, returning `401 Unauthorized`.
- **Automated Test:** [`AuthenticationIntegrationTest#shouldInvalidateTokenOnLogout`](file:///d:/Final%20Project/LegderLine/src/test/java/com/ledgerline/security/AuthenticationIntegrationTest.java#L125-L151).

---

## Honestly Documented Unresolved Risks

1. **Database-Backed Token Blacklist Throughput:**
   - *Current State:* Blacklisted token hashes are checked via SQL query `SELECT EXISTS(...) FROM token_blacklist WHERE token_hash = ?`.
   - *Risk:* In high-concurrency environments with millions of requests per second, querying PostgreSQL on every authenticated request adds database load.
   - *Future Production Mitigation:* In a distributed multi-region cluster, token blacklist checks should be cached in an in-memory Redis/Valkey cluster with TTL matching token expiration.
2. **Login Rate Limiting & Account Lockout:**
   - *Current State:* Invalid login attempts return `401 Unauthorized`.
   - *Risk:* An automated bot can attempt high-volume password guessing against usernames.
   - *Future Production Mitigation:* Implement IP-based and username-based rate limiting (e.g., Spring Security Lockout or Bucket4j token bucket) locking accounts after 5 consecutive failed attempts.

| **THREAT-08** | Negative Balance / Overdraft Exploitation | **Critical** | Customer requests withdrawal or transfer exceeding available balance (`amount > balance`). | `DoubleEntryLedgerEngine` verifies `balance >= amount`. Throws 422 Unprocessable Entity. Database check constraint `chk_account_balance_non_negative` enforces non-negative balance at the persistence layer. | [`FinancialOperationsIntegrationTest#shouldRejectWithdrawalWhenBalanceIsInsufficient`](file:///d:/Final%20Project/LegderLine/src/test/java/com/ledgerline/service/FinancialOperationsIntegrationTest.java#L131-L147) |
| **THREAT-09** | Precision & Rounding Exploitation | **High** | Attacker uses fractional currency or sub-cent amounts to inflate balances or exploit float rounding. | Financial arithmetic strictly enforced using `BigDecimal` with scale 2 and `RoundingMode.HALF_EVEN`. Float/double prohibited. Values < 0.01 rejected. | [`DoubleEntryLedgerEngineTest#shouldRejectZeroOrNegativeAmounts`](file:///d:/Final%20Project/LegderLine/src/test/java/com/ledgerline/ledger/DoubleEntryLedgerEngineTest.java#L162-L174) |
| **THREAT-10** | Concurrency Deadlocks on Cross-Transfers | **High** | Alice transfers to Bob while Bob simultaneously transfers to Alice. Unordered locking causes circular wait deadlocks. | **Deterministic Lock Ordering**: Accounts are always locked in ascending primary key ID order (`min(id1, id2)` then `max(id1, id2)`), mathematically eliminating circular waits. | [`FinancialOperationsIntegrationTest#shouldTransferFundsBetweenAccounts`](file:///d:/Final%20Project/LegderLine/src/test/java/com/ledgerline/service/FinancialOperationsIntegrationTest.java#L150-L173) |
| **THREAT-11** | Unbalanced Books / Ledger Invariant Drift | **Critical** | System updates one account without matching counterparty entry or with mismatched amounts. | Double-entry invariant engine validates $\sum \text{Debits} == \sum \text{Credits} == \text{Amount}$ before any commit. Atomic `@Transactional` boundaries roll back everything on failure. | [`DoubleEntryLedgerEngineTest#shouldThrowWhenDebitsDoNotEqualCredits`](file:///d:/Final%20Project/LegderLine/src/test/java/com/ledgerline/ledger/DoubleEntryLedgerEngineTest.java#L149-L160) |
| **THREAT-12** | IDOR on Money Movement | **Critical** | Attacker supplies another customer's account as `sourceAccountNumber` in withdrawal or transfer. | `AccountOwnershipValidator.validateAccountWriteAccess()` checks authenticated JWT principal against source account owner. Rejects with `403 Forbidden`. | [`FinancialOperationsIntegrationTest#shouldPreventCustomerFromWithdrawingFromAnotherCustomerAccount`](file:///d:/Final%20Project/LegderLine/src/test/java/com/ledgerline/service/FinancialOperationsIntegrationTest.java#L201-L215) |
| **THREAT-13** | Duplicate Financial Execution / Replay Attack | **Critical** | Network retry, malicious replay, or client double-click executes the same money movement twice. | **Persistent Idempotency Engine**: Mandatory `Idempotency-Key` header stored in PostgreSQL with unique constraint. Canonical SHA-256 hash validation returns original result on match; rejects modified payload with `409 Conflict`. | [`IdempotencyIntegrationTest#shouldReplayDepositWithoutDoubleCredit`](file:///d:/Final%20Project/LegderLine/src/test/java/com/ledgerline/service/IdempotencyIntegrationTest.java#L80-L135) |
| **THREAT-14** | Simultaneous Concurrency Race Condition / Overdraft | **Critical** | Attacker launches 10 simultaneous threads withdrawing $100 against a $500 balance to extract $1000 before balance update commits. | **Pessimistic Row Locking (`SELECT ... FOR UPDATE`)**: Synchronizes concurrent requests at the database engine level. Fresh entity hydration ensures exactly 5 succeed and 5 fail with `422 Insufficient funds`. Balance never drops below $0.00. | [`ConcurrencyStressIntegrationTest#testConcurrentWithdrawalsPreventOverdraft`](file:///d:/Final%20Project/LegderLine/src/test/java/com/ledgerline/service/ConcurrencyStressIntegrationTest.java#L71-L129) |
| **THREAT-15** | Audit Record Tampering / Repudiation | **High** | Malicious user or administrator attempts to delete or alter audit logs to conceal fraudulent activity. | **Immutability Architecture**: `audit_logs` entity marked `@org.hibernate.annotations.Immutable` with all columns `updatable = false`. `AuditLogRepository` overrides delete methods to throw `UnsupportedOperationException`. Auditor-only read endpoint. | [`AuditTrailIntegrationTest#shouldEnforceAuditTrailImmutability`](file:///d:/Final%20Project/LegderLine/src/test/java/com/ledgerline/service/AuditTrailIntegrationTest.java#L130-L150) |
