import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AccountRequestModal } from './AccountRequestModal';
import {
  LayoutDashboard,
  Wallet,
  FileSpreadsheet,
  PlusCircle,
  ShieldCheck,
  Receipt,
  Scale,
  Users,
  Building2,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  X
} from 'lucide-react';

export const Sidebar = ({ mobileOpen, onCloseMobile }) => {
  const { role } = useAuth();
  const [requestModalOpen, setRequestModalOpen] = useState(false);

  const handleNavClick = () => {
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      <aside className={`bv-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="bv-sidebar-brand" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div className="bv-brand-icon">
              <span>b</span>
            </div>
            <span className="bv-brand-text">Balance Vault</span>
          </div>

          {/* Close button visible only on mobile drawer */}
          {onCloseMobile && (
            <button
              type="button"
              className="bv-mobile-close-btn"
              onClick={onCloseMobile}
              aria-label="Close sidebar"
            >
              <X size={18} color="#95B2A4" />
            </button>
          )}
        </div>

        {/* Navigation Body */}
        <div className="bv-sidebar-nav">
          {/* CUSTOMER NAVIGATION */}
          {role === 'CUSTOMER' && (
            <>
              <div className="bv-nav-section-title">WORKSPACE</div>
              <NavLink
                to="/customer"
                end
                onClick={handleNavClick}
                className={({ isActive }) => `bv-nav-item ${isActive ? 'active' : ''}`}
              >
                <LayoutDashboard size={16} />
                <span>Overview</span>
              </NavLink>

              <NavLink
                to="/customer/accounts"
                onClick={handleNavClick}
                className={({ isActive }) => `bv-nav-item ${isActive ? 'active' : ''}`}
              >
                <Wallet size={16} />
                <span>Accounts</span>
              </NavLink>

              <div className="bv-nav-section-title" style={{ marginTop: '1.25rem' }}>
                MONEY MOVEMENT
              </div>
              <NavLink
                to="/customer/deposit"
                onClick={handleNavClick}
                className={({ isActive }) => `bv-nav-item ${isActive ? 'active' : ''}`}
              >
                <ArrowDownLeft size={16} color="#34D399" />
                <span>Deposit Funds</span>
              </NavLink>

              <NavLink
                to="/customer/withdraw"
                onClick={handleNavClick}
                className={({ isActive }) => `bv-nav-item ${isActive ? 'active' : ''}`}
              >
                <ArrowUpRight size={16} color="#FBBF24" />
                <span>Withdraw Funds</span>
              </NavLink>

              <NavLink
                to="/customer/transfer"
                onClick={handleNavClick}
                className={({ isActive }) => `bv-nav-item ${isActive ? 'active' : ''}`}
              >
                <ArrowLeftRight size={16} color="#60A5FA" />
                <span>Transfer Funds</span>
              </NavLink>

              <div className="bv-nav-section-title" style={{ marginTop: '1.25rem' }}>
                RECORDS & LEDGER
              </div>
              <NavLink
                to="/customer/transactions"
                onClick={handleNavClick}
                className={({ isActive }) => `bv-nav-item ${isActive ? 'active' : ''}`}
              >
                <Receipt size={16} />
                <span>Activity & Journal</span>
              </NavLink>

              <NavLink
                to="/customer/statements"
                onClick={handleNavClick}
                className={({ isActive }) => `bv-nav-item ${isActive ? 'active' : ''}`}
              >
                <FileSpreadsheet size={16} />
                <span>Account Statements</span>
              </NavLink>

              <div style={{ margin: '1rem 0 0.5rem', borderTop: '1px solid rgba(255,255,255,0.08)' }} />
              <button
                type="button"
                onClick={() => {
                  handleNavClick();
                  setRequestModalOpen(true);
                }}
                className="bv-nav-item bv-nav-item-action"
              >
                <PlusCircle size={16} color="#34D399" />
                <span>+ Request Account</span>
              </button>
            </>
          )}

          {/* ADMIN NAVIGATION */}
          {role === 'ADMIN' && (
            <>
              <div className="bv-nav-section-title">ADMINISTRATION</div>
              <NavLink
                to="/admin"
                end
                onClick={handleNavClick}
                className={({ isActive }) => `bv-nav-item ${isActive ? 'active' : ''}`}
              >
                <LayoutDashboard size={16} />
                <span>Admin Overview</span>
              </NavLink>

              <div className="bv-nav-section-title" style={{ marginTop: '1.25rem' }}>
                GOVERNANCE
              </div>
              <NavLink
                to="/admin/accounts"
                onClick={handleNavClick}
                className={({ isActive }) => `bv-nav-item ${isActive ? 'active' : ''}`}
              >
                <Building2 size={16} />
                <span>Accounts & Approvals</span>
              </NavLink>

              <NavLink
                to="/admin/users"
                onClick={handleNavClick}
                className={({ isActive }) => `bv-nav-item ${isActive ? 'active' : ''}`}
              >
                <Users size={16} />
                <span>User Directory</span>
              </NavLink>

              <NavLink
                to="/admin/transactions"
                onClick={handleNavClick}
                className={({ isActive }) => `bv-nav-item ${isActive ? 'active' : ''}`}
              >
                <Receipt size={16} />
                <span>Platform Transactions</span>
              </NavLink>
            </>
          )}

          {/* AUDITOR NAVIGATION */}
          {role === 'AUDITOR' && (
            <>
              <div className="bv-nav-section-title">COMPLIANCE</div>
              <NavLink
                to="/auditor"
                end
                onClick={handleNavClick}
                className={({ isActive }) => `bv-nav-item ${isActive ? 'active' : ''}`}
              >
                <LayoutDashboard size={16} />
                <span>Compliance Overview</span>
              </NavLink>

              <div className="bv-nav-section-title" style={{ marginTop: '1.25rem' }}>
                IMMUTABLE AUDIT
              </div>
              <NavLink
                to="/auditor/ledger"
                onClick={handleNavClick}
                className={({ isActive }) => `bv-nav-item ${isActive ? 'active' : ''}`}
              >
                <Scale size={16} />
                <span>Ledger Journal</span>
              </NavLink>

              <NavLink
                to="/auditor/audit-logs"
                onClick={handleNavClick}
                className={({ isActive }) => `bv-nav-item ${isActive ? 'active' : ''}`}
              >
                <ShieldCheck size={16} />
                <span>Audit Trail Logs</span>
              </NavLink>

              <NavLink
                to="/auditor/transactions"
                onClick={handleNavClick}
                className={({ isActive }) => `bv-nav-item ${isActive ? 'active' : ''}`}
              >
                <Receipt size={16} />
                <span>Traceability Explorer</span>
              </NavLink>
            </>
          )}
        </div>

        {/* Sidebar Footer Badge */}
        <div className="bv-sidebar-footer">
          <div className="bv-ledger-badge">
            <div className="bv-badge-icon">
              <ShieldCheck size={14} />
            </div>
            <div className="bv-badge-content">
              <div className="bv-badge-title">Protected ledger</div>
              <div className="bv-badge-sub">Secure by design</div>
            </div>
            <div className="bv-badge-status-dot">✓</div>
          </div>
        </div>
      </aside>

      {/* Account Request Modal */}
      <AccountRequestModal
        isOpen={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        onSuccess={() => {
          window.dispatchEvent(new CustomEvent('account-request-submitted'));
        }}
      />
    </>
  );
};
