import React, { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { MoreDotIcon } from "../../icons";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import axios from "axios";

interface EventMetrics {
  progressRate: number;
  participationRate: number;
  totalEvents: number;
  completedEvents: number;
  upcomingEvents: number;
  totalParticipants: number;
  totalCapacity: number;
  upcomingCapacity: number;
  participantsByEvent: Record<string, number>;
  mostPopularEvent: string | null;
  maxParticipants: number;
}

export default function EventProgress() {
  const [metrics, setMetrics] = useState<EventMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchEventMetrics = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/admin/event-metrics');
        setMetrics(response.data);
      } catch (error) {
        console.error('Erreur lors de la récupération des métriques des événements:', error);
        setError('Impossible de charger les données des événements');
      } finally {
        setLoading(false);
      }
    };

    fetchEventMetrics();
  }, []);

  // Calculer le pourcentage des événements à venir
  const totalEventsCount = metrics?.totalEvents || 0;
  const upcomingEventsCount = metrics?.upcomingEvents || 0;
  const upcomingEventsPercentage = totalEventsCount > 0 ? 
    Math.round((upcomingEventsCount / totalEventsCount) * 100) : 0;

  const series = [upcomingEventsPercentage];

  const options: ApexOptions = {
    colors: ["#4F46E5"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "radialBar",
      height: 330,
      sparkline: {
        enabled: true,
      },
      animations: {
        enabled: true,
        speed: 1000,
        animateGradually: {
          enabled: true,
          delay: 150
        }
      }
    },
    plotOptions: {
      radialBar: {
        startAngle: -135,
        endAngle: 135,
        hollow: {
          size: "75%",
          background: "transparent",
          image: undefined,
          margin: 15,
        },
        track: {
          background: "#E4E7EC",
          strokeWidth: "100%",
          margin: 5,
          dropShadow: {
            enabled: false,
          }
        },
        dataLabels: {
          name: {
            show: false,
          },
          value: {
            fontSize: "36px",
            fontWeight: "600",
            offsetY: -10,
            color: "#1D2939",
            formatter: function (val) {
              return val + "%";
            },
          },
        },
      },
    },
    fill: {
      type: "gradient",
      gradient: {
        shade: "dark",
        type: "horizontal",
        shadeIntensity: 0.5,
        gradientToColors: ["#6366F1"],
        stops: [0, 100]
      }
    },
    stroke: {
      lineCap: "round",
      dashArray: 4
    },
    labels: ["Événements à venir"],
  };

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="px-5 pt-5 bg-white shadow-default rounded-2xl pb-11 dark:bg-gray-900 sm:px-6 sm:pt-6">
          <div className="flex h-64 items-center justify-center">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="px-5 pt-5 bg-white shadow-default rounded-2xl pb-11 dark:bg-gray-900 sm:px-6 sm:pt-6">
          <div className="flex h-64 items-center justify-center">
            <div className="rounded-lg bg-danger-500 bg-opacity-10 p-4 text-center">
              <svg className="mx-auto h-12 w-12 text-danger-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="mt-2 text-danger-500">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="px-5 pt-5 bg-white shadow-default rounded-2xl pb-11 dark:bg-gray-900 sm:px-6 sm:pt-6">
        <div className="flex justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Événements à Venir
            </h3>
            <p className="mt-1 text-gray-500 text-theme-xs dark:text-gray-400">
              Pourcentage des événements à venir par rapport au total
            </p>
          </div>
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
                Exporter le rapport
              </DropdownItem>
            </Dropdown>
          </div>
        </div>
        <div className="relative">
          <div className="max-h-[330px]">
            <Chart
              options={options}
              series={series}
              type="radialBar"
              height={330}
            />
          </div>

          <span className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-[95%] rounded-full bg-success-50 px-3 py-1 text-xs font-medium text-success-600 dark:bg-success-500/15 dark:text-success-500">
            {upcomingEventsCount} événements à venir sur {totalEventsCount} au total
          </span>
        </div>
        <p className="mx-auto mt-10 w-full max-w-[380px] text-center text-sm text-gray-500 sm:text-base">
          {upcomingEventsCount} événements à venir sur {totalEventsCount} au total.
        </p>
      </div>

      <div className="flex items-center justify-center gap-5 px-6 py-3.5 sm:gap-8 sm:py-5">
        <div>
          <p className="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">
            Événements à venir
          </p>
          <p className="flex items-center justify-center gap-1 text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
            {metrics?.upcomingEvents}
            <svg className="w-4 h-4 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </p>
        </div>

        <div className="w-px bg-gray-200 h-7 dark:bg-gray-800"></div>

        <div>
          <p className="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">
            Capacité des événements à venir
          </p>
          <p className="flex items-center justify-center gap-1 text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
            {metrics?.upcomingCapacity}
            <svg className="w-4 h-4 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </p>
        </div>
      </div>
    </div>
  );
}
