import { toast } from 'react-hot-toast';

interface User {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  id?: string;
  _id?: string;
}

export const auth = {
  // Stocker le token et les informations utilisateur
  setAuth: (token: string, user: User) => {
    try {
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      return true;
    } catch (error) {
      console.error('Erreur lors du stockage des informations d\'authentification:', error);
      return false;
    }
  },

  // Récupérer le token
  getToken: (): string | null => {
    try {
      return localStorage.getItem('authToken');
    } catch (error) {
      console.error('Erreur lors de la récupération du token:', error);
      return null;
    }
  },

  // Récupérer les informations utilisateur
  getUser: (): User | null => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return null;
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Erreur lors de la récupération des informations utilisateur:', error);
      return null;
    }
  },

  // Vérifier si l'utilisateur est authentifié
  isAuthenticated: (): boolean => {
    const token = auth.getToken();
    const user = auth.getUser();
    return !!token && !!user;
  },

  // Déconnecter l'utilisateur
  logout: () => {
    try {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      return true;
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      return false;
    }
  },

  // Vérifier et formater le token pour les requêtes API
  getAuthHeader: (): { Authorization: string } | null => {
    const token = auth.getToken();
    if (!token) return null;

    let formattedToken = token;
    if (!token.startsWith('Bearer ')) {
      formattedToken = `Bearer ${token}`;
    }

    return {
      Authorization: formattedToken
    };
  }
}; 