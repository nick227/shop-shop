/**
 * CustomerLayout - Unified layout for customer account pages
 * Provides consistent navigation and structure
 */

import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useCustomerStats } from '@hooks/customer/useCustomerStats'
import { useAuth } from '@hooks/useAuth'
import { Button } from '@ui'
import styles from './CustomerLayout.module.css'

export function CustomerLayout() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: stats } = useCustomerStats()

  const handleBackToHome = () => {
    navigate('/')
  }

  return (
    <div className={styles.layout}>
      {/* Top Bar */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <Button variant="ghost" onClick={handleBackToHome} className={styles.backButton}>
              ← Back to Home
            </Button>
            <div className={styles.headerTitle}>
              <h1 className={styles.title}>My Account</h1>
              <p className={styles.subtitle}>Welcome back, {user?.name || 'Customer'}!</p>
            </div>
          </div>
          {stats && stats.pendingOrders > 0 && (
            <NavLink to="/account/orders?filter=pending" className={styles.pendingBadge || ''}>
              <span className={styles.pendingIcon}>🔴</span>
              <span className={styles.pendingText}>{stats.pendingOrders} Pending</span>
            </NavLink>
          )}
        </div>
      </header>

      <div className={styles.container}>
        {/* Side Navigation */}
        <nav className={styles.nav}>
          <NavLink 
            to="/account/dashboard" 
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
          >
            <span className={styles.navIcon}>📊</span>
            <span className={styles.navLabel}>Dashboard</span>
          </NavLink>

          <NavLink 
            to="/account/orders" 
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
          >
            <span className={styles.navIcon}>📋</span>
            <span className={styles.navLabel}>Orders</span>
            {stats && stats.pendingOrders > 0 && (
              <span className={styles.navBadge}>{stats.pendingOrders}</span>
            )}
          </NavLink>

          <NavLink 
            to="/account/deliveries" 
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
          >
            <span className={styles.navIcon}>🚗</span>
            <span className={styles.navLabel}>Deliveries</span>
          </NavLink>

          <NavLink 
            to="/account/profile" 
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
          >
            <span className={styles.navIcon}>👤</span>
            <span className={styles.navLabel}>Profile</span>
          </NavLink>

          <NavLink 
            to="/account/addresses" 
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
          >
            <span className={styles.navIcon}>📍</span>
            <span className={styles.navLabel}>Addresses</span>
          </NavLink>
        </nav>

        {/* Main Content */}
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

