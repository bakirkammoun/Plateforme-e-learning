'use client';

import { useState, useEffect } from 'react';
import HeaderStudent from '@/components/Header';
import Animation from "@/helper/Animation";
import FooterOne from "@/components/FooterOne";
import Breadcrumb from "@/components/Breadcrumb";
import axios from 'axios';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

const MyFavoriteCoursesPage = () => {
  const [formations, setFormations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedLevels, setSelectedLevels] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [filteredFormations, setFilteredFormations] = useState([]);
  const [availableLevels, setAvailableLevels] = useState([]);

  // Définir les niveaux spécifiques pour les langues
  const languageLevels = [
    'Débutant',
    'Elémentaire',
    'Intermédiaire',
    'Avancé',
    'Autonome',
    'Maîtrise'
  ];

  // Définir les types pour l'informatique
  const informatiqueTypes = [
    'Développement Informatique',
    'Intelligence Artificielle et Big Data',
    'Graphique et Marketing Digital',
    'Bureautique'
  ];

  // Définir les types pour les concours
  const concoursTypes = [
    'Préparation aux Concours',
    'Formation pour Tous les Niveaux'
  ];

  useEffect(() => {
    fetchFormations();
    // Load favorites from localStorage
    const savedFavorites = JSON.parse(localStorage.getItem('favoriteCourses') || '[]');
    setFavorites(savedFavorites);
    // Load cart items from localStorage
    const savedCartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
    setCartItems(savedCartItems);
  }, []);

  // Mettre à jour filteredFormations quand formations change
  useEffect(() => {
    setFilteredFormations(formations);
    const levels = [...new Set(formations.map(f => f.level).filter(Boolean))];
    setAvailableLevels(levels);
  }, [formations]);

  useEffect(() => {
    handleFilter();
  }, [searchTerm, selectedCategories, selectedLevels]);

  // Gérer les niveaux disponibles en fonction de la catégorie
  useEffect(() => {
    if (selectedCategories.includes('Langues')) {
      setAvailableLevels(languageLevels);
    } else if (selectedCategories.includes('Informatique')) {
      setAvailableLevels(informatiqueTypes);
    } else if (selectedCategories.includes('Concours et Formation Scolaire')) {
      setAvailableLevels(concoursTypes);
    } else if (selectedCategories.length === 0) {
      const levels = [...new Set(formations.map(f => f.level).filter(Boolean))];
      setAvailableLevels(levels);
    }
    // Réinitialiser les niveaux sélectionnés lors du changement de catégorie
    setSelectedLevels([]);
  }, [selectedCategories, formations]);

  const handleFilter = () => {
    let filtered = [...formations];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(formation => 
        formation.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formation.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by categories
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(formation => 
        selectedCategories.includes(formation.category)
      );
    }

    // Filter by levels
    if (selectedLevels.length > 0) {
      filtered = filtered.filter(formation => 
        selectedLevels.includes(formation.level)
      );
    }

    setFilteredFormations(filtered);
  };

  const handleSidebarControl = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return [];
      }
      return [category]; // Ne permettre qu'une seule catégorie à la fois
    });
  };

  const handleLevelChange = (level) => {
    setSelectedLevels(prev => {
      if (prev.includes(level)) {
        return prev.filter(l => l !== level);
      }
      return [...prev, level];
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategories([]);
    setSelectedLevels([]);
    const levels = [...new Set(formations.map(f => f.level).filter(Boolean))];
    setAvailableLevels(levels);
    setFilteredFormations(formations);
  };

  // Get unique categories
  const categories = [...new Set(formations.map(f => f.category).filter(Boolean))];

  const fetchFormations = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get('http://localhost:5000/api/formations', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      // Filter only favorite formations
      const favorites = JSON.parse(localStorage.getItem('favoriteCourses') || '[]');
      const favoriteFormations = response.data.filter(formation => 
        favorites.includes(formation._id)
      );
      setFormations(favoriteFormations);
      setFilteredFormations(favoriteFormations); // Initialiser les formations filtrées
      setLoading(false);
    } catch (error) {
      console.error('Error fetching favorite formations:', error);
      setError('Error loading favorite courses');
      setLoading(false);
    }
  };

  const toggleFavorite = (formationId) => {
    setFavorites(prevFavorites => {
      const newFavorites = prevFavorites.filter(id => id !== formationId);
      localStorage.setItem('favoriteCourses', JSON.stringify(newFavorites));
      // Remove from displayed formations
      setFormations(prevFormations => 
        prevFormations.filter(formation => formation._id !== formationId)
      );
      toast.success('Course removed from favorites');
      return newFavorites;
    });
  };

  const toggleCart = (formation) => {
    const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
    const isInCart = cartItems.some(item => item._id === formation._id);
    
    if (!isInCart) {
      const newCartItems = [...cartItems, formation];
      localStorage.setItem('cartItems', JSON.stringify(newCartItems));
      setCartItems(newCartItems);
      window.dispatchEvent(new CustomEvent('cartUpdated'));
      toast.success('Course added to cart');
    } else {
      const newCartItems = cartItems.filter(item => item._id !== formation._id);
      localStorage.setItem('cartItems', JSON.stringify(newCartItems));
      setCartItems(newCartItems);
      window.dispatchEvent(new CustomEvent('cartUpdated'));
      toast.success('Course removed from cart');
    }
  };

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
      <Breadcrumb title="My Favorite Courses" />
      
      <section className='py-120' style={{ backgroundColor: '#FDFDFC' }}>
        <div className='container-fluid px-lg-80'>
          <div className='row g-4'>
            {/* Filters Sidebar */}
            <div className={`${isSidebarOpen ? 'col-lg-3' : 'd-none'}`}>
              <div className="filter-sidebar">
                <div className="filter-header d-flex justify-content-between align-items-center mb-4">
                  <h5 className="m-0 d-flex align-items-center">
                    <span className="filter-icon-wrapper me-2">
                      <i className="ph ph-funnel"></i>
                    </span>
                    Filters
                    <span className="filter-count ms-2">
                      ({filteredFormations.length})
                    </span>
                  </h5>
                  <button 
                    className="btn-reset" 
                    onClick={clearFilters}
                  >
                    <i className="ph ph-x me-1"></i>
                    Clear All
                  </button>
                </div>

                <div className="filter-section mb-4">
                  <label className="filter-label">Search Courses</label>
                  <div className="search-wrapper">
                    <i className="ph ph-magnifying-glass search-icon"></i>
                    <input
                      type="text"
                      className="search-input"
                      placeholder="Search courses..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="filter-section">
                  <h6 className="filter-title mb-3">
                    <span className="filter-icon-wrapper me-2">
                      <i className="ph ph-folders"></i>
                    </span>
                    Categories
                  </h6>
                  <div className="filter-options">
                    {categories.map((category) => (
                      <div className="filter-option" key={category}>
                        <input
                          type="checkbox"
                          id={`category-${category}`}
                          checked={selectedCategories.includes(category)}
                          onChange={() => handleCategoryChange(category)}
                          className="filter-checkbox"
                        />
                        <label htmlFor={`category-${category}`} className="filter-label">
                          <span className="filter-text">
                            {category}
                            <span className="filter-count">
                              ({formations.filter(f => f.category === category).length})
                            </span>
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="filter-section">
                  <h6 className="filter-title mb-3">
                    <span className="filter-icon-wrapper me-2">
                      <i className="ph ph-chart-line-up"></i>
                    </span>
                    Levels
                  </h6>
                  <div className="filter-options">
                    {availableLevels.map((level) => (
                      <div className="filter-option" key={level}>
                        <input
                          type="checkbox"
                          id={`level-${level}`}
                          checked={selectedLevels.includes(level)}
                          onChange={() => handleLevelChange(level)}
                          className="filter-checkbox"
                        />
                        <label htmlFor={`level-${level}`} className="filter-label">
                          <span className="filter-text">
                            {level}
                            <span className="filter-count">
                              ({formations.filter(f => f.level === level).length})
                            </span>
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className={`${isSidebarOpen ? 'col-lg-9' : 'col-12'}`}>
              <div className='d-flex justify-content-between align-items-center mb-30'>
                <div>
                  <h4 className='mb-8'>My Favorite Courses</h4>
                  <p className='mb-0 text-neutral-500'>
                    Showing {filteredFormations.length} course{filteredFormations.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={handleSidebarControl}
                  className='btn btn-outline-primary rounded-pill d-flex align-items-center gap-2'
                >
                  <i className={`ph-bold ${isSidebarOpen ? 'ph-x' : 'ph-funnel'}`}></i>
                  {isSidebarOpen ? 'Hide Filter' : 'Show Filter'}
                </button>
              </div>

          {formations.length === 0 ? (
            <div className="text-center py-5">
              <div className="mb-4">
                <i className="ph ph-heart text-danger" style={{ fontSize: '4rem' }}></i>
              </div>
              <h3 className="mb-3">No Favorite Courses Yet</h3>
              <p className="text-muted mb-4">Start exploring courses and add them to your favorites!</p>
              <Link href="/formations" className="btn btn-primary">
                Explore Courses
              </Link>
            </div>
          ) : (
                <div className='row g-4'>
                  {filteredFormations.map((formation) => (
                    <div key={formation._id} className='col-lg-4 col-sm-6 mt-20'>
                      <div style={{ backgroundColor: '#FFFFFF' }} className='course-item rounded-16 p-12 h-100 box-shadow-md'>
                        <div className='course-item__thumb rounded-12 overflow-hidden position-relative' style={{ height: '240px' }}>
                          <Link href={`/formation/${formation._id}`}>
                      <img
                        src={formation.image || 'assets/images/default-course.png'}
                        alt={formation.title}
                              className='course-item__img rounded-12 w-100 h-100 object-fit-cover transition-2'
                            />
                          </Link>
                          <div className='d-flex gap-12 position-absolute inset-block-start-0 inset-inline-start-0 mt-20 ms-20 z-1'>
                            <div className='flex-align gap-8 rounded-pill px-24 py-12 text-white' style={{ backgroundColor: '#0d6efd' }}>
                              <span className='text-2xl d-flex'>
                                <i className='ph ph-clock' />
                              </span>
                              <span className='text-lg fw-medium'>{formation.duration}h</span>
                            </div>
                          </div>
                          <div className='position-absolute inset-block-start-0 inset-inline-end-0 mt-20 me-20 z-1'>
                            <div className="d-flex gap-3">
                          <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(formation._id);
                                }}
                                className="flex-align gap-8 rounded-circle text-white favorite-btn"
                                style={{
                                  backgroundColor: '#ff3b5c',
                                  border: 'none',
                                  cursor: 'pointer',
                                  width: '38px',
                                  height: '38px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                            title="Remove from favorites"
                          >
                                <i className="ph-fill ph-heart" style={{ color: 'white', fontSize: '1.2rem' }} />
                          </button>
                          <button
                            onClick={() => toggleCart(formation)}
                                className="flex-align gap-8 rounded-circle text-white cart-btn"
                                style={{ 
                                  backgroundColor: cartItems.some(item => item._id === formation._id) ? '#22c55e' : '#ffcc00', 
                                  border: 'none', 
                                  cursor: 'pointer',
                                  width: '38px',
                                  height: '38px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                            title={cartItems.some(item => item._id === formation._id) ? "Remove from cart" : "Add to cart"}
                          >
                                <i className={`ph-fill ${cartItems.some(item => item._id === formation._id) ? 'ph-shopping-cart-simple' : 'ph-shopping-cart'}`}
                                  style={{ color: 'white', fontSize: '1.2rem' }}
                                />
                          </button>
                        </div>
                          </div>
                          <div className='position-absolute inset-block-end-0 inset-inline-end-0 mb-20 me-20 z-1'>
                            <div className='flex-align gap-8 rounded-pill px-24 py-12 text-white' style={{ backgroundColor: '#0d6efd' }}>
                              <span className='text-2xl d-flex'>
                                <i className='ph ph-money' />
                              </span>
                              <span className='text-lg fw-medium'>{formation.price ? `${formation.price} DT` : 'Free'}</span>
                      </div>
                    </div>
                        </div>

                        <div className='course-item__content'>
                          <div>
                            <h4 className='mb-28'>
                              <Link href={`/formation/${formation._id}`} className='link text-line-2'>
                                {formation.title}
                              </Link>
                            </h4>
                            <div className='flex-between gap-8 flex-wrap mb-16'>
                              <div className='flex-align gap-8'>
                                <span className='text-neutral-700 text-2xl d-flex'>
                                  <i className='ph-bold ph-video-camera' />
                                </span>
                                <span className='text-neutral-700 text-lg fw-medium'>
                                  {formation.level}
                                </span>
                        </div>
                              <div className='flex-align gap-8'>
                                <span className='text-neutral-700 text-2xl d-flex'>
                                  <i className='ph-bold ph-chart-bar' />
                                </span>
                                <span className='text-neutral-700 text-lg fw-medium'>
                                  {formation.category}
                                </span>
                        </div>
                      </div>

                            {formation.instructorId && (
                              <div className='flex-align gap-12 mb-16'>
                                <div className="instructor-avatar" style={{
                                  width: '48px',
                                  height: '48px',
                                  borderRadius: '50%',
                                  overflow: 'hidden',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  backgroundColor: '#e3f2fd',
                                  boxShadow: '0 2px 8px rgba(13, 110, 253, 0.15)',
                                  border: '2px solid #fff',
                                  transition: 'all 0.2s ease-in-out'
                                }}>
                                  {formation.instructorId.profileImage ? (
                                    <img 
                                      src={`http://localhost:5000/${formation.instructorId.profileImage}`}
                                      alt={`${formation.instructorId.firstName} ${formation.instructorId.lastName}`}
                                      style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        transition: 'transform 0.2s ease-in-out'
                                      }}
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        const initials = `${formation.instructorId.firstName?.[0] || ''}${formation.instructorId.lastName?.[0] || ''}`.toUpperCase();
                                        e.target.parentElement.innerHTML = `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 600; color: #0d6efd; background-color: #e3f2fd;">${initials}</div>`;
                                      }}
                                    />
                                  ) : (
                                    <div style={{
                                      width: '100%',
                                      height: '100%',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '18px',
                                      fontWeight: '600',
                                      color: '#0d6efd',
                                      backgroundColor: '#e3f2fd'
                                    }}>
                                      {formation.instructorId.firstName?.[0]?.toUpperCase() || ''}
                                      {formation.instructorId.lastName?.[0]?.toUpperCase() || ''}
                        </div>
                                  )}
                        </div>
                                <div>
                                  <span className='text-neutral-700 text-lg fw-medium'>
                                    {formation.instructorId.firstName} {formation.instructorId.lastName}
                                  </span>
                                  <small className='text-muted d-block'>
                                    {formation.instructorId.role || 'Instructor'}
                                  </small>
                        </div>
                      </div>
                            )}

                            <div className='d-flex justify-content-between align-items-center border-top border-neutral-50 pt-16 mt-16'>
                              <Link
                                href={`/formation/${formation._id}`}
                                className='btn btn-link text-main-600 p-0 fw-semibold fs-5 hover-text-decoration-underline'
                              >
                                Details
                                <i className='ph ph-arrow-right ms-2' />
                              </Link>
                        </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <FooterOne />

      <style jsx global>{`
        .modern-card {
          background: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.3s ease;
          position: relative;
          border: 1px solid rgba(0, 0, 0, 0.08);
          height: 100%;
        }

        .modern-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }

        .card-image-wrapper {
          position: relative;
          padding-top: 56.25%;
          overflow: hidden;
          background: #f8f9fa;
        }

        .card-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }

        .modern-card:hover .card-image {
          transform: scale(1.08);
        }

        .card-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(to bottom, 
            rgba(0,0,0,0.1) 0%,
            rgba(0,0,0,0.2) 100%
          );
          opacity: 0;
          transition: all 0.3s ease;
          display: flex;
          align-items: flex-start;
          justify-content: flex-end;
          padding: 12px;
        }

        .modern-card:hover .card-overlay {
          opacity: 1;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
          transform: translateY(-10px);
          opacity: 0;
          transition: all 0.3s ease;
        }

        .modern-card:hover .action-buttons {
          transform: translateY(0);
          opacity: 1;
        }

        .action-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(8px);
        }

        .favorite-btn {
          background: rgba(255, 59, 92, 0.85);
        }

        .favorite-btn:hover {
          background: rgb(255, 59, 92);
          transform: scale(1.05);
        }

        .cart-btn {
          background: rgba(255, 204, 0, 0.85);
        }

        .cart-btn:hover {
          background: rgb(255, 204, 0);
          transform: scale(1.05);
        }

        .cart-btn.in-cart {
          background: rgba(34, 197, 94, 0.85);
        }

        .cart-btn.in-cart:hover {
          background: rgb(34, 197, 94);
        }

        .course-item {
          transition: all 0.3s ease;
        }

        .course-item:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }

        .course-item__img {
          transition: transform 0.5s ease;
        }

        .course-item:hover .course-item__img {
          transform: scale(1.08);
        }

        .link {
          text-decoration: none;
          color: inherit;
        }

        .text-line-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .flex-align {
          display: flex;
          align-items: center;
        }

        .flex-between {
          display: flex;
          justify-content: space-between;
        }

        .hover-text-decoration-underline:hover {
          text-decoration: underline !important;
        }

        @keyframes heartBeat {
          0% { transform: scale(1); }
          25% { transform: scale(1.2); }
          50% { transform: scale(0.95); }
          75% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }

        .favorite-btn:active i {
          animation: heartBeat 0.4s ease-in-out;
        }

        @keyframes cartBounce {
          0% { transform: translateY(0); }
          20% { transform: translateY(-4px); }
          40% { transform: translateY(0); }
          60% { transform: translateY(-2px); }
          80% { transform: translateY(0); }
        }

        .cart-btn:active i {
          animation: cartBounce 0.5s ease-in-out;
        }

        .filter-sidebar {
          background: white;
          padding: 24px;
          border-radius: 16px;
          box-shadow: 0 4px 25px rgba(0, 0, 0, 0.08);
          position: sticky;
          top: 20px;
          border: 1px solid rgba(0, 0, 0, 0.05);
        }

        .filter-header {
          margin-bottom: 24px;
        }

        .filter-icon-wrapper {
          width: 32px;
          height: 32px;
          background: #f0f7ff;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0d6efd;
        }

        .btn-reset {
          background: none;
          border: none;
          color: #666;
          font-size: 13px;
          padding: 6px 12px;
          border-radius: 20px;
          transition: all 0.2s;
        }

        .btn-reset:hover {
          background: #fee2e2;
          color: #ef4444;
        }

        .filter-section {
          padding-bottom: 20px;
          border-bottom: 1px solid #f0f0f0;
          margin-bottom: 20px;
          opacity: 0;
          animation: fadeIn 0.3s ease forwards;
        }

        .filter-section:last-child {
          border-bottom: none;
          padding-bottom: 0;
          margin-bottom: 0;
        }

        .filter-label {
          font-size: 14px;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 12px;
          display: block;
        }

        .search-wrapper {
          position: relative;
        }

        .search-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #666;
          font-size: 16px;
        }

        .search-input {
          width: 100%;
          padding: 12px 16px 12px 44px;
          border: 1px solid #e0e0e0;
          border-radius: 12px;
          font-size: 14px;
          transition: all 0.2s;
          background: #f8f9ff;
        }

        .search-input:focus {
          border-color: #0d6efd;
          box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.1);
          outline: none;
          transform: translateY(-1px);
        }

        .filter-options {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .filter-option {
          position: relative;
          padding: 8px 12px;
          border-radius: 8px;
          transition: all 0.2s;
          cursor: pointer;
        }

        .filter-option:hover {
          background: #f0f7ff;
          transform: translateX(4px);
        }

        .filter-checkbox {
          display: none;
        }

        .filter-label {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 0;
          cursor: pointer;
        }

        .filter-text {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          font-size: 14px;
          color: #1a1a1a;
        }

        .filter-count {
          font-size: 12px;
          color: #666;
          margin-left: 8px;
        }

        .filter-checkbox:checked + .filter-label .filter-text {
          color: #0d6efd;
          font-weight: 500;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .filter-section:nth-child(1) { animation-delay: 0.1s; }
        .filter-section:nth-child(2) { animation-delay: 0.2s; }
        .filter-section:nth-child(3) { animation-delay: 0.3s; }

        @media (max-width: 991px) {
          .filter-sidebar {
            margin-bottom: 24px;
            position: static;
          }
        }
      `}</style>
    </>
  );
};

export default MyFavoriteCoursesPage; 