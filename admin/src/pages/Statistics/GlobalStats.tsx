import React from "react";
import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics";
import SalesOverview from "../../components/ecommerce/SalesOverview";
import TopProducts from "../../components/ecommerce/TopProducts";
import MonthlySalesChart from "../../components/ecommerce/MonthlySalesChart";
import MonthlyTarget from "../../components/ecommerce/MonthlyTarget";
import RecentOrders from "../../components/ecommerce/RecentOrders";

const GlobalStats: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 2xl:p-10">
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          Statistiques Globales
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Vue d'ensemble des performances de la plateforme
        </p>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <EcommerceMetrics />
      </div>

      {/* Première rangée */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <MonthlySalesChart />
        <MonthlyTarget />
      </div>

      {/* Deuxième rangée - SalesOverview et TopProducts côte à côte */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SalesOverview />
        <TopProducts />
      </div>

      {/* Inscriptions récentes */}
      <div className="w-full">
        <RecentOrders />
      </div>
    </div>
  );
};

export default GlobalStats; 