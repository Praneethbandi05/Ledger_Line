import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Alert } from './Alert';
import { User, Lock, X, CheckCircle2, Shield } from 'lucide-react';

export const SettingsModal = ({ isOpen, onClose, initialTab = 'profile' }) => {
  const { user, updateProfile, changePassword, role } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);

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

  if (!isOpen) return null;

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);
    setProfileLoading(true);

    try {
      await updateProfile(fullName, email);
      setProfileSuccess('Profile information updated successfully');
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSecuritySubmit = async (e) => {
    e.preventDefault();
    setSecurityError(null);
    setSecuritySuccess(null);

    if (newPassword.length < 8) {
      setSecurityError('New password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setSecurityError('New password and confirmation do not match');
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
      setSecurityError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setSecurityLoading(false);
    }
  };

  const formatRoleLabel = (r) => {
    switch (r) {
      case 'ADMIN':
        return 'Administrator';
      case 'AUDITOR':
        return 'Compliance Auditor';
      default:
        return 'Account holder';
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '520px', borderRadius: '16px' }}>
        <div className="modal-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8E0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#E8EFE8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={18} color="#0B251C" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0B251C', margin: 0 }}>Account Settings</h3>
              <p style={{ fontSize: '0.75rem', color: '#667085', margin: 0 }}>Manage your profile information and security credentials</p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close" type="button">
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', borderBottom: '1px solid #E2E8E0', backgroundColor: '#F8FAF8', padding: '0 1.5rem' }}>
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            style={{
              padding: '0.75rem 1rem',
              fontSize: '0.875rem',
              fontWeight: activeTab === 'profile' ? 600 : 500,
              color: activeTab === 'profile' ? '#0B251C' : '#667085',
              borderBottom: activeTab === 'profile' ? '2px solid #0B251C' : '2px solid transparent',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
            }}
          >
            <User size={15} />
            <span>Profile Settings</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            style={{
              padding: '0.75rem 1rem',
              fontSize: '0.875rem',
              fontWeight: activeTab === 'security' ? 600 : 500,
              color: activeTab === 'security' ? '#0B251C' : '#667085',
              borderBottom: activeTab === 'security' ? '2px solid #0B251C' : '2px solid transparent',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
            }}
          >
            <Lock size={15} />
            <span>Security & Password</span>
          </button>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {activeTab === 'profile' ? (
            <form onSubmit={handleProfileSubmit}>
              {profileError && <Alert type="error" message={profileError} />}
              {profileSuccess && <Alert type="success" message={profileSuccess} />}

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem', padding: '1rem', backgroundColor: '#F4F7F4', borderRadius: '12px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#0B251C', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 600 }}>
                  {(user?.fullName || user?.username || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: '#0B251C' }}>{user?.fullName || user?.username}</h4>
                  <p style={{ margin: '0.125rem 0 0 0', fontSize: '0.75rem', color: '#4A5568' }}>@{user?.username} &bull; <span style={{ color: '#0B251C', fontWeight: 600 }}>{formatRoleLabel(role)}</span></p>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#344054' }}>Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. John Doe"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#344054' }}>Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#344054' }}>Username (Read-only)</label>
                <input
                  type="text"
                  className="form-input"
                  value={user?.username || ''}
                  disabled
                  style={{ backgroundColor: '#F2F4F7', color: '#667085', cursor: 'not-allowed' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={onClose} className="btn btn-secondary btn-md">
                  Cancel
                </button>
                <button type="submit" disabled={profileLoading} className="btn btn-primary btn-md" style={{ backgroundColor: '#0B251C', borderColor: '#0B251C' }}>
                  {profileLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSecuritySubmit}>
              {securityError && <Alert type="error" message={securityError} />}
              {securitySuccess && <Alert type="success" message={securitySuccess} />}

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#344054' }}>Current Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#344054' }}>New Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                />
                <span style={{ fontSize: '0.75rem', color: '#667085', marginTop: '0.25rem', display: 'block' }}>
                  Must contain at least 8 characters.
                </span>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#344054' }}>Confirm New Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={onClose} className="btn btn-secondary btn-md">
                  Cancel
                </button>
                <button type="submit" disabled={securityLoading} className="btn btn-primary btn-md" style={{ backgroundColor: '#0B251C', borderColor: '#0B251C' }}>
                  {securityLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
