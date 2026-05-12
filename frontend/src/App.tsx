import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardPage } from './components/DashboardPage';
import { TasksPage } from './components/TasksPage';
import { DrillsPage } from './components/DrillsPage';
import { CompliancePage } from './components/CompliancePage';
import { Login } from './pages/auth/Login';
import { Signup } from './pages/auth/Signup';
import './styles/index.css';
import styles from './App.module.css';

// Strictly 2 roles now
export type UserRole = 'ADMIN' | 'CREW'; 

// Auth Guard
const ProtectedRoute = ({ allowedRoles }: { allowedRoles?: UserRole[] }) => {
  const token = localStorage.getItem('authToken');
  const role = localStorage.getItem('userRole') as UserRole;

  if (!token) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/dashboard" replace />;
  
  return <Outlet />;
};

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('CREW');
  const [userEmail, setUserEmail] = useState('');
  const location = useLocation();

  useEffect(() => {
    const savedRole = localStorage.getItem('userRole') as UserRole;
    const savedEmail = localStorage.getItem('userEmail');
    if (savedRole) setUserRole(savedRole);
    if (savedEmail) setUserEmail(savedEmail);
  }, []);

  const handleRoleChange = (role: UserRole) => {
    setUserRole(role);
    localStorage.setItem('userRole', role);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    window.location.href = '/login';
  };

  // Determine current page from URL for Sidebar highlighting
  const currentPage = location.pathname.split('/')[1] || 'dashboard';

  return (
    <div className={styles.app}>
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentPage={currentPage}
        role={userRole}
        onLogout={handleLogout}
      />
      <div className={styles.mainContainer}>
        <Header
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          userRole={userRole}
          onRoleChange={handleRoleChange}
          userEmail={userEmail}
        />
        <main className={styles.content}>
          <Outlet context={{ userRole }} />
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/drills" element={<DrillsPage />} />
            
            {/* Admin only route example */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route path="/compliance" element={<CompliancePage />} />
            </Route>
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};