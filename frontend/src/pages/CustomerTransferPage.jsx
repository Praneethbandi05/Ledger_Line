import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { accountService } from '../services/accountService';
import { transactionService } from '../services/transactionService';
import { Alert } from '../components/Alert';
import {
  ArrowLeftRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Wallet
} from 'lucide-react';

export const CustomerTransferPage = () => {
  const [accounts, setAccounts] = useState([]);
  const [sourceAccountNumber, setSourceAccountNumber] = useState('');
  const [destinationAccountNumber, setDestinationAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('Account-to-account transfer');
  const [isConfirming, setIsConfirming] = useState(false);
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
        setSourceAccountNumber(data[0].accountNumber);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load accounts');
    } finally {
      setFetchLoading(false);
    }
  };

  const selectedSourceAccount = accounts.find((a) => a.accountNumber === sourceAccountNumber);
  const availableBalance = selectedSourceAccount ? parseFloat(selectedSourceAccount.balance) : 0;

  const handleInitialValidate = (e) => {
    e.preventDefault();
    setError(null);
    setSuccessResult(null);

    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) {
      setError('Amount must be strictly greater than $0.00');
      return;
    }

    if (parsed > availableBalance) {
      setError(`Insufficient funds in source account. Available balance: $${availableBalance.toFixed(2)}, Requested: $${parsed.toFixed(2)}`);
      return;
    }

    const cleanDest = destinationAccountNumber.trim();
    if (!cleanDest) {
      setError('Please provide a valid destination account number');
      return;
    }

    if (cleanDest.toUpperCase() === sourceAccountNumber.toUpperCase()) {
      setError('Source and destination accounts cannot be identical');
      return;
    }

    setIsConfirming(true);
  };

  const handleExecuteTransfer = async () => {
    setLoading(true);
    setError(null);

    try {
      const parsed = parseFloat(amount);
      const res = await transactionService.transfer(
        sourceAccountNumber,
        destinationAccountNumber.trim(),
        parsed.toFixed(2),
        description.trim() || 'Internal transfer'
      );
      setSuccessResult(res.data);
      setIsConfirming(false);
      setAmount('');
      setDestinationAccountNumber('');
      loadAccounts();
    } catch (err) {
      setError(err.response?.data?.message || 'Transfer failed or rejected');
      setIsConfirming(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', padding: '0.75rem', borderRadius: '50%', backgroundColor: '#eff6ff', marginBottom: '0.75rem' }}>
          <ArrowLeftRight size={32} color="#2563eb" />
        </div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A' }}>
          Internal Account-to-Account Transfer
        </h2>
        <p style={{ color: '#64748B', fontSize: '0.875rem' }}>
          Deadlock-free deterministic locking with atomic double-entry balance updates
        </p>
      </div>

      {error && <Alert type="danger" message={error} onClose={() => setError(null)} />}

      {successResult && (
        <div className="card" style={{ borderLeft: '4px solid #2563eb', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1d4ed8', fontWeight: 700, marginBottom: '0.5rem' }}>
            <CheckCircle2 size={20} />
            <span>Transfer Completed & Balanced</span>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '1rem' }}>
            Transaction Reference: <strong style={{ fontFamily: 'var(--font-mono)' }}>{successResult.reference}</strong>
          </p>
          <div className="grid-2" style={{ marginBottom: '1rem' }}>
            <div className="info-item">
              <span className="info-label">Amount Transferred</span>
              <span className="info-value amount">${parseFloat(successResult.amount).toFixed(2)}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Route</span>
              <span className="info-value" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>
                {sourceAccountNumber} → {successResult.destinationAccount?.accountNumber || destinationAccountNumber}
              </span>
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

      {/* Confirmation Step */}
      {isConfirming ? (
        <div className="form-card" style={{ border: '2px solid #3b82f6' }}>
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <ShieldCheck size={20} color="#2563eb" />
            <span>Review & Authorize Transfer</span>
          </h3>

          <div style={{ backgroundColor: '#f8fafc', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b', fontSize: '0.875rem' }}>From Account (Debit)</span>
              <strong style={{ fontFamily: 'var(--font-mono)' }}>{sourceAccountNumber}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b', fontSize: '0.875rem' }}>To Account (Credit)</span>
              <strong style={{ fontFamily: 'var(--font-mono)' }}>{destinationAccountNumber.trim()}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Transfer Amount</span>
              <strong className="amount" style={{ fontSize: '1.125rem', color: '#2563eb' }}>
                ${parseFloat(amount).toFixed(2)} USD
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Narrative Memo</span>
              <span style={{ color: '#334155' }}>{description}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={() => setIsConfirming(false)}
              disabled={loading}
            >
              Back / Modify
            </button>
            <button
              type="button"
              className="btn btn-primary"
              style={{ flex: 2 }}
              onClick={handleExecuteTransfer}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: '16px', height: '16px' }} />
                  <span>Executing Transfer...</span>
                </>
              ) : (
                <>
                  <ArrowLeftRight size={16} />
                  <span>Authorize Transfer</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="form-card">
          {fetchLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <div className="spinner" style={{ width: '32px', height: '32px' }} />
            </div>
          ) : (
            <form onSubmit={handleInitialValidate}>
              <div className="form-group">
                <label className="form-label">Source Account to Debit</label>
                <select
                  className="form-control"
                  value={sourceAccountNumber}
                  onChange={(e) => setSourceAccountNumber(e.target.value)}
                  disabled={loading}
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.accountNumber}>
                      {acc.accountNumber} ({acc.accountType}) — Available: ${parseFloat(acc.balance).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              {selectedSourceAccount && (
                <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>Available Balance</span>
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                    ${availableBalance.toFixed(2)} {selectedSourceAccount.currency}
                  </span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Destination Account Number</label>
                <input
                  type="text"
                  className="form-control"
                  style={{ fontFamily: 'var(--font-mono)' }}
                  placeholder="e.g. ACC-BOB-01 or ACC-ALICE-02"
                  value={destinationAccountNumber}
                  onChange={(e) => setDestinationAccountNumber(e.target.value)}
                  disabled={loading}
                  required
                />
                <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
                  Enter the recipient's institutional account identifier
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Transfer Amount (USD)</label>
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
              </div>

              <div className="form-group">
                <label className="form-label">Transfer Narrative / Memo</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Invoice payment, personal transfer"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', padding: '0.875rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.8125rem', color: '#1e40af' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  <ShieldCheck size={16} />
                  <span>Deterministic Lock Ordering</span>
                </div>
                Accounts are locked in ascending primary key ID order (`min(id1, id2)` then `max(id1, id2)`), mathematically eliminating cross-transfer deadlocks.
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={loading || accounts.length === 0 || availableBalance <= 0}
              >
                <ArrowRight size={16} />
                <span>Review & Confirm Transfer</span>
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
