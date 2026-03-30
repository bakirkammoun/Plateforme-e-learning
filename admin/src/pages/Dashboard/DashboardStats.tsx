import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Breadcrumb from '../../components/Breadcrumb';
import PageMeta from "../../components/common/PageMeta";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

interface Stats {
  totalFormations: number;
  totalStudents: number;
  totalInstructors: number;
  pendingApprovals: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  activeStudents: number;
  averageRating: number;
  totalEvents: number;
}

const DashboardStats = () => {
  const [stats, setStats] = useState<Stats>({
    totalFormations: 0,
    totalStudents: 0,
    totalInstructors: 0,
    pendingApprovals: 0,
    revenueThisMonth: 0,
    revenueLastMonth: 0,
    activeStudents: 0,
    averageRating: 0,
    totalEvents: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [chartData] = useState({
    options: {
      chart: {
        type: 'area',
        height: 350,
        toolbar: {
          show: false
        }
      },
      colors: ['#3B82F6'],
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'smooth'
      },
      xaxis: {
        categories: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'],
      },
      tooltip: {
        x: {
          format: 'dd/MM/yy HH:mm'
        },
      },
    } as ApexOptions,
    series: [{
      name: 'Inscriptions',
      data: [30, 40, 35, 50, 49, 60, 70, 91, 125, 150, 160, 180]
    }]
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('http://localhost:5000/api/admin/dashboard-stats');
      setStats(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      setError('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    // Formater le nombre avec séparateurs de milliers
    const formattedNumber = new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
    
    // Ajouter le symbole DT
    return `${formattedNumber} DT`;
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="rounded-lg bg-danger-500 bg-opacity-10 p-4 text-center">
          <svg className="mx-auto h-12 w-12 text-danger-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="mt-2 text-danger-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Breadcrumb pageName="Tableau de bord" />

      <PageMeta
        title="Tableau de bord | Smart Tech"
        description="Tableau de bord de la plateforme Smart Tech"
      />
      
      <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-black dark:text-white">
            Tableau de bord
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Vue d'ensemble de votre plateforme de formation
          </p>
        </div>

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
          {/* Carte Total des Formations */}
          <div className="rounded-xl border border-stroke bg-white py-6 px-7.5 shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total des Formations
                </span>
                <h3 className="mt-2 text-3xl font-bold text-black dark:text-white">
                  {stats.totalFormations}
                </h3>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary bg-opacity-10">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-primary">
                  <path d="M3 5H21V19H3V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 9H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M7 13H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="flex items-center gap-1 text-sm font-medium text-success-500">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3V13M8 3L4 7M8 3L12 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                12%
              </span>
              <span className="ml-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                depuis le mois dernier
              </span>
            </div>
          </div>

          {/* Carte Total des Étudiants */}
          <div className="rounded-xl border border-stroke bg-white py-6 px-7.5 shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total des Étudiants
                </span>
                <h3 className="mt-2 text-3xl font-bold text-black dark:text-white">
                  {stats.totalStudents}
                </h3>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-500 bg-opacity-10">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-success-500">
                  <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="flex items-center gap-1 text-sm font-medium text-success-500">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3V13M8 3L4 7M8 3L12 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                15%
              </span>
              <span className="ml-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                depuis le mois dernier
              </span>
            </div>
          </div>

          {/* Carte Total des Instructeurs */}
          <div className="rounded-xl border border-stroke bg-white py-6 px-7.5 shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total des Instructeurs
                </span>
                <h3 className="mt-2 text-3xl font-bold text-black dark:text-white">
                  {stats.totalInstructors}
                </h3>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success bg-opacity-10">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-success">
                  <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="flex items-center gap-1 text-sm font-medium text-success-500">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3V13M8 3L4 7M8 3L12 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                15%
              </span>
              <span className="ml-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                depuis le mois dernier
              </span>
            </div>
          </div>

          {/* Carte Revenus du Mois */}
          <div className="rounded-xl border border-stroke bg-white py-6 px-7.5 shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Revenus du Mois
                </span>
                <h3 className="mt-2 text-3xl font-bold text-black dark:text-white">
                  {formatCurrency(stats.revenueThisMonth)}
                </h3>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary bg-opacity-10">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-primary">
                  <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="currentColor"/>
                  <path d="M12.5 7H11V13L16.2 16.2L17 14.9L12.5 12.2V7Z" fill="currentColor"/>
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="flex items-center gap-1 text-sm font-medium text-success-500">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3V13M8 3L4 7M8 3L12 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                8%
              </span>
              <span className="ml-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                depuis le mois dernier
              </span>
            </div>
          </div>
        </div>

        {/* Graphique des inscriptions */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 2xl:gap-7.5">
          <div className="rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
            <h4 className="mb-6 text-xl font-semibold text-black dark:text-white">
              Évolution des inscriptions
            </h4>
            <div className="h-[350px]">
              <Chart
                options={chartData.options}
                series={chartData.series}
                type="area"
                height={350}
              />
            </div>
          </div>

          {/* Statistiques détaillées */}
          <div className="rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
            <h4 className="mb-6 text-xl font-semibold text-black dark:text-white">
              Statistiques détaillées
            </h4>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Étudiants actifs
                  </p>
                  <h5 className="mt-1 text-lg font-bold text-black dark:text-white">
                    {stats.activeStudents}
                  </h5>
                </div>
                <span className="flex items-center gap-1 text-sm font-medium text-success-500">
                  +15%
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Formations en attente
                  </p>
                  <h5 className="mt-1 text-lg font-bold text-black dark:text-white">
                    {stats.pendingApprovals}
                  </h5>
                </div>
                <span className="flex items-center gap-1 text-sm font-medium text-warning">
                  En attente
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total des événements
                  </p>
                  <h5 className="mt-1 text-lg font-bold text-black dark:text-white">
                    {stats.totalEvents}
                  </h5>
                </div>
                <span className="flex items-center gap-1 text-sm font-medium text-success-500">
                  Planifiés
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardStats;
