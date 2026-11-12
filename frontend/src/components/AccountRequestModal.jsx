import React, { useState } from 'react';
import { accountService } from '../services/accountService';
import { Alert } from './Alert';
import { Building2, X, CheckCircle2, ShieldAlert } from 'lucide-react';

export const AccountRequestModal = ({ isOpen, onClose, onSuccess }) => {
  const [accountType, setAccountType] = useState('CHECKING');
  const [currency, setCurrency] = useState('USD');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const created = await accountService.createAccount(accountType, currency);
      setSuccess(`Account request submitted for ${accountType} (${currency}). Account Number: ${created.accountNumber}. It is now awaiting administrator review and activation.`);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
        setSuccess(null);
      }, 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit account request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '480px', borderRadius: '16px' }}>
        <div className="modal-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8E0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#E8EFE8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={18} color="#0B251C" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0B251C', margin: 0 }}>Request an Account</h3>
              <p style={{ fontSize: '0.75rem', color: '#667085', margin: 0 }}>Onboarding workflow: Requires administrator permission</p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close" type="button">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          {error && <Alert type="error" message={error} />}
          {success && <Alert type="success" message={success} />}

          <div style={{ padding: '0.875rem', backgroundColor: '#F4F7F4', borderRadius: '10px', marginBottom: '1.25rem', border: '1px solid #D8E2D8' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <ShieldAlert size={16} color="#0B251C" style={{ marginTop: '2px', flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#2D3748', lineHeight: 1.4 }}>
                <strong>Role-Based Approval Process:</strong> As an Account Holder, newly requested accounts undergo administrator verification before financial operations (deposits, withdrawals, transfers) are activated.
              </p>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#344054' }}>Account Type</label>
            <select
              className="form-select"
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
              required
            >
              <option value="CHECKING">Checking Account (Daily transactions)</option>
              <option value="SAVINGS">Savings Account (Yield & deposits)</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#344054' }}>Currency</label>
            <select
              className="form-select"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              required
            >
              <option value="USD">USD ($) — United States Dollar</option>
              <option value="EUR">EUR (€) — Euro</option>
              <option value="GBP">GBP (£) — British Pound</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#344054' }}>Purpose / Remarks (Optional)</label>
            <input
              type="text"
              className="form-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Primary operational account"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary btn-md">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-md"
              style={{ backgroundColor: '#0B251C', borderColor: '#0B251C' }}
            >
              {loading ? 'Submitting Request...' : 'Submit Account Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
