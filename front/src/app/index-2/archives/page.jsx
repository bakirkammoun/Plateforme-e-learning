'use client';

import Archive from '@/components/Archive';
import Dashboard from '@/components/Dashboard';
import HeaderOne from '@/components/Header';
import styles from '../page.module.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function ArchivesPage() {
  return (
    <div>
      <Dashboard />
      <div className={styles.mainContent}>
        <HeaderOne />
        <ToastContainer />
        <Archive />
      </div>
    </div>
  );
}
