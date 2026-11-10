import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Alert } from '../components/Alert';

export const LoginPage = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isRegister, setIsRegister] = useState(location.pathname === '/register');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsRegister(location.pathname === '/register');
    setError(null);
  }, [location.pathname]);

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

  const handleTabChange = (registerMode) => {
    setIsRegister(registerMode);
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
          maxWidth: '440px',
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          border: '1px solid #E5EBE5',
          boxShadow: '0 12px 32px -8px rgba(9, 34, 24, 0.06)',
          padding: '2.5rem 2.25rem',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: '#092218',
              color: '#FFFFFF',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              fontWeight: 700,
              fontFamily: "'Newsreader', 'Georgia', serif",
              marginBottom: '0.75rem',
            }}
          >
            b
          </div>
          <h1
            style={{
              fontSize: '1.625rem',
              fontWeight: 600,
              letterSpacing: '-0.025em',
              color: '#092218',
              fontFamily: "'Newsreader', 'Georgia', serif",
              margin: '0 0 0.25rem',
            }}
          >
            balancevault
          </h1>
          <p style={{ color: '#688073', fontSize: '0.84rem', margin: 0 }}>
            Money movement with a ledger you can prove
          </p>
        </div>

        {/* Minimal Tab Switcher */}
        <div
          style={{
            display: 'flex',
            backgroundColor: '#F1F5F2',
            borderRadius: '10px',
            padding: '4px',
            marginBottom: '1.5rem',
          }}
        >
          <button
            type="button"
            onClick={() => handleTabChange(false)}
            style={{
              flex: 1,
              padding: '0.5rem',
              fontSize: '0.84rem',
              fontWeight: !isRegister ? 600 : 500,
              color: !isRegister ? '#092218' : '#688073',
              backgroundColor: !isRegister ? '#FFFFFF' : 'transparent',
              border: 'none',
              borderRadius: '7px',
              boxShadow: !isRegister ? '0 1px 3px rgba(0, 0, 0, 0.08)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => handleTabChange(true)}
            style={{
              flex: 1,
              padding: '0.5rem',
              fontSize: '0.84rem',
              fontWeight: isRegister ? 600 : 500,
              color: isRegister ? '#092218' : '#688073',
              backgroundColor: isRegister ? '#FFFFFF' : 'transparent',
              border: 'none',
              borderRadius: '7px',
              boxShadow: isRegister ? '0 1px 3px rgba(0, 0, 0, 0.08)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Register
          </button>
        </div>

        {error && (
          <div style={{ marginBottom: '1.25rem' }}>
            <Alert type="danger" message={error} />
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#243D32' }}>
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
                <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#243D32' }}>
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
            <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#243D32' }}>
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
            <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#243D32' }}>
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
              <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#243D32' }}>
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
              padding: '0.8125rem',
              backgroundColor: '#092218',
              borderColor: '#092218',
              fontWeight: 600,
              fontSize: '0.875rem',
              borderRadius: '9px',
              marginTop: '0.25rem',
            }}
            disabled={loading}
          >
            {loading
              ? isRegister
                ? 'Creating Account...'
                : 'Signing In...'
              : isRegister
              ? 'Create Account'
              : 'Sign In to BalanceVault'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.8125rem', color: '#688073' }}>
          {isRegister ? (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => handleTabChange(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#092218',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline',
                }}
              >
                Sign In
              </button>
            </>
          ) : (
            <>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => handleTabChange(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#092218',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline',
                }}
              >
                Register
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
