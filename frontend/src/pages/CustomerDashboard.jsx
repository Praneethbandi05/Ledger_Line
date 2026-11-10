import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { accountService } from '../services/accountService';
import { transactionService } from '../services/transactionService';
import { TransactionModal } from '../components/TransactionModal';
import { AccountRequestModal } from '../components/AccountRequestModal';
import { Alert } from '../components/Alert';
import { DoubleEntryBadge } from '../components/DoubleEntryBadge';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  PlusCircle,
  FileText,
  Clock,
  Printer,
  ShieldCheck,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Building2,
  Sparkles,
  CreditCard,
  Plus
} from 'lucide-react';

export const CustomerDashboard = () => {
  const { user } = useAuth();

  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Modal control
  const [modalType, setModalType] = useState(null); // 'deposit' | 'withdraw' | 'transfer'
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

  const handleActionClick = (type) => {
    if (activeAccounts.length === 0) {
      if (pendingAccounts.length > 0) {
        setError('Your account request is currently awaiting administrator approval. Financial transactions will unlock once approved.');
      } else {
        setError('You have no active accounts yet. Please request an account to begin moving funds.');
        setRequestModalOpen(true);
      }
      return;
    }
    setModalType(type);
  };

  const toggleExpandTx = (id) => {
    setExpandedTxId(expandedTxId === id ? null : id);
  };

  return (
    <div>
      {error && <Alert type="error" message={error} />}
      {successMessage && <Alert type="success" message={successMessage} />}

      {/* Hero Greeting Banner */}
      <div className="bv-hero-banner">
        <div>
          <h1 className="bv-hero-title">
            {getGreeting()}, <span className="bv-hero-italic">{displayName}</span>
          </h1>
          <p className="bv-hero-subtitle">
            Everything in its place. Here's your account overview.
          </p>
          <div className="bv-hero-tags">
            <span className="bv-hero-tag">
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0B251C', display: 'inline-block' }} />
              Account holder
            </span>
            <span className="bv-hero-tag">
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0B251C', display: 'inline-block' }} />
              Private workspace
            </span>
          </div>
        </div>

        {/* Decorative Circular Emblem */}
        <div className="bv-hero-badge">
          <div className="bv-hero-inner-circle">
            b
          </div>
          <span className="bv-hero-index">01 / 01</span>
        </div>
      </div>

      {/* Section: YOUR SPACE / Account overview */}
      <div style={{ marginBottom: '2rem' }}>
        <div className="bv-section-header">
          <span>YOUR SPACE</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0B251C', margin: 0 }}>
            Account overview
          </h2>
          <Link
            to="/customer/accounts"
            style={{ fontSize: '0.8125rem', color: '#0B251C', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
          >
            All accounts &rarr;
          </Link>
        </div>

        <div className="bv-card-grid-2">
          {/* Total accounts */}
          <div className="bv-card">
            <div className="bv-card-icon-box">
              <CreditCard size={18} />
            </div>
            <div className="bv-card-label">Total accounts</div>
            <div className="bv-card-value">
              {accounts.length < 10 ? `0${accounts.length}` : accounts.length}
            </div>
            <div className="bv-card-sub">
              {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'} connected
            </div>
          </div>

          {/* Account status */}
          <div className="bv-card">
            <div className="bv-card-icon-box">
              <ShieldCheck size={18} />
            </div>
            <div className="bv-card-label">Account status</div>
            <div className="bv-card-value" style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {activeAccounts.length > 0 ? (
                <>
                  <span style={{ color: '#166534' }}>{activeAccounts.length} Active</span>
                </>
              ) : pendingAccounts.length > 0 ? (
                <>
                  <span style={{ color: '#B45309' }}>1 Pending approval</span>
                </>
              ) : (
                <>
                  <span>No accounts</span>
                </>
              )}
            </div>
            <div className="bv-card-sub">
              {activeAccounts.length} active {activeAccounts.length === 1 ? 'account' : 'accounts'}
            </div>
            {/* Progress bar line */}
            <div style={{ width: '100%', height: '4px', backgroundColor: '#E5EBE5', borderRadius: '2px', marginTop: '1rem', overflow: 'hidden' }}>
              <div
                style={{
                  width: activeAccounts.length > 0 ? '100%' : pendingAccounts.length > 0 ? '50%' : '0%',
                  height: '100%',
                  backgroundColor: activeAccounts.length > 0 ? '#10B981' : '#F59E0B',
                  transition: 'width 0.3s',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section: CONNECTED / Your accounts */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div className="bv-section-header">
          <span>CONNECTED</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0B251C', margin: 0 }}>
            Your accounts
          </h2>
          <button
            type="button"
            onClick={() => setRequestModalOpen(true)}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.75rem', borderColor: '#CCD8CC', color: '#0B251C', backgroundColor: '#FFFFFF' }}
          >
            + Request account
          </button>
        </div>

        {accounts.length === 0 ? (
          /* Empty State matching uploaded screenshot */
          <div className="bv-empty-box">
            <div className="bv-empty-icon">
              <CreditCard size={22} />
            </div>
            <div className="bv-empty-title">No accounts yet</div>
            <p className="bv-empty-desc">
              Customer accounts are opened after an administrator reviews your request.
            </p>
            <button
              type="button"
              onClick={() => setRequestModalOpen(true)}
              className="btn btn-primary btn-md"
              style={{ backgroundColor: '#0B251C', borderColor: '#0B251C', borderRadius: '10px' }}
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

      {/* Section: ON YOUR TERMS / Quick actions */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div className="bv-section-header">
          <span>ON YOUR TERMS</span>
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0B251C', marginBottom: '1rem' }}>
          Quick actions
        </h2>

        <div className="bv-quick-actions-grid">
          {/* Deposit */}
          <button
            type="button"
            onClick={() => handleActionClick('deposit')}
            className="bv-action-card deposit"
          >
            <div className="bv-action-icon">
              <Plus size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0B251C' }}>Deposit</div>
              <div style={{ fontSize: '0.75rem', color: '#4A6356' }}>Add funds</div>
            </div>
          </button>

          {/* Withdraw */}
          <button
            type="button"
            onClick={() => handleActionClick('withdraw')}
            className="bv-action-card withdraw"
          >
            <div className="bv-action-icon">
              <ArrowUpRight size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0B251C' }}>Withdraw</div>
              <div style={{ fontSize: '0.75rem', color: '#745B38' }}>Move funds out</div>
            </div>
          </button>

          {/* Transfer */}
          <button
            type="button"
            onClick={() => handleActionClick('transfer')}
            className="bv-action-card transfer"
          >
            <div className="bv-action-icon">
              <ArrowLeftRight size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0B251C' }}>Transfer</div>
              <div style={{ fontSize: '0.75rem', color: '#3A576E' }}>Between accounts</div>
            </div>
          </button>
        </div>
      </div>

      {/* Section: LEDGER / Transaction activity */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div className="bv-section-header">
          <span>LEDGER</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0B251C', margin: 0 }}>
            Transaction activity
          </h2>
          {transactions.length > 0 && (
            <Link
              to="/customer/transactions"
              style={{ fontSize: '0.8125rem', color: '#0B251C', fontWeight: 600, textDecoration: 'none' }}
            >
              Full Journal &rarr;
            </Link>
          )}
        </div>

        {transactions.length === 0 ? (
          /* Empty state matching uploaded screenshot */
          <div className="bv-empty-box">
            <div className="bv-empty-icon">
              <Sparkles size={22} />
            </div>
            <div className="bv-empty-title">No accounts available</div>
            <p className="bv-empty-desc">
              Account activity will appear when you have assets in an account.
            </p>
          </div>
        ) : (
          <div className="table-responsive" style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E5EBE5', overflow: 'hidden' }}>
            <table className="table" style={{ margin: 0 }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAF8', borderBottom: '1px solid #E5EBE5' }}>
                  <th style={{ color: '#688073', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reference</th>
                  <th style={{ color: '#688073', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date & Time</th>
                  <th style={{ color: '#688073', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</th>
                  <th style={{ color: '#688073', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Counterparty</th>
                  <th style={{ color: '#688073', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Amount</th>
                  <th style={{ color: '#688073', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                  <th style={{ color: '#688073', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Double-Entry</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 5).map((tx) => (
                  <tr key={tx.id} style={{ borderBottom: '1px solid #F4F7F4' }}>
                    <td style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.8125rem', fontWeight: 600, color: '#0B251C' }}>
                      {tx.reference}
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: '#667085' }}>
                      {new Date(tx.createdAt).toLocaleString()}
                    </td>
                    <td>
                      <span className={`badge badge-${tx.transactionType === 'DEPOSIT' ? 'success' : tx.transactionType === 'WITHDRAWAL' ? 'warning' : 'primary'}`}>
                        {tx.transactionType}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: '#4A5568' }}>
                      {tx.transactionType === 'DEPOSIT'
                        ? `Clearing Deposit → ${tx.destinationAccountNumber}`
                        : tx.transactionType === 'WITHDRAWAL'
                        ? `${tx.sourceAccountNumber} → Clearing Withdrawal`
                        : `${tx.sourceAccountNumber} → ${tx.destinationAccountNumber}`}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, fontSize: '0.875rem', color: tx.transactionType === 'DEPOSIT' ? '#166534' : '#0B251C' }}>
                      {tx.transactionType === 'DEPOSIT' ? '+' : '-'}${parseFloat(tx.amount || 0).toFixed(2)}
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transaction Modal (Deposit / Withdraw / Transfer) */}
      <TransactionModal
        isOpen={!!modalType}
        onClose={() => setModalType(null)}
        initialType={modalType || 'deposit'}
        accounts={activeAccounts}
        onSuccess={() => {
          setSuccessMessage('Transaction completed with balanced double-entry ledger records');
          loadData();
        }}
      />

      {/* Account Request Modal */}
      <AccountRequestModal
        isOpen={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        onSuccess={() => {
          setSuccessMessage('Account request submitted. An administrator will review and activate your account.');
          loadData();
        }}
      />
    </div>
  );
};
