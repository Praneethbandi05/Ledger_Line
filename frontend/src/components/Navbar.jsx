import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  LogOut,
  User,
  LayoutDashboard,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  History,
  FileSpreadsheet,
  Users,
  Building2,
  FileCheck2,
  Terminal,
  Receipt,
  Scale
} from 'lucide-react';

export const Navbar = () => {
  const { user, role, logout } = useAuth();

  const getRoleBadgeClass = () => {
    switch (role) {
      case 'ADMIN':
        return 'user-role-badge role-admin';
      case 'AUDITOR':
        return 'user-role-badge role-auditor';
      default:
        return 'user-role-badge role-customer';
    }
  };

  return (
    <header className="navbar">
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <NavLink to="/dashboard" className="nav-brand">
          <ShieldCheck size={24} color="#3b82f6" />
          <span>LEDGERLINE</span>
          <span className="brand-badge">Proven Ledger</span>
        </NavLink>

        {user && role === 'CUSTOMER' && (
          <nav className="nav-links">
            <NavLink to="/customer" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={15} />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/customer/accounts" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Wallet size={15} />
              <span>Accounts</span>
            </NavLink>
            <NavLink to="/customer/deposit" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <ArrowDownLeft size={15} />
              <span>Deposit</span>
            </NavLink>
            <NavLink to="/customer/withdraw" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <ArrowUpRight size={15} />
              <span>Withdraw</span>
            </NavLink>
            <NavLink to="/customer/transfer" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <ArrowLeftRight size={15} />
              <span>Transfer</span>
            </NavLink>
            <NavLink to="/customer/transactions" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <History size={15} />
              <span>History</span>
            </NavLink>
            <NavLink to="/customer/statements" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <FileSpreadsheet size={15} />
              <span>Statements</span>
            </NavLink>
            <NavLink to="/customer/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <User size={15} />
              <span>Profile</span>
            </NavLink>
          </nav>
        )}

        {user && role === 'ADMIN' && (
          <nav className="nav-links">
            <NavLink to="/admin" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={15} />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/admin/users" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Users size={15} />
              <span>User Management</span>
            </NavLink>
            <NavLink to="/admin/accounts" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Building2 size={15} />
              <span>Account Oversight</span>
            </NavLink>
            <NavLink to="/admin/transactions" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Receipt size={15} />
              <span>Transactions</span>
            </NavLink>
          </nav>
        )}

        {user && role === 'AUDITOR' && (
          <nav className="nav-links">
            <NavLink to="/auditor" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={15} />
              <span>Compliance Overview</span>
            </NavLink>
            <NavLink to="/auditor/transactions" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Receipt size={15} />
              <span>Transaction Explorer</span>
            </NavLink>
            <NavLink to="/auditor/ledger" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Scale size={15} />
              <span>Ledger Explorer</span>
            </NavLink>
            <NavLink to="/auditor/audit-logs" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Terminal size={15} />
              <span>Audit Log Viewer</span>
            </NavLink>
          </nav>
        )}
      </div>

      <div className="nav-right">
        {user && (
          <>
            <div className="nav-user">
              <User size={16} color="#94a3b8" />
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                {user.fullName || user.username}
              </span>
              <span className={getRoleBadgeClass()}>{role}</span>
            </div>

            <button
              onClick={logout}
              className="btn btn-secondary btn-sm"
              style={{ backgroundColor: '#1e293b', color: '#e2e8f0', borderColor: '#334155' }}
              title="Sign Out"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
};
