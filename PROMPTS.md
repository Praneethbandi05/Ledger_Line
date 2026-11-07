# PROMPTS.md – AI Interaction & Technical Decision Log

Project: **LEDGERLINE – Money Movement With a Ledger You Can Prove**  
Assessment: **Snovasys 2026 Fresher Hiring Assessment**  
Repository: `D:\Final Project\LegderLine`

---

## Log Entry 1: Phase 1 – Foundation, Database Scaffolding & Flyway Baseline

- **Date:** 2026-11-07
- **Git Commit:** [`e53d174`](https://github.com/ledgerline/ledgerline-backend/commit/e53d174069c289b5b7876957b7ca9e367ef87143) (`e53d174069c289b5b7876957b7ca9e367ef87143`)
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
- **Git Commit:** [`76ecca4`](https://github.com/ledgerline/ledgerline-backend/commit/76ecca4afff5e6d0344447e6cde2e450eb85487a) (`76ecca4afff5e6d0344447e6cde2e450eb85487a`)
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
