import React, { useState, useEffect } from 'react';
import { auditService } from '../services/auditService';
import { Alert } from '../components/Alert';
import {
  Terminal,
  Search,
  Filter,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Globe
} from 'lucide-react';

export const AuditorAuditLogViewer = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [resultFilter, setResultFilter] = useState('ALL');

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await auditService.getAllLogs();
      setLogs(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve append-only audit trail logs');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      !searchQuery ||
      log.actorUsername?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resourceId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.ipAddress?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
    const matchesResult = resultFilter === 'ALL' || log.result === resultFilter;

    return matchesSearch && matchesAction && matchesResult;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A' }}>
            Append-Only Immutable Audit Trail
          </h2>
          <p style={{ color: '#64748B', fontSize: '0.875rem' }}>
            Comprehensive traceability of administrative, financial, and security events
          </p>
        </div>

        <button onClick={loadAuditLogs} className="btn btn-secondary" disabled={loading}>
          <RefreshCw size={15} />
          <span>Refresh Trail</span>
        </button>
      </div>

      {error && <Alert type="danger" message={error} onClose={() => setError(null)} />}

      {/* Security Immutability Notice Banner */}
      <div style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Lock size={20} color="#059669" />
        <div style={{ fontSize: '0.8125rem', color: '#334155' }}>
          <strong>Append-Only Integrity Guarantee:</strong> Audit log rows are marked `@Immutable` at the persistence layer. Any attempt to update, alter, or delete historical records is programmatically and database-enforced rejected with <code>UnsupportedOperationException</code>. Sensitive credentials (passwords, JWT secrets) are sanitized prior to ingestion.
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1', minWidth: '240px', position: 'relative' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: '2.25rem' }}
              placeholder="Search actor, target resource, IP, narrative details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Filter size={16} color="#64748b" />
            <select
              className="form-control"
              style={{ width: 'auto' }}
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              <option value="ALL">All Actions</option>
              <option value="DEPOSIT">DEPOSIT</option>
              <option value="WITHDRAWAL">WITHDRAWAL</option>
              <option value="WITHDRAWAL_FAILED">WITHDRAWAL_FAILED</option>
              <option value="TRANSFER">TRANSFER</option>
              <option value="TRANSFER_FAILED">TRANSFER_FAILED</option>
              <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
              <option value="LOGIN_FAILED">LOGIN_FAILED</option>
              <option value="USER_CREATED">USER_CREATED</option>
            </select>

            <select
              className="form-control"
              style={{ width: 'auto' }}
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value)}
            >
              <option value="ALL">All Results</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="REJECTED">REJECTED</option>
              <option value="FAILURE">FAILURE</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Event Log Entries</h3>
            <span className="card-subtitle">Showing {filteredLogs.length} of {logs.length} audited event(s)</span>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ width: '36px', height: '36px' }} />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="empty-state">
            <Terminal size={48} className="empty-state-icon" />
            <p>No audit trail logs match your search filters.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Log ID</th>
                  <th>Timestamp</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Resource Target</th>
                  <th>Operation Result</th>
                  <th>Client IP</th>
                  <th>Sanitized Audit Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => {
                  const isSuccess = log.result === 'SUCCESS';
                  const isRejected = log.result === 'REJECTED';
                  return (
                    <tr key={log.id}>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>#{log.id}</td>
                      <td style={{ fontSize: '0.8125rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td>
                        <strong>@{log.actorUsername}</strong>{' '}
                        <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>({log.actorRole})</span>
                      </td>
                      <td>
                        <span className="badge badge-neutral" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem' }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>
                        {log.resourceId ? (
                          <span>
                            {log.resourceType}: {log.resourceId}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        <span className={`badge ${isSuccess ? 'badge-success' : isRejected ? 'badge-warning' : 'badge-danger'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          {isSuccess ? <CheckCircle2 size={12} /> : isRejected ? <AlertTriangle size={12} /> : <XCircle size={12} />}
                          {log.result}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#64748b' }}>
                        {log.ipAddress || '127.0.0.1'}
                      </td>
                      <td style={{ fontSize: '0.8125rem', color: '#334155' }}>
                        {log.details || '—'}
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
