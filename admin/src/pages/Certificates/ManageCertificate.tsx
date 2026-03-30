import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ROUTES } from '../../routes/config';
import './ManageCertificate.css';

interface QuizResult {
  formation: string;
  student: string;
  studentEmail: string;
  date: string;
  mention: string;
  score: number;
  quizTitle: string;
}

const ManageCertificate: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const quizResult = location.state?.quizResult as QuizResult;

  if (!quizResult) {
    return (
      <div className="container-fluid px-4 py-5">
        <div className="alert alert-danger d-flex align-items-center" role="alert">
          <i className="bi bi-exclamation-circle me-2"></i>
          <div>Aucune donnée de quiz disponible</div>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="container-fluid">
      <div className="certificate-container">
        <div className="certificate">
          <div className="certificate-border"></div>
          <div className="certificate-content">
            <div>
              <h1 className="certificate-title">Certificate of Achievement</h1>
              <h2 className="certificate-subtitle">THE FOLLOWING AWARD IS GIVEN TO</h2>
            </div>

            <div className="certificate-name">
              {quizResult.student}
            </div>

            <p className="certificate-text">
              Pour avoir complété avec succès la formation "{quizResult.formation}" 
              avec une mention {quizResult.mention.toLowerCase()} et un score de {quizResult.score}/20.
            </p>

            <div className="certificate-footer">
              <div className="signature-line">
                <span className="signature-title">Head of Event</span>
              </div>
              
              <div className="signature-line">
                <span className="signature-title">Mentor</span>
              </div>
            </div>

            <div className="certificate-seal">
              <svg viewBox="0 0 100 100" width="100%" height="100%">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#333" strokeWidth="2"/>
                <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" fontSize="14">SEAL</text>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <button className="print-button" onClick={handlePrint}>
        <i className="bi bi-printer"></i>
        Imprimer le certificat
      </button>
    </div>
  );
};

export default ManageCertificate; 