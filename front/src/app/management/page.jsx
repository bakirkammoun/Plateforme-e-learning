'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { toast, Toaster } from 'react-hot-toast';
import HeaderOne from "@/components/Header";
import FooterOne from "@/components/FooterOne";
import Breadcrumb from "@/components/Breadcrumb";
import Animation from "@/components/Animation";

const ManagementPage = () => {
  const [cvs, setCvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'pending', 'accepted', 'rejected'
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const router = useRouter();

  const breadcrumbItems = [
    { label: "Home", link: "/" },
    { label: "Supervision Management", link: "/management" },
  ];

  useEffect(() => {
    fetchSharedCVs();
  }, []);

  const fetchSharedCVs = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('Missing token');
        toast.error('Please login to access this page');
        router.push('/login');
        return;
      }

      setLoading(true);
      console.log('Fetching supervised CVs...');

      const response = await axios.get(
        'http://localhost:5000/api/cv/instructor/supervised-cvs',
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        console.log('CVs retrieved:', response.data.cvs);
        const sortedCVs = response.data.cvs.sort((a, b) => {
          // Priority to pending CVs
          if (a.supervisionStatus === 'pending' && b.supervisionStatus !== 'pending') return -1;
          if (b.supervisionStatus === 'pending' && a.supervisionStatus !== 'pending') return 1;
          
          // Then by request date (most recent first)
          return new Date(b.supervisionRequestDate) - new Date(a.supervisionRequestDate);
        });

        setCvs(sortedCVs);
      } else {
        throw new Error(response.data.message || 'Error retrieving CVs');
      }
    } catch (error) {
      console.error('Detailed error:', error);
      toast.error(
        error.response?.data?.message || 
        'Error retrieving supervised CVs'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleViewCV = (cvId) => {
    router.push(`/cv/${cvId}`);
  };

  const handleChat = (studentId) => {
    router.push(`/messanger?studentId=${studentId}`);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="badge bg-warning">En attente</span>;
      case 'accepted':
        return <span className="badge bg-success">Accepté</span>;
      case 'rejected':
        return <span className="badge bg-danger">Refusé</span>;
      default:
        return <span className="badge bg-secondary">Status inconnu</span>;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'pending':
        return 'border-warning';
      case 'accepted':
        return 'border-success';
      case 'rejected':
        return 'border-danger';
      default:
        return 'border-secondary';
    }
  };

  const filteredCVs = cvs.filter(cv => {
    // Filtre par statut
    if (activeTab !== 'all' && cv.supervisionStatus !== activeTab) return false;
    
    // Filtre par recherche (nom ou email)
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const fullName = `${cv.userId?.firstName} ${cv.userId?.lastName}`.toLowerCase();
      const email = cv.userId?.email.toLowerCase();
      if (!fullName.includes(searchLower) && !email.includes(searchLower)) {
        return false;
      }
    }
    
    // Filtre par date
    if (startDate || endDate) {
      const requestDate = new Date(cv.supervisionRequestDate);
      if (startDate && new Date(startDate) > requestDate) return false;
      if (endDate && new Date(endDate) < requestDate) return false;
    }
    
    return true;
  });

  const getCategoryCount = (status) => {
    return cvs.filter(cv => cv.supervisionStatus === status).length;
  };

  const handleStopSupervision = async (cvId, studentName) => {
    if (window.confirm(`Êtes-vous sûr de vouloir arrêter l'encadrement de ${studentName} ?`)) {
      try {
        const token = localStorage.getItem('authToken');
        await axios.post(
          `http://localhost:5000/api/cv/${cvId}/stop-supervision`,
          {},
          { headers: { Authorization: `Bearer ${token}` }}
        );
        
        toast.success(`L'encadrement de ${studentName} a été arrêté`);
        fetchSharedCVs();
      } catch (error) {
        console.error('Erreur lors de l\'arrêt de l\'encadrement:', error);
        toast.error('Erreur lors de l\'arrêt de l\'encadrement');
      }
    }
  };

  const handleSupervisionResponse = async (cvId, studentName, status) => {
    try {
      const token = localStorage.getItem('authToken');
      await axios.post(
        `http://localhost:5000/api/cv/${cvId}/supervision-response`,
        { status },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      toast.success(`Demande d'encadrement ${status === 'accepted' ? 'acceptée' : 'refusée'}`);
      fetchSharedCVs();
    } catch (error) {
      console.error('Erreur lors de la réponse à la demande:', error);
      toast.error('Erreur lors de la réponse à la demande');
    }
  };

  return (
    <>
      <HeaderOne />
      <Animation />
      <Breadcrumb title="Supervision Management" />
      <Toaster position="top-right" />
      
      <section className='py-120' style={{ backgroundColor: '#FDFDFC' }}>
        <div className='container-fluid px-lg-80'>
          <div className="page-header text-center mb-30">
            <div className="logo-animation mb-4">
              <i className="ph ph-users-three text-primary" style={{ fontSize: '3rem' }}></i>
            </div>
            <h4 className='mb-8'>Supervision Requests</h4>
            <p className='mb-0 text-neutral-500'>
              Manage your supervision requests efficiently
            </p>
          </div>

          <div className='row g-4'>
            {/* Sidebar Filters */}
            <div className='col-lg-3'>
              <div className="filter-sidebar bg-white rounded-16 p-24 box-shadow-md">
                {/* Search Filter */}
                <div className="filter-section mb-24">
                  <h6 className="text-neutral-700 mb-16">Search</h6>
                  <div className="search-box">
                    <i className="ph ph-magnifying-glass search-icon"></i>
                    <input
                      type="text"
                      className="form-control search-input"
                      placeholder="Search by name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div className="filter-section mb-24">
                  <h6 className="text-neutral-700 mb-16">Status</h6>
                  <div className="status-filters d-flex flex-column gap-2">
              <button
                      className={`filter-btn d-flex justify-content-between align-items-center p-12 rounded-pill ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                      <span>All Requests</span>
                      <span className="badge bg-primary-soft">{cvs.length}</span>
              </button>
              <button
                      className={`filter-btn d-flex justify-content-between align-items-center p-12 rounded-pill ${activeTab === 'pending' ? 'active' : ''}`}
                onClick={() => setActiveTab('pending')}
              >
                      <span>Pending</span>
                      <span className="badge bg-primary-soft">{getCategoryCount('pending')}</span>
              </button>
              <button
                      className={`filter-btn d-flex justify-content-between align-items-center p-12 rounded-pill ${activeTab === 'accepted' ? 'active' : ''}`}
                onClick={() => setActiveTab('accepted')}
              >
                      <span>Accepted</span>
                      <span className="badge bg-primary-soft">{getCategoryCount('accepted')}</span>
              </button>
              <button
                      className={`filter-btn d-flex justify-content-between align-items-center p-12 rounded-pill ${activeTab === 'rejected' ? 'active' : ''}`}
                onClick={() => setActiveTab('rejected')}
              >
                      <span>Rejected</span>
                      <span className="badge bg-primary-soft">{getCategoryCount('rejected')}</span>
              </button>
            </div>
          </div>
          
                {/* Date Filter */}
                <div className="filter-section mb-24">
                  <h6 className="text-neutral-700 mb-16">Date Range</h6>
                  <div className="date-filter d-flex flex-column gap-2">
                    <input
                      type="date"
                      className="form-control"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      placeholder="Start Date"
                    />
                    <input
                      type="date"
                      className="form-control"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      placeholder="End Date"
                    />
                  </div>
                </div>

                {/* Clear Filters */}
                <button
                  className="btn btn-primary w-100 rounded-pill"
                  onClick={() => {
                    setSearchQuery('');
                    setStartDate('');
                    setEndDate('');
                    setActiveTab('all');
                  }}
                >
                  <i className="ph ph-x me-2"></i>
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div className='col-lg-9'>
              <div className='d-flex justify-content-between align-items-center mb-30'>
                <div>
                  <h4 className='mb-8'>
                    {activeTab === 'all' ? 'All Requests' : 
                     activeTab === 'pending' ? 'Pending Requests' :
                     activeTab === 'accepted' ? 'Accepted Requests' : 'Rejected Requests'}
                  </h4>
                  <p className='mb-0 text-neutral-500'>
                    Showing {filteredCVs.length} request{filteredCVs.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div className="row g-4">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary mb-3" role="status">
                      <span className="visually-hidden">Loading...</span>
              </div>
                    <p className="text-muted">Loading supervision requests...</p>
            </div>
          ) : filteredCVs.length === 0 ? (
            <div className="text-center py-5">
              <i className="ph-bold ph-users text-muted" style={{ fontSize: '3rem' }}></i>
                    <h3 className="mt-3 mb-2">No {activeTab !== 'all' ? `${activeTab} ` : ''}requests</h3>
              <p className="text-muted">
                {activeTab === 'all' 
                        ? "You haven't received any supervision requests yet"
                        : `You don't have any ${activeTab} requests`
                }
              </p>
            </div>
          ) : (
                  filteredCVs.map((cv) => (
                <div key={cv._id} className="col-md-6 col-lg-4">
                      <div className={`supervision-card rounded-16 bg-white h-100`}>
                        <div className="card-body p-24">
                          {/* Header avec photo et actions */}
                          <div className="card-header-content mb-3">
                            <div className="d-flex justify-content-between align-items-start">
                              <div className="d-flex gap-3">
                                {cv.userId?.profileImage ? (
                                  <div className="profile-image-wrapper">
                                    <img 
                                      src={cv.userId.profileImage.startsWith('data:') 
                                        ? cv.userId.profileImage 
                                        : `http://localhost:5000/${cv.userId.profileImage}`}
                                      alt={`${cv.userId.firstName} ${cv.userId.lastName}`}
                                      className="profile-image"
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        const initials = `${cv.userId.firstName?.[0] || ''}${cv.userId.lastName?.[0] || ''}`.toUpperCase();
                                        e.target.outerHTML = `<div class="profile-initials">${initials}</div>`;
                                      }}
                                    />
                                  </div>
                                ) : (
                                  <div className="profile-initials">
                                    {`${cv.userId.firstName?.[0] || ''}${cv.userId.lastName?.[0] || ''}`.toUpperCase()}
                                  </div>
                                )}
                                <div className="student-info">
                                  <h5 className="student-name">
                                    {cv.userId?.firstName} {cv.userId?.lastName}
                                  </h5>
                                  <p className="student-email">
                                    {cv.userId?.email}
                                  </p>
                                </div>
                              </div>
                              <div className="action-buttons d-flex gap-2">
                                <button
                                  onClick={() => handleChat(cv.userId?._id)}
                                  className="action-btn chat-btn"
                                  title="Message"
                                >
                                  <i className="ph ph-chat-circle-dots"></i>
                                </button>
                                {cv.supervisionStatus === 'accepted' && (
                                  <button
                                    onClick={() => handleStopSupervision(cv._id, `${cv.userId?.firstName} ${cv.userId?.lastName}`)}
                                    className="action-btn stop-btn"
                                    title={`Stop Supervision of ${cv.userId?.firstName} ${cv.userId?.lastName}`}
                                  >
                                    <i className="ph ph-stop-circle"></i>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Status et Date */}
                          <div className="status-section mb-4">
                            <div className="d-flex align-items-center gap-2">
                              <span className={`status-badge ${
                                cv.supervisionStatus === 'pending' ? 'status-pending' :
                                cv.supervisionStatus === 'accepted' ? 'status-accepted' :
                                'status-rejected'
                              }`}>
                                {cv.supervisionStatus === 'pending' ? 'Pending' :
                                 cv.supervisionStatus === 'accepted' ? 'Accepted' : 'Rejected'}
                              </span>
                              <span className="date-info">
                                {new Date(cv.supervisionRequestDate).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          {/* Actions principales */}
                          {cv.supervisionStatus === 'pending' && (
                            <div className="main-actions">
                              <div className="action-group">
                                <button
                                  onClick={() => handleSupervisionResponse(cv._id, `${cv.userId?.firstName} ${cv.userId?.lastName}`, 'accepted')}
                                  className="btn-action accept"
                                >
                                  <i className="ph ph-check"></i>
                                  <span>Accept</span>
                                </button>
                                <button
                                  onClick={() => handleSupervisionResponse(cv._id, `${cv.userId?.firstName} ${cv.userId?.lastName}`, 'rejected')}
                                  className="btn-action decline"
                                >
                                  <i className="ph ph-x"></i>
                                  <span>Decline</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                </div>
            </div>
          </div>
        </div>
      </section>
      <FooterOne />

      <style jsx>{`
        .py-120 {
          padding-top: 120px;
          padding-bottom: 120px;
        }

        .px-lg-80 {
          padding-left: 80px;
          padding-right: 80px;
        }

        .mb-30 {
          margin-bottom: 30px;
        }

        .rounded-16 {
          border-radius: 16px;
        }

        .box-shadow-md {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .course-item {
          transition: all 0.3s ease;
          height: 100%;
        }

        .course-item:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.12);
        }

        .filter-tabs {
          background: white;
          padding: 1rem;
          border-radius: 16px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .nav-pills .nav-link {
          color: #6c757d;
          transition: all 0.2s ease;
          margin-right: 0.75rem;
          font-weight: 500;
          padding: 0.75rem 1.5rem;
          position: relative;
          overflow: hidden;
        }

        .nav-pills .nav-link:hover:not(.active) {
          background-color: rgba(13, 110, 253, 0.05);
          color: #0d6efd;
        }

        .nav-pills .nav-link.active {
          background: linear-gradient(45deg, #0d6efd, #0a58ca);
          color: white;
          box-shadow: 0 4px 12px rgba(13, 110, 253, 0.2);
        }

        .btn {
          transition: all 0.2s ease;
          height: 44px;
          font-weight: 500;
          padding: 0 1.5rem;
          position: relative;
          overflow: hidden;
          border-width: 2px;
          letter-spacing: 0.3px;
        }

        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .btn:active {
          transform: translateY(0);
        }

        .btn i {
          font-size: 1.2rem;
          transition: transform 0.2s ease;
        }

        .btn:hover i {
          transform: scale(1.1);
        }

        .btn-primary {
          background: #0d6efd;
          border: none;
          color: white;
        }

        .btn-primary:hover {
          background: #0b5ed7;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(13, 110, 253, 0.2);
        }

        .btn-outline-primary {
          border-color: #0d6efd;
          color: #0d6efd;
          background: rgba(13, 110, 253, 0.05);
        }

        .btn-outline-primary:hover {
          background: #0d6efd;
          color: white;
          border-color: #0d6efd;
        }

        .btn-outline-secondary {
          border-color: #6c757d;
          color: #6c757d;
          background: rgba(108, 117, 125, 0.05);
        }

        .btn-outline-secondary:hover {
          background: #6c757d;
          color: white;
          border-color: #6c757d;
        }

        .action-group {
          display: flex;
          gap: 0.75rem;
          width: 100%;
        }

        .card-actions {
          margin-top: 1.5rem;
          opacity: 0.95;
          transition: opacity 0.2s ease;
        }

        .course-item:hover .card-actions {
          opacity: 1;
        }

        .badge {
          padding: 0.5em 1.2em;
          border-radius: 20px;
          font-weight: 500;
          letter-spacing: 0.3px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .flex-1 {
          flex: 1;
        }

        .btn-sm {
          height: 36px;
          width: 36px;
          padding: 0;
          font-size: 1.1rem;
        }

        .btn-primary {
          background: #0d6efd;
          border: none;
          color: white;
        }

        .btn-primary:hover {
          background: #0b5ed7;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(13, 110, 253, 0.2);
        }

        .logo-animation {
          animation: float 3s ease-in-out infinite;
        }

        .logo-animation i {
          display: inline-block;
          padding: 1rem;
          border-radius: 50%;
          background: rgba(13, 110, 253, 0.1);
          box-shadow: 0 4px 12px rgba(13, 110, 253, 0.15);
        }

        @keyframes float {
          0% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
          100% {
            transform: translateY(0px);
          }
        }

        .text-center {
          text-align: center;
        }

        .page-header h4 {
          font-size: 2rem;
          font-weight: 600;
          color: #2c3345;
        }

        .page-header p {
          font-size: 1.1rem;
          max-width: 500px;
          margin: 0 auto;
        }

        .btn-warning {
          background: #fd7e14;
          border: none;
          color: white;
        }

        .btn-warning:hover {
          background: #dc6a11;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(253, 126, 20, 0.2);
        }

        .student-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .student-info h5 {
          font-size: 1.1rem;
          font-weight: 600;
          color: #2c3345;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.2;
        }

        .student-info p {
          font-size: 0.9rem;
          color: #6c757d;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.2;
        }

        .filter-container {
          background: white;
          padding: 1.5rem;
          border-radius: 16px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .search-box {
          position: relative;
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #6c757d;
          font-size: 1.2rem;
        }

        .search-input {
          padding-left: 2.8rem;
          height: 44px;
          border-radius: 22px;
          border: 2px solid #e9ecef;
          transition: all 0.2s ease;
        }

        .search-input:focus {
          border-color: #0d6efd;
          box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
        }

        .form-control {
          height: 44px;
          border-radius: 22px;
          border: 2px solid #e9ecef;
          padding: 0.5rem 1rem;
          font-size: 0.95rem;
          transition: all 0.2s ease;
        }

        .form-control:focus {
          border-color: #0d6efd;
          box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
        }

        .date-filter .form-control {
          width: 100%;
        }

        .filter-actions .btn {
          width: 100%;
        }

        .filter-sidebar {
          position: sticky;
          top: 20px;
          height: fit-content;
        }

        .filter-section {
          border-bottom: 1px solid #e9ecef;
          padding-bottom: 24px;
        }

        .filter-section:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .filter-btn {
          background: none;
          border: 1px solid #e9ecef;
          transition: all 0.2s ease;
          text-align: left;
          color: #6c757d;
        }

        .filter-btn:hover {
          background: rgba(13, 110, 253, 0.05);
          border-color: #0d6efd;
          color: #0d6efd;
        }

        .filter-btn.active {
          background: #0d6efd;
          border-color: #0d6efd;
          color: white;
        }

        .filter-btn.active .badge {
          background: rgba(255, 255, 255, 0.2) !important;
          color: white;
        }

        .badge.bg-primary-soft {
          background: rgba(13, 110, 253, 0.1);
          color: #0d6efd;
        }

        .p-24 {
          padding: 24px;
        }

        .mb-16 {
          margin-bottom: 16px;
        }

        .mb-24 {
          margin-bottom: 24px;
        }

        .supervision-card {
          border: 1px solid rgba(0, 0, 0, 0.08);
          transition: all 0.3s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
        }

        .supervision-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
          border-color: rgba(0, 0, 0, 0.12);
        }

        .card-header-content {
          position: relative;
        }

        .profile-image-wrapper {
          position: relative;
          width: 56px;
          height: 56px;
        }

        .profile-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 16px;
          border: 2px solid #fff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .profile-initials {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: linear-gradient(45deg, #0d6efd, #0091ff);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(13, 110, 253, 0.2);
        }

        .student-info {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .student-name {
          font-size: 1.1rem;
          font-weight: 600;
          color: #2c3345;
          margin: 0;
          line-height: 1.3;
        }

        .student-email {
          font-size: 0.9rem;
          color: #6c757d;
          margin: 0;
          line-height: 1.4;
        }

        .action-buttons {
          position: absolute;
          top: 0;
          right: 0;
        }

        .action-btn {
          width: 36px;
          height: 36px;
          border-radius: 12px;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          transition: all 0.2s ease;
          background: white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          color: #0d6efd;
          border: 1px solid rgba(13, 110, 253, 0.2);
        }

        .action-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .chat-btn {
          background: rgba(13, 110, 253, 0.1);
        }

        .chat-btn:hover {
          background: #0d6efd;
          color: white;
        }

        .stop-btn {
          background: rgba(253, 126, 20, 0.1);
          color: #fd7e14;
          border-color: rgba(253, 126, 20, 0.2);
        }

        .stop-btn:hover {
          background: #fd7e14;
          color: white;
        }

        .status-section {
          padding: 8px 0;
          border-top: 1px solid rgba(0, 0, 0, 0.06);
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        }

        .status-badge {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
        }

        .status-pending {
          background: rgba(13, 110, 253, 0.1);
          color: #0d6efd;
        }

        .status-accepted {
          background: rgba(25, 135, 84, 0.1);
          color: #198754;
        }

        .status-rejected {
          background: rgba(220, 53, 69, 0.1);
          color: #dc3545;
        }

        .date-info {
          font-size: 0.85rem;
          color: #6c757d;
        }

        .main-actions {
          margin-top: 1.5rem;
        }

        .action-group {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .btn-action {
          padding: 10px 20px;
          border-radius: 12px;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 0.95rem;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .btn-action.accept {
          background: #198754;
          color: white;
        }

        .btn-action.accept:hover {
          background: #146c43;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(25, 135, 84, 0.2);
        }

        .btn-action.decline {
          background: #dc3545;
          color: white;
        }

        .btn-action.decline:hover {
          background: #bb2d3b;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(220, 53, 69, 0.2);
        }

        .p-24 {
          padding: 24px;
        }
      `}</style>
    </>
  );
};

export default ManagementPage; 