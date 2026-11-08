package com.ledgerline.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ledgerline.dto.account.CreateAccountRequest;
import com.ledgerline.dto.auth.LoginRequest;
import com.ledgerline.dto.auth.RegisterRequest;
import com.ledgerline.dto.transaction.DepositRequest;
import com.ledgerline.dto.transaction.WithdrawalRequest;
import com.ledgerline.entity.Account;
import com.ledgerline.entity.AuditLog;
import com.ledgerline.entity.User;
import com.ledgerline.enums.AccountType;
import com.ledgerline.repository.AccountRepository;
import com.ledgerline.repository.AuditLogRepository;
import com.ledgerline.repository.UserRepository;
import com.ledgerline.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuditTrailIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private String aliceToken;
    private String bobToken;
    private String adminToken;
    private String auditorToken;

    @BeforeEach
    void setUp() {
        User alice = userRepository.findByUsername("alice").orElseThrow();
        User bob = userRepository.findByUsername("bob").orElseThrow();
        User admin = userRepository.findByUsername("admin").orElseThrow();
        User auditor = userRepository.findByUsername("auditor").orElseThrow();

        aliceToken = jwtTokenProvider.generateTokenFromUser(alice);
        bobToken = jwtTokenProvider.generateTokenFromUser(bob);
        adminToken = jwtTokenProvider.generateTokenFromUser(admin);
        auditorToken = jwtTokenProvider.generateTokenFromUser(auditor);
    }

    @Test
    @DisplayName("Audit Trail - Login success generates immutable audit record")
    void shouldRecordAuditLogOnSuccessfulLogin() throws Exception {
        LoginRequest loginRequest = new LoginRequest("alice", "Customer@123");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk());

        List<AuditLog> logs = auditLogRepository.findByActorUsernameOrderByCreatedAtDesc("alice");
        assertThat(logs).isNotEmpty();

        AuditLog latest = logs.get(0);
        assertThat(latest.getAction()).isEqualTo("LOGIN_SUCCESS");
        assertThat(latest.getResult()).isEqualTo("SUCCESS");
        assertThat(latest.getActorRole()).isEqualTo("CUSTOMER");
        assertThat(latest.getCreatedAt()).isNotNull();
    }

    @Test
    @DisplayName("Audit Trail - Failed login attempt generates audit record with FAILURE status")
    void shouldRecordAuditLogOnFailedLogin() throws Exception {
        LoginRequest badLogin = new LoginRequest("alice", "WrongPassword999!");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badLogin)))
                .andExpect(status().isUnauthorized());

        List<AuditLog> logs = auditLogRepository.findByActionOrderByCreatedAtDesc("LOGIN_FAILED");
        assertThat(logs).isNotEmpty();

        AuditLog latest = logs.get(0);
        assertThat(latest.getAction()).isEqualTo("LOGIN_FAILED");
        assertThat(latest.getResult()).isEqualTo("FAILURE");
        assertThat(latest.getDetails()).contains("Invalid credentials");
    }

    @Test
    @DisplayName("Audit Trail - Financial deposit generates append-only audit record")
    void shouldRecordAuditLogOnDeposit() throws Exception {
        DepositRequest request = new DepositRequest("ACC-ALICE-01", new BigDecimal("75.00"), "Audit test deposit");

        mockMvc.perform(post("/api/v1/transactions/deposit")
                        .header("Authorization", "Bearer " + aliceToken)
                        .header("Idempotency-Key", "DEP-AUDIT-" + UUID.randomUUID())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        List<AuditLog> logs = auditLogRepository.findByActionOrderByCreatedAtDesc("DEPOSIT");
        assertThat(logs).isNotEmpty();

        AuditLog latest = logs.get(0);
        assertThat(latest.getActorUsername()).isEqualTo("alice");
        assertThat(latest.getAction()).isEqualTo("DEPOSIT");
        assertThat(latest.getResourceId()).isEqualTo("ACC-ALICE-01");
        assertThat(latest.getResult()).isEqualTo("SUCCESS");
        assertThat(latest.getDetails()).contains("75.00");
    }

    @Test
    @DisplayName("Audit Trail - Auditor can view audit logs (200 OK)")
    void shouldAllowAuditorToViewAuditLogs() throws Exception {
        mockMvc.perform(get("/api/v1/audit/logs")
                        .header("Authorization", "Bearer " + auditorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))));
    }

    @Test
    @DisplayName("Audit Trail - Customer CANNOT view audit logs (403 Forbidden)")
    void shouldPreventCustomerFromViewingAuditLogs() throws Exception {
        mockMvc.perform(get("/api/v1/audit/logs")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Audit Trail - Immutability enforcement: attempting to delete audit records throws UnsupportedOperationException")
    void shouldEnforceAuditTrailImmutability() {
        AuditLog sampleLog = auditLogRepository.findAll().stream().findFirst()
                .orElseGet(() -> auditLogRepository.save(new AuditLog(
                        "system", "ADMIN", "SYSTEM_START", "SYSTEM", "SYS", "SUCCESS", "127.0.0.1", "test", "init"
                )));

        assertThatThrownBy(() -> auditLogRepository.deleteById(sampleLog.getId()))
                .isInstanceOf(UnsupportedOperationException.class)
                .hasMessageContaining("strictly append-only");

        assertThatThrownBy(() -> auditLogRepository.delete(sampleLog))
                .isInstanceOf(UnsupportedOperationException.class)
                .hasMessageContaining("strictly append-only");

        assertThatThrownBy(() -> auditLogRepository.deleteAll())
                .isInstanceOf(UnsupportedOperationException.class)
                .hasMessageContaining("strictly append-only");
    }

    @Test
    @DisplayName("Audit Trail - Failed withdrawal records audit log with REJECTED status")
    void shouldRecordAuditLogOnFailedWithdrawalDueToInsufficientFunds() throws Exception {
        WithdrawalRequest request = new WithdrawalRequest("ACC-ALICE-01", new BigDecimal("9999999.00"), "Excessive withdrawal");

        mockMvc.perform(post("/api/v1/transactions/withdraw")
                        .header("Authorization", "Bearer " + aliceToken)
                        .header("Idempotency-Key", "WDL-FAIL-" + UUID.randomUUID())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnprocessableEntity());

        List<AuditLog> logs = auditLogRepository.findByActionOrderByCreatedAtDesc("WITHDRAWAL_FAILED");
        assertThat(logs).isNotEmpty();

        AuditLog latest = logs.get(0);
        assertThat(latest.getActorUsername()).isEqualTo("alice");
        assertThat(latest.getAction()).isEqualTo("WITHDRAWAL_FAILED");
        assertThat(latest.getResult()).isEqualTo("REJECTED");
        assertThat(latest.getResourceId()).isEqualTo("ACC-ALICE-01");
        assertThat(latest.getDetails()).contains("Insufficient funds");
    }

    @Test
    @DisplayName("Audit Trail - Auditor can query audit logs with pagination and filters")
    void shouldSupportPaginationAndFilteringOnAuditLogs() throws Exception {
        // Query paginated
        mockMvc.perform(get("/api/v1/audit/logs")
                        .param("page", "0")
                        .param("size", "5")
                        .header("Authorization", "Bearer " + auditorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.pageNumber").value(0))
                .andExpect(jsonPath("$.data.pageSize").value(5))
                .andExpect(jsonPath("$.data.content").isArray())
                .andExpect(jsonPath("$.data.totalElements", greaterThanOrEqualTo(1)));

        // Query with actor filter and pagination
        mockMvc.perform(get("/api/v1/audit/logs")
                        .param("actor", "alice")
                        .param("page", "0")
                        .param("size", "10")
                        .header("Authorization", "Bearer " + auditorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").isArray());
    }

    @Test
    @DisplayName("Audit Trail / Statements - Customer can view own account statement with totals")
    void shouldReturnAccountStatementForAuthorizedCustomer() throws Exception {
        Account aliceAccount = accountRepository.findByAccountNumber("ACC-ALICE-01").orElseThrow();

        mockMvc.perform(get("/api/v1/transactions/statement/" + aliceAccount.getId())
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accountNumber").value("ACC-ALICE-01"))
                .andExpect(jsonPath("$.data.currency").value("USD"))
                .andExpect(jsonPath("$.data.totalDebits").exists())
                .andExpect(jsonPath("$.data.totalCredits").exists())
                .andExpect(jsonPath("$.data.transactions").isArray());
    }

    @Test
    @DisplayName("Audit Trail / Statements - IDOR protection: Customer cannot view another customer statement (403 Forbidden)")
    void shouldPreventCustomerFromViewingAnotherCustomerStatement() throws Exception {
        Account aliceAccount = accountRepository.findByAccountNumber("ACC-ALICE-01").orElseThrow();

        mockMvc.perform(get("/api/v1/transactions/statement/" + aliceAccount.getId())
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Audit Trail / Statements - Auditor can view any customer statement (200 OK)")
    void shouldAllowAuditorToViewAnyAccountStatement() throws Exception {
        Account aliceAccount = accountRepository.findByAccountNumber("ACC-ALICE-01").orElseThrow();

        mockMvc.perform(get("/api/v1/transactions/statement/" + aliceAccount.getId())
                        .header("Authorization", "Bearer " + auditorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accountNumber").value("ACC-ALICE-01"));
    }

    @Test
    @DisplayName("Audit Trail / Statements - Ledger statement API access control")
    void shouldAllowAuditorToViewLedgerEntriesAndPreventCustomer() throws Exception {
        // Auditor has access
        mockMvc.perform(get("/api/v1/transactions/ledger")
                        .header("Authorization", "Bearer " + auditorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());

        // Customer forbidden
        mockMvc.perform(get("/api/v1/transactions/ledger")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Audit Trail - Immutability and Security: Audit logs never contain sensitive credentials")
    void shouldNeverContainSensitiveCredentialsInAuditLogs() {
        List<AuditLog> allLogs = auditLogRepository.findAll();
        assertThat(allLogs).isNotEmpty();

        for (AuditLog logEntry : allLogs) {
            String details = logEntry.getDetails();
            if (details != null) {
                assertThat(details).doesNotContain("Customer@123")
                        .doesNotContain("WrongPassword")
                        .doesNotContain("Bearer ")
                        .doesNotContain("secret");
            }
        }
    }
}
