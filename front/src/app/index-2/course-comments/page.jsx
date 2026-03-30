'use client';

import Dashboard from "@/components/Dashboard";
import HeaderOne from "@/components/Header";
import TestimonialsTwo from "@/components/TestimonialsThree";
import styles from '../page.module.css';

export default function CourseComments() {
  return (
    <div>
      <Dashboard />
      <div className={styles.mainContent}>
        <HeaderOne />
        <TestimonialsTwo />
      </div>
    </div>
  );
} 