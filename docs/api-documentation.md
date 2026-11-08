# LEDGERLINE – Complete REST API Specification

**Project:** LEDGERLINE – Money Movement With a Ledger You Can Prove  
**Assessment:** Snovasys 2026 Fresher Hiring Assessment  
**Base Path:** `/api/v1`  
**Authentication Scheme:** Bearer JWT (`Authorization: Bearer <token>`)  
**Idempotency Header:** `Idempotency-Key: <UUID>`  
**Version:** 1.0.0  

---

## 1. Global Request & Response Standards

### 1.1 Standard Headers
| Header | Type | Description |
| :--- | :--- | :--- |
| `Authorization` | String | `Bearer <JWT>` issued by `/api/v1/auth/login`. Required on all protected endpoints. |
| `Idempotency-Key`| UUID | Mandatory on all money movement endpoints (`deposit`, `withdraw`, `transfer`). |
| `Content-Type` | String | `application/json` |

### 1.2 Unified Success Response
All endpoints (except health probes) return responses enclosed in a standard JSON wrapper:
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "timestamp": "2026-11-07T12:00:00.000000Z"
}
```

### 1.3 Standardized Error Response (RFC-7807 Aligned)
Errors return a structured error representation:
```json
{
  "timestamp": "2026-11-07T12:00:00.000000Z",
  "status": 422,
  "error": "Unprocessable Entity",
  "message": "Insufficient funds: account ACC-1234567890 has balance 50.00, required 100.00",
  "path": "/api/v1/transactions/withdraw",
  "fieldErrors": null
}
```

---

## 2. Authentication Endpoints (`/api/v1/auth`)

### 2.1 Register New Customer
- **Endpoint:** `POST /api/v1/auth/register`
- **Access:** Public
- **Description:** Registers a new user with the default role `CUSTOMER` and automatically provisions an initial active savings account. Request bodies attempting to inject elevated roles are strictly ignored.
- **Request Body:**
```json
{
  "username": "charlie",
  "password": "Password@123",
  "email": "charlie@example.com",
  "fullName": "Charlie Davies"
}
```
- **Response (201 Created):**
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
- **Description:** Validates credentials via BCrypt and generates a signed Bearer JWT token.
- **Request Body:**
```json
{
  "username": "alice",
  "password": "Customer@123"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 3,
      "username": "alice",
      "email": "alice@ledgerline.local",
      "fullName": "Alice Smith",
      "role": "CUSTOMER"
    }
  }
}
```

---

### 2.3 User Logout
- **Endpoint:** `POST /api/v1/auth/logout`
- **Access:** Authenticated (`ADMIN`, `CUSTOMER`, `AUDITOR`)
- **Description:** Hashes the presented JWT token and records it in `token_blacklist`, immediately invalidating it against future requests.
- **Response (200 OK):**
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
- **Description:** Returns profile of the user currently authenticated in the `SecurityContext`.
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 3,
    "username": "alice",
    "email": "alice@ledgerline.local",
    "fullName": "Alice Smith",
    "role": "CUSTOMER"
  }
}
```

---

## 3. Account Endpoints (`/api/v1/accounts`)

