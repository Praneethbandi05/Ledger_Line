# LEDGERLINE – Money Movement With a Ledger You Can Prove

LEDGERLINE is a financial transaction management platform engineered to guarantee double-entry accounting integrity, idempotency, strict concurrency controls (preventing double-spending), audit immutability, and role-based security.

Developed for the Snovasys 2026 hiring assessment.

---

## 1. System Architecture & Foundation

The system follows a clean layered architecture with a strict separation between domain business logic, data persistence, REST communication, and security:

```text
com.ledgerline
    ├── config        # Spring Security, CORS, Web MVC configuration
    ├── controller    # Thin REST controllers (DTOs, Bean Validation)
    ├── dto           # Request/Response objects, Error representations
    ├── entity        # JPA domain entities with DB constraints
    ├── enums         # Roles, Transaction types, Entry types
    ├── exception     # Centralized exception hierarchy & @RestControllerAdvice
    ├── repository    # Spring Data JPA repositories with row-level locking
    ├── security      # JWT tokens, authentication filters, ownership validators
    ├── service       # Core transactional business logic
    ├── util          # Numeric scaling, cryptographic hashing, formatting
    ├── audit         # Append-only audit trail logging
    └── ledger        # Double-entry ledger invariant engine
```

### Technology Stack
- **Backend:** Java 21 LTS, Spring Boot 3.3.5, Spring Data JPA, Hibernate 6.5, Spring Security 6.3, Flyway Migration 10.x, Maven Wrapper.
- **Frontend:** React 18, Vite 5, Axios, Lucide Icons, Modern CSS Design System.
- **Database:** PostgreSQL 16 (local instance on port 5432).
- **Testing:** JUnit 5, Mockito, Spring Boot Test, H2 (PostgreSQL compatibility mode for hermetic slice testing).

---

## 2. Implemented Features

### Phase 1: Project Foundation
1. **Java 21 & Spring Boot 3.3.5 Configuration:** Configured Maven multi-stage build targeting Java 21 bytecode with strict compiler parameter retention.
2. **PostgreSQL Database Connection:** Configured HikariCP connection pooling connecting to PostgreSQL 16 (`ledgerline` database) using dynamic environment variables.
3. **Database Migration via Flyway:** Flyway-managed schema changes (`V1__init_foundation.sql`, `V2__auth_and_accounts_schema.sql`) ensuring reproducible version-controlled DDL. Hibernate DDL auto is strictly set to `validate` (never `create` or `create-drop`).
4. **Database Connection Health Check:** Dedicated service `DatabaseHealthService` performing active JDBC connection validation (`isValid`), metadata inspection, and `SELECT 1` query probes (`GET /api/v1/health`, `GET /api/v1/health/db`).
5. **Centralized Global Exception Handling:** Unified `@RestControllerAdvice` implementing RFC-7807/ProblemDetail-aligned error payloads with field-level validation errors.
6. **Request Validation:** Integrated Jakarta Bean Validation (`@NotNull`, `@NotBlank`, `@Positive`, `@DecimalMin`).
7. **Frontend Scaffolding:** React 18 + Vite foundation with responsive fintech layout and proxy configuration to backend API.

### Phase 2: Authentication & Authorisation (Role-Based Access & IDOR Defense)
1. **BCrypt Password Hashing:** All user passwords hashed via `BCryptPasswordEncoder` with individual cryptographic salts. Password hashes are never exposed in responses or logs.
2. **Stateless JWT Authentication:** JJWT 0.12.6 with HMAC-SHA256 signatures, extracting subject, user ID, and role.
3. **Token Blacklist & Revocation Strategy:** Persistent SHA-256 token hashing table (`token_blacklist`) enabling instantaneous token invalidation upon user logout.
4. **Role-Based Authorization:**
   - `ADMIN`: Manage users, view system statistics, and inspect accounts.
   - `CUSTOMER`: Access strictly their own accounts, balances, and transactions.
   - `AUDITOR`: Strictly read-only visibility into accounts and audit records. Prohibited from money movement or account mutations.
