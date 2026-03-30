'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import axios from 'axios';
import Breadcrumb from "@/components/Breadcrumb";
import FooterOne from "@/components/FooterOne";
import HeaderOne from "@/components/HeaderOne";
import SignInInner from "@/components/SignInInner";
import { jwtDecode } from "jwt-decode";
import { toast } from 'react-hot-toast';

const SignIn = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', formData);
      
      if (response.data.success && response.data.token) {
        // Stocker le token
        localStorage.setItem('authToken', response.data.token);
        
        // Stocker les informations utilisateur
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Redirection basée sur le rôle
        const user = response.data.user;
        if (user.role === 'student') {
          router.push('/index-3');
        } else if (user.role === 'instructor') {
          router.push('/index-2');
        } else if (user.role === 'admin') {
          router.push('/admin/dashboard');
        }
        
        toast.success('Connexion réussie!');
      } else {
        throw new Error('Données de connexion invalides');
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
      setError(error.response?.data?.message || 'Erreur lors de la connexion');
      toast.error(error.response?.data?.message || 'Erreur lors de la connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* HeaderOne */}
      <HeaderOne />

      {/* Breadcrumb */}
      <Breadcrumb title="Sign In" />

      {/* SignInInner */}
      <SignInInner onSubmit={handleSubmit} onChange={handleChange} error={error} formData={formData} loading={loading} />

      {/* FooterOne */}
      <FooterOne />
    </>
  );
};

export default SignIn;
