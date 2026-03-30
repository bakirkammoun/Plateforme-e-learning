'use client';

import { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';

const SupervisedStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSupervisedStudents();
  }, []);

  const fetchSupervisedStudents = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get('http://localhost:5000/api/instructors/supervised-students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors de la récupération des étudiants supervisés:', error);
      toast.error('Erreur lors de la récupération des étudiants');
      setLoading(false);
    }
  };

  const handleStopSupervision = async (cvId, studentName) => {
    if (window.confirm(`Êtes-vous sûr de vouloir arrêter l'encadrement de ${studentName} ?`)) {
      try {
        const token = localStorage.getItem('authToken');
        await axios.post(`http://localhost:5000/api/cv/${cvId}/stop-supervision`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        toast.success(`L'encadrement de ${studentName} a été arrêté`);
        fetchSupervisedStudents(); // Rafraîchir la liste
      } catch (error) {
        console.error('Erreur lors de l\'arrêt de l\'encadrement:', error);
        toast.error('Erreur lors de l\'arrêt de l\'encadrement');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex-center py-60">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-60">
      <ToastContainer position="top-right" autoClose={3000} />
      <h2 className="mb-40">Étudiants supervisés</h2>
      
      {students.length === 0 ? (
        <div className="text-center py-40">
          <p className="text-muted">Aucun étudiant supervisé pour le moment</p>
        </div>
      ) : (
        <div className="row g-4">
          {students.map((student) => (
            <div key={student._id} className="col-md-6 col-lg-4">
              <div className="card h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center mb-3">
                    <img
                      src={student.profileImage || '/assets/images/default-avatar.png'}
                      alt={`${student.firstName} ${student.lastName}`}
                      className="rounded-circle me-3"
                      style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                    />
                    <div>
                      <h5 className="card-title mb-0">{student.firstName} {student.lastName}</h5>
                      <p className="text-muted small mb-0">{student.email}</p>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <p className="mb-2"><strong>CV:</strong> {student.cvTitle || 'Sans titre'}</p>
                    <p className="mb-2"><strong>Date de début:</strong> {new Date(student.supervisionStartDate).toLocaleDateString('fr-FR')}</p>
                    <p className="mb-3"><strong>Statut:</strong> <span className="badge bg-success">En cours</span></p>
                    
                    <div className="d-flex justify-content-between align-items-center">
                      <button
                        className="btn btn-outline-danger"
                        onClick={() => handleStopSupervision(student.cvId, `${student.firstName} ${student.lastName}`)}
                      >
                        Arrêter l'encadrement
                      </button>
                      <a
                        href={`/student-profile?id=${student._id}`}
                        className="btn btn-link text-primary"
                      >
                        Voir profil
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SupervisedStudents; 