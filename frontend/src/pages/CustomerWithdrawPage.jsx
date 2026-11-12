import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  const navigate = useNavigate();
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
      const list = Array.isArray(data) ? data : (data?.content || []);
      const activeList = list.filter((a) => a.status === 'ACTIVE');
      setAccounts(activeList);
      if (activeList && activeList.length > 0) {
        setSelectedAccountNumber(activeList[0].accountNumber);
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
      setError('Withdrawal amount must be strictly greater than $0.00');
      return;
    }

    if (!selectedAccountNumber) {
      setError('Please select an active account to withdraw from');
      return;
    }

    if (parsed > availableBalance) {
      setError(`Insufficient funds. Requested $${parsed.toFixed(2)} exceeds available balance ($${availableBalance.toFixed(2)}).`);
      return;
    }

    setLoading(true);
    try {
      const res = await transactionService.withdraw(
        selectedAccountNumber,
        parsed.toFixed(2),
        description.trim() || 'Customer cash withdrawal'
      );
      setSuccessResult(res.data);
      setAmount('');
      loadAccounts();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Withdrawal operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div className="bv-section-header">
          <span>MONEY MOVEMENT &bull; OUTFLOW</span>
        </div>
        <h1
          style={{
            fontSize: '1.875rem',
            fontWeight: 600,
            color: '#092218',
            fontFamily: "'Newsreader', 'Georgia', serif",
            letterSpacing: '-0.02em',
            margin: '0 0 0.5rem',
          }}
        >
          Withdraw Funds
        </h1>
        <p style={{ color: '#688073', fontSize: '0.875rem', margin: 0, lineHeight: 1.5 }}>
          Debits your selected active account with strict PostgreSQL row-level locks to prevent race conditions and overspending.
        </p>
      </div>

      {error && (
        <div style={{ marginBottom: '1.5rem' }}>
          <Alert type="danger" message={error} onClose={() => setError(null)} />
        </div>
      )}

      {/* Success Notification */}
      {successResult && (
        <div
          style={{
            backgroundColor: '#FEF3C7',
            border: '1px solid #FDE68A',
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '1.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', color: '#92400E', fontWeight: 700, marginBottom: '0.5rem' }}>
            <CheckCircle2 size={20} />
            <span>Withdrawal Successfully Disbursed & Audited</span>
          </div>
          <p style={{ fontSize: '0.84rem', color: '#334155', marginBottom: '1rem' }}>
            Transaction Reference: <strong style={{ fontFamily: 'var(--font-mono)' }}>{successResult.reference}</strong>
          </p>
          <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#78350F' }}>Amount Debited</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#92400E', fontFamily: "'Newsreader', serif" }}>
                -${parseFloat(successResult.amount).toFixed(2)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#78350F' }}>Debited Account</div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#092218', fontFamily: 'var(--font-mono)' }}>
                {selectedAccountNumber}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to="/customer/transactions" className="btn btn-secondary btn-sm" style={{ backgroundColor: '#FFFFFF' }}>
              View in Activity Journal &rarr;
            </Link>
            <Link to="/customer/accounts" className="btn btn-primary btn-sm" style={{ backgroundColor: '#092218' }}>
              Return to Accounts
            </Link>
          </div>
        </div>
      )}

      {/* Main Form Card */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E5EBE5',
          padding: '2rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
        }}
      >
        {fetchLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <div className="spinner" style={{ width: '30px', height: '30px' }} />
          </div>
        ) : accounts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <p style={{ color: '#688073', fontSize: '0.9375rem', marginBottom: '1rem' }}>
              You do not have any active accounts to withdraw from.
            </p>
            <Link
              to="/customer/accounts"
              className="btn btn-primary btn-sm"
              style={{ backgroundColor: '#092218', borderColor: '#092218' }}
            >
              Request an Account
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Account Selector */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#243D32', margin: 0 }}>
                  Select Source Account
                </label>
                {selectedAccount && (
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#166534' }}>
                    Available: ${availableBalance.toFixed(2)}
                  </span>
                )}
              </div>
              <select
                className="form-control"
                value={selectedAccountNumber}
                onChange={(e) => setSelectedAccountNumber(e.target.value)}
                required
                style={{ width: '100%', padding: '0.75rem 0.875rem', borderRadius: '8px', border: '1px solid #D9E2DC' }}
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.accountNumber}>
                    {acc.accountNumber} ({acc.accountType}) &bull; ${parseFloat(acc.balance || 0).toFixed(2)} {acc.currency}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Amount Selector */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#243D32', marginBottom: '0.5rem' }}>
                Quick Amounts
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {[20, 50, 100, 200].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleQuickAmount(val)}
                    style={{
                      padding: '0.4rem 0.875rem',
                      borderRadius: '8px',
                      border: '1px solid #D9E2DC',
                      backgroundColor: amount === val.toString() ? '#092218' : '#F8FAF8',
                      color: amount === val.toString() ? '#FFFFFF' : '#092218',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    ${val}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleMaxAmount}
                  style={{
                    padding: '0.4rem 0.875rem',
                    borderRadius: '8px',
                    border: '1px solid #092218',
                    backgroundColor: '#092218',
                    color: '#FFFFFF',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  MAX AVAILABLE
                </button>
              </div>
            </div>

            {/* Amount Input */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#243D32', marginBottom: '0.5rem' }}>
                Withdrawal Amount ($ USD)
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 600, color: '#688073' }}>
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={availableBalance}
                  placeholder="0.00"
                  className="form-control"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.875rem 0.75rem 2rem',
                    borderRadius: '8px',
                    border: '1px solid #D9E2DC',
                    fontSize: '1.125rem',
                    fontWeight: 600,
                  }}
                />
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: '1.75rem' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#243D32', marginBottom: '0.5rem' }}>
                Withdrawal Purpose / Memo
              </label>
              <input
                type="text"
                placeholder="e.g. ATM withdrawal, expense payout"
                className="form-control"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 0.875rem', borderRadius: '8px', border: '1px solid #D9E2DC' }}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || accounts.length === 0 || availableBalance <= 0}
              style={{
                width: '100%',
                padding: '0.875rem',
                backgroundColor: '#092218',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.9375rem',
                fontWeight: 600,
                cursor: loading || availableBalance <= 0 ? 'not-allowed' : 'pointer',
                opacity: loading || availableBalance <= 0 ? 0.7 : 1,
              }}
            >
              {loading ? 'Executing Row-Locked Withdrawal...' : 'Confirm Cash Withdrawal'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
