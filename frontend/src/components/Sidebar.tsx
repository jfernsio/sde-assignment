import React from 'react';
import { Menu, X, Ship, CheckCircle2, AlertCircle, BarChart3, LogOut } from 'lucide-react';
import { UserRole } from '../services/apiClient';
import styles from './Sidebar.module.css';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
  role: UserRole;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  currentPage,
  onNavigate,
  role,
  onLogout
}) => {
  const handleNavClick = (page: string) => {
    onNavigate(page);
    onClose();
  };

  const isAdmin = role === 'ADMIN';
  const isManager = role === 'MANAGER';

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className={styles.overlay}
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <Ship size={24} />
            <span>Maritime</span>
          </div>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X size={24} />
          </button>
        </div>

        <nav className={styles.nav}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Dashboard</h3>
            <NavLink
              icon={<BarChart3 size={20} />}
              label="Overview"
              page="dashboard"
              active={currentPage === 'dashboard'}
              onClick={() => handleNavClick('dashboard')}
            />
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Operations</h3>
            <NavLink
              icon={<CheckCircle2 size={20} />}
              label="Maintenance Tasks"
              page="tasks"
              active={currentPage === 'tasks'}
              onClick={() => handleNavClick('tasks')}
            />
            <NavLink
              icon={<AlertCircle size={20} />}
              label="Safety Drills"
              page="drills"
              active={currentPage === 'drills'}
              onClick={() => handleNavClick('drills')}
            />
          </div>

          {(isAdmin || isManager) && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Management</h3>
              <NavLink
                icon={<BarChart3 size={20} />}
                label="Compliance"
                page="compliance"
                active={currentPage === 'compliance'}
                onClick={() => handleNavClick('compliance')}
              />
            </div>
          )}
        </nav>

        <div className={styles.footer}>
          <button
            className={styles.logoutBtn}
            onClick={onLogout}
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

interface NavLinkProps {
  icon: React.ReactNode;
  label: string;
  page: string;
  active: boolean;
  onClick: () => void;
}

const NavLink: React.FC<NavLinkProps> = ({
  icon,
  label,
  active,
  onClick
}) => {
  return (
    <button
      className={`${styles.navLink} ${active ? styles.active : ''}`}
      onClick={onClick}
    >
      <span className={styles.icon}>{icon}</span>
      <span className={styles.label}>{label}</span>
    </button>
  );
};
