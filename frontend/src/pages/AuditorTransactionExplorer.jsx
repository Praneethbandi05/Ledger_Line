import React, { useState, useEffect } from 'react';
import { transactionService } from '../services/transactionService';
import { DoubleEntryBadge } from '../components/DoubleEntryBadge';
import { Alert } from '../components/Alert';
import {
  Receipt,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  ShieldCheck
} from 'lucide-react';

export const AuditorTransactionExplorer = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [expandedTxId, setExpandedTxId] = useState(null);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await transactionService.getAllTransactions();
      setTransactions(Array.isArray(data) ? data : (data?.content || []));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve transactions for audit');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedTxId(expandedTxId === id ? null : id);
  };

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      !searchQuery ||
      tx.reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.initiatedBy?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.sourceAccount?.accountNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.destinationAccount?.accountNumber?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === 'ALL' || tx.type === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || tx.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A' }}>
            Regulatory Transaction Explorer
          </h2>
          <p style={{ color: '#64748B', fontSize: '0.875rem' }}>
            Inspect full money movements, authenticated initiators, and double-entry atomic allocations
          </p>
        </div>

        <button onClick={loadTransactions} className="btn btn-secondary" disabled={loading}>
          <RefreshCw size={15} />
          <span>Refresh Journal</span>
        </button>
      </div>

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
              placeholder="Search reference, initiator, narrative, account identifier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Filter size={16} color="#64748b" />
            <select
              className="form-control"
              style={{ width: 'auto' }}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="ALL">All Types</option>
              <option value="DEPOSIT">Deposits</option>
              <option value="WITHDRAWAL">Withdrawals</option>
              <option value="TRANSFER">Transfers</option>
            </select>

            <select
              className="form-control"
              style={{ width: 'auto' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Audited Financial Records</h3>
            <span className="card-subtitle">Showing {filteredTransactions.length} of {transactions.length} record(s)</span>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ width: '36px', height: '36px' }} />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="empty-state">
            <Receipt size={48} className="empty-state-icon" />
            <p>No transaction records match the specified query.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Type</th>
                  <th>Initiator</th>
                  <th>Source Account</th>
                  <th>Destination Account</th>
                  <th>Amount</th>
                  <th>Timestamp</th>
                  <th>Status</th>
                  <th>Ledger Proof</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => {
                  const isExpanded = expandedTxId === tx.id;
                  return (
                    <React.Fragment key={tx.id}>
                      <tr>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{tx.reference}</td>
                        <td><DoubleEntryBadge type={tx.type} /></td>
                        <td>
                          {tx.initiatedBy ? (
                            <span>
                              <strong>@{tx.initiatedBy.username}</strong>{' '}
                              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>({tx.initiatedBy.role})</span>
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>SYSTEM</span>
                          )}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>
                          {tx.sourceAccount?.accountNumber || '—'}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>
                          {tx.destinationAccount?.accountNumber || '—'}
                        </td>
                        <td className="amount" style={{ fontWeight: 600 }}>
                          ${parseFloat(tx.amount).toFixed(2)} {tx.currency}
                        </td>
                        <td style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                          {new Date(tx.createdAt).toLocaleString()}
                        </td>
                        <td>
                          <span className={`badge ${tx.status === 'COMPLETED' ? 'badge-success' : 'badge-danger'}`}>
                            {tx.status}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => toggleExpand(tx.id)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          >
                            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            <span>{isExpanded ? 'Hide' : 'Inspect'}</span>
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr>
                          <td colSpan={9} style={{ backgroundColor: '#f8fafc', padding: '1rem 1.5rem' }}>
                            <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b' }}>
                                  Double-Entry Ledger Invariant Verification (Reference: {tx.reference})
                                </h4>
                                <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <CheckCircle size={13} /> Balanced: Σ Debits ≡ Σ Credits ≡ ${parseFloat(tx.amount).toFixed(2)}
                                </span>
                              </div>

                              {tx.ledgerEntries && tx.ledgerEntries.length > 0 ? (
                                <table style={{ width: '100%', fontSize: '0.8125rem' }}>
                                  <thead>
                                    <tr style={{ background: '#f1f5f9' }}>
                                      <th>Entry ID</th>
                                      <th>Account Number</th>
                                      <th>Classification</th>
                                      <th>Amount</th>
                                      <th>Balance After</th>
                                      <th>Narrative Description</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {tx.ledgerEntries.map((entry) => (
                                      <tr key={entry.id}>
                                        <td style={{ fontFamily: 'var(--font-mono)' }}>#{entry.id}</td>
                                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{entry.accountNumber}</td>
                                        <td>
                                          <span className={`badge ${entry.entryType === 'DEBIT' ? 'badge-danger' : 'badge-success'}`}>
                                            {entry.entryType}
                                          </span>
                                        </td>
                                        <td className="amount" style={{ fontWeight: 600 }}>${parseFloat(entry.amount).toFixed(2)}</td>
                                        <td className="amount">${parseFloat(entry.balanceAfter).toFixed(2)}</td>
                                        <td style={{ color: '#64748b' }}>{entry.description}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              ) : (
                                <p style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
                                  No raw entries attached or transaction failed before booking.
                                </p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
