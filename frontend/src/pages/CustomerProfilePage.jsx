import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { accountService } from '../services/accountService';
import { Alert } from '../components/Alert';
import {
  User,
  ShieldCheck,
  KeyRound,
  Mail,
  Fingerprint,
  Wallet,
  LogOut,
  Lock,
  Save,
  CheckCircle2,
  ShieldAlert,
  Building2,
  Shield
} from 'lucide-react';

export const CustomerProfilePage = () => {
  const { user, role, updateProfile, changePassword, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active tab: 'profile' or 'security'
  const initialTab = searchParams.get('tab') === 'security' ? 'security' : 'profile';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync tab with URL search parameter if changed via navigation
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'security') {
      setActiveTab('security');
    } else {
      setActiveTab('profile');
    }
  }, [searchParams]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams(tab === 'security' ? { tab: 'security' } : {});
  };

  // Profile Form State
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(null);
  const [profileError, setProfileError] = useState(null);

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securitySuccess, setSecuritySuccess] = useState(null);
  const [securityError, setSecurityError] = useState(null);

  // Account portfolio summary
  const [accounts, setAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(true);

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
      // Ignore background portfolio fetch error
    } finally {
      setAccountsLoading(false);
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

  const handleSecuritySubmit = async (e) => {
    e.preventDefault();
    setSecurityError(null);
    setSecuritySuccess(null);

    if (newPassword.length < 8) {
      setSecurityError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setSecurityError('New password and confirmation do not match.');
      return;
    }

    setSecurityLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setSecuritySuccess('Password updated successfully. Please use your new password next time you log in.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setSecurityError(err.response?.data?.message || 'Failed to update password.');
    } finally {
      setSecurityLoading(false);
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
    <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '3rem' }}>
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
          Profile & Security Settings
        </h1>
        <p style={{ color: '#4A5568', fontSize: '0.875rem', margin: 0 }}>
          Manage your verified credentials, identity settings, and institutional defense controls
        </p>
      </div>

      {/* Primary Account Card Banner */}
      <div className="bv-card" style={{ marginBottom: '1.5rem', padding: '1.75rem 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#092218',
                color: '#E8EFE8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.75rem',
                fontFamily: "'Newsreader', serif",
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(9, 34, 24, 0.15)',
              }}
            >
              {initial}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
                <h2 style={{ fontSize: '1.375rem', fontWeight: 600, color: '#092218', margin: 0 }}>
                  {displayName}
                </h2>
                <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                  {getRoleLabel()}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#667085', fontSize: '0.8125rem' }}>
                <span>@{user?.username}</span>
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
                border: '1px solid #E2E8E0',
                minWidth: '130px',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: '#667085', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                User Identifier
              </div>
              <div style={{ fontSize: '1.125rem', fontWeight: 600, color: '#092218', fontFamily: 'monospace' }}>
                #{user?.id || '—'}
              </div>
            </div>

            {role === 'CUSTOMER' && (
              <div
                style={{
                  padding: '0.75rem 1.25rem',
                  backgroundColor: '#F8FAF8',
                  borderRadius: '12px',
                  border: '1px solid #E2E8E0',
                  minWidth: '150px',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: '#667085', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Net Assets
                </div>
                <div style={{ fontSize: '1.125rem', fontWeight: 600, color: '#092218' }}>
                  ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '2px solid #E2E8E0',
          marginBottom: '1.5rem',
        }}
      >
        <button
          type="button"
          onClick={() => handleTabChange('profile')}
          style={{
            padding: '0.875rem 1.5rem',
            fontSize: '0.9375rem',
            fontWeight: activeTab === 'profile' ? 600 : 500,
            color: activeTab === 'profile' ? '#092218' : '#667085',
            borderBottom: activeTab === 'profile' ? '3px solid #092218' : '3px solid transparent',
            marginBottom: '-2px',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.15s ease',
          }}
        >
          <User size={18} color={activeTab === 'profile' ? '#092218' : '#667085'} />
          <span>Profile Information</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('security')}
          style={{
            padding: '0.875rem 1.5rem',
            fontSize: '0.9375rem',
            fontWeight: activeTab === 'security' ? 600 : 500,
            color: activeTab === 'security' ? '#092218' : '#667085',
            borderBottom: activeTab === 'security' ? '3px solid #092218' : '3px solid transparent',
            marginBottom: '-2px',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.15s ease',
          }}
        >
          <Lock size={18} color={activeTab === 'security' ? '#092218' : '#667085'} />
          <span>Security & Password</span>
        </button>
      </div>

      {/* TAB 1: PROFILE INFORMATION */}
      {activeTab === 'profile' && (
        <div className="bv-card" style={{ padding: '2rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#092218', margin: '0 0 0.25rem' }}>
              Personal Details
            </h3>
            <p style={{ fontSize: '0.8125rem', color: '#667085', margin: 0 }}>
              Update your identity details registered with BalanceVault institutional accounts.
            </p>
          </div>

          <form onSubmit={handleProfileSubmit}>
            {profileError && <Alert type="error" message={profileError} />}
            {profileSuccess && <Alert type="success" message={profileSuccess} />}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: '#344054', fontSize: '0.875rem' }}>
                  Full Legal Name
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. John Doe"
                    required
                    style={{ paddingLeft: '2.5rem' }}
                  />
                  <User
                    size={16}
                    color="#98A2B3"
                    style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: '#344054', fontSize: '0.875rem' }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    style={{ paddingLeft: '2.5rem' }}
                  />
                  <Mail
                    size={16}
                    color="#98A2B3"
                    style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: '#344054', fontSize: '0.875rem' }}>
                  Username <span style={{ color: '#98A2B3', fontWeight: 400 }}>(Permanent Handle)</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={user?.username || ''}
                  disabled
                  style={{ backgroundColor: '#F8FAF8', color: '#667085', cursor: 'not-allowed' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: '#344054', fontSize: '0.875rem' }}>
                  Account Role
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={`${getRoleLabel()} (${role})`}
                  disabled
                  style={{ backgroundColor: '#F8FAF8', color: '#667085', cursor: 'not-allowed' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid #E2E8E0', paddingTop: '1.5rem' }}>
              <button
                type="submit"
                disabled={profileLoading}
                className="btn btn-primary"
                style={{ backgroundColor: '#092218', borderColor: '#092218', minWidth: '140px' }}
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
      )}

      {/* TAB 2: SECURITY & PASSWORD */}
      {activeTab === 'security' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Change Password Card */}
          <div className="bv-card" style={{ padding: '2rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#092218', margin: '0 0 0.25rem' }}>
                Change Password
              </h3>
              <p style={{ fontSize: '0.8125rem', color: '#667085', margin: 0 }}>
                Ensure your account is protected with a secure password containing at least 8 characters.
              </p>
            </div>

            <form onSubmit={handleSecuritySubmit}>
              {securityError && <Alert type="error" message={securityError} />}
              {securitySuccess && <Alert type="success" message={securitySuccess} />}

              <div className="form-group" style={{ marginBottom: '1.25rem', maxWidth: '440px' }}>
                <label className="form-label" style={{ fontWeight: 600, color: '#344054', fontSize: '0.875rem' }}>
                  Current Password
                </label>
                <input
                  type="password"
                  className="form-input"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, color: '#344054', fontSize: '0.875rem' }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    className="form-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    required
                  />
                  <span style={{ fontSize: '0.75rem', color: '#667085', marginTop: '0.375rem', display: 'block' }}>
                    Must be at least 8 characters.
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, color: '#344054', fontSize: '0.875rem' }}>
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    className="form-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #E2E8E0', paddingTop: '1.5rem' }}>
                <button
                  type="submit"
                  disabled={securityLoading}
                  className="btn btn-primary"
                  style={{ backgroundColor: '#092218', borderColor: '#092218', minWidth: '160px' }}
                >
                  {securityLoading ? (
                    <span>Updating...</span>
                  ) : (
                    <>
                      <KeyRound size={16} />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Cryptographic Defense Infrastructure Information */}
          <div className="bv-card" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#092218', margin: '0 0 1.25rem' }}>
              Security Infrastructure & Protections
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              <div style={{ padding: '1.25rem', backgroundColor: '#F8FAF8', borderRadius: '12px', border: '1px solid #E2E8E0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem' }}>
                  <ShieldCheck size={20} color="#059669" />
                  <strong style={{ fontSize: '0.875rem', color: '#092218' }}>BCrypt Password Salt</strong>
                </div>
                <p style={{ fontSize: '0.8125rem', color: '#4A5568', margin: 0, lineHeight: 1.5 }}>
                  Passwords use salted BCrypt key-derivation. Credentials are never persisted in plaintext or exposed to browser storage.
                </p>
              </div>

              <div style={{ padding: '1.25rem', backgroundColor: '#F8FAF8', borderRadius: '12px', border: '1px solid #E2E8E0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem' }}>
                  <Lock size={20} color="#2563EB" />
                  <strong style={{ fontSize: '0.875rem', color: '#092218' }}>Signed JWT Bearer</strong>
                </div>
                <p style={{ fontSize: '0.8125rem', color: '#4A5568', margin: 0, lineHeight: 1.5 }}>
                  HMAC-SHA256 signature verification protects all money movement APIs. Token revocation blacklist activates upon sign-out.
                </p>
              </div>

              <div style={{ padding: '1.25rem', backgroundColor: '#F8FAF8', borderRadius: '12px', border: '1px solid #E2E8E0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem' }}>
                  <KeyRound size={20} color="#7C3AED" />
                  <strong style={{ fontSize: '0.875rem', color: '#092218' }}>IDOR Account Defense</strong>
                </div>
                <p style={{ fontSize: '0.8125rem', color: '#4A5568', margin: 0, lineHeight: 1.5 }}>
                  Strict server-side validation strictly isolates customer funds, preventing cross-tenant access to accounts and transactions.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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
          }}
        >
          <LogOut size={16} color="#DC2626" />
          <span>Sign Out of BalanceVault Session</span>
        </button>
      </div>
    </div>
  );
};
