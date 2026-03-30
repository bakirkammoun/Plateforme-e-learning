'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const categoryNameMapping = {
  'Languages': 'Langues',
  'Computer Science': 'Informatique',
  'School and Competition': 'Concours et Formation Scolaire'
};
const getCategoryName = (name) => categoryNameMapping[name] || name;

// Ajoute la fonction utilitaire pour parser jj/mm/aaaa
function parseFrDate(str) {
  if (!str) return null;
  const [day, month, year] = str.split('/');
  if (!day || !month || !year) return null;
  return new Date(`${year}-${month}-${day}T00:00:00`);
}

const Archive = () => {
  const [archivedFormations, setArchivedFormations] = useState([]);
  const [archivedEvents, setArchivedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    subCategory: '',
    level: '',
    dateStart: '',
    dateEnd: ''
  });
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('formations');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const fetchArchivedFormations = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Veuillez vous connecter pour voir vos archives');
        router.push('/sign-in');
        return;
      }

      const response = await axios.get('http://localhost:5000/api/formations', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          isArchived: true
        }
      });

      console.log('Formations archivées reçues:', response.data);
      setArchivedFormations(response.data.filter(f => f.isArchived));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching archived formations:', error);
      if (error.response?.status === 401) {
        toast.error('Session expirée. Veuillez vous reconnecter.');
        router.push('/sign-in');
      } else {
        setError('Erreur lors du chargement des archives');
      }
      setLoading(false);
    }
  };

  const fetchArchivedEvents = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/events/archived-events');
      if (response.data) {
        setArchivedEvents(response.data);
      } else {
        console.error('No data received from archived events API');
        setArchivedEvents([]);
      }
    } catch (error) {
      console.error('Error fetching archived events:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      setArchivedEvents([]);
      toast.error('Erreur lors du chargement des événements archivés');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/categories');
      if (response.data) {
        setCategories(response.data.filter(cat => !cat.parentCategory));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    if (filters.category) {
      axios.get('http://localhost:5000/api/categories')
        .then(res => {
          setSubCategories(res.data.filter(cat => cat.parentCategory === filters.category));
        })
        .catch(() => setSubCategories([]));
    } else {
      setSubCategories([]);
    }
  }, [filters.category]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchArchivedFormations(),
      fetchArchivedEvents(),
      fetchCategories()
    ]).finally(() => setLoading(false));
  }, [router]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Filtrage avancé
  const filteredFormations = archivedFormations.filter(formation => {
    const search = filters.search.toLowerCase();
    const matchesSearch =
      (formation.title?.toLowerCase() || '').includes(search) ||
      (formation.description?.toLowerCase() || '').includes(search);

    // Catégorie : identique à my-courses
    let matchesCategory = true;
    if (filters.category) {
      const selectedCategory = categories.find(cat => cat._id === filters.category);
      if (selectedCategory) {
        const categoryName = getCategoryName(selectedCategory.name);
        matchesCategory = formation.category === categoryName || formation.category === selectedCategory.name;
      }
    }

    // Sous-catégorie : même logique que my-courses
    let matchesSubCategory = true;
    if (filters.subCategory) {
      const selectedSubCategory = subCategories.find(cat => cat._id === filters.subCategory);
      if (selectedSubCategory) {
        matchesSubCategory = formation.subCategory === selectedSubCategory.name;
      }
    }

    const matchesLevel = !filters.level || formation.level === filters.level;

    let matchesDate = true;
    const startDate = parseFrDate(filters.dateStart);
    const endDate = parseFrDate(filters.dateEnd);
    const archivedAt = formation.archivedAt ? new Date(formation.archivedAt) : null;
    if (startDate && archivedAt) {
      matchesDate = matchesDate && archivedAt >= startDate;
    }
    if (endDate && archivedAt) {
      matchesDate = matchesDate && archivedAt <= endDate;
    }

    return matchesSearch && matchesCategory && matchesSubCategory && matchesLevel && matchesDate;
  });

  // Filtrage événements
  const filteredEvents = archivedEvents.filter(event => {
    const search = filters.search.toLowerCase();
    const matchesSearch =
      (event.title?.toLowerCase() || '').includes(search) ||
      (event.description?.toLowerCase() || '').includes(search);
    let matchesDate = true;
    const startDate = parseFrDate(filters.dateStart);
    const endDate = parseFrDate(filters.dateEnd);
    const archivedAt = event.archivedAt ? new Date(event.archivedAt) : null;
    if (startDate && archivedAt) {
      matchesDate = matchesDate && archivedAt >= startDate;
    }
    if (endDate && archivedAt) {
      matchesDate = matchesDate && archivedAt <= endDate;
    }
    return matchesSearch && matchesDate;
  });

  // Calculer les éléments à afficher pour la page courante
  const getCurrentItems = () => {
    const items = activeTab === 'formations' ? filteredFormations : filteredEvents;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  };

  // Calculer le nombre total de pages
  const getTotalPages = () => {
    const items = activeTab === 'formations' ? filteredFormations : filteredEvents;
    return Math.ceil(items.length / itemsPerPage);
  };

  // Gérer le changement de page
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRestore = async (formationId) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast.error('Veuillez vous connecter');
        return;
      }

      const response = await axios.put(`http://localhost:5000/api/formations/${formationId}/restore`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 200) {
        await fetchArchivedFormations();
        toast.success('Formation restaurée avec succès');
        
        setTimeout(() => {
          router.push('/my-courses');
        }, 1500);
      }
    } catch (error) {
      console.error('Error restoring formation:', error);
      if (error.response?.status === 401) {
        toast.error('Session expirée. Veuillez vous reconnecter.');
        router.push('/sign-in');
      } else {
        toast.error('Erreur lors de la restauration de la formation');
      }
    }
  };

  const handleRestoreEvent = async (eventId) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast.error('Veuillez vous connecter');
        return;
      }

      const response = await axios.put(`http://localhost:5000/api/events/${eventId}/restore`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 200) {
        await fetchArchivedEvents();
        toast.success('Événement restauré avec succès');
      }
    } catch (error) {
      console.error('Error restoring event:', error);
      if (error.response?.status === 401) {
        toast.error('Session expirée. Veuillez vous reconnecter.');
        router.push('/sign-in');
      } else {
        toast.error('Erreur lors de la restauration de l\'événement');
      }
    }
  };

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Chargement des archives...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
        <i className="ph-bold ph-warning"></i>
        <p className="mb-0">{error}</p>
      </div>
    );
  }

  return (
    <div className="container-fluid px-lg-80 archives-container">
      {/* Header Section */}
      <div className="row mb-5">
        <div className="col-12">
          <div className="text-center">
            <div className="d-flex align-items-center justify-content-center gap-2 mb-3">
              <i className="ph-bold ph-archive text-primary" style={{ fontSize: '2.5rem' }}></i>
              <h1 className="mb-0">Archives</h1>
            </div>
            <p className="text-muted mb-0">
              <i className="ph-bold ph-info text-primary me-2"></i>
              Gérez et restaurez vos formations et événements archivés
            </p>
          </div>
        </div>
      </div>

      {/* Onglets - toujours visibles et simples */}
      <div className="archive-tabs mb-4 d-flex gap-3 justify-content-center">
        <button
          className={`archive-tab-btn btn rounded-pill${activeTab === 'formations' ? ' active' : ''}`}
          onClick={() => setActiveTab('formations')}
          type="button"
        >
          Formations archivées
        </button>
        <button
          className={`archive-tab-btn btn rounded-pill${activeTab === 'events' ? ' active' : ''}`}
          onClick={() => setActiveTab('events')}
          type="button"
        >
          Événements archivés
        </button>
      </div>

      <div className="row g-4">
        {/* Sidebar Filter */}
        <div className={`${isSidebarOpen ? 'col-lg-3' : 'd-none'} course-sidebar-wrapper`}>
          <div className="course-sidebar">
            {/* Zone de recherche */}
            <div className="filter-section mb-4">
              <h5 className="mb-3 d-flex align-items-center gap-2">
                <i className="ph-bold ph-magnifying-glass text-primary"></i>
                Recherche
              </h5>
              <div className="search-form position-relative">
                <input
                  type="text"
                  className="form-control rounded-pill bg-light pe-48 border-0 w-100"
                  placeholder="Rechercher..."
                  value={filters.search}
                  onChange={handleFilterChange}
                  name="search"
                />
                <button
                  type="button"
                  className="w-36 h-36 bg-primary hover-bg-primary-dark rounded-circle flex-center text-md text-white position-absolute top-50 translate-middle-y end-0 me-2"
                >
                  <i className="ph-bold ph-magnifying-glass" />
                </button>
              </div>
            </div>

            {/* Filtre par catégorie (uniquement pour formations) */}
            {activeTab === 'formations' && (
              <>
                <div className="filter-section mb-4">
                  <h5 className="mb-3 d-flex align-items-center gap-2">
                    <i className="ph-bold ph-folder text-primary"></i>
                    Catégorie
                  </h5>
                  <select
                    className="form-select rounded-pill bg-light border-0 w-100"
                    value={filters.category}
                    onChange={handleFilterChange}
                    name="category"
                  >
                    <option value="">Toutes les catégories</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="filter-section mb-4">
                  <h5 className="mb-3 d-flex align-items-center gap-2">
                    <i className="ph-bold ph-folders text-primary"></i>
                    Sous-catégorie
                  </h5>
                  <select
                    className="form-select rounded-pill bg-light border-0 w-100"
                    value={filters.subCategory}
                    onChange={handleFilterChange}
                    name="subCategory"
                    disabled={!filters.category}
                  >
                    <option value="">Toutes les sous-catégories</option>
                    {subCategories.map((cat) => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="filter-section mb-4">
                  <h5 className="mb-3 d-flex align-items-center gap-2">
                    <i className="ph-bold ph-graduation-cap text-primary"></i>
                    Niveau
                  </h5>
                  <select
                    className="form-select rounded-pill bg-light border-0 w-100"
                    value={filters.level}
                    onChange={handleFilterChange}
                    name="level"
                  >
                    <option value="">Tous les niveaux</option>
                    <option value="Débutant">Débutant</option>
                    <option value="Intermédiaire">Intermédiaire</option>
                    <option value="Avancé">Avancé</option>
                  </select>
                </div>
              </>
            )}

            {/* Filtre par date d'archivage (plage de dates) */}
            <div className="filter-section mb-4">
              <h5 className="mb-3 d-flex align-items-center gap-2">
                <i className="ph-bold ph-calendar text-primary"></i>
                Date d'archivage
              </h5>
              <div className="d-flex flex-column gap-2">
                <input
                  type="text"
                  className="form-control rounded-pill bg-light border-0"
                  value={filters.dateStart}
                  onChange={handleFilterChange}
                  name="dateStart"
                  placeholder="jj/mm/aaaa"
                  maxLength={10}
                />
                <input
                  type="text"
                  className="form-control rounded-pill bg-light border-0"
                  value={filters.dateEnd}
                  onChange={handleFilterChange}
                  name="dateEnd"
                  placeholder="jj/mm/aaaa"
                  maxLength={10}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className={`${isSidebarOpen ? 'col-lg-9' : 'col-12'}`}>
          <div className="d-flex justify-content-between align-items-center mb-30">
            <div>
              <h4 className="mb-8 d-flex align-items-center gap-2">
                <i className="ph-bold ph-stack text-primary"></i>
                {activeTab === 'formations' ? 'Formations Archivées' : 'Événements Archivés'}
              </h4>
              <p className="mb-0 text-neutral-500 d-flex align-items-center gap-2">
                <i className="ph-bold ph-list text-primary"></i>
                Affichage de {activeTab === 'formations' ? filteredFormations.length : filteredEvents.length} {activeTab === 'formations' ? 'formation' : 'événement'}{(activeTab === 'formations' ? filteredFormations.length : filteredEvents.length) !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="btn btn-outline-primary rounded-pill d-flex align-items-center gap-2"
            >
              <i className={`ph-bold ${isSidebarOpen ? 'ph-x' : 'ph-funnel'}`}></i>
              {isSidebarOpen ? 'Masquer les filtres' : 'Afficher les filtres'}
            </button>
          </div>

          {activeTab === 'formations' ? (
            filteredFormations.length === 0 ? (
              <div className="text-center py-5">
                <i className="ph-bold ph-archive display-1 text-muted"></i>
                <p className="mt-3">Aucune formation archivée</p>
                <Link href="/my-courses" className="btn btn-primary mt-3 d-flex align-items-center gap-2 mx-auto">
                  <i className="ph-bold ph-arrow-left"></i>
                  Retour à mes formations
                </Link>
              </div>
            ) : (
              <>
                <div className="row g-4">
                  {getCurrentItems().map(formation => (
                    <div key={formation._id} className="col-md-6 col-lg-4">
                      <div className="course-card">
                        <div className="course-thumb">
                          <img 
                            src={formation.image || '/assets/images/default-course.png'} 
                            alt={formation.title}
                            className="course-image"
                          />
                          <div className="status-badge bg-warning">
                            Archived
                          </div>
                        </div>
                        <div className="course-content">
                          <div className="course-info">
                            <h4 className="course-title">{formation.title}</h4>
                            <p className="course-description">{formation.description}</p>
                            <div className="course-meta">
                              <div className="meta-item">
                                <i className="ph-bold ph-books text-primary"></i>
                                <span>{formation.category}</span>
                              </div>
                              <div className="meta-item">
                                <i className="ph-bold ph-chart-bar text-primary"></i>
                                <span>{formation.level}</span>
                              </div>
                              <div className="meta-item">
                                <i className="ph-bold ph-clock text-primary"></i>
                                <span>Archivé le: {new Date(formation.archivedAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          <div className="course-actions">
                            <button 
                              onClick={() => handleRestore(formation._id)}
                              className="action-btn restore-btn"
                            >
                              <i className="ph-bold ph-arrow-counter-clockwise"></i>
                              <span>Restaurer</span>
                            </button>
                            <Link 
                              href={`/course-details/${formation._id}`}
                              className="action-btn view-btn"
                            >
                              <i className="ph-bold ph-eye"></i>
                              <span>Voir</span>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {getTotalPages() > 1 && (
                  <div className="d-flex justify-content-center mt-4 mb-5">
                    <nav aria-label="Page navigation" className="pagination-container">
                      <ul className="pagination">
                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                          <button 
                            className="page-link" 
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                          >
                            <i className="ph-bold ph-caret-left"></i>
                          </button>
                        </li>
                        {Array.from({ length: getTotalPages() }, (_, i) => i + 1).map(page => (
                          <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                            <button 
                              className="page-link" 
                              onClick={() => handlePageChange(page)}
                            >
                              {page}
                            </button>
                          </li>
                        ))}
                        <li className={`page-item ${currentPage === getTotalPages() ? 'disabled' : ''}`}>
                          <button 
                            className="page-link" 
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === getTotalPages()}
                          >
                            <i className="ph-bold ph-caret-right"></i>
                          </button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                )}
              </>
            )
          ) : (
            filteredEvents.length === 0 ? (
              <div className="text-center py-5">
                <i className="ph-bold ph-calendar-x display-1 text-muted"></i>
                <p className="mt-3">Aucun événement archivé</p>
              </div>
            ) : (
              <>
                <div className="row g-4">
                  {getCurrentItems().map(event => (
                    <div key={event._id} className="col-md-6 col-lg-4">
                      <div className="course-card">
                        <div className="course-thumb">
                          <img 
                            src={event.image || '/assets/images/default-event.png'} 
                            alt={event.title}
                            className="course-image"
                          />
                          <div className="status-badge bg-warning">
                            Archived
                          </div>
                        </div>
                        <div className="course-content">
                          <div className="course-info">
                            <h4 className="course-title">{event.title}</h4>
                            <p className="course-description">{event.description}</p>
                            <div className="course-meta">
                              <div className="meta-item">
                                <i className="ph-bold ph-calendar text-primary"></i>
                                <span>{event.date ? new Date(event.date).toLocaleDateString() : ''}</span>
                              </div>
                              <div className="meta-item">
                                <i className="ph-bold ph-clock text-primary"></i>
                                <span>Archivé le: {new Date(event.archivedAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          <div className="course-actions">
                            <button 
                              onClick={() => handleRestoreEvent(event._id)}
                              className="action-btn restore-btn"
                            >
                              <i className="ph-bold ph-arrow-counter-clockwise"></i>
                              <span>Restaurer</span>
                            </button>
                            <Link 
                              href={`/event-details/${event._id}`}
                              className="action-btn view-btn"
                            >
                              <i className="ph-bold ph-eye"></i>
                              <span>Voir</span>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {getTotalPages() > 1 && (
                  <div className="d-flex justify-content-center mt-4 mb-5">
                    <nav aria-label="Page navigation" className="pagination-container">
                      <ul className="pagination">
                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                          <button 
                            className="page-link" 
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                          >
                            <i className="ph-bold ph-caret-left"></i>
                          </button>
                        </li>
                        {Array.from({ length: getTotalPages() }, (_, i) => i + 1).map(page => (
                          <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                            <button 
                              className="page-link" 
                              onClick={() => handlePageChange(page)}
                            >
                              {page}
                            </button>
                          </li>
                        ))}
                        <li className={`page-item ${currentPage === getTotalPages() ? 'disabled' : ''}`}>
                          <button 
                            className="page-link" 
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === getTotalPages()}
                          >
                            <i className="ph-bold ph-caret-right"></i>
                          </button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                )}
              </>
            )
          )}
        </div>
      </div>

      <style jsx>{`
        .archives-container {
          margin-top: 100px;
        }
        .archive-tabs {
          position: relative;
          z-index: 2;
        }
        .archive-tab-btn {
          min-width: 180px;
          font-weight: 600;
          font-size: 1rem;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
          border-width: 2px;
          background: #0d6efd;
          color: #fff;
          border-color: #0d6efd;
          transition: none;
        }
        .archive-tab-btn.active {
          background: #0d6efd;
          color: #fff;
          border-color: #0d6efd;
        }
        .archive-tab-btn:hover,
        .archive-tab-btn:focus {
          background: #0d6efd;
          color: #fff;
          border-color: #0d6efd;
        }
        @media (max-width: 576px) {
          .archive-tabs {
            flex-direction: column;
            gap: 12px;
          }
          .archive-tab-btn {
            width: 100%;
            min-width: unset;
          }
        }
        .course-card {
          background: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 2px 15px rgba(0, 0, 0, 0.05);
          border: 1px solid rgba(0, 0, 0, 0.04);
          transition: all 0.3s ease;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .course-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
        }

        .course-thumb {
          position: relative;
          width: 100%;
          padding-top: 60%;
          overflow: hidden;
        }

        .course-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .status-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          color: white;
          z-index: 1;
        }

        .course-content {
          padding: 20px;
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .course-info {
          flex: 1;
        }

        .course-title {
          font-size: 20px;
          font-weight: 700;
          color: var(--heading-color, #2c3345);
          margin-bottom: 10px;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .course-description {
          color: var(--text-color, #6b7280);
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 16px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .course-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 20px;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: var(--light-bg, #f8f9fa);
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-color, #4b5563);
          transition: all 0.2s ease;
        }

        .course-actions {
          display: flex;
          gap: 8px;
          margin-top: auto;
          padding-top: 16px;
          border-top: 1px solid #eee;
        }

        .action-btn {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          height: 36px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          transition: all 0.3s ease;
          border: none;
          cursor: pointer;
          text-decoration: none;
          color: #fff;
        }

        .action-btn:hover {
          transform: translateY(-2px);
        }

        .action-btn i {
          font-size: 16px;
        }

        .restore-btn {
          background-color: #fd7e14;
        }

        .restore-btn:hover {
          background-color: #e96c07;
          box-shadow: 0 4px 12px rgba(253, 126, 20, 0.2);
        }

        .view-btn {
          background-color: #0d6efd;
        }

        .view-btn:hover {
          background-color: #0b5ed7;
          box-shadow: 0 4px 12px rgba(13, 110, 253, 0.2);
        }

        .course-sidebar {
          background: #fff;
          padding: 30px;
          border-radius: 16px;
          box-shadow: 0 2px 15px rgba(0, 0, 0, 0.05);
          position: sticky;
          top: 20px;
        }

        .filter-section {
          padding-bottom: 20px;
          border-bottom: 1px solid #eee;
          margin-bottom: 20px;
        }

        .filter-section:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .form-control, .form-select {
          padding: 12px 20px;
          font-size: 14px;
          transition: all 0.3s ease;
        }

        .form-control:focus, .form-select:focus {
          box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.1);
        }

        .form-control::placeholder {
          color: #6c757d;
          opacity: 0.7;
        }

        .search-form button {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .search-form button:hover {
          transform: scale(1.05);
        }

        @media (max-width: 991px) {
          .course-sidebar {
            position: fixed;
            top: 0;
            left: -100%;
            width: 300px;
            height: 100vh;
            z-index: 1000;
            transition: 0.3s;
            overflow-y: auto;
          }

          .course-sidebar.show {
            left: 0;
          }
        }

        .pagination-container {
          background: white;
          padding: 1rem;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .pagination {
          margin-bottom: 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .page-item {
          margin: 0;
        }
        
        .page-link {
          color: var(--main-color, #0d6efd);
          border: 1px solid rgba(13, 110, 253, 0.2);
          padding: 0.5rem 1rem;
          min-width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          transition: all 0.3s ease;
          font-weight: 500;
        }
        
        .page-link:hover {
          background-color: var(--main-color, #0d6efd);
          color: white;
          border-color: var(--main-color, #0d6efd);
          transform: translateY(-2px);
        }
        
        .page-item.active .page-link {
          background-color: var(--main-color, #0d6efd);
          color: white;
          border-color: var(--main-color, #0d6efd);
        }
        
        .page-item.disabled .page-link {
          color: #6c757d;
          border-color: #dee2e6;
          background-color: #f8f9fa;
          pointer-events: none;
        }

        .page-link i {
          font-size: 1.2rem;
        }
      `}</style>
    </div>
  );
};

export default Archive; 