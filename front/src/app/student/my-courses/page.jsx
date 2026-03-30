'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import HeaderStudent from '@/components/HeaderStudent';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

const MyCourses = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get('http://localhost:5000/api/enrollments/student/enrollments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setEnrollments(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors de la récupération des formations:', error);
      toast.error('Erreur lors du chargement des formations');
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-warning';
      case 'approved':
        return 'bg-success';
      case 'rejected':
        return 'bg-danger';
      case 'completed':
        return 'bg-info';
      default:
        return 'bg-secondary';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'En attente d\'approbation';
      case 'approved':
        return 'Approuvé - Accès accordé';
      case 'rejected':
        return 'Rejeté';
      case 'completed':
        return 'Terminé';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <HeaderStudent />
      <div className="container py-5">
        <h2 className="mb-4">Mes Formations</h2>
        
        {enrollments.length === 0 ? (
          <div className="text-center py-5">
            <h3>Vous n'êtes inscrit à aucune formation</h3>
            <p className="text-muted">Découvrez nos formations et commencez votre apprentissage !</p>
            <Link href="/formations" className="btn btn-primary mt-3">
              Voir les formations
            </Link>
          </div>
        ) : (
          <div className="row g-4">
            {enrollments.map((enrollment) => (
              <div key={enrollment._id} className="col-md-6 col-lg-4">
                <div className="card h-100 course-card">
                  {enrollment.formationId.image && (
                    <img
                      src={`http://localhost:5000/${enrollment.formationId.image}`}
                      className="card-img-top"
                      alt={enrollment.formationId.title}
                      style={{ height: '200px', objectFit: 'cover' }}
                    />
                  )}
                  <div className="card-body">
                    <h5 className="card-title">{enrollment.formationId.title}</h5>
                    <p className="card-text text-muted">
                      {enrollment.formationId.description?.substring(0, 100)}...
                    </p>
                    
                    <div className="mb-3">
                      <span className={`badge ${getStatusBadgeClass(enrollment.status)}`}>
                        {getStatusText(enrollment.status)}
                      </span>
                    </div>

                    <div className="progress mb-3" style={{ height: '20px' }}>
                      <div
                        className="progress-bar"
                        role="progressbar"
                        style={{ width: `${enrollment.progress || 0}%` }}
                        aria-valuenow={enrollment.progress || 0}
                        aria-valuemin="0"
                        aria-valuemax="100"
                      >
                        {enrollment.progress || 0}%
                      </div>
                    </div>

                    <div className="course-info">
                      <small className="text-muted d-block">
                        Inscrit le : {new Date(enrollment.purchaseDate).toLocaleDateString()}
                      </small>
                      {enrollment.approvalDate && (
                        <small className="text-muted d-block">
                          Approuvé le : {new Date(enrollment.approvalDate).toLocaleDateString()}
                        </small>
                      )}
                      {enrollment.completionDate && (
                        <small className="text-muted d-block">
                          Terminé le : {new Date(enrollment.completionDate).toLocaleDateString()}
                        </small>
                      )}
                    </div>

                    {enrollment.status === 'approved' && (
                      <Link
                        href={`/student/course/${enrollment.formationId._id}`}
                        className="btn btn-primary mt-3 w-100"
                      >
                        Continuer la formation
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .course-card {
          transition: transform 0.3s ease;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .course-card:hover {
          transform: translateY(-5px);
        }

        .course-info {
          padding: 10px 0;
          border-top: 1px solid #eee;
          margin-top: 10px;
        }

        .progress {
          background-color: #e9ecef;
          border-radius: 10px;
          overflow: hidden;
        }

        .progress-bar {
          background-color: #007bff;
          transition: width 0.3s ease;
        }

        .badge {
          padding: 8px 12px;
          font-size: 0.9rem;
        }
      `}</style>
    </>
  );
};

export default MyCourses; 