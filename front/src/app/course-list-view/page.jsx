'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Breadcrumb from "@/components/Breadcrumb";
import CertificateOne from "@/components/CertificateOne";
import FooterOne from "@/components/FooterOne";
import HeaderOne from "@/components/HeaderOne";
import HeaderInstructor from "@/components/HeaderInstructor";
import HeaderStudent from "@/components/HeaderStudent";
import Animation from "@/helper/Animation";
import Link from 'next/link';

const CourseListView = () => {
  const [formations, setFormations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    // Vérifier le rôle de l'utilisateur
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user && user.role) {
        setUserRole(user.role);
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }

    const fetchFormations = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/formations');
        setFormations(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Erreur:', err);
        setError('Erreur lors du chargement des formations');
        setLoading(false);
      }
    };

    fetchFormations();
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
    <>
      {/* Animation */}
      <Animation />

      {/* Header */}
      {renderHeader()}

      {/* Breadcrumb */}
      <Breadcrumb title="Liste des Formations" />

      <section className="course-list py-80">
        <div className="container">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
            </div>
          ) : error ? (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          ) : (
            <div className="row">
              <div className="col-12">
                {formations.map((formation) => (
                  <div key={formation._id} className="course-list-item bg-white rounded-16 p-24 mb-24 box-shadow-md">
                    <div className="row align-items-center">
                      <div className="col-lg-4 mb-3 mb-lg-0">
                        <div className="course-thumb rounded-12 overflow-hidden">
                          <Link href={`/course-details/${formation._id}`}>
                            <img
                              src={formation.image || '/assets/images/default-course.png'}
                              alt={formation.title}
                              className="w-100 h-auto"
                              style={{ maxHeight: '200px', objectFit: 'cover' }}
                            />
                          </Link>
                        </div>
                      </div>
                      <div className="col-lg-8">
                        <div className="course-info">
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <h4 className="mb-0">
                              <Link href={`/course-details/${formation._id}`} className="text-neutral-700 hover-text-main-600">
                                {formation.title}
                              </Link>
                            </h4>
                            <span className="badge bg-main-600 rounded-pill px-3 py-2">${formation.price}</span>
                          </div>
                          
                          <div className="d-flex flex-wrap gap-4 mb-3">
                            <div className="d-flex align-items-center">
                              <i className="ph-bold ph-clock me-2 text-main-600"></i>
                              <span>{formation.duration}h</span>
                            </div>
                            <div className="d-flex align-items-center">
                              <i className="ph-bold ph-chart-bar me-2 text-main-600"></i>
                              <span>{formation.level}</span>
                            </div>
                            <div className="d-flex align-items-center">
                              <i className="ph-bold ph-graduation-cap me-2 text-main-600"></i>
                              <span>{formation.category}</span>
                            </div>
                          </div>

                          <p className="text-neutral-500 mb-3">{formation.description}</p>

                          {formation.instructorId && (
                            <div className="d-flex align-items-center mb-3">
                              <img
                                src={formation.instructorId.profileImage || '/assets/images/default-avatar.png'}
                                alt={`${formation.instructorId.firstName} ${formation.instructorId.lastName}`}
                                className="rounded-circle me-2"
                                style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                              />
                              <span className="text-neutral-700">
                                {formation.instructorId.firstName} {formation.instructorId.lastName}
                              </span>
                            </div>
                          )}

                          <div className="d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center">
                              <i className="ph-fill ph-star text-warning-600 me-1"></i>
                              <span>{formation.rating || '0'}</span>
                              <span className="text-neutral-500 ms-1">({formation.numberOfRatings || '0'} avis)</span>
                            </div>
                            <Link
                              href={`/apply-admission/${formation._id}`}
                              className="btn btn-main rounded-pill"
                            >
                              S'inscrire
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CertificateOne */}
      <CertificateOne />

      {/* FooterOne */}
      <FooterOne />
    </>
  );
};

export default CourseListView;
