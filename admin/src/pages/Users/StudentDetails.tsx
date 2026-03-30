import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Breadcrumb from '../../components/Breadcrumb';

interface Formation {
  _id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  instructorId: {
    firstName: string;
    lastName: string;
    email: string;
  };
  image?: string;
  rating?: number;
  duration?: string;
  progress?: number;
  startDate?: string;
  endDate?: string;
}

interface Event {
  _id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  location: string;
  image?: string;
  instructorId: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  isApproved: boolean;
  phone?: string;
  joinedDate?: string;
  address?: string;
  bio?: string;
}

const StudentDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [formations, setFormations] = useState<Formation[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'formations' | 'events'>('formations');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [stats, setStats] = useState({
    totalFormations: 0,
    completedFormations: 0,
    averageProgress: 0,
    averageRating: 0,
    totalEvents: 0
  });

  useEffect(() => {
    const fetchStudentDetails = async () => {
      try {
        const studentResponse = await fetch(`http://localhost:5000/api/admin/users/${id}`);
        const studentData = await studentResponse.json();
        setStudent(studentData);

        const formationsResponse = await fetch(`http://localhost:5000/api/formations/student/${id}`);
        const formationsData = await formationsResponse.json();
        setFormations(formationsData);

        const eventsResponse = await fetch(`http://localhost:5000/api/events/student/${id}`);
        const eventsData = await eventsResponse.json();
        setEvents(eventsData);

        // Calculer les statistiques
        const completedFormations = formationsData.filter((f: Formation) => (f.progress || 0) === 100).length;
        const progressValues = formationsData.map((f: Formation) => f.progress || 0);
        const averageProgress = progressValues.length > 0 
          ? progressValues.reduce((a: number, b: number) => a + b) / progressValues.length 
          : 0;
        const ratings = formationsData.filter((f: Formation) => f.rating).map((f: Formation) => f.rating as number);
        const averageRating = ratings.length > 0 
          ? ratings.reduce((a: number, b: number) => a + b) / ratings.length 
          : 0;

        setStats({
          totalFormations: formationsData.length,
          completedFormations,
          averageProgress,
          averageRating,
          totalEvents: eventsData.length
        });
      } catch (error) {
        console.error('Erreur lors de la récupération des détails:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentDetails();
  }, [id]);

  // Calculer les éléments à afficher pour la page courante
  const getCurrentPageItems = (items: any[], page: number) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  };

  // Calculer le nombre total de pages
  const getTotalPages = (items: any[]) => {
    return Math.ceil(items.length / itemsPerPage);
  };

  // Gérer le changement de page
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg text-gray-500">Étudiant non trouvé</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <>
      <Breadcrumb pageName="Détails de l'étudiant" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-5 2xl:gap-7.5">
        <div className="rounded-sm border border-stroke bg-white py-6 px-7.5 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium">Total Formations</span>
              <h4 className="text-title-md font-bold text-black dark:text-white">
                {stats.totalFormations}
              </h4>
            </div>
            <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M16.5 4.125H5.5C4.74061 4.125 4.125 4.74061 4.125 5.5V16.5C4.125 17.2594 4.74061 17.875 5.5 17.875H16.5C17.2594 17.875 17.875 17.2594 17.875 16.5V5.5C17.875 4.74061 17.2594 4.125 16.5 4.125Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4.125 8.25H17.875" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8.25 4.125V17.875" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-sm border border-stroke bg-white py-6 px-7.5 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium">Formations Complétées</span>
              <h4 className="text-title-md font-bold text-black dark:text-white">
                {stats.completedFormations}
              </h4>
            </div>
            <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M11 2L15.09 6.09L22 7.1L16.5 11.97L17.18 18.9L11 15.65L4.82 18.9L5.5 11.97L0 7.1L6.91 6.09L11 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-sm border border-stroke bg-white py-6 px-7.5 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium">Progression Moyenne</span>
              <h4 className="text-title-md font-bold text-black dark:text-white">
                {stats.averageProgress.toFixed(1)}%
              </h4>
            </div>
            <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M11 2V11L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M11 22C17.0751 22 22 17.0751 22 11C22 4.92487 17.0751 0 11 0C4.92487 0 0 4.92487 0 11C0 17.0751 4.92487 22 11 22Z" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-sm border border-stroke bg-white py-6 px-7.5 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium">Note Moyenne</span>
              <h4 className="text-title-md font-bold text-black dark:text-white">
                {stats.averageRating.toFixed(1)}/5
              </h4>
            </div>
            <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M11 1L14.09 7.26L21 8.27L16 13.14L17.18 20.02L11 16.77L4.82 20.02L6 13.14L1 8.27L7.91 7.26L11 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-sm border border-stroke bg-white py-6 px-7.5 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium">Événements Rejoints</span>
              <h4 className="text-title-md font-bold text-black dark:text-white">
                {stats.totalEvents}
              </h4>
            </div>
            <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M16 2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M8 2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M3 10H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        <div className="mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
            <img
              src={`https://ui-avatars.com/api/?name=${student.firstName}+${student.lastName}&background=random&size=200`}
              alt={`${student.firstName} ${student.lastName}`}
              className="h-32 w-32 rounded-xl object-cover shadow-lg"
            />
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-black dark:text-white">
                    {student.firstName} {student.lastName}
                  </h2>
                  <p className="text-sm text-gray-500">{student.email}</p>
                  {student.address && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {student.address}
                    </p>
                  )}
                </div>
                <div className="mt-4 md:mt-0">
                  <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                    student.isApproved
                      ? 'bg-success-500 bg-opacity-10 text-success-500'
                      : 'bg-danger-500 bg-opacity-10 text-danger-500'
                  }`}>
                    {student.isApproved ? 'Compte actif' : 'Compte inactif'}
                  </span>
                </div>
              </div>
              {student.bio && (
                <p className="mt-4 text-gray-600 dark:text-gray-400">
                  {student.bio}
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-4">
                {student.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {student.phone}
                  </div>
                )}
                {student.joinedDate && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Membre depuis {formatDate(student.joinedDate)}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div className="flex gap-4">
                  <button
                    onClick={() => setActiveTab('formations')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'formations'
                        ? 'bg-primary text-white'
                        : 'text-gray-500 hover:text-primary'
                    }`}
                  >
                    Formations suivies
                  </button>
                  <button
                    onClick={() => setActiveTab('events')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'events'
                        ? 'bg-primary text-white'
                        : 'text-gray-500 hover:text-primary'
                    }`}
                  >
                    Événements rejoints
                  </button>
                </div>
              </div>

              {activeTab === 'formations' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {formations.length > 0 ? (
                      getCurrentPageItems(formations, currentPage).map((formation) => (
                        <div
                          key={formation._id}
                          className="group relative rounded-lg border border-stroke bg-white p-4 shadow-default transition-all hover:shadow-md dark:border-strokedark dark:bg-boxdark"
                        >
                          {formation.image ? (
                            <img
                              src={formation.image}
                              alt={formation.title}
                              className="mb-4 h-48 w-full rounded-lg object-cover"
                            />
                          ) : (
                            <div className="mb-4 flex h-48 w-full items-center justify-center rounded-lg bg-gray-100 dark:bg-meta-4">
                              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                                <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" strokeWidth="1.5"/>
                                <path d="M8.5 10C9.32843 10 10 9.32843 10 8.5C10 7.67157 9.32843 7 8.5 7C7.67157 7 7 7.67157 7 8.5C7 9.32843 7.67157 10 8.5 10Z" stroke="currentColor" strokeWidth="1.5"/>
                                <path d="M21 15L16 10L5 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          )}
                          <h4 className="text-lg font-semibold text-black dark:text-white mb-2">
                            {formation.title}
                          </h4>
                          <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                            {formation.description}
                          </p>
                          <div className="flex flex-wrap gap-2 mb-3">
                            <span className="inline-flex rounded-full px-3 py-1 text-xs font-medium bg-primary bg-opacity-10 text-primary">
                              {formation.category}
                            </span>
                            <span className="inline-flex rounded-full px-3 py-1 text-xs font-medium bg-warning bg-opacity-10 text-warning">
                              {formation.level}
                            </span>
                            {formation.duration && (
                              <span className="inline-flex rounded-full px-3 py-1 text-xs font-medium bg-success-500 bg-opacity-10 text-success-500">
                                {formation.duration}
                              </span>
                            )}
                          </div>
                          {formation.progress !== undefined && (
                            <>
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span className="text-gray-500">Progression</span>
                                <span className="font-medium text-primary">
                                  {formation.progress}%
                                </span>
                              </div>
                              <div className="h-2 w-full rounded-full bg-stroke dark:bg-strokedark">
                                <div
                                  className="h-full rounded-full bg-primary"
                                  style={{ width: `${formation.progress}%` }}
                                ></div>
                              </div>
                            </>
                          )}
                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5"/>
                                <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                              </svg>
                              {formation.startDate && formation.endDate ? (
                                <>
                                  {formatDate(formation.startDate)} - {formatDate(formation.endDate)}
                                </>
                              ) : (
                                'Dates non spécifiées'
                              )}
                            </div>
                            {formation.rating && (
                              <div className="flex items-center gap-1">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                  <path d="M11 1L14.09 7.26L21 8.27L16 13.14L17.18 20.02L11 16.77L4.82 20.02L6 13.14L1 8.27L7.91 7.26L11 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                <span className="text-sm font-medium">{formation.rating}/5</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 dark:text-gray-400 col-span-full">
                        Aucune formation suivie
                      </p>
                    )}
                  </div>
                  {formations.length > itemsPerPage && (
                    <div className="mt-6 flex justify-center">
                      <nav className="flex items-center gap-2">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className={`px-3 py-1 rounded-lg text-sm font-medium ${
                            currentPage === 1
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-primary text-white hover:bg-primary/90'
                          }`}
                        >
                          Précédent
                        </button>
                        <span className="px-3 py-1 text-sm font-medium">
                          Page {currentPage} sur {getTotalPages(formations)}
                        </span>
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === getTotalPages(formations)}
                          className={`px-3 py-1 rounded-lg text-sm font-medium ${
                            currentPage === getTotalPages(formations)
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-primary text-white hover:bg-primary/90'
                          }`}
                        >
                          Suivant
                        </button>
                      </nav>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'events' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {events.length > 0 ? (
                      getCurrentPageItems(events, currentPage).map((event) => (
                        <div
                          key={event._id}
                          className="group relative rounded-lg border border-stroke bg-white p-4 shadow-default transition-all hover:shadow-md dark:border-strokedark dark:bg-boxdark"
                        >
                          {event.image ? (
                            <img
                              src={event.image}
                              alt={event.title}
                              className="mb-4 h-48 w-full rounded-lg object-cover"
                            />
                          ) : (
                            <div className="mb-4 flex h-48 w-full items-center justify-center rounded-lg bg-gray-100 dark:bg-meta-4">
                              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                                <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="currentColor" strokeWidth="1.5"/>
                                <path d="M16 2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                <path d="M8 2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                <path d="M3 10H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                              </svg>
                            </div>
                          )}
                          <h4 className="text-lg font-semibold text-black dark:text-white mb-2">
                            {event.title}
                          </h4>
                          <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                            {event.description}
                          </p>
                          <div className="flex flex-wrap gap-2 mb-3">
                            <span className="inline-flex rounded-full px-3 py-1 text-xs font-medium bg-primary bg-opacity-10 text-primary">
                              {event.location}
                            </span>
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5"/>
                                <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                              </svg>
                              {formatDate(event.startDate)} - {formatDate(event.endDate)}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M12 8V12L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5"/>
                              </svg>
                              {event.startTime} - {event.endTime}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 dark:text-gray-400 col-span-full">
                        Aucun événement rejoint
                      </p>
                    )}
                  </div>
                  {events.length > itemsPerPage && (
                    <div className="mt-6 flex justify-center">
                      <nav className="flex items-center gap-2">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className={`px-3 py-1 rounded-lg text-sm font-medium ${
                            currentPage === 1
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-primary text-white hover:bg-primary/90'
                          }`}
                        >
                          Précédent
                        </button>
                        <span className="px-3 py-1 text-sm font-medium">
                          Page {currentPage} sur {getTotalPages(events)}
                        </span>
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === getTotalPages(events)}
                          className={`px-3 py-1 rounded-lg text-sm font-medium ${
                            currentPage === getTotalPages(events)
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-primary text-white hover:bg-primary/90'
                          }`}
                        >
                          Suivant
                        </button>
                      </nav>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StudentDetails; 