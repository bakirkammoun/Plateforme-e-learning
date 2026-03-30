import React, { useEffect, useState } from "react";
import axios from "axios";

interface TopCourse {
  id: string;
  title: string;
  category: string;
  students: number;
  totalStudents: number;
  percentage: number;
}

const TopCourses: React.FC = () => {
  const [courses, setCourses] = useState<TopCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopCourses = async () => {
      try {
        const response = await axios.get('/api/admin/top-courses');
        
        // Vérifier si response.data est un tableau et contient des données
        if (!Array.isArray(response.data) || response.data.length === 0) {
          setCourses([]);
          setLoading(false);
          return;
        }
        
        // Calculer le nombre total d'étudiants
        const totalStudents = response.data.reduce((sum: number, course: any) => {
          return sum + (course.students || 0);
        }, 0);
        
        // Ajouter le pourcentage pour chaque formation
        const coursesWithPercentage = response.data.map((course: any) => {
          const students = course.students || 0;
          const percentage = totalStudents > 0 ? (students / totalStudents) * 100 : 0;
          
          return {
            id: course.id || course._id || '',
            title: course.title || 'Sans titre',
            category: course.category || 'Non catégorisé',
            students: students,
            totalStudents: totalStudents,
            percentage: percentage
          };
        });
        
        setCourses(coursesWithPercentage);
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement des formations:', err);
        setError("Erreur lors du chargement des formations populaires");
        setLoading(false);
      }
    };

    fetchTopCourses();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
        <div className="flex items-center justify-center h-64 text-red-500">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
        <div className="flex items-center justify-center h-64 text-gray-500">
          <p>Aucune formation disponible</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex flex-col gap-5 mb-6 sm:flex-row sm:justify-between">
        <div className="w-full">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Formations les Plus Populaires
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Top 5 des formations par nombre d'étudiants
          </p>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <table className="w-full min-w-[640px] table-auto">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              <th className="px-3 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                Formation
              </th>
              <th className="px-3 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                Catégorie
              </th>
              <th className="px-3 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                Étudiants
              </th>
              <th className="px-3 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                Pourcentage
              </th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr
                key={course.id}
                className="border-b border-gray-200 last:border-b-0 dark:border-gray-800"
              >
                <td className="whitespace-nowrap px-3 py-4">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                        {course.title}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {course.category}
                  </p>
                </td>
                <td className="whitespace-nowrap px-3 py-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {course.students}
                  </p>
                </td>
                <td className="whitespace-nowrap px-3 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                      <div 
                        className="bg-primary h-2.5 rounded-full" 
                        style={{ width: `${course.percentage || 0}%` }}
                      ></div>
                    </div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {(course.percentage || 0).toFixed(1)}%
                    </p>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TopCourses; 