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

## 2. Implemented Features (Phase 1: Project Foundation)

1. **Java 21 & Spring Boot 3.3.5 Configuration:** Configured Maven multi-stage build targeting Java 21 bytecode with strict compiler parameter retention.
2. **PostgreSQL Database Connection:** Configured HikariCP connection pooling connecting to PostgreSQL 16 (`ledgerline` database) using dynamic environment variables.
3. **Database Migration via Flyway:** Flyway-managed schema changes (`V1__init_foundation.sql`) ensuring reproducible version-controlled DDL. Hibernate DDL auto is strictly set to `validate` (never `create` or `create-drop`).
4. **Database Connection Health Check:**
   - Dedicated service `DatabaseHealthService` performing active JDBC connection validation (`isValid`), metadata inspection, and `SELECT 1` query probes.
   - Real-time endpoints at `GET /api/v1/health` and `GET /api/v1/health/db`.
5. **Centralized Global Exception Handling:**
   - Unified `@RestControllerAdvice` implementing RFC-7807/ProblemDetail-aligned error payloads (`ErrorResponse`).
   - Detailed field-by-field validation error capture (`ValidationErrorItem`).
   - Graceful handling of `MethodArgumentNotValidException`, `ConstraintViolationException`, `HttpMessageNotReadableException`, `HttpRequestMethodNotSupportedException`, `AccessDeniedException`, and unexpected server errors without leaking internal stack traces.
6. **Request Validation:** Integrated Jakarta Bean Validation (`@NotNull`, `@NotBlank`, `@Positive`, `@DecimalMin`) with monetary constraints.
7. **Frontend Scaffolding:** React 18 + Vite foundation with responsive fintech layout and proxy configuration to backend API.

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
