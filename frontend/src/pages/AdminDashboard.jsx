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
  RefreshCw,
  Clock,
  Check,
  X,
  ArrowRight
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
    const nextState = !currentEnabled;
    // Optimistic UI update so the badge and action flip instantly
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, enabled: nextState } : u))
    );
    try {
      await adminService.toggleUserStatus(userId, nextState);
      setSuccessMessage(`User status updated to ${nextState ? 'Active' : 'Disabled'}`);
      // Refresh to ensure full synchronization
      const usersData = await adminService.getAllUsers();
      setUsers(Array.isArray(usersData) ? usersData : (usersData?.content || []));
    } catch (err) {
      // Revert optimistic update on failure
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, enabled: currentEnabled } : u))
      );
      setError(err.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleApproveAccount = async (accountId, accNum) => {
    setActionLoadingId(accountId);
    setError(null);
    setSuccessMessage(null);
    try {
      await accountService.approveAccount(accountId);
      setSuccessMessage(`Account ${accNum} approved and activated successfully.`);
      await loadAdminData();
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
      await loadAdminData();
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
    <div style={{ paddingBottom: '3rem' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.75rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div className="bv-section-header">
            <span>GOVERNANCE &bull; SYSTEM ADMINISTRATION</span>
          </div>
          <h1
            style={{
              fontSize: '1.875rem',
              fontWeight: 600,
              color: '#092218',
              fontFamily: "'Newsreader', 'Georgia', serif",
              letterSpacing: '-0.02em',
              margin: '0 0 0.375rem',
            }}
          >
            System Administration Portal
          </h1>
          <p style={{ color: '#688073', fontSize: '0.875rem', margin: 0 }}>
            User management, account onboarding approvals & platform governance
          </p>
        </div>

        <button
          onClick={loadAdminData}
          className="btn btn-secondary btn-sm"
          disabled={loading}
          style={{ backgroundColor: '#FFFFFF', borderColor: '#CCD8CC', color: '#092218' }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          <span>Refresh Data</span>
        </button>
      </div>

      {successMessage && (
        <div style={{ marginBottom: '1.5rem' }}>
          <Alert
            type="success"
            message={successMessage}
            onClose={() => setSuccessMessage(null)}
          />
        </div>
      )}
      {error && (
        <div style={{ marginBottom: '1.5rem' }}>
          <Alert type="danger" message={error} onClose={() => setError(null)} />
        </div>
      )}

      {/* Pending Approvals Notice Banner */}
      {pendingAccounts.length > 0 && (
        <div
          style={{
            backgroundColor: '#FEF3C7',
            border: '1px solid #FDE68A',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
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
            style={{
              backgroundColor: '#092218',
              color: '#FFFFFF',
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '0.45rem 0.95rem',
              borderRadius: '8px',
            }}
          >
            Review Approvals &rarr;
          </button>
        </div>
      )}

      {/* High-Contrast KPI Cards */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8E0',
            borderRadius: '14px',
            padding: '1.5rem',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#5E7A6B', marginBottom: '0.375rem' }}>
            TOTAL USERS
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 700, fontFamily: "'Newsreader', serif", color: '#092218', lineHeight: 1.2 }}>
            {users.length}
          </div>
          <div style={{ fontSize: '0.8125rem', color: '#71877A', marginTop: '0.375rem' }}>
            Registered across all roles
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: pendingAccounts.length > 0 ? '1px solid #FDE68A' : '1px solid #E2E8E0',
            borderRadius: '14px',
            padding: '1.5rem',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#5E7A6B', marginBottom: '0.375rem' }}>
            PENDING APPROVALS
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 700, fontFamily: "'Newsreader', serif", color: pendingAccounts.length > 0 ? '#D97706' : '#092218', lineHeight: 1.2 }}>
            {pendingAccounts.length}
          </div>
          <div style={{ fontSize: '0.8125rem', color: '#71877A', marginTop: '0.375rem' }}>
            Awaiting admin permission
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8E0',
            borderRadius: '14px',
            padding: '1.5rem',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#5E7A6B', marginBottom: '0.375rem' }}>
            ACTIVE ACCOUNTS
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 700, fontFamily: "'Newsreader', serif", color: '#092218', lineHeight: 1.2 }}>
            {customerAccounts.filter((a) => a.status === 'ACTIVE').length}
          </div>
          <div style={{ fontSize: '0.8125rem', color: '#71877A', marginTop: '0.375rem' }}>
            Checking & savings active
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#F3F7F3',
            border: '1px solid #CCDACC',
            borderRadius: '14px',
            padding: '1.5rem',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#4A6856', marginBottom: '0.375rem' }}>
            TOTAL TRANSACTED
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 700, fontFamily: "'Newsreader', serif", color: '#092218', lineHeight: 1.2 }}>
            ${totalPlatformVolume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.8125rem', color: '#688073', marginTop: '0.375rem' }}>
            Cumulative USD volume
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: '1.5rem', overflowX: 'auto', display: 'flex', whiteSpace: 'nowrap' }}>
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
          Platform Transactions ({transactions.length})
        </button>
      </div>

      {/* TAB 1: SYSTEM OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid-2">
          {/* Institutional Clearing Accounts */}
          <div className="card" style={{ borderRadius: '16px', borderColor: '#E5EBE5', backgroundColor: '#FFFFFF' }}>
            <div className="card-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E5EBE5' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={20} color="#10B981" />
                <h3 className="card-title" style={{ fontSize: '1.0625rem', color: '#092218', margin: 0 }}>
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
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#092218', fontFamily: 'monospace' }}>
                        {acc.accountNumber}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#688073' }}>
                        Type: {acc.accountType} &bull; Currency: {acc.currency}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#092218', fontFamily: "'Newsreader', serif" }}>
                        ${parseFloat(acc.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <span className="badge badge-success" style={{ fontSize: '0.625rem' }}>SYSTEM</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Onboarding & Role Access Governance */}
          <div className="card" style={{ borderRadius: '16px', borderColor: '#E5EBE5', backgroundColor: '#FFFFFF' }}>
            <div className="card-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E5EBE5' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building2 size={20} color="#092218" />
                <h3 className="card-title" style={{ fontSize: '1.0625rem', color: '#092218', margin: 0 }}>
                  Onboarding & Role Access Governance
                </h3>
              </div>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <p style={{ fontSize: '0.8125rem', color: '#667085', marginBottom: '1rem', lineHeight: 1.4 }}>
                Account holders request accounts through their workspace. Administrators review and approve each request before activation.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.875rem 1rem', backgroundColor: '#F8FAF8', borderRadius: '10px', border: '1px solid #E5EBE5' }}>
                  <span style={{ fontSize: '0.8125rem', color: '#4A5568', fontWeight: 500 }}>Pending Account Requests:</span>
                  <span style={{ fontWeight: 700, color: pendingAccounts.length > 0 ? '#D97706' : '#166534' }}>
                    {pendingAccounts.length}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.875rem 1rem', backgroundColor: '#F8FAF8', borderRadius: '10px', border: '1px solid #E5EBE5' }}>
                  <span style={{ fontSize: '0.8125rem', color: '#4A5568', fontWeight: 500 }}>Registered Customers:</span>
                  <span style={{ fontWeight: 700, color: '#092218' }}>
                    {users.filter((u) => u.role === 'CUSTOMER').length}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.875rem 1rem', backgroundColor: '#F8FAF8', borderRadius: '10px', border: '1px solid #E5EBE5' }}>
                  <span style={{ fontSize: '0.8125rem', color: '#4A5568', fontWeight: 500 }}>Total Registered Accounts:</span>
                  <span style={{ fontWeight: 700, color: '#092218' }}>
                    {accounts.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACCOUNT APPROVALS */}
      {activeTab === 'approvals' && (
        <div className="card" style={{ borderRadius: '16px', borderColor: '#E5EBE5', backgroundColor: '#FFFFFF' }}>
          <div className="card-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E5EBE5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 className="card-title" style={{ fontSize: '1.125rem', color: '#092218', margin: 0 }}>
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
              <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#092218', marginBottom: '0.25rem' }}>
                No pending requests
              </h4>
              <p style={{ fontSize: '0.8125rem', color: '#667085', margin: 0 }}>
                All account holder onboarding requests have been reviewed and processed.
              </p>
            </div>
          ) : (
            <div className="table-responsive" style={{ overflowX: 'auto' }}>
              <table className="table" style={{ margin: 0, width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAF8', borderBottom: '1px solid #E5EBE5' }}>
                    <th style={{ color: '#5E7A6B', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.875rem 1rem' }}>Account Number</th>
                    <th style={{ color: '#5E7A6B', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.875rem 1rem' }}>Applicant</th>
                    <th style={{ color: '#5E7A6B', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.875rem 1rem' }}>Type</th>
                    <th style={{ color: '#5E7A6B', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.875rem 1rem' }}>Currency</th>
                    <th style={{ color: '#5E7A6B', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.875rem 1rem' }}>Status</th>
                    <th style={{ color: '#5E7A6B', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right', padding: '0.875rem 1rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingAccounts.map((acc) => (
                    <tr key={acc.id} style={{ borderBottom: '1px solid #F0F4F0' }}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#092218', padding: '0.875rem 1rem' }}>
                        {acc.accountNumber}
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <div style={{ fontWeight: 600, color: '#092218', fontSize: '0.875rem' }}>
                          {acc.user?.fullName || acc.user?.username || `User #${acc.userId || 'N/A'}`}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#667085' }}>
                          @{acc.user?.username || 'user'} &bull; {acc.user?.email || ''}
                        </div>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span className="badge badge-primary">{acc.accountType}</span>
                      </td>
                      <td style={{ fontWeight: 600, color: '#092218', padding: '0.875rem 1rem' }}>{acc.currency}</td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.625rem', borderRadius: '9999px', backgroundColor: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }}>
                          PENDING APPROVAL
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', padding: '0.875rem 1rem' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button
                            type="button"
                            disabled={actionLoadingId === acc.id}
                            onClick={() => handleApproveAccount(acc.id, acc.accountNumber)}
                            className="btn btn-sm"
                            style={{
                              backgroundColor: '#10B981',
                              color: 'white',
                              border: '1px solid #10B981',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.4rem 0.75rem',
                              borderRadius: '6px',
                            }}
                          >
                            <Check size={14} />
                            <span>Approve & Activate</span>
                          </button>
                          <button
                            type="button"
                            disabled={actionLoadingId === acc.id}
                            onClick={() => handleRejectAccount(acc.id, acc.accountNumber)}
                            className="btn btn-sm"
                            style={{
                              borderColor: '#FCA5A5',
                              color: '#DC2626',
                              backgroundColor: '#FEF2F2',
                              border: '1px solid #FECACA',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.4rem 0.75rem',
                              borderRadius: '6px',
                            }}
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

      {/* TAB 3: USER DIRECTORY */}
      {activeTab === 'users' && (
        <div className="card" style={{ borderRadius: '16px', borderColor: '#E5EBE5', backgroundColor: '#FFFFFF' }}>
          <div className="card-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E5EBE5' }}>
            <h3 className="card-title" style={{ fontSize: '1.125rem', color: '#092218', margin: 0 }}>
              User Directory & Status Control
            </h3>
          </div>
          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table className="table" style={{ margin: 0, width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAF8', borderBottom: '1px solid #E5EBE5' }}>
                  <th style={{ color: '#5E7A6B', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.875rem 1rem' }}>User</th>
                  <th style={{ color: '#5E7A6B', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.875rem 1rem' }}>Email</th>
                  <th style={{ color: '#5E7A6B', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.875rem 1rem' }}>Role</th>
                  <th style={{ color: '#5E7A6B', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.875rem 1rem' }}>Status</th>
                  <th style={{ color: '#5E7A6B', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right', padding: '0.875rem 1rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #F0F4F0' }}>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: '#092218',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {u.fullName?.charAt(0) || u.username?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#092218' }}>{u.fullName || u.username}</div>
                          <div style={{ fontSize: '0.75rem', color: '#688073' }}>@{u.username}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: '#334155', padding: '0.875rem 1rem' }}>{u.email}</td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <span className={`badge ${u.role === 'ADMIN' ? 'badge-primary' : u.role === 'AUDITOR' ? 'badge-warning' : 'badge-completed'}`}>
                        {u.role === 'CUSTOMER' ? 'Account Holder' : u.role}
                      </span>
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.55rem',
                          borderRadius: '9999px',
                          backgroundColor: u.enabled ? '#EAF5EE' : '#FEF2F2',
                          color: u.enabled ? '#166534' : '#991B1B',
                          border: `1px solid ${u.enabled ? '#BBF7D0' : '#FECACA'}`,
                        }}
                      >
                        {u.enabled ? 'ACTIVE' : 'DISABLED'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', padding: '0.875rem 1rem' }}>
                      {u.role !== 'ADMIN' && (
                        <button
                          type="button"
                          onClick={() => handleToggleUserStatus(u.id, u.enabled)}
                          className="btn btn-sm"
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            padding: '0.35rem 0.85rem',
                            borderRadius: '6px',
                            backgroundColor: u.enabled ? '#FEF2F2' : '#EAF5EE',
                            color: u.enabled ? '#DC2626' : '#166534',
                            border: `1px solid ${u.enabled ? '#FECACA' : '#BBF7D0'}`,
                            cursor: 'pointer',
                          }}
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

      {/* TAB 4: ALL ACCOUNTS */}
      {activeTab === 'accounts' && (
        <div className="card" style={{ borderRadius: '16px', borderColor: '#E5EBE5', backgroundColor: '#FFFFFF' }}>
          <div className="card-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E5EBE5' }}>
            <h3 className="card-title" style={{ fontSize: '1.125rem', color: '#092218', margin: 0 }}>
              All System Accounts ({accounts.length})
            </h3>
          </div>
          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table className="table" style={{ margin: 0, width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAF8', borderBottom: '1px solid #E5EBE5' }}>
                  <th style={{ color: '#5E7A6B', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.875rem 1rem' }}>Account Number</th>
                  <th style={{ color: '#5E7A6B', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.875rem 1rem' }}>Type</th>
                  <th style={{ color: '#5E7A6B', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.875rem 1rem' }}>Currency</th>
                  <th style={{ color: '#5E7A6B', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right', padding: '0.875rem 1rem' }}>Balance</th>
                  <th style={{ color: '#5E7A6B', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.875rem 1rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((acc) => (
                  <tr key={acc.id} style={{ borderBottom: '1px solid #F0F4F0' }}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600, color: '#092218', padding: '0.875rem 1rem' }}>{acc.accountNumber}</td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <span className={`badge ${acc.accountType === 'SYSTEM_CLEARING' ? 'badge-warning' : 'badge-primary'}`}>
                        {acc.accountType}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: '#092218', padding: '0.875rem 1rem' }}>{acc.currency}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#092218', fontFamily: "'Newsreader', serif", fontSize: '1rem', padding: '0.875rem 1rem' }}>
                      ${parseFloat(acc.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
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

      {/* TAB 5: PLATFORM TRANSACTIONS */}
      {activeTab === 'transactions' && (
        <div className="card" style={{ borderRadius: '16px', borderColor: '#E5EBE5', backgroundColor: '#FFFFFF' }}>
          <div className="card-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E5EBE5' }}>
            <h3 className="card-title" style={{ fontSize: '1.125rem', color: '#092218', margin: 0 }}>
              Global Platform Transactions ({transactions.length})
            </h3>
          </div>
          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table className="table" style={{ margin: 0, width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAF8', borderBottom: '1px solid #E5EBE5' }}>
                  <th style={{ color: '#5E7A6B', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.875rem 1rem' }}>Reference</th>
                  <th style={{ color: '#5E7A6B', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.875rem 1rem' }}>Date & Time</th>
                  <th style={{ color: '#5E7A6B', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.875rem 1rem' }}>Initiator</th>
                  <th style={{ color: '#5E7A6B', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.875rem 1rem' }}>Type</th>
                  <th style={{ color: '#5E7A6B', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.875rem 1rem' }}>Account Route</th>
                  <th style={{ color: '#5E7A6B', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right', padding: '0.875rem 1rem' }}>Amount</th>
                  <th style={{ color: '#5E7A6B', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', padding: '0.875rem 1rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: '#688073' }}>
                      No platform transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id || tx.reference} style={{ borderBottom: '1px solid #F0F4F0' }}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#092218', padding: '0.875rem 1rem' }}>
                        {tx.reference}
                      </td>
                      <td style={{ fontSize: '0.8125rem', color: '#688073', padding: '0.875rem 1rem', whiteSpace: 'nowrap' }}>
                        {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : '—'}
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span style={{ fontWeight: 600, color: '#092218' }}>
                          @{tx.initiatedByUsername || 'system'}
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span className={`badge ${tx.transactionType === 'DEPOSIT' ? 'badge-success' : tx.transactionType === 'WITHDRAWAL' ? 'badge-warning' : 'badge-primary'}`}>
                          {tx.transactionType}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#4A5568', padding: '0.875rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <span>{tx.sourceAccountNumber || 'External'}</span>
                          <ArrowRight size={12} color="#94A3B8" />
                          <span>{tx.destinationAccountNumber || 'External'}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#092218', fontFamily: "'Newsreader', serif", fontSize: '1rem', padding: '0.875rem 1rem', whiteSpace: 'nowrap' }}>
                        ${parseFloat(tx.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {tx.currency}
                      </td>
                      <td style={{ textAlign: 'center', padding: '0.875rem 1rem' }}>
                        <span className="badge badge-completed">{tx.status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
