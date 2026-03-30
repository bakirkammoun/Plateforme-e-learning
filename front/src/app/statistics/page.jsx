'use client';

import { useState, useEffect } from 'react';
import HeaderInstructor from '@/components/Header';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import axios from 'axios';

// Enregistrer les composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const StatisticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
    totalEvents: 0,
    totalRevenue: 0,
    courseEngagement: [],
    studentProgress: [],
    eventAttendance: [],
    categoryDistribution: [],
    monthlyEnrollments: [],
    dailyActiveUsers: []
  });

  useEffect(() => {
    // Simuler le chargement des données
    const fetchData = async () => {
      try {
        // Ici vous feriez normalement des appels API réels
        const mockData = {
          totalStudents: 1250,
          totalCourses: 45,
          totalEvents: 28,
          totalRevenue: 75000,
          courseEngagement: [85, 75, 92, 68, 95, 82, 88],
          studentProgress: [65, 70, 75, 80, 85, 82, 88],
          eventAttendance: [120, 150, 140, 160, 180, 165, 190],
          categoryDistribution: [30, 25, 20, 15, 10],
          monthlyEnrollments: [150, 180, 200, 220, 240, 260, 280, 300, 320, 340, 360, 380],
          dailyActiveUsers: [500, 520, 480, 550, 600, 580, 620]
        };

        setStats(mockData);
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Configuration des graphiques
  const lineOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  const monthlyEnrollmentsData = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
    datasets: [
      {
        label: 'Inscriptions mensuelles',
        data: stats.monthlyEnrollments,
        fill: true,
        borderColor: '#0d6efd',
        backgroundColor: 'rgba(13, 110, 253, 0.1)',
        tension: 0.4
      }
    ]
  };

  const categoryData = {
    labels: ['Développement', 'Design', 'Business', 'Marketing', 'Autres'],
    datasets: [
      {
        data: stats.categoryDistribution,
        backgroundColor: [
          '#0d6efd',
          '#20c997',
          '#ffc107',
          '#dc3545',
          '#6c757d'
        ]
      }
    ]
  };

  const engagementData = {
    labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
    datasets: [
      {
        label: 'Engagement des cours',
        data: stats.courseEngagement,
        backgroundColor: '#0d6efd'
      }
    ]
  };

  return (
    <div className="statistics-page">
      <HeaderInstructor />
      
      <div className="statistics-content py-100">
        <div className="container">
          {/* En-tête de la page */}
          <div className="page-header text-center mb-50">
            <h1 className="fw-bold mb-16">Tableau de bord analytique</h1>
            <p className="text-muted">Aperçu complet des performances et des statistiques</p>
          </div>

          {/* Cartes de statistiques */}
          <div className="row g-4 mb-50">
            <div className="col-md-3">
              <div className="stat-card bg-white rounded-16 p-24 shadow-sm">
                <div className="d-flex align-items-center mb-16">
                  <div className="stat-icon bg-primary-soft rounded-circle p-12 me-16">
                    <i className="ph ph-users text-primary fs-24"></i>
                  </div>
                  <h3 className="fw-bold mb-0">{stats.totalStudents}</h3>
                </div>
                <p className="text-muted mb-0">Étudiants inscrits</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="stat-card bg-white rounded-16 p-24 shadow-sm">
                <div className="d-flex align-items-center mb-16">
                  <div className="stat-icon bg-success-soft rounded-circle p-12 me-16">
                    <i className="ph ph-book-open text-success fs-24"></i>
                  </div>
                  <h3 className="fw-bold mb-0">{stats.totalCourses}</h3>
                </div>
                <p className="text-muted mb-0">Cours actifs</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="stat-card bg-white rounded-16 p-24 shadow-sm">
                <div className="d-flex align-items-center mb-16">
                  <div className="stat-icon bg-warning-soft rounded-circle p-12 me-16">
                    <i className="ph ph-calendar text-warning fs-24"></i>
                  </div>
                  <h3 className="fw-bold mb-0">{stats.totalEvents}</h3>
                </div>
                <p className="text-muted mb-0">Événements organisés</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="stat-card bg-white rounded-16 p-24 shadow-sm">
                <div className="d-flex align-items-center mb-16">
                  <div className="stat-icon bg-info-soft rounded-circle p-12 me-16">
                    <i className="ph ph-currency-circle-dollar text-info fs-24"></i>
                  </div>
                  <h3 className="fw-bold mb-0">{stats.totalRevenue}DT</h3>
                </div>
                <p className="text-muted mb-0">Revenu total</p>
              </div>
            </div>
          </div>

          {/* Graphiques */}
          <div className="row g-4 mb-50">
            {/* Inscriptions mensuelles */}
            <div className="col-lg-8">
              <div className="chart-card bg-white rounded-16 p-24 shadow-sm">
                <h4 className="fw-bold mb-24">Évolution des inscriptions</h4>
                <Line options={lineOptions} data={monthlyEnrollmentsData} height={100} />
              </div>
            </div>

            {/* Distribution des catégories */}
            <div className="col-lg-4">
              <div className="chart-card bg-white rounded-16 p-24 shadow-sm">
                <h4 className="fw-bold mb-24">Catégories de cours</h4>
                <Doughnut data={categoryData} />
              </div>
            </div>
          </div>

          {/* Engagement et performance */}
          <div className="row g-4">
            {/* Engagement des cours */}
            <div className="col-lg-6">
              <div className="chart-card bg-white rounded-16 p-24 shadow-sm">
                <h4 className="fw-bold mb-24">Engagement hebdomadaire</h4>
                <Bar options={lineOptions} data={engagementData} height={100} />
              </div>
            </div>

            {/* Statistiques détaillées */}
            <div className="col-lg-6">
              <div className="stats-details bg-white rounded-16 p-24 shadow-sm">
                <h4 className="fw-bold mb-24">Statistiques détaillées</h4>
                <div className="stat-item mb-16 pb-16 border-bottom">
                  <div className="d-flex justify-content-between mb-8">
                    <span className="text-muted">Taux de complétion moyen</span>
                    <span className="fw-bold">78%</span>
                  </div>
                  <div className="progress" style={{ height: '6px' }}>
                    <div className="progress-bar bg-primary" style={{ width: '78%' }}></div>
                  </div>
                </div>
                <div className="stat-item mb-16 pb-16 border-bottom">
                  <div className="d-flex justify-content-between mb-8">
                    <span className="text-muted">Satisfaction étudiante</span>
                    <span className="fw-bold">92%</span>
                  </div>
                  <div className="progress" style={{ height: '6px' }}>
                    <div className="progress-bar bg-success" style={{ width: '92%' }}></div>
                  </div>
                </div>
                <div className="stat-item mb-16 pb-16 border-bottom">
                  <div className="d-flex justify-content-between mb-8">
                    <span className="text-muted">Participation aux événements</span>
                    <span className="fw-bold">85%</span>
                  </div>
                  <div className="progress" style={{ height: '6px' }}>
                    <div className="progress-bar bg-warning" style={{ width: '85%' }}></div>
                  </div>
                </div>
                <div className="stat-item">
                  <div className="d-flex justify-content-between mb-8">
                    <span className="text-muted">Engagement sur la plateforme</span>
                    <span className="fw-bold">88%</span>
                  </div>
                  <div className="progress" style={{ height: '6px' }}>
                    <div className="progress-bar bg-info" style={{ width: '88%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .statistics-page {
          background-color: #f8f9fa;
          min-height: 100vh;
        }

        .py-100 {
          padding-top: 100px;
          padding-bottom: 100px;
        }

        .rounded-16 {
          border-radius: 16px;
        }

        .shadow-sm {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .bg-primary-soft {
          background-color: rgba(13, 110, 253, 0.1);
        }

        .bg-success-soft {
          background-color: rgba(32, 201, 151, 0.1);
        }

        .bg-warning-soft {
          background-color: rgba(255, 193, 7, 0.1);
        }

        .bg-info-soft {
          background-color: rgba(13, 202, 240, 0.1);
        }

        .text-primary {
          color: #0d6efd;
        }

        .text-success {
          color: #20c997;
        }

        .text-warning {
          color: #ffc107;
        }

        .text-info {
          color: #0dcaf0;
        }

        .fs-24 {
          font-size: 24px;
        }

        .chart-card {
          min-height: 400px;
        }

        .progress {
          background-color: #e9ecef;
          border-radius: 3px;
          overflow: hidden;
        }

        @media (max-width: 768px) {
          .py-100 {
            padding-top: 60px;
            padding-bottom: 60px;
          }

          .chart-card {
            min-height: 300px;
          }
        }
      `}</style>
    </div>
  );
};

export default StatisticsPage; 