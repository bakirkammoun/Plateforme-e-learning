'use client';

import { useEffect, useState } from 'react';
import HeaderStudent from '@/components/Header';
import axios from 'axios';
import Link from 'next/link';

const StudentDashboard = () => {
  const [stats, setStats] = useState({
    enrolledCourses: 0,
    completedCourses: 0,
    upcomingEvents: 0,
    totalProgress: 0
  });
  const [recentCourses, setRecentCourses] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get('http://localhost:5000/api/student/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data.stats);
      setRecentCourses(response.data.recentCourses);
      setUpcomingEvents(response.data.upcomingEvents);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
      setLoading(false);
    }
  };

  return (
    <>
      <HeaderStudent />
      
      <section className="student-dashboard py-80 bg-gradient-to-b from-gray-50 to-white">
        <div className="container">
          {/* En-tête du tableau de bord */}
          <div className="text-center mb-60">
            <h1 className="display-4 mb-16">Tableau de bord étudiant</h1>
            <p className="text-neutral-500 max-w-600 mx-auto">
              Suivez votre progression et accédez à vos cours et événements
            </p>
          </div>

          {loading ? (
            <div className="text-center py-80">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
            </div>
          ) : (
            <>
              {/* Cartes de statistiques */}
              <div className="row g-4 mb-60">
                <div className="col-md-3">
                  <div className="stat-card bg-white rounded-16 p-24 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="d-flex align-items-center mb-16">
                      <div className="stat-icon bg-primary-soft rounded-circle p-12 me-16">
                        <i className="ph ph-book-open text-primary fs-24"></i>
                      </div>
                      <h3 className="fw-bold mb-0">{stats.enrolledCourses}</h3>
                    </div>
                    <p className="text-muted mb-0">Cours inscrits</p>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="stat-card bg-white rounded-16 p-24 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="d-flex align-items-center mb-16">
                      <div className="stat-icon bg-success-soft rounded-circle p-12 me-16">
                        <i className="ph ph-check-circle text-success fs-24"></i>
                      </div>
                      <h3 className="fw-bold mb-0">{stats.completedCourses}</h3>
                    </div>
                    <p className="text-muted mb-0">Cours terminés</p>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="stat-card bg-white rounded-16 p-24 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="d-flex align-items-center mb-16">
                      <div className="stat-icon bg-warning-soft rounded-circle p-12 me-16">
                        <i className="ph ph-calendar text-warning fs-24"></i>
                      </div>
                      <h3 className="fw-bold mb-0">{stats.upcomingEvents}</h3>
                    </div>
                    <p className="text-muted mb-0">Événements à venir</p>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="stat-card bg-white rounded-16 p-24 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="d-flex align-items-center mb-16">
                      <div className="stat-icon bg-info-soft rounded-circle p-12 me-16">
                        <i className="ph ph-chart-line text-info fs-24"></i>
                      </div>
                      <h3 className="fw-bold mb-0">{stats.totalProgress}%</h3>
                    </div>
                    <p className="text-muted mb-0">Progression globale</p>
                  </div>
                </div>
              </div>

              {/* Cours récents et événements */}
              <div className="row g-4">
                {/* Cours récents */}
                <div className="col-lg-8">
                  <div className="bg-white rounded-16 p-32 shadow-sm">
                    <div className="d-flex justify-content-between align-items-center mb-32">
                      <h3 className="mb-0">Cours récents</h3>
                      <Link href="/mes-cours" className="btn btn-primary rounded-pill">
                        Voir tous les cours
                      </Link>
                    </div>
                    <div className="row g-4">
                      {recentCourses.map((course) => (
                        <div key={course._id} className="col-md-6">
                          <div className="course-card bg-gray-50 rounded-12 p-16 hover:shadow-md transition-all duration-300">
                            <div className="d-flex align-items-center mb-16">
                              <img 
                                src={course.image || '/assets/images/course-placeholder.jpg'} 
                                alt={course.title}
                                className="rounded-8 me-16"
                                style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                              />
                              <div>
                                <h4 className="mb-4">{course.title}</h4>
                                <p className="text-muted mb-0">{course.instructor}</p>
                              </div>
                            </div>
                            <div className="progress mb-16" style={{ height: '6px' }}>
                              <div 
                                className="progress-bar bg-primary" 
                                role="progressbar" 
                                style={{ width: `${course.progress}%` }}
                              ></div>
                            </div>
                            <div className="d-flex justify-content-between align-items-center">
                              <span className="text-muted">Progression: {course.progress}%</span>
                              <Link href={`/course-details/${course._id}`} className="btn btn-link text-primary p-0">
                                Continuer
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Événements à venir */}
                <div className="col-lg-4">
                  <div className="bg-white rounded-16 p-32 shadow-sm">
                    <h3 className="mb-32">Événements à venir</h3>
                    <div className="events-list">
                      {upcomingEvents.map((event) => (
                        <div key={event._id} className="event-item d-flex align-items-center mb-24 last:mb-0">
                          <div className="event-date bg-primary-soft rounded-8 p-12 me-16 text-center">
                            <div className="text-primary fw-bold">{new Date(event.startDate).getDate()}</div>
                            <div className="text-primary text-sm">{new Date(event.startDate).toLocaleString('fr-FR', { month: 'short' })}</div>
                          </div>
                          <div>
                            <h4 className="mb-4">{event.title}</h4>
                            <p className="text-muted mb-0">{event.startTime}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <style jsx>{`
          .stat-card {
            transition: all 0.3s ease;
          }

          .stat-card:hover {
            transform: translateY(-5px);
          }

          .course-card {
            transition: all 0.3s ease;
          }

          .course-card:hover {
            transform: translateY(-3px);
          }

          .event-item {
            transition: all 0.3s ease;
          }

          .event-item:hover {
            transform: translateX(5px);
          }

          .progress {
            background-color: #e9ecef;
          }

          .progress-bar {
            transition: width 0.6s ease;
          }

          @media (max-width: 768px) {
            .stat-card {
              margin-bottom: 1rem;
            }
          }
        `}</style>
      </section>
    </>
  );
};

export default StudentDashboard; 