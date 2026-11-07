import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, LogOut, User, Wallet, Building2, ScrollText } from 'lucide-react';

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
      <div className="nav-brand">
        <ShieldCheck size={24} color="#3b82f6" />
        <span>LEDGERLINE</span>
        <span className="brand-badge">Proven Ledger</span>
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
