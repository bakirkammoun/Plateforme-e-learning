import React, { useEffect, useState } from "react";
import { ArrowUpIcon } from "@heroicons/react/24/outline";
import axios from "axios";

interface MetricData {
  value: number;
  change: number;
}

interface DashboardMetrics {
  purchasedStudents: MetricData;
  topEnrolledCourses: MetricData;
  quizPassRate: MetricData;
  averageCourseRating: MetricData;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  bgColor: string;
  textColor: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon,
  bgColor,
  textColor,
}) => (
  <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-boxdark">
    <div className={`absolute right-0 top-0 h-24 w-24 ${bgColor} opacity-10 blur-2xl`} />
    <div className="relative flex items-center justify-between">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </span>
        <div className="mt-2 flex items-baseline">
          <h3 className={`text-2xl font-bold ${textColor}`}>
            {value}
          </h3>
        </div>
        <div className="mt-2 flex items-center">
          <ArrowUpIcon className="h-4 w-4 text-success-500" />
          <span className="ml-1 text-sm font-medium text-success-500">
            +{change}%
          </span>
          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
            vs mois précédent
          </span>
        </div>
      </div>
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${bgColor} ${textColor}`}>
        {icon}
      </div>
    </div>
  </div>
);

const EducationalMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await axios.get('/api/admin/dashboard-metrics');
        setMetrics(response.data);
      } catch (error) {
        console.error('Erreur lors du chargement des métriques:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading || !metrics) {
    return null;
  }

  const metricsData = [
    {
      title: "Étudiants Inscrits",
      value: metrics.purchasedStudents.value.toLocaleString(),
      change: metrics.purchasedStudents.change,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      bgColor: "bg-primary-500",
      textColor: "text-primary-500",
    },
    {
      title: "Formations Populaires",
      value: metrics.topEnrolledCourses.value.toLocaleString(),
      change: metrics.topEnrolledCourses.change,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      bgColor: "bg-success-500",
      textColor: "text-success-500",
    },
    {
      title: "Réussite aux Quiz",
      value: `${metrics.quizPassRate.value}%`,
      change: metrics.quizPassRate.change,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      bgColor: "bg-warning-500",
      textColor: "text-warning-500",
    },
    {
      title: "Note Globale",
      value: `${metrics.averageCourseRating.value}/5`,
      change: metrics.averageCourseRating.change,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
      bgColor: "bg-info-500",
      textColor: "text-info-500",
    },
  ];

  return (
    <>
      {metricsData.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </>
  );
};

export default EducationalMetrics;
