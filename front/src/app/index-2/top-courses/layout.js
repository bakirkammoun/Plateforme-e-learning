'use client';

import Dashboard from "@/components/Dashboard";
import HeaderOne from "@/components/Header";
import styles from './layout.module.css';

export default function Layout({ children }) {
  return (
    <div>
      <Dashboard />
      <div className={styles.mainContent}>
        <HeaderOne />
        {children}
      </div>
    </div>
  );
} 