import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Lock, LogOut, ChevronDown, Menu } from 'lucide-react';

export const Header = ({ breadcrumb = 'Workspace / Overview', onToggleMobileMenu }) => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const goToRoute = (route) => {
    setDropdownOpen(false);
    navigate(route);
  };

  const getRoleLabel = () => {
    switch (role) {
      case 'ADMIN':
        return 'Administrator';
      case 'AUDITOR':
        return 'Compliance Auditor';
      default:
        return 'Account Holder';
    }
  };

  const displayName = user?.fullName || user?.username || 'User';
  const initial = (user?.username || user?.fullName || 'U').charAt(0).toUpperCase();

  return (
    <header className="bv-header">
      {/* Left: Mobile hamburger menu toggle + Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
        {onToggleMobileMenu && (
          <button
            type="button"
            className="bv-mobile-menu-btn"
            onClick={onToggleMobileMenu}
            aria-label="Toggle navigation menu"
          >
            <Menu size={20} color="#0B251C" />
          </button>
        )}

        <div className="bv-breadcrumb">
          <span>{breadcrumb}</span>
        </div>
      </div>

      {/* Right side items */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {/* System Operational Badge (hidden on extra small screens via CSS) */}
        <div className="bv-status-pill">
          <span className="bv-status-dot" />
          <span>System: operational</span>
        </div>

        {/* User Profile Dropdown */}
        <div className="bv-profile-container" ref={dropdownRef}>
          <button
            type="button"
            className="bv-profile-button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <div className="bv-profile-avatar">
              {initial}
            </div>
            <div className="bv-profile-info">
              <span className="bv-profile-name">{displayName}</span>
              <span className="bv-profile-role">{getRoleLabel()}</span>
            </div>
            <ChevronDown
              size={14}
              color="#667085"
              style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
            />
          </button>

          {dropdownOpen && (
            <div className="bv-profile-dropdown">
              <div className="bv-dropdown-user-header">
                <div style={{ fontWeight: 600, color: '#0B251C', fontSize: '0.875rem' }}>{displayName}</div>
                <div style={{ fontSize: '0.75rem', color: '#688073' }}>@{user?.username} &bull; {user?.email}</div>
              </div>

              <div className="bv-dropdown-divider" />

              <button
                type="button"
                className="bv-dropdown-item"
                onClick={() => goToRoute('/customer/profile')}
              >
                <User size={15} color="#0B251C" />
                <span>Profile Settings</span>
              </button>

              <button
                type="button"
                className="bv-dropdown-item"
                onClick={() => goToRoute('/customer/security')}
              >
                <Lock size={15} color="#0B251C" />
                <span>Security & Password</span>
              </button>

              <div className="bv-dropdown-divider" />

              <button
                type="button"
                className="bv-dropdown-item bv-dropdown-logout"
                onClick={logout}
              >
                <LogOut size={15} color="#DC2626" />
                <span style={{ color: '#DC2626' }}>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