### 3.1 Get My Accounts
- **Endpoint:** `GET /api/v1/accounts/my`
- **Access:** `CUSTOMER`, `ADMIN`
- **Description:** Returns all active financial accounts owned by the authenticated caller.
- **Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "accountNumber": "ACC-1001-ALICE",
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
- **Access:** `CUSTOMER` (only if owner), `ADMIN`, `AUDITOR`
- **Description:** Retrieves account details. Customers attempting to access another customer's account receive `403 Forbidden`.
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "accountNumber": "ACC-1001-ALICE",
    "balance": 1000.00,
    "currency": "USD",
    "accountType": "SAVINGS",
    "status": "ACTIVE"
  }
}
```

---

### 3.3 Create New Account
- **Endpoint:** `POST /api/v1/accounts`
- **Access:** `CUSTOMER`, `ADMIN`
- **Description:** Provisions a new checking or savings account with a unique cryptographically generated account number.
- **Request Body:**
```json
{
  "accountType": "CHECKING",
  "currency": "USD"
}
```
- **Response (201 Created):**
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
- **Description:** Returns all accounts in the system for administrative oversight and audit inspection.

---

## 4. Financial Operations (`/api/v1/transactions`)

All financial endpoints require:
1. Header `Idempotency-Key: <UUID>`
2. Non-negative amount > 0.00
3. Caller must be the verified owner of the source account

### 4.1 Deposit Funds
- **Endpoint:** `POST /api/v1/transactions/deposit`
- **Header:** `Idempotency-Key: e1a5b82c-9a4f-42e1-9543-7f2a1b9c3d4e`
- **Access:** `CUSTOMER`, `ADMIN`
- **Description:** Deposits money into an account. Creates a balanced double-entry: debits customer account, credits `SYS-CLEARING-DEP`.
- **Request Body:**
```json
{
  "destinationAccountNumber": "ACC-1001-ALICE",
  "amount": 150.00,
  "description": "Salary deposit"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Deposit processed successfully",
  "data": {
    "transactionReference": "TX-20261107-7B1A2C3D",
    "transactionType": "DEPOSIT",
    "status": "COMPLETED",
    "amount": 150.00,
    "destinationAccountNumber": "ACC-1001-ALICE",
    "description": "Salary deposit",
    "createdAt": "2026-11-07T12:15:30Z",
    "ledgerEntries": [
      {
        "entryReference": "ENT-20261107-1A2B",
        "accountNumber": "ACC-1001-ALICE",
        "entryType": "DEBIT",
        "amount": 150.00,
        "balanceAfter": 1150.00
      },
      {
        "entryReference": "ENT-20261107-3C4D",
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
- **Header:** `Idempotency-Key: f2b6c93d-0b5a-53f2-0654-8a3b2c0d4e5f`
- **Access:** `CUSTOMER` (owner only), `ADMIN`
- **Description:** Withdraws money from an account under pessimistic row locking. Rejects if balance < amount. Creates balanced double-entry: credits customer account, debits `SYS-CLEARING-WDL`.
- **Request Body:**
```json
{
  "sourceAccountNumber": "ACC-1001-ALICE",
  "amount": 50.00,
  "description": "ATM cash withdrawal"
}
```

---

### 4.3 Internal Transfer Between Accounts
- **Endpoint:** `POST /api/v1/transactions/transfer`
- **Header:** `Idempotency-Key: a3c7d04e-1c6b-64a3-1765-9b4c3d1e5f6a`
- **Access:** `CUSTOMER` (owner of source account), `ADMIN`
- **Description:** Transfers funds between two accounts using deterministic lock ordering. Credits source account, debits destination account.
- **Request Body:**
```json
{
  "sourceAccountNumber": "ACC-1001-ALICE",
  "destinationAccountNumber": "ACC-1002-BOB",
  "amount": 100.00,
  "description": "Split dinner bill"
}
```

---

## 5. Transaction History & Auditor Endpoints

### 5.1 My Transactions
- **Endpoint:** `GET /api/v1/transactions/my`
- **Access:** `CUSTOMER`, `ADMIN`
- **Description:** Returns financial transactions initiated by or affecting the caller's accounts.

---

### 5.2 Account Transaction History
- **Endpoint:** `GET /api/v1/transactions/account/{accountId}`
- **Access:** `CUSTOMER` (owner), `ADMIN`, `AUDITOR`
- **Description:** Returns the chronological transaction list for the specified account. Enforces IDOR access controls.

---

### 5.3 Official Account Statement
- **Endpoint:** `GET /api/v1/transactions/statement/{accountId}`
- **Access:** `CUSTOMER` (owner), `ADMIN`, `AUDITOR`
- **Description:** Returns an official financial statement for the account, computing total debits, total credits, net balance, transaction count, and itemized transaction records.
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Account statement generated successfully",
  "data": {
    "accountNumber": "ACC-ALICE-01",
    "accountType": "SAVINGS",
    "currency": "USD",
    "currentBalance": 1075.00,
    "totalDebits": 0.00,
    "totalCredits": 75.00,
    "transactionCount": 1,
    "transactions": [ ... ]
  }
}
```

---

### 5.4 Global Transaction Overview
- **Endpoint:** `GET /api/v1/transactions/all`
- **Access:** `ADMIN`, `AUDITOR`
- **Description:** Comprehensive ledger overview across all platform accounts.

---

### 5.5 Double-Entry Ledger Journal Statement
- **Endpoint:** `GET /api/v1/transactions/ledger`
- **Access:** `AUDITOR`, `ADMIN`
- **Description:** Returns complete double-entry debit and credit records across all accounts with mathematical balance proof ($\sum Debits \equiv \sum Credits$). Customer access is rejected with HTTP 403 Forbidden.

---

## 6. Audit Trail Endpoints (`/api/v1/audit`)

### 6.1 Query Audit Logs (With Pagination and Multi-Attribute Filtering)
- **Endpoint:** `GET /api/v1/audit/logs`
- **Access:** `AUDITOR`, `ADMIN`
- **Query Parameters:**
  - `actor` (optional): Filter logs by initiating username (e.g. `alice`).
  - `action` (optional): Filter by event action (e.g. `DEPOSIT`, `WITHDRAWAL`, `LOGIN_FAILED`, `WITHDRAWAL_FAILED`).
  - `resourceId` (optional): Filter by target resource reference (e.g. `ACC-ALICE-01`).
  - `page` (optional): Zero-based page index (e.g. `0`). When specified, returns a paginated metadata response.
  - `size` (optional, default `20`, max `100`): Number of records per page.
- **Description:** Returns append-only immutable audit trail records. Customers receive HTTP 403 Forbidden. Deletion or updates to records are strictly prohibited at both the application and database level.
- **Response (Paginated 200 OK):**
```json
{
  "success": true,
  "message": "Audit trail logs retrieved (paginated)",
  "data": {
    "content": [
      {
        "id": 142,
        "actorUsername": "alice",
        "actorRole": "CUSTOMER",
        "action": "WITHDRAWAL_FAILED",
        "resourceType": "ACCOUNT",
        "resourceId": "ACC-ALICE-01",
        "result": "REJECTED",
        "ipAddress": "127.0.0.1",
        "userAgent": "PostmanRuntime/7.39.0",
        "details": "Withdrawal of $999999.00 rejected: Insufficient funds in account ACC-ALICE-01",
        "createdAt": "2026-11-08T10:17:28.420Z"
      }
    ],
    "pageNumber": 0,
    "pageSize": 20,
    "totalElements": 48,
    "totalPages": 3,
    "isFirst": true,
    "isLast": false,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

---

### 6.2 Filter by Actor
- **Endpoint:** `GET /api/v1/audit/logs/actor/{actor}`
- **Access:** `AUDITOR`, `ADMIN`

---

### 6.3 Filter by Action
- **Endpoint:** `GET /api/v1/audit/logs/action/{action}`
- **Access:** `AUDITOR`, `ADMIN`

---

## 7. Admin Endpoints (`/api/v1/admin`)

### 7.1 List All Users
- **Endpoint:** `GET /api/v1/admin/users`
- **Access:** `ADMIN` only
- **Description:** Lists all registered users, roles, email addresses, and enabled/disabled status.

---

### 7.2 Toggle User Status
- **Endpoint:** `PATCH /api/v1/admin/users/{userId}/status?enabled={true|false}`
- **Access:** `ADMIN` only
- **Description:** Suspends or activates a user. Disabled users are rejected at authentication.

---

## 8. Health & System Probes (`/api/v1/health`)

### 8.1 System Health Probe
- **Endpoint:** `GET /api/v1/health`
- **Access:** Public
- **Description:** Returns application status, runtime memory statistics, JVM version, and database connectivity.

---

### 8.2 Database Ping Probe
- **Endpoint:** `GET /api/v1/health/db`
- **Access:** Public
- **Description:** Performs active PostgreSQL ping and `SELECT 1` query probe with roundtrip latency in milliseconds.
