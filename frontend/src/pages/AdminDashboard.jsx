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
  Clock,
  Check,
  X
} from 'lucide-react';

export const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'approvals' | 'users' | 'accounts' | 'transactions'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

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
      setUsers(Array.isArray(usersData) ? usersData : (usersData?.content || []));
      setAccounts(Array.isArray(accountsData) ? accountsData : (accountsData?.content || []));
      setTransactions(Array.isArray(txData) ? txData : (txData?.content || []));
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

  const handleApproveAccount = async (accountId, accNum) => {
    setActionLoadingId(accountId);
    setError(null);
    setSuccessMessage(null);
    try {
      await accountService.approveAccount(accountId);
      setSuccessMessage(`Account ${accNum} approved and activated successfully. The account holder can now move funds.`);
      loadAdminData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve account');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectAccount = async (accountId, accNum) => {
    setActionLoadingId(accountId);
    setError(null);
    setSuccessMessage(null);
    try {
      await accountService.rejectAccount(accountId);
      setSuccessMessage(`Account request ${accNum} rejected.`);
      loadAdminData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject account');
    } finally {
      setActionLoadingId(null);
    }
  };

  const totalPlatformVolume = transactions.reduce(
    (sum, tx) => sum + parseFloat(tx.amount || 0),
    0
  );

  const customerAccounts = accounts.filter((a) => a.accountType !== 'SYSTEM_CLEARING');
  const systemAccounts = accounts.filter((a) => a.accountType === 'SYSTEM_CLEARING');
  const pendingAccounts = accounts.filter((a) => a.status === 'PENDING_APPROVAL');

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
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0B251C', margin: 0 }}>
            System Administration Portal
          </h2>
          <p style={{ color: '#688073', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
            User management, account onboarding approvals & platform governance
          </p>
        </div>

        <button onClick={loadAdminData} className="btn btn-secondary btn-sm" disabled={loading} style={{ backgroundColor: '#FFFFFF', borderColor: '#CCD8CC', color: '#0B251C' }}>
          <RefreshCw size={14} />
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

      {/* Pending Approvals Notice Banner */}
      {pendingAccounts.length > 0 && (
        <div style={{ backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Clock size={20} color="#B45309" />
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#92400E' }}>
                {pendingAccounts.length} Pending Account {pendingAccounts.length === 1 ? 'Request' : 'Requests'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#B45309' }}>
                Account holders have submitted account requests that require administrator review and approval.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('approvals')}
            className="btn btn-sm"
            style={{ backgroundColor: '#0B251C', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 600, padding: '0.4rem 0.875rem', borderRadius: '8px' }}
          >
            Review Approvals &rarr;
          </button>
        </div>
      )}

      {/* KPI Overview */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <div className="stat-card" style={{ borderColor: '#E5EBE5' }}>
          <div className="stat-label">Total Users</div>
          <div className="stat-value" style={{ color: '#0B251C' }}>{users.length}</div>
          <div className="stat-subtext">Registered across all roles</div>
        </div>

        <div className="stat-card" style={{ borderColor: '#E5EBE5' }}>
          <div className="stat-label">Pending Approvals</div>
          <div className="stat-value" style={{ color: pendingAccounts.length > 0 ? '#D97706' : '#0B251C' }}>
            {pendingAccounts.length}
          </div>
          <div className="stat-subtext">Awaiting admin permission</div>
        </div>

        <div className="stat-card" style={{ borderColor: '#E5EBE5' }}>
          <div className="stat-label">Active Accounts</div>
          <div className="stat-value" style={{ color: '#0B251C' }}>{customerAccounts.filter(a => a.status === 'ACTIVE').length}</div>
          <div className="stat-subtext">Checking & savings active</div>
        </div>

        <div className="stat-card accent" style={{ backgroundColor: '#E8EFE8', borderColor: '#CCD8CC' }}>
          <div className="stat-label" style={{ color: '#4A6356' }}>Total Transacted</div>
          <div className="stat-value" style={{ color: '#0B251C' }}>${totalPlatformVolume.toFixed(2)}</div>
          <div className="stat-subtext" style={{ color: '#688073' }}>Cumulative USD volume</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: '1.5rem' }}>
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          System Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'approvals' ? 'active' : ''}`}
          onClick={() => setActiveTab('approvals')}
          style={pendingAccounts.length > 0 ? { fontWeight: 700, color: '#B45309' } : {}}
        >
          Account Approvals {pendingAccounts.length > 0 && `(${pendingAccounts.length})`}
        </button>
        <button
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          User Directory ({users.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'accounts' ? 'active' : ''}`}
          onClick={() => setActiveTab('accounts')}
        >
          All Accounts ({accounts.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          Transactions ({transactions.length})
        </button>
      </div>

      {/* Tab: System Overview */}
      {activeTab === 'overview' && (
        <div className="grid-2">
          {/* Institutional Clearing Status */}
          <div className="card" style={{ borderRadius: '16px', borderColor: '#E5EBE5' }}>
            <div className="card-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E5EBE5' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={20} color="#10B981" />
                <h3 className="card-title" style={{ fontSize: '1.0625rem', color: '#0B251C', margin: 0 }}>
                  System Clearing Accounts
                </h3>
              </div>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <p style={{ fontSize: '0.8125rem', color: '#667085', marginBottom: '1rem', lineHeight: 1.4 }}>
                Balance Vault maintains institutional clearing accounts for external money movement counterparties.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {systemAccounts.map((acc) => (
                  <div
                    key={acc.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.875rem 1rem',
                      backgroundColor: '#F8FAF8',
                      borderRadius: '10px',
                      border: '1px solid #E5EBE5',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0B251C', fontFamily: 'monospace' }}>
                        {acc.accountNumber}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#688073' }}>
                        Type: {acc.accountType} &bull; Currency: {acc.currency}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0B251C', fontFamily: "'Newsreader', serif" }}>
                        ${parseFloat(acc.balance || 0).toFixed(2)}
                      </div>
                      <span className="badge badge-success" style={{ fontSize: '0.625rem' }}>SYSTEM</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Stats & Onboarding Card */}
          <div className="card" style={{ borderRadius: '16px', borderColor: '#E5EBE5' }}>
            <div className="card-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E5EBE5' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building2 size={20} color="#0B251C" />
                <h3 className="card-title" style={{ fontSize: '1.0625rem', color: '#0B251C', margin: 0 }}>
                  Onboarding & Role Access Governance
                </h3>
              </div>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <p style={{ fontSize: '0.8125rem', color: '#667085', marginBottom: '1rem', lineHeight: 1.4 }}>
                Account holders request accounts through their workspace. Administrators review and approve each request before activation.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', backgroundColor: '#F8FAF8', borderRadius: '10px', border: '1px solid #E5EBE5' }}>
                  <span style={{ fontSize: '0.8125rem', color: '#4A5568' }}>Pending Account Requests:</span>
                  <span style={{ fontWeight: 700, color: pendingAccounts.length > 0 ? '#D97706' : '#166534' }}>
                    {pendingAccounts.length}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', backgroundColor: '#F8FAF8', borderRadius: '10px', border: '1px solid #E5EBE5' }}>
                  <span style={{ fontSize: '0.8125rem', color: '#4A5568' }}>Registered Customers:</span>
                  <span style={{ fontWeight: 700, color: '#0B251C' }}>
                    {users.filter(u => u.role === 'CUSTOMER').length}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', backgroundColor: '#F8FAF8', borderRadius: '10px', border: '1px solid #E5EBE5' }}>
                  <span style={{ fontSize: '0.8125rem', color: '#4A5568' }}>Double-Entry Balancing Rule:</span>
                  <span style={{ fontWeight: 700, color: '#166534' }}>
                    &Sigma;(Debits) &equiv; &Sigma;(Credits)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Account Approvals */}
      {activeTab === 'approvals' && (
        <div className="card" style={{ borderRadius: '16px', borderColor: '#E5EBE5' }}>
          <div className="card-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E5EBE5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 className="card-title" style={{ fontSize: '1.125rem', color: '#0B251C', margin: 0 }}>
                Account Onboarding Requests ({pendingAccounts.length})
              </h3>
              <span className="card-subtitle" style={{ fontSize: '0.75rem', color: '#688073' }}>
                Review and approve new accounts requested by account holders
              </span>
            </div>
          </div>

          {pendingAccounts.length === 0 ? (
            <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#EAF5EE', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <CheckCircle2 size={24} />
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#0B251C', marginBottom: '0.25rem' }}>
                No pending requests
              </h4>
              <p style={{ fontSize: '0.8125rem', color: '#667085', margin: 0 }}>
                All account holder onboarding requests have been reviewed and processed.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table" style={{ margin: 0 }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAF8', borderBottom: '1px solid #E5EBE5' }}>
                    <th style={{ color: '#688073', fontSize: '0.75rem', textTransform: 'uppercase' }}>Account Number</th>
                    <th style={{ color: '#688073', fontSize: '0.75rem', textTransform: 'uppercase' }}>Applicant</th>
                    <th style={{ color: '#688073', fontSize: '0.75rem', textTransform: 'uppercase' }}>Type</th>
                    <th style={{ color: '#688073', fontSize: '0.75rem', textTransform: 'uppercase' }}>Currency</th>
                    <th style={{ color: '#688073', fontSize: '0.75rem', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ color: '#688073', fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingAccounts.map((acc) => (
                    <tr key={acc.id} style={{ borderBottom: '1px solid #F4F7F4' }}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0B251C' }}>
                        {acc.accountNumber}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0B251C', fontSize: '0.875rem' }}>
                          {acc.user?.fullName || acc.user?.username || `User #${acc.userId || 'N/A'}`}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#667085' }}>
                          @{acc.user?.username || 'user'} &bull; {acc.user?.email || ''}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-primary">{acc.accountType}</span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{acc.currency}</td>
                      <td>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '9999px', backgroundColor: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }}>
                          PENDING APPROVAL
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button
                            type="button"
                            disabled={actionLoadingId === acc.id}
                            onClick={() => handleApproveAccount(acc.id, acc.accountNumber)}
                            className="btn btn-sm"
                            style={{ backgroundColor: '#10B981', color: 'white', borderColor: '#10B981', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            <Check size={14} />
                            <span>Approve & Activate</span>
                          </button>
                          <button
                            type="button"
                            disabled={actionLoadingId === acc.id}
                            onClick={() => handleRejectAccount(acc.id, acc.accountNumber)}
                            className="btn btn-secondary btn-sm"
                            style={{ borderColor: '#FCA5A5', color: '#DC2626', backgroundColor: '#FEF2F2', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            <X size={14} />
                            <span>Reject</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Users */}
      {activeTab === 'users' && (
        <div className="card" style={{ borderRadius: '16px', borderColor: '#E5EBE5' }}>
          <div className="card-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E5EBE5' }}>
            <h3 className="card-title" style={{ fontSize: '1.125rem', color: '#0B251C', margin: 0 }}>
              User Directory & Status Control
            </h3>
          </div>
          <div className="table-responsive">
            <table className="table" style={{ margin: 0 }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAF8', borderBottom: '1px solid #E5EBE5' }}>
                  <th style={{ color: '#688073', fontSize: '0.75rem' }}>Username</th>
                  <th style={{ color: '#688073', fontSize: '0.75rem' }}>Full Name</th>
                  <th style={{ color: '#688073', fontSize: '0.75rem' }}>Email</th>
                  <th style={{ color: '#688073', fontSize: '0.75rem' }}>Role</th>
                  <th style={{ color: '#688073', fontSize: '0.75rem' }}>Status</th>
                  <th style={{ color: '#688073', fontSize: '0.75rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #F4F7F4' }}>
                    <td style={{ fontWeight: 600, color: '#0B251C' }}>@{u.username}</td>
                    <td>{u.fullName}</td>
                    <td style={{ fontSize: '0.8125rem', color: '#667085' }}>{u.email}</td>
                    <td>
                      <span className={`badge ${u.role === 'ADMIN' ? 'badge-primary' : u.role === 'AUDITOR' ? 'badge-warning' : 'badge-completed'}`}>
                        {u.role === 'CUSTOMER' ? 'Account holder' : u.role}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${u.enabled ? 'badge-completed' : 'badge-danger'}`}>
                        {u.enabled ? 'ACTIVE' : 'DISABLED'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {u.role !== 'ADMIN' && (
                        <button
                          onClick={() => handleToggleUserStatus(u.id, u.enabled)}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.75rem' }}
                        >
                          {u.enabled ? 'Suspend' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Accounts */}
      {activeTab === 'accounts' && (
        <div className="card" style={{ borderRadius: '16px', borderColor: '#E5EBE5' }}>
          <div className="card-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E5EBE5' }}>
            <h3 className="card-title" style={{ fontSize: '1.125rem', color: '#0B251C', margin: 0 }}>
              All System Accounts
            </h3>
          </div>
          <div className="table-responsive">
            <table className="table" style={{ margin: 0 }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAF8', borderBottom: '1px solid #E5EBE5' }}>
                  <th style={{ color: '#688073', fontSize: '0.75rem' }}>Account Number</th>
                  <th style={{ color: '#688073', fontSize: '0.75rem' }}>Type</th>
                  <th style={{ color: '#688073', fontSize: '0.75rem' }}>Currency</th>
                  <th style={{ color: '#688073', fontSize: '0.75rem', textAlign: 'right' }}>Balance</th>
                  <th style={{ color: '#688073', fontSize: '0.75rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((acc) => (
                  <tr key={acc.id} style={{ borderBottom: '1px solid #F4F7F4' }}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600, color: '#0B251C' }}>{acc.accountNumber}</td>
                    <td>{acc.accountType}</td>
                    <td>{acc.currency}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#0B251C' }}>
                      ${parseFloat(acc.balance || 0).toFixed(2)}
                    </td>
                    <td>
                      <span className={`badge ${acc.status === 'ACTIVE' ? 'badge-completed' : acc.status === 'PENDING_APPROVAL' ? 'badge-warning' : 'badge-danger'}`}>
                        {acc.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Transactions */}
      {activeTab === 'transactions' && (
        <div className="card" style={{ borderRadius: '16px', borderColor: '#E5EBE5' }}>
          <div className="card-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E5EBE5' }}>
            <h3 className="card-title" style={{ fontSize: '1.125rem', color: '#0B251C', margin: 0 }}>
              Global Transaction Oversight
            </h3>
          </div>
          <div className="table-responsive">
            <table className="table" style={{ margin: 0 }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAF8', borderBottom: '1px solid #E5EBE5' }}>
                  <th style={{ color: '#688073', fontSize: '0.75rem' }}>Reference</th>
                  <th style={{ color: '#688073', fontSize: '0.75rem' }}>Initiator</th>
                  <th style={{ color: '#688073', fontSize: '0.75rem' }}>Type</th>
                  <th style={{ color: '#688073', fontSize: '0.75rem' }}>Source</th>
                  <th style={{ color: '#688073', fontSize: '0.75rem' }}>Destination</th>
                  <th style={{ color: '#688073', fontSize: '0.75rem', textAlign: 'right' }}>Amount</th>
                  <th style={{ color: '#688073', fontSize: '0.75rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id || tx.reference} style={{ borderBottom: '1px solid #F4F7F4' }}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600, color: '#0B251C' }}>{tx.reference}</td>
                    <td>{tx.initiatedByUsername || 'system'}</td>
                    <td><span className="badge badge-primary">{tx.transactionType}</span></td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{tx.sourceAccountNumber || '—'}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{tx.destinationAccountNumber || '—'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#0B251C' }}>
                      ${parseFloat(tx.amount || 0).toFixed(2)} {tx.currency}
                    </td>
                    <td><span className="badge badge-completed">{tx.status}</span></td>
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
