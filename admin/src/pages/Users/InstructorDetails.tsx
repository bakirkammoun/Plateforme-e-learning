import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Breadcrumb from '../../components/Breadcrumb';
import { toast } from 'react-hot-toast';

interface Formation {
  _id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  image?: string;
  rating?: number;
  duration?: string;
  enrolledStudents: string[];
  startDate?: string;
  endDate?: string;
}

interface Event {
  _id: string;
  title: string;
  description: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  image?: string;
  category: string;
  maxParticipants: number;
  participants: string[];
}

interface Instructor {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  cv: string;
  isApproved: boolean;
  joinedDate?: string;
  address?: string;
  bio?: string;
  specialization?: string;
}

const InstructorDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [formations, setFormations] = useState<Formation[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [activeTab, setActiveTab] = useState<'formations' | 'events'>('formations');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [stats, setStats] = useState({
    totalFormations: 0,
    totalEvents: 0,
    totalStudents: 0,
    totalParticipants: 0,
    averageRating: 0
  });

  useEffect(() => {
    const fetchInstructorDetails = async () => {
      try {
        const instructorResponse = await fetch(`http://localhost:5000/api/admin/users/${id}`);
        const instructorData = await instructorResponse.json();
        setInstructor(instructorData);

        const formationsResponse = await fetch(`http://localhost:5000/api/formations/instructor/${id}`);
        const formationsData = await formationsResponse.json();
        setFormations(formationsData);

        const eventsResponse = await fetch(`http://localhost:5000/api/events/instructor/${id}`);
        if (!eventsResponse.ok) {
          throw new Error(`HTTP error! status: ${eventsResponse.status}`);
        }
        const eventsData = await eventsResponse.json();
        setEvents(eventsData);

        // Calculate statistics
        const totalStudents = formationsData.reduce((acc: number, formation: Formation) => 
          acc + formation.enrolledStudents.length, 0);
        const totalParticipants = eventsData.reduce((acc: number, event: Event) => 
          acc + event.participants.length, 0);
        const ratings = formationsData
          .filter((f: Formation) => f.rating)
          .map((f: Formation) => f.rating as number);
        const averageRating = ratings.length > 0 
          ? ratings.reduce((a: number, b: number) => a + b) / ratings.length 
          : 0;

        setStats({
          totalFormations: formationsData.length,
          totalEvents: eventsData.length,
          totalStudents,
          totalParticipants,
          averageRating
        });
      } catch (error) {
        console.error('Erreur lors de la récupération des détails:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInstructorDetails();
  }, [id]);

  const handleDownloadCV = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/cv/download/${instructor.cv}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download CV');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CV_${instructor.firstName}_${instructor.lastName}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading CV:', error);
      toast.error('Failed to download CV');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!instructor) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg text-gray-500">Instructeur non trouvé</p>
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

  const getEventStatus = (event: Event): 'upcoming' | 'ongoing' | 'completed' => {
    const now = new Date();
    const startDate = new Date(event.startDate || '');
    const endDate = new Date(event.endDate || '');

    if (now < startDate) return 'upcoming';
    if (now > endDate) return 'completed';
    return 'ongoing';
  };

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

  return (
    <>
      <Breadcrumb pageName="Détails de l'instructeur" />

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
              <span className="text-sm font-medium">Total Événements</span>
              <h4 className="text-title-md font-bold text-black dark:text-white">
                {stats.totalEvents}
              </h4>
            </div>
            <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M17.875 3.4375H4.125C3.71079 3.4375 3.4375 3.71079 3.4375 4.125V17.875C3.4375 18.2892 3.71079 18.5625 4.125 18.5625H17.875C18.2892 18.5625 18.5625 18.2892 18.5625 17.875V4.125C18.5625 3.71079 18.2892 3.4375 17.875 3.4375Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15.125 2.0625V4.8125" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6.875 2.0625V4.8125" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3.4375 7.5625H18.5625" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-sm border border-stroke bg-white py-6 px-7.5 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium">Total Étudiants</span>
              <h4 className="text-title-md font-bold text-black dark:text-white">
                {stats.totalStudents}
              </h4>
            </div>
            <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M11 14.4375C14.4518 14.4375 17.25 13.0811 17.25 11.375C17.25 9.66886 14.4518 8.3125 11 8.3125C7.54822 8.3125 4.75 9.66886 4.75 11.375C4.75 13.0811 7.54822 14.4375 11 14.4375Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M11 8.3125C14.4518 8.3125 17.25 6.95614 17.25 5.25C17.25 3.54386 14.4518 2.1875 11 2.1875C7.54822 2.1875 4.75 3.54386 4.75 5.25C4.75 6.95614 7.54822 8.3125 11 8.3125Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4.75 11.375V17.5C4.75 19.2062 7.54822 20.5625 11 20.5625C14.4518 20.5625 17.25 19.2062 17.25 17.5V11.375" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-sm border border-stroke bg-white py-6 px-7.5 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium">Total Participants</span>
              <h4 className="text-title-md font-bold text-black dark:text-white">
                {stats.totalParticipants}
              </h4>
            </div>
            <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M11 14.4375C14.4518 14.4375 17.25 13.0811 17.25 11.375C17.25 9.66886 14.4518 8.3125 11 8.3125C7.54822 8.3125 4.75 9.66886 4.75 11.375C4.75 13.0811 7.54822 14.4375 11 14.4375Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M17.875 5.5C19.2062 5.5 20.5625 4.14368 20.5625 2.8125" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4.125 5.5C2.79375 5.5 1.4375 4.14368 1.4375 2.8125" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M17.875 17.875C19.2062 17.875 20.5625 19.2313 20.5625 20.5625" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4.125 17.875C2.79375 17.875 1.4375 19.2313 1.4375 20.5625" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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
      </div>

      <div className="mt-4 rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        <div className="mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
            <div className="w-full md:w-1/4">
              <div className="bg-gray-100 rounded-lg p-4 text-center">
                <div className="w-32 h-32 mx-auto rounded-full bg-gray-200 flex items-center justify-center text-4xl font-bold text-gray-500">
                  {instructor.firstName.charAt(0)}{instructor.lastName.charAt(0)}
                </div>
                <h2 className="text-xl font-semibold mt-4">{instructor.firstName} {instructor.lastName}</h2>
                <p className="text-gray-600">{instructor.email}</p>
                {instructor.cv && (
                  <button
                    onClick={handleDownloadCV}
                    className="mt-4 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Download CV
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-black dark:text-white">
                    {instructor.firstName} {instructor.lastName}
                  </h2>
                  <p className="text-sm text-gray-500">{instructor.email}</p>
                  {instructor.specialization && (
                    <p className="text-sm font-medium text-primary mt-1">
                      {instructor.specialization}
                    </p>
                  )}
                  {instructor.address && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {instructor.address}
                    </p>
                  )}
                </div>
                <div className="mt-4 md:mt-0">
                  <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                    instructor.isApproved
                      ? 'bg-success-500 bg-opacity-10 text-success-500'
                      : 'bg-danger-500 bg-opacity-10 text-danger-500'
                  }`}>
                    {instructor.isApproved ? 'Compte actif' : 'Compte inactif'}
                  </span>
                </div>
              </div>
              {instructor.bio && (
                <p className="mt-4 text-gray-600 dark:text-gray-400">
                  {instructor.bio}
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-4">
                {instructor.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {instructor.phone}
                  </div>
                )}
                {instructor.joinedDate && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Membre depuis {formatDate(instructor.joinedDate)}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mb-4 border-b border-stroke dark:border-strokedark">
            <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
              <li className="mr-2">
                <button
                  onClick={() => setActiveTab('formations')}
                  className={`inline-flex items-center justify-center p-4 border-b-2 rounded-t-lg group ${
                    activeTab === 'formations'
                      ? 'text-primary border-primary'
                      : 'border-transparent hover:text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="mr-2">
                    <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M3 9H21" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M9 21V9" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                  Formations
                  <span className="ml-2 bg-meta-1 rounded-full px-2 py-0.5 text-xs font-medium">
                    {formations.length}
                  </span>
                </button>
              </li>
              <li className="mr-2">
                <button
                  onClick={() => setActiveTab('events')}
                  className={`inline-flex items-center justify-center p-4 border-b-2 rounded-t-lg group ${
                    activeTab === 'events'
                      ? 'text-primary border-primary'
                      : 'border-transparent hover:text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="mr-2">
                    <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M16 2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M8 2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M3 10H21" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                  Événements
                  <span className="ml-2 bg-meta-1 rounded-full px-2 py-0.5 text-xs font-medium">
                    {events.length}
                  </span>
                </button>
              </li>
            </ul>
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
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                          {formation.enrolledStudents.length} étudiants
                        </div>
                        {formation.rating && (
                          <div className="flex items-center gap-1">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-warning">
                              <path d="M12 2L15.09 8.26L22 9.27L17 13.14L18.18 20.02L12 16.77L5.82 20.02L7 13.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span className="text-sm font-medium">{formation.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="col-span-full text-center text-gray-500 dark:text-gray-400 py-8">
                    Aucune formation créée
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
                  getCurrentPageItems(events, currentPage).map((event) => {
                    const status = getEventStatus(event);
                    return (
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
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="text-lg font-semibold text-black dark:text-white">
                            {event.title}
                          </h4>
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            status === 'upcoming'
                              ? 'bg-primary bg-opacity-10 text-primary'
                              : status === 'ongoing'
                              ? 'bg-success-500 bg-opacity-10 text-success-500'
                              : 'bg-danger-500 bg-opacity-10 text-danger-500'
                          }`}>
                            {status === 'upcoming' ? 'À venir' : status === 'ongoing' ? 'En cours' : 'Terminé'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                          {event.description}
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="currentColor" strokeWidth="1.5"/>
                              <path d="M16 2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                              <path d="M8 2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                              <path d="M3 10H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                            {formatDate(event.startDate || '')} - {formatDate(event.endDate || '')}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="1.5"/>
                              <path d="M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" stroke="currentColor" strokeWidth="1.5"/>
                            </svg>
                            {event.location}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.5"/>
                              <path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke="currentColor" strokeWidth="1.5"/>
                              <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="1.5"/>
                              <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.5"/>
                            </svg>
                            {event.participants.length}/{event.maxParticipants} participants
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="col-span-full text-center text-gray-500 dark:text-gray-400 py-8">
                    Aucun événement créé
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
    </>
  );
};

export default InstructorDetails; 