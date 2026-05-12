import React, { useState } from 'react';
import { Menu, Bell, User, ChevronDown } from 'lucide-react';
import { UserRole } from '../services/apiClient';
import styles from './Header.module.css';

interface HeaderProps {
  onMenuClick: () => void;
  userRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  userEmail?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onMenuClick,
  userRole,
  onRoleChange,
  userEmail = 'admin@maritime.com'
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const roles: UserRole[] = ['ADMIN', 'MANAGER', 'CREW'];

  const handleRoleChange = (role: UserRole) => {
    onRoleChange(role);
    setShowRoleMenu(false);
  };

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button
          className={styles.menuBtn}
          onClick={onMenuClick}
          aria-label="Toggle menu"
        >
          <Menu size={24} />
        </button>
        <h1 className={styles.title}>Maritime Management</h1>
      </div>

      <div className={styles.right}>
        {/* Notifications */}
        <div className={styles.notificationContainer}>
          <button
            className={styles.notificationBtn}
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
          >
            <Bell size={20} />
            <span className={styles.badge}>3</span>
          </button>

          {showNotifications && (
            <div className={styles.notificationDropdown}>
              <div className={styles.notificationItem}>
                <span className={styles.dot}></span>
                <span>Engine maintenance overdue</span>
              </div>
              <div className={styles.notificationItem}>
                <span className={styles.dot}></span>
                <span>Upcoming safety drill scheduled</span>
              </div>
              <div className={styles.notificationItem}>
                <span className={styles.dot}></span>
                <span>Compliance score below target</span>
              </div>
            </div>
          )}
        </div>

        {/* Role Toggle */}
        <div className={styles.roleContainer}>
          <button
            className={styles.roleBtn}
            onClick={() => setShowRoleMenu(!showRoleMenu)}
          >
            <User size={20} />
            <span className={styles.roleBadge}>{userRole}</span>
            <ChevronDown size={16} />
          </button>

          {showRoleMenu && (
            <div className={styles.roleDropdown}>
              <p className={styles.roleLabel}>Switch Role</p>
              {roles.map((role) => (
                <button
                  key={role}
                  className={`${styles.roleOption} ${userRole === role ? styles.active : ''}`}
                  onClick={() => handleRoleChange(role)}
                >
                  <span className={styles.roleIcon}>
                    {userRole === role && '✓'}
                  </span>
                  {role}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className={styles.userProfile}>
          <div className={styles.avatar}>{userEmail.charAt(0).toUpperCase()}</div>
          <div className={styles.userInfo}>
            <p className={styles.userName}>User</p>
            <p className={styles.userEmail}>{userEmail}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
