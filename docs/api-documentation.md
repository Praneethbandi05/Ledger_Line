# REST API Specification — Balance Vault

**Version:** 1.0.0  
**Base Path:** `/api/v1`  
**Authentication:** Bearer JWT (`Authorization: Bearer <token>`)  
**Idempotency Header:** `Idempotency-Key: <UUID>`  

---

## 1. Request and Response Standards

### 1.1 HTTP Headers

| Header | Type | Description |
| :--- | :--- | :--- |
| `Authorization` | String | `Bearer <JWT>` issued by `/api/v1/auth/login`. Mandatory on all secured endpoints. |
| `Idempotency-Key` | UUID | Client-generated UUID required on all money movement endpoints (`deposit`, `withdraw`, `transfer`). |
| `Content-Type` | String | Must be `application/json` for requests carrying payloads. |

### 1.2 Standard Success Response Structure

All operational endpoints wrap payloads in a standardized JSON response:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "timestamp": "2026-11-11T12:00:00.000000Z"
}
```

### 1.3 Standard Error Response Structure (RFC-7807 Aligned)

When an error occurs, the server responds with a consistent structured error representation:

```json
{
  "timestamp": "2026-11-11T12:00:00.000000Z",
  "status": 422,
  "error": "Unprocessable Entity",
  "message": "Insufficient funds: account ACC-ALICE-01 has balance $50.00, required $100.00",
  "path": "/api/v1/transactions/withdraw",
  "fieldErrors": null
}
```

---

## 2. Authentication and Profile Endpoints (`/api/v1/auth`)

### 2.1 Customer Registration
- **Endpoint:** `POST /api/v1/auth/register`
- **Access:** Public
- **Description:** Registers a new user with the default role `CUSTOMER` and provisions an initial savings account. Attempts to inject elevated roles in the request body are ignored.
- **Request Body:**
```json
{
  "username": "charlie",
  "password": "Password@123",
  "email": "charlie@example.com",
  "fullName": "Charlie Davies"
}
```
- **Response (`201 Created`):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 5,
      "username": "charlie",
      "email": "charlie@example.com",
      "fullName": "Charlie Davies",
      "role": "CUSTOMER"
    }
  }
}
```

---

### 2.2 User Login
- **Endpoint:** `POST /api/v1/auth/login`
- **Access:** Public
- **Description:** Verifies credentials against salted BCrypt hashes and generates an HMAC-SHA256 signed JWT.
- **Request Body:**
```json
{
  "username": "alice",
  "password": "Customer@123"
}
```
- **Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 3,
      "username": "alice",
      "email": "alice@customer.com",
      "fullName": "Alice Smith",
      "role": "CUSTOMER"
    }
  }
}
```

---

### 2.3 User Logout
- **Endpoint:** `POST /api/v1/auth/logout`
- **Access:** Authenticated
- **Description:** Computes the SHA-256 hash of the presented JWT and persists it to the `token_blacklist` table, invalidating the session immediately.
- **Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Logged out successfully. Token has been invalidated.",
  "data": null
}
```

---

### 2.4 Current User Profile
- **Endpoint:** `GET /api/v1/auth/me`
- **Access:** Authenticated
- **Description:** Retrieves the profile of the user currently authenticated in the `SecurityContext`.
- **Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "id": 3,
    "username": "alice",
    "email": "alice@customer.com",
    "fullName": "Alice Smith",
    "role": "CUSTOMER"
  }
}
```

---

## 3. Account Management Endpoints (`/api/v1/accounts`)

### 3.1 Get My Accounts
- **Endpoint:** `GET /api/v1/accounts/my`
- **Access:** `CUSTOMER`, `ADMIN`
- **Description:** Returns all active financial accounts owned by the authenticated caller.
- **Response (`200 OK`):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "accountNumber": "ACC-ALICE-01",
      "balance": 1000.00,
      "currency": "USD",
      "accountType": "SAVINGS",
      "status": "ACTIVE",
      "ownerUsername": "alice"
    }
  ]
}
```

---

### 3.2 Get Account by ID (IDOR Protected)
- **Endpoint:** `GET /api/v1/accounts/{accountId}`
- **Access:** `CUSTOMER` (owner only), `ADMIN`, `AUDITOR`
- **Description:** Retrieves account details. Customers attempting to query accounts belonging to other users receive `403 Forbidden`.

---

