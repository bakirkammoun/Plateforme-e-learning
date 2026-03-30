import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import axios from "axios";

interface Formation {
  id: string;
  name: string;
  duration: string;
  category: string;
  price: string;
  status: "En cours" | "Terminé" | "Annulé";
  image: string;
  student: {
    name: string;
    email: string;
  };
}

export default function RecentEnrollments() {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecentEnrollments = async () => {
      try {
        const response = await axios.get('/api/admin/recent-enrollments');
        
        // Transformer les données reçues pour correspondre à l'interface Formation
        const formattedFormations = response.data.map((enrollment: any) => ({
          id: enrollment._id || enrollment.id,
          name: enrollment.formation?.title || 'Formation inconnue',
          duration: enrollment.formation?.duration || 'Non spécifié',
          category: enrollment.formation?.category || 'Non catégorisé',
          price: `${enrollment.formation?.price || 0} DT`,
          status: enrollment.status || 'En cours',
          image: enrollment.formation?.image || '/images/formations/default.jpg',
          student: {
            name: `${enrollment.student?.firstName || ''} ${enrollment.student?.lastName || ''}`.trim() || 'Étudiant inconnu',
            email: enrollment.student?.email || 'Email non disponible'
          }
        }));
        
        setFormations(formattedFormations);
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement des inscriptions récentes:', err);
        setError("Erreur lors du chargement des inscriptions récentes");
        setLoading(false);
      }
    };

    fetchRecentEnrollments();
  }, []);

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <div className="flex items-center justify-center h-64 text-red-500">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (formations.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <div className="flex items-center justify-center h-64 text-gray-500">
          <p>Aucune inscription récente</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Inscriptions Récentes
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Liste des dernières inscriptions aux formations
          </p>
        </div>
      </div>
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
            <TableRow>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Formation & Étudiant
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Catégorie
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Prix
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Statut
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {formations.map((formation) => (
              <TableRow key={formation.id}>
                <TableCell className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-[50px] w-[50px] overflow-hidden rounded-md">
                      <img
                        src={formation.image}
                        className="h-[50px] w-[50px] object-cover"
                        alt={formation.name}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/images/formations/default.jpg';
                        }}
                      />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {formation.name}
                      </p>
                      <div className="flex flex-col">
                        <span className="text-gray-500 text-theme-xs dark:text-gray-400">
                          {formation.student.name}
                        </span>
                        <span className="text-gray-400 text-theme-xs dark:text-gray-500">
                          {formation.student.email}
                        </span>
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  <div className="flex flex-col">
                    <span>{formation.category}</span>
                    <span className="text-theme-xs text-gray-400">{formation.duration}</span>
                  </div>
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {formation.price}
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  <Badge
                    size="sm"
                    color={
                      formation.status === "En cours"
                        ? "success"
                        : formation.status === "Terminé"
                        ? "primary"
                        : "error"
                    }
                  >
                    {formation.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
