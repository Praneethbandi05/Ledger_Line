import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { accountService } from '../services/accountService';
import { transactionService } from '../services/transactionService';
import { AccountRequestModal } from '../components/AccountRequestModal';
import { Alert } from '../components/Alert';
import { DoubleEntryBadge } from '../components/DoubleEntryBadge';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  ShieldCheck,
  CreditCard,
  Sparkles,
  Plus,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

export const CustomerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [expandedTxId, setExpandedTxId] = useState(null);

  useEffect(() => {
    loadData();

    const handleAccountRequestSubmitted = () => {
      loadData();
    };
    window.addEventListener('account-request-submitted', handleAccountRequestSubmitted);
    return () => window.removeEventListener('account-request-submitted', handleAccountRequestSubmitted);
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [accountsData, txData] = await Promise.all([
        accountService.getMyAccounts(),
        transactionService.getMyTransactions(),
      ]);
      setAccounts(Array.isArray(accountsData) ? accountsData : (accountsData?.content || []));
      setTransactions(Array.isArray(txData) ? txData : (txData?.content || []));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load account data');
    } finally {
      setLoading(false);
    }
  };

  const activeAccounts = accounts.filter((a) => a.status === 'ACTIVE');
  const pendingAccounts = accounts.filter((a) => a.status === 'PENDING_APPROVAL');

  const totalBalance = activeAccounts.reduce(
    (sum, acc) => sum + parseFloat(acc.balance || 0),
    0
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    if (hour >= 17 && hour < 22) return 'Good evening';
    return 'Good to see you';
  };

  const displayName = user?.fullName || user?.username || 'Account holder';

  const toggleExpandTx = (id) => {
    setExpandedTxId(expandedTxId === id ? null : id);
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Hero Welcome Banner */}
      <div className="bv-hero-banner">
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h1 className="bv-hero-title">
            {getGreeting()}, <span className="bv-hero-italic">{displayName}</span>
          </h1>
          <p className="bv-hero-subtitle">
            Institutional overview. Real-time ledger balances and money movement controls.
          </p>
          <div className="bv-hero-tags">
            <div className="bv-hero-tag">
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0B251C', display: 'inline-block' }} />
              Account Holder
            </div>
            <div className="bv-hero-tag">
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0B251C', display: 'inline-block' }} />
              Private Workspace
            </div>
            <div className="bv-hero-tag">
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }} />
              Double-Entry Invariant Verified
            </div>
          </div>
        </div>

        <div className="bv-hero-badge">
          <div className="bv-hero-inner-circle">
            <span>b</span>
          </div>
          <div className="bv-hero-index">01 / 01</div>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: '1.5rem' }}>
          <Alert type="danger" message={error} onClose={() => setError(null)} />
        </div>
      )}

      {/* Section 1: KPI Overview Cards */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div className="bv-section-header">
          <span>YOUR SPACE &bull; PORTFOLIO OVERVIEW</span>
          <Link
            to="/customer/accounts"
            style={{ fontSize: '0.8125rem', color: '#0B251C', fontWeight: 600, textDecoration: 'none' }}
          >
            Manage all accounts &rarr;
          </Link>
        </div>

        <div className="bv-card-grid-2">
          {/* Total accounts */}
          <div className="bv-card">
            <div className="bv-card-icon-box">
              <CreditCard size={18} />
            </div>
            <div className="bv-card-label">Total Connected Accounts</div>
            <div className="bv-card-value">
              {accounts.length < 10 ? `0${accounts.length}` : accounts.length}
            </div>
            <div className="bv-card-sub">
              {activeAccounts.length} active &bull; {pendingAccounts.length} pending approval
            </div>
          </div>

          {/* Aggregate balance */}
          <div className="bv-card">
            <div className="bv-card-icon-box">
              <ShieldCheck size={18} />
            </div>
            <div className="bv-card-label">Cumulative Available Balance</div>
            <div className="bv-card-value" style={{ fontFamily: "'Newsreader', 'Georgia', serif" }}>
              ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="bv-card-sub">
              Verified double-entry invariant across all active accounts
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Quick Actions Navigation */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div className="bv-section-header">
          <span>ON YOUR TERMS &bull; QUICK ACTIONS</span>
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0B251C', margin: '0 0 1rem' }}>
          Money movement
        </h2>

        <div className="bv-quick-actions-grid">
          {/* Deposit */}
          <Link
            to="/customer/deposit"
            className="bv-action-card deposit"
            style={{ textDecoration: 'none' }}
          >
            <div className="bv-action-icon">
              <ArrowDownLeft size={20} color="#059669" />
            </div>
            <div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#0B251C' }}>Deposit Funds</div>
              <div style={{ fontSize: '0.75rem', color: '#4A6356' }}>Credit account with cash inflow</div>
            </div>
          </Link>

          {/* Withdraw */}
          <Link
            to="/customer/withdraw"
            className="bv-action-card withdraw"
            style={{ textDecoration: 'none' }}
          >
            <div className="bv-action-icon">
              <ArrowUpRight size={20} color="#D97706" />
            </div>
            <div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#0B251C' }}>Withdraw Funds</div>
              <div style={{ fontSize: '0.75rem', color: '#745B38' }}>Debit and withdraw from active balance</div>
            </div>
          </Link>

          {/* Transfer */}
          <Link
            to="/customer/transfer"
            className="bv-action-card transfer"
            style={{ textDecoration: 'none' }}
          >
            <div className="bv-action-icon">
              <ArrowLeftRight size={20} color="#2563EB" />
            </div>
            <div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#0B251C' }}>Transfer Funds</div>
              <div style={{ fontSize: '0.75rem', color: '#3A576E' }}>Atomic double-entry transfer</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Section 3: Connected Accounts Summary */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div className="bv-section-header">
          <span>CONNECTED ACCOUNTS</span>
          <button
            type="button"
            onClick={() => setRequestModalOpen(true)}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.75rem', borderColor: '#CCD8CC', color: '#0B251C', backgroundColor: '#FFFFFF' }}
          >
            + Request new account
          </button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0B251C', margin: 0 }}>
            Your accounts
          </h2>
          <Link
            to="/customer/accounts"
            style={{ fontSize: '0.8125rem', color: '#0B251C', fontWeight: 600, textDecoration: 'none' }}
          >
            View all accounts &rarr;
          </Link>
        </div>

        {accounts.length === 0 ? (
          <div className="bv-empty-box">
            <div className="bv-empty-icon">
              <CreditCard size={22} />
            </div>
            <div className="bv-empty-title">No accounts yet</div>
            <p className="bv-empty-desc">
              Customer accounts are opened after an administrator reviews and approves your request.
            </p>
            <button
              type="button"
              onClick={() => setRequestModalOpen(true)}
              className="btn btn-primary btn-md"
              style={{ backgroundColor: '#092218', borderColor: '#092218', borderRadius: '10px' }}
            >
              Request an account
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="bv-card"
                style={{
                  borderLeft: acc.status === 'ACTIVE' ? '4px solid #10B981' : acc.status === 'PENDING_APPROVAL' ? '4px solid #F59E0B' : '4px solid #94A3B8',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#688073', letterSpacing: '0.05em' }}>
                      {acc.accountType} &bull; {acc.currency}
                    </span>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0B251C', margin: '0.125rem 0' }}>
                      {acc.accountNumber}
                    </h3>
                  </div>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.5rem',
                      borderRadius: '9999px',
                      backgroundColor: acc.status === 'ACTIVE' ? '#EAF5EE' : acc.status === 'PENDING_APPROVAL' ? '#FEF3C7' : '#F1F5F9',
                      color: acc.status === 'ACTIVE' ? '#166534' : acc.status === 'PENDING_APPROVAL' ? '#92400E' : '#475569',
                      border: `1px solid ${acc.status === 'ACTIVE' ? '#C4E5CE' : acc.status === 'PENDING_APPROVAL' ? '#FDE68A' : '#E2E8F0'}`,
                    }}
                  >
                    {acc.status === 'PENDING_APPROVAL' ? 'PENDING APPROVAL' : acc.status}
                  </span>
                </div>

                <div style={{ margin: '1rem 0' }}>
                  <div style={{ fontSize: '0.75rem', color: '#667085', marginBottom: '0.25rem' }}>
                    Available Balance
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0B251C', fontFamily: "'Newsreader', 'Georgia', serif" }}>
                    ${parseFloat(acc.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>

                {acc.status === 'PENDING_APPROVAL' ? (
                  <div style={{ fontSize: '0.75rem', color: '#92400E', backgroundColor: '#FFFBEB', padding: '0.5rem 0.75rem', borderRadius: '8px' }}>
                    ⏳ Awaiting administrator review. Transactions unlock once approved.
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid #F0F4F0' }}>
                    <Link
                      to={`/customer/accounts/${acc.id}`}
                      style={{ fontSize: '0.8125rem', color: '#0B251C', fontWeight: 600, textDecoration: 'none' }}
                    >
                      View Details &rarr;
                    </Link>
                    <Link
                      to="/customer/statements"
                      style={{ fontSize: '0.75rem', color: '#667085', textDecoration: 'none' }}
                    >
                      Official Statement
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 4: Recent Ledger Activity */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div className="bv-section-header">
          <span>AUDITABLE LEDGER &bull; RECENT ACTIVITY</span>
          {transactions.length > 0 && (
            <Link
              to="/customer/transactions"
              style={{ fontSize: '0.8125rem', color: '#0B251C', fontWeight: 600, textDecoration: 'none' }}
            >
              Full transaction journal &rarr;
            </Link>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0B251C', margin: 0 }}>
            Recent transaction activity
          </h2>
        </div>

        {transactions.length === 0 ? (
          <div className="bv-empty-box">
            <div className="bv-empty-icon">
              <Sparkles size={22} />
            </div>
            <div className="bv-empty-title">No transactions yet</div>
            <p className="bv-empty-desc">
              Your transaction journal will populate as money movement occurs in your active accounts.
            </p>
          </div>
        ) : (
          <div className="table-container" style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #E5EBE5' }}>
            <table className="table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Reference</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Ledger</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 5).map((tx) => (
                  <React.Fragment key={tx.id}>
                    <tr>
                      <td style={{ fontSize: '0.8125rem', color: '#667085' }}>
                        {new Date(tx.createdAt).toLocaleString()}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', fontWeight: 600 }}>
                        {tx.reference}
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.5rem',
                            borderRadius: '6px',
                            backgroundColor: tx.transactionType === 'DEPOSIT' ? '#EAF5EE' : tx.transactionType === 'WITHDRAWAL' ? '#FEF3C7' : '#EFF6FF',
                            color: tx.transactionType === 'DEPOSIT' ? '#166534' : tx.transactionType === 'WITHDRAWAL' ? '#92400E' : '#1E40AF',
                          }}
                        >
                          {tx.transactionType}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8125rem', color: '#334155' }}>
                        {tx.description}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600, fontSize: '0.875rem', color: (tx.transactionType === 'DEPOSIT' || accounts.some((a) => a.accountNumber === tx.destinationAccountNumber)) ? '#166534' : '#0B251C' }}>
                        {(tx.transactionType === 'DEPOSIT' || accounts.some((a) => a.accountNumber === tx.destinationAccountNumber)) ? '+' : '-'}${parseFloat(tx.amount || 0).toFixed(2)}
                      </td>
                      <td>
                        <span className="badge badge-success">{tx.status}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => toggleExpandTx(tx.id)}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                        >
                          {expandedTxId === tx.id ? 'Hide' : 'Inspect'}
                        </button>
                      </td>
                    </tr>
                    {expandedTxId === tx.id && (
                      <tr>
                        <td colSpan={7} style={{ backgroundColor: '#F8FAF8', padding: '1.25rem 1.5rem' }}>
                          <DoubleEntryBadge transaction={tx} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Account Request Modal */}
      <AccountRequestModal
        isOpen={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        onSuccess={() => {
          loadData();
        }}
      />
    </div>
  );
};
