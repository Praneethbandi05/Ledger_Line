package com.ledgerline.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ledgerline.dto.transaction.DepositRequest;
import com.ledgerline.dto.transaction.TransferRequest;
import com.ledgerline.dto.transaction.WithdrawalRequest;
import com.ledgerline.entity.Account;
import com.ledgerline.entity.IdempotencyKey;
import com.ledgerline.entity.User;
import com.ledgerline.repository.AccountRepository;
import com.ledgerline.repository.IdempotencyKeyRepository;
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
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class IdempotencyIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private IdempotencyKeyRepository idempotencyKeyRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private String aliceToken;
    private Account aliceAccount;
    private Account bobAccount;

    @BeforeEach
    void setUp() {
        User alice = userRepository.findByUsername("alice").orElseThrow();
        aliceToken = jwtTokenProvider.generateTokenFromUser(alice);

        aliceAccount = accountRepository.findByAccountNumber("ACC-ALICE-01").orElseThrow();
        bobAccount = accountRepository.findByAccountNumber("ACC-BOB-01").orElseThrow();

        aliceAccount.setBalance(new BigDecimal("1000.00"));
        bobAccount.setBalance(new BigDecimal("500.00"));
        accountRepository.save(aliceAccount);
        accountRepository.save(bobAccount);
    }

    @Test
    @DisplayName("Idempotency - Missing Idempotency-Key header must return 400 Bad Request")
    void shouldRejectRequestWhenIdempotencyKeyHeaderIsMissing() throws Exception {
        DepositRequest request = new DepositRequest("ACC-ALICE-01", new BigDecimal("100.00"), "Deposit without key");

        mockMvc.perform(post("/api/v1/transactions/deposit")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message", containsString("Missing required 'Idempotency-Key' HTTP header")));
    }

    @Test
    @DisplayName("Idempotency - Invalid format Idempotency-Key must return 422/400")
    void shouldRejectShortIdempotencyKey() throws Exception {
        DepositRequest request = new DepositRequest("ACC-ALICE-01", new BigDecimal("100.00"), "Deposit short key");

        mockMvc.perform(post("/api/v1/transactions/deposit")
                        .header("Authorization", "Bearer " + aliceToken)
                        .header("Idempotency-Key", "short")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.status").value(422))
                .andExpect(jsonPath("$.message", containsString("Idempotency-Key must be between 8 and 100 characters")));
    }

    @Test
    @DisplayName("Idempotency - Repeated identical deposit returns original result and does NOT double-credit")
    void shouldReplayDepositWithoutDoubleCredit() throws Exception {
        String idempotencyKey = "DEP-" + UUID.randomUUID();
        DepositRequest request = new DepositRequest("ACC-ALICE-01", new BigDecimal("200.00"), "Salary check");

        // First attempt - must succeed with 201 Created
        MvcResult firstResult = mockMvc.perform(post("/api/v1/transactions/deposit")
                        .header("Authorization", "Bearer " + aliceToken)
                        .header("Idempotency-Key", idempotencyKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.amount").value(200.00))
                .andExpect(jsonPath("$.data.status").value("COMPLETED"))
                .andReturn();

        String firstResponseBody = firstResult.getResponse().getContentAsString();
        String firstReference = objectMapper.readTree(firstResponseBody).path("data").path("reference").asText();

        // Check account balance: $1000 + $200 = $1200
        Account afterFirst = accountRepository.findByAccountNumber("ACC-ALICE-01").orElseThrow();
        assertThat(afterFirst.getBalance()).isEqualByComparingTo("1200.00");

        // Verify key is in PostgreSQL
        Optional<IdempotencyKey> savedKey = idempotencyKeyRepository.findByIdempotencyKey(idempotencyKey);
        assertThat(savedKey).isPresent();
        assertThat(savedKey.get().getResponseStatus()).isEqualTo(201);

        // Second attempt with exact same key and payload - must return cached result
        MvcResult secondResult = mockMvc.perform(post("/api/v1/transactions/deposit")
                        .header("Authorization", "Bearer " + aliceToken)
                        .header("Idempotency-Key", idempotencyKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.reference").value(firstReference))
                .andExpect(jsonPath("$.data.amount").value(200.00))
                .andReturn();

        // CRITICAL INVARIANT: Balance must STILL be $1200.00 (NOT $1400.00!)
        Account afterSecond = accountRepository.findByAccountNumber("ACC-ALICE-01").orElseThrow();
        assertThat(afterSecond.getBalance()).isEqualByComparingTo("1200.00");
    }

    @Test
    @DisplayName("Idempotency - Repeated identical withdrawal returns original result and does NOT double-debit")
    void shouldReplayWithdrawalWithoutDoubleDebit() throws Exception {
        String idempotencyKey = "WDL-" + UUID.randomUUID();
        WithdrawalRequest request = new WithdrawalRequest("ACC-ALICE-01", new BigDecimal("150.00"), "ATM cash");

        // First attempt - $1000 - $150 = $850
        MvcResult firstResult = mockMvc.perform(post("/api/v1/transactions/withdraw")
                        .header("Authorization", "Bearer " + aliceToken)
                        .header("Idempotency-Key", idempotencyKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        String firstReference = objectMapper.readTree(firstResult.getResponse().getContentAsString())
                .path("data").path("reference").asText();

        Account afterFirst = accountRepository.findByAccountNumber("ACC-ALICE-01").orElseThrow();
        assertThat(afterFirst.getBalance()).isEqualByComparingTo("850.00");

        // Second attempt
        mockMvc.perform(post("/api/v1/transactions/withdraw")
                        .header("Authorization", "Bearer " + aliceToken)
                        .header("Idempotency-Key", idempotencyKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.reference").value(firstReference));

        // CRITICAL INVARIANT: Balance must STILL be $850.00 (NOT $700.00!)
        Account afterSecond = accountRepository.findByAccountNumber("ACC-ALICE-01").orElseThrow();
        assertThat(afterSecond.getBalance()).isEqualByComparingTo("850.00");
    }

    @Test
    @DisplayName("Idempotency - Repeated identical transfer returns original result and does NOT double-transfer")
    void shouldReplayTransferWithoutDoubleTransfer() throws Exception {
        String idempotencyKey = "TRF-" + UUID.randomUUID();
        TransferRequest request = new TransferRequest(
                "ACC-ALICE-01", "ACC-BOB-01", new BigDecimal("100.00"), "Dinner split");

        // First attempt: Alice $1000 -> $900; Bob $500 -> $600
        MvcResult firstResult = mockMvc.perform(post("/api/v1/transactions/transfer")
                        .header("Authorization", "Bearer " + aliceToken)
                        .header("Idempotency-Key", idempotencyKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        String firstReference = objectMapper.readTree(firstResult.getResponse().getContentAsString())
                .path("data").path("reference").asText();

        // Second attempt
        mockMvc.perform(post("/api/v1/transactions/transfer")
                        .header("Authorization", "Bearer " + aliceToken)
                        .header("Idempotency-Key", idempotencyKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.reference").value(firstReference));

        Account afterSecondAlice = accountRepository.findByAccountNumber("ACC-ALICE-01").orElseThrow();
        Account afterSecondBob = accountRepository.findByAccountNumber("ACC-BOB-01").orElseThrow();

        assertThat(afterSecondAlice.getBalance()).isEqualByComparingTo("900.00");
        assertThat(afterSecondBob.getBalance()).isEqualByComparingTo("600.00");
    }

    @Test
    @DisplayName("Idempotency Conflict - Reusing same key with DIFFERENT payload must return 409 Conflict")
    void shouldRejectKeyReuseWithDifferentPayload() throws Exception {
        String idempotencyKey = "DEP-CONFLICT-" + UUID.randomUUID();
        DepositRequest originalRequest = new DepositRequest("ACC-ALICE-01", new BigDecimal("100.00"), "Original amount");

        // First attempt succeeds
        mockMvc.perform(post("/api/v1/transactions/deposit")
                        .header("Authorization", "Bearer " + aliceToken)
                        .header("Idempotency-Key", idempotencyKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(originalRequest)))
                .andExpect(status().isCreated());

        // Second attempt with SAME key but DIFFERENT amount ($999.00)
        DepositRequest maliciousRequest = new DepositRequest("ACC-ALICE-01", new BigDecimal("999.00"), "Changed amount");

        mockMvc.perform(post("/api/v1/transactions/deposit")
                        .header("Authorization", "Bearer " + aliceToken)
                        .header("Idempotency-Key", idempotencyKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(maliciousRequest)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("Conflict"))
                .andExpect(jsonPath("$.message", containsString("has already been used with a different request payload")));

        // Balance must only reflect the first $100.00 deposit
        Account alice = accountRepository.findByAccountNumber("ACC-ALICE-01").orElseThrow();
        assertThat(alice.getBalance()).isEqualByComparingTo("1100.00");
    }
}
