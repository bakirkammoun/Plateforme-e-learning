import { useState } from 'react';
import axios from 'axios';

const InscriptionForm = ({ formationId, onSuccess, onError }) => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Vous devez être connecté pour soumettre une demande d\'inscription');
      }

      const response = await axios.post(
        `http://localhost:5000/api/inscription-requests/${formationId}`,
        { message },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status === 201) {
        setMessage('');
        onSuccess(response.data);
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la demande:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de l\'envoi de la demande';
      setError(errorMessage);
      onError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inscription-form">
      <h3 className="mb-24">Demande d'inscription</h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-24">
          <label className="form-label">Message à l'instructeur</label>
          <textarea
            className="form-control"
            rows="4"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Expliquez pourquoi vous souhaitez suivre cette formation..."
            required
          />
        </div>

        {error && (
          <div className="alert alert-danger mb-24">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary w-100"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Envoi en cours...
            </>
          ) : (
            'Envoyer la demande'
          )}
        </button>
      </form>

      <style jsx>{`
        .inscription-form {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .form-control {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 0.75rem 1rem;
          transition: all 0.3s ease;
        }

        .form-control:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .btn-primary {
          padding: 0.75rem 1.5rem;
          font-weight: 500;
          border-radius: 8px;
          transition: all 0.3s ease;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
        }

        .btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .alert {
          border-radius: 8px;
          padding: 1rem;
        }
      `}</style>
    </div>
  );
};

export default InscriptionForm; 