5. **IDOR & Privilege Escalation Defenses:**
   - `AccountOwnershipValidator` enforces account ownership by extracting user ID directly from `SecurityContextHolder`. Request bodies are never trusted for identity or account ownership.
   - Registration strictly enforces the `CUSTOMER` role, blocking privilege escalation attempts.

---

## 5. Security & API Reference

### Authentication Endpoints (`/api/v1/auth`)
- `POST /api/v1/auth/register`: Public. Registers a customer and auto-provisions an initial active savings account.
- `POST /api/v1/auth/login`: Public. Validates credentials and returns signed Bearer JWT.
- `POST /api/v1/auth/logout`: Authenticated. Revokes the presented token into the persistent blacklist.
- `GET /api/v1/auth/me`: Authenticated. Returns current user profile derived from the validated security context.

### Account Endpoints (`/api/v1/accounts`)
- `GET /api/v1/accounts/my`: `CUSTOMER`, `ADMIN`. Returns accounts belonging strictly to the authenticated user.
- `GET /api/v1/accounts/{accountId}`: `CUSTOMER`, `ADMIN`, `AUDITOR`. Returns account details only if ownership passes validation (IDOR protection).
- `POST /api/v1/accounts`: `CUSTOMER`, `ADMIN`. Creates a new account for the authenticated user.
- `GET /api/v1/accounts/all`: `ADMIN`, `AUDITOR`. Returns all system accounts for administrative or audit inspection.
- `POST /api/v1/accounts/{accountId}/financial-operation-check`: Restricted. Validates that auditors and non-owner customers cannot execute financial actions (403 Forbidden).

### Admin Endpoints (`/api/v1/admin`)
- `GET /api/v1/admin/users`: `ADMIN` only. Lists all registered users and roles.
- `PATCH /api/v1/admin/users/{userId}/status?enabled={true|false}`: `ADMIN` only. Enables or disables user accounts.

---

## 3. Environment Configuration

All database credentials and secrets are managed strictly through environment variables. A template is provided in `.env.example`:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ledgerline
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_URL=jdbc:postgresql://localhost:5432/ledgerline

# JWT Authentication
JWT_SECRET=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
JWT_EXPIRATION_MS=86400000

# Application Server
PORT=8080
SPRING_PROFILES_ACTIVE=dev
```

---

## 4. Execution & Build Instructions

### Prerequisites
- JDK 21+ (`JAVA_HOME` set)
- Node.js 18+ & npm 9+
- PostgreSQL 16 running on port 5432

### Running Backend Tests
Execute all automated unit and integration tests:
```bash
./mvnw clean test
```
*(On Windows CMD/PowerShell: `.\mvnw.cmd clean test`)*

### Building Backend Package
Package the executable Spring Boot archive:
```bash
./mvnw clean package
```

### Running Backend Server
Run the packaged jar against PostgreSQL:
```bash
java -jar target/ledgerline-backend-1.0.0-SNAPSHOT.jar
```

### Verifying Health Check
Query the live database health check:
```bash
curl -X GET http://localhost:8080/api/v1/health
curl -X GET http://localhost:8080/api/v1/health/db
```

Sample Healthy Response:
```json
{
  "status": "UP",
  "application": "ledgerline-backend",
  "timestamp": "2026-11-07T10:29:32.420503Z",
  "components": {
    "database": {
      "status": "UP",
      "database": "PostgreSQL",
      "version": "16.2",
      "latencyMs": 1,
      "url": "jdbc:postgresql://localhost:5432/ledgerline",
      "validationQuery": "SELECT 1 (SUCCESS)"
    },
    "memory": {
      "totalMb": 76,
      "maxMb": 1976,
      "freeMb": 32,
      "usedMb": 43
    },
    "runtime": {
      "javaVersion": "23.0.2",
      "javaVendor": "Oracle Corporation",
      "os": "Windows 11 amd64"
    }
  }
}
```

### Building and Running Frontend
```bash
cd frontend
npm install
npm run build
npm run dev
```
Access the UI at `http://localhost:5173`.
