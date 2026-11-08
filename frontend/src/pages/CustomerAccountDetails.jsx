import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { accountService } from '../services/accountService';
import { transactionService } from '../services/transactionService';
import { Alert } from '../components/Alert';
import { DoubleEntryBadge } from '../components/DoubleEntryBadge';
import {
  Wallet,
  PlusCircle,
  ArrowDownLeft,
  ArrowUpRight,
  FileSpreadsheet,
  Calendar,
  ShieldCheck,
  CheckCircle,
  RefreshCw
} from 'lucide-react';

export const CustomerAccountDetails = () => {
  const { accountId } = useParams();
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [newAccountType, setNewAccountType] = useState('CHECKING');

  useEffect(() => {
    loadAccounts();
  }, [accountId]);

  const loadAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await accountService.getMyAccounts();
      setAccounts(data);
      if (data && data.length > 0) {
        let initialAcc = data[0];
        if (accountId) {
          const matched = data.find((a) => a.id.toString() === accountId);
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
      setTransactions(txs);
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

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const newAcc = await accountService.createAccount(newAccountType, 'USD');
      setSuccessMessage(`New ${newAccountType} account created successfully: ${newAcc.accountNumber}`);
      await loadAccounts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create new account');
      setLoading(false);
    }
  };

  if (loading && accounts.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <div className="spinner" style={{ width: '40px', height: '40px' }} />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A' }}>
            Account Management & Ledger Breakdown
          </h2>
          <p style={{ color: '#64748B', fontSize: '0.875rem' }}>
            Inspect account configuration, balances, and real-time ledger records
          </p>
        </div>
        <button onClick={loadAccounts} className="btn btn-secondary" disabled={loading}>
          <RefreshCw size={15} />
          <span>Refresh</span>
        </button>
      </div>

      {successMessage && <Alert type="success" message={successMessage} onClose={() => setSuccessMessage(null)} />}
      {error && <Alert type="danger" message={error} onClose={() => setError(null)} />}

      {/* Account Selection Grid */}
      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        {accounts.map((acc) => {
          const isSelected = selectedAccount?.id === acc.id;
          return (
            <div
              key={acc.id}
              onClick={() => handleSelectAccount(acc)}
              className={`stat-card ${isSelected ? 'accent' : ''}`}
              style={{ cursor: 'pointer', border: isSelected ? '2px solid #3b82f6' : '1px solid #334155', transition: 'all 0.2s' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="stat-label">{acc.accountType} Account</div>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: acc.status === 'ACTIVE' ? '#34D399' : '#F87171' }}>
                  {acc.status}
                </span>
              </div>
              <div className="stat-value">${parseFloat(acc.balance).toFixed(2)}</div>
              <div className="stat-subtext" style={{ fontFamily: 'var(--font-mono)' }}>
                {acc.accountNumber} • {acc.currency}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Account Overview and Action Bar */}
      {selectedAccount && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Wallet size={20} color="#2563eb" />
                <h3 className="card-title" style={{ fontFamily: 'var(--font-mono)' }}>
                  {selectedAccount.accountNumber}
                </h3>
                <span className="badge badge-success">{selectedAccount.status}</span>
              </div>
              <div className="card-subtitle">
                Created on {new Date(selectedAccount.createdAt).toLocaleDateString()} • Base Currency: {selectedAccount.currency}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Link to="/customer/deposit" className="btn btn-primary btn-sm">
                <ArrowDownLeft size={14} />
                <span>Deposit</span>
              </Link>
              <Link to="/customer/withdraw" className="btn btn-secondary btn-sm">
                <ArrowUpRight size={14} />
                <span>Withdraw</span>
              </Link>
              <Link to={`/customer/statements?account=${selectedAccount.id}`} className="btn btn-secondary btn-sm">
                <FileSpreadsheet size={14} />
                <span>View Statement</span>
              </Link>
            </div>
          </div>

          <div className="grid-3" style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
            <div className="info-item">
              <span className="info-label">Current Available Balance</span>
              <span className="info-value amount" style={{ fontSize: '1.25rem', color: '#0f172a' }}>
                ${parseFloat(selectedAccount.balance).toFixed(2)}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Account Classification</span>
              <span className="info-value">{selectedAccount.accountType}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Ledger Integrity</span>
              <span className="info-value" style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <CheckCircle size={14} /> Verified Double-Entry
              </span>
            </div>
          </div>

          {/* Account Transaction History */}
          <div style={{ marginTop: '1rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', color: '#1e293b' }}>
              Transactions for this Account ({transactions.length})
            </h4>

            {txLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                <div className="spinner" style={{ width: '30px', height: '30px' }} />
              </div>
            ) : transactions.length === 0 ? (
              <div className="empty-state">
                <p>No transactions booked for this account yet.</p>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>Type</th>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{tx.reference}</td>
                        <td><DoubleEntryBadge type={tx.type} /></td>
                        <td style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                          {new Date(tx.createdAt).toLocaleString()}
                        </td>
                        <td>{tx.description}</td>
                        <td className="amount" style={{ fontWeight: 600 }}>
                          ${parseFloat(tx.amount).toFixed(2)}
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
            )}
          </div>
        </div>
      )}

      {/* Open Additional Account Form */}
      <div className="card">
        <h3 className="card-title" style={{ marginBottom: '0.5rem' }}>Open Additional Bank Account</h3>
        <p className="card-subtitle" style={{ marginBottom: '1.25rem' }}>
          Provision an additional segregated savings or checking account tied to your customer profile.
        </p>

        <form onSubmit={handleCreateAccount} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ minWidth: '220px', marginBottom: 0 }}>
            <label className="form-label">Account Type</label>
            <select
              className="form-control"
              value={newAccountType}
              onChange={(e) => setNewAccountType(e.target.value)}
            >
              <option value="CHECKING">Checking Account (USD)</option>
              <option value="SAVINGS">High-Yield Savings Account (USD)</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            <PlusCircle size={15} />
            <span>Create Account</span>
          </button>
        </form>
      </div>
    </div>
  );
};
