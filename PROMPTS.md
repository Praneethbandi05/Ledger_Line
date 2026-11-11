# Engineering Journal and Architectural Decision Log — Balance Vault

**Project:** Balance Vault (Financial Transaction and Double-Entry Ledger Platform)  
**Version:** 1.0.0  

This document chronicles the core engineering milestones, architectural decision records (ADRs), production diagnostic investigations, and verification results across the development lifecycle of the Balance Vault platform.

---

## Milestone 1: Platform Foundation, Health Monitoring, and Flyway Baseline

### Context and Objectives
Establish an institutional-grade Java 21 / Spring Boot 3.3.5 baseline with an isolated React 18 / Vite frontend, strict Flyway database version control, and non-hardcoded environment configurations.

### Key Technical Challenges and Solutions
- **Flyway Dialect Portability:**  
  *Challenge:* Initial migration scripts utilized PostgreSQL-specific `ON CONFLICT DO UPDATE` syntax which caused in-memory H2 slice tests to fail during context initialization.  
  *Resolution:* Refactored baseline seeding to clean, standard ANSI SQL inserts. Because Flyway migrations run strictly once per database instance, standard inserts guarantee compatibility across both production PostgreSQL 16 and hermetic test environments.
- **Automated Health Probes:**  
  Engineered `/api/v1/health` and `/api/v1/health/db` endpoints performing active JDBC connection pings and `SELECT 1` queries to report live database latency and connection pool health.

---

## Milestone 2: Authentication, Stateless Token Revocation, and IDOR Defense

### Context and Objectives
Implement stateless authentication using HMAC-SHA256 JWTs while supporting immediate session revocation upon logout, role-based access control (RBAC), and domain-level defense against Insecure Direct Object References (IDOR).

### Key Architectural Decisions
- **Persistent Token Blacklist:**  
  To preserve statelessness without maintaining heavy server sessions, the logout endpoint computes a SHA-256 hash of the presented JWT and stores it in the `token_blacklist` table alongside its natural expiration time. The `JwtAuthenticationFilter` validates incoming tokens against this table.
- **Defense-in-Depth Ownership Validation:**  
  The system never relies on customer IDs supplied in request payloads or URL parameters. The `AccountOwnershipValidator` resolves the user identity strictly from the authenticated `SecurityContext` (`SecurityContextHolder.getContext().getAuthentication()`). If a caller attempts to access an account they do not own and lacks administrative privileges, access is rejected with `403 Forbidden`.
- **Domain Exception Transparency:**  
  Configured `GlobalExceptionHandler` to preserve security context explanations in access denial responses, aiding auditing and client-side debugging while returning standard RFC-7807 problem payloads.

---

## Milestone 3: Core Financial Engine, Double-Entry Accounting, and System Clearing

### Context and Objectives
Implement atomic deposits, withdrawals, and internal transfers with mathematical ledger balance guarantees and no loss of precision.

### Key Architectural Decisions
- **Double-Entry Balance Invariant:**  
  Every financial transaction produces two or more ledger entries satisfying the invariant:
  $$\sum \text{Debits} \equiv \sum \text{Credits} \equiv \text{Transaction Amount}$$
  - External deposits credit the institutional clearing account `SYS-CLEARING-DEP` and debit the customer account.
  - External withdrawals debit `SYS-CLEARING-WDL` and credit the customer account.
  - Internal transfers credit the source account and debit the destination account.
