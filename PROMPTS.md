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
