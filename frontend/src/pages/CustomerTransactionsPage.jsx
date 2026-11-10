import React, { useState, useEffect } from 'react';
import { transactionService } from '../services/transactionService';
import { DoubleEntryBadge } from '../components/DoubleEntryBadge';
import { Alert } from '../components/Alert';
import {
  Receipt,
  Search,
  Filter,
  RefreshCw,
  Sparkles
} from 'lucide-react';

export const CustomerTransactionsPage = () => {
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
      const data = await transactionService.getMyTransactions();
      setTransactions(Array.isArray(data) ? data : (data?.content || []));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve transaction records');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedTxId(expandedTxId === id ? null : id);
  };

  const filteredTransactions = transactions.filter((tx) => {
    const matchesQuery =
      !searchQuery ||
      tx.reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.sourceAccount?.accountNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.destinationAccount?.accountNumber?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === 'ALL' || tx.transactionType === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || tx.status === statusFilter;

    return matchesQuery && matchesType && matchesStatus;
  });

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="bv-section-header">
            <span>AUDITABLE LEDGER &bull; ACTIVITY</span>
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
            Transaction Activity & Ledger
          </h1>
          <p style={{ color: '#688073', fontSize: '0.875rem', margin: 0, lineHeight: 1.5 }}>
            Complete immutable journal of all authorized money movement operations, verified by balanced double-entry accounting.
          </p>
        </div>

        <button
          type="button"
          onClick={loadTransactions}
          className="btn btn-secondary btn-sm"
          disabled={loading}
          style={{ backgroundColor: '#FFFFFF', borderColor: '#CCD8CC', color: '#0B251C' }}
        >
          <RefreshCw size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div style={{ marginBottom: '1.5rem' }}>
          <Alert type="danger" message={error} onClose={() => setError(null)} />
        </div>
      )}

      {/* Filter Toolbar */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          border: '1px solid #E5EBE5',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Search by reference, description or account..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem 0.5rem 2.25rem',
              borderRadius: '8px',
              border: '1px solid #D9E2DC',
              fontSize: '0.875rem',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: '#688073', fontWeight: 600 }}>Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid #D9E2DC', fontSize: '0.8125rem' }}
          >
            <option value="ALL">All Operations</option>
            <option value="DEPOSIT">Deposits</option>
            <option value="WITHDRAWAL">Withdrawals</option>
            <option value="TRANSFER">Transfers</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: '#688073', fontWeight: 600 }}>Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid #D9E2DC', fontSize: '0.8125rem' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="spinner" style={{ width: '36px', height: '36px' }} />
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="bv-empty-box">
          <div className="bv-empty-icon">
            <Sparkles size={24} />
          </div>
          <div className="bv-empty-title">No transactions found</div>
          <p className="bv-empty-desc">
            {transactions.length === 0
              ? 'No financial operations have been recorded for your accounts yet.'
              : 'No transactions match your search filter criteria.'}
          </p>
        </div>
      ) : (
        <div className="table-container" style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #E5EBE5', backgroundColor: '#FFFFFF' }}>
          <table className="table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Reference</th>
                <th>Type</th>
                <th>Description</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx) => (
                <React.Fragment key={tx.id}>
                  <tr>
                    <td style={{ fontSize: '0.8125rem', color: '#667085' }}>
                      {new Date(tx.createdAt).toLocaleString()}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', fontWeight: 600 }}>
                      {tx.reference}
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px',
                          backgroundColor: tx.transactionType === 'DEPOSIT' ? '#EAF5EE' : tx.transactionType === 'WITHDRAWAL' ? '#FEF3C7' : '#EFF6FF',
                          color: tx.transactionType === 'DEPOSIT' ? '#166534' : tx.transactionType === 'WITHDRAWAL' ? '#92400E' : '#1E40AF',
                        }}
                      >
                        {tx.transactionType}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: '#334155' }}>
                      {tx.description}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, fontSize: '0.875rem', color: tx.transactionType === 'DEPOSIT' ? '#166534' : '#0B251C' }}>
                      {tx.transactionType === 'DEPOSIT' ? '+' : '-'}${parseFloat(tx.amount || 0).toFixed(2)}
                    </td>
                    <td>
                      <span className="badge badge-success">{tx.status}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => toggleExpand(tx.id)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', backgroundColor: '#F8FAF8' }}
                      >
                        {expandedTxId === tx.id ? 'Hide' : 'Inspect'}
                      </button>
                    </td>
                  </tr>
                  {expandedTxId === tx.id && (
                    <tr>
                      <td colSpan={7} style={{ backgroundColor: '#F8FAF8', padding: '1.25rem 1.5rem' }}>
                        <DoubleEntryBadge transaction={tx} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
