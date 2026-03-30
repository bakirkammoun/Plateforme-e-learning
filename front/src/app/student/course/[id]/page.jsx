'use client';

import { useEffect, useState } from 'react';
import HeaderStudent from '@/components/HeaderStudent';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

const StudentCourseDetails = ({ params }) => {
  const [formation, setFormation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [progress, setProgress] = useState(0);
  const [instructor, setInstructor] = useState(null);

  useEffect(() => {
    fetchFormationDetails();
  }, [params.id]);

  const fetchFormationDetails = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`http://localhost:5000/api/formations/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setFormation(response.data);
      setInstructor(response.data.instructorId);
      
      if (response.data.videos && response.data.videos.length > 0) {
        setSelectedVideo(response.data.videos[0]);
      }

      // Récupérer la progression
      const progressResponse = await axios.get(
        `http://localhost:5000/api/enrollments/progress/${params.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      setProgress(progressResponse.data.progress);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors de la récupération des détails:', error);
      setError('Erreur lors du chargement des détails de la formation');
      setLoading(false);
      toast.error('Erreur lors du chargement du cours');
    }
  };

  const handleVideoSelect = (video) => {
    setSelectedVideo(video);
  };

  const updateProgress = async (videoId) => {
    try {
      const token = localStorage.getItem('authToken');
      await axios.post(
        `http://localhost:5000/api/enrollments/progress/${params.id}`,
        { videoId },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      const progressResponse = await axios.get(
        `http://localhost:5000/api/enrollments/progress/${params.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      setProgress(progressResponse.data.progress);
      toast.success('Progression mise à jour');
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la progression:', error);
      toast.error('Erreur lors de la mise à jour de la progression');
    }
  };

  if (loading) {
    return (
      <>
        <HeaderStudent />
        <div className="d-flex justify-content-center align-items-center min-vh-100">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      </>
    );
  }

  if (error || !formation) {
    return (
      <>
        <HeaderStudent />
        <div className="container py-5">
          <div className="alert alert-danger">
            {error || 'Impossible de charger les détails du cours'}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <HeaderStudent />
      
      {/* Hero Section */}
      <section className="course-details-hero py-5" style={{ background: 'linear-gradient(135deg, #0d6efd20 0%, #0d6efd05 100%)' }}>
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link href="/student/my-courses" className="text-decoration-none">
                      Mes Formations
                    </Link>
                  </li>
                  <li className="breadcrumb-item active" aria-current="page">
                    {formation.title}
                  </li>
                </ol>
              </nav>
              <h1 className="display-5 fw-bold mb-4">{formation.title}</h1>
              <div className="d-flex flex-wrap gap-4 mb-4">
                <div className="d-flex align-items-center">
                  <i className="ph ph-clock text-primary me-2"></i>
                  <span>{formation.duration}h de contenu</span>
                </div>
                <div className="d-flex align-items-center">
                  <i className="ph ph-chart-bar text-primary me-2"></i>
                  <span>Niveau {formation.level}</span>
                </div>
                <div className="d-flex align-items-center">
                  <i className="ph ph-graduation-cap text-primary me-2"></i>
                  <span>{formation.category}</span>
                </div>
                <div className="d-flex align-items-center">
                  <i className="ph ph-users text-primary me-2"></i>
                  <span>{formation.enrolledStudents?.length || 0} étudiants</span>
                </div>
              </div>
              {instructor && (
                <div className="d-flex align-items-center mb-4">
                  <div className="rounded-circle bg-primary text-white p-2 me-3">
                    <i className="ph ph-user-circle fs-4"></i>
                  </div>
                  <div>
                    <p className="mb-0">Instructeur</p>
                    <h6 className="mb-0">{instructor.firstName} {instructor.lastName}</h6>
                  </div>
                </div>
              )}
            </div>
            <div className="col-lg-4">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <div className="progress mb-3" style={{ height: '8px' }}>
                    <div
                      className="progress-bar"
                      role="progressbar"
                      style={{ width: `${progress}%` }}
                      aria-valuenow={progress}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    ></div>
                  </div>
                  <p className="text-center mb-0">
                    <strong>{progress}%</strong> complété
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contenu Principal */}
      <div className="container py-5">
        <div className="row g-4">
          {/* Colonne principale */}
          <div className="col-lg-8">
            {/* Lecteur vidéo */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body p-0">
                {selectedVideo ? (
                  <div className="ratio ratio-16x9">
                    <video
                      src={`http://localhost:5000/${selectedVideo.url}`}
                      controls
                      className="rounded-top"
                      onEnded={() => updateProgress(selectedVideo._id)}
                    />
                  </div>
                ) : (
                  <div className="alert alert-info m-3">
                    Aucune vidéo disponible pour ce cours
                  </div>
                )}
                {selectedVideo && (
                  <div className="p-3">
                    <h5 className="mb-2">{selectedVideo.title || 'Vidéo sans titre'}</h5>
                    <p className="text-muted mb-0">
                      {selectedVideo.description || 'Aucune description disponible'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Description du cours */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body">
                <h4 className="card-title mb-4">À propos de cette formation</h4>
                <p className="card-text">{formation.description}</p>
              </div>
            </div>
          </div>

          {/* Barre latérale */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm sticky-top" style={{ top: '2rem' }}>
              <div className="card-header bg-white">
                <h5 className="card-title mb-0">Contenu du cours</h5>
              </div>
              <div className="card-body p-0">
                <div className="list-group list-group-flush">
                  {formation.videos?.map((video, index) => (
                    <button
                      key={video._id}
                      className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center border-0 ${
                        selectedVideo?._id === video._id ? 'active bg-primary text-white' : ''
                      }`}
                      onClick={() => handleVideoSelect(video)}
                    >
                      <div className="d-flex align-items-center">
                        <i className={`ph ph-play-circle me-2 ${selectedVideo?._id === video._id ? 'text-white' : 'text-primary'}`}></i>
                        <span>{video.title || `Vidéo ${index + 1}`}</span>
                      </div>
                      <span className={`badge ${selectedVideo?._id === video._id ? 'bg-white text-primary' : 'bg-primary'} rounded-pill`}>
                        {video.duration || '--:--'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .course-details-hero {
          position: relative;
          overflow: hidden;
        }

        .progress {
          border-radius: 10px;
          background-color: #e9ecef;
        }

        .progress-bar {
          background: linear-gradient(45deg, #007bff, #0056b3);
          transition: width 0.6s ease;
        }

        .sticky-top {
          z-index: 1020;
        }

        .breadcrumb {
          background: transparent;
        }

        .list-group-item {
          transition: all 0.3s ease;
        }

        .list-group-item:hover:not(.active) {
          background-color: #f8f9fa;
        }

        .card {
          transition: transform 0.3s ease;
        }

        .card:hover {
          transform: translateY(-2px);
        }
      `}</style>
    </>
  );
};

export default StudentCourseDetails; 