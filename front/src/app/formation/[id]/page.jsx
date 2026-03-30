'use client';

import { useEffect, useState } from 'react';
import HeaderStudent from '@/components/Header';
import axios from 'axios';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

const FormationDetails = ({ params }) => {
  const [formation, setFormation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);

  useEffect(() => {
    fetchFormationDetails();
    checkEnrollmentAndPaymentStatus();
  }, [params.id]);

  const fetchFormationDetails = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`http://localhost:5000/api/formations/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setFormation(response.data);
      if (response.data.videos && response.data.videos.length > 0) {
        setSelectedVideo(response.data.videos[0]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors de la récupération des détails:', error);
      setError('Erreur lors du chargement des détails de la formation');
      setLoading(false);
    }
  };

  const handleVideoSelect = (video, index) => {
    if (hasPaid) {
      setSelectedVideo(video);
      setIsVideoPlaying(true);
    } else {
      if (index === 0) {
        setSelectedVideo(video);
        setIsVideoPlaying(true);
      } else {
        toast.error('Please enroll and complete the payment to access all videos');
      }
    }
  };

  const checkEnrollmentAndPaymentStatus = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`http://localhost:5000/api/formations/${params.id}/enrollment-status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const hasValidEnrollment = response.data.status === 'approved' && response.data.hasPaid;
      setIsEnrolled(hasValidEnrollment);
      setHasPaid(response.data.hasPaid);
    } catch (error) {
      console.error('Error checking enrollment status:', error);
      setIsEnrolled(false);
      setHasPaid(false);
    }
  };

  if (loading) {
    return (
      <>
        <HeaderStudent />
        <div className="container py-5">
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <HeaderStudent />
        <div className="container py-5">
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        </div>
      </>
    );
  }

  if (!formation) {
    return (
      <>
        <HeaderStudent />
        <div className="container py-5">
          <div className="alert alert-warning" role="alert">
            Course not found
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <HeaderStudent />
      <section className="course-details py-120">
        <div className="container">
          <div className="row gy-4">
            <div className="col-xl-8">
              <div className="course-details__content border border-neutral-30 rounded-12 bg-white p-12">
                <div className="video-player mb-40">
                  {selectedVideo ? (
                    <div className="video-container rounded-16 overflow-hidden">
                      <video
                        className="w-100"
                        controls
                        autoPlay={isVideoPlaying}
                        src={selectedVideo.url}
                        poster={selectedVideo.thumbnail || '/assets/images/video-placeholder.jpg'}
                      >
                        Your browser does not support video playback.
                      </video>
                    </div>
                  ) : (
                    <div className="text-center py-80">
                      <i className="ph ph-video-camera text-primary mb-16" style={{ fontSize: '48px' }}></i>
                      <p className="text-neutral-500">Select a video to start</p>
                    </div>
                  )}
                </div>

                <div className="p-20">
                  <h2 className="mt-24 mb-24">{formation.title}</h2>
                  <p className="text-neutral-700">{formation.description}</p>
                </div>
              </div>
            </div>

            <div className="col-xl-4">
              <div className="course-details__sidebar border border-neutral-30 rounded-12 bg-white p-24">
                <div className="formation-info mb-24">
                  <div className="d-flex align-items-center mb-16">
                    <i className="ph ph-clock text-primary me-12"></i>
                    <span>Duration: {formation.duration}h</span>
                  </div>
                  <div className="d-flex align-items-center mb-16">
                    <i className="ph ph-users text-primary me-12"></i>
                    <span>{formation.enrolledStudents?.length || 0} enrolled students</span>
                  </div>
                  <div className="d-flex align-items-center mb-16">
                    <i className="ph ph-book-open text-primary me-12"></i>
                    <span>{formation.videos?.length || 0} videos</span>
                  </div>
                  <div className="d-flex align-items-center mb-16">
                    <i className="ph ph-file-pdf text-primary me-12"></i>
                    <span>{formation.documents?.length || 0} documents</span>
                  </div>
                  <div className="d-flex align-items-center">
                    <i className="ph ph-exam text-primary me-12"></i>
                    <span>{formation.quizzes?.length || 0} quiz</span>
                  </div>
                </div>

                <span className="d-block border-bottom border-neutral-30 my-24" />

                <div className="accordion common-accordion style-three" id="accordionExample">
                  <div className="accordion-item">
                    <h2 className="accordion-header bg-main-25">
                      <button
                        className="accordion-button bg-main-25"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#collapseOne"
                        aria-expanded="true"
                        aria-controls="collapseOne"
                      >
                        Contenu du cours
                      </button>
                    </h2>
                    <div
                      id="collapseOne"
                      className="accordion-collapse collapse show"
                      data-bs-parent="#accordionExample"
                    >
                      <div className="accordion-body p-0 bg-main-25">
                        {/* Vidéos */}
                        {formation.videos?.length > 0 && (
                          <>
                            <div className="section-title p-16 bg-light border-bottom">
                              <h6 className="mb-0">
                                <i className="ph ph-video-camera text-primary me-2"></i>
                                Vidéos
                              </h6>
                            </div>
                            {formation.videos.map((video, index) => (
                              <div 
                                key={`video-${index}`}
                                className={`curriculam-item p-16 ${
                                  selectedVideo?._id === video._id ? 'bg-white' : ''
                                } ${!hasPaid && index > 0 ? 'locked-video' : ''}`}
                                onClick={() => handleVideoSelect(video, index)}
                              >
                                <div className="d-flex align-items-center">
                                  <i className={`ph ${hasPaid || index === 0 ? 'ph-video-camera' : 'ph-lock'} text-primary me-12`}></i>
                                  <div className="flex-grow-1">
                                    <h6 className="mb-0">
                                      {video.title}
                                      {!hasPaid && index > 0 && <span className="ms-2 badge bg-warning">Premium</span>}
                                    </h6>
                                    <small className="text-neutral-500">{video.duration} min</small>
                                  </div>
                                  <i className={`ph ${hasPaid || index === 0 ? 'ph-play-circle' : 'ph-lock-key'} text-primary`}></i>
                                </div>
                              </div>
                            ))}
                          </>
                        )}

                        {/* Documents */}
                        {formation.documents?.length > 0 && (
                          <>
                            <div className="section-title p-16 bg-light border-bottom">
                              <h6 className="mb-0">
                                <i className="ph ph-file-pdf text-primary me-2"></i>
                                Documents
                              </h6>
                            </div>
                            {formation.documents.map((document, index) => (
                              <div 
                                key={`doc-${index}`}
                                className="curriculam-item p-16"
                              >
                                <div className="d-flex align-items-center">
                                  <i className={`ph ${hasPaid ? 'ph-file-pdf' : 'ph-lock'} text-primary me-12`}></i>
                                  <div className="flex-grow-1">
                                    <h6 className="mb-0">
                                      {document.title}
                                      {!hasPaid && <span className="ms-2 badge bg-warning">Premium</span>}
                                    </h6>
                                    <small className="text-neutral-500">Document PDF</small>
                                  </div>
                                  {hasPaid ? (
                                    <a
                                      href={document.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="btn btn-sm btn-link"
                                    >
                                      <i className="ph ph-download"></i>
                                    </a>
                                  ) : (
                                    <i className="ph ph-lock text-neutral-500"></i>
                                  )}
                                </div>
                              </div>
                            ))}
                          </>
                        )}

                        {/* Quiz */}
                        {formation.quizzes?.length > 0 && (
                          <>
                            <div className="section-title p-16 bg-light border-bottom">
                              <h6 className="mb-0">
                                <i className="ph ph-exam text-primary me-2"></i>
                                Quiz
                              </h6>
                            </div>
                            {formation.quizzes.map((quiz, index) => (
                              <div 
                                key={`quiz-${index}`}
                                className="curriculam-item p-16"
                              >
                                <div className="d-flex align-items-center">
                                  <i className={`ph ${hasPaid ? 'ph-exam' : 'ph-lock'} text-primary me-12`}></i>
                                  <div className="flex-grow-1">
                                    <h6 className="mb-0">
                                      {quiz.title}
                                      {!hasPaid && <span className="ms-2 badge bg-warning">Premium</span>}
                                    </h6>
                                    <small className="text-neutral-500">{quiz.questions.length} questions</small>
                                  </div>
                                  {hasPaid ? (
                                    <Link 
                                      href={`/quiz/${quiz._id}`}
                                      className="btn btn-sm btn-link"
                                    >
                                      <i className="ph ph-play-circle"></i>
                                    </Link>
                                  ) : (
                                    <i className="ph ph-lock text-neutral-500"></i>
                                  )}
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          .course-details {
            background: linear-gradient(to bottom, #f8f9fa, #ffffff);
          }

          .video-container {
            position: relative;
            padding-top: 56.25%;
            background-color: #000;
          }

          .video-container video {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .curriculam-item {
            cursor: pointer;
            transition: all 0.3s ease;
            border-bottom: 1px solid rgba(0,0,0,0.1);
          }

          .curriculam-item:last-child {
            border-bottom: none;
          }

          .curriculam-item:hover {
            background-color: #f8f9fa;
          }

          @media (max-width: 768px) {
            .course-details__sidebar {
              margin-top: 2rem;
            }
          }

          .section-title {
            background-color: rgba(37, 99, 235, 0.05);
          }

          .section-title h6 {
            font-weight: 600;
            color: #1a1a1a;
          }

          .btn-link {
            color: #2563eb;
            padding: 0.25rem 0.5rem;
            transition: all 0.2s ease;
          }

          .btn-link:hover {
            color: #1e40af;
            background-color: rgba(37, 99, 235, 0.1);
            border-radius: 0.375rem;
          }
        `}</style>
      </section>
    </>
  );
};

export default FormationDetails; 