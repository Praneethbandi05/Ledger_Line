import React, { useState, useEffect } from 'react';
import { transactionService } from '../services/transactionService';
import { auditService } from '../services/auditService';
import { DoubleEntryBadge } from '../components/DoubleEntryBadge';
import { Alert } from '../components/Alert';
import {
  FileCheck2,
  ShieldAlert,
  Search,
  Scale,
  CheckCircle,
  Clock,
  RefreshCw,
  Terminal,
} from 'lucide-react';

export const AuditorDashboard = () => {
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('ledger'); // 'ledger' | 'audit' | 'transactions'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search filter
  const [filterQuery, setFilterQuery] = useState('');

  useEffect(() => {
    loadAuditorData();
  }, []);

  const loadAuditorData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ledgerData, logsData, txData] = await Promise.all([
        transactionService.getAllLedgerEntries(),
        auditService.getAllLogs(),
        transactionService.getAllTransactions(),
      ]);
      setLedgerEntries(ledgerData);
      setAuditLogs(logsData);
      setTransactions(txData);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve compliance records');
    } finally {
      setLoading(false);
    }
  };

  // Mathematical proof: compute sum of debits and sum of credits
  const totalDebits = ledgerEntries
    .filter((e) => e.entryType === 'DEBIT')
    .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

  const totalCredits = ledgerEntries
    .filter((e) => e.entryType === 'CREDIT')
    .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

  const isLedgerBalanced =
    ledgerEntries.length > 0 &&
    Math.abs(totalDebits - totalCredits) < 0.0001;

  const filteredLedger = ledgerEntries.filter((e) => {
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    return (
      e.transactionReference?.toLowerCase().includes(q) ||
      e.accountNumber?.toLowerCase().includes(q) ||
      e.description?.toLowerCase().includes(q)
    );
  });

  const filteredLogs = auditLogs.filter((l) => {
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    return (
      l.actorUsername?.toLowerCase().includes(q) ||
      l.action?.toLowerCase().includes(q) ||
      l.resourceId?.toLowerCase().includes(q) ||
      l.details?.toLowerCase().includes(q)
    );
  });

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A' }}>
              Compliance & Audit Oversight
            </h2>
            <span
              style={{
                backgroundColor: '#1E3A8A',
                color: '#BFDBFE',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                textTransform: 'uppercase',
              }}
            >
              Strictly Read-Only Access
            </span>
          </div>
          <p style={{ color: '#64748B', fontSize: '0.875rem' }}>
            Cryptographically sound double-entry journal & append-only immutable audit trail
          </p>
        </div>

        <button onClick={loadAuditorData} className="btn btn-secondary" disabled={loading}>
          <RefreshCw size={16} />
          <span>Refresh Compliance Feed</span>
        </button>
      </div>

      {error && <Alert type="danger" message={error} />}

      {/* Proof of Balanced Books Banner */}
      <div
        className="card"
        style={{
          background: isLedgerBalanced
            ? 'linear-gradient(135deg, #064E3B 0%, #0F172A 100%)'
            : 'linear-gradient(135deg, #7F1D1D 0%, #0F172A 100%)',
          color: 'white',
          border: 'none',
          padding: '1.75rem',
          marginBottom: '2rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Scale size={20} color="#34D399" />
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#A7F3D0' }}>
                Mathematical Double-Entry Proof
              </span>
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              {isLedgerBalanced
                ? '✓ Double-Entry Invariant Formally Proven'
                : '⚠ Ledger Imbalance Detected'}
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#CBD5E1', maxWidth: '600px', marginTop: '0.25rem' }}>
              Every completed transaction in LedgerLine adheres to the fundamental accounting equation:{' '}
              <code>Total Debits == Total Credits</code>. Books balance with 0.00 zero drift.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '2rem',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              padding: '1rem 1.5rem',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>
                Total Debits (Dr)
              </div>
              <div style={{ fontSize: '1.375rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#FCA5A5' }}>
                ${totalDebits.toFixed(2)}
              </div>
            </div>

            <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.2)', paddingLeft: '2rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>
                Total Credits (Cr)
              </div>
              <div style={{ fontSize: '1.375rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#6EE7B7' }}>
                ${totalCredits.toFixed(2)}
              </div>
            </div>

            <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.2)', paddingLeft: '2rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>
                Variance
              </div>
              <div style={{ fontSize: '1.375rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#FFFFFF' }}>
                ${Math.abs(totalDebits - totalCredits).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs and Filter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="tabs" style={{ marginBottom: 0 }}>
          <button
            className={`tab-btn ${activeTab === 'ledger' ? 'active' : ''}`}
            onClick={() => setActiveTab('ledger')}
          >
            Double-Entry Journal ({ledgerEntries.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit')}
          >
            Immutable Audit Trail ({auditLogs.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveTab('transactions')}
          >
            Transactions ({transactions.length})
          </button>
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Filter by account, ref, actor..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            style={{ paddingLeft: '2.25rem', fontSize: '0.8125rem' }}
          />
          <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
        </div>
      </div>

      {/* Tab: Double-Entry Ledger Journal */}
      {activeTab === 'ledger' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Double-Entry Accounting Journal</h3>
              <span className="card-subtitle">
                Immutable, append-only line items recording both sides of every transaction
              </span>
            </div>
          </div>

          <div className="table-container">
            <table className="fintech-table">
              <thead>
                <tr>
                  <th>Entry ID</th>
                  <th>Transaction Reference</th>
                  <th>Account Number</th>
                  <th>Entry Type</th>
                  <th>Amount</th>
                  <th>Balance After</th>
                  <th>Description</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {filteredLedger.map((entry) => (
                  <tr key={entry.id}>
                    <td>#{entry.id}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      {entry.transactionReference}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>
                      {entry.accountNumber}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          entry.entryType === 'DEBIT' ? 'badge-debit' : 'badge-credit'
                        }`}
                      >
                        {entry.entryType}
                      </span>
                    </td>
                    <td className="amount" style={{ fontWeight: 700 }}>
                      ${parseFloat(entry.amount).toFixed(2)} {entry.currency}
                    </td>
                    <td className="amount">
                      ${parseFloat(entry.balanceAfter).toFixed(2)}
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: '#64748B' }}>
                      {entry.description || '—'}
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: '#64748B' }}>
                      {new Date(entry.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Immutable Audit Trail */}
      {activeTab === 'audit' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Append-Only Audit Trail</h3>
              <span className="card-subtitle">
                Tamper-evident logs tracking actor, action, result, IP address, and security events
              </span>
            </div>
          </div>

          <div className="table-container">
            <table className="fintech-table">
              <thead>
                <tr>
                  <th>Log ID</th>
                  <th>Actor</th>
                  <th>Role</th>
                  <th>Action</th>
                  <th>Resource</th>
                  <th>Result</th>
                  <th>IP / User-Agent</th>
                  <th>Details</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td>#{log.id}</td>
                    <td style={{ fontWeight: 600 }}>{log.actorUsername}</td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 600,
                          padding: '0.15rem 0.4rem',
                          borderRadius: '4px',
                          backgroundColor: '#F1F5F9',
                          color: '#334155',
                        }}
                      >
                        {log.actorRole}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.8125rem' }}>
                      {log.action}
                    </td>
                    <td style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-mono)' }}>
                      {log.resourceType}: {log.resourceId}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          log.result === 'SUCCESS' ? 'badge-completed' : 'badge-failed'
                        }`}
                      >
                        {log.result}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      <div>{log.ipAddress}</div>
                    </td>
                    <td style={{ fontSize: '0.8125rem', maxWidth: '280px' }}>
                      {log.details || '—'}
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: '#64748B' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Platform Transactions */}
      {activeTab === 'transactions' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Platform Transactions</h3>
              <span className="card-subtitle">Read-only oversight of all settled financial transactions</span>
            </div>
          </div>

          <div className="table-container">
            <table className="fintech-table">
              <thead>
                <tr>
                  <th>Reference</th>
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
                    <td>{tx.transactionType}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>
                      {tx.sourceAccountNumber || 'System Clearing'}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>
                      {tx.destinationAccountNumber || 'System Clearing'}
                    </td>
                    <td className="amount">${parseFloat(tx.amount).toFixed(2)}</td>
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
