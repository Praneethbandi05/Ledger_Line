package com.ledgerline.ledger;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ledgerline.dto.transaction.DepositRequest;
import com.ledgerline.dto.transaction.TransferRequest;
import com.ledgerline.dto.transaction.WithdrawalRequest;
import com.ledgerline.entity.Account;
import com.ledgerline.entity.LedgerEntry;
import com.ledgerline.entity.Transaction;
import com.ledgerline.entity.User;
import com.ledgerline.enums.EntryType;
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
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class DoubleEntryLedgerIntegrationTest {

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
    private String auditorToken;

    private Account aliceAccount;
    private Account bobAccount;

    @BeforeEach
    void setUp() {
        User alice = userRepository.findByUsername("alice").orElseThrow();
        User auditor = userRepository.findByUsername("auditor").orElseThrow();

        aliceToken = jwtTokenProvider.generateTokenFromUser(alice);
        auditorToken = jwtTokenProvider.generateTokenFromUser(auditor);

        aliceAccount = accountRepository.findByAccountNumber("ACC-ALICE-01").orElseThrow();
        bobAccount = accountRepository.findByAccountNumber("ACC-BOB-01").orElseThrow();

        aliceAccount.setBalance(new BigDecimal("1000.00"));
        bobAccount.setBalance(new BigDecimal("500.00"));
        accountRepository.save(aliceAccount);
        accountRepository.save(bobAccount);
    }

    @Test
    @DisplayName("Ledger Balance Invariant - Deposit creates balanced entries: SUM(DEBIT) == SUM(CREDIT) == Amount")
    void shouldCreateBalancedLedgerEntriesOnDeposit() throws Exception {
        BigDecimal depositAmount = new BigDecimal("250.00");
        DepositRequest request = new DepositRequest("ACC-ALICE-01", depositAmount, "Balanced deposit");

        String responseStr = mockMvc.perform(post("/api/v1/transactions/deposit")
                        .header("Authorization", "Bearer " + aliceToken)
                        .header("Idempotency-Key", UUID.randomUUID().toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("COMPLETED"))
                .andReturn().getResponse().getContentAsString();

        long txId = objectMapper.readTree(responseStr).path("data").path("id").asLong();
        List<LedgerEntry> entries = ledgerEntryRepository.findByTransactionIdOrderByCreatedAtAsc(txId);
        assertThat(entries).hasSize(2);

        BigDecimal sumDebits = entries.stream()
                .filter(e -> e.getEntryType() == EntryType.DEBIT)
                .map(LedgerEntry::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal sumCredits = entries.stream()
                .filter(e -> e.getEntryType() == EntryType.CREDIT)
                .map(LedgerEntry::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        assertThat(sumDebits).isEqualByComparingTo(depositAmount);
        assertThat(sumCredits).isEqualByComparingTo(depositAmount);
        assertThat(sumDebits).isEqualByComparingTo(sumCredits);
    }

    @Test
    @DisplayName("Ledger Balance Invariant - Withdrawal creates balanced entries: SUM(DEBIT) == SUM(CREDIT) == Amount")
    void shouldCreateBalancedLedgerEntriesOnWithdrawal() throws Exception {
        BigDecimal withdrawAmount = new BigDecimal("120.00");
        WithdrawalRequest request = new WithdrawalRequest("ACC-ALICE-01", withdrawAmount, "Balanced withdrawal");

        String responseStr = mockMvc.perform(post("/api/v1/transactions/withdraw")
                        .header("Authorization", "Bearer " + aliceToken)
                        .header("Idempotency-Key", UUID.randomUUID().toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("COMPLETED"))
                .andReturn().getResponse().getContentAsString();

        long txId = objectMapper.readTree(responseStr).path("data").path("id").asLong();
        List<LedgerEntry> entries = ledgerEntryRepository.findByTransactionIdOrderByCreatedAtAsc(txId);
        assertThat(entries).hasSize(2);

        BigDecimal sumDebits = entries.stream()
                .filter(e -> e.getEntryType() == EntryType.DEBIT)
                .map(LedgerEntry::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal sumCredits = entries.stream()
                .filter(e -> e.getEntryType() == EntryType.CREDIT)
                .map(LedgerEntry::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        assertThat(sumDebits).isEqualByComparingTo(withdrawAmount);
        assertThat(sumCredits).isEqualByComparingTo(withdrawAmount);
        assertThat(sumDebits).isEqualByComparingTo(sumCredits);
    }

    @Test
    @DisplayName("Ledger Balance Invariant - Transfer creates balanced entries: SUM(DEBIT) == SUM(CREDIT) == Amount")
    void shouldCreateBalancedLedgerEntriesOnTransfer() throws Exception {
        BigDecimal transferAmount = new BigDecimal("350.00");
        TransferRequest request = new TransferRequest("ACC-ALICE-01", "ACC-BOB-01", transferAmount, "Balanced transfer");

        String responseStr = mockMvc.perform(post("/api/v1/transactions/transfer")
                        .header("Authorization", "Bearer " + aliceToken)
                        .header("Idempotency-Key", UUID.randomUUID().toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("COMPLETED"))
                .andReturn().getResponse().getContentAsString();

        long txId = objectMapper.readTree(responseStr).path("data").path("id").asLong();
        List<LedgerEntry> entries = ledgerEntryRepository.findByTransactionIdOrderByCreatedAtAsc(txId);
        assertThat(entries).hasSize(2);

        BigDecimal sumDebits = entries.stream()
                .filter(e -> e.getEntryType() == EntryType.DEBIT)
                .map(LedgerEntry::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal sumCredits = entries.stream()
                .filter(e -> e.getEntryType() == EntryType.CREDIT)
                .map(LedgerEntry::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        assertThat(sumDebits).isEqualByComparingTo(transferAmount);
        assertThat(sumCredits).isEqualByComparingTo(transferAmount);
        assertThat(sumDebits).isEqualByComparingTo(sumCredits);
    }

    @Test
    @DisplayName("Atomicity & Rollback - Failed withdrawal must roll back completely without partial ledger entries")
    void shouldRollbackCompletelyOnFailedTransaction() throws Exception {
        long initialEntryCount = ledgerEntryRepository.count();
        long initialTxCount = transactionRepository.count();

        // Attempt overdraft withdrawal ($1000.01 against $1000.00 balance)
        WithdrawalRequest request = new WithdrawalRequest("ACC-ALICE-01", new BigDecimal("1000.01"), "Overdraft attempt");

        mockMvc.perform(post("/api/v1/transactions/withdraw")
                        .header("Authorization", "Bearer " + aliceToken)
                        .header("Idempotency-Key", UUID.randomUUID().toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnprocessableEntity());

        // Verify zero partial ledger entries or transaction records were committed
        assertThat(ledgerEntryRepository.count()).isEqualTo(initialEntryCount);
        assertThat(transactionRepository.count()).isEqualTo(initialTxCount);

        // Verify balance remained unchanged
        Account currentAlice = accountRepository.findByAccountNumber("ACC-ALICE-01").orElseThrow();
        assertThat(currentAlice.getBalance()).isEqualByComparingTo("1000.00");
    }

    @Test
    @DisplayName("Immutability - Deletion of historical ledger entries must throw UnsupportedOperationException")
    void shouldPreventDeletionOfHistoricalLedgerEntries() throws Exception {
        // Create a legitimate entry via deposit
        DepositRequest request = new DepositRequest("ACC-ALICE-01", new BigDecimal("50.00"), "Immutability check");
        mockMvc.perform(post("/api/v1/transactions/deposit")
                        .header("Authorization", "Bearer " + aliceToken)
                        .header("Idempotency-Key", UUID.randomUUID().toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        List<LedgerEntry> entries = ledgerEntryRepository.findAll();
        assertThat(entries).isNotEmpty();
        LedgerEntry entry = entries.get(0);

        // Verify delete() throws UnsupportedOperationException
        assertThatThrownBy(() -> ledgerEntryRepository.delete(entry))
                .isInstanceOf(UnsupportedOperationException.class)
                .hasMessageContaining("Historical ledger records are strictly immutable and cannot be deleted");

        // Verify deleteById() throws UnsupportedOperationException
        assertThatThrownBy(() -> ledgerEntryRepository.deleteById(entry.getId()))
                .isInstanceOf(UnsupportedOperationException.class)
                .hasMessageContaining("Historical ledger records are strictly immutable and cannot be deleted");

        // Verify deleteAll() throws UnsupportedOperationException
        assertThatThrownBy(() -> ledgerEntryRepository.deleteAll())
                .isInstanceOf(UnsupportedOperationException.class)
                .hasMessageContaining("Historical ledger records are strictly immutable and cannot be deleted");
    }

    @Test
    @DisplayName("Auditor Query - Auditor can query transaction-level ledger journal statements")
    void shouldAllowAuditorToInspectCompleteDoubleEntryJournal() throws Exception {
        mockMvc.perform(get("/api/v1/transactions/ledger")
                        .header("Authorization", "Bearer " + auditorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }
}
