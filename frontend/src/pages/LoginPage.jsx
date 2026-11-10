import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, User, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Alert } from '../components/Alert';

export const LoginPage = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (isRegister) {
      if (password.length < 8) {
        setError('Password must be at least 8 characters long');
        return;
      }
      if (password !== confirmPassword) {
        setError('Password and Confirm Password do not match');
        return;
      }
    }

    setLoading(true);

    try {
      if (isRegister) {
        await register({ username, password, email, fullName });
      } else {
        await login(username, password);
      }
      navigate('/dashboard');
    } catch (err) {
      let serverMessage = err.response?.data?.message;
      if (!serverMessage) {
        if (err.response?.status === 500) {
          serverMessage = 'Backend server returned an error (500). Please verify the backend and PostgreSQL are running.';
        } else if (err.response?.status === 401) {
          serverMessage = 'Invalid username or password';
        } else if (err.code === 'ERR_NETWORK') {
          serverMessage = 'Cannot connect to backend server. Please verify backend is running on port 8080.';
        } else {
          serverMessage = err.message || 'Authentication failed';
        }
      }
      setError(serverMessage);
    } finally {
      setLoading(false);
    }
  };

  const fillQuickDemo = (userVal, passVal) => {
    setIsRegister(false);
    setUsername(userVal);
    setPassword(passVal);
    setConfirmPassword('');
    setError(null);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8FAF8',
        padding: '1.5rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          boxShadow: '0 20px 40px -15px rgba(11, 37, 28, 0.1)',
          border: '1px solid #E5EBE5',
          overflow: 'hidden',
        }}
      >
        {/* Brand Header */}
        <div style={{ backgroundColor: '#092218', color: 'white', padding: '2.25rem 2rem 2rem', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: '1.5px solid #34D399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                fontWeight: 700,
                color: '#34D399',
                fontFamily: "'Newsreader', 'Georgia', serif",
              }}
            >
              b
            </div>
            <h1 style={{ fontSize: '1.625rem', fontWeight: 700, letterSpacing: '-0.025em', color: '#FFFFFF' }}>
              balancevault
            </h1>
          </div>
          <p style={{ color: '#95B2A4', fontSize: '0.8125rem', margin: 0, lineHeight: 1.4 }}>
            Money movement with a ledger you can prove
          </p>
        </div>

        <div style={{ padding: '2rem' }}>
          {/* Quick Demo Assessment Selector */}
          <div style={{ marginBottom: '1.5rem' }}>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                color: '#688073',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                display: 'block',
                marginBottom: '0.5rem',
              }}
            >
              Demo Assessment Quick-Fill
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => fillQuickDemo('alice', 'Customer@123')}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', justifyContent: 'flex-start', borderColor: '#E5EBE5', color: '#0B251C' }}
              >
                👤 Alice (Account holder)
              </button>
              <button
                type="button"
                onClick={() => fillQuickDemo('bob', 'Customer@123')}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', justifyContent: 'flex-start', borderColor: '#E5EBE5', color: '#0B251C' }}
              >
                👤 Bob (Account holder)
              </button>
              <button
                type="button"
                onClick={() => fillQuickDemo('admin', 'Admin@12345')}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', justifyContent: 'flex-start', borderColor: '#E5EBE5', color: '#0B251C' }}
              >
                🛡️ Administrator
              </button>
              <button
                type="button"
                onClick={() => fillQuickDemo('auditor', 'Auditor@12345')}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', justifyContent: 'flex-start', borderColor: '#E5EBE5', color: '#0B251C' }}
              >
                🔍 Compliance Auditor
              </button>
            </div>
          </div>

          {/* Form Tabs */}
          <div className="tabs" style={{ marginBottom: '1.25rem' }}>
            <button
              type="button"
              className={`tab-btn ${!isRegister ? 'active' : ''}`}
              onClick={() => {
                setIsRegister(false);
                setError(null);
              }}
              style={!isRegister ? { borderBottomColor: '#092218', color: '#092218' } : {}}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`tab-btn ${isRegister ? 'active' : ''}`}
              onClick={() => {
                setIsRegister(true);
                setError(null);
              }}
              style={isRegister ? { borderBottomColor: '#092218', color: '#092218' } : {}}
            >
              Register Account Holder
            </button>
          </div>

          {error && <Alert type="danger" message={error} />}

          <form onSubmit={handleSubmit}>
            {isRegister && (
              <>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#344054' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Praneeth Bandi"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#344054' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="praneeth@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#344054' }}>
                Username
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. prnth"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: isRegister ? '1rem' : '1.25rem' }}>
              <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#344054' }}>
                Password
              </label>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {isRegister && (
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#344054' }}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#092218',
                borderColor: '#092218',
                fontWeight: 600,
                borderRadius: '10px',
              }}
              disabled={loading}
            >
              {loading
                ? 'Authenticating...'
                : isRegister
                ? 'Create Account Holder Profile'
                : 'Sign In to BalanceVault'}
            </button>
          </form>

          <div
            style={{
              marginTop: '1.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid #E5EBE5',
              textAlign: 'center',
              fontSize: '0.75rem',
              color: '#688073',
            }}
          >
            🔒 Protected by BCrypt • Signed JWT • Role-Based Access Control
          </div>
        </div>
      </div>
    </div>
  );
};
