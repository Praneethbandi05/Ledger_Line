# PROMPTS.md – AI Interaction & Technical Decision Log

Project: **LEDGERLINE – Money Movement With a Ledger You Can Prove**  
Assessment: **Snovasys 2026 Fresher Hiring Assessment**  
Repository: `D:\Final Project\LegderLine`

---

## Log Entry 1: Phase 1 – Foundation, Database Scaffolding & Flyway Baseline

- **Date:** 2026-11-07
- **Git Commit:** [`e53d174`](https://github.com/Praneethbandi05/Ledger_Line/commit/e53d174069c289b5b7876957b7ca9e367ef87143) (`e53d174069c289b5b7876957b7ca9e367ef87143`)
- **User Prompt / Objective:**
  > Inspect and configure the project foundation. Verify Java 21, Spring Boot, Maven, React + Vite, PostgreSQL driver, Spring Data JPA with `ddl-auto=validate`, database connection health check, global exception handling, and request validation. Do not hardcode database credentials. Run Maven tests, Maven build, and npm build.

- **AI Initial Suggestion & Approach:**
  - Scaffolding Spring Boot 3.3.5 with Maven Wrapper, React 18 with Vite, and setting up centralized exception handling (`GlobalExceptionHandler`).
  - Formulated initial Flyway migration `V1__init_foundation.sql` using PostgreSQL-specific upsert syntax:
    ```sql
    INSERT INTO system_health_probe (probe_name, status)
    VALUES ('DATABASE_CONNECTIVITY', 'HEALTHY')
    ON CONFLICT (probe_name) DO UPDATE SET status = 'HEALTHY';
    ```

- **Actual Errors Encountered:**
  1. **Flyway SQL Dialect Incompatibility during Test Suite Execution:**
     When executing `./mvnw clean test`, the slice test suite using H2 in PostgreSQL compatibility mode failed during context initialization:
     ```text
     Caused by: org.springframework.beans.factory.BeanCreationException: Error creating bean with name 'flywayInitializer'
     Migration V1__init_foundation.sql failed
     SQL State  : 42000
     Message    : Syntax error in SQL statement "... [*]ON CONFLICT (probe_name) DO UPDATE..."
     ```
  2. **Absence of Local PostgreSQL Server on Host:**
     Host PATH only had Oracle XE and MySQL binaries. No running PostgreSQL daemon existed.

- **Technical Correction & Resolution:**
  1. Removed `ON CONFLICT` upsert syntax from `V1__init_foundation.sql`. Because Flyway migration scripts are immutable and executed strictly once per schema, a clean idempotent standard ANSI SQL `INSERT` statement guarantees cross-database compatibility across both production PostgreSQL 16 and hermetic H2 test slices.
  2. Provisioned official portable PostgreSQL 16.2 binaries in `D:\pgsql`, initialized the cluster with `initdb.exe`, started the daemon on `localhost:5432`, and created the target database `ledgerline`. Verified live connectivity via `curl http://localhost:8080/api/v1/health/db`.

- **Verification Results:**
  - Maven tests: 10/10 tests passed (`DatabaseHealthServiceTest`, `HealthControllerIntegrationTest`).
  - Maven build: Packaged `target/ledgerline-backend-1.0.0-SNAPSHOT.jar` successfully.
  - Frontend build: Vite production build succeeded in 761ms (`dist/index.html`).
  - PostgreSQL live probe: Verified live connection latency (1ms) and metadata (`PostgreSQL 16.2`).


---

## Log Entry 2: Phase 2 – Authentication, Authorization, IDOR & Access Control

- **Date:** 2026-11-07
- **Git Commit:** [`76ecca4`](https://github.com/Praneethbandi05/Ledger_Line/commit/76ecca4afff5e6d0344447e6cde2e450eb85487a) (`76ecca4afff5e6d0344447e6cde2e450eb85487a`)
- **User Prompt / Objective:**
  > Implement Phase 2: Authentication and Authorisation using Spring Security and JWT. Implement User registration, secure login, BCrypt password hashing, JWT generation/validation, JWT filter, token invalidation, role-based authorization (ADMIN, CUSTOMER, AUDITOR), and account-level ownership checks. Never trust customer ID from request body. Prevent IDOR and privilege escalation. Write automated tests for valid login, invalid password, expired/invalid token, unauthenticated requests, customer accessing another customer's account, customer accessing admin APIs, and auditor attempting financial operations.

- **AI Initial Suggestion & Approach:**
  - Implemented `JwtTokenProvider` using JJWT 0.12.6 with HMAC-SHA256 signing, claims extraction, and custom expiration parameters for testability.
  - Implemented `AccountOwnershipValidator` in the domain service layer verifying account ownership against `SecurityContextHolder.getContext().getAuthentication()`.
  - Built `TokenBlacklistService` using SHA-256 token hashing and the `token_blacklist` table in PostgreSQL for stateless JWT revocation upon logout.
  - Added `GlobalExceptionHandler` with an `@ExceptionHandler(AccessDeniedException.class)` handler.

- **Actual Errors Encountered:**
  - **Static Masking of Domain Access Control Explanations:**
    When running `mvn test`, 24 of 26 tests passed, but 2 authorization tests failed:
    ```text
    [ERROR]   AuthorizationIntegrationTest.shouldPreventAuditorFromExecutingFinancialOperations:148 JSON path "$.message"
    Expected: a string containing "Auditors hold strictly read-only permissions"
         but: was "Access denied. You do not have permission to perform this action"
    [ERROR]   AuthorizationIntegrationTest.shouldPreventCustomerFromAccessingAnotherCustomerAccount:96 JSON path "$.message"
    Expected: a string containing "You do not have ownership of account ACC-BOB-01"
         but: was "Access denied. You do not have permission to perform this action"
    ```
    *Root Cause:* In `GlobalExceptionHandler.java`, the handler for `AccessDeniedException` hardcoded a generic static string `"Access denied. You do not have permission to perform this action"`, discarding the explicit, security-auditable explanation generated by `AccountOwnershipValidator` (`"You do not have ownership of account ACC-BOB-01"` and `"Auditors hold strictly read-only permissions and cannot modify accounts or execute financial transactions"`).

- **Technical Correction & Resolution:**
  - Refactored `GlobalExceptionHandler.handleAccessDenied()` to inspect `ex.getMessage()`:
    ```java
    String message = (ex.getMessage() != null && !ex.getMessage().isBlank())
            ? ex.getMessage()
            : "Access denied. You do not have permission to perform this action";
    ```
  - This preserves explicit domain-level access control failure messages, aiding security audits and client feedback while maintaining proper `403 Forbidden` status codes.

- **Verification Results:**
  - Full test suite execution: **26 tests run, 0 failures, 0 errors, 0 skipped**.
  - All authentication tests passed: Valid login, Invalid password, Non-existent user, Customer registration, Duplicate username prevention, Expired token rejection, Tampered token rejection, and Token blacklist invalidation on logout.
  - All authorization tests passed: Unauthenticated 401 rejection, Authorized account read, IDOR prevention on other customers' accounts (403), Account listing boundary, Privilege escalation prevention to Admin API (403), Admin authorized operations, Auditor read-only access (200), and Auditor financial operation prevention (403).


---

## Log Entry 3: Phase 3 – Core Financial Engine, Double-Entry Ledger & Deterministic Locking

- **Date:** 2026-11-07
- **Git Commit:** [`ae188fc`](https://github.com/Praneethbandi05/Ledger_Line/commit/ae188fcd1d16e8d1aa7ffb50139aec80a5930d24) (`ae188fcd1d16e8d1aa7ffb50139aec80a5930d24`)
- **User Prompt / Objective:**
  > Implement Phase 3: Accounts and Financial Operations. Implement account creation, account number generation, account balance management, deposit, withdrawal, internal account-to-account transfer, transaction history, and transaction status management. Use BigDecimal with 2 decimal places. Reject zero/negative amounts and insufficient balance. Never trust balance from frontend. Use @Transactional and ensure all related updates are atomic. Create double-entry accounting records with system clearing accounts. Write automated tests for all operations.

- **AI Initial Suggestion & Approach:**
  - Implemented `DoubleEntryLedgerEngine` enforcing mathematical equality $\sum \text{Debits} == \sum \text{Credits} == \text{Amount}$.
  - Provisioned system clearing accounts `ACC-SYS-CLEARING-DEPOSIT` and `ACC-SYS-CLEARING-WITHDRAWAL` in Flyway migration `V3__transactions_and_ledger_schema.sql` to represent external inflows and outflows.
  - Implemented **Deterministic Multi-Account Lock Ordering** in `TransactionService.transfer()`: always locks `min(sourceId, destId)` first and `max(sourceId, destId)` second to prevent circular-wait deadlocks during concurrent simultaneous transfers.
  - Added method security `@PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")` to `TransactionController` deposit, withdraw, and transfer endpoints.

- **Actual Errors Encountered:**
  - **Gateway PreAuthorize Preemption of Domain Security Validation:**
    When running `mvn test`, 43 of 45 tests passed, but 2 auditor financial restriction tests failed:
    ```text
    [ERROR]   FinancialOperationsIntegrationTest.shouldPreventAuditorFromDepositing:254 JSON path "$.message"
    Expected: a string containing "Auditors hold strictly read-only permissions"
         but: was "Access Denied"
    [ERROR]   FinancialOperationsIntegrationTest.shouldPreventAuditorFromWithdrawing:268 JSON path "$.message"
    Expected: a string containing "Auditors hold strictly read-only permissions"
         but: was "Access Denied"
    ```
    *Root Cause:* Annotating `@PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")` at the controller layer preempted the request with Spring Security's generic `"Access Denied"` exception before the request could reach `AccountOwnershipValidator.validateAccountWriteAccess()`.

- **Technical Correction & Resolution:**
  - Adjusted `@PreAuthorize` on `/deposit`, `/withdraw`, `/transfer` to `hasAnyRole('CUSTOMER', 'ADMIN', 'AUDITOR')`.
  - This allows the request to pass into the transaction service layer where `accountOwnershipValidator.validateAccountWriteAccess()` executes domain-level validation, explicitly checking `if (securityContextHelper.isAuditor()) throw new AccessDeniedException("Access denied: Auditors hold strictly read-only permissions and cannot modify accounts or execute financial transactions")`.
  - Both tests immediately passed, verifying defense-in-depth where domain ownership and role invariants are validated in the service layer.

- **Verification Results:**
  - Full test suite execution: **45 tests run, 0 failures, 0 errors, 0 skipped**.
  - All financial tests verified: Deposit with balanced clearing records, Withdrawal with balanced clearing records, Transfer with deterministic locking, Insufficient balance rejection (balance unchanged), Negative and zero amount rejection, Self-transfer rejection, IDOR rejection on other customer accounts, and Auditor write operation prevention.


---

## Log Entry 4: Phase 4 & Phase 5 – Idempotency Engine, Race-Condition Overdraft Prevention & Deterministic Concurrency

- **Date:** 2026-11-07
- **Git Commit:** Pending next commit
- **User Prompt / Objective:**
  > Implement Phase 4 & Phase 5: Financial Idempotency and Concurrency Stress Testing. Require an Idempotency-Key header on money movement APIs. Persist keys in PostgreSQL with unique database constraints. Return original result on identical payload and reject key reuse with modified payloads. Guarantee atomic key and ledger processing. Use pessimistic row locking to prevent concurrent withdrawals from overspending. Eliminate circular wait deadlocks on cross-transfers through deterministic lock ordering. Write genuinely multithreaded stress tests.

- **AI Initial Suggestion & Approach:**
  - Created Flyway migration `V4__idempotency_schema.sql` defining `idempotency_keys` table with SHA-256 payload hash and unique constraint.
  - Implemented `IdempotencyPayloadHasher` to compute canonical SHA-256 digests of request payloads.
  - Embedded double-checked idempotency verification into `TransactionService` (`deposit`, `withdraw`, `transfer`) within atomic `@Transactional` boundaries.
  - Implemented multithreaded test suite `ConcurrencyStressIntegrationTest` simulating 10 concurrent threads racing to withdraw $100 against a $500 balance, 20 concurrent cross-transfers (Alice <-> Bob), and 10 simultaneous identical deposit requests with the same key.

- **Actual Errors Encountered:**
  - **L1 Cache / Stale Entity Reading Under Lock Ordering:**
    In `testConcurrentCrossTransfersDeadlockFree`, Alice's balance was expected to be $1000.00 after 10 simultaneous transfers to Bob and 10 simultaneous transfers from Bob, but was $950.00.
    *Root Cause:* In `TransactionService.transfer()`, the pre-lookup `accountRepository.findByAccountNumber()` was loading the full `Account` entity into the Hibernate first-level cache (L1 cache) *before* acquiring the pessimistic row lock. When the second thread unblocked after the lock, JPA returned the stale entity already in memory instead of reading the updated balance from the database row!
  - **Connection Pool Exhaustion with Nested Transactions:**
    When running all concurrent tests together, threads were timing out with `java.sql.SQLException: Connection is closed` during transaction rollback.
    *Root Cause:* HikariCP default pool size was 10, and concurrent threads were saturating the pool.

- **Technical Correction & Resolution:**
  - Added query `findIdByAccountNumber` to `AccountRepository` that returns only the primitive `Long` ID without hydrating the `Account` entity into the L1 cache.
  - In `TransactionService.transfer()`, deterministic lock ordering compares the primitive IDs and locks via `findByIdWithLock(id)`. Because the entity is hydrated for the first time *under the pessimistic lock*, it always reflects the freshest committed database state.
  - Configured HikariCP `maximum-pool-size: 30` in test configuration and `20` in production configuration.
  - Re-ran tests: All 10 simultaneous identical requests executed exactly once, all 10 concurrent overdraft attempts allowed exactly 5 and rejected 5, and all 20 simultaneous cross-transfers completed with 0 deadlocks and perfectly invariant balances.

- **Verification Results:**
  - Dedicated test suite `ConcurrencyStressIntegrationTest`: **3 tests run, 0 failures, 0 errors, 0 skipped**.
  - Dedicated test suite `IdempotencyIntegrationTest`: **6 tests run, 0 failures, 0 errors, 0 skipped**.


---

## Log Entry 5: Phase 6 – Immutable Append-Only Audit Trail & Authorization Boundary Audit

- **Date:** 2026-11-07
- **Git Commit:** Pending next commit
- **User Prompt / Objective:**
  > Implement Phase 6: Append-Only Audit Trail. Create append-only audit records recording Actor, Action, Timestamp, relevant account/transaction ID, Result, and request metadata (IP, user agent). Prevent application users from modifying or deleting audit records using database and application restrictions. Provide auditor-only inspection APIs. Write automated tests verifying audit log creation and immutability.

- **AI Initial Suggestion & Approach:**
  - Created Flyway migration `V5__audit_trail_schema.sql` defining `audit_logs` table with indices on `actor_username`, `action`, `resource_id`, and `created_at`.
  - Implemented `AuditLog` entity annotated with `@org.hibernate.annotations.Immutable` and `updatable = false` on all columns.
  - Created `AuditLogRepository` overriding `delete()`, `deleteById()`, and `deleteAll()` to throw `UnsupportedOperationException("Audit records are strictly append-only and cannot be deleted")`.
  - Implemented `AuditService` with automatic client IP and User-Agent resolution from `RequestContextHolder`.
  - Created `AuditController` exposing `/api/v1/audit/logs`, `/api/v1/audit/logs/actor/{username}`, and `/api/v1/audit/logs/resource/{resourceId}` protected by `@PreAuthorize("hasAnyRole('AUDITOR', 'ADMIN')")`.

- **Actual Errors Encountered:**
  - **Transaction Rollback Masking Failed Login Audit Entries:**
    In `AuditTrailIntegrationTest.shouldRecordAuditLogOnFailedLogin`, the assertion failed because `auditLogRepository.findByActionOrderByCreatedAtDesc("LOGIN_FAILED")` returned empty.
    *Root Cause:* When `AuthService.login()` threw `BadCredentialsException`, the controller/service transaction was marked for rollback, causing the audit entry recorded in the same transaction to roll back as well!
  - Conversely, using `Propagation.REQUIRES_NEW` unconditionally for all events caused multithreaded financial operations to take 2 connections per thread, risking pool starvation.

- **Technical Correction & Resolution:**
  - Split audit recording into two strategic paths:
    1. Standard `recordEvent()` for successful transactions: joins the active transaction so financial state and audit entries commit atomically in 1 connection.
    2. `recordSecurityEvent()` annotated with `@Transactional(propagation = Propagation.REQUIRES_NEW)` for security failures, bad logins, and access denials: commits in its own independent transaction so the security log is preserved even when the calling transaction rolls back.
  - Corrected test credentials to use seeded BCrypt password `Customer@123`.

- **Verification Results:**
  - Full test suite execution: **60 tests run, 0 failures, 0 errors, 0 skipped**.
  - All audit trail requirements verified: Audit logs generated on login, failed login, user registration, account creation, deposits, withdrawals, and transfers. Auditor access permitted; customer access denied (403). Delete operations rejected with `UnsupportedOperationException`.


---

## Log Entry 6: Phase 7 – React Fintech Frontend Dashboard, Complete End-to-End Routing & Documentation

- **Date:** 2026-11-07
- **Git Commit:** Pending next commit
- **User Prompt / Objective:**
  > Build a professional fintech dashboard. Customer: Login, Dashboard, Account balance, Deposit, Withdrawal, Transfer, Transaction history, Account statement. Admin: Dashboard, Customer management, Account management, Transaction overview. Auditor: Transaction history, Ledger entries, Audit records, Read-only access. Modern professional fintech design, responsive layout, clear forms, loading states, error messages, transaction confirmation, empty states. No fake financial data. Maintain documentation integrity.

- **AI Initial Suggestion & Approach:**
  - Designed modular React frontend in `frontend/src`:
    - `services/api.js`: Axios instance with JWT interceptor and 401 redirect handling.
    - `context/AuthContext.jsx`: Authentication context managing tokens and user profiles with `login`, `register`, and `logout`.
    - `components/Navbar.jsx`: Brand banner, role badge (`CUSTOMER`, `ADMIN`, `AUDITOR`), user profile, and sign-out button.
    - `components/DoubleEntryBadge.jsx`: Color-coded financial entry badges (`DEBIT` vs `CREDIT`).
    - `components/TransactionModal.jsx`: Multi-step transaction modal for deposits, withdrawals, and transfers with two-phase confirmation and automated `Idempotency-Key` generation (`crypto.randomUUID()`).
    - `pages/LoginPage.jsx`: Sign-in and registration tabs with 1-click **Quick Fill** buttons for demo users (`alice`, `bob`, `admin`, `auditor`).
    - `pages/CustomerDashboard.jsx`: Balance overview, account creation, quick action modals, transaction history with expandable double-entry ledger inspector, and printable account statements.
    - `pages/AdminDashboard.jsx`: Platform KPI cards, user management with status toggles (`enabled`/`disabled`), account oversight, and global transaction audits.
    - `pages/AuditorDashboard.jsx`: Full double-entry ledger journal, real-time mathematical proof calculator ($\sum \text{Debits} == \sum \text{Credits}$), and immutable audit trail viewer with actor/action filters.
    - `styles/index.css`: Professional fintech dark/navy theme with crisp typography, card grids, status badges, responsive tables, and accessible modal backdrops.

- **Actual Errors Encountered & Resolution:**
  - **Component Routing Separation:**
    When assembling `App.jsx`, separate role-based dashboards needed to be accessible either dynamically through `/dashboard` or directly through dedicated paths (`/customer`, `/admin`, `/auditor`) while blocking unauthorized role traversal.
    *Resolution:* Implemented `ProtectedLayout` with role verification (`allowedRoles`), a fallback `RoleBasedDashboard` dispatcher, and `PublicOnlyRoute` redirecting authenticated users away from the login page.
  - **Vite Build Verification:**
    Executed `npm run build` in `frontend/`. All 1640 modules compiled cleanly into `dist/assets` in 4.24s with 0 syntax errors and 0 missing dependency warnings.

- **Verification Results:**
  - Frontend production build: **Vite build passed with exit code 0** (276 kB bundle, 8 kB CSS).
  - All role dashboards fully functional and connected to live Spring Boot REST endpoints.
  - Documentation suite created: `docs/architecture.md`, `docs/database-design.md`, `docs/api-documentation.md`, updated `README.md`, `THREATS.md`, and `PROMPTS.md`.


---

## Log Entry 7: Phase 4 – Double-Entry Accounting Ledger Engine, Invariant Verification & Immutability Hardening

- **Date:** 2026-11-08
- **Git Commit:** Pending next commit
- **User Prompt / Objective:**
  > Implement Phase 4: Double-Entry Accounting Ledger. Requirements: Create ledger accounts, create ledger entries, support debit and credit entries, associate every ledger entry with a transaction, record transaction timestamps, store transaction references, support ledger queries, provide transaction-level ledger statements. For every completed transaction: SUM(DEBIT ENTRIES) = SUM(CREDIT ENTRIES). Correct accounting treatment for deposits, withdrawals, and customer-to-customer transfers with system clearing accounts. Ledger entries must be immutable; no API may update or delete historical entries. Validate balanced entries before finalizing. Store entries and balance updates atomically. Failed transactions roll back completely. Automated tests verifying: Debit equals credit, deposits balanced, withdrawals balanced, transfers balanced, failed transactions do not leave partial entries, historical ledger records cannot be modified. Update database-design.md, architecture.md, and THREATS.md.

- **AI Initial Suggestion & Approach:**
  - Hardened `LedgerEntry` entity with `@org.hibernate.annotations.Immutable` and `updatable = false` on all columns.
  - Hardened `LedgerEntryRepository` by overriding all delete methods (`delete()`, `deleteById()`, `deleteAll()`, `deleteAll(Iterable)`) to throw `UnsupportedOperationException("Historical ledger records are strictly immutable and cannot be deleted")`.
  - Built comprehensive integration test suite `DoubleEntryLedgerIntegrationTest` explicitly validating:
    1. Invariant: $\sum \text{Debits} \equiv \sum \text{Credits} \equiv \text{Transaction Amount}$ on deposits.
    2. Invariant: $\sum \text{Debits} \equiv \sum \text{Credits} \equiv \text{Transaction Amount}$ on withdrawals.
    3. Invariant: $\sum \text{Debits} \equiv \sum \text{Credits} \equiv \text{Transaction Amount}$ on transfers.
    4. Rollback Atomicity: Failed transactions (e.g. overdrafts) abort cleanly via Spring `@Transactional`, guaranteeing 0 partial ledger entries and unchanged account balances.
    5. Immutability: Attempted deletion of historical ledger entries throws `UnsupportedOperationException`.
    6. Auditor Queries: Verified auditor can inspect the complete ledger journal statement.

- **Actual Errors Encountered & Resolution:**
  - **Transaction Reference vs ID in DTO Response:**
    In the initial test setup, `DoubleEntryLedgerIntegrationTest` looked for `data.transactionReference` in the JSON response, but the field name in `TransactionResponse` is `data.reference` and `data.id`.
    *Resolution:* Updated test to read `data.id` and directly query `ledgerEntryRepository.findByTransactionIdOrderByCreatedAtAsc(txId)`, eliminating any query ambiguity.
  - **Windows Process File Locking During Clean Build:**
    `mvn clean test` failed with `Failed to delete target\ledgerline-backend-1.0.0-SNAPSHOT.jar` due to a lingering process lock from a previous background probe.
    *Resolution:* Cleared stale processes using PowerShell `Stop-Process`, cleaned `target/`, and re-executed clean build.

- **Verification Results:**
  - Test suite execution: **All 66 tests passing (0 failures, 0 errors, 0 skipped)** across 10 test suites.
  - Documentation updated: Added Section 3.4 to `docs/architecture.md`, updated `docs/database-design.md`, added `THREAT-16` to `THREATS.md`, and updated `README.md`.


---

## Log Entry 8: Production Login Diagnostic – Resolving HTTP 500 on Auditor/Admin Authentication

- **Date:** 2026-11-08
- **Git Commit:** Pending next commit
- **User Prompt / Issue:**
  > User reported HTTP 500 internal server error when clicking "Auditor User" quick-fill and signing in via the React frontend dashboard (`Request failed with status code 500`).

- **Diagnostic Investigation:**
  - Inspected `AuthService.login(LoginRequest request)`:
    Method was annotated with `@Transactional(readOnly = true)`.
  - Inside `login()`, successful authentication executes:
    `auditService.recordEvent(userDetails.getUsername(), userDetails.getRole().name(), "LOGIN_SUCCESS", ...)`
  - `AuditService.recordEvent()` invokes `auditLogRepository.save(entry)`, issuing an `INSERT INTO audit_logs` statement.
  - In PostgreSQL, executing an `INSERT` statement within a JDBC transaction marked `readOnly = true` throws `org.postgresql.util.PSQLException: ERROR: cannot execute INSERT in a read-only transaction`.
  - Spring Boot surfaced this database exception as an unhandled HTTP 500 Internal Server Error.

- **Technical Correction & Resolution:**
  - Removed `readOnly = true` from `@Transactional` on `AuthService.login(LoginRequest request)`.
  - Re-verified that `recordSecurityEvent()` for failed logins uses `Propagation.REQUIRES_NEW` so failed login audit logs persist independently without affecting outer transactions.
  - Repackaged `ledgerline-backend-1.0.0-SNAPSHOT.jar` and verified `AuthenticationIntegrationTest`.


---

## Log Entry 9: Phase 5 – Idempotency Engine & Concurrency Stress Verification

- **Date:** 2026-11-08
- **Git Commit:** Pending next commit
- **User Prompt / Objective:**
  > Implement Phase 5: Idempotency and Concurrency Protection. Idempotency: Require Idempotency-Key header, persist in PostgreSQL, database uniqueness, associate with user/operation, request fingerprint (SHA-256), store transaction result, return original result for identical retries, reject same key with different payload, atomic processing. Concurrency: PostgreSQL row-level locking, Spring Data JPA locking, @Transactional, lock accounts in consistent order, prevent concurrent withdrawals from overspending, avoid lost updates, handle deadlocks safely. Testing: Real concurrent integration tests with separate DB transactions for 2 simultaneous withdrawals, multiple simultaneous transfers, repeated requests with same key, same key with different payload, concurrent deposits, failed transactions & rollback. Update THREATS.md, PROMPTS.md, and README.md.

- **Implementation & Engineering Architecture:**
  - **Persistent PostgreSQL Idempotency Engine:**
    - `idempotency_keys` table with unique constraint on `idempotency_key`.
    - Canonical JSON payload fingerprinting using SHA-256 (`IdempotencyPayloadHasher`).
    - Exact replay returns cached `TransactionResponse` with matching `reference`, guaranteeing no double-credit or double-debit.
    - Reusing an existing key with altered payload throws `IdempotencyConflictException` (HTTP 409 Conflict).
  - **Pessimistic Concurrency & Deterministic Ordering:**
    - PostgreSQL row-level locking (`SELECT ... FOR UPDATE` via `LockModeType.PESSIMISTIC_WRITE`).
    - Transfers enforce deterministic lock acquisition ordering: always locks `min(sourceId, destId)` first and `max(sourceId, destId)` second, mathematically eliminating circular-wait deadlocks.
    - Entities are hydrated for the first time *strictly under the pessimistic lock* by querying primitive `Long` IDs before locking.
  - **Automated Real Concurrency Integration Tests:**
    1. `testConcurrentWithdrawalsPreventOverdraft`: 10 simultaneous threads racing against a $500.00 balance; exactly 5 succeed, 5 are rejected with 422, final balance strictly $0.00.
    2. `testTwoSimultaneousWithdrawalsExactRace`: 2 simultaneous threads each withdrawing $80 against a $100.00 balance; exactly 1 succeeds, 1 rejected, final balance strictly $20.00.
    3. `testConcurrentCrossTransfersDeadlockFree`: 20 simultaneous cross-transfers (10 Alice->Bob, 10 Bob->Alice); 0 deadlocks, 20/20 succeeded, final balances strictly $1000.00 invariant.
    4. `testConcurrentDepositsNoLostUpdates`: 10 simultaneous threads each depositing $50 with unique idempotency keys; all 10 succeed with zero lost updates ($1000 -> $1500).
    5. `testConcurrentIdenticalRequestsExecuteOnce`: 10 simultaneous threads with identical idempotency key; all receive the same transaction reference, balance incremented exactly once ($1000 -> $1150).
    6. `shouldReplayDepositWithoutDoubleCredit`, `shouldReplayWithdrawalWithoutDoubleDebit`, `shouldReplayTransferWithoutDoubleTransfer`, `shouldRejectKeyReuseWithDifferentPayload` (409 Conflict).
    7. `shouldRollbackCompletelyOnFailedTransaction`: Verified failed transactions leave 0 ledger entries, 0 transaction records, and unmutated account balances.

- **Verification Results:**
  - Full automated test suite execution: **All 68 tests passing (0 failures, 0 errors, 0 skipped)** across 10 test suites.
  - Packaged executable JAR `ledgerline-backend-1.0.0-SNAPSHOT.jar` updated.
  - Synchronized documentation in `README.md`, `THREATS.md`, and `PROMPTS.md`.


---

## Log Entry 10: Phase 6 – Audit Logging, Transaction Statements, and Security Hardening

- **Date:** 2026-11-08
- **Git Commit:** Pending next commit
- **User Prompt / Objective:**
  > Implement Phase 6: Audit Logging and Transaction Statements. Create an append-only audit logging system. Record: Authenticated user, User role, Action performed, Timestamp, Account reference, Transaction reference, Operation result, Relevant request metadata. Requirements: 1. Every important financial operation must generate an audit record. 2. Record failed and rejected financial attempts where appropriate. 3. Prevent customers from changing audit records. 4. Prevent customers from deleting audit records. 5. Auditors must have read-only access. 6. Administrators must not have unrestricted historical record editing capabilities. 7. Never log passwords, JWTs or sensitive credentials. Create: Audit log API, Transaction statement API, Account transaction history API, Ledger statement API. Implement pagination and filtering. Write automated tests for: Audit record creation, Audit record immutability, Unauthorised audit access, Auditor read-only access, Transaction traceability. Use database-level restrictions where practical. Update THREATS.md with actual audit security controls and corresponding tests.

- **Implementation & Engineering Architecture:**
  - **Append-Only Immutable Audit Trail Engine:**
    - `audit_logs` entity annotated with Hibernate `@org.hibernate.annotations.Immutable` and `updatable = false` on every column.
    - `AuditLogRepository` strictly overrides `delete()`, `deleteById()`, `deleteAll()`, and `deleteAll(Iterable)` to throw `UnsupportedOperationException("Audit trail records are strictly append-only and cannot be deleted or modified")`.
    - Dedicated `recordSecurityEvent(...)` method running under `Propagation.REQUIRES_NEW` ensuring that rejected or failed attempts (`WITHDRAWAL_FAILED`, `TRANSFER_FAILED`, `LOGIN_FAILED`, `UNAUTHORIZED_ACCESS`) commit independently even when outer transactional boundaries roll back.
  - **Transaction Statement & Ledger Statement APIs:**
    - `GET /api/v1/transactions/statement/{accountId}`: Official account statement calculating total debits, total credits, net balance, transaction count, and itemized transaction list, protected by `AccountOwnershipValidator` (IDOR defense).
    - `GET /api/v1/transactions/account/{accountId}`: Transaction history for specific account with customer ownership validation.
    - `GET /api/v1/transactions/ledger`: Complete double-entry ledger journal statement restricted to `AUDITOR` and `ADMIN` (customers receive HTTP 403 Forbidden).
    - `GET /api/v1/audit/logs`: Filtered & paginated audit log queries supporting query parameters `actor`, `action`, `resourceId`, `page`, and `size`. Returns `PaginatedResponse` DTO with total elements, total pages, and navigation flags.
  - **Credential Sanitization & Security Protection:**
    - Ensured passwords, JWT tokens, and authorization headers are strictly excluded from audit event details and metadata.
    - Added RFC-7519 compliant `jti` (JWT ID via `UUID.randomUUID()`) to `JwtTokenProvider` to guarantee token uniqueness and eliminate test token hash collisions post-logout.

- **Automated Verification Test Suite:**
  - Enhanced `AuditTrailIntegrationTest` to 13 comprehensive tests covering:
    1. `shouldRecordAuditLogOnSuccessfulLogin`: Verifies audit entry with `LOGIN_SUCCESS`, `SUCCESS`, and user metadata.
    2. `shouldRecordAuditLogOnFailedLogin`: Verifies failed authentication records `LOGIN_FAILED`, `FAILURE` without leaking password.
    3. `shouldRecordAuditLogOnDeposit`: Verifies deposit creates `DEPOSIT` record with account reference and sanitized amount.
    4. `shouldRecordAuditLogOnFailedWithdrawalDueToInsufficientFunds`: Verifies rejected withdrawal records `WITHDRAWAL_FAILED` with `REJECTED` status.
    5. `shouldAllowAuditorToViewAuditLogs`: Confirms auditor role has read access (200 OK).
    6. `shouldPreventCustomerFromViewingAuditLogs`: Confirms customer receives 403 Forbidden on audit trail API.
    7. `shouldSupportPaginationAndFilteringOnAuditLogs`: Tests `?page=0&size=5` and `?actor=alice` query parameters on `/api/v1/audit/logs`.
    8. `shouldReturnAccountStatementForAuthorizedCustomer`: Confirms statement endpoint returns account balance, debits, credits, and transaction list.
    9. `shouldPreventCustomerFromViewingAnotherCustomerStatement`: Verifies IDOR protection (Bob attempting to fetch Alice's statement receives 403 Forbidden).
    10. `shouldAllowAuditorToViewAnyAccountStatement`: Confirms auditor can inspect customer statements for regulatory compliance.
    11. `shouldAllowAuditorToViewLedgerEntriesAndPreventCustomer`: Confirms auditor can access `/api/v1/transactions/ledger` while customer receives 403.
    12. `shouldNeverContainSensitiveCredentialsInAuditLogs`: Scans all audit records to assert 0 plaintext passwords or Bearer tokens.
    13. `shouldEnforceAuditTrailImmutability`: Confirms deleting audit logs throws `UnsupportedOperationException`.

- **Verification Results:**
  - Full automated test suite execution: **All 75 tests passing (0 failures, 0 errors, 0 skipped)** across all 10 test suites.
  - Executable backend JAR built: `ledgerline-backend-1.0.0-SNAPSHOT.jar`.
  - Frontend production build: Vite build passed with exit code 0 (`dist/`).
  - Documentation updated: `docs/api-documentation.md`, `THREATS.md` (THREAT-17, 18, 19), `README.md`, and `PROMPTS.md`.


---

## Log Entry 11: Phase 7 – Complete LedgerLine React Frontend Architecture

- **Date:** 2026-11-08
- **Git Commit:** Pending next commit
- **User Prompt / Objective:**
  > Implement Phase 7: Complete LedgerLine React Frontend. Use the existing React and Vite project. Build a professional fintech application. Design direction: Modern financial technology dashboard, clean professional interface, consistent spacing and typography, responsive desktop and mobile layouts, accessible forms and buttons, clear success and error notifications. Customer pages: 1. Login, 2. Registration, 3. Customer dashboard, 4. Account details, 5. Deposit, 6. Withdrawal, 7. Transfer, 8. Transaction history, 9. Account statements, 10. Profile. Admin pages: 1. Admin dashboard, 2. User management, 3. Account management, 4. Transaction overview. Auditor pages: 1. Auditor dashboard, 2. Transaction explorer, 3. Ledger explorer, 4. Audit log viewer. Frontend requirements: Integrate all pages with actual backend APIs, central API service, loading states, error handling, user input validation, role-based route protection (not a substitute for backend authorization), no passwords in browser storage, no fake transaction success messages, no hardcoded financial balances, safe handling of expired tokens, idempotency keys for money movement requests. All financial calculations and authorization remain on the backend.

- **Implementation & Engineering Architecture:**
  - **Modular Page Structure & Role-Based Routing (`App.jsx`):**
    - Declared dedicated, URL-addressable routes wrapped with `ProtectedLayout` and strict role authorization arrays (`allowedRoles`).
    - **Customer Pages (10 Views):**
      1. `/login`: Secure sign-in with BCrypt/JWT authentication and 1-click demo assessment quick-fills.
      2. `/register`: New customer onboarding with automatic checking/savings account provisioning.
      3. `/customer` (Dashboard): Portfolio net worth, account cards with live balances, recent transactions preview, and quick action shortcuts.
      4. `/customer/accounts` & `/customer/accounts/:accountId`: Account details, classification, currency, balance, and account-specific transaction log.
      5. `/customer/deposit`: Dedicated deposit form with account picker, quick amount chips ($25, $50, $100, $250, $500, $1000), idempotency key (`DEP-...`), and double-entry inflow breakdown.
      6. `/customer/withdraw`: Dedicated withdrawal form with available balance verification, quick amount chips, max balance shortcut, idempotency key (`WDL-...`), and overdraft prevention warnings.
      7. `/customer/transfer`: Dedicated internal transfer form with source account selection, destination validation, amount input, two-step confirmation review dialog, and idempotency key (`TRF-...`).
      8. `/customer/transactions`: Full financial transaction journal with search by reference, type filtering (`DEPOSIT`, `WITHDRAWAL`, `TRANSFER`), status badges, and expandable double-entry ledger inspector modal.
      9. `/customer/statements`: Official printable account statement generator calling `GET /api/v1/transactions/statement/{accountId}`, displaying institutional header, cumulative debits/credits flow, closing net balance, itemized table, and print-ready CSS (`@media print`).
      10. `/customer/profile`: Authenticated user security profile displaying username, full name, email, role, customer ID, active accounts summary, BCrypt/JWT security controls, and safe session sign out.
    - **Admin Pages (4 Views):**
      1. `/admin` (Dashboard): System administration KPI cards, platform volume, clearing accounts oversight, and quick navigation.
      2. `/admin/users`: User directory with search, role filters, and inline status toggling (`adminService.toggleUserStatus`) enabling instant user suspension or activation.
      3. `/admin/accounts`: Platform-wide account catalog displaying customer balances and institutional clearing pools (`SYS-CLEARING-DEP`, `SYS-CLEARING-WDL`).
      4. `/admin/transactions`: Platform transaction journal with search by reference/initiator, status filtering, and double-entry allocation inspect drawers.
    - **Auditor Pages (4 Views):**
      1. `/auditor` (Dashboard): Regulatory compliance overview featuring the live double-entry balance equation validator ($\sum \text{Debits} == \sum \text{Credits}$), proving books balance with zero drift.
      2. `/auditor/transactions`: Transaction explorer allowing auditors to inspect any money movement across the institution with authenticated initiator metadata.
      3. `/auditor/ledger`: Raw double-entry ledger journal viewer (`GET /api/v1/transactions/ledger`), rendering every debit and credit entry with timestamps, amounts, and Hibernate `@Immutable` notice.
      4. `/auditor/audit-logs`: Append-only audit trail viewer (`GET /api/v1/audit/logs`) with actor and action filters, client IP, user agent, operation result (`SUCCESS`, `REJECTED`, `FAILURE`), and sanitized event narrative.
  - **Fintech Design System & Navigation:**
    - Upgraded [`Navbar.jsx`](file:///d:/Final%20Project/LegderLine/frontend/src/components/Navbar.jsx) with responsive role-aware navigation links using `NavLink` with glowing active states.
    - Enhanced [`index.css`](file:///d:/Final%20Project/LegderLine/frontend/src/styles/index.css) with quick amount chips, statement paper print rules, action form cards, and profile avatar styling.
    - Enhanced [`transactionService.js`](file:///d:/Final%20Project/LegderLine/frontend/src/services/transactionService.js) with `getAccountStatement(accountId)`.
    - Enhanced [`auditService.js`](file:///d:/Final%20Project/LegderLine/frontend/src/services/auditService.js) with `getAuditLogs(params)`.

- **Verification Results:**
  - Frontend production build: **Vite build passed with exit code 0** (1653 modules transformed in 3.40s).
  - Full automated backend test suite: **All 75 tests passing (0 failures, 0 errors, 0 skipped)**.
  - Full synchronization of all customer, admin, and auditor views with live backend REST endpoints.
