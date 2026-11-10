import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

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
      let serverMessage = err.response?.data?.message || err.response?.data?.error;
      if (!serverMessage) {
        if (err.response?.status === 401) {
          serverMessage = 'Invalid username or password. Please verify your credentials.';
        } else if (err.response?.status === 403) {
          serverMessage = 'Account is deactivated or access is restricted. Please contact an administrator.';
        } else if (err.response?.status === 500) {
          serverMessage = 'Backend server encountered an error (500). Please check server logs.';
        } else if (err.code === 'ERR_NETWORK') {
          serverMessage = 'Unable to connect to backend server. Please verify backend is running on port 8080.';
        } else {
          serverMessage = err.message || 'Authentication failed';
        }
      }
      setError(serverMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = (registerMode) => {
    setIsRegister(registerMode);
    setError(null);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        backgroundColor: '#FFFFFF',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Left Brand Panel - Matching BalanceVault luxury aesthetic */}
      <div
        className="login-brand-panel"
        style={{
          flex: '0 0 45%',
          backgroundColor: '#092218',
          color: '#FFFFFF',
          padding: '4rem 3.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle background luxury ambient glow */}
        <div
          style={{
            position: 'absolute',
            top: '-15%',
            right: '-15%',
            width: '450px',
            height: '450px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(52, 211, 153, 0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Top brand header */}
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: '1.5px solid #34D399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#34D399',
                fontFamily: "'Newsreader', 'Georgia', serif",
              }}
            >
              b
            </div>
            <span
              style={{
                fontSize: '1.625rem',
                fontWeight: 600,
                letterSpacing: '-0.025em',
                fontFamily: "'Newsreader', 'Georgia', serif",
                color: '#FFFFFF',
              }}
            >
              balancevault
            </span>
          </div>
          <p
            style={{
              color: '#A3C4B3',
              fontSize: '1.125rem',
              lineHeight: 1.5,
              margin: '0 0 2.5rem',
              fontFamily: "'Newsreader', 'Georgia', serif",
              fontStyle: 'italic',
            }}
          >
            Money movement with a ledger you can prove.
          </p>
        </div>

        {/* Core Pillars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', margin: 'auto 0' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: 'rgba(52, 211, 153, 0.12)',
                color: '#34D399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '2px',
              }}
            >
              <CheckCircle2 size={16} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#F1F5F2' }}>
                Double-Entry Invariant
              </div>
              <div style={{ color: '#88A796', fontSize: '0.8125rem', lineHeight: 1.4, marginTop: '2px' }}>
                Every financial transaction maintains strict debit and credit equality across the ledger.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: 'rgba(52, 211, 153, 0.12)',
                color: '#34D399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '2px',
              }}
            >
              <ShieldCheck size={16} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#F1F5F2' }}>
                Row-Level Concurrency
              </div>
              <div style={{ color: '#88A796', fontSize: '0.8125rem', lineHeight: 1.4, marginTop: '2px' }}>
                ACID transaction boundaries with PostgreSQL row-level locks protect against race conditions.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: 'rgba(52, 211, 153, 0.12)',
                color: '#34D399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '2px',
              }}
            >
              <CheckCircle2 size={16} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#F1F5F2' }}>
                Append-Only Audit Trail
              </div>
              <div style={{ color: '#88A796', fontSize: '0.8125rem', lineHeight: 1.4, marginTop: '2px' }}>
                Immutable, tamper-evident record keeping for real-time compliance and verification.
              </div>
            </div>
          </div>
        </div>

        {/* Bottom ledger security pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 0.875rem',
            borderRadius: '999px',
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            fontSize: '0.75rem',
            color: '#A3C4B3',
            width: 'fit-content',
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#34D399' }} />
          Protected ledger • Financial fidelity by design
        </div>
      </div>

      {/* Right Column - Clean, Open Form (NO box container, NO box tabs) */}
      <div
        style={{
          flex: '1',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '3rem 2rem',
          backgroundColor: '#FFFFFF',
        }}
      >
        <div style={{ width: '100%', maxWidth: '420px' }}>
          {/* Top text-link mode switch */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2.5rem' }}>
            {isRegister ? (
              <span style={{ fontSize: '0.875rem', color: '#688073' }}>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => toggleMode(false)}
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
                  Sign in
                </button>
              </span>
            ) : (
              <span style={{ fontSize: '0.875rem', color: '#688073' }}>
                Need an account?{' '}
                <button
                  type="button"
                  onClick={() => toggleMode(true)}
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
                  Create one
                </button>
              </span>
            )}
          </div>

          {/* Heading */}
          <div style={{ marginBottom: '2rem' }}>
            <h2
              style={{
                fontSize: '2rem',
                fontWeight: 600,
                color: '#092218',
                fontFamily: "'Newsreader', 'Georgia', serif",
                letterSpacing: '-0.025em',
                margin: '0 0 0.5rem',
              }}
            >
              {isRegister ? 'Create an account' : 'Welcome back'}
            </h2>
            <p style={{ color: '#688073', fontSize: '0.9375rem', margin: 0 }}>
              {isRegister
                ? 'Register your account holder profile to begin.'
                : 'Enter your credentials to access your financial workspace.'}
            </p>
          </div>

          {/* Clean Error Notification */}
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.875rem 1rem',
                borderRadius: '8px',
                backgroundColor: '#FEF2F2',
                border: '1px solid #FEE2E2',
                color: '#991B1B',
                fontSize: '0.875rem',
                marginBottom: '1.5rem',
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <div>{error}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {isRegister && (
              <>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: '#243D32',
                      marginBottom: '0.375rem',
                    }}
                  >
                    Full Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Alice Smith"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.875rem',
                      borderRadius: '8px',
                      border: '1px solid #D9E2DC',
                      fontSize: '0.9375rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: '#243D32',
                      marginBottom: '0.375rem',
                    }}
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="alice@customer.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.875rem',
                      borderRadius: '8px',
                      border: '1px solid #D9E2DC',
                      fontSize: '0.9375rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </>
            )}

            <div style={{ marginBottom: '1.25rem' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: '#243D32',
                  marginBottom: '0.375rem',
                }}
              >
                Username
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 0.875rem',
                  borderRadius: '8px',
                  border: '1px solid #D9E2DC',
                  fontSize: '0.9375rem',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ marginBottom: isRegister ? '1.25rem' : '1.75rem' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: '#243D32',
                  marginBottom: '0.375rem',
                }}
              >
                Password
              </label>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 0.875rem',
                  borderRadius: '8px',
                  border: '1px solid #D9E2DC',
                  fontSize: '0.9375rem',
                  outline: 'none',
                }}
              />
            </div>

            {isRegister && (
              <div style={{ marginBottom: '1.75rem' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: '#243D32',
                    marginBottom: '0.375rem',
                  }}
                >
                  Confirm Password
                </label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.875rem',
                    borderRadius: '8px',
                    border: '1px solid #D9E2DC',
                    fontSize: '0.9375rem',
                    outline: 'none',
                  }}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.875rem',
                backgroundColor: '#092218',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.9375rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'background-color 0.15s ease',
              }}
            >
              {loading
                ? isRegister
                  ? 'Creating profile...'
                  : 'Authenticating...'
                : isRegister
                ? 'Create Account'
                : 'Sign In to BalanceVault'}
            </button>
          </form>

          {/* Understated footnote */}
          <div
            style={{
              marginTop: '2rem',
              textAlign: 'center',
              fontSize: '0.75rem',
              color: '#8A9E92',
              lineHeight: 1.5,
            }}
          >
            BalanceVault Financial Systems • Authenticated with JWT & Role-Based Access Control
          </div>
        </div>
      </div>
    </div>
  );
};
