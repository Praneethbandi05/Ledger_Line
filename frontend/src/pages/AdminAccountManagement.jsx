import React, { useState, useEffect } from 'react';
import { accountService } from '../services/accountService';
import { Alert } from '../components/Alert';
import {
  Building2,
  Search,
  Filter,
  CheckCircle,
  RefreshCw,
  Wallet,
  Check,
  X,
  Clock
} from 'lucide-react';

export const AdminAccountManagement = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await accountService.getAllAccounts();
      setAccounts(Array.isArray(data) ? data : (data?.content || []));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve platform accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAccount = async (accountId, accNum) => {
    setActionLoadingId(accountId);
    setError(null);
    setSuccessMessage(null);
    try {
      await accountService.approveAccount(accountId);
      setSuccessMessage(`Account ${accNum} approved and activated successfully.`);
      loadAccounts();
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
      loadAccounts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject account');
    } finally {
      setActionLoadingId(null);
    }
  };

  const pendingAccounts = accounts.filter((a) => a.status === 'PENDING_APPROVAL');
  const customerAccounts = accounts.filter((a) => a.accountType !== 'SYSTEM_CLEARING');
  const totalCustomerDeposits = customerAccounts.reduce((sum, a) => sum + parseFloat(a.balance || 0), 0);

  const filteredAccounts = accounts.filter((a) => {
    const matchesSearch =
      !searchQuery ||
      a.accountNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.user?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.accountType?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterType === 'ALL' ||
      (filterType === 'CUSTOMER' && a.accountType !== 'SYSTEM_CLEARING') ||
      (filterType === 'CLEARING' && a.accountType === 'SYSTEM_CLEARING') ||
      (filterType === 'PENDING' && a.status === 'PENDING_APPROVAL');

    return matchesSearch && matchesFilter;
  });

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="bv-section-header">
            <span>GOVERNANCE &bull; ACCOUNTS & ONBOARDING</span>
          </div>
          <h1
            style={{
              fontSize: '1.875rem',
              fontWeight: 600,
              color: '#092218',
              fontFamily: "'Newsreader', 'Georgia', serif",
              letterSpacing: '-0.02em',
              margin: '0 0 0.5rem',
            }}
          >
            Accounts & Approvals
          </h1>
          <p style={{ color: '#688073', fontSize: '0.875rem', margin: 0, lineHeight: 1.5 }}>
            Review pending customer account requests and oversee platform-wide deposit and clearing accounts.
          </p>
        </div>

        <button
          type="button"
          onClick={loadAccounts}
          className="btn btn-secondary btn-sm"
          disabled={loading}
          style={{ backgroundColor: '#FFFFFF', borderColor: '#CCD8CC', color: '#0B251C' }}
        >
          <RefreshCw size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {successMessage && (
        <div style={{ marginBottom: '1.5rem' }}>
          <Alert type="success" message={successMessage} onClose={() => setSuccessMessage(null)} />
        </div>
      )}

      {error && (
        <div style={{ marginBottom: '1.5rem' }}>
          <Alert type="danger" message={error} onClose={() => setError(null)} />
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="bv-card">
          <div className="bv-card-label">Pending Account Requests</div>
          <div className="bv-card-value" style={{ color: pendingAccounts.length > 0 ? '#D97706' : '#0B251C' }}>
            {pendingAccounts.length}
          </div>
          <div className="bv-card-sub">Awaiting admin review & activation</div>
        </div>

        <div className="bv-card">
          <div className="bv-card-label">Total Customer Holdings</div>
          <div className="bv-card-value" style={{ fontFamily: "'Newsreader', serif" }}>
            ${totalCustomerDeposits.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="bv-card-sub">Across {customerAccounts.length} customer accounts</div>
        </div>

        <div className="bv-card">
          <div className="bv-card-label">Total Platform Accounts</div>
          <div className="bv-card-value">{accounts.length}</div>
          <div className="bv-card-sub">Including institutional clearing pools</div>
        </div>
      </div>

      {/* Pending Account Requests Section */}
      {pendingAccounts.length > 0 && (
        <div style={{ marginBottom: '2.5rem' }}>
          <div className="bv-section-header">
            <span>ACTION REQUIRED &bull; PENDING ACCOUNT APPROVALS</span>
          </div>
          <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '16px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#B45309', fontWeight: 700 }}>
              <Clock size={18} />
              <span>{pendingAccounts.length} Account Request(s) Awaiting Review</span>
            </div>
            <div className="table-container" style={{ borderRadius: '10px', overflow: 'hidden', backgroundColor: '#FFFFFF', border: '1px solid #FDE68A' }}>
              <table className="table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Account Number</th>
                    <th>Account Holder</th>
                    <th>Type</th>
                    <th>Currency</th>
                    <th>Requested On</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingAccounts.map((acc) => (
                    <tr key={acc.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{acc.accountNumber}</td>
                      <td>
                        <strong>{acc.user?.fullName || acc.user?.username}</strong>
                        <span style={{ fontSize: '0.75rem', color: '#688073', display: 'block' }}>@{acc.user?.username}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: '4px', backgroundColor: '#F1F5F2' }}>
                          {acc.accountType}
                        </span>
                      </td>
                      <td>{acc.currency}</td>
                      <td style={{ fontSize: '0.8125rem', color: '#688073' }}>
                        {acc.createdAt ? new Date(acc.createdAt).toLocaleDateString() : 'Recent'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button
                            type="button"
                            onClick={() => handleApproveAccount(acc.id, acc.accountNumber)}
                            disabled={actionLoadingId === acc.id}
                            className="btn btn-sm"
                            style={{ backgroundColor: '#092218', color: '#FFFFFF', fontSize: '0.75rem', padding: '0.35rem 0.75rem', borderRadius: '6px' }}
                          >
                            <Check size={12} style={{ marginRight: '4px' }} />
                            Approve & Activate
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectAccount(acc.id, acc.accountNumber)}
                            disabled={actionLoadingId === acc.id}
                            className="btn btn-sm btn-secondary"
                            style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', borderRadius: '6px', color: '#991B1B', borderColor: '#FCA5A5' }}
                          >
                            <X size={12} style={{ marginRight: '4px' }} />
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* All Accounts Explorer */}
      <div>
        <div className="bv-section-header">
          <span>DIRECTORY &bull; ALL PLATFORM ACCOUNTS</span>
        </div>

        {/* Filter bar */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5EBE5', padding: '1rem', marginBottom: '1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1', minWidth: '220px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search by account number, owner, or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.25rem', borderRadius: '8px', border: '1px solid #D9E2DC', fontSize: '0.875rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#688073', fontWeight: 600 }}>Filter:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{ padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid #D9E2DC', fontSize: '0.8125rem' }}
            >
              <option value="ALL">All Accounts ({accounts.length})</option>
              <option value="CUSTOMER">Customer Accounts ({customerAccounts.length})</option>
              <option value="CLEARING">Clearing Accounts</option>
              <option value="PENDING">Pending Approval ({pendingAccounts.length})</option>
            </select>
          </div>
        </div>

        <div className="table-container" style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #E5EBE5', backgroundColor: '#FFFFFF' }}>
          <table className="table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>Account Number</th>
                <th>Owner</th>
                <th>Type</th>
                <th>Currency</th>
                <th style={{ textAlign: 'right' }}>Balance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map((acc) => (
                <tr key={acc.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{acc.accountNumber}</td>
                  <td>
                    {acc.user ? (
                      <>
                        <span style={{ fontWeight: 600 }}>{acc.user.fullName || acc.user.username}</span>
                        <span style={{ fontSize: '0.75rem', color: '#688073', display: 'block' }}>@{acc.user.username}</span>
                      </>
                    ) : (
                      <span style={{ color: '#94A3B8' }}>System Vault</span>
                    )}
                  </td>
                  <td>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px', backgroundColor: '#F1F5F2', color: '#092218' }}>
                      {acc.accountType}
                    </span>
                  </td>
                  <td>{acc.currency}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#092218' }}>
                    ${parseFloat(acc.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.5rem',
                        borderRadius: '9999px',
                        backgroundColor: acc.status === 'ACTIVE' ? '#EAF5EE' : acc.status === 'PENDING_APPROVAL' ? '#FEF3C7' : '#F1F5F9',
                        color: acc.status === 'ACTIVE' ? '#166534' : acc.status === 'PENDING_APPROVAL' ? '#92400E' : '#475569',
                      }}
                    >
                      {acc.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
