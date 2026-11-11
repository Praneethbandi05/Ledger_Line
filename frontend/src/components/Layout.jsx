import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const Layout = ({ children, breadcrumb = 'Workspace / Overview' }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="bv-layout">
      {/* Mobile Drawer Overlay Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="bv-sidebar-overlay"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <div className="bv-main-container">
        <Header
          breadcrumb={breadcrumb}
          onToggleMobileMenu={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        />
        <main className="bv-content">
          {children}
        </main>
      </div>
    </div>
  );
};
