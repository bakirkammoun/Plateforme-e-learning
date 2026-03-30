import { useState, useEffect } from 'react';
import axios from 'axios';

const InscriptionRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get('http://localhost:5000/api/inscription-requests/instructor', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setRequests(response.data);
      setLoading(false);
    } catch (error) {
      setError('Erreur lors de la récupération des demandes');
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      const token = localStorage.getItem('authToken');
      await axios.put(
        `http://localhost:5000/api/inscription-requests/${requestId}/approve`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      fetchRequests();
    } catch (error) {
      setError('Erreur lors de l\'approbation de la demande');
    }
  };

  const handleReject = async (requestId) => {
    try {
      const token = localStorage.getItem('authToken');
      await axios.put(
        `http://localhost:5000/api/inscription-requests/${requestId}/reject`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      fetchRequests();
    } catch (error) {
      setError('Erreur lors du rejet de la demande');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-80">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        {error}
      </div>
    );
  }

  return (
    <div className="inscription-requests">
      <h2 className="mb-32">Demandes d'inscription</h2>
      
      {requests.length === 0 ? (
        <div className="text-center py-80">
          <i className="ph ph-envelope text-primary mb-16" style={{ fontSize: '48px' }}></i>
          <p className="text-neutral-500">Aucune demande d'inscription en attente</p>
        </div>
      ) : (
        <div className="requests-list">
          {requests.map((request) => (
            <div key={request._id} className="request-card">
              <div className="request-header">
                <div className="d-flex align-items-center">
                  <img
                    src={request.student.image || '/assets/images/avatar-placeholder.jpg'}
                    alt={request.student.name}
                    className="rounded-circle me-16"
                    style={{ width: '48px', height: '48px', objectFit: 'cover' }}
                  />
                  <div>
                    <h4 className="mb-4">{request.student.name}</h4>
                    <p className="text-neutral-500 mb-0">{request.formation.title}</p>
                  </div>
                </div>
                <span className={`status-badge status-${request.status}`}>
                  {request.status === 'pending' ? 'En attente' :
                   request.status === 'approved' ? 'Approuvée' : 'Rejetée'}
                </span>
              </div>

              <div className="request-content">
                <p className="mb-24">{request.message}</p>
                <div className="request-meta">
                  <span className="text-neutral-500">
                    <i className="ph ph-calendar me-8"></i>
                    {new Date(request.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {request.status === 'pending' && (
                <div className="request-actions">
                  <button
                    className="btn btn-success me-12"
                    onClick={() => handleApprove(request._id)}
                  >
                    <i className="ph ph-check me-8"></i>
                    Approuver
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleReject(request._id)}
                  >
                    <i className="ph ph-x me-8"></i>
                    Rejeter
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .inscription-requests {
          padding: 2rem;
        }

        .request-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          transition: all 0.3s ease;
        }

        .request-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .request-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .status-badge {
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .status-pending {
          background-color: #fef3c7;
          color: #92400e;
        }

        .status-approved {
          background-color: #dcfce7;
          color: #166534;
        }

        .status-rejected {
          background-color: #fee2e2;
          color: #991b1b;
        }

        .request-content {
          border-top: 1px solid #e5e7eb;
          padding-top: 1rem;
        }

        .request-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
        }

        .btn {
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .btn:hover {
          transform: translateY(-1px);
        }

        .btn-success {
          background-color: #22c55e;
          color: white;
          border: none;
        }

        .btn-success:hover {
          background-color: #16a34a;
        }

        .btn-danger {
          background-color: #ef4444;
          color: white;
          border: none;
        }

        .btn-danger:hover {
          background-color: #dc2626;
        }

        @media (max-width: 768px) {
          .request-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .request-actions {
            flex-direction: column;
          }

          .btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default InscriptionRequests; 