# LEDGERLINE – Money Movement With a Ledger You Can Prove

[![Backend Build](https://img.shields.io/badge/Java-21-blue.svg)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.5-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)
[![Flyway](https://img.shields.io/badge/Flyway-10.x-red.svg)](https://flywaydb.org/)
[![React](https://img.shields.io/badge/React-18-cyan.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-purple.svg)](https://vitejs.dev/)
[![Tests Passing](https://img.shields.io/badge/Tests-75%2F75%20Passing-success.svg)](#automated-testing-suite)

**LEDGERLINE** is an institutional-grade financial transaction management application engineered for the **Snovasys 2026 Fresher Hiring Assessment**. It guarantees **absolute double-entry balance integrity**, **PostgreSQL-backed idempotency**, **deadlock-free deterministic concurrency**, **append-only audit immutability**, and **multi-layered IDOR defense**.

---

## 1. Core System Guarantees

- **Every financial transaction is authorized:** Strict Spring Security JWT validation with instantaneous token revocation via persistent token blacklist.
- **Duplicate requests never execute twice:** PostgreSQL-backed idempotency engine requiring unique `Idempotency-Key` headers; verifies canonical SHA-256 payload digests; returns cached results on identical replay and 409 Conflict on payload tampering.
- **Simultaneous withdrawals cannot overspend:** PostgreSQL pessimistic write row locking (`SELECT ... FOR UPDATE`) prevents concurrent overdraft race conditions.
- **Account balances remain correct:** Strict `BigDecimal` arithmetic (scale 2, Half-Even rounding) paired with database check constraints (`chk_account_balance_non_negative`). Float and double types are prohibited.
- **Every transaction has a balanced double-entry ledger:** Every financial movement creates balanced debit and credit entries ($\sum \text{Debits} \equiv \sum \text{Credits} \equiv \text{Transaction Amount}$) utilizing institutional system clearing accounts (`SYS-CLEARING-DEP`, `SYS-CLEARING-WDL`).
- **Deadlock-Free Bidirectional Transfers:** Multi-account transfers acquire pessimistic locks deterministically in ascending Primary Key ID order (`min(id1, id2)` then `max(id1, id2)`), mathematically eliminating circular waits.
- **Failed transactions roll back completely:** Atomic Spring `@Transactional` boundaries encompass the idempotency check, account balance updates, double-entry ledger entries, and audit logging.
- **Transactions are traceable through audit records:** Append-only immutable audit trail (`audit_logs`) marked `@Immutable` at the Hibernate layer, with deletion operations disabled at the repository tier.
- **Customers cannot access other customers' accounts:** Backend `AccountOwnershipValidator` resolves the user identity strictly from the authenticated `SecurityContext`, rejecting IDOR and privilege escalation attacks with `403 Forbidden`.

---

## 2. Project Architecture & Packages

Follows a clean layered architecture with a strict separation between domain business logic, data persistence, REST communication, and security:

```text
com.ledgerline
    ├── config        # Spring Security, CORS, Web MVC configuration
    ├── controller    # Thin REST controllers accepting DTOs with Bean Validation
    ├── dto           # Request/Response objects, Error representations
    ├── entity        # JPA domain entities with DB constraints and BigDecimal types
    ├── enums         # Roles, Transaction types, Entry types, Account types
    ├── exception     # Centralized exception hierarchy & @RestControllerAdvice (RFC-7807)
    ├── repository    # Spring Data JPA repositories with row-level locking
    ├── security      # JWT tokens, authentication filters, IDOR ownership validators
    ├── service       # Core transactional business logic (@Transactional)
    ├── ledger        # DoubleEntryLedgerEngine enforcing debits == credits
    ├── audit         # Append-only immutable audit trail logging
    └── util          # Numeric scaling, canonical JSON hashing, reference generators

frontend/src/
    ├── assets/       # Static branding and icon resources
    ├── components/   # Reusable UI components (Navbar, Alert, DoubleEntryBadge, TransactionModal)
    ├── context/      # React AuthContext (JWT storage, login, register, logout)
    ├── pages/        # CustomerDashboard, AdminDashboard, AuditorDashboard, LoginPage
    ├── services/     # Axios API service clients (auth, accounts, transactions, admin, audit)
    └── styles/       # Modern fintech design system (dark/light themes, tables, cards, modal)
```

---

## 3. Seeded Demo Accounts

The database is pre-seeded via Flyway migrations (`V2` and `V3`) with test users across all three platform roles:

| Username | Password | Role | Description & Initial Accounts |
| :--- | :--- | :--- | :--- |
| `alice` | `Customer@123` | `CUSTOMER` | Regular customer. Initial savings account `ACC-1001-ALICE` ($1,000.00). |
| `bob` | `Customer@123` | `CUSTOMER` | Regular customer. Initial savings account `ACC-1002-BOB` ($1,000.00). |
| `admin` | `Admin@123` | `ADMIN` | System administrator. User management, account inspection, platform stats. |
| `auditor` | `Auditor@123` | `AUDITOR` | Regulatory auditor. Read-only access to ledger journals, balance proofs, and audit logs. |

> **Note:** The UI login page features 1-click **Quick Fill** buttons to instantly populate credentials for any of these demo roles.

---

## 4. Technology Stack

- **Backend:** Java 21 LTS, Spring Boot 3.3.5, Spring Data JPA, Hibernate 6.5, Spring Security 6.3, JJWT 0.12.6, Flyway 10.x, Maven.
- **Frontend:** React 18, Vite 5, Axios, Lucide React, Modern CSS Design System.
- **Database:** PostgreSQL 16 (HikariCP connection pool).
- **Testing:** JUnit 5, Mockito, Spring Boot Test, H2 (PostgreSQL compatibility mode).

---

## 5. Quickstart & Execution Guide

### Prerequisites
- Java 21+ (`JAVA_HOME` configured)
- Node.js 18+ & npm 9+
- PostgreSQL 16 running on port 5432 with database `ledgerline`

### 5.1 Environment Configuration
Create `.env` or set system environment variables:
```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ledgerline
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_URL=jdbc:postgresql://localhost:5432/ledgerline
JWT_SECRET=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
JWT_EXPIRATION_MS=86400000
PORT=8080
```

### 5.2 Running Backend Tests
Execute the automated test suite (60 tests, 100% passing):
```bash
./mvnw clean test
```
*(On Windows: `.\mvnw.cmd clean test`)*

### 5.3 Building & Running Backend
```bash
# Package executable JAR
./mvnw clean package -DskipTests

# Run Spring Boot Application
java -jar target/ledgerline-backend-1.0.0-SNAPSHOT.jar
```
Backend will start at `http://localhost:8080`.

### 5.4 Building & Running Frontend
```bash
cd frontend
npm install
npm run build
npm run dev
```
Frontend will be available at `http://localhost:5173`.

---

## 6. Automated Testing Suite

The backend contains **75 comprehensive automated tests** across 10 test suites:

| Test Suite | Tests | Verification Area |
| :--- | :---: | :--- |
| `DoubleEntryLedgerEngineTest` | 8 | Mathematical balance equation ($\sum D \equiv \sum C$), negative amounts, insufficient funds, system clearing validation. |
| `DoubleEntryLedgerIntegrationTest` | 6 | Double-entry invariants on deposit, withdrawal, transfer; atomicity & complete rollback on failure; immutability of historical ledger records. |
| `AuthenticationIntegrationTest` | 7 | Registration, BCrypt password hashing, JWT signing/expiry, token blacklist revocation on logout. |
| `AuthorizationIntegrationTest` | 7 | Multi-role authorization, IDOR defense (Alice accessing Bob), Auditor financial write restriction. |
| `FinancialOperationsIntegrationTest` | 8 | Deposits, withdrawals, transfers, account creation, clearing account integration. |
| `IdempotencyIntegrationTest` | 6 | Replay of identical requests without duplicate execution, 409 Conflict on payload tampering, mandatory header enforcement. |
| `ConcurrencyStressIntegrationTest` | 5 | **Multithreaded stress testing**: 10 simultaneous threads preventing overdraft; 2 simultaneous withdrawals exact race; 20 simultaneous cross-transfers with 0 deadlocks; 10 concurrent deposits with no lost updates; 10 identical simultaneous requests. |
| `AuditTrailIntegrationTest` | 13 | Append-only audit record creation, event metadata extraction (IP/User-Agent), Hibernate `@Immutable` enforcement, failed transaction auditing (`WITHDRAWAL_FAILED`), auditor-only access, paginated/filtered audit queries, account statements with debit/credit totals, statement IDOR defense, and credential sanitization. |
| `HealthControllerIntegrationTest` | 5 | Live PostgreSQL connection health check, latency probes, metadata inspection. |
| `DatabaseHealthServiceTest` | 10 | Direct JDBC health probes, latency thresholds, and failure simulation. |
| **Total** | **75** | **0 Failures, 0 Errors, 0 Skipped** |

---

## 7. Comprehensive Documentation

Detailed architecture specifications, database schemas, threat models, and API contracts:

- 🏛️ [**System Architecture & Design**](docs/architecture.md): Deep-dive into clean layered architecture, double-entry ledger engine, pessimistic row locking, and deterministic lock ordering.
- 🗄️ [**Database Design & Schema**](docs/database-design.md): Full entity-relationship diagram, table definitions, check constraints, indexes, and Flyway migration versions.
- 📡 [**REST API Documentation**](docs/api-documentation.md): Comprehensive catalog of all REST endpoints, request/response bodies, status codes, and security rules.
- 🛡️ [**Threat Model & Security Verification Matrix**](THREATS.md): 19 identified threat categories (IDOR, race conditions, replay attacks, precision exploits, audit tamper resistance, credential sanitization) mapped to automated verification tests.
- 📜 [**Prompt Engineering & Implementation Log**](PROMPTS.md): Genuine chronological records of all development phases and test execution outputs.

---

## 8. License & Assessment Attribution

Developed for the **Snovasys 2026 Fresher Hiring Assessment**.  
Repository: [https://github.com/Praneethbandi05/Ledger_Line](https://github.com/Praneethbandi05/Ledger_Line)
