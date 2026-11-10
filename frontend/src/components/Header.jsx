import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { SettingsModal } from './SettingsModal';
import { User, Lock, LogOut, ChevronDown, ShieldCheck, Activity } from 'lucide-react';

export const Header = ({ breadcrumb = 'Workspace / Overview' }) => {
  const { user, role, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState('profile');
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

  const openSettings = (tab) => {
    setSettingsTab(tab);
    setSettingsOpen(true);
    setDropdownOpen(false);
  };

  const getRoleLabel = () => {
    switch (role) {
      case 'ADMIN':
        return 'Administrator';
      case 'AUDITOR':
        return 'Compliance Auditor';
      default:
        return 'Account holder';
    }
  };

  const displayName = user?.fullName || user?.username || 'User';
  const initial = (user?.username || user?.fullName || 'U').charAt(0).toUpperCase();

  return (
    <>
      <header className="bv-header">
        {/* Breadcrumbs */}
        <div className="bv-breadcrumb">
          <span>{breadcrumb}</span>
        </div>

        {/* Right side items */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {/* System Operational Badge */}
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
              <ChevronDown size={14} color="#667085" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {dropdownOpen && (
              <div className="bv-profile-dropdown">
                <div className="bv-dropdown-user-header">
                  <div style={{ fontWeight: 600, color: '#0B251C', fontSize: '0.875rem' }}>{displayName}</div>
                  <div style={{ fontSize: '0.75rem', color: '#667085' }}>@{user?.username} &bull; {user?.email}</div>
                </div>

                <div className="bv-dropdown-divider" />

                <button
                  type="button"
                  className="bv-dropdown-item"
                  onClick={() => openSettings('profile')}
                >
                  <User size={15} color="#0B251C" />
                  <span>Profile Settings</span>
                </button>

                <button
                  type="button"
                  className="bv-dropdown-item"
                  onClick={() => openSettings('security')}
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

      {/* Profile & Security Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        initialTab={settingsTab}
      />
    </>
  );
};
