import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { accountService } from '../services/accountService';
import { transactionService } from '../services/transactionService';
import { TransactionModal } from '../components/TransactionModal';
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
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const CustomerDashboard = () => {
  const { user } = useAuth();

  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Active view: 'dashboard' | 'statement'
  const [activeTab, setActiveTab] = useState('dashboard');

  // Modal control
  const [modalType, setModalType] = useState(null); // 'deposit' | 'withdraw' | 'transfer'
  const [expandedTxId, setExpandedTxId] = useState(null);

  useEffect(() => {
    loadData();
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

  const handleOpenNewAccount = async () => {
    try {
      setLoading(true);
      await accountService.createAccount('CHECKING', 'USD');
      setSuccessMessage('New checking account created successfully');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create new account');
    } finally {
      setLoading(false);
    }
  };

  const totalBalance = accounts.reduce(
    (sum, acc) => sum + parseFloat(acc.balance || 0),
    0
  );

  const toggleExpandTx = (id) => {
    setExpandedTxId(expandedTxId === id ? null : id);
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A' }}>
            Welcome back, {user?.fullName || user?.username}
          </h2>
          <p style={{ color: '#64748B', fontSize: '0.875rem' }}>
            Customer Financial Portfolio & Verified Double-Entry Ledger
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => setModalType('deposit')}
            className="btn btn-primary"
            disabled={accounts.length === 0}
          >
            <ArrowDownLeft size={16} />
            <span>Deposit</span>
          </button>
          <button
            onClick={() => setModalType('withdraw')}
            className="btn btn-secondary"
            disabled={accounts.length === 0}
          >
            <ArrowUpRight size={16} />
            <span>Withdraw</span>
          </button>
          <button
            onClick={() => setModalType('transfer')}
            className="btn btn-secondary"
            disabled={accounts.length === 0}
          >
            <ArrowLeftRight size={16} />
            <span>Transfer</span>
          </button>
          <button
            onClick={handleOpenNewAccount}
            className="btn btn-secondary"
            title="Open an additional checking or savings account"
          >
            <PlusCircle size={16} />
            <span>New Account</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <Alert
          type="success"
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}
      {error && <Alert type="danger" message={error} />}

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Account Overview & Ledger
        </button>
        <button
          className={`tab-btn ${activeTab === 'statement' ? 'active' : ''}`}
          onClick={() => setActiveTab('statement')}
        >
          Official Statement
        </button>
      </div>

      {activeTab === 'dashboard' ? (
        <>
          {/* Account Balance Cards */}
          <div className="grid-3" style={{ marginBottom: '2rem' }}>
            <div className="stat-card accent">
              <div className="stat-label">Total Liquid Net Worth</div>
              <div className="stat-value">${totalBalance.toFixed(2)}</div>
              <div className="stat-subtext">Across {accounts.length} active account(s)</div>
            </div>

            {accounts.map((acc) => (
              <Link key={acc.id} to={`/customer/accounts/${acc.id}`} className="stat-card" style={{ textDecoration: 'none', display: 'block', transition: 'transform 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div className="stat-label">
                    {acc.accountType} Account
                  </div>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      color: acc.status === 'ACTIVE' ? '#34D399' : '#F87171',
                      textTransform: 'uppercase',
                    }}
                  >
                    {acc.status}
                  </span>
                </div>
                <div className="stat-value">${parseFloat(acc.balance).toFixed(2)}</div>
                <div className="stat-subtext" style={{ fontFamily: 'var(--font-mono)' }}>
                  {acc.accountNumber} • {acc.currency}
                </div>
              </Link>
            ))}
          </div>

          {/* Transactions & Double-Entry Ledger Details */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Transaction History</h3>
                <span className="card-subtitle">
                  Traceable double-entry transactions signed with persistent idempotency
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Link to="/customer/transactions" className="btn btn-secondary btn-sm">
                  Full Journal
                </Link>
                <button onClick={loadData} className="btn btn-secondary btn-sm" disabled={loading}>
                  Refresh
                </button>
              </div>
            </div>

            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8' }}>
                Loading transaction records...
              </div>
            ) : transactions.length === 0 ? (
              <div className="empty-state">
                <Clock size={40} className="empty-state-icon" />
                <p>No transactions found for this account yet.</p>
                <p style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                  Use the Deposit button above to fund your account.
                </p>
              </div>
            ) : (
              <div className="table-container">
                <table className="fintech-table">
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>Type</th>
                      <th>From / To</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Ledger</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <React.Fragment key={tx.id || tx.reference}>
                        <tr>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                            {tx.reference}
                          </td>
                          <td>
                            <span
                              style={{
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                padding: '0.2rem 0.5rem',
                                borderRadius: '4px',
                                backgroundColor: '#F1F5F9',
                                color: '#334155',
                              }}
                            >
                              {tx.transactionType}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.8125rem' }}>
                            {tx.sourceAccountNumber && (
                              <div>
                                <span style={{ color: '#64748B' }}>From:</span> {tx.sourceAccountNumber}
                              </div>
                            )}
                            {tx.destinationAccountNumber && (
                              <div>
                                <span style={{ color: '#64748B' }}>To:</span> {tx.destinationAccountNumber}
                              </div>
                            )}
                          </td>
                          <td className="amount">
                            ${parseFloat(tx.amount).toFixed(2)} {tx.currency}
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                tx.status === 'COMPLETED'
                                  ? 'badge-completed'
                                  : tx.status === 'PENDING'
                                  ? 'badge-pending'
                                  : 'badge-failed'
                              }`}
                            >
                              {tx.status}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.8125rem', color: '#64748B' }}>
                            {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : 'Just now'}
                          </td>
                          <td>
                            <button
                              onClick={() => toggleExpandTx(tx.id || tx.reference)}
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                            >
                              {expandedTxId === (tx.id || tx.reference) ? (
                                <>
                                  <span>Hide</span> <ChevronUp size={12} />
                                </>
                              ) : (
                                <>
                                  <span>Verify</span> <ChevronDown size={12} />
                                </>
                              )}
                            </button>
                          </td>
                        </tr>

                        {/* Expandable Double-Entry Ledger Inspector */}
                        {expandedTxId === (tx.id || tx.reference) && (
                          <tr style={{ backgroundColor: '#F8FAFC' }}>
                            <td colSpan={7} style={{ padding: '1rem 1.5rem' }}>
                              <div
                                style={{
                                  backgroundColor: 'white',
                                  border: '1px solid #E2E8F0',
                                  borderRadius: '8px',
                                  padding: '1rem',
                                }}
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    marginBottom: '0.75rem',
                                    fontSize: '0.8125rem',
                                    fontWeight: 700,
                                    color: '#0F172A',
                                  }}
                                >
                                  <ShieldCheck size={16} color="#10B981" />
                                  <span>Double-Entry Proof Journal ({tx.reference})</span>
                                </div>

                                {tx.ledgerEntries && tx.ledgerEntries.length > 0 ? (
                                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                                    {tx.ledgerEntries.map((entry, idx) => (
                                      <div
                                        key={idx}
                                        style={{
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'center',
                                          padding: '0.5rem 0.75rem',
                                          borderRadius: '6px',
                                          backgroundColor: '#F8FAFC',
                                          border: '1px solid #E2E8F0',
                                          fontSize: '0.8125rem',
                                        }}
                                      >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                          <DoubleEntryBadge
                                            entryType={entry.entryType}
                                            amount={entry.amount}
                                            currency={entry.currency}
                                          />
                                          <span style={{ fontFamily: 'var(--font-mono)' }}>
                                            {entry.accountNumber}
                                          </span>
                                        </div>
                                        <div>
                                          <span style={{ color: '#64748B' }}>Balance After: </span>
                                          <span style={{ fontWeight: 600 }}>
                                            ${parseFloat(entry.balanceAfter).toFixed(2)}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span style={{ color: '#64748B', fontSize: '0.8125rem' }}>
                                    Ledger entries recorded atomically at settlement.
                                  </span>
                                )}
                              </div>
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
        </>
      ) : (
        /* Account Statement View */
        <div className="card" style={{ padding: '2rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '2px solid #0F172A',
              paddingBottom: '1.5rem',
              marginBottom: '2rem',
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A' }}>
                LEDGERLINE FINANCIAL STATEMENT
              </h2>
              <div style={{ fontSize: '0.875rem', color: '#64748B' }}>
                Generated on {new Date().toLocaleDateString()} for {user?.fullName} ({user?.email})
              </div>
            </div>
            <button
              onClick={() => window.print()}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Printer size={16} />
              <span>Print / Save PDF</span>
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '2rem',
              marginBottom: '2rem',
              backgroundColor: '#F8FAFC',
              padding: '1.25rem',
              borderRadius: '8px',
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748B', fontWeight: 600 }}>
                Customer Information
              </div>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>{user?.fullName}</div>
              <div style={{ color: '#64748B', fontSize: '0.875rem' }}>User: {user?.username}</div>
              <div style={{ color: '#64748B', fontSize: '0.875rem' }}>Role: {user?.role}</div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748B', fontWeight: 600 }}>
                Consolidated Liquid Balance
              </div>
              <div style={{ fontWeight: 800, fontSize: '1.5rem', color: '#0F172A' }}>
                ${totalBalance.toFixed(2)} USD
              </div>
              <div style={{ color: '#10B981', fontSize: '0.8125rem', fontWeight: 600 }}>
                ✓ Proven Double-Entry Balanced
              </div>
            </div>
          </div>

          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem' }}>
            Account Breakdown
          </h3>
          <div className="table-container" style={{ marginBottom: '2rem' }}>
            <table className="fintech-table">
              <thead>
                <tr>
                  <th>Account Number</th>
                  <th>Type</th>
                  <th>Currency</th>
                  <th>Status</th>
                  <th>Available Balance</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((acc) => (
                  <tr key={acc.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{acc.accountNumber}</td>
                    <td>{acc.accountType}</td>
                    <td>{acc.currency}</td>
                    <td>
                      <span className="badge badge-completed">{acc.status}</span>
                    </td>
                    <td className="amount" style={{ fontWeight: 700 }}>
                      ${parseFloat(acc.balance).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem' }}>
            Settled Transactions
          </h3>
          <div className="table-container">
            <table className="fintech-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Reference</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id || tx.reference}>
                    <td>{new Date(tx.createdAt).toLocaleDateString()}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{tx.reference}</td>
                    <td>{tx.description}</td>
                    <td>{tx.transactionType}</td>
                    <td className="amount">${parseFloat(tx.amount).toFixed(2)}</td>
                    <td>
                      <span className="badge badge-completed">{tx.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={!!modalType}
        onClose={() => setModalType(null)}
        type={modalType}
        accounts={accounts}
        onSuccess={() => {
          setSuccessMessage(`${modalType.toUpperCase()} completed successfully`);
          loadData();
        }}
      />
    </div>
  );
};
