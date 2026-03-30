import React, { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { MoreDotIcon } from "../../icons";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import axios from "axios";

const StudentProgressChart: React.FC = () => {
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchMonthlyData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/admin/monthly-metrics');
        setChartData(response.data);
      } catch (error) {
        console.error('Erreur lors de la récupération des données mensuelles:', error);
        setError('Impossible de charger les données mensuelles');
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlyData();
  }, []);

  const options: ApexOptions = {
    chart: {
      type: "line",
      fontFamily: "Outfit, sans-serif",
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
      animations: {
        enabled: true,
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350
        }
      }
    },
    colors: ["#4F46E5", "#10B981", "#F59E0B"], // Indigo pour les étudiants, Vert pour les formations, Orange pour les inscriptions
    stroke: {
      width: [3, 3, 3],
      curve: "smooth",
      dashArray: [0, 0, 0]
    },
    grid: {
      borderColor: "#f1f1f1",
      strokeDashArray: 4,
      xaxis: {
        lines: {
          show: true
        }
      },
      yaxis: {
        lines: {
          show: true
        }
      }
    },
    markers: {
      size: 6,
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: {
        size: 8
      }
    },
    xaxis: {
      categories: chartData?.labels || [],
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      },
      labels: {
        style: {
          colors: "#64748b",
          fontSize: "13px",
          fontFamily: "Outfit, sans-serif"
        }
      }
    },
    legend: {
      position: "top",
      horizontalAlign: "left",
      fontSize: "14px",
      markers: {
        size: 6
      },
      itemMargin: {
        horizontal: 15
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: ["#64748b"],
          fontSize: "13px",
          fontFamily: "Outfit, sans-serif"
        },
        formatter: (value: number) => `${value}`
      },
      title: {
        text: "Nombre",
        style: {
          fontSize: '13px',
          fontFamily: 'Outfit, sans-serif',
          color: '#64748b'
        }
      }
    },
    tooltip: {
      theme: "dark",
      y: {
        formatter: (value: number) => `${value}`
      },
      style: {
        fontSize: '13px',
        fontFamily: 'Outfit, sans-serif'
      }
    },
    fill: {
      type: "gradient",
      gradient: {
        shade: "light",
        type: "vertical",
        shadeIntensity: 0.3,
        opacityFrom: 0.6,
        opacityTo: 0.1,
        stops: [0, 90, 100]
      }
    }
  };

  const series = chartData ? [
    {
      name: "Étudiants Inscrits",
      data: chartData.studentData
    },
    {
      name: "Formations Créées",
      data: chartData.formationData
    },
    {
      name: "Inscriptions aux Formations",
      data: chartData.enrollmentData
    }
  ] : [];

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

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
            Progression des Étudiants et Formations
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Suivi des inscriptions d'étudiants et des formations créées
          </p>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[600px] xl:min-w-full">
          <Chart 
            options={options} 
            series={series} 
            type="line" 
            height={350} 
          />
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="relative inline-block">
          <button onClick={toggleDropdown} className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 dark:hover:bg-white/5">
            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
          </button>
          <Dropdown
            isOpen={isOpen}
            onClose={closeDropdown}
            className="w-48 p-2"
          >
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-left text-gray-600 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Voir les détails
            </DropdownItem>
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-left text-gray-600 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Exporter les données
            </DropdownItem>
          </Dropdown>
        </div>
      </div>
    </div>
  );
};

export default StudentProgressChart;
