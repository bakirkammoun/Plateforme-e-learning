import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import Breadcrumb from '../../components/Breadcrumb';

interface Archive {
  _id: string;
  type: 'event' | 'formation' | 'enrollment' | 'cv';
  originalId: string;
  data: any;
  archivedAt: string;
  archivedBy?: {
    firstName: string;
    lastName: string;
  };
}

const ITEMS_PER_PAGE = 12;

const Archives = () => {
  const [archives, setArchives] = useState<Archive[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const tabs = [
    { id: 'all', label: 'Tout', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
    { id: 'event', label: 'Événements', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { id: 'formation', label: 'Formations', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  ];

  const fetchArchives = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Veuillez vous connecter pour accéder aux archives');
        navigate('/auth/signin');
        return;
      }

      const response = await axios.get('http://localhost:5000/api/archives', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data && Array.isArray(response.data.data)) {
        setArchives(response.data.data);
      } else {
        console.error('Format de réponse invalide:', response.data);
        toast.error('Erreur lors de la récupération des archives');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des archives:', error);
      toast.error('Erreur lors de la récupération des archives');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchives();
  }, []);

  const handleRestore = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Veuillez vous connecter pour restaurer un élément');
        navigate('/auth/signin');
        return;
      }

      await axios.post(
        `http://localhost:5000/api/archives/${id}/restore`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      toast.success('Élément restauré avec succès');
      fetchArchives();
    } catch (error) {
      console.error('Erreur lors de la restauration:', error);
      toast.error('Erreur lors de la restauration');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer définitivement cet élément ?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Veuillez vous connecter pour supprimer un élément');
        navigate('/auth/signin');
        return;
      }

      await axios.delete(`http://localhost:5000/api/archives/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      toast.success('Élément supprimé avec succès');
      fetchArchives();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const filteredArchives = archives.filter(archive => {
    const matchesType = activeTab === 'all' || archive.type === activeTab;
    const matchesSearch = searchTerm === '' || 
      (archive.data.title && archive.data.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (archive.data.name && archive.data.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const paginatedArchives = filteredArchives.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const pageCount = Math.ceil(filteredArchives.length / ITEMS_PER_PAGE);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'event':
        return 'bg-success/10 text-success';
      case 'formation':
        return 'bg-primary/10 text-primary';
      default:
        return 'bg-warning/10 text-warning';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'event':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'formation':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        );
    }
  };

  const renderArchiveContent = (archive: Archive) => {
    switch (archive.type) {
      case 'event':
        return (
          <div>
            <h3 className="text-lg font-semibold">{archive.data.title}</h3>
            <p className="text-gray-600">{archive.data.description}</p>
            <p className="text-sm text-gray-500">
              Date: {new Date(archive.data.date).toLocaleDateString()}
            </p>
          </div>
        );
      case 'formation':
        return (
          <div>
            <h3 className="text-lg font-semibold">{archive.data.title}</h3>
            <p className="text-gray-600">{archive.data.description}</p>
            <p className="text-sm text-gray-500">
              Durée: {archive.data.duration} heures
            </p>
          </div>
        );
      default:
        return (
          <div>
            <h3 className="text-lg font-semibold">{archive.data.title}</h3>
            <p className="text-gray-600">{archive.data.description}</p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Breadcrumb pageName="Archives" />

      <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold text-black dark:text-white">
              Archives
            </h2>
            <p className="text-base text-gray-600 dark:text-gray-400">
              {filteredArchives.length} élément{filteredArchives.length > 1 ? 's' : ''} archivé{filteredArchives.length > 1 ? 's' : ''}
            </p>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-80 rounded-lg border-[1.5px] border-stroke bg-transparent py-3 pl-12 pr-4 outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
          </div>
        </div>

        <div className="mb-6 border-b border-stroke dark:border-strokedark">
          <div className="flex flex-wrap gap-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-t-md px-4 py-3 text-sm font-medium transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
          </div>
        ) : filteredArchives.length === 0 ? (
          <div className="flex h-40 items-center justify-center">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              <p className="mt-4 text-gray-500 dark:text-gray-400">
                Aucun élément archivé trouvé
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3 2xl:gap-7.5">
              {paginatedArchives.map((archive) => (
                <div
                  key={archive._id}
                  className="group relative rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark hover:shadow-lg transition-all duration-300"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${getTypeColor(archive.type)}`}>
                      {getTypeIcon(archive.type)}
                      {archive.type === 'event' ? 'Événement' : 'Formation'}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(archive.archivedAt)}
                    </span>
                  </div>

                  <h3 className="mb-2 text-xl font-semibold text-black dark:text-white">
                    {archive.data.title || archive.data.name}
                  </h3>

                  <p className="mb-4 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {archive.data.description}
                  </p>

                  <div className="flex items-center justify-center">
                    <button
                      onClick={() => handleDelete(archive._id)}
                      className="inline-flex items-center justify-center rounded-md bg-danger py-2 px-4 text-sm font-medium text-white hover:bg-opacity-90"
                    >
                      <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {pageCount > 1 && (
              <div className="flex justify-center mt-8 mb-4">
                <nav className="flex space-x-2" aria-label="Pagination">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="px-3 py-2 rounded-lg border border-stroke text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:border-strokedark dark:hover:bg-meta-4"
                  >
                    Précédent
                  </button>
                  
                  {Array.from({ length: pageCount }, (_, i) => i + 1).map((pageNumber) => (
                    <button
                      key={pageNumber}
                      onClick={() => setPage(pageNumber)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium ${
                        pageNumber === page
                          ? 'bg-primary text-white'
                          : 'border border-stroke hover:bg-gray-100 dark:border-strokedark dark:hover:bg-meta-4'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  ))}

                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === pageCount}
                    className="px-3 py-2 rounded-lg border border-stroke text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:border-strokedark dark:hover:bg-meta-4"
                  >
                    Suivant
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default Archives; 