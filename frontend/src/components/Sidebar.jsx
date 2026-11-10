import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AccountRequestModal } from './AccountRequestModal';
import {
  LayoutDashboard,
  Wallet,
  FileSpreadsheet,
  PlusCircle,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Users,
  Building2,
  Receipt,
  Scale,
  Terminal,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight
} from 'lucide-react';

export const Sidebar = () => {
  const { role } = useAuth();
  const location = useLocation();
  const [requestModalOpen, setRequestModalOpen] = useState(false);

  return (
    <>
      <aside className="bv-sidebar">
        {/* Brand Header */}
        <div className="bv-sidebar-brand">
          <div className="bv-brand-icon">
            <span>b</span>
          </div>
          <span className="bv-brand-text">balancevault</span>
        </div>

        {/* Navigation Body */}
        <div className="bv-sidebar-nav">
          <div className="bv-nav-section-title">WORKSPACE</div>

          {role === 'CUSTOMER' && (
            <>
              <NavLink
                to="/customer"
                end
                className={({ isActive }) => `bv-nav-item ${isActive ? 'active' : ''}`}
              >
                <LayoutDashboard size={16} />
                <span>Overview</span>
              </NavLink>

              <NavLink
                to="/customer/accounts"
                className={({ isActive }) => `bv-nav-item ${isActive ? 'active' : ''}`}
              >
                <Wallet size={16} />
                <span style={{ flex: 1 }}>Accounts</span>
                <ChevronRight size={14} color="#5E8272" />
              </NavLink>

              <NavLink
                to="/customer/statements"
                className={({ isActive }) => `bv-nav-item ${isActive ? 'active' : ''}`}
              >
                <FileSpreadsheet size={16} />
                <span>Statements</span>
              </NavLink>

              <button
                type="button"
                onClick={() => setRequestModalOpen(true)}
                className="bv-nav-item bv-nav-item-action"
              >
                <PlusCircle size={16} color="#34D399" />
                <span>Account request</span>
              </button>

              <div style={{ margin: '0.75rem 0', borderTop: '1px solid rgba(255,255,255,0.06)' }} />

              <NavLink
                to="/customer/transactions"
                className={({ isActive }) => `bv-nav-item ${isActive ? 'active' : ''}`}
              >
                <Receipt size={16} />
                <span>Activity & Ledger</span>
              </NavLink>
            </>
          )}

          {role === 'ADMIN' && (
            <>
              <NavLink
                to="/admin"
                end
                className={({ isActive }) => `bv-nav-item ${isActive ? 'active' : ''}`}
              >
                <LayoutDashboard size={16} />
                <span>Overview</span>
              </NavLink>

              <NavLink
                to="/admin/users"
                className={({ isActive }) => `bv-nav-item ${isActive ? 'active' : ''}`}
              >
                <Users size={16} />
                <span>User Directory</span>
              </NavLink>

              <NavLink
                to="/admin/accounts"
                className={({ isActive }) => `bv-nav-item ${isActive ? 'active' : ''}`}
              >
                <Building2 size={16} />
                <span>Accounts & Approvals</span>
              </NavLink>

              <NavLink
                to="/admin/transactions"
                className={({ isActive }) => `bv-nav-item ${isActive ? 'active' : ''}`}
              >
                <Receipt size={16} />
                <span>Transactions</span>
              </NavLink>
            </>
          )}

          {role === 'AUDITOR' && (
            <>
              <NavLink
                to="/auditor"
                end
                className={({ isActive }) => `bv-nav-item ${isActive ? 'active' : ''}`}
              >
                <LayoutDashboard size={16} />
                <span>Compliance Overview</span>
              </NavLink>

              <NavLink
                to="/auditor/ledger"
                className={({ isActive }) => `bv-nav-item ${isActive ? 'active' : ''}`}
              >
                <Scale size={16} />
                <span>Ledger Journal</span>
              </NavLink>

              <NavLink
                to="/auditor/audit-logs"
                className={({ isActive }) => `bv-nav-item ${isActive ? 'active' : ''}`}
              >
                <Terminal size={16} />
                <span>Audit Trail</span>
              </NavLink>

              <NavLink
                to="/auditor/transactions"
                className={({ isActive }) => `bv-nav-item ${isActive ? 'active' : ''}`}
              >
                <Receipt size={16} />
                <span>Transaction Explorer</span>
              </NavLink>
            </>
          )}
        </div>

        {/* Sidebar Footer Badge */}
        <div className="bv-sidebar-footer">
          <div className="bv-protected-badge">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={18} color="#34D399" />
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#FFFFFF' }}>Protected ledger</div>
                <div style={{ fontSize: '0.6875rem', color: '#95B2A4' }}>Secure by design</div>
              </div>
            </div>
            <CheckCircle2 size={16} color="#34D399" />
          </div>

          <div className="bv-sidebar-meta">
            BALANCEVAULT &bull; PRIVATE
          </div>
        </div>
      </aside>

      {/* Account Request Modal */}
      <AccountRequestModal
        isOpen={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        onSuccess={() => {
          // If on customer page, trigger reload or window event
          window.dispatchEvent(new CustomEvent('account-request-submitted'));
        }}
      />
    </>
  );
};
