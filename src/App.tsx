import React, { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Athletes from './pages/Athletes';
import Sports from './pages/Sports';
import Payments from './pages/Payments';
import ClubSettings from './pages/ClubSettings';
import AccountSettings from './pages/AccountSettings';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'athletes':
        return <Athletes />;
      case 'sports':
        return <Sports />;
      case 'payments':
        return <Payments />;
      case 'club-settings':
        return <ClubSettings />;
      case 'account-settings':
        return <AccountSettings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <AuthProvider>
      <ProtectedRoute>
        <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
          {renderPage()}
        </Layout>
      </ProtectedRoute>
    </AuthProvider>
  );
}

export default App;