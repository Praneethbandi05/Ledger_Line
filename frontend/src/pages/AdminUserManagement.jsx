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
      setUsers(Array.isArray(data) ? data : (data?.content || []));
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
    const newEnabled = !user.enabled;
    // Optimistic update
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, enabled: newEnabled } : u))
    );
    try {
      await adminService.toggleUserStatus(user.id, newEnabled);
      setSuccessMessage(`User @${user.username} has been ${newEnabled ? 'Enabled' : 'Deactivated'}`);
      const data = await adminService.getAllUsers();
      setUsers(Array.isArray(data) ? data : (data?.content || []));
    } catch (err) {
      // Revert on error
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, enabled: user.enabled } : u))
      );
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
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="bv-section-header">
            <span>GOVERNANCE &bull; ACCESS CONTROL</span>
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
            User Directory
          </h1>
          <p style={{ color: '#688073', fontSize: '0.875rem', margin: 0, lineHeight: 1.5 }}>
            Manage platform users, inspect role assignments, and activate or suspend access credentials.
          </p>
        </div>

        <button
          type="button"
          onClick={loadUsers}
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

      {/* Filter Toolbar */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E5EBE5',
          padding: '1rem',
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div style={{ flex: '1', minWidth: '220px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Search by name, username, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.25rem', borderRadius: '8px', border: '1px solid #D9E2DC', fontSize: '0.875rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: '#688073', fontWeight: 600 }}>Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid #D9E2DC', fontSize: '0.8125rem' }}
          >
            <option value="ALL">All Roles ({users.length})</option>
            <option value="CUSTOMER">Account Holders</option>
            <option value="ADMIN">Administrators</option>
            <option value="AUDITOR">Compliance Auditors</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="table-container" style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #E5EBE5', backgroundColor: '#FFFFFF' }}>
        <table className="table" style={{ margin: 0 }}>
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.id}>
                <td>
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
                      }}
                    >
                      {u.fullName?.charAt(0) || u.username?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#0B251C' }}>{u.fullName || u.username}</div>
                      <div style={{ fontSize: '0.75rem', color: '#688073' }}>@{u.username}</div>
                    </div>
                  </div>
                </td>
                <td style={{ fontSize: '0.8125rem', color: '#334155' }}>{u.email}</td>
                <td>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: u.role === 'ADMIN' ? '#FEF3C7' : u.role === 'AUDITOR' ? '#EFF6FF' : '#F1F5F2',
                      color: u.role === 'ADMIN' ? '#92400E' : u.role === 'AUDITOR' ? '#1E40AF' : '#092218',
                    }}
                  >
                    {u.role}
                  </span>
                </td>
                <td>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.5rem',
                      borderRadius: '9999px',
                      backgroundColor: u.enabled ? '#EAF5EE' : '#FEF2F2',
                      color: u.enabled ? '#166534' : '#991B1B',
                    }}
                  >
                    {u.enabled ? 'ACTIVE' : 'SUSPENDED'}
                  </span>
                </td>
                <td style={{ fontSize: '0.8125rem', color: '#688073' }}>
                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Baseline'}
                </td>
                <td style={{ textAlign: 'right' }}>
                  {u.username !== 'admin' && (
                    <button
                      type="button"
                      onClick={() => handleToggleUser(u)}
                      disabled={actionLoadingId === u.id}
                      className="btn btn-secondary btn-sm"
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.3rem 0.75rem',
                        borderRadius: '6px',
                        backgroundColor: '#FFFFFF',
                        color: u.enabled ? '#991B1B' : '#166534',
                        borderColor: u.enabled ? '#FCA5A5' : '#86EFAC',
                      }}
                    >
                      {u.enabled ? 'Deactivate' : 'Activate'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
