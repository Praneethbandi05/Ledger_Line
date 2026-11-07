package com.ledgerline.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ledgerline.dto.transaction.DepositRequest;
import com.ledgerline.dto.transaction.TransferRequest;
import com.ledgerline.dto.transaction.WithdrawalRequest;
import com.ledgerline.entity.Account;
import com.ledgerline.entity.User;
import com.ledgerline.repository.AccountRepository;
import com.ledgerline.repository.LedgerEntryRepository;
import com.ledgerline.repository.TransactionRepository;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class FinancialOperationsIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private LedgerEntryRepository ledgerEntryRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private String aliceToken;
    private String bobToken;
    private String adminToken;
    private String auditorToken;

    private Account aliceAccount;
    private Account bobAccount;

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

        aliceAccount = accountRepository.findByAccountNumber("ACC-ALICE-01").orElseThrow();
        bobAccount = accountRepository.findByAccountNumber("ACC-BOB-01").orElseThrow();

        // Reset balances to baseline for deterministic tests
        aliceAccount.setBalance(new BigDecimal("1000.00"));
        bobAccount.setBalance(new BigDecimal("500.00"));
        accountRepository.save(aliceAccount);
        accountRepository.save(bobAccount);
    }

    @Test
    @DisplayName("Deposit - should deposit funds, increment balance and record balanced double-entry entries")
    void shouldDepositFundsAndCreateBalancedLedgerEntries() throws Exception {
        DepositRequest request = new DepositRequest("ACC-ALICE-01", new BigDecimal("250.00"), "Paycheck deposit");

        mockMvc.perform(post("/api/v1/transactions/deposit")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("COMPLETED"))
                .andExpect(jsonPath("$.data.amount").value(250.00))
                .andExpect(jsonPath("$.data.ledgerEntries", hasSize(2)));

        Account updatedAlice = accountRepository.findByAccountNumber("ACC-ALICE-01").orElseThrow();
        assertThat(updatedAlice.getBalance()).isEqualByComparingTo("1250.00");
    }

    @Test
    @DisplayName("Withdrawal - should withdraw funds, decrement balance and record balanced entries")
    void shouldWithdrawFundsAndCreateBalancedLedgerEntries() throws Exception {
        WithdrawalRequest request = new WithdrawalRequest("ACC-ALICE-01", new BigDecimal("100.00"), "ATM withdrawal");

        mockMvc.perform(post("/api/v1/transactions/withdraw")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("COMPLETED"))
                .andExpect(jsonPath("$.data.amount").value(100.00))
                .andExpect(jsonPath("$.data.ledgerEntries", hasSize(2)));

        Account updatedAlice = accountRepository.findByAccountNumber("ACC-ALICE-01").orElseThrow();
        assertThat(updatedAlice.getBalance()).isEqualByComparingTo("900.00");
    }

    @Test
    @DisplayName("Insufficient Balance - should reject withdrawal and leave balance unchanged")
    void shouldRejectWithdrawalWhenBalanceIsInsufficient() throws Exception {
        WithdrawalRequest request = new WithdrawalRequest("ACC-ALICE-01", new BigDecimal("1000.01"), "Overdraft attempt");

        mockMvc.perform(post("/api/v1/transactions/withdraw")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.status").value(422))
                .andExpect(jsonPath("$.message", containsString("Insufficient funds")));

        Account updatedAlice = accountRepository.findByAccountNumber("ACC-ALICE-01").orElseThrow();
        assertThat(updatedAlice.getBalance()).isEqualByComparingTo("1000.00");
    }

    @Test
    @DisplayName("Transfer - should transfer funds atomically between accounts and create double-entry records")
    void shouldTransferFundsBetweenAccounts() throws Exception {
        TransferRequest request = new TransferRequest(
                "ACC-ALICE-01", "ACC-BOB-01", new BigDecimal("300.00"), "Rent contribution");

        mockMvc.perform(post("/api/v1/transactions/transfer")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("COMPLETED"))
                .andExpect(jsonPath("$.data.amount").value(300.00))
                .andExpect(jsonPath("$.data.sourceAccountNumber").value("ACC-ALICE-01"))
                .andExpect(jsonPath("$.data.destinationAccountNumber").value("ACC-BOB-01"))
                .andExpect(jsonPath("$.data.ledgerEntries", hasSize(2)));

        Account updatedAlice = accountRepository.findByAccountNumber("ACC-ALICE-01").orElseThrow();
        Account updatedBob = accountRepository.findByAccountNumber("ACC-BOB-01").orElseThrow();

        assertThat(updatedAlice.getBalance()).isEqualByComparingTo("700.00");
        assertThat(updatedBob.getBalance()).isEqualByComparingTo("800.00");
    }

    @Test
    @DisplayName("Transfer - should reject transfer when source account has insufficient funds")
    void shouldRejectTransferOnInsufficientFunds() throws Exception {
        TransferRequest request = new TransferRequest(
                "ACC-ALICE-01", "ACC-BOB-01", new BigDecimal("1500.00"), "Excess transfer");

        mockMvc.perform(post("/api/v1/transactions/transfer")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.status").value(422))
                .andExpect(jsonPath("$.message", containsString("Insufficient funds in source account")));

        Account updatedAlice = accountRepository.findByAccountNumber("ACC-ALICE-01").orElseThrow();
        Account updatedBob = accountRepository.findByAccountNumber("ACC-BOB-01").orElseThrow();

        assertThat(updatedAlice.getBalance()).isEqualByComparingTo("1000.00");
        assertThat(updatedBob.getBalance()).isEqualByComparingTo("500.00");
    }

    @Test
    @DisplayName("Self-Transfer - should reject transfer to the exact same account")
    void shouldRejectSelfTransfer() throws Exception {
        TransferRequest request = new TransferRequest(
                "ACC-ALICE-01", "ACC-ALICE-01", new BigDecimal("50.00"), "Self transfer");

        mockMvc.perform(post("/api/v1/transactions/transfer")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.status").value(422))
                .andExpect(jsonPath("$.message", containsString("Cannot transfer funds to the same account")));
    }

    @Test
    @DisplayName("IDOR Defense - Customer Bob attempting to withdraw from Alice's account must return 403 Forbidden")
    void shouldPreventCustomerFromWithdrawingFromAnotherCustomerAccount() throws Exception {
        WithdrawalRequest request = new WithdrawalRequest("ACC-ALICE-01", new BigDecimal("50.00"), "Unauthorized withdrawal");

        mockMvc.perform(post("/api/v1/transactions/withdraw")
                        .header("Authorization", "Bearer " + bobToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.message", containsString("You do not have ownership of account ACC-ALICE-01")));

        Account updatedAlice = accountRepository.findByAccountNumber("ACC-ALICE-01").orElseThrow();
        assertThat(updatedAlice.getBalance()).isEqualByComparingTo("1000.00");
    }

    @Test
    @DisplayName("IDOR Defense - Customer Bob attempting to transfer from Alice's account must return 403 Forbidden")
    void shouldPreventCustomerFromTransferringFromAnotherCustomerAccount() throws Exception {
        TransferRequest request = new TransferRequest(
                "ACC-ALICE-01", "ACC-BOB-01", new BigDecimal("50.00"), "Steal funds attempt");

        mockMvc.perform(post("/api/v1/transactions/transfer")
                        .header("Authorization", "Bearer " + bobToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.message", containsString("You do not have ownership of account ACC-ALICE-01")));

        Account updatedAlice = accountRepository.findByAccountNumber("ACC-ALICE-01").orElseThrow();
        Account updatedBob = accountRepository.findByAccountNumber("ACC-BOB-01").orElseThrow();

        assertThat(updatedAlice.getBalance()).isEqualByComparingTo("1000.00");
        assertThat(updatedBob.getBalance()).isEqualByComparingTo("500.00");
    }

    @Test
    @DisplayName("Auditor Restriction - Auditor attempting financial deposit must return 403 Forbidden")
    void shouldPreventAuditorFromDepositing() throws Exception {
        DepositRequest request = new DepositRequest("ACC-ALICE-01", new BigDecimal("50.00"), "Auditor deposit attempt");

        mockMvc.perform(post("/api/v1/transactions/deposit")
                        .header("Authorization", "Bearer " + auditorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.message", containsString("Auditors hold strictly read-only permissions")));
    }

    @Test
    @DisplayName("Auditor Restriction - Auditor attempting financial withdrawal must return 403 Forbidden")
    void shouldPreventAuditorFromWithdrawing() throws Exception {
        WithdrawalRequest request = new WithdrawalRequest("ACC-ALICE-01", new BigDecimal("50.00"), "Auditor withdrawal attempt");

        mockMvc.perform(post("/api/v1/transactions/withdraw")
                        .header("Authorization", "Bearer " + auditorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.message", containsString("Auditors hold strictly read-only permissions")));
    }

    @Test
    @DisplayName("Validation - should reject zero or negative transaction amounts via Bean Validation")
    void shouldRejectNegativeOrZeroAmounts() throws Exception {
        DepositRequest negativeDeposit = new DepositRequest("ACC-ALICE-01", new BigDecimal("-25.00"), "Negative deposit");

        mockMvc.perform(post("/api/v1/transactions/deposit")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(negativeDeposit)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.validationErrors[?(@.field == 'amount')].message").isNotEmpty());

        WithdrawalRequest zeroWithdrawal = new WithdrawalRequest("ACC-ALICE-01", BigDecimal.ZERO, "Zero withdrawal");

        mockMvc.perform(post("/api/v1/transactions/withdraw")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(zeroWithdrawal)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.validationErrors[?(@.field == 'amount')].message").isNotEmpty());
    }

    @Test
    @DisplayName("Auditor Access - Auditor can view complete double-entry ledger journal")
    void shouldAllowAuditorToViewLedgerEntries() throws Exception {
        // Execute a legitimate deposit first
        DepositRequest deposit = new DepositRequest("ACC-ALICE-01", new BigDecimal("100.00"), "Setup deposit");
        mockMvc.perform(post("/api/v1/transactions/deposit")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(deposit)))
                .andExpect(status().isCreated());

        // Auditor inspects ledger
        mockMvc.perform(get("/api/v1/transactions/ledger")
                        .header("Authorization", "Bearer " + auditorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(2))))
                .andExpect(jsonPath("$.data[0].amount").isNotEmpty())
                .andExpect(jsonPath("$.data[0].balanceAfter").isNotEmpty());
    }
}
