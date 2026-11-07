package com.ledgerline.ledger;

import com.ledgerline.entity.Account;
import com.ledgerline.entity.LedgerEntry;
import com.ledgerline.entity.Transaction;
import com.ledgerline.enums.EntryType;
import com.ledgerline.exception.BusinessRuleViolationException;
import com.ledgerline.exception.LedgerImbalanceException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

@Component
public class DoubleEntryLedgerEngine {

    private static final Logger log = LoggerFactory.getLogger(DoubleEntryLedgerEngine.class);

    /**
     * Executes double-entry booking for a customer deposit.
     * Inflow:
     * - DEBIT: Deposit Clearing Account
     * - CREDIT: Customer Account
     */
    public List<LedgerEntry> bookDeposit(Transaction transaction, Account customerAccount, Account depositClearingAccount) {
        BigDecimal amount = transaction.getAmount().setScale(2, RoundingMode.HALF_EVEN);
        validatePositiveAmount(amount);

        // Update balances
        depositClearingAccount.setBalance(depositClearingAccount.getBalance().add(amount));
        customerAccount.setBalance(customerAccount.getBalance().add(amount));

        List<LedgerEntry> entries = new ArrayList<>();

        // Clearing Entry (Debit)
        LedgerEntry debitEntry = new LedgerEntry(
                transaction,
                depositClearingAccount,
                EntryType.DEBIT,
                amount,
                depositClearingAccount.getBalance(),
                transaction.getCurrency(),
                "Inflow clearing for deposit to " + customerAccount.getAccountNumber()
        );
        entries.add(debitEntry);

        // Customer Entry (Credit)
        LedgerEntry creditEntry = new LedgerEntry(
                transaction,
                customerAccount,
                EntryType.CREDIT,
                amount,
                customerAccount.getBalance(),
                transaction.getCurrency(),
                "Deposit to " + customerAccount.getAccountNumber() + ": " + transaction.getDescription()
        );
        entries.add(creditEntry);

        validateDoubleEntryBalance(entries, amount);
        return entries;
    }

    /**
     * Executes double-entry booking for a customer withdrawal.
     * Outflow:
     * - DEBIT: Customer Account
     * - CREDIT: Withdrawal Clearing Account
     */
    public List<LedgerEntry> bookWithdrawal(Transaction transaction, Account customerAccount, Account withdrawalClearingAccount) {
        BigDecimal amount = transaction.getAmount().setScale(2, RoundingMode.HALF_EVEN);
        validatePositiveAmount(amount);

        // Balance Check
        if (customerAccount.getBalance().compareTo(amount) < 0) {
            log.warn("Withdrawal rejected: Insufficient funds in account {}. Required: {}, Available: {}",
                    customerAccount.getAccountNumber(), amount, customerAccount.getBalance());
            throw new BusinessRuleViolationException(
                    "Insufficient funds in account " + customerAccount.getAccountNumber() +
                    ". Available balance: $" + customerAccount.getBalance() + ", Requested: $" + amount);
        }

        // Update balances
        customerAccount.setBalance(customerAccount.getBalance().subtract(amount));
        withdrawalClearingAccount.setBalance(withdrawalClearingAccount.getBalance().add(amount));

        List<LedgerEntry> entries = new ArrayList<>();

        // Customer Entry (Debit)
        LedgerEntry debitEntry = new LedgerEntry(
                transaction,
                customerAccount,
                EntryType.DEBIT,
                amount,
                customerAccount.getBalance(),
                transaction.getCurrency(),
                "Withdrawal from " + customerAccount.getAccountNumber() + ": " + transaction.getDescription()
        );
        entries.add(debitEntry);

        // Clearing Entry (Credit)
        LedgerEntry creditEntry = new LedgerEntry(
                transaction,
                withdrawalClearingAccount,
                EntryType.CREDIT,
                amount,
                withdrawalClearingAccount.getBalance(),
                transaction.getCurrency(),
                "Outflow clearing for withdrawal from " + customerAccount.getAccountNumber()
        );
        entries.add(creditEntry);

        validateDoubleEntryBalance(entries, amount);
        return entries;
    }

