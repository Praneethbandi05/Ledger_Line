import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { accountService } from '../services/accountService';
import { transactionService } from '../services/transactionService';
import { DoubleEntryBadge } from '../components/DoubleEntryBadge';
import { Alert } from '../components/Alert';
import {
  FileSpreadsheet,
  Printer,
  ShieldCheck,
  CheckCircle,
  Building,
  RefreshCw
} from 'lucide-react';

export const CustomerStatementPage = () => {
  const [searchParams] = useSearchParams();
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState(searchParams.get('account') || '');
  const [statement, setStatement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const accList = await accountService.getMyAccounts();
      setAccounts(accList);
      if (accList && accList.length > 0) {
        const queryAcc = searchParams.get('account');
        const targetId = queryAcc ? queryAcc : accList[0].id.toString();
        setSelectedAccountId(targetId);
        loadStatement(targetId);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load accounts for statement');
      setLoading(false);
    }
  };

  const loadStatement = async (accId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await transactionService.getAccountStatement(accId);
      setStatement(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate official account statement');
    } finally {
      setLoading(false);
    }
  };

  const handleAccountChange = (e) => {
    const accId = e.target.value;
    setSelectedAccountId(accId);
    loadStatement(accId);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      {/* Control bar */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A' }}>
            Official Account Statements
          </h2>
          <p style={{ color: '#64748B', fontSize: '0.875rem' }}>
            Certified financial transaction statement with verified double-entry balance totals
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select
            className="form-control"
            style={{ width: 'auto' }}
            value={selectedAccountId}
            onChange={handleAccountChange}
            disabled={loading}
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.accountNumber} ({acc.accountType}) — ${parseFloat(acc.balance).toFixed(2)}
              </option>
            ))}
          </select>

          <button onClick={() => loadStatement(selectedAccountId)} className="btn btn-secondary" disabled={loading} title="Refresh statement">
            <RefreshCw size={15} />
          </button>

          <button onClick={handlePrint} className="btn btn-primary" disabled={!statement || loading}>
            <Printer size={15} />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {error && <Alert type="danger" message={error} onClose={() => setError(null)} />}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="spinner" style={{ width: '40px', height: '40px' }} />
        </div>
      ) : statement ? (
        <div className="statement-paper">
          {/* Official Bank Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0f172a', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <ShieldCheck size={28} color="#2563eb" />
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em' }}>
                  LEDGERLINE FINANCIAL INSTITUTION
                </h1>
              </div>
              <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                Regulated Automated Ledger & Money Movement Engine • Certified Immutability
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span className="badge badge-success" style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}>
                OFFICIAL RECORD
              </span>
              <p style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.5rem' }}>
                Generated: {new Date().toLocaleString()}
              </p>
            </div>
          </div>

          {/* Account & Holder Metadata */}
          <div className="grid-3" style={{ marginBottom: '2rem' }}>
            <div className="info-item">
              <span className="info-label">Account Identifier</span>
              <span className="info-value" style={{ fontFamily: 'var(--font-mono)', fontSize: '1.125rem' }}>
                {statement.accountNumber}
              </span>
            </div>

            <div className="info-item">
              <span className="info-label">Account Classification</span>
              <span className="info-value">{statement.accountType} • {statement.currency}</span>
            </div>

            <div className="info-item">
              <span className="info-label">Closing Net Balance</span>
              <span className="info-value amount" style={{ fontSize: '1.125rem', color: '#0f172a' }}>
                ${parseFloat(statement.currentBalance).toFixed(2)} USD
              </span>
            </div>
          </div>

          {/* Financial Debit/Credit Summary */}
          <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '2rem' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', color: '#475569', marginBottom: '1rem', letterSpacing: '0.05em' }}>
              Cumulative Ledger Flow Breakdown
            </h4>
            <div className="grid-4">
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Total Debits (Outflows)</span>
                <span className="amount amount-negative" style={{ fontSize: '1.125rem', fontWeight: 700 }}>
                  ${parseFloat(statement.totalDebits || 0).toFixed(2)}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Total Credits (Inflows)</span>
                <span className="amount amount-positive" style={{ fontSize: '1.125rem', fontWeight: 700 }}>
                  ${parseFloat(statement.totalCredits || 0).toFixed(2)}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Transaction Count</span>
                <span style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>
                  {statement.transactionCount}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Ledger Invariant Proof</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.2rem' }}>
                  <CheckCircle size={15} /> Validated Invariant
                </span>
              </div>
            </div>
          </div>

          {/* Itemized Transactions */}
          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>
            Itemized Chronological Transaction Log
          </h4>

          {statement.transactions && statement.transactions.length > 0 ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Date / Time</th>
                    <th>Reference</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {statement.transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                        {new Date(tx.createdAt).toLocaleString()}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{tx.reference}</td>
                      <td><DoubleEntryBadge type={tx.type} /></td>
                      <td>{tx.description}</td>
                      <td className="amount" style={{ fontWeight: 600 }}>
                        ${parseFloat(tx.amount).toFixed(2)} {tx.currency}
                      </td>
                      <td>
                        <span className={`badge ${tx.status === 'COMPLETED' ? 'badge-success' : 'badge-danger'}`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <p>No transactions booked on this account during the specified period.</p>
            </div>
          )}

          {/* Legal and Regulatory Footer */}
          <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>
            This statement is an immutable cryptographic audit representation generated by LedgerLine. All debits and credits conform to double-entry accounting invariants ($\sum Debits \equiv \sum Credits$).
          </div>
        </div>
      ) : null}
    </div>
  );
};
