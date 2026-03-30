'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import axios from 'axios';
import { toast } from 'react-hot-toast';

const CourseAllOne = ({ limit, sortBy }) => {
  const [formations, setFormations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [userInterests, setUserInterests] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [userSectors, setUserSectors] = useState([]);

  useEffect(() => {
    const fetchUserAndFormations = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        console.log('Auth Token:', token ? 'Present' : 'Not found');
        
        // Fetch user data if logged in
        let userInfo = null;
        if (token) {
          try {
            console.log('Fetching user profile...');
          const userResponse = await axios.get('http://localhost:5000/api/users/profile', {
              headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            userInfo = userResponse.data;
            console.log('User Info received:', {
              role: userInfo.role,
              interests: userInfo.interests,
              sectors: userInfo.sectors,
              specializations: userInfo.specializations
            });
            
            setUserRole(userInfo.role);
            setUserInterests(userInfo.interests || []);
            setUserSectors(userInfo.sectors || []);
          } catch (error) {
            console.error('Error fetching user profile:', {
              message: error.message,
              response: error.response?.data,
              status: error.response?.status
            });
          }
        }

        // Fetch formations
        console.log('Fetching formations...');
        const formationsResponse = await axios.get('http://localhost:5000/api/formations');
        let allFormations = formationsResponse.data;
        console.log('Formations before sorting:', allFormations);

        // Sort formations based on user role and interests/sectors
        if (userInfo && userInfo.role) {
          console.log('Starting formation sorting for role:', userInfo.role);
          
          if (userInfo.role === 'student') {
            console.log('Applying student sorting logic');
            console.log('Student interests:', userInfo.interests);
            console.log('Student sectors:', userInfo.sectors);
            
            allFormations.sort((a, b) => {
              const aMatchesInterest = userInfo.interests?.some(interest =>
                a.category?.toLowerCase() === interest?.toLowerCase() ||
                a.level?.toLowerCase() === interest?.toLowerCase()
              ) || false;
              
              const aMatchesSector = userInfo.sectors?.some(sector =>
                a.category?.toLowerCase() === sector?.toLowerCase()
              ) || false;

              const bMatchesInterest = userInfo.interests?.some(interest =>
                b.category?.toLowerCase() === interest?.toLowerCase() ||
                b.level?.toLowerCase() === interest?.toLowerCase()
              ) || false;
              
              const bMatchesSector = userInfo.sectors?.some(sector =>
                b.category?.toLowerCase() === sector?.toLowerCase()
              ) || false;

              const aScore = (aMatchesSector ? 2 : 0) + (aMatchesInterest ? 1 : 0);
              const bScore = (bMatchesSector ? 2 : 0) + (bMatchesInterest ? 1 : 0);

              console.log('Sorting scores:', {
                aTitle: a.title,
                aScore,
                bTitle: b.title,
                bScore
              });

              if (aScore !== bScore) {
                return bScore - aScore;
              }
              return (b.rating || 0) - (a.rating || 0);
            });

          } else if (userInfo.role === 'instructor') {
            console.log('Applying instructor sorting logic');
            console.log('Instructor sectors:', userInfo.sectors);
            console.log('Instructor specializations:', userInfo.specializations);
            
            allFormations.sort((a, b) => {
              const aMatchesSector = userInfo.sectors?.some(sector =>
                a.category?.toLowerCase() === sector?.toLowerCase()
              ) || false;

              const aMatchesSpecialization = userInfo.specializations?.some(spec =>
                a.category?.toLowerCase() === spec?.toLowerCase() ||
                a.level?.toLowerCase() === spec?.toLowerCase()
              ) || false;

              const bMatchesSector = userInfo.sectors?.some(sector =>
                b.category?.toLowerCase() === sector?.toLowerCase()
              ) || false;

              const bMatchesSpecialization = userInfo.specializations?.some(spec =>
                b.category?.toLowerCase() === spec?.toLowerCase() ||
                b.level?.toLowerCase() === spec?.toLowerCase()
              ) || false;

              const aScore = (aMatchesSector ? 2 : 0) + (aMatchesSpecialization ? 1 : 0);
              const bScore = (bMatchesSector ? 2 : 0) + (bMatchesSpecialization ? 1 : 0);

              console.log('Sorting scores:', {
                aTitle: a.title,
                aScore,
                bTitle: b.title,
                bScore
              });

              if (aScore !== bScore) {
                return bScore - aScore;
              }
              return (b.rating || 0) - (a.rating || 0);
            });
          }
        } else {
          console.log('No user info or role, sorting by rating only');
          allFormations.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        }

        console.log('Formations after sorting:', allFormations);

        if (limit) {
          allFormations = allFormations.slice(0, limit);
          console.log('Formations after limit applied:', allFormations);
        }
        
        setFormations(allFormations);

        // Load favorites and cart items
        const savedFavorites = JSON.parse(localStorage.getItem('favoriteCourses') || '[]');
        setFavorites(savedFavorites);
        
        const savedCartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
        setCartItems(savedCartItems);

      } catch (error) {
        console.error('Error in fetchUserAndFormations:', error);
        setError('An error occurred while loading the courses. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndFormations();
  }, [limit]);

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

  const toggleFavorite = (formationId) => {
    setFavorites(prevFavorites => {
      const newFavorites = prevFavorites.includes(formationId)
        ? prevFavorites.filter(id => id !== formationId)
        : [...prevFavorites, formationId];
      
      localStorage.setItem('favoriteCourses', JSON.stringify(newFavorites));
      toast.success(prevFavorites.includes(formationId) ? 'Course removed from favorites' : 'Course added to favorites');
      return newFavorites;
    });
  };

  const toggleCart = (formation) => {
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

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center py-120">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );

  if (error) return (
    <div className="alert alert-danger text-center m-4" role="alert">
      {error}
    </div>
  );

  if (formations.length === 0) return (
    <div className="text-center py-120">
      <h3 className="text-muted">No courses found matching your interests</h3>
      <p className="mt-3">Explore our other courses or update your interests in your profile</p>
      <Link href="/formations" className="btn btn-primary mt-3">
        View All Courses
      </Link>
    </div>
  );

  return (
    <section className='py-120 bg-main-25'>
      <div className='container'>
        <div className='section-heading text-center'>
          <div className='flex-align d-inline-flex gap-8 mb-16'>
            <span className='text-main-600 text-2xl d-flex'>
              <i className='ph-bold ph-book' />
            </span>
            <h5 className='text-main-600 mb-0'>
              {userRole === 'student' ? 'Recommended Courses' : 
               userRole === 'instructor' ? 'Related Courses' : 
               'Our Courses'}
            </h5>
          </div>
          <h2 className='mb-24'>
            {userRole === 'student' ? 'Courses Matching Your Interests' :
             userRole === 'instructor' ? 'Courses in Your Field' :
             'Top Rated Courses'}
          </h2>
          {userRole && (userInterests.length > 0 || userSectors.length > 0) && (
            <p className="text-muted">
              Showing courses based on your {userRole === 'student' ? 'interests' : 'specialization'}
            </p>
          )}
        </div>

        <div className='row g-24'>
          {formations.map((formation) => (
            <div key={formation._id} className='col-lg-4 col-sm-6 mt-30'>
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
                          backgroundColor: favorites.includes(formation._id) ? '#ff3b5c' : '#ffcc00',
                          border: 'none',
                          cursor: 'pointer',
                          width: '38px',
                          height: '38px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title={favorites.includes(formation._id) ? "Remove from favorites" : "Add to favorites"}
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
                      <span className='text-lg fw-medium'>{formation.price ? `$${formation.price}` : 'Free'}</span>
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

                    <div className='d-flex justify-content-end border-top border-neutral-50 pt-16 mt-16'>
                      <Link
                        href={`/formation/${formation._id}`}
                        className='btn btn-link text-main-600 p-0 fw-semibold fs-5 hover-text-decoration-underline'
                      >
                        View Details
                        <i className='ph ph-arrow-right ms-2' />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-60">
            <Link
            href="/formations" 
            className="btn btn-primary btn-lg rounded-pill px-40 py-12 fw-semibold d-inline-flex align-items-center gap-2"
            >
            View All Courses
            <i className="ph ph-arrow-right"></i>
            </Link>
        </div>
      </div>
      <style jsx global>{`
        .rating-stars {
          display: flex;
          gap: 2px;
          align-items: center;
        }
        .rating-stars i {
          font-size: 1.2rem;
        }
      `}</style>
    </section>
  );
};

export default CourseAllOne;
