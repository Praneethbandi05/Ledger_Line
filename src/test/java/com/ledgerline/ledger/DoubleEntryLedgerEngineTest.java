package com.ledgerline.ledger;

import com.ledgerline.entity.Account;
import com.ledgerline.entity.LedgerEntry;
import com.ledgerline.entity.Transaction;
import com.ledgerline.entity.User;
import com.ledgerline.enums.AccountStatus;
import com.ledgerline.enums.AccountType;
import com.ledgerline.enums.EntryType;
import com.ledgerline.enums.Role;
import com.ledgerline.enums.TransactionStatus;
import com.ledgerline.enums.TransactionType;
import com.ledgerline.exception.BusinessRuleViolationException;
import com.ledgerline.exception.LedgerImbalanceException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class DoubleEntryLedgerEngineTest {

    private DoubleEntryLedgerEngine engine;
    private User testUser;
    private Account customerAccount;
    private Account depositClearingAccount;
    private Account withdrawalClearingAccount;
    private Account destinationAccount;

    @BeforeEach
    void setUp() {
        engine = new DoubleEntryLedgerEngine();
        testUser = new User("tester", "test@test.com", "pass", "Test User", Role.CUSTOMER);
        testUser.setId(1L);

        customerAccount = new Account("ACC-001", testUser, AccountType.CHECKING, "USD", new BigDecimal("500.00"));
        customerAccount.setId(10L);

        depositClearingAccount = new Account("ACC-SYS-CLEARING-DEPOSIT", testUser, AccountType.SYSTEM_CLEARING, "USD", BigDecimal.ZERO);
        depositClearingAccount.setId(90L);

        withdrawalClearingAccount = new Account("ACC-SYS-CLEARING-WITHDRAWAL", testUser, AccountType.SYSTEM_CLEARING, "USD", BigDecimal.ZERO);
        withdrawalClearingAccount.setId(91L);

        destinationAccount = new Account("ACC-002", testUser, AccountType.SAVINGS, "USD", new BigDecimal("100.00"));
        destinationAccount.setId(20L);
    }

    @Test
    @DisplayName("Deposit - should create balanced debit and credit entries and increment balance")
    void shouldBookDepositWithBalancedEntries() {
        Transaction tx = new Transaction(
                "TXN-DEP-1", depositClearingAccount, customerAccount,
                new BigDecimal("200.00"), "USD", TransactionType.DEPOSIT,
                TransactionStatus.PENDING, "Test deposit", testUser);

        List<LedgerEntry> entries = engine.bookDeposit(tx, customerAccount, depositClearingAccount);

        assertThat(entries).hasSize(2);
        assertThat(customerAccount.getBalance()).isEqualByComparingTo("700.00");
        assertThat(depositClearingAccount.getBalance()).isEqualByComparingTo("200.00");

        LedgerEntry debitEntry = entries.stream().filter(e -> e.getEntryType() == EntryType.DEBIT).findFirst().orElseThrow();
        LedgerEntry creditEntry = entries.stream().filter(e -> e.getEntryType() == EntryType.CREDIT).findFirst().orElseThrow();

        assertThat(debitEntry.getAccount().getAccountNumber()).isEqualTo("ACC-SYS-CLEARING-DEPOSIT");
        assertThat(debitEntry.getAmount()).isEqualByComparingTo("200.00");

        assertThat(creditEntry.getAccount().getAccountNumber()).isEqualTo("ACC-001");
        assertThat(creditEntry.getAmount()).isEqualByComparingTo("200.00");
        assertThat(creditEntry.getBalanceAfter()).isEqualByComparingTo("700.00");
    }

    @Test
    @DisplayName("Withdrawal - should create balanced debit and credit entries and decrement balance")
    void shouldBookWithdrawalWithBalancedEntries() {
        Transaction tx = new Transaction(
                "TXN-WDL-1", customerAccount, withdrawalClearingAccount,
                new BigDecimal("150.00"), "USD", TransactionType.WITHDRAWAL,
                TransactionStatus.PENDING, "Test withdrawal", testUser);

        List<LedgerEntry> entries = engine.bookWithdrawal(tx, customerAccount, withdrawalClearingAccount);

        assertThat(entries).hasSize(2);
        assertThat(customerAccount.getBalance()).isEqualByComparingTo("350.00");
        assertThat(withdrawalClearingAccount.getBalance()).isEqualByComparingTo("150.00");

        LedgerEntry debitEntry = entries.stream().filter(e -> e.getEntryType() == EntryType.DEBIT).findFirst().orElseThrow();
        LedgerEntry creditEntry = entries.stream().filter(e -> e.getEntryType() == EntryType.CREDIT).findFirst().orElseThrow();

        assertThat(debitEntry.getAccount().getAccountNumber()).isEqualTo("ACC-001");
        assertThat(debitEntry.getAmount()).isEqualByComparingTo("150.00");
        assertThat(debitEntry.getBalanceAfter()).isEqualByComparingTo("350.00");

        assertThat(creditEntry.getAccount().getAccountNumber()).isEqualTo("ACC-SYS-CLEARING-WITHDRAWAL");
        assertThat(creditEntry.getAmount()).isEqualByComparingTo("150.00");
    }

    @Test
    @DisplayName("Withdrawal - should reject if customer balance is insufficient")
    void shouldRejectWithdrawalOnInsufficientBalance() {
        Transaction tx = new Transaction(
                "TXN-WDL-2", customerAccount, withdrawalClearingAccount,
                new BigDecimal("600.00"), "USD", TransactionType.WITHDRAWAL,
                TransactionStatus.PENDING, "Overdraft withdrawal", testUser);

        assertThatThrownBy(() -> engine.bookWithdrawal(tx, customerAccount, withdrawalClearingAccount))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessageContaining("Insufficient funds");

        // Verify balance remained unchanged
        assertThat(customerAccount.getBalance()).isEqualByComparingTo("500.00");
    }

    @Test
    @DisplayName("Transfer - should decrement source and increment destination balances")
    void shouldBookTransferWithBalancedEntries() {
        Transaction tx = new Transaction(
                "TXN-TRF-1", customerAccount, destinationAccount,
                new BigDecimal("250.00"), "USD", TransactionType.TRANSFER,
                TransactionStatus.PENDING, "Test transfer", testUser);

        List<LedgerEntry> entries = engine.bookTransfer(tx, customerAccount, destinationAccount);

        assertThat(entries).hasSize(2);
        assertThat(customerAccount.getBalance()).isEqualByComparingTo("250.00");
        assertThat(destinationAccount.getBalance()).isEqualByComparingTo("350.00");

        LedgerEntry debitEntry = entries.stream().filter(e -> e.getEntryType() == EntryType.DEBIT).findFirst().orElseThrow();
        LedgerEntry creditEntry = entries.stream().filter(e -> e.getEntryType() == EntryType.CREDIT).findFirst().orElseThrow();

        assertThat(debitEntry.getAccount().getAccountNumber()).isEqualTo("ACC-001");
        assertThat(debitEntry.getAmount()).isEqualByComparingTo("250.00");

        assertThat(creditEntry.getAccount().getAccountNumber()).isEqualTo("ACC-002");
        assertThat(creditEntry.getAmount()).isEqualByComparingTo("250.00");
    }

    @Test
    @DisplayName("Transfer - should reject if source balance is insufficient")
    void shouldRejectTransferOnInsufficientBalance() {
        Transaction tx = new Transaction(
                "TXN-TRF-2", customerAccount, destinationAccount,
                new BigDecimal("500.01"), "USD", TransactionType.TRANSFER,
                TransactionStatus.PENDING, "Excess transfer", testUser);

        assertThatThrownBy(() -> engine.bookTransfer(tx, customerAccount, destinationAccount))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessageContaining("Insufficient funds in source account");

        assertThat(customerAccount.getBalance()).isEqualByComparingTo("500.00");
        assertThat(destinationAccount.getBalance()).isEqualByComparingTo("100.00");
    }

    @Test
    @DisplayName("Double-Entry Invariant - should throw LedgerImbalanceException when debits do not equal credits")
    void shouldThrowWhenDebitsDoNotEqualCredits() {
        Transaction tx = new Transaction("TXN-ERR", null, null, new BigDecimal("100.00"), "USD", TransactionType.DEPOSIT, TransactionStatus.PENDING, "", testUser);

        List<LedgerEntry> imbalancedEntries = new ArrayList<>();
        imbalancedEntries.add(new LedgerEntry(tx, customerAccount, EntryType.DEBIT, new BigDecimal("100.00"), BigDecimal.ZERO, "USD", ""));
        imbalancedEntries.add(new LedgerEntry(tx, destinationAccount, EntryType.CREDIT, new BigDecimal("99.99"), BigDecimal.ZERO, "USD", ""));

        assertThatThrownBy(() -> engine.validateDoubleEntryBalance(imbalancedEntries, new BigDecimal("100.00")))
                .isInstanceOf(LedgerImbalanceException.class)
                .hasMessageContaining("Double-entry ledger invariant violated");
    }

    @Test
    @DisplayName("Validation - should reject zero or negative transaction amounts")
    void shouldRejectZeroOrNegativeAmounts() {
        Transaction zeroTx = new Transaction("TXN-0", null, null, BigDecimal.ZERO, "USD", TransactionType.DEPOSIT, TransactionStatus.PENDING, "", testUser);
        assertThatThrownBy(() -> engine.bookDeposit(zeroTx, customerAccount, depositClearingAccount))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessageContaining("strictly positive");

        Transaction negTx = new Transaction("TXN-NEG", null, null, new BigDecimal("-50.00"), "USD", TransactionType.WITHDRAWAL, TransactionStatus.PENDING, "", testUser);
        assertThatThrownBy(() -> engine.bookWithdrawal(negTx, customerAccount, withdrawalClearingAccount))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessageContaining("strictly positive");
    }
}
