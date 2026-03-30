'use client';

import { useState, useEffect } from 'react';
import HeaderStudent from '@/components/Header';
import Animation from "@/helper/Animation";
import FooterOne from "@/components/FooterOne";
import Breadcrumb from "@/components/Breadcrumb";
import CourseFilter from "@/components/CourseFilter";
import axios from 'axios';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { useSearchParams } from 'next/navigation';
import CourseList from '@/components/CourseList';

const FORMATIONS_PER_PAGE = 9;

// URL to category name mapping
const CATEGORY_MAPPING = {
  'languages': 'Languages',
  'computerScience': 'Computer Science',
  'competitions': 'Academic Training and Competitions'
};

const FormationsPage = () => {
  const [formations, setFormations] = useState([]);
  const [filteredFormations, setFilteredFormations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [availableLevels, setAvailableLevels] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedFormation, setSelectedFormation] = useState(null);
  const [inscriptionSuccess, setInscriptionSuccess] = useState(false);
  const [inscriptionError, setInscriptionError] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');
  const courseIdParam = searchParams.get('courseId');
  const initialCategory = CATEGORY_MAPPING[categoryParam] || '';

  const handleSidebarControl = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Get paginated formations
  const getPaginatedFormations = () => {
    const startIndex = (currentPage - 1) * FORMATIONS_PER_PAGE;
    const endIndex = startIndex + FORMATIONS_PER_PAGE;
    return filteredFormations.slice(startIndex, endIndex);
  };

  // Calculate total pages
  const totalPages = Math.ceil(filteredFormations.length / FORMATIONS_PER_PAGE);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    fetchFormations();
    // Load favorites from localStorage
    const savedFavorites = JSON.parse(localStorage.getItem('favoriteCourses') || '[]');
    setFavorites(savedFavorites);
    // Load cart items from localStorage
    const savedCartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
    setCartItems(savedCartItems);

    // Get category from URL and set initial filter
    if (categoryParam) {
      let categoryName = '';
      switch (categoryParam) {
        case 'languages':
          categoryName = CATEGORY_MAPPING.languages;
          break;
        case 'computerScience':
          categoryName = CATEGORY_MAPPING.computerScience;
          break;
        case 'competitions':
          categoryName = CATEGORY_MAPPING.competitions;
          break;
      }
      if (categoryName) {
        setSelectedCategory(categoryName);
      }
    }
  }, [searchParams]);

  const fetchFormations = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get('http://localhost:5000/api/formations', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = response.data;
      setFormations(data);
      
      // Filter formations based on parameters
      let filtered = data;
      
      // If courseId is specified, show only that formation
      if (courseIdParam) {
        filtered = data.filter(formation => formation._id === courseIdParam);
      }
      // Otherwise, apply category filter if present
      else if (categoryParam && CATEGORY_MAPPING[categoryParam]) {
        const mappedCategory = CATEGORY_MAPPING[categoryParam];
        filtered = data.filter(formation => formation.category === mappedCategory);
      }
      
      setFilteredFormations(filtered);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching formations:', error);
      setError('Error loading formations');
      setLoading(false);
    }
  };

  const handleInscription = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(
        `http://localhost:5000/api/inscription-requests/${selectedFormation._id}`,
        { message: 'Je souhaite m\'inscrire à cette formation' },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setInscriptionSuccess(true);
      setInscriptionError(null);
      setShowModal(false);
      
      setTimeout(() => {
        setInscriptionSuccess(false);
      }, 3000);
    } catch (error) {
      setInscriptionError(error.response?.data?.message || 'Erreur lors de l\'inscription');
    }
  };

  const openInscriptionModal = (formation) => {
    setSelectedFormation(formation);
    setShowModal(true);
    setInscriptionSuccess(false);
    setInscriptionError(null);
  };

  const toggleCart = (formation) => {
    const isInCart = cartItems.some(item => item._id === formation._id);
    
    if (!isInCart) {
      const newCartItems = [...cartItems, formation];
      localStorage.setItem('cartItems', JSON.stringify(newCartItems));
      setCartItems(newCartItems);
      window.dispatchEvent(new CustomEvent('cartUpdated'));
      toast.success('Formation ajoutée au panier');
    } else {
      const newCartItems = cartItems.filter(item => item._id !== formation._id);
      localStorage.setItem('cartItems', JSON.stringify(newCartItems));
      setCartItems(newCartItems);
      window.dispatchEvent(new CustomEvent('cartUpdated'));
      toast.success('Formation retirée du panier');
    }
  };

  const toggleFavorite = (formationId) => {
    setFavorites(prevFavorites => {
      const newFavorites = prevFavorites.includes(formationId)
        ? prevFavorites.filter(id => id !== formationId)
        : [...prevFavorites, formationId];
      
      localStorage.setItem('favoriteCourses', JSON.stringify(newFavorites));
      toast.success(prevFavorites.includes(formationId) ? 'Formation retirée des favoris' : 'Formation ajoutée aux favoris');
      return newFavorites;
    });
  };

  // Update available levels based on selected category
  useEffect(() => {
    if (selectedCategory === CATEGORY_MAPPING.languages) {
      setAvailableLevels(['Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Autonomous', 'Mastery']);
    } else if (selectedCategory === CATEGORY_MAPPING.computerScience) {
      setAvailableLevels(['Software Development', 'AI and Big Data', 'Graphics and Digital Marketing', 'Office Tools']);
    } else if (selectedCategory === CATEGORY_MAPPING.competitions) {
      setAvailableLevels(['Competition Preparation', 'All Levels Training']);
    } else {
      setAvailableLevels([]);
    }
    setSelectedLevel(''); // Reset selected level when category changes
  }, [selectedCategory]);

  const handleFilter = (filters) => {
    let filtered = [...formations];

    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(formation => 
        formation.title?.toLowerCase().includes(searchLower) ||
        formation.description?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.categories && filters.categories.length > 0) {
      filtered = filtered.filter(formation => 
        filters.categories.includes(formation.category)
      );
    }

    if (filters.levels && filters.levels.length > 0) {
      filtered = filtered.filter(formation => 
        filters.levels.includes(formation.level)
      );
    }

    if (filters.priceRange && filters.priceRange.length === 2) {
    filtered = filtered.filter(formation => {
      const price = formation.price || 0;
        return price >= filters.priceRange[0] && price <= filters.priceRange[1];
    });
    }

    setCurrentPage(1);
    setFilteredFormations(filtered);
  };

  // Get unique categories and levels for filters
  const categories = [...new Set(formations.map(f => f.category).filter(Boolean))];
  const levels = [...new Set(formations.map(f => f.level).filter(Boolean))];

  const paginatedFormations = getPaginatedFormations();

  if (loading) {
    return (
      <>
        <HeaderStudent />
        <Animation />
        <div className="container py-5">
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
        <FooterOne />
      </>
    );
  }

  if (error) {
    return (
      <>
        <HeaderStudent />
        <Animation />
        <div className="container py-5">
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        </div>
        <FooterOne />
      </>
    );
  }

  return (
    <>
      <HeaderStudent />
      <Animation />
      <Breadcrumb title="Our Courses" />
      
      <section className='py-120' style={{ backgroundColor: '#FDFDFC' }}>
        <div className='container-fluid px-lg-80'>
          <div className='row g-4'>
            {/* Sidebar Filter */}
            <div className={`${isSidebarOpen ? 'col-lg-3' : 'd-none'} course-sidebar-wrapper`}>
              <div className="course-sidebar">
                <CourseFilter 
                  onFilter={handleFilter}
                  categories={Object.values(CATEGORY_MAPPING)}
                  levels={availableLevels}
                  sidebarControl={handleSidebarControl}
                  initialCategory={initialCategory}
                />
              </div>
            </div>

            {/* Main Content */}
            <div className={`${isSidebarOpen ? 'col-lg-9' : 'col-12'}`}>
              <div className='d-flex justify-content-between align-items-center mb-30'>
                <div>
                  <h4 className='mb-8'>All Courses</h4>
                  <p className='mb-0 text-neutral-500'>
                    {filteredFormations.length} course{filteredFormations.length !== 1 ? 's' : ''} found
                  </p>
                </div>
                <button
                  onClick={handleSidebarControl}
                  className='btn btn-outline-primary rounded-pill d-flex align-items-center gap-2'
                >
                  <i className={`ph-bold ${isSidebarOpen ? 'ph-x' : 'ph-funnel'}`}></i>
                  {isSidebarOpen ? 'Hide filters' : 'Show filters'}
                </button>
              </div>

              <CourseList 
                courses={paginatedFormations} 
                onToggleFavorite={toggleFavorite}
                onToggleCart={toggleCart}
              />

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination-container mt-40">
                  <div className="pagination d-flex justify-content-center gap-2">
                            <button
                      className={`pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <i className="ph ph-arrow-left"></i>
                            </button>
                    
                    {[...Array(totalPages)].map((_, index) => (
                                <button
                        key={index + 1}
                        className={`pagination-btn ${currentPage === index + 1 ? 'active' : ''}`}
                        onClick={() => handlePageChange(index + 1)}
                      >
                        {index + 1}
                                </button>
                              ))}
                    
                    <button
                      className={`pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`}
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <i className="ph ph-arrow-right"></i>
                    </button>
                  </div>
              </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Inscription Modal */}
      {showModal && (
        <div className="modal fade show" style={{ display: 'block' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Enrollment Request</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {inscriptionSuccess ? (
                  <div className="alert alert-success">
                    Course registration successful!
                  </div>
                ) : (
                  <>
                    {inscriptionError && (
                      <div className="alert alert-danger mb-24">
                        {inscriptionError}
                      </div>
                    )}
                    <p>
                      You are about to request enrollment in the course:
                      <strong> {selectedFormation?.title}</strong>
                    </p>
                    <p>Do you want to continue?</p>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                {!inscriptionSuccess && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleInscription}
                  >
                    Confirm
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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

        .py-60 {
          padding-top: 60px;
          padding-bottom: 60px;
        }

        .mb-30 {
          margin-bottom: 30px;
        }

        .mb-8 {
          margin-bottom: 8px;
        }

        /* Pagination Styles */
        .pagination-container {
          margin-top: 2rem;
        }

        .pagination {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
        }

        .pagination-btn {
          min-width: 40px;
          height: 40px;
          padding: 0.5rem;
          border: 1px solid #e5e7eb;
          background-color: white;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #1a1a1a;
          font-weight: 500;
        }

        .pagination-btn:hover:not(.disabled) {
          background-color: #f0f7ff;
          border-color: #0d6efd;
          color: #0d6efd;
          transform: translateY(-2px);
        }

        .pagination-btn.active {
          background-color: #0d6efd;
          border-color: #0d6efd;
          color: white;
        }

        .pagination-btn.disabled {
          opacity: 0.5;
          cursor: not-allowed;
          pointer-events: none;
        }

        .pagination-btn i {
          font-size: 1.2rem;
        }

        @media (max-width: 576px) {
          .pagination-btn {
            min-width: 36px;
            height: 36px;
            padding: 0.25rem;
          }
        }
      `}</style>
    </>
  );
};

export default FormationsPage; 