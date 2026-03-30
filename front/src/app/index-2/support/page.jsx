'use client';

import FooterThree from "@/components/FooterThree";
import Dashboard from "@/components/Dashboard";
import HeaderOne from "@/components/Header";
import styles from '../page.module.css';

export default function Support() {
  return (
    <div>
      <Dashboard />
      <div className={styles.mainContent}>
        <HeaderOne />
        <FooterThree />
      </div>
    </div>
  );
} 