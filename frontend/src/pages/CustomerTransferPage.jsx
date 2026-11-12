import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { accountService } from '../services/accountService';
import { transactionService } from '../services/transactionService';
import { Alert } from '../components/Alert';
import {
  ArrowLeftRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Wallet
} from 'lucide-react';

export const CustomerTransferPage = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [sourceAccountNumber, setSourceAccountNumber] = useState('');
  const [destinationAccountNumber, setDestinationAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('Account-to-account transfer');
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
        setSourceAccountNumber(activeList[0].accountNumber);
        if (activeList.length > 1) {
          setDestinationAccountNumber(activeList[1].accountNumber);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load accounts');
    } finally {
      setFetchLoading(false);
    }
  };

  const sourceAccount = accounts.find((a) => a.accountNumber === sourceAccountNumber);
  const availableBalance = sourceAccount ? parseFloat(sourceAccount.balance) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessResult(null);

    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) {
      setError('Transfer amount must be strictly greater than $0.00');
      return;
    }

    if (!sourceAccountNumber) {
      setError('Please select a source account');
      return;
    }

    if (!destinationAccountNumber) {
      setError('Please provide a destination account number');
      return;
    }

    if (sourceAccountNumber === destinationAccountNumber) {
      setError('Source and destination accounts must be distinct');
      return;
    }

    if (parsed > availableBalance) {
      setError(`Insufficient funds in source account. Available balance is $${availableBalance.toFixed(2)}.`);
      return;
    }

    setLoading(true);
    try {
      const res = await transactionService.transfer(
        sourceAccountNumber,
        destinationAccountNumber.trim(),
        parsed.toFixed(2),
        description.trim() || 'Account-to-account transfer'
      );
      setSuccessResult(res.data);
      setAmount('');
      loadAccounts();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Transfer operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div className="bv-section-header">
          <span>MONEY MOVEMENT &bull; DOUBLE-ENTRY TRANSFER</span>
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
          Transfer Funds
        </h1>
        <p style={{ color: '#688073', fontSize: '0.875rem', margin: 0, lineHeight: 1.5 }}>
          Atomic double-entry money movement. Locks source and destination accounts in deterministic alphabetical order to guarantee deadlock-free concurrency.
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
            backgroundColor: '#EFF6FF',
            border: '1px solid #BFDBFE',
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '1.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', color: '#1E40AF', fontWeight: 700, marginBottom: '0.5rem' }}>
            <CheckCircle2 size={20} />
            <span>Transfer Successfully Settled & Balanced</span>
          </div>
          <p style={{ fontSize: '0.84rem', color: '#334155', marginBottom: '1rem' }}>
            Transaction Reference: <strong style={{ fontFamily: 'var(--font-mono)' }}>{successResult.reference}</strong>
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Amount Transferred</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1E40AF', fontFamily: "'Newsreader', serif" }}>
                ${parseFloat(successResult.amount).toFixed(2)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Destination Account</div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#092218', fontFamily: 'var(--font-mono)' }}>
                {destinationAccountNumber}
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
              You do not have any active accounts to originate transfers.
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
            {/* Source Account */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#243D32', margin: 0 }}>
                  Source Account (Debit)
                </label>
                {sourceAccount && (
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#166534' }}>
                    Available: ${availableBalance.toFixed(2)}
                  </span>
                )}
              </div>
              <select
                className="form-control"
                value={sourceAccountNumber}
                onChange={(e) => setSourceAccountNumber(e.target.value)}
                required
                style={{ width: '100%', padding: '0.75rem 0.875rem', borderRadius: '8px', border: '1px solid #D9E2DC' }}
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.accountNumber}>
                    {acc.accountNumber} ({acc.accountType}) &bull; Available: ${parseFloat(acc.balance || 0).toFixed(2)} {acc.currency}
                  </option>
                ))}
              </select>
            </div>

            {/* Destination Account */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#243D32', marginBottom: '0.5rem' }}>
                Destination Account Number (Credit)
              </label>
              <input
                type="text"
                placeholder="e.g. ACC-BOB-01 or ACC-12345678"
                className="form-control"
                value={destinationAccountNumber}
                onChange={(e) => setDestinationAccountNumber(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 0.875rem',
                  borderRadius: '8px',
                  border: '1px solid #D9E2DC',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.9375rem',
                }}
              />
              <span style={{ fontSize: '0.75rem', color: '#688073', marginTop: '0.25rem', display: 'block' }}>
                You can transfer to another of your accounts or to any active recipient account.
              </span>
            </div>

            {/* Amount Input */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#243D32', marginBottom: '0.5rem' }}>
                Transfer Amount ($ USD)
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
                Transfer Memo / Reference
              </label>
              <input
                type="text"
                placeholder="e.g. Invoice payment, personal reallocation"
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
              {loading ? 'Executing Atomic Transfer...' : 'Confirm Double-Entry Transfer'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
