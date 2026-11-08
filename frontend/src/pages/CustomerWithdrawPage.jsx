import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { accountService } from '../services/accountService';
import { transactionService } from '../services/transactionService';
import { Alert } from '../components/Alert';
import {
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Wallet
} from 'lucide-react';

export const CustomerWithdrawPage = () => {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountNumber, setSelectedAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('Customer cash withdrawal');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successResult, setSuccessResult] = useState(null);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    setFetchLoading(true);
    try {
      const data = await accountService.getMyAccounts();
      setAccounts(data);
      if (data && data.length > 0) {
        setSelectedAccountNumber(data[0].accountNumber);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load accounts');
    } finally {
      setFetchLoading(false);
    }
  };

  const selectedAccount = accounts.find((a) => a.accountNumber === selectedAccountNumber);
  const availableBalance = selectedAccount ? parseFloat(selectedAccount.balance) : 0;

  const handleQuickAmount = (val) => {
    setAmount(val.toString());
  };

  const handleMaxAmount = () => {
    if (availableBalance > 0) {
      setAmount(availableBalance.toFixed(2));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessResult(null);

    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) {
      setError('Amount must be strictly greater than $0.00');
      return;
    }

    if (parsed > availableBalance) {
      setError(`Insufficient balance. Account balance is $${availableBalance.toFixed(2)}, but requested withdrawal is $${parsed.toFixed(2)}.`);
      return;
    }

    setLoading(true);
    try {
      const res = await transactionService.withdraw(
        selectedAccountNumber,
        parsed.toFixed(2),
        description.trim() || 'Customer withdrawal'
      );
      setSuccessResult(res.data);
      setAmount('');
      loadAccounts();
    } catch (err) {
      setError(err.response?.data?.message || 'Withdrawal operation rejected');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', padding: '0.75rem', borderRadius: '50%', backgroundColor: '#fef2f2', marginBottom: '0.75rem' }}>
          <ArrowUpRight size={32} color="#dc2626" />
        </div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A' }}>
          Withdraw Funds from Account
        </h2>
        <p style={{ color: '#64748B', fontSize: '0.875rem' }}>
          Protected by pessimistic row locking and real-time balance validation
        </p>
      </div>

      {error && <Alert type="danger" message={error} onClose={() => setError(null)} />}

      {successResult && (
        <div className="card" style={{ borderLeft: '4px solid #ef4444', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#dc2626', fontWeight: 700, marginBottom: '0.5rem' }}>
            <CheckCircle2 size={20} />
            <span>Withdrawal Successfully Disbursed & Audited</span>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '1rem' }}>
            Transaction Reference: <strong style={{ fontFamily: 'var(--font-mono)' }}>{successResult.reference}</strong>
          </p>
          <div className="grid-2" style={{ marginBottom: '1rem' }}>
            <div className="info-item">
              <span className="info-label">Amount Debited</span>
              <span className="info-value amount amount-negative">-${parseFloat(successResult.amount).toFixed(2)}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Account Debited</span>
              <span className="info-value" style={{ fontFamily: 'var(--font-mono)' }}>{selectedAccountNumber}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to="/customer/transactions" className="btn btn-secondary btn-sm">
              View In Transaction Journal
            </Link>
            <Link to="/customer/accounts" className="btn btn-primary btn-sm">
              Return to Accounts
            </Link>
          </div>
        </div>
      )}

      <div className="form-card">
        {fetchLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ width: '32px', height: '32px' }} />
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Source Account to Debit</label>
              <select
                className="form-control"
                value={selectedAccountNumber}
                onChange={(e) => setSelectedAccountNumber(e.target.value)}
                disabled={loading}
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.accountNumber}>
                    {acc.accountNumber} ({acc.accountType}) — Available: ${parseFloat(acc.balance).toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            {selectedAccount && (
              <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.8125rem', color: '#64748b', display: 'block' }}>Available to Withdraw</span>
                  <span style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>
                    ${availableBalance.toFixed(2)} {selectedAccount.currency}
                  </span>
                </div>
                <button type="button" onClick={handleMaxAmount} className="btn btn-secondary btn-sm" disabled={availableBalance <= 0}>
                  Use Full Balance
                </button>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Withdrawal Amount (USD)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 600, color: '#64748b' }}>$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="form-control"
                  style={{ paddingLeft: '2rem' }}
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              {/* Quick Amount Chips */}
              <div className="quick-amounts">
                {[20, 50, 100, 200, 500].map((val) => (
                  <button
                    key={val}
                    type="button"
                    className={`quick-amount-chip ${amount === val.toString() ? 'selected' : ''}`}
                    onClick={() => handleQuickAmount(val)}
                    disabled={val > availableBalance}
                  >
                    ${val}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Withdrawal Purpose / Memo</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. ATM withdrawal, bill payment, external transfer"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
              />
            </div>

            <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', padding: '0.875rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.8125rem', color: '#92400e' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                <AlertTriangle size={16} />
                <span>Overdraft Protection Guarantee</span>
              </div>
              The server locks your account row (`SELECT ... FOR UPDATE`) before checking balance and booking entries, mathematically preventing overdraft races.
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              style={{ backgroundColor: '#dc2626', borderColor: '#b91c1c' }}
              disabled={loading || accounts.length === 0 || availableBalance <= 0}
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: '16px', height: '16px' }} />
                  <span>Executing Double-Entry Booking...</span>
                </>
              ) : (
                <>
                  <ArrowUpRight size={16} />
                  <span>Confirm and Withdraw ${amount ? parseFloat(amount).toFixed(2) : '0.00'}</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
