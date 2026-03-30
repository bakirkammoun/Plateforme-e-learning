'use client';

import ChooseUsTwo from "@/components/ChooseUsTwo";
import Dashboard from "@/components/Dashboard";
import HeaderOne from "@/components/Header";
import styles from '../page.module.css';

export default function QuizManagement() {
  return (
    <div>
      <Dashboard />
      <div className={styles.mainContent}>
        <HeaderOne />
        <ChooseUsTwo />
      </div>
    </div>
  );
} 