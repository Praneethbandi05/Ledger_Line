import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { accountService } from '../services/accountService';
import { transactionService } from '../services/transactionService';
import { Alert } from '../components/Alert';
import {
  Users,
  Building2,
  Receipt,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';

export const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users' | 'accounts' | 'transactions'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersData, accountsData, txData] = await Promise.all([
        adminService.getAllUsers(),
        accountService.getAllAccounts(),
        transactionService.getAllTransactions(),
      ]);
      setUsers(usersData);
      setAccounts(accountsData);
      setTransactions(txData);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load administrative records');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId, currentEnabled) => {
    try {
      await adminService.toggleUserStatus(userId, !currentEnabled);
      setSuccessMessage(`User status updated to ${!currentEnabled ? 'Enabled' : 'Disabled'}`);
      loadAdminData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user status');
    }
  };

  const totalPlatformVolume = transactions.reduce(
    (sum, tx) => sum + parseFloat(tx.amount || 0),
    0
  );

  const customerAccounts = accounts.filter((a) => a.accountType !== 'SYSTEM_CLEARING');
  const systemAccounts = accounts.filter((a) => a.accountType === 'SYSTEM_CLEARING');

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
            System Administration Portal
          </h2>
          <p style={{ color: '#64748B', fontSize: '0.875rem' }}>
            User management, platform account oversight & transaction governance
          </p>
        </div>

        <button onClick={loadAdminData} className="btn btn-secondary" disabled={loading}>
          <RefreshCw size={16} />
          <span>Refresh Data</span>
        </button>
      </div>

      {successMessage && (
        <Alert
          type="success"
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}
      {error && <Alert type="danger" message={error} />}

      {/* KPI Overview */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-label">Total Users</div>
          <div className="stat-value">{users.length}</div>
          <div className="stat-subtext">Registered across all roles</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Customer Accounts</div>
          <div className="stat-value">{customerAccounts.length}</div>
          <div className="stat-subtext">Active checking & savings</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Platform Transactions</div>
          <div className="stat-value">{transactions.length}</div>
          <div className="stat-subtext">Executed & recorded</div>
        </div>

        <div className="stat-card accent">
          <div className="stat-label">Total Volume</div>
          <div className="stat-value">${totalPlatformVolume.toFixed(2)}</div>
          <div className="stat-subtext">Cumulative USD transacted</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          System Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Customer & User Management ({users.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'accounts' ? 'active' : ''}`}
          onClick={() => setActiveTab('accounts')}
        >
          Account Management ({accounts.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          Global Transactions ({transactions.length})
        </button>
      </div>

      {/* Tab: System Overview */}
      {activeTab === 'overview' && (
        <div className="grid-2">
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: '1rem' }}>
              System Clearing Counterparties
            </h3>
            <p style={{ fontSize: '0.8125rem', color: '#64748B', marginBottom: '1.25rem' }}>
              Special ledger counterparty accounts representing external cash inflows and outflows.
            </p>
            <div className="table-container">
              <table className="fintech-table">
                <thead>
                  <tr>
                    <th>Account</th>
                    <th>Purpose</th>
                    <th>Balance</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {systemAccounts.map((acc) => (
                    <tr key={acc.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                        {acc.accountNumber}
                      </td>
                      <td>
                        {acc.accountNumber.includes('DEPOSIT')
                          ? 'External Inflow Clearing'
                          : 'External Outflow Clearing'}
                      </td>
                      <td className="amount">${parseFloat(acc.balance).toFixed(2)}</td>
                      <td>
                        <span className="badge badge-completed">{acc.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title" style={{ marginBottom: '1rem' }}>
              Recent Platform Transactions
            </h3>
            <div className="table-container">
              <table className="fintech-table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 5).map((tx) => (
                    <tr key={tx.id || tx.reference}>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{tx.reference}</td>
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
        </div>
      )}

      {/* Tab: User Management */}
      {activeTab === 'users' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Registered System Users</h3>
              <span className="card-subtitle">Manage customer access and security status</span>
            </div>
          </div>

          <div className="table-container">
            <table className="fintech-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Username</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>#{u.id}</td>
                    <td style={{ fontWeight: 600 }}>{u.username}</td>
                    <td>{u.fullName || '—'}</td>
                    <td>{u.email}</td>
                    <td>
                      <span
                        className={`badge ${
                          u.role === 'ADMIN'
                            ? 'role-admin'
                            : u.role === 'AUDITOR'
                            ? 'role-auditor'
                            : 'role-customer'
                        }`}
                        style={{ padding: '0.2rem 0.5rem', borderRadius: '4px' }}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-completed">ACTIVE</span>
                    </td>
                    <td>
                      {u.role !== 'ADMIN' ? (
                        <button
                          onClick={() => handleToggleUserStatus(u.id, true)}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.75rem' }}
                        >
                          Toggle Access
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Protected</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Account Management */}
      {activeTab === 'accounts' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Platform Accounts</h3>
              <span className="card-subtitle">Global repository of all accounts in the system</span>
            </div>
          </div>

          <div className="table-container">
            <table className="fintech-table">
              <thead>
                <tr>
                  <th>Account Number</th>
                  <th>Type</th>
                  <th>Currency</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((acc) => (
                  <tr key={acc.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      {acc.accountNumber}
                    </td>
                    <td>{acc.accountType}</td>
                    <td>{acc.currency}</td>
                    <td className="amount" style={{ fontWeight: 700 }}>
                      ${parseFloat(acc.balance).toFixed(2)}
                    </td>
                    <td>
                      <span className="badge badge-completed">{acc.status}</span>
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: '#64748B' }}>
                      {acc.createdAt ? new Date(acc.createdAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Global Transactions */}
      {activeTab === 'transactions' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Global Transaction Oversight</h3>
              <span className="card-subtitle">Platform-wide audit of all money movements</span>
            </div>
          </div>

          <div className="table-container">
            <table className="fintech-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Initiator</th>
                  <th>Type</th>
                  <th>Source</th>
                  <th>Destination</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id || tx.reference}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{tx.reference}</td>
                    <td>{tx.initiatedByUsername || 'system'}</td>
                    <td>{tx.transactionType}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>
                      {tx.sourceAccountNumber || '—'}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>
                      {tx.destinationAccountNumber || '—'}
                    </td>
                    <td className="amount">${parseFloat(tx.amount).toFixed(2)} {tx.currency}</td>
                    <td>
                      <span className="badge badge-completed">{tx.status}</span>
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: '#64748B' }}>
                      {new Date(tx.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
