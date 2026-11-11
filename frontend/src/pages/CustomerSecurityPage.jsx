import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../components/Alert';
import { Lock, KeyRound, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export const CustomerSecurityPage = () => {
  const { changePassword } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirmation do not match.');
      return;
    }

    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setSuccessMessage('Password updated successfully. Please use your new password next time you sign in.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to update password. Please verify your current password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div className="bv-section-header">
          <span>ACCOUNT &bull; CREDENTIALS &bull; SECURITY</span>
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
          Security & Password
        </h1>
        <p style={{ color: '#688073', fontSize: '0.875rem', margin: 0, lineHeight: 1.5 }}>
          Manage your account credentials and maintain optimal access protection for Balance Vault.
        </p>
      </div>

      {/* Card */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E5EBE5',
          padding: '2rem 2.25rem',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.02)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: '#EAF5EE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0B251C',
            }}
          >
            <KeyRound size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#092218', margin: 0 }}>
              Update Password
            </h3>
            <p style={{ fontSize: '0.8125rem', color: '#688073', margin: '0.125rem 0 0 0' }}>
              Ensure your account is protected with a secure password containing at least 8 characters.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {errorMessage && (
            <div style={{ marginBottom: '1.5rem' }}>
              <Alert type="danger" message={errorMessage} onClose={() => setErrorMessage(null)} />
            </div>
          )}
          {successMessage && (
            <div style={{ marginBottom: '1.5rem' }}>
              <Alert type="success" message={successMessage} onClose={() => setSuccessMessage(null)} />
            </div>
          )}

          {/* Current Password */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label
              className="form-label"
              style={{ fontWeight: 600, color: '#243D32', fontSize: '0.8125rem', marginBottom: '0.5rem', display: 'block' }}
            >
              Current Password
            </label>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                className="form-control"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
                required
                style={{
                  width: '100%',
                  height: '46px',
                  paddingLeft: '2.5rem',
                  paddingRight: '2.75rem',
                  borderRadius: '8px',
                  border: '1px solid #D0D5DD',
                  fontSize: '0.9375rem',
                  boxSizing: 'border-box',
                }}
              />
              <Lock
                size={17}
                color="#688073"
                style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#688073',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* New Password & Confirm Password Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label
                className="form-label"
                style={{ fontWeight: 600, color: '#243D32', fontSize: '0.8125rem', marginBottom: '0.5rem', display: 'block' }}
              >
                New Password
              </label>
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  className="form-control"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                  style={{
                    width: '100%',
                    height: '46px',
                    paddingLeft: '2.5rem',
                    paddingRight: '2.75rem',
                    borderRadius: '8px',
                    border: '1px solid #D0D5DD',
                    fontSize: '0.9375rem',
                    boxSizing: 'border-box',
                  }}
                />
                <Lock
                  size={17}
                  color="#688073"
                  style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#688073',
                    padding: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#688073', marginTop: '0.375rem', display: 'block' }}>
                Must be at least 8 characters.
              </span>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label
                className="form-label"
                style={{ fontWeight: 600, color: '#243D32', fontSize: '0.8125rem', marginBottom: '0.5rem', display: 'block' }}
              >
                Confirm New Password
              </label>
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="form-control"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                  style={{
                    width: '100%',
                    height: '46px',
                    paddingLeft: '2.5rem',
                    paddingRight: '2.75rem',
                    borderRadius: '8px',
                    border: '1px solid #D0D5DD',
                    fontSize: '0.9375rem',
                    boxSizing: 'border-box',
                  }}
                />
                <Lock
                  size={17}
                  color="#688073"
                  style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#688073',
                    padding: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #E5EBE5', paddingTop: '1.5rem' }}>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                backgroundColor: '#092218',
                borderColor: '#092218',
                minWidth: '160px',
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
              {loading ? (
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
    </div>
  );
};
