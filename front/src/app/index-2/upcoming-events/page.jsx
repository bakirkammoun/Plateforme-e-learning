'use client';

import BlogTwo from "@/components/BlogTwo";
import Dashboard from "@/components/Dashboard";
import HeaderOne from "@/components/Header";
import styles from '../page.module.css';

export default function UpcomingEvents() {
  return (
    <div>
      <Dashboard />
      <div className={styles.mainContent}>
        <HeaderOne />
        <BlogTwo />
      </div>
    </div>
  );
} 