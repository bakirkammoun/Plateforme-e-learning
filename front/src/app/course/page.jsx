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

const CoursePage = () => {
  const [formations, setFormations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedFormation, setSelectedFormation] = useState(null);
  const [inscriptionSuccess, setInscriptionSuccess] = useState(false);
  const [inscriptionError, setInscriptionError] = useState(null);
  const [hoveredRating, setHoveredRating] = useState({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleSidebarControl = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    fetchFormations();
  }, []);

  const fetchFormations = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get('http://localhost:5000/api/formations', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setFormations(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setError('Error loading courses');
      setLoading(false);
    }
  };

  const handleInscription = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(
        `http://localhost:5000/api/inscription-requests/${selectedFormation._id}`,
        { message: 'I would like to enroll in this course' },
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
      setInscriptionError(error.response?.data?.message || 'Error during enrollment');
    }
  };

  const openInscriptionModal = (formation) => {
    setSelectedFormation(formation);
    setShowModal(true);
    setInscriptionSuccess(false);
    setInscriptionError(null);
  };

  const handleRating = async (formationId, rating) => {
    try {
      const token = localStorage.getItem('authToken');
      await axios.post(`http://localhost:5000/api/formations/${formationId}/rate`, 
        { rating },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      fetchFormations(); // Refresh courses to update the rating
    } catch (error) {
      console.error('Error while rating:', error);
    }
  };

  const handleFilter = (filters) => {
    const { searchTerm, categories, levels, ratings, priceRange } = filters;
    // Add your filtering logic here
    console.log('Filtering with:', filters);
  };

  const filteredFormations = formations.filter(formation => {
    const matchesSearch = formation.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || formation.category === selectedCategory;
    const matchesLevel = !selectedLevel || formation.level === selectedLevel;
    return matchesSearch && matchesCategory && matchesLevel;
  });

  const categories = [...new Set(formations.map(f => f.category).filter(Boolean))];
  const levels = [...new Set(formations.map(f => f.level).filter(Boolean))];

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
                  sidebarControl={handleSidebarControl}
                  onFilter={handleFilter}
                  categories={[]}
                  levels={[]}
                />
              </div>
            </div>

            {/* Main Content */}
            <div className={`${isSidebarOpen ? 'col-lg-9' : 'col-12'}`}>
              <div className='d-flex justify-content-between align-items-center mb-30'>
                <div>
                  <h4 className='mb-8'>All Courses</h4>
                  <p className='mb-0 text-neutral-500'>Discover our quality courses</p>
                </div>
                <button
                  onClick={handleSidebarControl}
                  className='btn btn-outline-primary rounded-pill d-flex align-items-center gap-2'
                >
                  <i className={`ph-bold ${isSidebarOpen ? 'ph-x' : 'ph-funnel'}`}></i>
                  {isSidebarOpen ? 'Hide Filter' : 'Show Filter'}
                </button>
              </div>

              <div className={`row g-4 ${isSidebarOpen ? 'row-cols-1 row-cols-md-2' : 'row-cols-1 row-cols-md-2 row-cols-lg-3'}`}>
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
                            <div className='flex-align gap-8'>
                              <span className='text-neutral-700 text-lg fw-medium'>
                                By: {formation.instructorId.firstName} {formation.instructorId.lastName}
                              </span>
                            </div>
                          )}

                          <div className='d-flex justify-content-between align-items-center border-top border-neutral-50 pt-16 mt-16'>
                            <div className='d-flex align-items-center gap-2'>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  onClick={() => handleRating(formation._id, star)}
                                  onMouseEnter={() => setHoveredRating({ [formation._id]: star })}
                                  onMouseLeave={() => setHoveredRating({ [formation._id]: 0 })}
                                  className='btn p-0 border-0 transition-all'
                                >
                                  <i className={`ph-fill ph-star fs-5 ${
                                    star <= (hoveredRating[formation._id] || formation.rating || 0)
                                      ? 'text-warning-600'
                                      : 'text-neutral-300 hover-text-warning-600'
                                  }`} />
                                </button>
                              ))}
                              <span className='text-neutral-400 ms-2'>({formation.numberOfRatings || 0})</span>
                            </div>
                            <div className='d-flex gap-2'>
                              <button
                                onClick={() => openInscriptionModal(formation)}
                                className='btn btn-link text-main-600 p-0 fw-semibold fs-5 hover-text-decoration-underline'
                              >
                                Enroll
                                <i className='ph ph-arrow-right ms-2' />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <ul className='pagination gap-12 flex-center mt-60'>
                <li className='page-item'>
                  <Link
                    className='page-link text-neutral-700 fw-semibold w-40 h-40 bg-white rounded-circle hover-bg-main-600 border-neutral-30 hover-border-main-600 hover-text-white flex-center p-0'
                    href='#'
                  >
                    <i className='ph-bold ph-caret-left' />
                  </Link>
                </li>
                <li className='page-item'>
                  <Link
                    className='page-link text-neutral-700 fw-semibold w-40 h-40 bg-white rounded-circle hover-bg-main-600 border-neutral-30 hover-border-main-600 hover-text-white flex-center p-0'
                    href='#'
                  >
                    1
                  </Link>
                </li>
                <li className='page-item'>
                  <Link
                    className='page-link text-neutral-700 fw-semibold w-40 h-40 bg-white rounded-circle hover-bg-main-600 border-neutral-30 hover-border-main-600 hover-text-white flex-center p-0'
                    href='#'
                  >
                    2
                  </Link>
                </li>
                <li className='page-item'>
                  <Link
                    className='page-link text-neutral-700 fw-semibold w-40 h-40 bg-white rounded-circle hover-bg-main-600 border-neutral-30 hover-border-main-600 hover-text-white flex-center p-0'
                    href='#'
                  >
                    <i className='ph-bold ph-caret-right' />
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Enrollment Modal */}
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
                    Your enrollment request has been sent successfully!
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

      <style jsx global>{`
        .favorite-btn, .cart-btn {
          position: relative;
          overflow: hidden;
        }
        
        .favorite-btn::before, .cart-btn::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          transition: width 0.4s ease, height 0.4s ease;
        }
        
        .favorite-btn:hover::before, .cart-btn:hover::before {
          width: 120%;
          height: 120%;
        }
        
        .favorite-btn:active, .cart-btn:active {
          transform: scale(0.95) !important;
        }
        
        .favorite-btn i, .cart-btn i {
          z-index: 1;
          position: relative;
        }
        
        @keyframes heartBeat {
          0% { transform: scale(1); }
          25% { transform: scale(1.2); }
          50% { transform: scale(0.95); }
          75% { transform: scale(1.1); }
          100% { transform: scale(1); }
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
      `}</style>

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
      `}</style>
    </>
  );
};

export default CoursePage;
