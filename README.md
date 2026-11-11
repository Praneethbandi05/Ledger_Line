# Balance Vault — Institutional Financial Ledger Platform

[![Java](https://img.shields.io/badge/Java-21-blue.svg)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.5-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)
[![Flyway](https://img.shields.io/badge/Flyway-10.x-red.svg)](https://flywaydb.org/)
[![React](https://img.shields.io/badge/React-18-cyan.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-purple.svg)](https://vitejs.dev/)
[![Tests](https://img.shields.io/badge/Tests-75%2F75%20Passing-success.svg)](#automated-test-suite)

**Balance Vault** is a full-stack institutional financial transaction platform built on a double-entry ledger model. It enforces balance integrity at the database level, prevents duplicate execution through a persistent idempotency engine, and maintains a tamper-resistant audit trail across all financial events.

---

## Financial Guarantees

The system is designed around a core set of non-negotiable financial invariants:

- **Every transaction is authorized.** Spring Security JWT authentication with server-side token revocation via a persistent blacklist table ensures no expired or logged-out token can access protected resources.
- **No duplicate execution.** A PostgreSQL-backed idempotency engine requires a unique `Idempotency-Key` header on all money movement requests. Canonical SHA-256 payload hashes detect modified replays and return `409 Conflict`.
- **Balances are correct under concurrency.** Pessimistic write locks (`SELECT ... FOR UPDATE`) at the database layer prevent concurrent overdraft race conditions. Exact `BigDecimal` arithmetic (scale 2, HALF_EVEN rounding) eliminates floating-point imprecision.
- **Every transaction balances the ledger.** Each financial movement produces paired debit and credit entries through institutional clearing accounts, enforcing Σ(Debits) = Σ(Credits) = Transaction Amount before any database commit.
- **Bidirectional transfers are deadlock-free.** Locks are acquired in ascending primary key order across all transfer paths, eliminating circular waits.
- **Failure rolls back completely.** Spring `@Transactional` boundaries encompass the idempotency check, balance updates, ledger entries, and audit logging as a single atomic unit.
- **Customers cannot see other customers' accounts.** An `AccountOwnershipValidator` resolves identity strictly from the authenticated security context and rejects unauthorized access with `403 Forbidden`.
- **Audit records cannot be modified or deleted.** The `audit_logs` and `ledger_entries` tables are marked `@Immutable` at the Hibernate layer, with repository-level deletion disabled.

---

## Project Structure

```text
com.ledgerline
    ├── config        — Spring Security, CORS, Web MVC configuration
    ├── controller    — Thin REST controllers, Bean Validation on DTOs
    ├── dto           — Request/Response objects, error representations
    ├── entity        — JPA entities with database constraints
    ├── enums         — Roles, transaction types, entry types, account types
    ├── exception     — Centralized exception hierarchy, RFC-7807 error responses
    ├── repository    — Spring Data JPA repositories with pessimistic locking
    ├── security      — JWT filter, token blacklist, IDOR ownership validators
    ├── service       — Transactional business logic
    ├── ledger        — DoubleEntryLedgerEngine (invariant enforcement)
    ├── audit         — Append-only immutable audit trail service
    └── util          — BigDecimal helpers, SHA-256 hashing, reference generation

frontend/src/
    ├── components/   — Shared UI components (Header, Sidebar, Alert, modals)
    ├── context/      — React AuthContext (JWT lifecycle management)
    ├── pages/        — Customer, Admin, and Auditor workspace pages
    ├── services/     — Axios API clients for each domain area
    └── styles/       — Balance Vault design system (CSS)
```

---

## Demo Credentials

The database is pre-seeded via Flyway migrations with the following test accounts:

| Username  | Password        | Role       | Notes                                              |
|-----------|-----------------|------------|----------------------------------------------------|
| `alice`   | `Customer@123`  | `CUSTOMER` | Savings account with $1,000.00 initial balance.    |
| `bob`     | `Customer@123`  | `CUSTOMER` | Savings account with $1,000.00 initial balance.    |
| `admin`   | `Admin@12345`   | `ADMIN`    | Full platform administration and user management.  |
| `auditor` | `Auditor@12345` | `AUDITOR`  | Read-only access to ledger, audit logs, statements.|

The login page includes one-click Quick Fill buttons for all four demo roles.

---

## Technology Stack

| Layer       | Technologies                                                                       |
|-------------|------------------------------------------------------------------------------------|
| Backend     | Java 21, Spring Boot 3.3.5, Spring Data JPA, Hibernate 6.5, Spring Security 6.3   |
| Auth        | JJWT 0.12.6 (HMAC-SHA256), BCrypt password hashing                               |
| Database    | PostgreSQL 16, Flyway 10 migrations, HikariCP connection pool                     |
| Frontend    | React 18, Vite 5, Axios, Lucide React                                              |
| Testing     | JUnit 5, Mockito, Spring Boot Test, H2 (PostgreSQL compatibility mode)             |

---

## Running the Application

### Prerequisites

- Java 21 or later (`JAVA_HOME` set)
- Node.js 18 or later with npm
- PostgreSQL 16 running locally on port 5432, with a database named `ledgerline`

### Environment Variables

Set the following before starting the backend:

```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ledgerline
DB_USERNAME=postgres
DB_PASSWORD=postgres
JWT_SECRET=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
JWT_EXPIRATION_MS=86400000
PORT=8080
```

### Backend

```bash
# Run all tests (75 tests)
./mvnw clean test

# Build and run
./mvnw clean package -DskipTests
java -jar target/ledgerline-backend-1.0.0-SNAPSHOT.jar
```

The API will be available at `http://localhost:8080`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The UI will be available at `http://localhost:5173` (or the next available port).

### Docker (Full Stack)

```bash
docker compose up --build
```

---

## Automated Test Suite

The backend includes 75 automated tests across 10 test classes, organized by functional area:

| Test Suite                           | Tests | Coverage Area                                                              |
|--------------------------------------|:-----:|----------------------------------------------------------------------------|
| `DoubleEntryLedgerEngineTest`        |   8   | Balance equation validation, edge cases, clearing account logic.           |
| `DoubleEntryLedgerIntegrationTest`   |   6   | Ledger invariants across deposit, withdrawal, transfer; rollback atomicity. |
| `AuthenticationIntegrationTest`      |   7   | Registration, BCrypt hashing, JWT signing and expiry, token revocation.    |
| `AuthorizationIntegrationTest`       |   7   | Role-based access control, IDOR defense, auditor write restrictions.       |
| `FinancialOperationsIntegrationTest` |   8   | Deposits, withdrawals, transfers, insufficient funds handling.              |
| `IdempotencyIntegrationTest`         |   6   | Duplicate prevention, payload tamper detection, mandatory key enforcement. |
| `ConcurrencyStressIntegrationTest`   |   5   | 20 simultaneous transfers, 10 concurrent overdraft attempts, 0 deadlocks.  |
| `AuditTrailIntegrationTest`          |  13   | Audit creation, immutability, IDOR on statements, credential sanitization. |
| `HealthControllerIntegrationTest`    |   5   | Live database health probes and latency checks.                            |
| `DatabaseHealthServiceTest`          |  10   | JDBC probes, latency thresholds, failure simulation.                       |
| **Total**                            | **75**| **0 Failures — 0 Errors — 0 Skipped**                                     |

---

## Documentation

- [System Architecture](docs/architecture.md) — Layered design, double-entry engine, locking strategy.
- [Database Design](docs/database-design.md) — Entity-relationship diagram, table schemas, constraints, Flyway versions.
- [REST API Reference](docs/api-documentation.md) — All endpoints, request/response formats, status codes.
- [Threat Model](THREATS.md) — 19 identified threat categories with mitigations and verification tests.

---

## Repository

[https://github.com/Praneethbandi05/Ledger_Line](https://github.com/Praneethbandi05/Ledger_Line)
