'use client';

import { useEffect, useState } from 'react';
import HeaderStudent from './HeaderStudent';
import HeaderInstructor from './HeaderInstructor';
import HeaderOne from './HeaderOne';

const Header = () => {
  const [userRole, setUserRole] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Vérifier l'authentification et le rôle de l'utilisateur
    try {
      const token = localStorage.getItem('authToken');
      const role = localStorage.getItem('userRole');
      
      setIsAuthenticated(!!token);
      setUserRole(role);
    } catch (err) {
      console.error('Error checking authentication:', err);
      setIsAuthenticated(false);
      setUserRole(null);
    }
  }, []);

  // Si l'utilisateur n'est pas authentifié, afficher HeaderOne
  if (!isAuthenticated) {
    return <HeaderOne />;
  }

  // Si l'utilisateur est un instructeur, afficher HeaderInstructor
  if (userRole === 'instructor') {
    return <HeaderInstructor />;
  }

  // Si l'utilisateur est un étudiant, afficher HeaderStudent
  if (userRole === 'student') {
    return <HeaderStudent />;
  }

  // Par défaut, afficher HeaderOne
  return <HeaderOne />;
};

export default Header; 