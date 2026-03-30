'use client';

import Breadcrumb from "@/components/Breadcrumb";
import CertificateOne from "@/components/CertificateOne";
import EventDetailsOne from "@/components/EventDetailsOne";
import FooterOne from "@/components/FooterOne";
import HeaderOne from "@/components/Header";
import Animation from "@/helper/Animation";
import axios from "axios";
import { useState } from "react";

const page = () => {
  const [comments, setComments] = useState([]);

  const handleCommentSubmit = async (comment) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(
        `http://localhost:5000/api/formations/${formationId}/comments`,
        { content: comment },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      // Mettre à jour l'état des commentaires
      setComments([...comments, response.data]);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  return (
    <>
      {/* Animation */}
      <Animation />

      {/* HeaderTwo */}
      <HeaderOne />

      {/* Breadcrumb */}
      <Breadcrumb title={"Event Details"} />

      {/* EventDetailsOne */}
      <EventDetailsOne />

      {/* CertificateOne */}
      <CertificateOne />

      {/* FooterOne */}
      <FooterOne />
    </>
  );
};

export default page;
