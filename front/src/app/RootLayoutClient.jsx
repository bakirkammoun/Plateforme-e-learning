'use client';

import { useState, useEffect } from 'react';
import HeaderOne from '@/components/HeaderOne';
import HeaderInstructor from '@/components/HeaderInstructor';
import HeaderStudent from '@/components/HeaderStudent';
import Animation from '@/helper/Animation';
import BootstrapInit from "@/helper/BootstrapInit";
import RouteScrollToTop from "@/helper/RouteScrollToTop";
import LoadPhosphorIcons from "@/helper/LoadPhosphorIcons";

import "./font.css";
import "./globals.scss";

export default function RootLayout({ children }) {
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    // Vérifier le rôle de l'utilisateur depuis le localStorage
    const checkUserRole = () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.role) {
          setUserRole(user.role);
        } else {
          setUserRole(null);
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        setUserRole(null);
      }
    };

    checkUserRole();

    // Écouter les changements de localStorage
    window.addEventListener('storage', checkUserRole);
    return () => window.removeEventListener('storage', checkUserRole);
  }, []);

  const renderHeader = () => {
    switch(userRole) {
      case 'instructor':
        return <HeaderInstructor />;
      case 'student':
        return <HeaderStudent />;
      default:
        return <HeaderOne />;
    }
  };

  return (
    <html lang='en'>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body suppressHydrationWarning={true}>
        <BootstrapInit />
        <LoadPhosphorIcons />
        <RouteScrollToTop />
        <Animation />
        {renderHeader()}
        {children}
      </body>
    </html>
  );
} 