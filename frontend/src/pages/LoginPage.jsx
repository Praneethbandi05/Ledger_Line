import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, User, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Alert } from '../components/Alert';

export const LoginPage = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        await register({ username, password, email, fullName });
      } else {
        await login(username, password);
      }
      navigate('/dashboard');
    } catch (err) {
      const serverMessage = err.response?.data?.message || err.message || 'Authentication failed';
      setError(serverMessage);
    } finally {
      setLoading(false);
    }
  };

  const fillQuickDemo = (userVal, passVal) => {
    setIsRegister(false);
    setUsername(userVal);
    setPassword(passVal);
    setError(null);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        padding: '1.5rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
        }}
      >
        <div style={{ backgroundColor: '#0F172A', color: 'white', padding: '2rem', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem' }}>
            <ShieldCheck size={28} color="#3B82F6" />
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.025em' }}>LEDGERLINE</h1>
          </div>
          <p style={{ color: '#94A3B8', fontSize: '0.875rem' }}>
            Money Movement With a Ledger You Can Prove
          </p>
        </div>

        <div style={{ padding: '2rem' }}>
          {/* Quick Demo Selector */}
          <div style={{ marginBottom: '1.5rem' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#64748B',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
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
                style={{ fontSize: '0.75rem', justifyContent: 'flex-start' }}
              >
                👤 Alice (Customer)
              </button>
              <button
                type="button"
                onClick={() => fillQuickDemo('bob', 'Customer@123')}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', justifyContent: 'flex-start' }}
              >
                👤 Bob (Customer)
              </button>
              <button
                type="button"
                onClick={() => fillQuickDemo('admin', 'Admin@12345')}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', justifyContent: 'flex-start' }}
              >
                🛡️ Admin User
              </button>
              <button
                type="button"
                onClick={() => fillQuickDemo('auditor', 'Auditor@12345')}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', justifyContent: 'flex-start' }}
              >
                🔍 Auditor User
              </button>
            </div>
          </div>

          <div className="tabs">
            <button
              type="button"
              className={`tab-btn ${!isRegister ? 'active' : ''}`}
              onClick={() => {
                setIsRegister(false);
                setError(null);
              }}
            >
              Secure Sign In
            </button>
            <button
              type="button"
              className={`tab-btn ${isRegister ? 'active' : ''}`}
              onClick={() => {
                setIsRegister(true);
                setError(null);
              }}
            >
              Register Customer
            </button>
          </div>

          {error && <Alert type="danger" message={error} />}

          <form onSubmit={handleSubmit}>
            {isRegister && (
              <>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Alice Smith"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="alice@customer.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. alice"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1rem', padding: '0.75rem' }}
              disabled={loading}
            >
              {loading
                ? 'Authenticating...'
                : isRegister
                ? 'Create Customer Account'
                : 'Sign In to LedgerLine'}
            </button>
          </form>

          <div
            style={{
              marginTop: '1.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid #E2E8F0',
              textAlign: 'center',
              fontSize: '0.75rem',
              color: '#94A3B8',
            }}
          >
            🔒 Protected by BCrypt • Signed JWT • Role-Based Access Control
          </div>
        </div>
      </div>
    </div>
  );
};
