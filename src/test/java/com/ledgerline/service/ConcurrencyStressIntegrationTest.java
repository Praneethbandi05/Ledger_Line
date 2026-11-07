package com.ledgerline.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ledgerline.dto.transaction.DepositRequest;
import com.ledgerline.dto.transaction.TransferRequest;
import com.ledgerline.dto.transaction.WithdrawalRequest;
import com.ledgerline.entity.Account;
import com.ledgerline.entity.User;
import com.ledgerline.repository.AccountRepository;
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
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ConcurrencyStressIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private String aliceToken;
    private String bobToken;
    private Account aliceAccount;
    private Account bobAccount;

    @BeforeEach
    void setUp() {
        User alice = userRepository.findByUsername("alice").orElseThrow();
        User bob = userRepository.findByUsername("bob").orElseThrow();

        aliceToken = jwtTokenProvider.generateTokenFromUser(alice);
        bobToken = jwtTokenProvider.generateTokenFromUser(bob);

        aliceAccount = accountRepository.findByAccountNumber("ACC-ALICE-01").orElseThrow();
        bobAccount = accountRepository.findByAccountNumber("ACC-BOB-01").orElseThrow();
    }

    @Test
    @DisplayName("Concurrency: 10 simultaneous withdrawals of $100 against $500 balance must allow exactly 5 and reject 5 without overdraft")
    void testConcurrentWithdrawalsPreventOverdraft() throws Exception {
        // Set baseline balance to exactly $500.00
        aliceAccount.setBalance(new BigDecimal("500.00"));
        accountRepository.saveAndFlush(aliceAccount);

        int totalThreads = 10;
        ExecutorService executor = Executors.newFixedThreadPool(totalThreads);
        CountDownLatch startGate = new CountDownLatch(1);
        CountDownLatch endGate = new CountDownLatch(totalThreads);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger insufficientFundsCount = new AtomicInteger(0);
        AtomicInteger otherErrorsCount = new AtomicInteger(0);

        for (int i = 0; i < totalThreads; i++) {
            executor.submit(() -> {
                try {
                    startGate.await(); // Hold all threads until gate opens
                    WithdrawalRequest request = new WithdrawalRequest("ACC-ALICE-01", new BigDecimal("100.00"), "Concurrent withdrawal");

                    MvcResult result = mockMvc.perform(post("/api/v1/transactions/withdraw")
                                    .header("Authorization", "Bearer " + aliceToken)
                                    .header("Idempotency-Key", "WDL-RACE-" + UUID.randomUUID())
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(objectMapper.writeValueAsString(request)))
                            .andReturn();

                    int status = result.getResponse().getStatus();
                    if (status == 201) {
                        successCount.incrementAndGet();
                    } else if (status == 422) {
                        insufficientFundsCount.incrementAndGet();
                    } else {
                        otherErrorsCount.incrementAndGet();
                    }
                } catch (Exception e) {
                    otherErrorsCount.incrementAndGet();
                } finally {
                    endGate.countDown();
                }
            });
        }

        // Release all threads simultaneously
        startGate.countDown();
        boolean completed = endGate.await(30, TimeUnit.SECONDS);
        executor.shutdown();

        assertThat(completed).isTrue();
        assertThat(otherErrorsCount.get()).isEqualTo(0);
        assertThat(successCount.get()).isEqualTo(5);
        assertThat(insufficientFundsCount.get()).isEqualTo(5);

        // Verification of invariant: Account balance MUST be strictly $0.00
        Account finalAlice = accountRepository.findByAccountNumber("ACC-ALICE-01").orElseThrow();
        assertThat(finalAlice.getBalance()).isEqualByComparingTo("0.00");
    }

    @Test
    @DisplayName("Concurrency: 20 simultaneous cross-transfers (Alice <-> Bob) must complete without deadlocks")
    void testConcurrentCrossTransfersDeadlockFree() throws Exception {
        // Refresh and set baseline balance to $1000.00 each
        Account freshAlice = accountRepository.findByAccountNumber("ACC-ALICE-01").orElseThrow();
        Account freshBob = accountRepository.findByAccountNumber("ACC-BOB-01").orElseThrow();
        freshAlice.setBalance(new BigDecimal("1000.00"));
        freshBob.setBalance(new BigDecimal("1000.00"));
        accountRepository.saveAndFlush(freshAlice);
        accountRepository.saveAndFlush(freshBob);

        int transfersPerDirection = 10;
        int totalThreads = transfersPerDirection * 2;
        ExecutorService executor = Executors.newFixedThreadPool(totalThreads);
        CountDownLatch startGate = new CountDownLatch(1);
        CountDownLatch endGate = new CountDownLatch(totalThreads);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger errorCount = new AtomicInteger(0);

        // 10 threads Alice -> Bob ($50 each)
        for (int i = 0; i < transfersPerDirection; i++) {
            executor.submit(() -> {
                try {
                    startGate.await();
                    TransferRequest request = new TransferRequest(
                            "ACC-ALICE-01", "ACC-BOB-01", new BigDecimal("50.00"), "Alice to Bob");

                    MvcResult result = mockMvc.perform(post("/api/v1/transactions/transfer")
                                    .header("Authorization", "Bearer " + aliceToken)
                                    .header("Idempotency-Key", "TRF-AB-" + UUID.randomUUID())
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(objectMapper.writeValueAsString(request)))
                            .andReturn();

                    if (result.getResponse().getStatus() == 201) {
                        successCount.incrementAndGet();
                    } else {
                        errorCount.incrementAndGet();
                    }
                } catch (Exception e) {
                    errorCount.incrementAndGet();
                } finally {
                    endGate.countDown();
                }
            });
        }

        // 10 threads Bob -> Alice ($50 each)
        for (int i = 0; i < transfersPerDirection; i++) {
            executor.submit(() -> {
                try {
                    startGate.await();
                    TransferRequest request = new TransferRequest(
                            "ACC-BOB-01", "ACC-ALICE-01", new BigDecimal("50.00"), "Bob to Alice");

                    MvcResult result = mockMvc.perform(post("/api/v1/transactions/transfer")
                                    .header("Authorization", "Bearer " + bobToken)
                                    .header("Idempotency-Key", "TRF-BA-" + UUID.randomUUID())
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(objectMapper.writeValueAsString(request)))
                            .andReturn();

                    if (result.getResponse().getStatus() == 201) {
                        successCount.incrementAndGet();
                    } else {
                        errorCount.incrementAndGet();
                    }
                } catch (Exception e) {
                    errorCount.incrementAndGet();
                } finally {
                    endGate.countDown();
                }
            });
        }

        startGate.countDown();
        boolean completed = endGate.await(45, TimeUnit.SECONDS);
        executor.shutdown();

        assertThat(completed).isTrue();
        assertThat(errorCount.get()).isEqualTo(0);
        assertThat(successCount.get()).isEqualTo(20);

        // Verification of invariant: Net transfers = $0 change for each account
        Account finalAlice = accountRepository.findByAccountNumber("ACC-ALICE-01").orElseThrow();
        Account finalBob = accountRepository.findByAccountNumber("ACC-BOB-01").orElseThrow();

        assertThat(finalAlice.getBalance()).isEqualByComparingTo("1000.00");
        assertThat(finalBob.getBalance()).isEqualByComparingTo("1000.00");
    }

    @Test
    @DisplayName("Concurrency: 10 simultaneous identical deposit requests with same idempotency key must execute exactly once")
    void testConcurrentIdenticalRequestsExecuteOnce() throws Exception {
        Account freshAlice = accountRepository.findByAccountNumber("ACC-ALICE-01").orElseThrow();
        freshAlice.setBalance(new BigDecimal("1000.00"));
        accountRepository.saveAndFlush(freshAlice);

        String sharedKey = "SHARED-KEY-" + UUID.randomUUID();
        DepositRequest request = new DepositRequest("ACC-ALICE-01", new BigDecimal("150.00"), "Concurrent identical deposit");

        int totalThreads = 10;
        ExecutorService executor = Executors.newFixedThreadPool(totalThreads);
        CountDownLatch startGate = new CountDownLatch(1);
        CountDownLatch endGate = new CountDownLatch(totalThreads);

        List<String> transactionReferences = Collections.synchronizedList(new ArrayList<>());
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger errorCount = new AtomicInteger(0);

        for (int i = 0; i < totalThreads; i++) {
            executor.submit(() -> {
                try {
                    startGate.await();
                    MvcResult result = mockMvc.perform(post("/api/v1/transactions/deposit")
                                    .header("Authorization", "Bearer " + aliceToken)
                                    .header("Idempotency-Key", sharedKey)
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(objectMapper.writeValueAsString(request)))
                            .andReturn();

                    if (result.getResponse().getStatus() == 201) {
                        successCount.incrementAndGet();
                        String responseBody = result.getResponse().getContentAsString();
                        String ref = objectMapper.readTree(responseBody).path("data").path("reference").asText();
                        transactionReferences.add(ref);
                    } else {
                        errorCount.incrementAndGet();
                    }
                } catch (Exception e) {
                    errorCount.incrementAndGet();
                } finally {
                    endGate.countDown();
                }
            });
        }

        startGate.countDown();
        boolean completed = endGate.await(30, TimeUnit.SECONDS);
        executor.shutdown();

        assertThat(completed).isTrue();
        assertThat(errorCount.get()).isEqualTo(0);
        assertThat(successCount.get()).isEqualTo(10);

        // Invariant 1: All 10 threads received the EXACT SAME transaction reference
        String canonicalRef = transactionReferences.get(0);
        for (String ref : transactionReferences) {
            assertThat(ref).isEqualTo(canonicalRef);
        }

        // Invariant 2: Balance was incremented EXACTLY ONCE ($1000 + $150 = $1150), NOT 10 times ($2500)
        Account finalAlice = accountRepository.findByAccountNumber("ACC-ALICE-01").orElseThrow();
        assertThat(finalAlice.getBalance()).isEqualByComparingTo("1150.00");
    }
}
