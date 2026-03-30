import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import Breadcrumb from '../../components/Breadcrumb';
import { Modal } from '../../components/ui/modal';
import { useModal } from '../../hooks/useModal';

interface Formation {
  _id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  duration: number;
  price: number;
  image: string;
  instructorId: {
    firstName: string;
    lastName: string;
    email: string;
  };
  status: string;
  rating: number;
  numberOfRatings: number;
  createdAt: string;
}

interface Stats {
  totalFormations: number;
  publishedFormations: number;
  averageRating: number;
  totalStudents: number;
}

const ITEMS_PER_PAGE = 9;

const FormationsList = () => {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [currentPage, setCurrentPage] = useState(1);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const courseId = searchParams.get('courseId');

  const categories = ['Développement Web', 'Design', 'Marketing', 'Business', 'Autre'];
  const levels = ['Débutant', 'Intermédiaire', 'Avancé'];
  const statuses = ['draft', 'pending', 'published', 'rejected'];

  useEffect(() => {
    fetchFormations();
  }, [courseId]);

  useEffect(() => {
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedLevel, selectedStatus, sortBy]);

  const fetchFormations = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/formations');
      let data = response.data;
      
      // Si un courseId est spécifié, filtrer pour ne montrer que cette formation
      if (courseId) {
        data = data.filter((formation: Formation) => formation._id === courseId);
      }
      
      setFormations(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching formations:', error);
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette formation ?')) {
      try {
        await axios.delete(`http://localhost:5000/api/formations/${id}`);
        fetchFormations();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const filteredFormations = formations
    .filter(formation => {
      const matchesSearch = formation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          formation.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (formation.instructorId && 
                            `${formation.instructorId.firstName} ${formation.instructorId.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || formation.category === selectedCategory;
      const matchesLevel = selectedLevel === 'all' || formation.level === selectedLevel;
      const matchesStatus = selectedStatus === 'all' || formation.status === selectedStatus;
      return matchesSearch && matchesCategory && matchesLevel && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'price':
          return a.price - b.price;
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  // Pagination calculations
  const totalPages = Math.ceil(filteredFormations.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedFormations = filteredFormations.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getRatingStars = (rating: number) => {
    return [...Array(5)].map((_, index) => (
      <svg
        key={index}
        className={`w-4 h-4 ${index < rating ? 'text-yellow-400' : 'text-gray-300'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      published: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || colors.draft;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return (
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'pending':
        return (
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'draft':
        return (
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <>
      <Breadcrumb pageName="Liste des Formations" />
      
      {/* Filtres et recherche */}
      <div className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-4">
            <div className="w-full sm:w-auto">
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
              />
            </div>
            <div className="w-full sm:w-auto">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
              >
                <option value="all">Toutes les catégories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full sm:w-auto">
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
              >
                <option value="all">Tous les niveaux</option>
                {levels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full sm:w-auto">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
              >
                <option value="all">Tous les statuts</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="w-full sm:w-auto">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
            >
              <option value="date">Plus récent</option>
              <option value="rating">Meilleure note</option>
              <option value="price">Prix</option>
              <option value="title">Titre</option>
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3 2xl:gap-7.5">
          {paginatedFormations.map((formation) => (
            <div
              key={formation._id}
              className="group relative rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark hover:shadow-lg transition-all duration-300"
            >
              <div className="relative mb-4 overflow-hidden rounded-lg">
                <img
                  src={formation.image}
                  alt={formation.title}
                  className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute top-4 right-4 flex items-center space-x-2">
                  <span className={`flex items-center rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(formation.status)}`}>
                    {getStatusIcon(formation.status)}
                    {formation.status.charAt(0).toUpperCase() + formation.status.slice(1)}
                  </span>
                </div>
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                  <span className="rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                    {formation.duration}h
                  </span>
                  <span className="rounded-full bg-primary/50 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                    {formation.price}DT
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {formation.category}
                </span>
                <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
                  {formation.level}
                </span>
              </div>

              <h3 className="mb-2 text-xl font-semibold text-black dark:text-white line-clamp-1">
                {formation.title}
              </h3>

              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {formation.description}
              </p>

              <div className="mb-4 flex items-center gap-2">
                <div className="flex items-center">
                  {getRatingStars(formation.rating)}
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  ({formation.numberOfRatings} avis)
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src={`https://ui-avatars.com/api/?name=${formation.instructorId?.firstName}+${formation.instructorId?.lastName}&background=random`}
                    alt="Instructor"
                    className="h-8 w-8 rounded-full ring-2 ring-primary/30"
                  />
                  <span className="text-sm font-medium text-black dark:text-white">
                    {formation.instructorId ? 
                      `${formation.instructorId.firstName} ${formation.instructorId.lastName}` : 
                      'Instructeur non assigné'}
                  </span>
                </div>
              </div>

              <div className="absolute inset-x-4 bottom-4 flex items-center justify-between opacity-0 transition-all duration-300 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0">
                <Link
                  to={`/formations/${formation._id}`}
                  className="rounded-lg bg-primary py-2 px-4 text-sm font-medium text-white hover:bg-opacity-90 transition-colors duration-300 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Voir les détails
                </Link>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette formation ?')) {
                      handleDelete(formation._id);
                    }
                  }}
                  className="rounded-lg bg-danger py-2 px-4 text-sm font-medium text-white hover:bg-opacity-90 transition-colors duration-300 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Supprimer
                </button>
              </div>

              {/* Ajout d'un overlay au survol */}
              <div className="absolute inset-0 bg-black/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100 rounded-sm flex items-center justify-center">
                <div className="flex flex-col gap-3">
                  <Link
                    to={`/formations/${formation._id}`}
                    className="rounded-lg bg-white py-2 px-6 text-sm font-medium text-gray-900 hover:bg-gray-100 transition-colors duration-300 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Voir les détails
                  </Link>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Êtes-vous sûr de vouloir supprimer cette formation ?')) {
                        handleDelete(formation._id);
                      }
                    }}
                    className="rounded-lg bg-red-500 py-2 px-6 text-sm font-medium text-white hover:bg-red-600 transition-colors duration-300 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8 mb-4">
            <nav className="flex space-x-2" aria-label="Pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-lg border border-stroke text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:border-strokedark dark:hover:bg-meta-4"
              >
                Précédent
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  onClick={() => handlePageChange(pageNumber)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    pageNumber === currentPage
                      ? 'bg-primary text-white'
                      : 'border border-stroke hover:bg-gray-100 dark:border-strokedark dark:hover:bg-meta-4'
                  }`}
                >
                  {pageNumber}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded-lg border border-stroke text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:border-strokedark dark:hover:bg-meta-4"
              >
                Suivant
              </button>
            </nav>
          </div>
        )}

        {paginatedFormations.length === 0 && (
          <div className="flex h-40 items-center justify-center">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="mt-4 text-gray-500 dark:text-gray-400">
                Aucune formation ne correspond à vos critères
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default FormationsList; 