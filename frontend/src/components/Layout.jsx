import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const Layout = ({ children, breadcrumb = 'Workspace / Overview' }) => {
  return (
    <div className="bv-layout">
      <Sidebar />
      <div className="bv-main-container">
        <Header breadcrumb={breadcrumb} />
        <main className="bv-content">
          {children}
        </main>
        <footer className="bv-footer">
          <span>BalanceVault &bull; Financial clarity by design</span>
          <span style={{ fontSize: '0.75rem', color: '#88988C' }}>Institutional Double-Entry Engine</span>
        </footer>
      </div>
    </div>
  );
};
