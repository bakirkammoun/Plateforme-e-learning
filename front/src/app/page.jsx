'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import AboutTwo from "@/components/AboutTwo";
import BannerTwo from "@/components/BannerTwo";
import CategoryOne from "@/components/CategoryOne";
import CertificateTwo from "@/components/CertificateTwo";
import FaqOne from "@/components/FaqOne";
import FeaturesTwo from "@/components/FeaturesTwo";
import FooterTwo from "@/components/FooterTwo";
import HeaderOne from "@/components/HeaderOne";
import HeaderInstructor from "@/components/HeaderInstructor";
import HeaderStudent from "@/components/HeaderStudent";
import InfoSectionOne from "@/components/InfoSectionOne";
import CourseAllOne from '@/components/CourseAllOne';
import EventOne from '@/components/EventOne';
import InstructorOne from '@/components/InstructorOne';
import JoinCommunityOne from "@/components/JoinCommunityOne";

import Animation from "@/helper/Animation";

export default function Home() {
  const [userRole, setUserRole] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Vérifier le rôle de l'utilisateur au chargement
    const role = localStorage.getItem('userRole');
    setUserRole(role);

    // Rediriger vers index-4 si l'utilisateur est un instructeur
    if (role === 'instructor') {
      router.push('/index-4');
    }
  }, [router]);

  // Si l'utilisateur est un instructeur, ne rien afficher pendant la redirection
  if (userRole === 'instructor') {
    return null;
  }

  return (
    <>
      <Animation />
      {/* En-tête en fonction du rôle */}
      {userRole === 'instructor' ? (
        <HeaderInstructor />
      ) : userRole === 'student' ? (
        <HeaderStudent />
      ) : (
        <HeaderOne />
      )}

      {/* Contenu principal */}
      <main className="flex-grow">
        <BannerTwo />
        <CategoryOne />
        <AboutTwo />
        <FeaturesTwo />
        <CourseAllOne limit={6} sortBy="rating" />
        <CertificateTwo />
        <EventOne />
        <InfoSectionOne />
        <FaqOne />
        <InstructorOne />
        <JoinCommunityOne />
        
      </main>

      {/* Pied de page */}
      <FooterTwo />
    </>
  );
}
