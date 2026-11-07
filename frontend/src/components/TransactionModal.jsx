import React, { useState } from 'react';
import { X, ArrowRight, ShieldCheck, AlertTriangle } from 'lucide-react';
import { transactionService } from '../services/transactionService';
import { Alert } from './Alert';

export const TransactionModal = ({ isOpen, onClose, type, accounts = [], onSuccess }) => {
  if (!isOpen) return null;

  const [accountNumber, setAccountNumber] = useState(accounts[0]?.accountNumber || '');
  const [destinationAccountNumber, setDestinationAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getTitle = () => {
    switch (type) {
      case 'deposit':
        return 'Deposit Funds';
      case 'withdraw':
        return 'Withdraw Funds';
      case 'transfer':
        return 'Transfer Funds';
      default:
        return 'Financial Operation';
    }
  };

  const handleInitialSubmit = (e) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Amount must be strictly greater than $0.00');
      return;
    }

    if (type === 'transfer') {
      if (!destinationAccountNumber.trim()) {
        setError('Destination account number is required');
        return;
      }
      if (accountNumber === destinationAccountNumber.trim()) {
        setError('Cannot transfer funds to the same account');
        return;
      }
      // Enter two-step confirmation for transfers
      setIsConfirming(true);
      return;
    }

    // Execute direct deposit or withdrawal
    executeOperation();
  };

  const executeOperation = async () => {
    setLoading(true);
    setError(null);

    try {
      if (type === 'deposit') {
        await transactionService.deposit(accountNumber, amount, description);
      } else if (type === 'withdraw') {
        await transactionService.withdraw(accountNumber, amount, description);
      } else if (type === 'transfer') {
        await transactionService.transfer(
          accountNumber,
          destinationAccountNumber.trim(),
          amount,
          description
        );
      }

      onSuccess();
      handleClose();
    } catch (err) {
      const serverMessage = err.response?.data?.message || err.message || 'Transaction failed';
      setError(serverMessage);
      setIsConfirming(false);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAmount('');
    setDescription('');
    setDestinationAccountNumber('');
    setIsConfirming(false);
    setError(null);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h3 className="modal-title">{getTitle()}</h3>
            <span
              style={{
                fontSize: '0.6875rem',
                padding: '0.15rem 0.5rem',
                borderRadius: '4px',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                fontWeight: 600,
              }}
            >
              Idempotent • Double-Entry
            </span>
          </div>
          <button
            onClick={handleClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
          >
            <X size={20} />
          </button>
        </div>

        {error && <Alert type="danger" message={error} />}

        {!isConfirming ? (
          <form onSubmit={handleInitialSubmit}>
            <div className="form-group">
              <label className="form-label">
                {type === 'transfer' ? 'Source Account' : 'Account'}
              </label>
              <select
                className="form-control"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                required
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.accountNumber}>
                    {acc.accountNumber} ({acc.accountType}) — ${parseFloat(acc.balance).toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            {type === 'transfer' && (
              <div className="form-group">
                <label className="form-label">Destination Account Number</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. ACC-BOB-01"
                  value={destinationAccountNumber}
                  onChange={(e) => setDestinationAccountNumber(e.target.value)}
                  required
                />
                <span className="form-hint">Enter the recipient's internal LedgerLine account number</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Amount (USD)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="form-control"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description / Reference Note</label>
              <input
                type="text"
                className="form-control"
                placeholder="Optional purpose note"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                type="button"
                onClick={handleClose}
                className="btn btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`btn ${type === 'withdraw' ? 'btn-danger' : 'btn-primary'}`}
                disabled={loading}
              >
                {loading ? 'Processing...' : type === 'transfer' ? 'Review Transfer' : 'Confirm & Execute'}
              </button>
            </div>
          </form>
        ) : (
          <div>
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '1.25rem',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#1e40af' }}>
                <ShieldCheck size={18} />
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Transfer Confirmation Review</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                <span style={{ color: '#64748B' }}>From Account:</span>
                <span style={{ fontWeight: 600 }}>{accountNumber}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                <span style={{ color: '#64748B' }}>To Account:</span>
                <span style={{ fontWeight: 600 }}>{destinationAccountNumber}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                <span style={{ color: '#64748B' }}>Transfer Amount:</span>
                <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '1rem' }}>
                  ${parseFloat(amount).toFixed(2)} USD
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: '#64748B' }}>Transaction Fee:</span>
                <span style={{ color: '#10B981', fontWeight: 600 }}>$0.00 (Free)</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setIsConfirming(false)}
                className="btn btn-secondary"
                disabled={loading}
              >
                Back
              </button>
              <button
                type="button"
                onClick={executeOperation}
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Authorizing Transfer...' : 'Execute Authorized Transfer'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
