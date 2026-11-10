import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { accountService } from '../services/accountService';
import { transactionService } from '../services/transactionService';
import { AccountRequestModal } from '../components/AccountRequestModal';
import { Alert } from '../components/Alert';
import { DoubleEntryBadge } from '../components/DoubleEntryBadge';
import {
  Wallet,
  PlusCircle,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  FileSpreadsheet,
  ShieldCheck,
  CheckCircle,
  RefreshCw,
  CreditCard
} from 'lucide-react';

export const CustomerAccountDetails = () => {
  const { accountId } = useParams();
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [error, setError] = useState(null);
  const [requestModalOpen, setRequestModalOpen] = useState(false);

  useEffect(() => {
    loadAccounts();

    const handleAccountRequestSubmitted = () => {
      loadAccounts();
    };
    window.addEventListener('account-request-submitted', handleAccountRequestSubmitted);
    return () => window.removeEventListener('account-request-submitted', handleAccountRequestSubmitted);
  }, [accountId]);

  const loadAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await accountService.getMyAccounts();
      const list = Array.isArray(data) ? data : (data?.content || []);
      setAccounts(list);
      if (list && list.length > 0) {
        let initialAcc = list[0];
        if (accountId) {
          const matched = list.find((a) => a.id.toString() === accountId);
          if (matched) initialAcc = matched;
        }
        setSelectedAccount(initialAcc);
        loadTransactions(initialAcc.id);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve accounts');
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async (accId) => {
    setTxLoading(true);
    try {
      const txs = await transactionService.getAccountTransactions(accId);
      setTransactions(Array.isArray(txs) ? txs : (txs?.content || []));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve transactions for account');
    } finally {
      setTxLoading(false);
    }
  };

  const handleSelectAccount = (account) => {
    setSelectedAccount(account);
    loadTransactions(account.id);
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="bv-section-header">
            <span>PORTFOLIO &bull; ACCOUNT MANAGEMENT</span>
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
            Your Accounts
          </h1>
          <p style={{ color: '#688073', fontSize: '0.875rem', margin: 0, lineHeight: 1.5 }}>
            Inspect account configurations, real-time balances, and individual ledger journal histories.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={loadAccounts}
            className="btn btn-secondary btn-sm"
            disabled={loading}
            style={{ backgroundColor: '#FFFFFF', borderColor: '#CCD8CC', color: '#0B251C' }}
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => setRequestModalOpen(true)}
            className="btn btn-primary btn-sm"
            style={{ backgroundColor: '#092218', borderColor: '#092218' }}
          >
            <PlusCircle size={14} />
            <span>Request Account</span>
          </button>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: '1.5rem' }}>
          <Alert type="danger" message={error} onClose={() => setError(null)} />
        </div>
      )}

      {loading && accounts.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="spinner" style={{ width: '36px', height: '36px' }} />
        </div>
      ) : accounts.length === 0 ? (
        <div className="bv-empty-box">
          <div className="bv-empty-icon">
            <CreditCard size={24} />
          </div>
          <div className="bv-empty-title">No accounts opened yet</div>
          <p className="bv-empty-desc">
            Submit an account request to have an administrator activate your checking or savings account.
          </p>
          <button
            type="button"
            onClick={() => setRequestModalOpen(true)}
            className="btn btn-primary btn-md"
            style={{ backgroundColor: '#092218', borderColor: '#092218', borderRadius: '10px' }}
          >
            Request an Account Now
          </button>
        </div>
      ) : (
        <>
          {/* Accounts Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
            {accounts.map((acc) => {
              const isSelected = selectedAccount?.id === acc.id;
              return (
                <div
                  key={acc.id}
                  onClick={() => handleSelectAccount(acc)}
                  className="bv-card"
                  style={{
                    cursor: 'pointer',
                    border: isSelected ? '2px solid #092218' : '1px solid #E5EBE5',
                    boxShadow: isSelected ? '0 4px 16px rgba(9, 34, 24, 0.08)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#688073', letterSpacing: '0.05em' }}>
                        {acc.accountType} &bull; {acc.currency}
                      </span>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0B251C', margin: '0.125rem 0' }}>
                        {acc.accountNumber}
                      </h3>
                    </div>
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.5rem',
                        borderRadius: '9999px',
                        backgroundColor: acc.status === 'ACTIVE' ? '#EAF5EE' : acc.status === 'PENDING_APPROVAL' ? '#FEF3C7' : '#F1F5F9',
                        color: acc.status === 'ACTIVE' ? '#166534' : acc.status === 'PENDING_APPROVAL' ? '#92400E' : '#475569',
                      }}
                    >
                      {acc.status}
                    </span>
                  </div>

                  <div style={{ margin: '1rem 0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#667085', marginBottom: '0.25rem' }}>
                      Available Balance
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0B251C', fontFamily: "'Newsreader', 'Georgia', serif" }}>
                      ${parseFloat(acc.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: isSelected ? '#092218' : '#88A796', fontWeight: 600 }}>
                    {isSelected ? '● Currently selected' : 'Click to inspect ledger'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Account Deep-Dive Inspector */}
          {selectedAccount && (
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #E5EBE5',
                padding: '2rem',
                marginBottom: '2.5rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#688073', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    SELECTED ACCOUNT SPECIFICATION
                  </div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#092218', fontFamily: "'Newsreader', serif", margin: '0.25rem 0' }}>
                    {selectedAccount.accountNumber} ({selectedAccount.accountType})
                  </h2>
                </div>

                {selectedAccount.status === 'ACTIVE' && (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <Link to="/customer/deposit" className="btn btn-secondary btn-sm" style={{ backgroundColor: '#FFFFFF' }}>
                      <ArrowDownLeft size={14} color="#059669" />
                      <span>Deposit</span>
                    </Link>
                    <Link to="/customer/withdraw" className="btn btn-secondary btn-sm" style={{ backgroundColor: '#FFFFFF' }}>
                      <ArrowUpRight size={14} color="#D97706" />
                      <span>Withdraw</span>
                    </Link>
                    <Link to="/customer/transfer" className="btn btn-secondary btn-sm" style={{ backgroundColor: '#FFFFFF' }}>
                      <ArrowLeftRight size={14} color="#2563EB" />
                      <span>Transfer</span>
                    </Link>
                    <Link to="/customer/statements" className="btn btn-primary btn-sm" style={{ backgroundColor: '#092218' }}>
                      <FileSpreadsheet size={14} />
                      <span>Statement</span>
                    </Link>
                  </div>
                )}
              </div>

              {/* Transactions for this account */}
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#092218', marginBottom: '1rem' }}>
                  Transaction History for {selectedAccount.accountNumber} ({transactions.length})
                </h3>

                {txLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                    <div className="spinner" style={{ width: '28px', height: '28px' }} />
                  </div>
                ) : transactions.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#688073', fontSize: '0.875rem', backgroundColor: '#F8FAF8', borderRadius: '10px' }}>
                    No transactions recorded for this account yet.
                  </div>
                ) : (
                  <div className="table-container" style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #E5EBE5' }}>
                    <table className="table" style={{ margin: 0 }}>
                      <thead>
                        <tr>
                          <th>Timestamp</th>
                          <th>Reference</th>
                          <th>Type</th>
                          <th>Description</th>
                          <th style={{ textAlign: 'right' }}>Amount</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((tx) => (
                          <tr key={tx.id}>
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
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Account Request Modal */}
      <AccountRequestModal
        isOpen={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        onSuccess={() => {
          loadAccounts();
        }}
      />
    </div>
  );
};
