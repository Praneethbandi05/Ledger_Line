import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { CustomerDashboard } from './pages/CustomerDashboard';
import { CustomerAccountDetails } from './pages/CustomerAccountDetails';
import { CustomerDepositPage } from './pages/CustomerDepositPage';
import { CustomerWithdrawPage } from './pages/CustomerWithdrawPage';
import { CustomerTransferPage } from './pages/CustomerTransferPage';
import { CustomerTransactionsPage } from './pages/CustomerTransactionsPage';
import { CustomerStatementPage } from './pages/CustomerStatementPage';
import { CustomerProfilePage } from './pages/CustomerProfilePage';
import { CustomerSecurityPage } from './pages/CustomerSecurityPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminUserManagement } from './pages/AdminUserManagement';
import { AdminAccountManagement } from './pages/AdminAccountManagement';
import { AdminTransactionOverview } from './pages/AdminTransactionOverview';
import { AuditorDashboard } from './pages/AuditorDashboard';
import { AuditorTransactionExplorer } from './pages/AuditorTransactionExplorer';
import { AuditorLedgerExplorer } from './pages/AuditorLedgerExplorer';
import { AuditorAuditLogViewer } from './pages/AuditorAuditLogViewer';

// Protected layout wrapper with page-specific breadcrumb
const ProtectedLayout = ({ children, allowedRoles, breadcrumb }) => {
  const { isAuthenticated, loading, role } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#F8FAF8' }}>
        <div className="spinner" style={{ width: '40px', height: '40px' }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Layout breadcrumb={breadcrumb}>
      {children}
    </Layout>
  );
};

// Dispatches dashboard based on the logged-in user's role
const RoleBasedDashboard = () => {
  const { role } = useAuth();

  switch (role) {
    case 'ADMIN':
      return <AdminDashboard />;
    case 'AUDITOR':
      return <AuditorDashboard />;
    case 'CUSTOMER':
    default:
      return <CustomerDashboard />;
  }
};

// Redirects already authenticated users away from the login page
const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#F8FAF8' }}>
        <div className="spinner" style={{ width: '40px', height: '40px' }} />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public authentication routes */}
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />

          {/* Unified role-based dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedLayout breadcrumb="Workspace / Overview">
                <RoleBasedDashboard />
              </ProtectedLayout>
            }
          />

          {/* CUSTOMER DEDICATED ROUTES */}
          <Route
            path="/customer"
            element={
              <ProtectedLayout allowedRoles={['CUSTOMER', 'ADMIN']} breadcrumb="Workspace / Overview">
                <CustomerDashboard />
              </ProtectedLayout>
            }
          />
          <Route
            path="/customer/accounts"
            element={
              <ProtectedLayout allowedRoles={['CUSTOMER', 'ADMIN']} breadcrumb="Portfolio / Accounts">
                <CustomerAccountDetails />
              </ProtectedLayout>
            }
          />
          <Route
            path="/customer/accounts/:accountId"
            element={
              <ProtectedLayout allowedRoles={['CUSTOMER', 'ADMIN']} breadcrumb="Portfolio / Account Details">
                <CustomerAccountDetails />
              </ProtectedLayout>
            }
          />
          <Route
            path="/customer/deposit"
            element={
              <ProtectedLayout allowedRoles={['CUSTOMER', 'ADMIN']} breadcrumb="Money Movement / Deposit">
                <CustomerDepositPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/customer/withdraw"
            element={
              <ProtectedLayout allowedRoles={['CUSTOMER', 'ADMIN']} breadcrumb="Money Movement / Withdraw">
                <CustomerWithdrawPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/customer/transfer"
            element={
              <ProtectedLayout allowedRoles={['CUSTOMER', 'ADMIN']} breadcrumb="Money Movement / Transfer">
                <CustomerTransferPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/customer/transactions"
            element={
              <ProtectedLayout allowedRoles={['CUSTOMER', 'ADMIN']} breadcrumb="Auditable Ledger / Activity">
                <CustomerTransactionsPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/customer/statements"
            element={
              <ProtectedLayout allowedRoles={['CUSTOMER', 'ADMIN']} breadcrumb="Records / Official Statements">
                <CustomerStatementPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/customer/profile"
            element={
              <ProtectedLayout allowedRoles={['CUSTOMER', 'ADMIN', 'AUDITOR']} breadcrumb="Settings / Profile Details">
                <CustomerProfilePage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/customer/security"
            element={
              <ProtectedLayout allowedRoles={['CUSTOMER', 'ADMIN', 'AUDITOR']} breadcrumb="Settings / Security & Credentials">
                <CustomerSecurityPage />
              </ProtectedLayout>
            }
          />

          {/* ADMIN DEDICATED ROUTES */}
          <Route
            path="/admin"
            element={
              <ProtectedLayout allowedRoles={['ADMIN']} breadcrumb="Administration / Overview">
                <AdminDashboard />
              </ProtectedLayout>
            }
          />
          <Route
            path="/admin/accounts"
            element={
              <ProtectedLayout allowedRoles={['ADMIN']} breadcrumb="Governance / Accounts & Approvals">
                <AdminAccountManagement />
              </ProtectedLayout>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedLayout allowedRoles={['ADMIN']} breadcrumb="Governance / User Directory">
                <AdminUserManagement />
              </ProtectedLayout>
            }
          />
          <Route
            path="/admin/transactions"
            element={
              <ProtectedLayout allowedRoles={['ADMIN']} breadcrumb="Governance / Platform Transactions">
                <AdminTransactionOverview />
              </ProtectedLayout>
            }
          />

          {/* AUDITOR DEDICATED ROUTES */}
          <Route
            path="/auditor"
            element={
              <ProtectedLayout allowedRoles={['AUDITOR', 'ADMIN']} breadcrumb="Compliance / Overview">
                <AuditorDashboard />
              </ProtectedLayout>
            }
          />
          <Route
            path="/auditor/ledger"
            element={
              <ProtectedLayout allowedRoles={['AUDITOR', 'ADMIN']} breadcrumb="Compliance / Double-Entry Ledger">
                <AuditorLedgerExplorer />
              </ProtectedLayout>
            }
          />
          <Route
            path="/auditor/audit-logs"
            element={
              <ProtectedLayout allowedRoles={['AUDITOR', 'ADMIN']} breadcrumb="Compliance / Audit Trail Logs">
                <AuditorAuditLogViewer />
              </ProtectedLayout>
            }
          />
          <Route
            path="/auditor/transactions"
            element={
              <ProtectedLayout allowedRoles={['AUDITOR', 'ADMIN']} breadcrumb="Compliance / Traceability Explorer">
                <AuditorTransactionExplorer />
              </ProtectedLayout>
            }
          />

          {/* Fallback redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