### 3.3 Request New Account
- **Endpoint:** `POST /api/v1/accounts`
- **Access:** `CUSTOMER`, `ADMIN`
- **Description:** Requests a new checking or savings account with a unique cryptographically generated account number.
- **Request Body:**
```json
{
  "accountType": "CHECKING",
  "currency": "USD"
}
```
- **Response (`201 Created`):**
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "id": 8,
    "accountNumber": "ACC-7839201948",
    "balance": 0.00,
    "currency": "USD",
    "accountType": "CHECKING",
    "status": "ACTIVE"
  }
}
```

---

### 3.4 List All Accounts
- **Endpoint:** `GET /api/v1/accounts/all`
- **Access:** `ADMIN`, `AUDITOR`
- **Description:** Returns all customer and clearing accounts for administrative governance and audit oversight.

---

## 4. Money Movement Endpoints (`/api/v1/transactions`)

All financial endpoints enforce:
1. Mandatory `Idempotency-Key` header with client UUID.
2. Positive decimal amount strictly greater than `$0.00` using `BigDecimal`.
3. Ownership validation: callers can only debit accounts they own.

### 4.1 Deposit Funds
- **Endpoint:** `POST /api/v1/transactions/deposit`
- **Header:** `Idempotency-Key: <UUID>`
- **Access:** `CUSTOMER`, `ADMIN`
- **Description:** Credits the destination account and debits the institutional clearing counterparty `SYS-CLEARING-DEP`, creating balanced journal records.
- **Request Body:**
```json
{
  "accountNumber": "ACC-ALICE-01",
  "amount": 150.00,
  "description": "Salary deposit"
}
```
- **Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Deposit processed successfully",
  "data": {
    "reference": "DEP-1794301928-829104",
    "transactionType": "DEPOSIT",
    "status": "COMPLETED",
    "amount": 150.00,
    "destinationAccountNumber": "ACC-ALICE-01",
    "description": "Salary deposit",
    "createdAt": "2026-11-11T12:15:30Z",
    "ledgerEntries": [
      {
        "entryReference": "ENT-1794301928-1",
        "accountNumber": "ACC-ALICE-01",
        "entryType": "DEBIT",
        "amount": 150.00,
        "balanceAfter": 1150.00
      },
      {
        "entryReference": "ENT-1794301928-2",
        "accountNumber": "SYS-CLEARING-DEP",
        "entryType": "CREDIT",
        "amount": 150.00,
        "balanceAfter": 150.00
      }
    ]
  }
}
```

---

### 4.2 Withdraw Funds
- **Endpoint:** `POST /api/v1/transactions/withdraw`
- **Header:** `Idempotency-Key: <UUID>`
- **Access:** `CUSTOMER` (owner only), `ADMIN`
- **Description:** Acquires a pessimistic lock on the source account. Rejects if balance < amount. Credits customer account and debits `SYS-CLEARING-WDL`.
- **Request Body:**
```json
{
  "accountNumber": "ACC-ALICE-01",
  "amount": 50.00,
  "description": "ATM cash withdrawal"
}
```

---

### 4.3 Internal Transfer Between Accounts
- **Endpoint:** `POST /api/v1/transactions/transfer`
- **Header:** `Idempotency-Key: <UUID>`
- **Access:** `CUSTOMER` (owner of source account), `ADMIN`
- **Description:** Transfers funds between two accounts using deterministic ascending primary-key lock ordering to prevent deadlocks.
- **Request Body:**
```json
{
  "sourceAccountNumber": "ACC-ALICE-01",
  "destinationAccountNumber": "ACC-BOB-01",
  "amount": 100.00,
  "description": "Invoice payment"
}
```

---

## 5. Ledger Statements and Auditor Endpoints

### 5.1 My Transactions
- **Endpoint:** `GET /api/v1/transactions/my`
- **Access:** `CUSTOMER`, `ADMIN`
- **Description:** Returns the transaction history of the authenticated user.

---

### 5.2 Account Transaction Statement
- **Endpoint:** `GET /api/v1/transactions/statement/{accountId}`
- **Access:** `CUSTOMER` (owner), `ADMIN`, `AUDITOR`
- **Description:** Generates an official balance statement with starting balance, period debits and credits, closing balance, and itemized transaction lines.
- **Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Account statement generated successfully",
  "data": {
    "accountNumber": "ACC-ALICE-01",
    "accountType": "SAVINGS",
    "currency": "USD",
    "startingBalance": 0.00,
    "closingBalance": 1000.00,
    "totalDebits": 60.00,
    "totalCredits": 1060.00,
    "transactions": [ ... ]
  }
}
```

---

### 5.3 Double-Entry Ledger Journal
- **Endpoint:** `GET /api/v1/transactions/ledger`
- **Access:** `AUDITOR`, `ADMIN`
- **Description:** Returns all paired debit and credit entries across all accounts, proving mathematical ledger equality ($\sum \text{Debits} \equiv \sum \text{Credits}$). Customer access is rejected with `403 Forbidden`.

---

## 6. Audit Trail Endpoints (`/api/v1/audit`)

### 6.1 Query Audit Logs (With Pagination and Filtering)
- **Endpoint:** `GET /api/v1/audit/logs`
- **Access:** `AUDITOR`, `ADMIN`
- **Query Parameters:**
  - `actor` (optional): Filter by username.
  - `action` (optional): Filter by event type (`LOGIN_SUCCESS`, `TRANSFER`, `WITHDRAWAL_FAILED`).
  - `resourceId` (optional): Filter by affected account or transaction reference.
  - `page` (optional, default `0`): Zero-based page index.
  - `size` (optional, default `20`): Page size.
- **Description:** Returns immutable audit records. Customer access returns `403 Forbidden`. Audit records cannot be modified or deleted.

---

## 7. Administrative Endpoints (`/api/v1/admin`)

### 7.1 List Users
- **Endpoint:** `GET /api/v1/admin/users`
- **Access:** `ADMIN`
- **Description:** Lists all registered users, roles, email addresses, and active/disabled statuses.

---

### 7.2 Toggle User Status
- **Endpoint:** `PATCH /api/v1/admin/users/{userId}/status?enabled={true|false}`
- **Access:** `ADMIN`
- **Description:** Suspends or reactivates a user account. Disabled accounts cannot log in or submit requests.

---

## 8. Health and Monitoring Probes (`/api/v1/health`)

### 8.1 System Health Probe
- **Endpoint:** `GET /api/v1/health`
- **Access:** Public
- **Description:** Returns JVM uptime, memory statistics, and overall application health.

### 8.2 Database Ping Probe
- **Endpoint:** `GET /api/v1/health/db`
- **Access:** Public
- **Description:** Executes a live `SELECT 1` query probe against PostgreSQL and reports round-trip latency in milliseconds.
