import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ChatBot from './components/ChatBot';

import HomePage from './pages/HomePage';
import QueueStatusPage from './pages/QueueStatusPage';
import ServiceGuidePage from './pages/ServiceGuidePage';
import AnalyticsPage from './pages/AnalyticsPage';
import EmployeeLoginPage from './pages/EmployeeLoginPage';
import EmployeeDashboardPage from './pages/EmployeeDashboardPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminPanelPage from './pages/AdminPanelPage';
import NotFoundPage from './pages/NotFoundPage';

// Protected route components
const EmployeeRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center" style={{ minHeight: '100vh' }}><div className="loading-spinner" /></div>;
  if (!user || user.type !== 'employee') return <Navigate to="/employee/login" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center" style={{ minHeight: '100vh' }}><div className="loading-spinner" /></div>;
  if (!user || user.type !== 'admin') return <Navigate to="/admin/login" replace />;
  return children;
};

const PublicLayout = ({ children }) => (
  <>
    <Navbar />
    <main className="main-content">{children}</main>
    <ChatBot />
  </>
);

function AppRoutes() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<PublicLayout><HomePage /></PublicLayout>} />
      <Route path="/queue" element={<PublicLayout><QueueStatusPage /></PublicLayout>} />
      <Route path="/services" element={<PublicLayout><ServiceGuidePage /></PublicLayout>} />
      <Route path="/analytics" element={<PublicLayout><AnalyticsPage /></PublicLayout>} />

      {/* Employee */}
      <Route path="/employee/login" element={<EmployeeLoginPage />} />
      <Route path="/employee/dashboard" element={<EmployeeRoute><EmployeeDashboardPage /></EmployeeRoute>} />

      {/* Admin */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<AdminRoute><AdminPanelPage /></AdminRoute>} />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                fontSize: '0.875rem',
              },
            }}
          />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
