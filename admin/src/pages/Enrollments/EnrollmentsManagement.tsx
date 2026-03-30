import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImage?: string;
}

interface Formation {
  _id: string;
  title: string;
  description: string;
  category: string;
}

interface Enrollment {
  _id: string;
  studentId: Student;
  formationId: Formation;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  purchaseDate: string;
  progress?: number;
  notes?: string;
}

// Type pour les filtres de progression
type ProgressFilter = 'all' | 'not_started' | 'in_progress' | 'completed';

const EnrollmentsManagement = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [progressFilter, setProgressFilter] = useState<ProgressFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(7);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      // Assurez-vous d'utiliser le nom de token correct pour l'admin
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      
      if (!token) {
        toast.error('Session expirée ou non connecté. Veuillez vous reconnecter.');
        setLoading(false);
        return;
      }
      
      console.log('Récupération des inscriptions...');
      
      // Utilisation de la route correcte pour récupérer les inscriptions
      const response = await axios.get('http://localhost:5000/api/enrollments/all', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Inscriptions récupérées:', response.data);
      setEnrollments(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors de la récupération des inscriptions:', error);
      
      let errorMessage = 'Erreur lors du chargement des inscriptions';
      
      if (axios.isAxiosError(error) && error.response) {
        console.log('Status code:', error.response.status);
        console.log('Response data:', error.response.data);
        
        if (error.response.status === 403) {
          errorMessage = 'Vous n\'avez pas les permissions nécessaires pour accéder aux inscriptions';
        } else if (error.response.status === 401) {
          errorMessage = 'Session expirée. Veuillez vous reconnecter.';
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (enrollmentId: string, status: 'approved' | 'rejected') => {
    try {
      // Assurez-vous d'utiliser le nom de token correct pour l'admin
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      
      if (!token) {
        toast.error('Session expirée ou non connecté. Veuillez vous reconnecter.');
        return;
      }
      
      console.log('Token utilisé:', token.substring(0, 20) + '...');
      console.log('Envoi de la requête à:', `http://localhost:5000/api/enrollments/${enrollmentId}/status`);
      console.log('Données envoyées:', { status, notes });
      
      const response = await axios.patch(
        `http://localhost:5000/api/enrollments/${enrollmentId}/status`,
        { status, notes },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Réponse du serveur:', response.data);
      
      toast.success(`Inscription ${status === 'approved' ? 'approuvée' : 'rejetée'} avec succès`);
      setShowRejectModal(false);
      setNotes('');
      setSelectedEnrollment(null);
      fetchEnrollments();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      
      let errorMessage = 'Erreur lors de la mise à jour du statut';
      
      if (axios.isAxiosError(error) && error.response) {
        console.log('Détails de l\'erreur:', error.response.data);
        console.log('Status code:', error.response.status);
        
        if (error.response.status === 403) {
          errorMessage = 'Vous n\'avez pas les permissions nécessaires pour effectuer cette action';
        } else if (error.response.status === 401) {
          errorMessage = 'Session expirée. Veuillez vous reconnecter.';
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      toast.error(errorMessage);
    }
  };

  const handleCloseModal = () => {
    setShowRejectModal(false);
    setNotes('');
    setSelectedEnrollment(null);
  };

  const filteredEnrollments = enrollments.filter(enrollment => {
    // Filtre par statut
    if (filter !== 'all' && enrollment.status !== filter) {
      return false;
    }
    
    // Filtre par progression
    if (progressFilter !== 'all') {
      const progress = enrollment.progress || 0;
      if (progressFilter === 'not_started' && progress > 0) {
        return false;
      }
      if (progressFilter === 'in_progress' && (progress === 0 || progress === 100)) {
        return false;
      }
      if (progressFilter === 'completed' && progress < 100) {
        return false;
      }
    }
    
    // Filtre par date
    if (startDate && endDate) {
      const purchaseDate = new Date(enrollment.purchaseDate);
      const start = new Date(startDate);
      const end = new Date(endDate);
      // Ajouter un jour à la date de fin pour inclure le jour entier
      end.setDate(end.getDate() + 1);
      
      if (purchaseDate < start || purchaseDate > end) {
        return false;
      }
    }
    
    // Filtre par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const studentName = `${enrollment.studentId.firstName} ${enrollment.studentId.lastName}`.toLowerCase();
      const studentEmail = enrollment.studentId.email.toLowerCase();
      const formationTitle = enrollment.formationId.title.toLowerCase();
      
      return (
        studentName.includes(query) || 
        studentEmail.includes(query) || 
        formationTitle.includes(query)
      );
    }
    
    return true;
  });

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredEnrollments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredEnrollments.length / itemsPerPage);

  // Change page
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning';
      case 'approved': return 'bg-success';
      case 'rejected': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  const pendingCount = enrollments.filter(e => e.status === 'pending').length;
  const approvedCount = enrollments.filter(e => e.status === 'approved').length;
  const rejectedCount = enrollments.filter(e => e.status === 'rejected').length;

  if (loading) {
    return (
      <div className="container mt-5 pt-5">
        <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container-fluid p-4">
        <div className="d-flex flex-column h-100">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="m-0 page-title">Gestion des Inscriptions</h1>
              <p className="text-muted mb-0">Gérez les inscriptions des étudiants</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="stats-strip mb-4">
            <div className="stat-item">
              <div className="stat-icon bg-primary-soft">
                <i className="ph-bold ph-users"></i>
              </div>
              <div className="stat-content">
                <div className="stat-value">{enrollments.length}</div>
                <div className="stat-label">Total Inscriptions</div>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon bg-warning-soft">
                <i className="ph-bold ph-clock"></i>
              </div>
              <div className="stat-content">
                <div className="stat-value">{pendingCount}</div>
                <div className="stat-label">En attente</div>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon bg-success-soft">
                <i className="ph-bold ph-check-circle"></i>
              </div>
              <div className="stat-content">
                <div className="stat-value">{approvedCount}</div>
                <div className="stat-label">Approuvées</div>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon bg-danger-soft">
                <i className="ph-bold ph-x-circle"></i>
              </div>
              <div className="stat-content">
                <div className="stat-value">{rejectedCount}</div>
                <div className="stat-label">Rejetées</div>
              </div>
            </div>
          </div>

          {/* Main content area with table and filters side by side */}
          <div className="d-flex align-items-start">
            {/* Table section */}
            <div className="table-column">
              <div className="content-wrapper">
                <div className="content-header">
                  <div className="results-info">
                    <i className="ph-bold ph-users text-primary"></i>
                    <span>{filteredEnrollments.length} inscription(s)</span>
                  </div>
                </div>

                {filteredEnrollments.length === 0 ? (
                  <div className="empty-state">
                    <i className="ph-bold ph-users-three"></i>
                    <h3>Aucune inscription {filter !== 'all' ? `${filter}e` : ''}</h3>
                    <p>
                      {filter === 'pending' 
                        ? 'Vous n\'avez aucune demande d\'inscription en attente.'
                        : 'Aucune inscription ne correspond aux critères sélectionnés.'}
                    </p>
                  </div>
                ) : (
                  <div className="table-container p-0">
                    <div className="table-responsive">
                      <table className="table table-hover mb-0">
                        <thead className="bg-light">
                          <tr>
                            <th className="border-0" style={{ width: '35%' }}>Étudiant</th>
                            <th className="border-0" style={{ width: '20%' }}>Formation</th>
                            <th className="border-0" style={{ width: '15%' }}>Date d'inscription</th>
                            <th className="border-0" style={{ width: '15%' }}>Statut</th>
                            <th className="border-0" style={{ width: '15%' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentItems.map((enrollment) => (
                            <tr key={enrollment._id}>
                              <td>
                                <div className="d-flex align-items-center">
                                  <div className="avatar-circle">
                                    {enrollment.studentId.firstName[0]}{enrollment.studentId.lastName[0]}
                                  </div>
                                  <div className="student-info">
                                    <div className="student-name">{enrollment.studentId.firstName} {enrollment.studentId.lastName}</div>
                                    <div className="student-email">{enrollment.studentId.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="formation-title">
                                  {enrollment.formationId.title}
                                </div>
                              </td>
                              <td>{new Date(enrollment.purchaseDate).toLocaleDateString()}</td>
                              <td>
                                <span className={`badge ${getStatusBadgeClass(enrollment.status)} rounded-pill`}>
                                  {enrollment.status === 'pending' && <i className="ph ph-clock me-1"></i>}
                                  {enrollment.status === 'approved' && <i className="ph ph-check-circle me-1"></i>}
                                  {enrollment.status === 'rejected' && <i className="ph ph-x-circle me-1"></i>}
                                  {enrollment.status.toUpperCase()}
                                </span>
                              </td>
                              <td>
                                {enrollment.status === 'pending' && (
                                  <div className="course-actions">
                                    <button
                                      onClick={() => handleStatusUpdate(enrollment._id, 'approved')}
                                      className="action-btn approve-btn"
                                      title="Approuver"
                                    >
                                      <i className="ph-bold ph-check-circle"></i>
                                      <span className="action-text">Approuver</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setSelectedEnrollment(enrollment);
                                        setShowRejectModal(true);
                                      }}
                                      className="action-btn reject-btn"
                                      title="Rejeter"
                                    >
                                      <i className="ph-bold ph-x-circle"></i>
                                      <span className="action-text">Rejeter</span>
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="pagination-container mt-4 mb-3">
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
                )}
              </div>
            </div>

            {/* Filters section - Fixed to the right */}
            <div className="filter-column">
              <div className="filter-sidebar">
                <div className="filter-header">
                  <h5 className="filter-title mb-0">Filtres</h5>
                  <button 
                    className="reset-filters-btn"
                    onClick={() => {
                      setSearchQuery('');
                      setFilter('all');
                      setProgressFilter('all');
                      setStartDate('');
                      setEndDate('');
                      setCurrentPage(1);
                    }}
                  >
                    <i className="ph-bold ph-eraser"></i>
                    Nettoyer tout
                  </button>
                </div>

                <div className="search-box mt-3 mb-3">
                  <div className="form-group">
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="ph-bold ph-magnifying-glass"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Rechercher..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="filter-section">
                  <h5 className="filter-title">Statut</h5>
                  <div className="filter-options">
                    <label className="custom-radio">
                      <input
                        type="radio"
                        name="status"
                        checked={filter === 'all'}
                        onChange={() => setFilter('all')}
                      />
                      <span className="radio-label">
                        <i className="ph-bold ph-list"></i>
                        Tous
                      </span>
                    </label>
                    <label className="custom-radio">
                      <input
                        type="radio"
                        name="status"
                        checked={filter === 'pending'}
                        onChange={() => setFilter('pending')}
                      />
                      <span className="radio-label">
                        <i className="ph-bold ph-clock text-warning"></i>
                        En attente
                      </span>
                    </label>
                    <label className="custom-radio">
                      <input
                        type="radio"
                        name="status"
                        checked={filter === 'approved'}
                        onChange={() => setFilter('approved')}
                      />
                      <span className="radio-label">
                        <i className="ph-bold ph-check-circle text-success"></i>
                        Approuvés
                      </span>
                    </label>
                    <label className="custom-radio">
                      <input
                        type="radio"
                        name="status"
                        checked={filter === 'rejected'}
                        onChange={() => setFilter('rejected')}
                      />
                      <span className="radio-label">
                        <i className="ph-bold ph-x-circle text-danger"></i>
                        Rejetés
                      </span>
                    </label>
                  </div>
                </div>

                <div className="filter-section">
                  <h5 className="filter-title">Date d'inscription</h5>
                  <div className="date-range-filter">
                    <div className="date-field mb-2">
                      <label className="date-label mb-1">Du</label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <i className="ph-bold ph-calendar"></i>
                        </span>
                        <input
                          type="date"
                          className="form-control date-input"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="date-field mb-3">
                      <label className="date-label mb-1">Au</label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <i className="ph-bold ph-calendar"></i>
                        </span>
                        <input
                          type="date"
                          className="form-control date-input"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </div>
                    </div>
                    <button 
                      className="btn btn-primary btn-sm w-100 apply-filter-btn"
                      onClick={() => {
                        if (!startDate || !endDate) {
                          toast.error('Veuillez sélectionner un intervalle de dates complet');
                          return;
                        }
                        // Réinitialiser la page au premier filtrage
                        setCurrentPage(1);
                      }}
                    >
                      <i className="ph-bold ph-funnel"></i>
                      Appliquer le filtre
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de rejet */}
      {showRejectModal && selectedEnrollment && (
        <div className="simple-confirm-modal">
          <div className="confirm-message">
            Confirmer le rejet de l'inscription ?
            <div className="confirm-actions">
              <button className="btn-cancel" onClick={handleCloseModal}>Non</button>
              <button className="btn-confirm" onClick={() => handleStatusUpdate(selectedEnrollment._id, 'rejected')}>Oui</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .page-title {
          font-size: 28px;
          font-weight: 700;
          color: #2c3345;
          margin-bottom: 8px;
        }

        .page-logo,
        .logo-img {
          display: none;
        }

        .stats-strip {
          display: flex;
          gap: 20px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .stat-item {
          flex: 1;
          min-width: 240px;
          background: #ffffff;
          border-radius: 16px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 20px;
          box-shadow: 0 2px 15px rgba(0, 0, 0, 0.05);
          border: 1px solid rgba(0, 0, 0, 0.04);
          transition: all 0.3s ease;
        }

        .stat-item:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
        }

        .stat-icon {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }

        .stat-content {
          flex: 1;
        }

        .stat-value {
          font-size: 28px;
          font-weight: 700;
          color: #2c3345;
          line-height: 1.2;
        }

        .stat-label {
          font-size: 14px;
          color: #6b7280;
          margin-top: 4px;
        }

        .bg-primary-soft {
          background: rgba(13, 110, 253, 0.1);
          color: #0d6efd;
        }

        .bg-warning-soft {
          background: rgba(255, 193, 7, 0.1);
          color: #ffc107;
        }

        .bg-success-soft {
          background: rgba(40, 167, 69, 0.1);
          color: #28a745;
        }

        .bg-danger-soft {
          background: rgba(220, 53, 69, 0.1);
          color: #dc3545;
        }

        @media (max-width: 768px) {
          .stats-strip {
            gap: 16px;
          }

          .stat-item {
            min-width: 100%;
          }

          .stat-value {
            font-size: 24px;
          }
        }

        .course-list {
          padding: 80px 0;
          background: var(--light-bg, #f8f9fa);
        }

        .content-area {
          min-height: calc(100vh - 200px);
        }

        .filters-section {
          margin-top: 0;
        }

        .d-flex.align-items-start {
          display: flex !important;
          flex-direction: row !important;
        }

        .table-column {
          flex: 1;
          max-width: calc(100% - 270px);
        }

        .filter-column {
          width: 250px;
          margin-left: 20px;
          flex-shrink: 0;
        }

        .filter-sidebar {
          background: #ffffff;
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 2px 15px rgba(0, 0, 0, 0.05);
          border-left: 3px solid #0d6efd;
          position: sticky;
          top: 20px;
          height: fit-content;
        }

        .search-box .input-group {
          border: 1px solid #e5e7eb;
          border-radius: 6px;
        }

        .search-box .input-group-text {
          padding: 6px;
          background: transparent;
          border: none;
        }

        .search-box .form-control {
          border: none;
          padding: 6px;
          font-size: 13px;
        }

        .filter-section {
          margin-bottom: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e5e7eb;
        }

        .filter-section:last-child {
          margin-bottom: 0;
          padding-bottom: 0;
          border-bottom: none;
        }

        .filter-title {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 12px;
        }

        .filter-options {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .radio-label {
          padding: 6px 10px;
          font-size: 13px;
        }

        .radio-label i {
          font-size: 14px;
        }

        @media (max-width: 992px) {
          .d-flex.align-items-start {
            flex-direction: column !important;
          }
          
          .table-column {
            max-width: 100%;
          }
          
          .filter-column {
            width: 100%;
            margin-left: 0;
            margin-top: 20px;
          }
        }

        .content-wrapper {
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 2px 15px rgba(0, 0, 0, 0.05);
          overflow: hidden;
        }

        .content-header {
          padding: 20px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .results-info {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #6b7280;
        }

        .empty-state {
          padding: 60px 20px;
          text-align: center;
        }

        .empty-state i {
          font-size: 48px;
          color: var(--main-color, #0d6efd);
          margin-bottom: 16px;
        }

        .empty-state h3 {
          font-size: 20px;
          font-weight: 600;
          color: #2c3345;
          margin-bottom: 8px;
        }

        .empty-state p {
          color: #6b7280;
          font-size: 14px;
        }

        .table-container {
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 2px 15px rgba(0, 0, 0, 0.05);
          overflow: hidden;
        }

        .table {
          margin-bottom: 0;
        }

        .table thead th {
          background: #f8f9fa;
          border-bottom: 2px solid #e5e7eb;
          color: #4b5563;
          font-weight: 600;
          padding: 16px;
          font-size: 14px;
        }

        .table tbody td {
          padding: 16px;
          vertical-align: middle;
          border-bottom: 1px solid #e5e7eb;
          white-space: normal;
          word-break: break-word;
        }

        .table tbody tr:hover {
          background-color: #f8f9fa;
        }

        .table .badge {
          padding: 6px 12px;
          font-weight: 500;
          font-size: 12px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .table .badge i {
          font-size: 14px;
        }

        .table .progress {
          height: 8px;
          background-color: #f3f4f6;
          border-radius: 4px;
          overflow: hidden;
        }

        .table .progress-bar {
          transition: width 0.3s ease;
        }

        .table .action-btn {
          height: 36px;
          border-radius: 6px;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 14px;
          transition: all 0.2s ease;
          cursor: pointer;
          padding: 0 12px;
          gap: 6px;
        }

        .table .action-text {
          font-weight: 500;
          font-size: 13px;
        }

        .table .approve-btn {
          background: #28a745;
          min-width: 110px;
        }

        .table .approve-btn:hover {
          background: #218838;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(40, 167, 69, 0.2);
        }

        .table .reject-btn {
          background: #dc3545;
          min-width: 100px;
        }

        .table .reject-btn:hover {
          background: #c82333;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(220, 53, 69, 0.2);
        }

        .avatar-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(45deg, var(--main-color, #0d6efd), #0099ff);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
          box-shadow: 0 2px 8px rgba(13, 110, 253, 0.2);
          margin-right: 12px;
        }

        .student-info {
          display: flex;
          flex-direction: column;
          max-width: 100%;
        }

        .student-name {
          color: var(--heading-color, #2c3345);
          font-weight: 600;
          font-size: 14px;
          line-height: 1.4;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .student-email {
          color: var(--text-color, #6b7280);
          font-size: 13px;
          line-height: 1.4;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .formation-title {
          color: var(--heading-color, #2c3345);
          font-weight: 500;
          font-size: 14px;
          line-height: 1.4;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Pagination Styles */
        .pagination-container {
          padding: 15px 0;
          border-top: 1px solid #e5e7eb;
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

        .date-range-filter {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .date-field {
          display: flex;
          flex-direction: column;
        }

        .date-label {
          font-size: 12px;
          color: #6b7280;
          font-weight: 500;
          display: block;
        }

        .date-input {
          font-size: 13px;
          padding: 6px 8px;
        }

        .date-input::-webkit-calendar-picker-indicator {
          cursor: pointer;
        }

        .apply-filter-btn {
          background-color: #0d6efd;
          border-color: #0d6efd;
          padding: 8px 12px;
          font-size: 13px;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border-radius: 6px;
          transition: all 0.2s ease;
        }

        .apply-filter-btn:hover {
          background-color: #0b5ed7;
          border-color: #0b5ed7;
          transform: translateY(-2px);
          box-shadow: 0 3px 10px rgba(13, 110, 253, 0.15);
        }

        .apply-filter-btn i {
          font-size: 14px;
        }

        .filter-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .reset-filters-btn {
          background: none;
          border: none;
          color: #dc3545;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 5px 8px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .reset-filters-btn:hover {
          background-color: rgba(220, 53, 69, 0.1);
          transform: translateY(-1px);
        }
        
        .reset-filters-btn i {
          font-size: 14px;
        }

        .course-actions {
          display: flex;
          gap: 8px;
        }

        /* Style pour la simple confirmation de rejet */
        .simple-confirm-modal {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 15px 20px;
          border-radius: 8px;
          z-index: 1050;
          text-align: center;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        }

        .confirm-message {
          font-size: 15px;
          margin-bottom: 12px;
        }

        .confirm-actions {
          display: flex;
          justify-content: center;
          gap: 15px;
          margin-top: 15px;
        }

        .btn-cancel, .btn-confirm {
          padding: 5px 15px;
          border-radius: 4px;
          border: none;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn-cancel {
          background: rgba(255, 255, 255, 0.2);
          color: white;
        }

        .btn-cancel:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .btn-confirm {
          background: #dc3545;
          color: white;
        }

        .btn-confirm:hover {
          background: #c82333;
        }
      `}</style>
    </>
  );
};

export default EnrollmentsManagement; 