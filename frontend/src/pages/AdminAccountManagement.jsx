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
  ShieldAlert,
  ArrowDownLeft,
  ArrowUpRight
} from 'lucide-react';

export const AdminAccountManagement = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'CUSTOMER' | 'CLEARING'

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await accountService.getAllAccounts();
      setAccounts(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve platform accounts');
    } finally {
      setLoading(false);
    }
  };

  const customerAccounts = accounts.filter((a) => a.accountType !== 'SYSTEM_CLEARING');
  const clearingAccounts = accounts.filter((a) => a.accountType === 'SYSTEM_CLEARING');

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
      (filterType === 'CLEARING' && a.accountType === 'SYSTEM_CLEARING');

    return matchesSearch && matchesFilter;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A' }}>
            Platform Account Oversight
          </h2>
          <p style={{ color: '#64748B', fontSize: '0.875rem' }}>
            Comprehensive visibility across customer deposits and institutional clearing pools
          </p>
        </div>

        <button onClick={loadAccounts} className="btn btn-secondary" disabled={loading}>
          <RefreshCw size={15} />
          <span>Refresh</span>
        </button>
      </div>

      {error && <Alert type="danger" message={error} onClose={() => setError(null)} />}

      {/* KPI Cards */}
      <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card accent">
          <div className="stat-label">Total Customer Holdings</div>
          <div className="stat-value">${totalCustomerDeposits.toFixed(2)}</div>
          <div className="stat-subtext">Across {customerAccounts.length} customer account(s)</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">System Clearing Accounts</div>
          <div className="stat-value">{clearingAccounts.length} Pool(s)</div>
          <div className="stat-subtext">SYS-CLEARING-DEP & SYS-CLEARING-WDL</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Total Platform Accounts</div>
          <div className="stat-value">{accounts.length}</div>
          <div className="stat-subtext">Enforced non-negative check constraints</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1', minWidth: '240px', position: 'relative' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: '2.25rem' }}
              placeholder="Search by account number, owner, or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Filter size={16} color="#64748b" />
            <select
              className="form-control"
              style={{ width: 'auto' }}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="ALL">All Account Classes</option>
              <option value="CUSTOMER">Customer Accounts Only</option>
              <option value="CLEARING">System Clearing Accounts Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Enrolled Ledger Accounts</h3>
            <span className="card-subtitle">Showing {filteredAccounts.length} of {accounts.length} account(s)</span>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ width: '36px', height: '36px' }} />
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="empty-state">
            <Building2 size={48} className="empty-state-icon" />
            <p>No accounts match your search filter.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Account Identifier</th>
                  <th>Classification</th>
                  <th>Account Owner</th>
                  <th>Base Currency</th>
                  <th>Current Balance</th>
                  <th>Status</th>
                  <th>Created Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map((acc) => {
                  const isClearing = acc.accountType === 'SYSTEM_CLEARING';
                  return (
                    <tr key={acc.id} style={{ backgroundColor: isClearing ? '#f8fafc' : 'transparent' }}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                        {acc.accountNumber}
                        {isClearing && (
                          <span className="badge badge-neutral" style={{ marginLeft: '0.5rem', fontSize: '0.6875rem' }}>
                            CLEARING
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${isClearing ? 'badge-primary' : 'badge-neutral'}`}>
                          {acc.accountType}
                        </span>
                      </td>
                      <td>
                        {acc.user ? (
                          <span>
                            <strong>{acc.user.fullName || acc.user.username}</strong>{' '}
                            <span style={{ color: '#64748b', fontSize: '0.8125rem' }}>@{acc.user.username}</span>
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>SYSTEM CORE</span>
                        )}
                      </td>
                      <td style={{ fontWeight: 600 }}>{acc.currency}</td>
                      <td className="amount" style={{ fontWeight: 700, fontSize: '0.9375rem', color: parseFloat(acc.balance) < 0 ? '#dc2626' : '#0f172a' }}>
                        ${parseFloat(acc.balance).toFixed(2)}
                      </td>
                      <td>
                        <span className={`badge ${acc.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                          {acc.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                        {new Date(acc.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
