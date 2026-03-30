import React, { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import axios from "axios";

interface CategoryData {
  category: string;
  count: number;
}

const CourseOverview: React.FC = () => {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/admin/course-categories');
        setCategories(response.data);
      } catch (error) {
        console.error('Erreur lors de la récupération des catégories:', error);
        setError('Impossible de charger les données des catégories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const options: ApexOptions = {
    chart: {
      type: "donut",
      fontFamily: "Outfit, sans-serif",
    },
    colors: ["#4B70E2", "#38BDF8", "#10B981"],
    labels: categories.map(cat => cat.category),
    legend: {
      position: "bottom",
      horizontalAlign: "center",
      fontSize: "14px",
      markers: {
        size: 12,
      },
      itemMargin: {
        horizontal: 15,
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: "70%",
          labels: {
            show: true,
            name: {
              fontSize: "14px",
              offsetY: 0,
            },
            value: {
              fontSize: "16px",
              fontWeight: 600,
              formatter: function (val) {
                return val + " formations";
              },
            },
            total: {
              show: true,
              fontSize: "16px",
              fontWeight: 600,
              label: "Total",
              formatter: function (w) {
                return (
                  w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0) +
                  " formations"
                );
              },
            },
          },
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          legend: {
            position: "bottom",
          },
        },
      },
    ],
  };

  const series = categories.map(cat => cat.count);

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
        <div className="flex h-64 items-center justify-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
        <div className="flex h-64 items-center justify-center">
          <div className="rounded-lg bg-danger-500 bg-opacity-10 p-4 text-center">
            <svg className="mx-auto h-12 w-12 text-danger-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="mt-2 text-danger-500">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex flex-col gap-5 mb-6 sm:flex-row sm:justify-between">
        <div className="w-full">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Répartition des Formations par Catégorie
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Distribution des formations par catégorie
          </p>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[300px] xl:min-w-full">
          <Chart options={options} series={series} type="donut" height={350} />
        </div>
      </div>
    </div>
  );
};

export default CourseOverview; 