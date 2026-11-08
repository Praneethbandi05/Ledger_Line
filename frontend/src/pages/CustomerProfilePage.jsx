import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { accountService } from '../services/accountService';
import { Alert } from '../components/Alert';
import {
  User,
  ShieldCheck,
  KeyRound,
  Mail,
  Fingerprint,
  Calendar,
  Wallet,
  LogOut,
  Lock
} from 'lucide-react';

export const CustomerProfilePage = () => {
  const { user, role, logout } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const data = await accountService.getMyAccounts();
      setAccounts(data);
    } catch (err) {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  const totalBalance = accounts.reduce((sum, a) => sum + parseFloat(a.balance || 0), 0);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A' }}>
          Customer Security & Profile
        </h2>
        <p style={{ color: '#64748B', fontSize: '0.875rem' }}>
          Verified identity credentials, active portfolios, and institutional security settings
        </p>
      </div>

      <div className="profile-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <div className="profile-avatar">
            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : user?.username?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#0f172a' }}>
              {user?.fullName || user?.username}
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>@{user?.username}</p>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <span className="badge badge-success" style={{ textTransform: 'uppercase' }}>{role}</span>
              <span className="badge badge-neutral">Institutional Client</span>
            </div>
          </div>
        </div>

        <div className="grid-2" style={{ marginBottom: '2rem' }}>
          <div className="info-item">
            <span className="info-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Fingerprint size={14} /> User Identifier (UID)
            </span>
            <span className="info-value" style={{ fontFamily: 'var(--font-mono)' }}>#{user?.id || '—'}</span>
          </div>

          <div className="info-item">
            <span className="info-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Mail size={14} /> Registered Email
            </span>
            <span className="info-value">{user?.email || 'N/A'}</span>
          </div>

          <div className="info-item">
            <span className="info-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Wallet size={14} /> Active Accounts
            </span>
            <span className="info-value">{accounts.length} Account(s)</span>
          </div>

          <div className="info-item">
            <span className="info-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <ShieldCheck size={14} /> Total Portfolio Net Balance
            </span>
            <span className="info-value amount" style={{ color: '#0f172a', fontSize: '1.125rem' }}>
              ${totalBalance.toFixed(2)} USD
            </span>
          </div>
        </div>

        {/* Security Controls Information */}
        <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>
          Authentication & Defense Systems
        </h4>

        <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <Lock size={18} color="#059669" style={{ marginTop: '0.125rem' }} />
              <div>
                <strong style={{ fontSize: '0.875rem', color: '#0f172a' }}>BCrypt Password Salt & Hash</strong>
                <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                  Passwords are never stored in plaintext and never stored in browser storage.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <ShieldCheck size={18} color="#2563eb" style={{ marginTop: '0.125rem' }} />
              <div>
                <strong style={{ fontSize: '0.875rem', color: '#0f172a' }}>Cryptographic Bearer JWT Token</strong>
                <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                  HMAC-SHA256 signature verified on all money movement endpoints with token revocation blacklist on sign out.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <KeyRound size={18} color="#7c3aed" style={{ marginTop: '0.125rem' }} />
              <div>
                <strong style={{ fontSize: '0.875rem', color: '#0f172a' }}>IDOR & Account Ownership Validator</strong>
                <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                  Customer accounts are protected at domain and persistence layers against cross-customer unauthorized access.
                </p>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="btn btn-secondary"
          style={{ backgroundColor: '#fef2f2', color: '#991b1b', borderColor: '#fecaca' }}
        >
          <LogOut size={16} />
          <span>Sign Out of LedgerLine Session</span>
        </button>
      </div>
    </div>
  );
};
