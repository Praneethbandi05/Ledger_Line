import React, { useState, useEffect } from 'react';
import { transactionService } from '../services/transactionService';
import { Alert } from '../components/Alert';
import {
  Scale,
  Search,
  Filter,
  CheckCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

export const AuditorLedgerExplorer = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  useEffect(() => {
    loadLedgerEntries();
  }, []);

  const loadLedgerEntries = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await transactionService.getAllLedgerEntries();
      setEntries(Array.isArray(data) ? data : (data?.content || []));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve raw double-entry ledger journal');
    } finally {
      setLoading(false);
    }
  };

  const totalDebits = entries
    .filter((e) => e.entryType === 'DEBIT')
    .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

  const totalCredits = entries
    .filter((e) => e.entryType === 'CREDIT')
    .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

  const difference = Math.abs(totalDebits - totalCredits);
  const isBalanced = entries.length > 0 && difference < 0.0001;

  const filteredEntries = entries.filter((e) => {
    const matchesSearch =
      !searchQuery ||
      e.transactionReference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.accountNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === 'ALL' || e.entryType === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="bv-section-header">
            <span>COMPLIANCE &bull; GENERAL LEDGER JOURNAL</span>
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
            Double-Entry Ledger Journal
          </h1>
          <p style={{ color: '#688073', fontSize: '0.875rem', margin: 0, lineHeight: 1.5 }}>
            Mathematical verification of double-entry equality. Every transaction produces matching debits and credits.
          </p>
        </div>

        <button
          type="button"
          onClick={loadLedgerEntries}
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

      {/* Mathematical Proof Card */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E5EBE5',
          padding: '1.75rem',
          marginBottom: '2rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.5rem',
        }}
      >
        <div>
          <div style={{ fontSize: '0.75rem', color: '#688073', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
            Total Debits (Dr)
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#092218', fontFamily: "'Newsreader', serif" }}>
            ${totalDebits.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#688073' }}>
            {entries.filter((e) => e.entryType === 'DEBIT').length} debit postings
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', color: '#688073', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
            Total Credits (Cr)
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#092218', fontFamily: "'Newsreader', serif" }}>
            ${totalCredits.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#688073' }}>
            {entries.filter((e) => e.entryType === 'CREDIT').length} credit postings
          </div>
        </div>

        <div style={{ borderLeft: '1px solid #E5EBE5', paddingLeft: '1.5rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#688073', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
            Mathematical Proof Status
          </div>
          <div style={{ fontSize: '1.125rem', fontWeight: 700, color: isBalanced ? '#166534' : '#D97706', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.25rem 0' }}>
            <CheckCircle size={18} />
            <span>{isBalanced ? 'Σ Debits ≡ Σ Credits' : 'Ledger Invariant In Progress'}</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#688073' }}>
            Imbalance delta: ${difference.toFixed(4)}
          </div>
        </div>
      </div>

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
            placeholder="Search by transaction reference or account..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.25rem', borderRadius: '8px', border: '1px solid #D9E2DC', fontSize: '0.875rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: '#688073', fontWeight: 600 }}>Entry Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid #D9E2DC', fontSize: '0.8125rem' }}
          >
            <option value="ALL">All Entries ({entries.length})</option>
            <option value="DEBIT">Debits Only</option>
            <option value="CREDIT">Credits Only</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="spinner" style={{ width: '36px', height: '36px' }} />
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="bv-empty-box">
          <div className="bv-empty-icon">
            <Sparkles size={24} />
          </div>
          <div className="bv-empty-title">No ledger entries recorded</div>
          <p className="bv-empty-desc">
            Ledger entries will generate automatically upon every financial transaction.
          </p>
        </div>
      ) : (
        <div className="table-container" style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #E5EBE5', backgroundColor: '#FFFFFF' }}>
          <table className="table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Tx Reference</th>
                <th>Account Affected</th>
                <th>Type</th>
                <th style={{ textAlign: 'right' }}>Debit Amount</th>
                <th style={{ textAlign: 'right' }}>Credit Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((e) => (
                <tr key={e.id}>
                  <td style={{ fontSize: '0.8125rem', color: '#64748B' }}>
                    {new Date(e.createdAt).toLocaleString()}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', fontWeight: 600 }}>
                    {e.transactionReference}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>
                    {e.accountNumber}
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        backgroundColor: e.entryType === 'DEBIT' ? '#FEF2F2' : '#EAF5EE',
                        color: e.entryType === 'DEBIT' ? '#991B1B' : '#166534',
                      }}
                    >
                      {e.entryType}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600, color: e.entryType === 'DEBIT' ? '#991B1B' : '#94A3B8' }}>
                    {e.entryType === 'DEBIT' ? `$${parseFloat(e.amount).toFixed(2)}` : '—'}
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600, color: e.entryType === 'CREDIT' ? '#166534' : '#94A3B8' }}>
                    {e.entryType === 'CREDIT' ? `$${parseFloat(e.amount).toFixed(2)}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
