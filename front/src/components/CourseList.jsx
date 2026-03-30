'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

const CourseList = ({ courses, onToggleFavorite, onToggleCart }) => {
  const [favoritesState, setFavoritesState] = useState([]);
  const [cartItemsState, setCartItemsState] = useState([]);

  useEffect(() => {
    // Charger les favoris depuis localStorage
    const savedFavorites = JSON.parse(localStorage.getItem('favoriteCourses') || '[]');
    setFavoritesState(savedFavorites);
    // Charger les éléments du panier depuis localStorage
    const savedCartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
    setCartItemsState(savedCartItems);

    // Écouter les changements du localStorage
    const handleStorageChange = () => {
      const newFavorites = JSON.parse(localStorage.getItem('favoriteCourses') || '[]');
      const newCartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
      setFavoritesState(newFavorites);
      setCartItemsState(newCartItems);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    // Étoiles pleines
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <i key={`full-${i}`} className="ph-fill ph-star" style={{ color: '#ffc107' }}></i>
      );
    }

    // Demi-étoile si nécessaire
    if (hasHalfStar) {
      stars.push(
        <i key="half" className="ph-fill ph-star-half" style={{ color: '#ffc107' }}></i>
      );
    }

    // Étoiles vides
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <i key={`empty-${i}`} className="ph ph-star" style={{ color: '#e4e5e9' }}></i>
      );
    }

    return stars;
  };

  const handleToggleFavorite = (formationId) => {
    setFavoritesState(prev => {
      const isFavorite = prev.includes(formationId);
      const newFavorites = isFavorite
        ? prev.filter(id => id !== formationId)
        : [...prev, formationId];
      localStorage.setItem('favoriteCourses', JSON.stringify(newFavorites));
      return newFavorites;
    });
    onToggleFavorite(formationId);
  };

  const handleToggleCart = (formation) => {
    setCartItemsState(prev => {
      const isInCart = prev.some(item => item._id === formation._id);
      const newCartItems = isInCart
        ? prev.filter(item => item._id !== formation._id)
        : [...prev, formation];
      localStorage.setItem('cartItems', JSON.stringify(newCartItems));
      return newCartItems;
    });
    onToggleCart(formation);
  };

  if (!courses.length) {
    return (
      <div className="text-center py-8">
        <h3>Aucune formation trouvée</h3>
        <p className="text-neutral-500">Essayez d'ajuster vos critères de recherche</p>
      </div>
    );
  }

  return (
    <div className={`row g-4`}>
      {courses.map((formation) => (
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
                      handleToggleFavorite(formation._id);
                    }}
                    className="flex-align gap-8 rounded-circle text-white favorite-btn"
                    style={{
                      backgroundColor: favoritesState.includes(formation._id) ? '#ff3b5c' : '#ffcc00',
                      border: 'none',
                      cursor: 'pointer',
                      width: '38px',
                      height: '38px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title={favoritesState.includes(formation._id) ? "Retirer des favoris" : "Ajouter aux favoris"}
                  >
                    <i className="ph-fill ph-heart" style={{ color: 'white', fontSize: '1.2rem' }} />
                  </button>
                  <button
                    onClick={() => handleToggleCart(formation)}
                    className="flex-align gap-8 rounded-circle text-white cart-btn"
                    style={{ 
                      backgroundColor: cartItemsState.some(item => item._id === formation._id) ? '#22c55e' : '#ffcc00', 
                      border: 'none', 
                      cursor: 'pointer',
                      width: '38px',
                      height: '38px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title={cartItemsState.some(item => item._id === formation._id) ? "Retirer du panier" : "Ajouter au panier"}
                  >
                    <i className={`ph-fill ${cartItemsState.some(item => item._id === formation._id) ? 'ph-shopping-cart-simple' : 'ph-shopping-cart'}`}
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
                  <span className='text-lg fw-medium'>{formation.price ? `${formation.price} DT` : 'Gratuit'}</span>
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

                <div className='flex-between gap-8 flex-wrap mb-16'>
                  <div className='rating-stars'>
                    {renderStars(formation.rating || 0)}
                  </div>
                  <span className='text-neutral-700'>
                    ({formation.numberOfRatings || 0} avis)
                  </span>
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
                            console.log('Image error:', e);
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
                  <div className='d-flex gap-2'>
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
        </div>
      ))}
      <style jsx global>{`
        .rating-stars {
          display: flex;
          gap: 2px;
          align-items: center;
        }
        .rating-stars i {
          font-size: 1.2rem;
        }
        .course-item {
          transition: all 0.3s ease;
        }
        .course-item:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
};

export default CourseList; 