"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Link from 'next/link';

const InstructorDetails = () => {
  const searchParams = useSearchParams();
  const [instructor, setInstructor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [favoriteInstructors, setFavoriteInstructors] = useState([]);

  useEffect(() => {
    const fetchInstructor = async () => {
      try {
        const id = searchParams.get('id');
        if (!id) {
          throw new Error('Instructor ID is required');
        }

        const response = await fetch(`http://localhost:5000/api/instructors/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch instructor details');
        }

        const data = await response.json();
        setInstructor(data);

        // Vérifier si l'utilisateur suit déjà l'instructeur
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          const userId = user.id || user._id || (user.user && (user.user.id || user.user._id));
          
          if (userId && data.followers) {
            const isUserFollowing = data.followers.includes(userId);
            setIsFollowing(isUserFollowing);
            console.log('Initial following status:', isUserFollowing);
          }

          // Vérifier si l'instructeur est dans les favoris de l'utilisateur
          const userFavorites = JSON.parse(localStorage.getItem(`favoriteInstructors_${userId}`) || '[]');
          setIsFavorite(userFavorites.some(fav => fav._id === data._id));
          setFavoriteInstructors(userFavorites);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching instructor:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchInstructor();
  }, [searchParams]);

  const handleFollowAction = async (action) => {
    try {
      if (!instructor || !instructor._id) {
        console.error('Invalid instructor data:', instructor);
        toast.error('Cannot follow: Invalid instructor data');
        return;
      }

      // Récupérer l'ID de l'utilisateur connecté
      const userStr = localStorage.getItem('user');
      const token = localStorage.getItem('authToken');
      
      console.log('Raw user data:', userStr);
      console.log('Token:', token);

      if (!token) {
        toast.error('Please log in to follow instructors');
        return;
      }

      let user;
      try {
        user = JSON.parse(userStr);
        console.log('Parsed user data:', user);
      } catch (e) {
        console.error('Error parsing user data:', e);
        toast.error('Session error. Please log in again.');
        return;
      }

      // Vérifier toutes les possibilités d'ID
      const userId = user.id || user._id || (user.user && (user.user.id || user.user._id));
      console.log('Found user ID:', userId);

      if (!userId) {
        console.log('User data structure:', user);
        toast.error('User ID not found. Please log in again.');
        return;
      }

      if (action === 'follow' && isFollowing) {
        toast.info("You're already following this instructor");
        return;
      }

      const response = await fetch(`http://localhost:5000/api/instructors/${instructor._id}/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          action,
          userId: userId
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Follow response error:', {
          status: response.status,
          statusText: response.statusText,
          data: errorData
        });
        throw new Error(`Failed to ${action} instructor: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      console.log('Follow response data:', data);
      
      setInstructor(prev => ({
        ...prev,
        followers: data.followers
      }));
      
      setIsFollowing(action === 'follow');
      toast.success(data.message);
    } catch (error) {
      console.error(`Error ${action}ing instructor:`, error);
      toast.error(error.message || `Failed to ${action} instructor`);
    }
  };

  // Fonction pour basculer l'état des favoris
  const toggleFavorite = () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      toast.error('Veuillez vous connecter pour ajouter aux favoris');
      return;
    }

    const user = JSON.parse(userStr);
    const userId = user.id || user._id || (user.user && (user.user.id || user.user._id));
    
    if (!userId) {
      toast.error('ID utilisateur non trouvé');
      return;
    }

    const storageKey = `favoriteInstructors_${userId}`;
    const storedFavorites = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    if (isFavorite) {
      // Supprimer des favoris
      const newFavorites = storedFavorites.filter(fav => fav._id !== instructor._id);
      localStorage.setItem(storageKey, JSON.stringify(newFavorites));
      setFavoriteInstructors(newFavorites);
      setIsFavorite(false);
      toast.success('Instructor removed from favorites');
    } else {
      // Ajouter aux favoris
      if (!storedFavorites.some(fav => fav._id === instructor._id)) {
        const newFavorites = [...storedFavorites, instructor];
        localStorage.setItem(storageKey, JSON.stringify(newFavorites));
        setFavoriteInstructors(newFavorites);
        setIsFavorite(true);
        toast.success('Instructor added to favorites');
      }
    }
  };

  // Modifier le handleShare pour afficher la liste des favoris
  const handleShare = () => {
    setShowFavorites(true);
  };

  if (loading) {
    return (
      <div className="flex-center py-120">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-120 text-center">
        <p className="text-danger">Error: {error}</p>
      </div>
    );
  }

  if (!instructor) {
    return (
      <div className="py-120 text-center">
        <p>No instructor found</p>
      </div>
    );
  }

  return (
    <section className='instructor-details py-120 position-relative z-1'>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className='container'>
        <div className='row gy-4'>
          <div className='col-lg-4'>
            <div className='instructor-profile-card bg-white rounded-4 p-4'>
              <div className='profile-image-wrapper mb-4'>
                <div className='profile-image-container'>
                  <div className='profile-image-inner'>
                    <img
                      src={instructor.profileImage || 'assets/images/thumbs/instructor-details-thumb.png'}
                      alt={`${instructor.firstName} ${instructor.lastName}`}
                      className='profile-image'
                    />
                    <div className='profile-status'></div>
                  </div>
                  <div className='profile-ring'></div>
                </div>
              </div>

              <div className="d-flex align-items-center gap-2 mt-3 mb-4">
                <button
                  onClick={() => handleFollowAction(isFollowing ? 'unfollow' : 'follow')}
                  className={`btn ${isFollowing ? 'btn-danger' : 'btn-primary'} rounded-pill flex-grow-1`}
                  style={{ minWidth: '200px' }}
                >
                  <i className={`ph-bold ${isFollowing ? 'ph-user-minus' : 'ph-user-plus'} me-2`}></i>
                  {isFollowing ? 'Unfollow' : 'Follow Me'}
                </button>
                <button
                  onClick={toggleFavorite}
                  className={`btn ${isFavorite ? 'btn-danger' : 'btn-light'} rounded-circle d-flex align-items-center justify-content-center shadow-sm`}
                  style={{ 
                    width: '42px', 
                    height: '42px', 
                    padding: 0,
                    border: `2px solid ${isFavorite ? '#dc3545' : '#dc3545'}`
                  }}
                >
                  <i className={`ph-bold ph-heart ${isFavorite ? 'text-white' : 'text-danger'}`}></i>
                </button>
              </div>

              <div className='d-flex flex-column gap-24 mb-4'>
                <div className='flex-align gap-12 mt-30'>
                  <span className='text-2xl w-44 h-44 border border border-neutral-30 rounded-4 flex-center text-main-600 bg-main-25'>
                    <i className='ph-bold ph-phone-call' />
                  </span>
                  <a href="tel:96261972" className='text-neutral-500 hover-text-main-600'>
                    96261972
                  </a>
                </div>
                <div className='flex-align gap-12'>
                  <span className='text-2xl w-44 h-44 border border border-neutral-30 rounded-4 flex-center text-success-600 bg-main-25'>
                    <i className='ph-bold ph-envelope-simple' />
                  </span>
                  <a href="mailto:bakir.kammoun001@gmail.com" className='text-neutral-500 hover-text-main-600'>
                    bakir.kammoun001@gmail.com
                  </a>
                </div>

                {/* Secteur */}
                <div className='flex-align gap-12'>
                  <span className='text-2xl w-44 h-44 border border-neutral-30 rounded-4 flex-center text-primary bg-main-25'>
                    <i className='ph-bold ph-graduation-cap'></i>
                  </span>
                  <div>
                    <h6 className='text-neutral-500 mb-1'>Sector</h6>
                    <p className='text-neutral-800 mb-0'>{instructor.sector}</p>
                  </div>
                </div>

                {/* Spécialisation */}
                <div className='flex-align gap-12'>
                  <span className='text-2xl w-44 h-44 border border-neutral-30 rounded-4 flex-center text-success bg-main-25'>
                    <i className='ph-bold ph-star'></i>
                  </span>
                  <div>
                    <h6 className='text-neutral-500 mb-1'>Specialization</h6>
                    <p className='text-neutral-800 mb-0'>{instructor.specialization}</p>
                  </div>
                </div>
              </div>

              <div className='social-links'>
                {instructor.socialLinks?.facebook && (
                  <li className='social-list__item'>
                    <a
                      href={instructor.socialLinks.facebook}
                      className='text-main-600 text-xl hover-text-white w-40 h-40 rounded-circle border border-main-600 hover-bg-main-600 flex-center'
                    >
                      <i className='ph-bold ph-facebook-logo' />
                    </a>
                  </li>
                )}
                {instructor.socialLinks?.twitter && (
                  <li className='social-list__item'>
                    <a
                      href={instructor.socialLinks.twitter}
                      className='text-main-600 text-xl hover-text-white w-40 h-40 rounded-circle border border-main-600 hover-bg-main-600 flex-center'
                    >
                      <i className='ph-bold ph-twitter-logo' />
                    </a>
                  </li>
                )}
                {instructor.socialLinks?.linkedin && (
                  <li className='social-list__item'>
                    <a
                      href={instructor.socialLinks.linkedin}
                      className='text-main-600 text-xl hover-text-white w-40 h-40 rounded-circle border border-main-600 hover-bg-main-600 flex-center'
                    >
                      <i className='ph-bold ph-linkedin-logo' />
                    </a>
                  </li>
                )}
              </div>

              {/* Modal pour afficher les favoris */}
              {showFavorites && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                  <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title">Enseignants Favoris</h5>
                        <button type="button" className="btn-close" onClick={() => setShowFavorites(false)}></button>
                      </div>
                      <div className="modal-body">
                        {favoriteInstructors.length > 0 ? (
                          <div className="list-group">
                            {favoriteInstructors.map((fav) => (
                              <div key={fav._id} className="list-group-item list-group-item-action d-flex align-items-center gap-3 py-3">
                                <img
                                  src={fav.profileImage || '/assets/images/thumbs/default-instructor.png'}
                                  alt={`${fav.firstName} ${fav.lastName}`}
                                  className="rounded-circle"
                                  style={{ width: '48px', height: '48px', objectFit: 'cover' }}
                                />
                                <div>
                                  <h6 className="mb-0">{fav.firstName} {fav.lastName}</h6>
                                  <small className="text-muted">{fav.specialization || 'Instructor'}</small>
                                </div>
                                <Link
                                  href={`/instructor-details?id=${fav._id}`}
                                  className="btn btn-sm btn-outline-primary ms-auto"
                                >
                                  Voir profil
                                </Link>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center py-4">Aucun enseignant favori</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className='col-lg-8 ps-xl-5'>
            <div className='ps-lg-5'>
              <h5 className='text-main-600 mb-0'>Instructor</h5>
              <h2 className='my-16'>{instructor.firstName} {instructor.lastName}</h2>
              <span className='text-neutral-700'>{instructor.specialization || 'Instructor'}</span>
              <div className='d-flex flex-column gap-16 flex-wrap max-w-340 mt-40'>
                <div className='flex-between gap-8'>
                  <div className='flex-align gap-8'>
                    <span className='text-neutral-700 text-2xl d-flex'>
                      <i className='ph-bold ph-lightbulb' />
                    </span>
                    <span className='text-neutral-700 text-lg fw-medium'>
                      {instructor.specialization || 'Instructor'}
                    </span>
                  </div>
                  <div className='flex-align gap-8'>
                    <span className='text-neutral-700 text-2xl d-flex'>
                      <i className='ph-bold ph-watch' />
                    </span>
                    <span className='text-neutral-700 text-lg fw-medium'>
                      {instructor.courses?.length || 0} Course{instructor.courses?.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <div className='flex-between gap-8 flex-wrap'>
                  <div className='flex-align gap-8'>
                    <span className='text-neutral-700 text-2xl d-flex'>
                      <i className='ph-bold ph-user-circle-plus' />
                    </span>
                    <span className='text-neutral-700 text-lg fw-medium'>
                      {instructor.followers?.length || 0} Followers
                    </span>
                  </div>
                  <div className='flex-align gap-4'>
                    <span className='text-2xl fw-medium text-warning-600 d-flex'>
                      <i className='ph-fill ph-star' />
                    </span>
                    <span className='text-lg text-neutral-700 fw-semibold'>
                      {instructor.rating || 0}
                      <span className='text-neutral-100 fw-normal'>({instructor.numberOfRatings || 0})</span>
                    </span>
                  </div>
                </div>
              </div>
              <span className='d-block border border-neutral-30 my-40 border-dashed' />
              <h4 className='mb-24'>Bio Data</h4>
              <p className='text-neutral-500'>
                {instructor.bio || 'No biography available.'}
              </p>
              <span className='d-block border border-neutral-30 my-40 border-dashed' />
              
              {instructor.address && (
                <>
                  <h4 className='mb-24'>Address</h4>
                  <div className='flex-align gap-12'>
                    <span className='text-2xl w-44 h-44 border border border-neutral-30 rounded-4 flex-center text-warning-600 bg-main-25'>
                      <i className='ph-bold ph-map-pin-line' />
                    </span>
                    <span className='text-neutral-500'>
                      {instructor.address}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className='row mt-60'>
          <div className='col-12'>
            <div className='section-heading text-center'>
              <div className='flex-align d-inline-flex gap-8 mb-16'>
                <span className='text-main-600 text-2xl d-flex'>
                  <i className='ph-bold ph-book' />
                </span>
                <h5 className='text-main-600 mb-0'>Instructor Courses</h5>
              </div>
              <h2 className='mb-24'>Courses by {instructor.firstName}</h2>
            </div>
          </div>
          {instructor.courses && instructor.courses.length > 0 ? (
            instructor.courses.map((course) => (
              <div key={course._id} className='col-lg-4 col-sm-6' style={{ marginTop: '20px' }}>
                <div 
                  className='course-item bg-white rounded-16 p-12 h-100 box-shadow-md cursor-pointer'
                  onClick={() => window.location.href = `/formation/${course._id}`}
                  style={{ cursor: 'pointer' }}
                >
                  <div className='course-item__thumb rounded-12 overflow-hidden position-relative'>
                    <img
                      src={course.image || '/assets/images/thumbs/course-default.jpg'}
                      alt={course.title}
                      className='course-item__img rounded-12 cover-img transition-2'
                    />
                    <div className='flex-align gap-8 bg-main-600 rounded-pill px-24 py-12 text-white position-absolute inset-block-start-0 inset-inline-start-0 mt-20 ms-20 z-1'>
                      <span className='text-2xl d-flex'>
                        <i className='ph ph-clock' />
                      </span>
                      <span className='text-lg fw-medium'>{course.duration || 'N/A'}</span>
                    </div>
                  </div>

                  <div className='course-item__content'>
                    <div>
                      <h4 className='mb-28'>
                        <span className='link text-line-2'>
                          {course.title}
                        </span>
                      </h4>
                      <div className='flex-between gap-8 flex-wrap mb-16'>
                        <div className='flex-align gap-8'>
                          <span className='text-neutral-700 text-2xl d-flex'>
                            <i className='ph-bold ph-video-camera' />
                          </span>
                          <span className='text-neutral-700 text-lg fw-medium'>
                            {course.level || 'All Levels'}
                          </span>
                        </div>
                        <div className='flex-align gap-8'>
                          <span className='text-neutral-700 text-2xl d-flex'>
                            <i className='ph-bold ph-chart-bar' />
                          </span>
                          <span className='text-neutral-700 text-lg fw-medium'>
                            {course.category || 'General'}
                          </span>
                        </div>
                      </div>

                      <div className='flex-align gap-8'>
                        <div className='w-32 h-32 rounded-circle overflow-hidden flex-shrink-0'>
                          <img
                            src={instructor.profileImage || '/assets/images/thumbs/default-instructor.png'}
                            alt={`${instructor.firstName} ${instructor.lastName}`}
                            className='w-100 h-100 cover-img'
                          />
                        </div>
                        <span className='text-neutral-700 text-lg fw-medium'>
                          By: {instructor.firstName} {instructor.lastName}
                        </span>
                      </div>

                      <div className='flex-between gap-8 flex-wrap mt-16'>
                        <div className='flex-align gap-4'>
                          <span className='text-lg text-neutral-700'>
                            {course.numberOfRatings || 0} étudiants inscrits
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className='flex-between gap-8 pt-24 border-top border-neutral-50 mt-28 border-dashed border-0'>
                      <h4 className='mb-0 text-main-two-600'>{course.price ? `${course.price} DT` : 'Free'}</h4>
                      <Link
                        href={`/formation/${course._id}`}
                        className='flex-align gap-8 text-main-600 hover-text-decoration-underline transition-1 fw-semibold'
                      >
                        View Details
                        <i className='ph ph-arrow-right ms-2' />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className='col-12'>
              <div className='text-center py-80 bg-white rounded-16 box-shadow-md'>
                <div className='max-w-576 mx-auto'>
                  <span className='text-main-600 text-5xl d-flex justify-content-center mb-24'>
                    <i className='ph-bold ph-books' />
                  </span>
                  <h4 className='mb-12'>No Courses Available</h4>
                  <p className='text-neutral-500'>
                    This instructor hasn't published any courses yet. Check back later for new content.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <style jsx>{`
        .course-item {
          transition: all 0.3s ease;
        }
        .course-item:hover {
          transform: translateY(-5px);
        }
        .course-item__img {
          width: 100%;
          height: 240px;
          object-fit: cover;
          transition: transform 0.6s ease;
        }
        .course-item:hover .course-item__img {
          transform: scale(1.1);
        }
        .text-line-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .link {
          color: inherit;
          text-decoration: none;
        }
        .link:hover {
          color: var(--bs-primary);
        }
        .box-shadow-md {
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.08);
        }
        .border-dashed {
          border-style: dashed !important;
        }
        .hover-text-decoration-underline:hover {
          text-decoration: underline !important;
        }
        .transition-1 {
          transition: all 0.3s ease;
        }
        .transition-2 {
          transition: all 0.6s ease;
        }
        .profile-image-wrapper {
          position: relative;
          padding: 20px;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .profile-image-container {
          position: relative;
          width: 200px;
          height: 200px;
          margin: 0 auto;
        }

        .profile-image-inner {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          padding: 4px;
          background: #0d6efd;
          box-shadow: 0 0 20px rgba(13, 110, 253, 0.15);
        }

        .profile-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
          border: 4px solid white;
          background-color: #fff;
        }

        .profile-status {
          position: absolute;
          bottom: 12px;
          right: 12px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background-color: #22c55e;
          border: 3px solid white;
          box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);
        }

        .profile-ring {
          position: absolute;
          top: -10px;
          left: -10px;
          right: -10px;
          bottom: -10px;
          border-radius: 50%;
          border: 2px solid rgba(13, 110, 253, 0.1);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.5;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .contact-info {
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 12px;
        }

        .contact-item {
          transition: all 0.2s ease;
        }

        .contact-item:hover {
          transform: translateX(5px);
        }

        .contact-icon {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(13, 110, 253, 0.1);
          border-radius: 8px;
          font-size: 1rem;
        }

        .contact-text {
          color: #666;
          text-decoration: none;
          font-size: 0.9rem;
          transition: color 0.2s ease;
        }

        .contact-text:hover {
          color: #0d6efd;
        }
      `}</style>
    </section>
  );
};

export default InstructorDetails;
