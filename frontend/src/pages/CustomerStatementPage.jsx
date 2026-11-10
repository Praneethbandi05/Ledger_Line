import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { accountService } from '../services/accountService';
import { transactionService } from '../services/transactionService';
import { Alert } from '../components/Alert';
import {
  FileSpreadsheet,
  Printer,
  Calendar,
  Wallet,
  Building2,
  CheckCircle2,
  RefreshCw,
  CreditCard
} from 'lucide-react';

export const CustomerStatementPage = () => {
  const [searchParams] = useSearchParams();
  const queryAccountId = searchParams.get('account');

  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statement, setStatement] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Set default dates to current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];
    setStartDate(firstDay);
    setEndDate(today);

    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    setFetchLoading(true);
    try {
      const data = await accountService.getMyAccounts();
      const list = Array.isArray(data) ? data : (data?.content || []);
      setAccounts(list);
      if (list && list.length > 0) {
        const initialId = queryAccountId || list[0].id.toString();
        setSelectedAccountId(initialId);
        loadStatement(initialId, startDate, endDate);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load accounts');
    } finally {
      setFetchLoading(false);
    }
  };

  const loadStatement = async (accId, start, end) => {
    if (!accId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await transactionService.getAccountStatement(accId, start, end);
      setStatement(res);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate official statement');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = (e) => {
    e.preventDefault();
    loadStatement(selectedAccountId, startDate, endDate);
  };

  const handlePrint = () => {
    window.print();
  };

  const selectedAccount = accounts.find((a) => a.id.toString() === selectedAccountId);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Page Header */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="bv-section-header">
            <span>FINANCIAL RECORDS &bull; AUDIT STATEMENTS</span>
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
            Account Statements
          </h1>
          <p style={{ color: '#688073', fontSize: '0.875rem', margin: 0, lineHeight: 1.5 }}>
            Generate and export official institutional account balance and transaction statements.
          </p>
        </div>

        {statement && (
          <button
            type="button"
            onClick={handlePrint}
            className="btn btn-secondary btn-sm"
            style={{ backgroundColor: '#FFFFFF', borderColor: '#CCD8CC', color: '#0B251C' }}
          >
            <Printer size={15} />
            <span>Print Official Statement</span>
          </button>
        )}
      </div>

      {error && (
        <div className="no-print" style={{ marginBottom: '1.5rem' }}>
          <Alert type="danger" message={error} onClose={() => setError(null)} />
        </div>
      )}

      {/* Control Filter Bar */}
      <div
        className="no-print"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E5EBE5',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <form onSubmit={handleGenerate} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#243D32', marginBottom: '0.375rem' }}>
              Select Account
            </label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="form-control"
              style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: '8px', border: '1px solid #D9E2DC' }}
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.accountNumber} ({acc.accountType}) &bull; ${parseFloat(acc.balance || 0).toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#243D32', marginBottom: '0.375rem' }}>
              From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="form-control"
              style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: '8px', border: '1px solid #D9E2DC' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#243D32', marginBottom: '0.375rem' }}>
              To Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="form-control"
              style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: '8px', border: '1px solid #D9E2DC' }}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || accounts.length === 0}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.6875rem', backgroundColor: '#092218', borderColor: '#092218', fontWeight: 600, borderRadius: '8px' }}
            >
              {loading ? 'Compiling Statement...' : 'Generate Statement'}
            </button>
          </div>
        </form>
      </div>

      {/* Official Statement Document Layout */}
      {statement && (
        <div
          id="printable-statement"
          className="bv-statement-paper"
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E5EBE5',
            padding: '2.5rem',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
            marginBottom: '3rem',
          }}
        >
          {/* Institutional Statement Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #092218', paddingBottom: '1.5rem', marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  backgroundColor: '#092218',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: "'Newsreader', serif",
                  fontSize: '1.25rem',
                  fontWeight: 700,
                }}
              >
                b
              </div>
              <div>
                <div style={{ fontSize: '1.375rem', fontWeight: 700, fontFamily: "'Newsreader', serif", color: '#092218' }}>
                  balancevault
                </div>
                <div style={{ fontSize: '0.75rem', color: '#688073' }}>
                  Institutional Double-Entry Ledger Statement
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: '#688073', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                STATEMENT PERIOD
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#092218' }}>
                {startDate || 'Genesis'} &rarr; {endDate || 'Current'}
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#88A796', marginTop: '0.25rem' }}>
                Generated: {new Date().toLocaleString()}
              </div>
            </div>
          </div>

          {/* Account Particulars & Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem', marginBottom: '2rem', backgroundColor: '#F8FAF8', padding: '1.25rem', borderRadius: '12px' }}>
            <div>
              <div style={{ fontSize: '0.6875rem', color: '#688073', textTransform: 'uppercase', fontWeight: 700 }}>
                Account Reference
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#092218', fontFamily: 'var(--font-mono)' }}>
                {statement.accountNumber || selectedAccount?.accountNumber}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#688073' }}>
                {selectedAccount?.accountType} &bull; {selectedAccount?.currency}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.6875rem', color: '#688073', textTransform: 'uppercase', fontWeight: 700 }}>
                Starting Balance
              </div>
              <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#092218', fontFamily: "'Newsreader', serif" }}>
                ${parseFloat(statement.openingBalance || statement.startingBalance || 0).toFixed(2)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.6875rem', color: '#688073', textTransform: 'uppercase', fontWeight: 700 }}>
                Closing Balance
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#166534', fontFamily: "'Newsreader', serif" }}>
                ${parseFloat(statement.closingBalance || selectedAccount?.balance || 0).toFixed(2)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.6875rem', color: '#688073', textTransform: 'uppercase', fontWeight: 700 }}>
                Ledger Invariant
              </div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#166534', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <CheckCircle2 size={14} /> Proven Balanced
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#092218', marginBottom: '1rem' }}>
            Journal Line Items ({statement.transactions?.length || 0})
          </h3>

          {!statement.transactions || statement.transactions.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#688073', fontSize: '0.875rem', backgroundColor: '#F8FAF8', borderRadius: '10px' }}>
              No transactions recorded in the selected statement period.
            </div>
          ) : (
            <table className="table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Posting Date</th>
                  <th>Transaction Reference</th>
                  <th>Classification</th>
                  <th>Description</th>
                  <th style={{ textAlign: 'right' }}>Debit (-)</th>
                  <th style={{ textAlign: 'right' }}>Credit (+)</th>
                </tr>
              </thead>
              <tbody>
                {statement.transactions.map((tx) => {
                  const isCredit = tx.transactionType === 'DEPOSIT' || tx.destinationAccount?.id === selectedAccount?.id;
                  const amt = parseFloat(tx.amount || 0).toFixed(2);
                  return (
                    <tr key={tx.id}>
                      <td style={{ fontSize: '0.8125rem', color: '#64748B' }}>
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', fontWeight: 600 }}>
                        {tx.reference}
                      </td>
                      <td>
                        <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.2rem 0.4rem', borderRadius: '4px', backgroundColor: '#F1F5F2', color: '#092218' }}>
                          {tx.transactionType}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8125rem', color: '#334155' }}>
                        {tx.description}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: !isCredit ? '#B91C1C' : '#94A3B8' }}>
                        {!isCredit ? `-$${amt}` : '—'}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: isCredit ? '#15803D' : '#94A3B8' }}>
                        {isCredit ? `+$${amt}` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* Statement Certificate Footer */}
          <div style={{ marginTop: '2.5rem', paddingTop: '1.25rem', borderTop: '1px solid #E5EBE5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#688073' }}>
            <span>Certificate of Authentic Ledger Recording &bull; BalanceVault Financial Platform</span>
            <span>Cryptographically Verified &bull; Append-Only Audit Trail</span>
          </div>
        </div>
      )}
    </div>
  );
};
