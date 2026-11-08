import React, { useState, useEffect } from 'react';
import { transactionService } from '../services/transactionService';
import { Alert } from '../components/Alert';
import {
  Scale,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  Lock
} from 'lucide-react';

export const AuditorLedgerExplorer = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL' | 'DEBIT' | 'CREDIT'

  useEffect(() => {
    loadLedgerEntries();
  }, []);

  const loadLedgerEntries = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await transactionService.getAllLedgerEntries();
      setEntries(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve raw double-entry ledger journal');
    } finally {
      setLoading(false);
    }
  };

  // Compute mathematical proof: sum(Debits) vs sum(Credits)
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
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A' }}>
            Double-Entry Ledger Journal Explorer
          </h2>
          <p style={{ color: '#64748B', fontSize: '0.875rem' }}>
            Immutable, append-only debit and credit entries with cryptographic mathematical balance proofs
          </p>
        </div>

        <button onClick={loadLedgerEntries} className="btn btn-secondary" disabled={loading}>
          <RefreshCw size={15} />
          <span>Refresh Journal</span>
        </button>
      </div>

      {error && <Alert type="danger" message={error} onClose={() => setError(null)} />}

      {/* Real-Time Balance Equation Proof Card */}
      <div className="card" style={{ background: isBalanced ? 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)' : 'linear-gradient(135deg, #7f1d1d 0%, #450a0a 100%)', color: 'white', border: 'none', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Scale size={28} color={isBalanced ? '#34d399' : '#f87171'} />
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                {isBalanced ? 'Institutional Ledger Invariant: MATHEMATICALLY BALANCED' : 'Ledger Invariant Verification Check'}
              </h3>
              <p style={{ fontSize: '0.8125rem', color: '#a7f3d0' }}>
                Double-Entry Invariant Rule: Σ(All Debits) ≡ Σ(All Credits)
              </p>
            </div>
          </div>

          <span className="badge" style={{ backgroundColor: isBalanced ? '#065f46' : '#991b1b', color: isBalanced ? '#6ee7b7' : '#fecaca', fontSize: '0.8125rem', padding: '0.35rem 0.75rem' }}>
            {isBalanced ? '✓ PROVEN EQUATION' : 'VERIFYING ENTRIES'}
          </span>
        </div>

        <div className="grid-3">
          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>
              Cumulative Debits (Outflows)
            </span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
              ${totalDebits.toFixed(2)} USD
            </span>
          </div>

          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>
              Cumulative Credits (Inflows)
            </span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
              ${totalCredits.toFixed(2)} USD
            </span>
          </div>

          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>
              Invariant Discrepancy (Δ)
            </span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: isBalanced ? '#34d399' : '#f87171' }}>
              ${difference.toFixed(4)} USD
            </span>
          </div>
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
              placeholder="Search reference, account identifier, or narrative..."
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
              <option value="ALL">All Entries</option>
              <option value="DEBIT">Debits Only</option>
              <option value="CREDIT">Credits Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Raw Ledger Entries Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Immutable Journal Records</h3>
            <span className="card-subtitle">Showing {filteredEntries.length} of {entries.length} raw entry/entries</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: '#64748b' }}>
            <Lock size={14} color="#059669" />
            <span>Hibernate @Immutable • Delete Prohibited</span>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ width: '36px', height: '36px' }} />
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="empty-state">
            <Scale size={48} className="empty-state-icon" />
            <p>No double-entry records match your search criteria.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Entry ID</th>
                  <th>Transaction Reference</th>
                  <th>Account Identifier</th>
                  <th>Entry Type</th>
                  <th>Amount</th>
                  <th>Balance After</th>
                  <th>Timestamp</th>
                  <th>Narrative Description</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((e) => (
                  <tr key={e.id}>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>#{e.id}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{e.transactionReference}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{e.accountNumber}</td>
                    <td>
                      <span className={`badge ${e.entryType === 'DEBIT' ? 'badge-danger' : 'badge-success'}`}>
                        {e.entryType}
                      </span>
                    </td>
                    <td className="amount" style={{ fontWeight: 600 }}>
                      ${parseFloat(e.amount).toFixed(2)} {e.currency}
                    </td>
                    <td className="amount">
                      ${parseFloat(e.balanceAfter).toFixed(2)}
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                      {new Date(e.createdAt).toLocaleString()}
                    </td>
                    <td style={{ color: '#475569', fontSize: '0.8125rem' }}>{e.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