    /**
     * Executes double-entry booking for an internal account-to-account transfer.
     * - DEBIT: Source Account (Funds exit source)
     * - CREDIT: Destination Account (Funds enter destination)
     */
    public List<LedgerEntry> bookTransfer(Transaction transaction, Account sourceAccount, Account destinationAccount) {
        BigDecimal amount = transaction.getAmount().setScale(2, RoundingMode.HALF_EVEN);
        validatePositiveAmount(amount);

        // Balance Check
        if (sourceAccount.getBalance().compareTo(amount) < 0) {
            log.warn("Transfer rejected: Insufficient funds in source account {}. Required: {}, Available: {}",
                    sourceAccount.getAccountNumber(), amount, sourceAccount.getBalance());
            throw new BusinessRuleViolationException(
                    "Insufficient funds in source account " + sourceAccount.getAccountNumber() +
                    ". Available balance: $" + sourceAccount.getBalance() + ", Requested: $" + amount);
        }

        // Update balances
        sourceAccount.setBalance(sourceAccount.getBalance().subtract(amount));
        destinationAccount.setBalance(destinationAccount.getBalance().add(amount));

        List<LedgerEntry> entries = new ArrayList<>();

        // Source Entry (Debit)
        LedgerEntry debitEntry = new LedgerEntry(
                transaction,
                sourceAccount,
                EntryType.DEBIT,
                amount,
                sourceAccount.getBalance(),
                transaction.getCurrency(),
                "Transfer to " + destinationAccount.getAccountNumber() + ": " + transaction.getDescription()
        );
        entries.add(debitEntry);

        // Destination Entry (Credit)
        LedgerEntry creditEntry = new LedgerEntry(
                transaction,
                destinationAccount,
                EntryType.CREDIT,
                amount,
                destinationAccount.getBalance(),
                transaction.getCurrency(),
                "Transfer from " + sourceAccount.getAccountNumber() + ": " + transaction.getDescription()
        );
        entries.add(creditEntry);

        validateDoubleEntryBalance(entries, amount);
        return entries;
    }

    /**
     * Enforces mathematical double-entry invariant:
     * sum(Debits) == sum(Credits) == expectedTransactionAmount
     */
    public void validateDoubleEntryBalance(List<LedgerEntry> entries, BigDecimal expectedAmount) {
        BigDecimal totalDebits = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_EVEN);
        BigDecimal totalCredits = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_EVEN);

        for (LedgerEntry entry : entries) {
            if (entry.getEntryType() == EntryType.DEBIT) {
                totalDebits = totalDebits.add(entry.getAmount());
            } else if (entry.getEntryType() == EntryType.CREDIT) {
                totalCredits = totalCredits.add(entry.getAmount());
            }
        }

        if (totalDebits.compareTo(totalCredits) != 0) {
            log.error("CRITICAL LEDGER ERROR: Double-entry imbalance! Debits: {}, Credits: {}", totalDebits, totalCredits);
            throw new LedgerImbalanceException(
                    "Double-entry ledger invariant violated: Total debits ($" + totalDebits +
                    ") must equal total credits ($" + totalCredits + ")");
        }

        if (expectedAmount != null && totalDebits.compareTo(expectedAmount.setScale(2, RoundingMode.HALF_EVEN)) != 0) {
            log.error("CRITICAL LEDGER ERROR: Entries sum ({}) does not match transaction amount ({})", totalDebits, expectedAmount);
            throw new LedgerImbalanceException(
                    "Ledger entries total ($" + totalDebits + ") does not match transaction amount ($" + expectedAmount + ")");
        }
    }

    private void validatePositiveAmount(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleViolationException("Transaction amount must be strictly positive and greater than zero");
        }
        if (amount.compareTo(new BigDecimal("0.01")) < 0) {
            throw new BusinessRuleViolationException("Transaction amount must be at least 0.01");
        }
    }
}
