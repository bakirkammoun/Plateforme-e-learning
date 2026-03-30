'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Breadcrumb from "@/components/Breadcrumb";
import HeaderInstructor from "@/components/HeaderInstructor";
import FooterOne from "@/components/FooterOne";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Link from 'next/link';

const MyCourses = () => {
  const router = useRouter();
  const [formations, setFormations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [categories, setCategories] = useState([]);
  const [mainCategories, setMainCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    subCategory: '',
    level: ''
  });

  // État pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [currentFormations, setCurrentFormations] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const formationsPerPage = 9;

  // Mapping des noms de catégories entre l'anglais et le français
  const categoryNameMapping = {
    'Languages': 'Langues',
    'Computer Science': 'Informatique',
    'School and Competition': 'Concours et Formation Scolaire'
  };

  // Fonction pour obtenir le nom de la catégorie dans la langue appropriée
  const getCategoryName = useCallback((name) => {
    return categoryNameMapping[name] || name;
  }, []);

  // Fonction pour changer de page
  const paginate = useCallback((pageNumber) => setCurrentPage(pageNumber), []);

  const handleSidebarControl = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const user = JSON.parse(localStorage.getItem('user'));
    if (!token || !user || !user.id) {
      toast.error("Vous devez être connecté pour voir vos cours");
      router.push('/sign-in');
    } else {
      fetchCategories();
      fetchCourses(user.id);
    }
  }, [router]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/categories');
      if (response.data) {
        setCategories(response.data);
        
        // Filtrer les catégories principales (sans parent)
        const mains = response.data.filter(cat => !cat.parentCategory);
        setMainCategories(mains);
        
        // Trouver la catégorie "Languages" et la définir comme catégorie par défaut
        const languagesCategory = mains.find(cat => cat.name === 'Languages');
        if (languagesCategory) {
          setFilters(prev => ({
            ...prev,
            category: languagesCategory._id
          }));
          
          // Mettre à jour les sous-catégories pour la catégorie "Languages"
          const subs = response.data.filter(cat => cat.parentCategory === languagesCategory._id);
          setSubCategories(subs);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories:', error);
      toast.error('Erreur lors de la récupération des catégories');
    }
  }, []);

  const fetchCourses = useCallback(async (instructorId) => {
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await axios.get(`http://localhost:5000/api/formations/instructor/${instructorId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data) {
        console.log('Formations reçues:', response.data);
        setFormations(response.data);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des cours:', error);
      toast.error('Erreur lors de la récupération des cours');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (filters.category) {
      const subs = categories.filter(cat => cat.parentCategory === filters.category);
      setSubCategories(subs);
      // Réinitialiser la sous-catégorie sélectionnée si elle n'appartient pas à la nouvelle catégorie
      if (filters.subCategory && !subs.some(cat => cat._id === filters.subCategory)) {
        setFilters(prev => ({ ...prev, subCategory: '' }));
      }
    } else {
      setSubCategories([]);
      setFilters(prev => ({ ...prev, subCategory: '' }));
    }
  }, [filters.category, categories]);

  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    console.log('Changement de filtre:', name, value);
    console.log('Catégories principales avant changement:', mainCategories);
    
    setFilters(prev => {
      const newFilters = {
        ...prev,
        [name]: value
      };
      console.log('Nouveaux filtres:', newFilters);
      return newFilters;
    });
    setCurrentPage(1); // Reset to first page when filters change
  }, [mainCategories]);

  // Calcul des formations filtrées avec useMemo
  const filteredFormations = useMemo(() => {
    return formations.filter(formation => {
      const matchesSearch = formation.title.toLowerCase().includes(filters.search.toLowerCase()) ||
                          formation.description.toLowerCase().includes(filters.search.toLowerCase());
      
      let matchesCategory = true;
      if (filters.category) {
        const selectedCategory = mainCategories.find(cat => cat._id === filters.category);
        if (selectedCategory) {
          const categoryName = getCategoryName(selectedCategory.name);
          matchesCategory = formation.category === categoryName || 
                          formation.category === selectedCategory.name;
        }
      }
      
      let matchesSubCategory = true;
      if (filters.subCategory) {
        const selectedSubCategory = subCategories.find(cat => cat._id === filters.subCategory);
        if (selectedSubCategory) {
          const subCategoryName = getCategoryName(selectedSubCategory.name);
          matchesSubCategory = formation.subCategory === subCategoryName || 
                             formation.subCategory === selectedSubCategory.name;
        }
      }
      
      const matchesLevel = !filters.level || formation.level === filters.level;

      return matchesSearch && matchesCategory && matchesSubCategory && matchesLevel;
    });
  }, [formations, filters, mainCategories, subCategories, getCategoryName]);

  // Calcul de la pagination avec useMemo
  const paginationData = useMemo(() => {
    const indexOfLastFormation = currentPage * formationsPerPage;
    const indexOfFirstFormation = indexOfLastFormation - formationsPerPage;
    const currentFormations = filteredFormations.slice(indexOfFirstFormation, indexOfLastFormation);
    const totalPages = Math.ceil(filteredFormations.length / formationsPerPage);
    
    return {
      currentFormations,
      totalPages
    };
  }, [filteredFormations, currentPage]);

  const handleDeleteFormation = async (formationId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette formation ? Elle sera archivée automatiquement.')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast.error('Veuillez vous connecter pour effectuer cette action');
        router.push('/sign-in');
        return;
      }

      // Archiver la formation
      const archiveResponse = await axios.post(`http://localhost:5000/api/formations/${formationId}/archive`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (archiveResponse.status === 200) {
        setFormations(formations.filter(formation => formation._id !== formationId));
        toast.success('Formation archivée avec succès');
      }
    } catch (error) {
      console.error('Erreur lors de l\'archivage de la formation:', error);
      
      if (error.response) {
        if (error.response.status === 401) {
          toast.error('Non autorisé. Veuillez vous reconnecter.');
          localStorage.removeItem('authToken');
          router.push('/sign-in');
        } else if (error.response.data && error.response.data.message) {
          toast.error(error.response.data.message);
        } else {
          toast.error('Erreur lors de l\'archivage de la formation');
        }
      } else {
        toast.error('Erreur de connexion au serveur');
      }
    }
  };

  const getStatusBadgeClass = useCallback((status) => {
    switch(status) {
      case 'published': return 'bg-success';
      case 'draft': return 'bg-warning';
      case 'pending': return 'bg-info';
      case 'rejected': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }, []);

  const getStatusLabel = useCallback((status) => {
    switch(status) {
      case 'published': return 'Published';
      case 'draft': return 'Draft';
      case 'pending': return 'Pending';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  }, []);

  return (
    <>
      <HeaderInstructor />
      <Breadcrumb title="My Courses" />
      <ToastContainer />
      <link
        rel="preload"
        href="https://widget-v4.tidiochat.com/fonts/mulish_SGhgqk3wotYKNnBQ.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />

      <section className="course-list py-80">
        <div className="container-fluid px-lg-80">
          <div className="row g-4">
            {/* Sidebar Filter */}
            <div className={`${isSidebarOpen ? 'col-lg-3' : 'd-none'} course-sidebar-wrapper`}>
              <div className="course-sidebar">
                <div className="filter-section mb-4">
                  <h5 className="mb-3">Search</h5>
                  <div className="search-form position-relative">
                    <input
                      type="text"
                      className="common-input rounded-pill bg-main-25 pe-48 border-neutral-30 w-100"
                      placeholder="Search courses..."
                      value={filters.search}
                      onChange={handleFilterChange}
                      name="search"
                    />
                    <button
                      type="button"
                      className="w-36 h-36 bg-main-600 hover-bg-main-700 rounded-circle flex-center text-md text-white position-absolute top-50 translate-middle-y inset-inline-end-0 me-8"
                    >
                      <i className="ph-bold ph-magnifying-glass" />
                    </button>
                  </div>
                </div>

                <div className="filter-section mb-4">
                  <h5 className="mb-3">Category</h5>
                  <select
                    className="form-select common-input rounded-pill bg-main-25 border-neutral-30 w-100"
                    value={filters.category}
                    onChange={handleFilterChange}
                    name="category"
                  >
                    <option value="">All Categories</option>
                    {mainCategories.map((cat) => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-section mb-4">
                  <h5 className="mb-3">Subcategory</h5>
                  <select
                    className="form-select common-input rounded-pill bg-main-25 border-neutral-30 w-100"
                    value={filters.subCategory}
                    onChange={handleFilterChange}
                    name="subCategory"
                    disabled={!filters.category}
                  >
                    <option value="">All Subcategories</option>
                    {subCategories.map((cat) => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-section mb-4">
                  <h5 className="mb-3">Level</h5>
                  <select
                    className="form-select common-input rounded-pill bg-main-25 border-neutral-30 w-100"
                    value={filters.level}
                    onChange={handleFilterChange}
                    name="level"
                  >
                    <option value="">All Levels</option>
                    <option value="Débutant">Beginner</option>
                    <option value="Intermédiaire">Intermediate</option>
                    <option value="Avancé">Advanced</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className={`${isSidebarOpen ? 'col-lg-9' : 'col-12'}`}>
              <div className="d-flex justify-content-between align-items-center mb-30">
                <div>
                  <h4 className="mb-8">All Courses</h4>
                  <p className="mb-0 text-neutral-500">
                    Showing {filteredFormations.length} course{filteredFormations.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={handleSidebarControl}
                  className="btn btn-outline-primary rounded-pill d-flex align-items-center gap-2"
                >
                  <i className={`ph-bold ${isSidebarOpen ? 'ph-x' : 'ph-funnel'}`}></i>
                  {isSidebarOpen ? 'Hide Filter' : 'Show Filter'}
                </button>
              </div>

              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-main-600" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : error ? (
                <div className="alert alert-danger rounded-12" role="alert">
                  {error}
                </div>
              ) : (
                <>
                <div className={`row g-4 row-cols-1 row-cols-md-2 row-cols-lg-3`}>
                    {paginationData.currentFormations.map((formation) => (
                    <div key={formation._id} className="col">
                      <div className="course-card">
                        <div className="course-thumb">
                          <img
                            src={formation.image || '/assets/images/default-course.png'}
                            alt={formation.title}
                            className="course-image"
                          />
                          <div className={`status-badge ${getStatusBadgeClass(formation.status)}`}>
                            {getStatusLabel(formation.status)}
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
                                <span>{formation.duration}h</span>
                              </div>
                              <div className="meta-item">
                                <i className="ph-bold ph-currency-dollar text-primary"></i>
                                <span>${formation.price}</span>
                              </div>
                            </div>
                          </div>
                          <div className="course-actions">
                            <Link 
                              href={`/course-details/${formation._id}`}
                              className="action-btn view-btn"
                            >
                              <i className="ph-bold ph-eye"></i>
                              <span>View</span>
                            </Link>
                            <Link 
                              href={`/edit-course/${formation._id}`}
                              className="action-btn edit-btn"
                            >
                              <i className="ph-bold ph-pencil-simple"></i>
                              <span>Edit</span>
                            </Link>
                            <button 
                              onClick={() => handleDeleteFormation(formation._id)}
                              className="action-btn delete-btn"
                            >
                              <i className="ph-bold ph-trash"></i>
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {paginationData.totalPages > 1 && (
                  <div className="d-flex justify-content-center mt-4">
                    <nav aria-label="Page navigation">
                      <ul className="pagination pagination-custom">
                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                          <button
                            className="page-link"
                            onClick={() => paginate(currentPage - 1)}
                            disabled={currentPage === 1}
                            aria-label="Previous page"
                          >
                            <i className="ph-bold ph-caret-left"></i>
                          </button>
                        </li>
                        {Array.from({ length: paginationData.totalPages }, (_, i) => i + 1).map((number) => (
                          <li key={number} className={`page-item ${currentPage === number ? 'active' : ''}`}>
                            <button
                              className="page-link"
                              onClick={() => paginate(number)}
                              aria-current={currentPage === number ? 'page' : undefined}
                            >
                              {number}
                            </button>
                          </li>
                        ))}
                        <li className={`page-item ${currentPage === paginationData.totalPages ? 'disabled' : ''}`}>
                          <button
                            className="page-link"
                            onClick={() => paginate(currentPage + 1)}
                            disabled={currentPage === paginationData.totalPages}
                            aria-label="Next page"
                          >
                            <i className="ph-bold ph-caret-right"></i>
                          </button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <FooterOne />

      <style jsx>{`
        .course-sidebar-wrapper {
          transition: all 0.3s ease;
        }

        .course-sidebar {
          background: #fff;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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

        .view-btn {
          background-color: #0d6efd;
        }

        .view-btn:hover {
          background-color: #0b5ed7;
          box-shadow: 0 4px 12px rgba(13, 110, 253, 0.2);
        }

        .edit-btn {
          background-color: #fd7e14;
        }

        .edit-btn:hover {
          background-color: #e96c07;
          box-shadow: 0 4px 12px rgba(253, 126, 20, 0.2);
        }

        .delete-btn {
          background-color: #dc3545;
        }

        .delete-btn:hover {
          background-color: #bb2d3b;
          box-shadow: 0 4px 12px rgba(220, 53, 69, 0.2);
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

        .pagination-custom {
          display: flex;
          gap: 8px;
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .pagination-custom .page-item {
          margin: 0;
        }

        .pagination-custom .page-link {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 40px;
          height: 40px;
          padding: 0 12px;
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 8px;
          background-color: white;
          color: var(--text-color, #4b5563);
          font-weight: 500;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .pagination-custom .page-link:hover {
          background-color: var(--main-color, #4f46e5);
          color: white;
          border-color: var(--main-color, #4f46e5);
          transform: translateY(-1px);
        }

        .pagination-custom .page-item.active .page-link {
          background-color: var(--main-color, #4f46e5);
          color: white;
          border-color: var(--main-color, #4f46e5);
          box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);
        }

        .pagination-custom .page-item.disabled .page-link {
          background-color: var(--light-bg, #f3f4f6);
          color: var(--text-muted, #9ca3af);
          border-color: var(--border-color, #e5e7eb);
          cursor: not-allowed;
          transform: none;
        }

        .pagination-custom .page-link i {
          font-size: 16px;
        }

        @media (max-width: 576px) {
          .pagination-custom .page-link {
            min-width: 36px;
            height: 36px;
            padding: 0 8px;
            font-size: 14px;
          }
        }
      `}</style>
    </>
  );
};

export default MyCourses; 