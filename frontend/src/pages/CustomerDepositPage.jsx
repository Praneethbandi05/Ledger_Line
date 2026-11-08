import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { accountService } from '../services/accountService';
import { transactionService } from '../services/transactionService';
import { Alert } from '../components/Alert';
import {
  ArrowDownLeft,
  ShieldCheck,
  CheckCircle2,
  Wallet,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

export const CustomerDepositPage = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountNumber, setSelectedAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('Customer cash deposit');
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

  const handleQuickAmount = (val) => {
    setAmount(val.toString());
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

    if (!selectedAccountNumber) {
      setError('Please select an active destination account');
      return;
    }

    setLoading(true);
    try {
      const res = await transactionService.deposit(
        selectedAccountNumber,
        parsed.toFixed(2),
        description.trim() || 'Customer deposit'
      );
      setSuccessResult(res.data);
      setAmount('');
      loadAccounts();
    } catch (err) {
      setError(err.response?.data?.message || 'Deposit operation failed');
    } finally {
      setLoading(false);
    }
  };

  const selectedAccount = accounts.find((a) => a.accountNumber === selectedAccountNumber);

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', padding: '0.75rem', borderRadius: '50%', backgroundColor: '#ecfdf5', marginBottom: '0.75rem' }}>
          <ArrowDownLeft size={32} color="#059669" />
        </div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A' }}>
          Deposit Funds into Account
        </h2>
        <p style={{ color: '#64748B', fontSize: '0.875rem' }}>
          Institutional double-entry booking: Cleared against institutional inflow reserve
        </p>
      </div>

      {error && <Alert type="danger" message={error} onClose={() => setError(null)} />}

      {successResult && (
        <div className="card" style={{ borderLeft: '4px solid #10b981', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#059669', fontWeight: 700, marginBottom: '0.5rem' }}>
            <CheckCircle2 size={20} />
            <span>Deposit Successfully Processed & Audited</span>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '1rem' }}>
            Transaction Reference: <strong style={{ fontFamily: 'var(--font-mono)' }}>{successResult.reference}</strong>
          </p>
          <div className="grid-2" style={{ marginBottom: '1rem' }}>
            <div className="info-item">
              <span className="info-label">Amount Credited</span>
              <span className="info-value amount amount-positive">${parseFloat(successResult.amount).toFixed(2)}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Account Number</span>
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
              <label className="form-label">Destination Account</label>
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
                <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>Current Balance</span>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                  ${parseFloat(selectedAccount.balance).toFixed(2)} {selectedAccount.currency}
                </span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Deposit Amount (USD)</label>
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
                {[25, 50, 100, 250, 500, 1000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    className={`quick-amount-chip ${amount === val.toString() ? 'selected' : ''}`}
                    onClick={() => handleQuickAmount(val)}
                  >
                    +${val}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Transaction Narrative / Reference Memo</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Payroll direct deposit, savings allocation"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
              />
            </div>

            <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', padding: '0.875rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.8125rem', color: '#1e40af' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                <ShieldCheck size={16} />
                <span>Protected by PostgreSQL Idempotency</span>
              </div>
              Each submission generates a unique crypto UUID idempotency key preventing accidental duplicate deposits.
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={loading || accounts.length === 0}>
              {loading ? (
                <>
                  <div className="spinner" style={{ width: '16px', height: '16px' }} />
                  <span>Executing Double-Entry Booking...</span>
                </>
              ) : (
                <>
                  <ArrowDownLeft size={16} />
                  <span>Confirm and Deposit ${amount ? parseFloat(amount).toFixed(2) : '0.00'}</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