- **Exact Decimal Arithmetic:**  
  Prohibited floating-point primitives (`float`, `double`) across all financial calculations. Implemented `BigDecimal` with scale 2 and `RoundingMode.HALF_EVEN` (Banker's Rounding).
- **Dual-Layer Overdraft Defense:**  
  1. Service layer: `DoubleEntryLedgerEngine.validateSufficientBalance()` checks available funds before mutating state.
  2. Database layer: PostgreSQL `CHECK (balance >= 0)` constraint prevents any operation from committing a negative balance.

---

## Milestone 4: Concurrency Protection, Pessimistic Locking, and Deadlock Elimination

### Context and Objectives
Prevent race conditions (such as simultaneous withdrawals exceeding total balance) and circular-wait deadlocks during bidirectional transfers under high concurrent load.

### Key Technical Challenges and Solutions
- **Race Condition Prevention via Pessimistic Row Locking:**  
  Configured `@Lock(LockModeType.PESSIMISTIC_WRITE)` on account lookups, translating to PostgreSQL `SELECT ... FOR UPDATE`. This serializes concurrent requests attempting to debit the same account.
- **Deterministic Lock Ordering:**  
  *Challenge:* Alice transferring to Bob while Bob simultaneously transfers to Alice introduces a classic circular-wait deadlock risk if locks are acquired arbitrarily.  
  *Resolution:* Implemented deterministic lock acquisition in `TransactionService.transfer()`: locks are always acquired in ascending Primary Key ID order (`min(id1, id2)` then `max(id1, id2)`). This mathematically eliminates circular wait conditions.
- **Hibernate L1 Cache Hydration Protection:**  
  *Challenge:* Loading an account entity prior to locking cached stale balance values in the Hibernate first-level session cache.  
  *Resolution:* Added scalar queries (`findIdByAccountNumber`) returning only primitive `Long` IDs. Entities are hydrated from the database for the first time *strictly under the pessimistic write lock*, ensuring the balance reflects the latest committed on-disk state.

---

## Milestone 5: Persistent Idempotency Engine

### Context and Objectives
Ensure that duplicate client submissions, network retries, or browser double-clicks never result in duplicate financial execution.

### Key Architectural Decisions
- **Mandatory Idempotency Keys:**  
  All money movement endpoints require an `Idempotency-Key` header carrying a client-generated UUID.
- **Payload Fingerprinting:**  
  The engine computes a canonical SHA-256 hash of the normalized request payload.
  - Replays with an identical key and identical payload return the original cached `TransactionResponse` with HTTP 200 without executing a second financial operation.
  - Replays with an identical key but a modified payload trigger an `IdempotencyConflictException`, returning `409 Conflict`.
- **Atomic Persistence:**  
  The idempotency record creation, financial execution, double-entry ledger entries, and balance updates share a single `@Transactional` boundary.

---

## Milestone 6: Immutable Append-Only Audit Trail

### Context and Objectives
Provide complete operational and security event traceability for regulatory compliance, while preventing tampering or unauthorized access.

### Key Architectural Decisions
- **Entity Immutability:**  
  `AuditLog` and `LedgerEntry` are annotated with Hibernate `@Immutable` with `updatable = false` on all columns.
- **Repository Deletion Safeguards:**  
  Overrode delete methods in `AuditLogRepository` and `LedgerEntryRepository` to throw `UnsupportedOperationException`.
- **Strategic Transaction Propagation:**  
  - Standard financial audit records join the active transaction to commit atomically.
  - Security failure events (`LOGIN_FAILED`, `WITHDRAWAL_FAILED`, `UNAUTHORIZED_ACCESS`) execute under `Propagation.REQUIRES_NEW`, guaranteeing that failure records commit even if the calling transaction rolls back.
- **Credential Sanitization:**  
  Audit event payloads strictly exclude passwords, tokens, and authorization headers.

---

## Milestone 7: Frontend Architecture and User Experience

### Context and Objectives
Build a responsive single-page application in React 18 and Vite for Customer, Administrator, and Auditor workspaces following institutional fintech design standards.

### Key Architectural Decisions
- **Role-Based Protected Routing:**  
  Routes are wrapped in `ProtectedLayout` components enforcing role permissions (`CUSTOMER`, `ADMIN`, `AUDITOR`) and redirecting unauthorized users.
- **Institutional Design System:**  
  Created an institutional visual language using an evergreen canvas (`#F4F6F2`), deep forest green accents (`#092218`), Newsreader serif headers, and high-contrast metric cards.
- **Separation of Profile and Security:**  
  Split user profile settings (`/customer/profile`) and credential management (`/customer/security`) into standalone dedicated pages, eliminating modal-in-modal layout conflicts.
- **Printable Ledger Statements:**  
  Engineered dedicated `@media print` stylesheets for `/customer/statements`, hiding application navigation, headers, and buttons to render official institutional statements.

---

## Milestone 8: Diagnostic Investigations and Defect Resolutions

### Case 1: PostgreSQL `readOnly` Transaction Conflict on Login Audit
- **Symptom:** HTTP 500 error when logging in as an auditor or administrator.
- **Root Cause:** `AuthService.login()` was marked `@Transactional(readOnly = true)`. Inside the method, successful authentication invoked `auditService.recordEvent()`, attempting an `INSERT INTO audit_logs`. PostgreSQL rejects write statements within read-only transactions.
- **Resolution:** Removed `readOnly = true` from `AuthService.login()`, allowing the audit record to commit.

### Case 2: Untyped Null Casting in Dynamic JPQL Queries
- **Symptom:** Querying `/api/v1/audit/logs` with optional null filters produced PostgreSQL `ERROR: function lower(bytea) does not exist`.
- **Root Cause:** Hibernate passed untyped Java `null` parameters as `bytea` to PostgreSQL when evaluating `LOWER(:actor)`.
- **Resolution:** Explicitly cast parameters in JPQL: `(cast(:actor as string) is null or lower(a.actorUsername) = lower(cast(:actor as string)))`.

### Case 3: Admin Transaction DTO Mapping Mismatch
- **Symptom:** The Platform Transactions page displayed blank initiator names and failed to render double-entry entries in the expanded view.
- **Root Cause:** `AdminTransactionOverview.jsx` referenced `tx.initiatedBy?.username`, whereas `TransactionResponse.java` serializes this field as `initiatedByUsername`. Furthermore, `DoubleEntryBadge` expected individual entry props rather than the entire transaction object.
- **Resolution:** Updated property references to `tx.initiatedByUsername` and iterated over `tx.ledgerEntries` to pass `entryType`, `amount`, and `currency` to `DoubleEntryBadge`.

---

## Summary of Verification Metrics

| Verification Scope | Metrics | Status |
| :--- | :--- | :--- |
| **Backend Integration Suite** | 75 tests across 10 test suites | **100% Passing (0 failures, 0 errors, 0 skipped)** |
| **Concurrency Testing** | 20 simultaneous cross-transfers, 10 overdraft race threads | **0 Deadlocks, Invariant Balance Preserved** |
| **Idempotency Testing** | Repeated submissions, payload tamper attempts | **0 Double Credits, 409 Conflict on Tamper** |
| **Frontend Production Build** | Vite 5 build (`dist/`) | **0 Errors, 1656 modules compiled in ~3.5s** |
| **Flyway Schema Migrations** | V1 through V5 | **Clean execution and validation** |
