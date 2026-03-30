'use client';

import BannerThree from "@/components/BannerThree";
import CounterTwo from "@/components/CounterTwo";
import FooterThree from "@/components/FooterThree";
import HeaderOne from "@/components/Header";
import InfoTwo from "@/components/InfoTwo";
import Animation from "@/helper/Animation";
import Dashboard from "@/components/Dashboard";
import styles from './page.module.css';

export default function Index2() {
  return (
    <div>
      <Dashboard />
      <div className={styles.mainContent}>
        <HeaderOne />
        <Animation />
        <BannerThree />
        <InfoTwo />
        <CounterTwo />
      
      </div>
    </div>
  );
}
