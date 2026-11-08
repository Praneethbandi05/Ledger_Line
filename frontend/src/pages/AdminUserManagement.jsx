import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { Alert } from '../components/Alert';
import {
  Users,
  Search,
  Filter,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  XCircle
} from 'lucide-react';

export const AdminUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getAllUsers();
      setUsers(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve user directory');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUser = async (user) => {
    setActionLoadingId(user.id);
    setError(null);
    setSuccessMessage(null);
    try {
      const newEnabled = !user.enabled;
      await adminService.toggleUserStatus(user.id, newEnabled);
      setSuccessMessage(`User @${user.username} has been ${newEnabled ? 'Enabled' : 'Suspended'}`);
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to update status for user ${user.username}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !searchQuery ||
      u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A' }}>
            User Directory & Access Governance
          </h2>
          <p style={{ color: '#64748B', fontSize: '0.875rem' }}>
            Manage platform accounts, security roles, and enforce instant account suspension
          </p>
        </div>

        <button onClick={loadUsers} className="btn btn-secondary" disabled={loading}>
          <RefreshCw size={15} />
          <span>Refresh</span>
        </button>
      </div>

      {successMessage && <Alert type="success" message={successMessage} onClose={() => setSuccessMessage(null)} />}
      {error && <Alert type="danger" message={error} onClose={() => setError(null)} />}

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1', minWidth: '240px', position: 'relative' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: '2.25rem' }}
              placeholder="Search by username, full name, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Filter size={16} color="#64748b" />
            <select
              className="form-control"
              style={{ width: 'auto' }}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="ALL">All Roles</option>
              <option value="CUSTOMER">Customer</option>
              <option value="ADMIN">Administrator</option>
              <option value="AUDITOR">Auditor</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Registered System Identities</h3>
            <span className="card-subtitle">Showing {filteredUsers.length} of {users.length} identity/identities</span>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ width: '36px', height: '36px' }} />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-state">
            <Users size={48} className="empty-state-icon" />
            <p>No user records match your search parameters.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Full Name</th>
                  <th>Email Address</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Access Governance</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const isActionLoading = actionLoadingId === u.id;
                  return (
                    <tr key={u.id}>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>#{u.id}</td>
                      <td style={{ fontWeight: 600 }}>@{u.username}</td>
                      <td>{u.fullName || '—'}</td>
                      <td style={{ color: '#64748b' }}>{u.email}</td>
                      <td>
                        <span className={`badge ${u.role === 'ADMIN' ? 'badge-neutral' : u.role === 'AUDITOR' ? 'badge-primary' : 'badge-success'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${u.enabled ? 'badge-success' : 'badge-danger'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          {u.enabled ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          {u.enabled ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => handleToggleUser(u)}
                          className={`btn btn-sm ${u.enabled ? 'btn-secondary' : 'btn-primary'}`}
                          style={{
                            backgroundColor: u.enabled ? '#fff1f2' : '#ecfdf5',
                            color: u.enabled ? '#be123c' : '#047857',
                            borderColor: u.enabled ? '#fecdd3' : '#a7f3d0',
                          }}
                          disabled={isActionLoading}
                        >
                          {isActionLoading ? (
                            <div className="spinner" style={{ width: '12px', height: '12px' }} />
                          ) : u.enabled ? (
                            <>
                              <ToggleRight size={14} />
                              <span>Suspend Access</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft size={14} />
                              <span>Reactivate Access</span>
                            </>
                          )}
                        </button>
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
