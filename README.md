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

## Running and Deployment

### Prerequisites

- Java 21 or later (`JAVA_HOME` set)
- Node.js 18 or later with npm
- PostgreSQL 16 running on port 5432 with database `ledgerline` (or Docker engine)

---

### Local Development Setup

#### 1. Database
Ensure PostgreSQL is running and a clean database named `ledgerline` exists:
```bash
# Using local PostgreSQL psql CLI
psql -U postgres -c "CREATE DATABASE ledgerline;"
```
*(Flyway migrations automatically run on backend boot to create all tables, indexes, and initial clearing accounts).*

#### 2. Backend
Launch using the Maven wrapper or helper script:
```bash
# Run test suite (75 automated integration tests)
./mvnw clean test

# Build and run the Spring Boot service
./mvnw clean package -DskipTests
java -jar target/ledgerline-backend-1.0.0-SNAPSHOT.jar
```
*Windows one-click launcher:* Double-click `run-backend.bat` or execute `.\run-backend.ps1`.  
The backend starts at `http://localhost:8080`.

#### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
*Windows one-click launcher:* Double-click `run-frontend.bat` or execute `.\run-frontend.ps1`.  
The UI opens at `http://localhost:5173` with automatic API proxying to `http://localhost:8080`.

---

### Production Deployment Options

#### Option A: Full-Stack Docker Compose (Recommended for Containerized Environments)
The repository includes a multi-service `docker-compose.yml` that provisions PostgreSQL 16, compiles and runs the Spring Boot JAR with Temurin 21 JRE, and builds the React application served via Nginx with automated reverse proxying:

```bash
# Build and launch all three services in detached mode
docker compose up --build -d

# Check live service status and health probes
docker compose ps

# View real-time logs
docker compose logs -f backend
```

- **Frontend:** `http://localhost:3000` (Nginx serving SPA and proxying `/api` calls)
- **Backend API:** `http://localhost:8080`
- **PostgreSQL Database:** `localhost:5432`

To shut down:
```bash
docker compose down
```

---

#### Option B: Split Cloud Deployment (Railway / Render + Vercel / Netlify)

##### Backend Service (Railway / Render / AWS ECS / Fly.io):
1. **Source:** Connect your GitHub repository.
2. **Build Type:** Dockerfile (uses root `Dockerfile`) or Native Java 21 Maven.
3. **Environment Variables:**
   - `SPRING_DATASOURCE_URL`: Managed PostgreSQL connection string (`jdbc:postgresql://<host>:<port>/<dbname>`).
   - `SPRING_DATASOURCE_USERNAME`: Database username.
   - `SPRING_DATASOURCE_PASSWORD`: Database password.
   - `SPRING_PROFILES_ACTIVE`: `prod`
   - `JWT_SECRET`: 256-bit secret key (generate with `openssl rand -hex 32`).
   - `JWT_EXPIRATION_MS`: `86400000` (24 hours).
   - `PORT`: `8080` (or injected by platform `$PORT`).
4. **Health Check Path:** `/api/v1/health`

##### Frontend Client (Vercel / Netlify):
1. **Source:** Connect GitHub repository.
2. **Root Directory:** Set to `frontend`.
3. **Build Command:** `npm run build`
4. **Output Directory:** `dist`
5. **Environment Variable:**
   - `VITE_API_URL`: Full URL of deployed backend, e.g. `https://api.ledgerline.yourdomain.com/api/v1`
6. **SPA Routing:** `vercel.json` and `public/_redirects` are already committed to route all paths to `/index.html`.

---

#### Option C: Traditional Linux VM / Host (Ubuntu / Debian / Systemd)

##### 1. Production JAR Compilation:
```bash
./mvnw clean package -DskipTests
sudo cp target/ledgerline-backend-1.0.0-SNAPSHOT.jar /opt/ledgerline/app.jar
```

##### 2. Systemd Service (`/etc/systemd/system/ledgerline.service`):
```ini
[Unit]
Description=Balance Vault Financial Ledger Backend
After=network.target postgresql.service

[Service]
User=ledgerline
WorkingDirectory=/opt/ledgerline
ExecStart=/usr/bin/java -Xms512m -Xmx1024m -jar /opt/ledgerline/app.jar
Restart=always
RestartSec=10
Environment="SPRING_PROFILES_ACTIVE=prod"
Environment="DB_URL=jdbc:postgresql://localhost:5432/ledgerline"
Environment="DB_USERNAME=postgres"
Environment="DB_PASSWORD=your_production_password"
Environment="JWT_SECRET=your_generated_256_bit_secret"

[Install]
WantedBy=multi-user.target
```
Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now ledgerline.service
```

##### 3. Nginx Reverse Proxy with SSL (`/etc/nginx/sites-available/ledgerline`):
```nginx
server {
    listen 80;
    server_name ledgerline.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ledgerline.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/ledgerline.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ledgerline.yourdomain.com/privkey.pem;

    # Frontend Static Files
    location / {
        root /var/www/ledgerline-frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

### Pre-Deployment Security & Verification Checklist

- [ ] **Cryptographic Secret:** Replaced demo `JWT_SECRET` with a freshly generated 256-bit hexadecimal string (`openssl rand -hex 32`).
- [ ] **Database Credentials:** Default PostgreSQL `postgres` / `postgrespassword` replaced with least-privilege production credentials.
- [ ] **Flyway Migration Audit:** Run `./mvnw flyway:info` or inspect `flyway_schema_history` table to confirm all migrations (V1 through V5) applied successfully.
- [ ] **Health Endpoint Verification:** Query `GET /api/v1/health` to confirm active database connectivity and low latency response.
- [ ] **CORS Origins:** Verified that `allowedOriginPatterns` matches production frontend domain.
- [ ] **Automated Backups:** Scheduled automated PostgreSQL backups using WAL-G, AWS RDS automated snapshots, or periodic `pg_dump`:
  ```bash
  pg_dump -U postgres -d ledgerline -Fc -f "/backups/ledgerline_$(date +%Y%m%d_%H%M%S).dump"
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
