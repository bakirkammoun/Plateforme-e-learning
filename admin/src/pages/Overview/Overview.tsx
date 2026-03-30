import React from "react";
import DemographicCard from "../../components/ecommerce/DemographicCard";
import CountryMap from "../../components/ecommerce/CountryMap";

const Overview: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 2xl:p-10">
      <div className="flex flex-col gap-4 md:gap-6 2xl:gap-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Vue d'ensemble
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Aperçu de la répartition géographique et démographique des étudiants
          </p>
        </div>

        {/* Cartes d'information */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Carte démographique */}
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <DemographicCard />
          </div>

          {/* Carte des pays */}
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <CountryMap />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview; 