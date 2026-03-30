'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import HeaderStudent from '@/components/HeaderStudent';
import FooterOne from "@/components/FooterOne";
import Breadcrumb from "@/components/Breadcrumb";
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { useRouter, useSearchParams } from 'next/navigation';

const MyCoursesList = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const coursesPerPage = 12;
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchEnrollments();
    // Récupérer le statut depuis l'URL
    const status = searchParams.get('status');
    if (status) {
      setSelectedStatus([status]);
    }
  }, [searchParams]);

  const fetchEnrollments = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast.error('Please login to view your courses');
        router.push('/login');
        return;
      }

      const response = await axios.get('http://localhost:5000/api/enrollments/student/enrollments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setEnrollments(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Error loading courses');
      if (error.response?.status === 401) {
        router.push('/login');
      }
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-warning text-dark';
      case 'approved':
        return 'bg-success';
      case 'rejected':
        return 'bg-danger';
      case 'completed':
        return 'bg-info';
      default:
        return 'bg-secondary';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending approval';
      case 'approved':
        return 'Approved - Access granted';
      case 'rejected':
        return 'Rejected';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  const handleStatusChange = (status) => {
    setSelectedStatus(prev => {
      if (status === 'all') {
        return prev.length === 0 ? ['all'] : [];
      }
      const newStatus = prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev.filter(s => s !== 'all'), status];
      return newStatus;
    });
  };

  const filteredEnrollments = enrollments.filter(enrollment => {
    const matchesStatus = selectedStatus.length === 0 || selectedStatus.includes('all') || selectedStatus.includes(enrollment.status);
    const matchesSearch = searchTerm === '' || 
      enrollment.formationId.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.formationId.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Add new debounced search handler
  const debouncedSearch = (value) => {
    setSearchTerm(value);
  };

  const getStatusTitle = (status) => {
    switch (status) {
      case 'refused':
        return 'Rejected Courses';
      case 'approved':
        return 'Approved Courses';
      case 'pending':
        return 'Pending Courses';
      default:
        return 'My Courses';
    }
  };

  // Pagination logic
  const indexOfLastCourse = currentPage * coursesPerPage;
  const indexOfFirstCourse = indexOfLastCourse - coursesPerPage;
  const currentCourses = filteredEnrollments.slice(indexOfFirstCourse, indexOfLastCourse);
  const totalPages = Math.ceil(filteredEnrollments.length / coursesPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <>
        <HeaderStudent />
        <div className="d-flex justify-content-center align-items-center min-vh-100">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <HeaderStudent />
      <Breadcrumb title={selectedStatus.length === 1 ? getStatusTitle(selectedStatus[0]) : "My Courses"} />
      
      <section className='py-120' style={{ backgroundColor: '#F5F7FE' }}>
        <div className='container-fluid px-lg-80'>
          <div className='row g-4'>
            {/* Filters Sidebar */}
            <div className='col-lg-3'>
              <div className="filter-sidebar">
                <div className="filter-header d-flex justify-content-between align-items-center mb-4">
                  <h5 className="m-0 d-flex align-items-center">
                    <span className="filter-icon-wrapper me-2">
                      <i className="ph ph-funnel"></i>
                    </span>
                    Filters
                    <span className={`filter-count ms-2`}>
                      ({filteredEnrollments.length})
                    </span>
                  </h5>
                    <button
                    className="btn-reset" 
                    onClick={() => {
                      setSelectedStatus([]);
                      setSearchTerm('');
                    }}
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
                      onChange={(e) => debouncedSearch(e.target.value)}
                    />
                      </div>
                    </div>
                    
                <div className="filter-section">
                  <h6 className="filter-title">
                    <span className="filter-icon-wrapper me-2">
                      <i className="ph ph-chart-line-up"></i>
                    </span>
                    Course Status
                  </h6>
                  <div className="priority-options">
                    {[
                      { id: 'all', label: 'All Courses', count: enrollments.length, color: 'primary' },
                      { id: 'approved', label: 'In Progress', count: enrollments.filter(e => e.status === 'approved').length, color: 'success' },
                      { id: 'pending', label: 'Pending', count: enrollments.filter(e => e.status === 'pending').length, color: 'warning' },
                      { id: 'completed', label: 'Completed', count: enrollments.filter(e => e.status === 'completed').length, color: 'info' }
                    ].map((status) => (
                      <div className="priority-option" key={status.id}>
                        <input
                          type="checkbox"
                          id={status.id}
                          className="priority-checkbox"
                          checked={selectedStatus.includes(status.id)}
                          onChange={() => handleStatusChange(status.id)}
                        />
                        <label htmlFor={status.id} className="priority-label">
                          <span className={`priority-dot bg-${status.color}`}></span>
                          <div className="priority-text">
                            <span className="priority-name">{status.label}</span>
                            <span className="priority-desc">({status.count})</span>
                    </div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Course List */}
            <div className='col-lg-9'>
              <div className='d-flex justify-content-between align-items-center mb-30'>
                <div>
                  <h4 className='mb-8'>My Courses</h4>
                  <p className='mb-0 text-neutral-500'>
                    Showing {filteredEnrollments.length} course{filteredEnrollments.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {enrollments.length === 0 ? (
                <div className="empty-state bg-white rounded-16 p-60 text-center">
                  <span className="text-main-600 text-5xl d-flex justify-content-center mb-24">
                    <i className="ph-bold ph-books"></i>
                  </span>
                  <h4 className="mb-12">No Courses Enrolled</h4>
                  <p className="text-neutral-500">
                    Discover our courses and start your learning journey!
                  </p>
                  <Link href="/formations" className="btn btn-main-600 mt-3">
                    <i className="ph ph-books me-2"></i>
                    Browse Courses
                  </Link>
                </div>
              ) : (
                <>
                  <div className="row g-4">
                    {currentCourses.map((enrollment) => (
                      <div key={enrollment._id} className="col-md-6 col-lg-4">
                        <div style={{ backgroundColor: '#FFFFFF' }} className='course-item rounded-16 p-12 h-100 box-shadow-md'>
                          <div className='course-item__thumb rounded-12 overflow-hidden position-relative'>
                            <img
                              src={enrollment.formationId.image || '/assets/images/default-course.png'}
                              className="w-100 h-100 object-fit-cover"
                              alt={enrollment.formationId.title}
                              style={{ height: '240px' }}
                            />
                            <div className='position-absolute top-0 end-0 m-3'>
                              <span className={`badge rounded-pill ${getStatusBadgeClass(enrollment.status)}`}>
                                {getStatusText(enrollment.status)}
                              </span>
                            </div>
                          </div>

                          <div className='course-item__content p-20'>
                            <h5 className='mb-16 text-truncate'>{enrollment.formationId.title}</h5>
                            
                            <div className='flex-between gap-8 flex-wrap mb-16'>
                              <div className='flex-align gap-8'>
                                <span className='text-neutral-700 text-2xl d-flex'>
                                  <i className='ph-bold ph-book-open' />
                                </span>
                                <span className='text-neutral-700 text-lg fw-medium'>
                                  {enrollment.formationId.level || 'All Levels'}
                                </span>
                              </div>
                              <div className='flex-align gap-8'>
                                <span className='text-neutral-700 text-2xl d-flex'>
                                  <i className='ph-bold ph-chart-bar' />
                                </span>
                                <span className='text-neutral-700 text-lg fw-medium'>
                                  {enrollment.formationId.category || 'General'}
                                </span>
                              </div>
                            </div>

                            <div className="progress-wrapper mb-16">
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <span className="text-neutral-700">Progress</span>
                                <span className="text-main-600 fw-medium">{enrollment.progress || 0}%</span>
                              </div>
                              <div className="progress" style={{ height: '8px', backgroundColor: 'var(--bg-1)' }}>
                                <div
                                  className="progress-bar"
                                  style={{ 
                                    width: `${enrollment.progress || 0}%`,
                                    backgroundColor: 'var(--bs-main-600)'
                                  }}
                                ></div>
                              </div>
                            </div>

                            <div className="course-info mb-16">
                              <div className="d-flex align-items-center text-neutral-700 gap-2 mb-2">
                                <i className="ph ph-calendar"></i>
                                <small>Enrolled: {new Date(enrollment.purchaseDate).toLocaleDateString()}</small>
                              </div>
                              {enrollment.approvalDate && (
                                <div className="d-flex align-items-center text-neutral-700 gap-2">
                                  <i className="ph ph-check-circle"></i>
                                  <small>Approved: {new Date(enrollment.approvalDate).toLocaleDateString()}</small>
                                </div>
                              )}
                            </div>

                            {enrollment.status === 'approved' && (
                              <Link
                                href={`/formation-copy/${enrollment.formationId._id}`}
                                className="btn btn-primary w-100 d-flex align-items-center justify-content-center"
                                style={{ minHeight: '52px' }}
                              >
                                <i className="ph ph-play-circle me-2 text-xl"></i>
                                Continue Learning
                              </Link>
                            )}

                            {enrollment.status === 'pending' && (
                              <div className="alert-custom d-flex align-items-center gap-2 rounded-8 py-4 px-4">
                                <i className="ph-bold ph-hourglass text-warning text-xl"></i>
                                <span className="text-dark fw-medium">Waiting for instructor approval</span>
                              </div>
                            )}

                            {enrollment.status === 'rejected' && (
                              <div className="alert alert-danger-soft mb-0 rounded-8" role="alert">
                                <i className="ph ph-x-circle me-2"></i>
                                Course access denied
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="pagination-wrapper d-flex justify-content-center align-items-center mt-40">
                      <nav aria-label="Course pagination">
                        <ul className="pagination">
                          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                            <button
                              className="page-link"
                              onClick={() => handlePageChange(currentPage - 1)}
                              disabled={currentPage === 1}
                            >
                              <i className="ph ph-caret-left"></i>
                            </button>
                          </li>
                          
                          {[...Array(totalPages)].map((_, index) => (
                            <li
                              key={index + 1}
                              className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}
                            >
                              <button
                                className="page-link"
                                onClick={() => handlePageChange(index + 1)}
                              >
                                {index + 1}
                              </button>
                            </li>
                          ))}
                          
                          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                            <button
                              className="page-link"
                              onClick={() => handlePageChange(currentPage + 1)}
                              disabled={currentPage === totalPages}
                            >
                              <i className="ph ph-caret-right"></i>
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

        .priority-options {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 16px;
        }

        .priority-option {
          position: relative;
          padding: 8px 12px;
          border-radius: 8px;
          transition: background-color 0.2s;
          cursor: pointer;
          transform-origin: left center;
          transition: all 0.2s ease;
        }

        .priority-option:hover {
          background: #f0f7ff;
          transform: translateX(4px);
        }

        .priority-checkbox {
          margin-right: 12px;
        }

        .priority-label {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 0;
          cursor: pointer;
        }

        .priority-dot {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
        }

        .priority-text {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex: 1;
        }

        .priority-name {
          font-size: 14px;
          color: #1a1a1a;
          font-weight: 500;
        }

        .priority-desc {
          font-size: 12px;
          color: #666;
        }

        .priority-checkbox:checked + .priority-label .priority-dot {
          transform: scale(1.1);
          transition: transform 0.2s ease;
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

        @media (max-width: 991px) {
          .filter-sidebar {
            margin-bottom: 24px;
            position: static;
          }
        }

        .pagination-wrapper {
          margin-top: 2rem;
        }

        .pagination {
          display: flex;
          gap: 0.5rem;
        }

        .page-item {
          list-style: none;
        }

        .page-link {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          background-color: white;
          color: var(--text-color);
          transition: all 0.3s ease;
        }

        .page-link:hover:not(:disabled) {
          background-color: var(--main-600);
          color: white;
          border-color: var(--main-600);
        }

        .page-item.active .page-link {
          background-color: var(--main-600);
          color: white;
          border-color: var(--main-600);
        }

        .page-item.disabled .page-link {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </>
  );
};

export default MyCoursesList; 