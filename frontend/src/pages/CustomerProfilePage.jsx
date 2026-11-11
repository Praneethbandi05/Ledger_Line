import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { accountService } from '../services/accountService';
import { Alert } from '../components/Alert';
import {
  User,
  Mail,
  Save,
  LogOut,
  Building2
} from 'lucide-react';

export const CustomerProfilePage = () => {
  const { user, role, updateProfile, logout } = useAuth();

  // Profile Form State
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(null);
  const [profileError, setProfileError] = useState(null);

  // Account portfolio summary (for net assets display)
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    loadAccounts();
    if (user) {
      setFullName(user.fullName || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const loadAccounts = async () => {
    try {
      const data = await accountService.getMyAccounts();
      const list = Array.isArray(data) ? data : (data?.content || []);
      setAccounts(list);
    } catch (err) {
      // Background non-fatal
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);
    setProfileLoading(true);

    try {
      await updateProfile(fullName, email);
      setProfileSuccess('Profile information updated successfully.');
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const totalBalance = accounts
    .filter((a) => a.status === 'ACTIVE')
    .reduce((sum, a) => sum + parseFloat(a.balance || 0), 0);

  const getRoleLabel = () => {
    switch (role) {
      case 'ADMIN':
        return 'Administrator';
      case 'AUDITOR':
        return 'Compliance Auditor';
      default:
        return 'Account Holder';
    }
  };

  const displayName = user?.fullName || user?.username || 'User';
  const initial = (user?.username || user?.fullName || 'U').charAt(0).toUpperCase();

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div className="bv-section-header">
          <span>ACCOUNT &bull; IDENTITY &bull; CREDENTIALS</span>
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
          Profile Information
        </h1>
        <p style={{ color: '#688073', fontSize: '0.875rem', margin: 0 }}>
          Manage your verified credentials and personal identity details registered with Balance Vault.
        </p>
      </div>

      {/* Account Identity Card */}
      <div
        className="bv-card"
        style={{
          marginBottom: '2rem',
          padding: '1.75rem 2rem',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E5EBE5',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.02)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#092218',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.75rem',
                fontFamily: "'Newsreader', serif",
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(9, 34, 24, 0.15)',
                flexShrink: 0,
              }}
            >
              {initial}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.375rem', fontWeight: 600, color: '#092218', margin: 0 }}>
                  {displayName}
                </h2>
                <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                  {getRoleLabel()}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#688073', fontSize: '0.8125rem', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--font-mono)' }}>@{user?.username}</span>
                <span>&bull;</span>
                <span>{user?.email || 'No email registered'}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div
              style={{
                padding: '0.75rem 1.25rem',
                backgroundColor: '#F8FAF8',
                borderRadius: '12px',
                border: '1px solid #E5EBE5',
                minWidth: '130px',
              }}
            >
              <div style={{ fontSize: '0.6875rem', color: '#688073', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                USER IDENTIFIER
              </div>
              <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#092218', fontFamily: 'var(--font-mono)', marginTop: '0.25rem' }}>
                #{user?.id || '—'}
              </div>
            </div>

            {role === 'CUSTOMER' && (
              <div
                style={{
                  padding: '0.75rem 1.25rem',
                  backgroundColor: '#F8FAF8',
                  borderRadius: '12px',
                  border: '1px solid #E5EBE5',
                  minWidth: '150px',
                }}
              >
                <div style={{ fontSize: '0.6875rem', color: '#688073', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                  NET ASSETS
                </div>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#166534', fontFamily: "'Newsreader', serif", marginTop: '0.25rem' }}>
                  ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Personal Details Form */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E5EBE5',
          padding: '2rem 2.25rem',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.02)',
        }}
      >
        <div style={{ marginBottom: '1.75rem' }}>
          <h3 style={{ fontSize: '1.1875rem', fontWeight: 600, color: '#092218', margin: '0 0 0.375rem' }}>
            Personal Details
          </h3>
          <p style={{ fontSize: '0.8125rem', color: '#688073', margin: 0 }}>
            Update your identity details registered with Balance Vault institutional accounts.
          </p>
        </div>

        <form onSubmit={handleProfileSubmit}>
          {profileError && (
            <div style={{ marginBottom: '1.5rem' }}>
              <Alert type="danger" message={profileError} onClose={() => setProfileError(null)} />
            </div>
          )}
          {profileSuccess && (
            <div style={{ marginBottom: '1.5rem' }}>
              <Alert type="success" message={profileSuccess} onClose={() => setProfileSuccess(null)} />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: 600, color: '#243D32', fontSize: '0.8125rem', marginBottom: '0.5rem', display: 'block' }}>
                Full Legal Name
              </label>
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  type="text"
                  className="form-control"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. John Doe"
                  required
                  style={{
                    width: '100%',
                    height: '46px',
                    paddingLeft: '2.5rem',
                    paddingRight: '1rem',
                    borderRadius: '8px',
                    border: '1px solid #D0D5DD',
                    fontSize: '0.9375rem',
                    boxSizing: 'border-box',
                  }}
                />
                <User
                  size={17}
                  color="#688073"
                  style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }}
                />
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: 600, color: '#243D32', fontSize: '0.8125rem', marginBottom: '0.5rem', display: 'block' }}>
                Email Address
              </label>
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  style={{
                    width: '100%',
                    height: '46px',
                    paddingLeft: '2.5rem',
                    paddingRight: '1rem',
                    borderRadius: '8px',
                    border: '1px solid #D0D5DD',
                    fontSize: '0.9375rem',
                    boxSizing: 'border-box',
                  }}
                />
                <Mail
                  size={17}
                  color="#688073"
                  style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: 600, color: '#243D32', fontSize: '0.8125rem', marginBottom: '0.5rem', display: 'block' }}>
                Username <span style={{ color: '#88A796', fontWeight: 400 }}>(Permanent Handle)</span>
              </label>
              <input
                type="text"
                className="form-control"
                value={user?.username || ''}
                disabled
                style={{
                  width: '100%',
                  height: '46px',
                  padding: '0.625rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid #E5EBE5',
                  backgroundColor: '#F8FAF8',
                  color: '#688073',
                  cursor: 'not-allowed',
                  fontFamily: 'var(--font-mono)',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: 600, color: '#243D32', fontSize: '0.8125rem', marginBottom: '0.5rem', display: 'block' }}>
                Account Role
              </label>
              <input
                type="text"
                className="form-control"
                value={`${getRoleLabel()} (${role || 'USER'})`}
                disabled
                style={{
                  width: '100%',
                  height: '46px',
                  padding: '0.625rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid #E5EBE5',
                  backgroundColor: '#F8FAF8',
                  color: '#688073',
                  cursor: 'not-allowed',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #E5EBE5', paddingTop: '1.5rem' }}>
            <button
              type="submit"
              disabled={profileLoading}
              className="btn btn-primary"
              style={{
                backgroundColor: '#092218',
                borderColor: '#092218',
                minWidth: '150px',
                height: '44px',
                borderRadius: '8px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                color: '#FFFFFF',
              }}
            >
              {profileLoading ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Save size={16} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Session Sign Out Action */}
      <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={logout}
          className="btn btn-secondary"
          style={{
            backgroundColor: '#FEF2F2',
            color: '#DC2626',
            borderColor: '#FEE2E2',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.25rem',
            borderRadius: '8px',
            fontWeight: 500,
          }}
        >
          <LogOut size={16} color="#DC2626" />
          <span>Sign Out of Balance Vault Session</span>
        </button>
      </div>
    </div>
  );
};
