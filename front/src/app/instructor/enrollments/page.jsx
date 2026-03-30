'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import HeaderInstructor from '@/components/HeaderInstructor';
import Breadcrumb from "@/components/Breadcrumb";
import { toast } from 'react-hot-toast';

const EnrollmentsPage = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const handleCloseModal = () => {
    setShowModal(false);
    setNotes('');
    setSelectedEnrollment(null);
  };

  const fetchEnrollments = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get('http://localhost:5000/api/enrollments/instructor/enrollments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setEnrollments(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors de la récupération des inscriptions:', error);
      toast.error('Erreur lors du chargement des inscriptions');
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (enrollmentId, status) => {
    try {
      const token = localStorage.getItem('authToken');
      await axios.patch(
        `http://localhost:5000/api/enrollments/${enrollmentId}/status`,
        { status, notes },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      toast.success(`Inscription ${status === 'approved' ? 'approuvée' : 'rejetée'} avec succès`);
      setShowModal(false);
      setNotes('');
      setSelectedEnrollment(null);
      fetchEnrollments();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const filteredEnrollments = enrollments.filter(enrollment => {
    if (filter === 'all') return true;
    return enrollment.status === filter;
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending': return 'bg-warning';
      case 'approved': return 'bg-success';
      case 'rejected': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  if (loading) {
    return (
      <>
        <HeaderInstructor />
        <div className="container mt-5 pt-5">
          <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Chargement...</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <HeaderInstructor />
      <Breadcrumb title="Gestion des Inscriptions" />
      
      <section className="course-list py-80">
        <div className="container">
        {/* Stats Cards */}
        <div className="row g-4 mb-5">
          <div className="col-md-3">
              <div className="stat-card">
                <div className="stat-icon bg-primary-soft">
                  <i className="ph-bold ph-users"></i>
                  </div>
                <div className="stat-content">
                  <h5>Total Inscriptions</h5>
                  <h3>{enrollments.length}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="stat-card">
                <div className="stat-icon bg-warning-soft">
                  <i className="ph-bold ph-clock"></i>
                </div>
                <div className="stat-content">
                  <h5>En Attente</h5>
                  <h3>{enrollments.filter(e => e.status === 'pending').length}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-3">
              <div className="stat-card">
                <div className="stat-icon bg-success-soft">
                  <i className="ph-bold ph-check-circle"></i>
                  </div>
                <div className="stat-content">
                  <h5>Approuvées</h5>
                  <h3>{enrollments.filter(e => e.status === 'approved').length}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-3">
              <div className="stat-card">
                <div className="stat-icon bg-danger-soft">
                  <i className="ph-bold ph-x-circle"></i>
                  </div>
                <div className="stat-content">
                  <h5>Rejetées</h5>
                  <h3>{enrollments.filter(e => e.status === 'rejected').length}</h3>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4">
            {/* Sidebar Filters */}
            <div className="col-lg-3">
              <div className="filter-sidebar">
                <div className="search-box mb-4">
                  <div className="form-group">
                    <div className="input-group">
                      <span className="input-group-text bg-transparent border-end-0">
                        <i className="ph-bold ph-magnifying-glass"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control border-start-0 ps-0"
                        placeholder="Rechercher..."
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
                  <h5 className="filter-title">Progression</h5>
                  <div className="filter-options">
                    <label className="custom-radio">
                      <input type="radio" name="progress" />
                      <span className="radio-label">Tous</span>
                    </label>
                    <label className="custom-radio">
                      <input type="radio" name="progress" />
                      <span className="radio-label">Non commencé</span>
                    </label>
                    <label className="custom-radio">
                      <input type="radio" name="progress" />
                      <span className="radio-label">En cours</span>
                    </label>
                    <label className="custom-radio">
                      <input type="radio" name="progress" />
                      <span className="radio-label">Terminé</span>
                    </label>
              </div>
            </div>
          </div>
        </div>

            {/* Main Content */}
            <div className="col-lg-9">
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
                  <div className="table-container">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="border-0">Étudiant</th>
                      <th className="border-0">Formation</th>
                      <th className="border-0">Date d'inscription</th>
                      <th className="border-0">Statut</th>
                      <th className="border-0">Progression</th>
                      <th className="border-0">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEnrollments.map((enrollment) => (
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
                        <td style={{ width: '200px' }}>
                          <div className="progress" style={{ height: '8px', borderRadius: '4px' }}>
                            <div
                              className="progress-bar"
                              role="progressbar"
                              style={{ 
                                width: `${enrollment.progress || 0}%`,
                                backgroundColor: enrollment.progress >= 100 ? '#198754' : '#0d6efd'
                              }}
                              aria-valuenow={enrollment.progress || 0}
                              aria-valuemin="0"
                              aria-valuemax="100"
                            />
                          </div>
                          <small className="text-muted mt-1 d-block">{enrollment.progress || 0}% complété</small>
                        </td>
                        <td>
                          {enrollment.status === 'pending' && (
                                      <div className="course-actions">
                              <button
                                onClick={() => handleStatusUpdate(enrollment._id, 'approved')}
                                          className="action-btn approve-btn"
                                          title="Approuver"
                              >
                                          <i className="ph-bold ph-check"></i>
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedEnrollment(enrollment);
                                  setShowModal(true);
                                }}
                                          className="action-btn reject-btn"
                                          title="Rejeter"
                              >
                                          <i className="ph-bold ph-x"></i>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                        </div>
              </div>
            </div>
          </div>
        )}
      </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modal de rejet */}
      {showModal && selectedEnrollment && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content border-0 shadow">
              <div className="modal-header border-0">
                <h5 className="modal-title">
                  <i className="ph ph-warning-circle text-danger me-2"></i>
                  Rejeter l'inscription
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseModal}
                ></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-warning">
                  <p className="mb-0">
                    Êtes-vous sûr de vouloir rejeter l'inscription de{' '}
                    <strong>
                      {selectedEnrollment.studentId.firstName} {selectedEnrollment.studentId.lastName}
                    </strong>{' '}
                    à la formation <strong>{selectedEnrollment.formationId.title}</strong> ?
                  </p>
                </div>
                <div className="mb-3">
                  <label className="form-label">
                    <i className="ph ph-note-pencil me-2"></i>
                    Motif du rejet (optionnel)
                  </label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Expliquez pourquoi vous rejetez cette inscription..."
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer border-0">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={handleCloseModal}
                >
                  <i className="ph ph-x me-2"></i>
                  Annuler
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => handleStatusUpdate(selectedEnrollment._id, 'rejected')}
                >
                  <i className="ph ph-check me-2"></i>
                  Confirmer le rejet
                </button>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </div>
      )}

      <style jsx>{`
        .course-list {
          padding: 80px 0;
          background: var(--light-bg, #f8f9fa);
        }

        .stat-card {
          background: #ffffff;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 2px 15px rgba(0, 0, 0, 0.05);
          border: 1px solid rgba(0, 0, 0, 0.04);
          transition: all 0.3s ease;
          height: 100%;
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
        }

        .stat-icon {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }

        .bg-primary-soft {
          background: rgba(13, 110, 253, 0.1);
          color: var(--main-color, #0d6efd);
        }

        .bg-warning-soft {
          background: rgba(255, 193, 7, 0.1);
          color: var(--warning-color, #ffc107);
        }

        .bg-success-soft {
          background: rgba(40, 167, 69, 0.1);
          color: var(--success-color, #28a745);
        }

        .bg-danger-soft {
          background: rgba(220, 53, 69, 0.1);
          color: var(--danger-color, #dc3545);
        }

        .stat-content {
          flex: 1;
        }

        .stat-content h5 {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-color, #6b7280);
          margin-bottom: 8px;
        }

        .stat-content h3 {
          font-size: 24px;
          font-weight: 700;
          color: var(--heading-color, #2c3345);
          margin: 0;
        }

        .filter-sidebar {
          background: #ffffff;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 2px 15px rgba(0, 0, 0, 0.05);
        }

        .search-box .input-group {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }

        .search-box .input-group-text {
          border: none;
          color: #6b7280;
        }

        .search-box .form-control {
          border: none;
          padding: 12px;
          font-size: 14px;
        }

        .search-box .form-control:focus {
          box-shadow: none;
        }

        .filter-section {
          border-top: 1px solid #e5e7eb;
          padding: 20px 0;
        }

        .filter-section:first-child {
          border-top: none;
          padding-top: 0;
        }

        .filter-title {
          font-size: 16px;
          font-weight: 600;
          color: #2c3345;
          margin-bottom: 16px;
        }

        .filter-options {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .custom-radio {
          display: flex;
          align-items: center;
          cursor: pointer;
          margin: 0;
        }

        .custom-radio input {
          display: none;
        }

        .radio-label {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 14px;
          color: #6b7280;
          transition: all 0.2s ease;
          width: 100%;
        }

        .custom-radio input:checked + .radio-label {
          background: var(--main-color, #0d6efd);
          color: white;
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
          padding: 20px;
        }

        @media (max-width: 992px) {
          .filter-sidebar {
            margin-bottom: 24px;
          }
        }

        .course-actions {
          display: flex;
          gap: 8px;
          margin-top: auto;
        }

        .action-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          font-size: 16px;
          transition: all 0.2s ease;
          border: none;
          cursor: pointer;
        }

        .approve-btn {
          background: var(--success-color, #28a745);
          color: white;
        }

        .approve-btn:hover {
          background: #1e7e34;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(40, 167, 69, 0.2);
        }

        .reject-btn {
          background: var(--danger-color, #dc3545);
          color: white;
        }

        .reject-btn:hover {
          background: #c82333;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(220, 53, 69, 0.2);
        }

        @media (max-width: 768px) {
          .action-btn {
            width: 28px;
            height: 28px;
            font-size: 14px;
          }
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
        }

        .student-name {
          color: var(--heading-color, #2c3345);
          font-weight: 600;
          font-size: 14px;
          line-height: 1.4;
        }

        .student-email {
          color: var(--text-color, #6b7280);
          font-size: 13px;
          line-height: 1.4;
        }

        .formation-title {
          color: var(--heading-color, #2c3345);
          font-weight: 500;
          font-size: 14px;
          line-height: 1.4;
        }
      `}</style>
    </>
  );
};

export default EnrollmentsPage; 