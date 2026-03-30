import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import './QuizList.css';

interface QuizResult {
  _id: string;
  quizTitle: string;
  formationId: {
    title: string;
  };
  studentId: {
    firstName: string;
    lastName: string;
  };
  instructorId: {
    firstName: string;
    lastName: string;
  };
  completedAt: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  status: 'Réussi' | 'Échoué';
}

const QuizList: React.FC = () => {
  const navigate = useNavigate();
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fonction pour vérifier l'authentification
  const checkAuth = () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.error('Token d\'authentification non trouvé');
      toast.error('Veuillez vous connecter pour accéder à cette page');
      navigate('/login');
      return false;
    }

    // Vérifier le format du token
    let formattedToken = token;
    if (!token.startsWith('Bearer ')) {
      console.log('Format de token invalide. Ajout du préfixe Bearer');
      formattedToken = `Bearer ${token}`;
    }

    // Vérifier si le token est un JWT valide
    try {
      const tokenParts = formattedToken.split(' ');
      if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
        throw new Error('Format de token invalide');
      }
      const jwt = tokenParts[1];
      const base64Url = jwt.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => 
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join(''));
      const payload = JSON.parse(jsonPayload);
      
      // Vérifier si le token est expiré
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        console.error('Token expiré');
        localStorage.removeItem('authToken');
        toast.error('Session expirée, veuillez vous reconnecter');
        navigate('/login');
        return false;
      }

      console.log('Token valide:', {
        userId: payload.userId,
        exp: new Date(payload.exp * 1000).toLocaleString(),
        tokenPreview: formattedToken.substring(0, 30) + '...'
      });
    } catch (error) {
      console.error('Erreur de validation du token:', error);
      localStorage.removeItem('authToken');
      toast.error('Token invalide, veuillez vous reconnecter');
      navigate('/login');
      return false;
    }

    return formattedToken;
  };

  // Fonction pour récupérer les résultats des quiz
  const fetchQuizResults = async () => {
    let headers;
    try {
      setLoading(true);
      setError(null);
      
      // Vérifier l'authentification
      const token = checkAuth();
      if (!token) return;

      // Configuration des headers
      headers = {
        'Authorization': token,
        'Content-Type': 'application/json'
      };

      console.log('Headers configurés:', {
        ...headers,
        Authorization: headers.Authorization.substring(0, 30) + '...'
      });

      // Récupérer toutes les formations d'abord
      const formationsResponse = await axios.get(
        'http://localhost:5000/api/formations',
        { 
          headers,
          validateStatus: (status) => status < 500 // Ne pas rejeter pour les erreurs 4xx
        }
      );

      if (formationsResponse.status === 401) {
        console.error('Erreur d\'authentification lors de la récupération des formations');
        console.error('Headers envoyés:', {
          ...headers,
          Authorization: headers.Authorization.substring(0, 30) + '...'
        });
        toast.error('Session expirée, veuillez vous reconnecter');
        navigate('/login');
        return;
      }

      console.log('Formations récupérées:', formationsResponse.data.length);

      // Récupérer les résultats de quiz pour chaque formation
      const allResults: QuizResult[] = [];
      for (const formation of formationsResponse.data) {
        try {
          console.log(`Récupération des résultats pour la formation ${formation._id}`);
          const resultsResponse = await axios.get(
            `http://localhost:5000/api/formations/${formation._id}/quiz-results`,
            { 
              headers,
              validateStatus: (status) => status < 500 // Ne pas rejeter pour les erreurs 4xx
            }
          );

          if (resultsResponse.status === 401) {
            console.error('Erreur d\'authentification pour la formation:', formation._id);
            console.error('Headers envoyés:', {
              ...headers,
              Authorization: headers.Authorization.substring(0, 30) + '...'
            });
            console.error('Réponse du serveur:', resultsResponse.data);
            toast.error('Session expirée, veuillez vous reconnecter');
            navigate('/login');
            return;
          }

          if (resultsResponse.status === 200) {
            allResults.push(...resultsResponse.data);
            console.log(`Résultats récupérés pour la formation ${formation._id}:`, resultsResponse.data.length);
          } else {
            console.warn(`Statut inattendu pour la formation ${formation._id}:`, resultsResponse.status);
            console.warn('Réponse:', resultsResponse.data);
          }
        } catch (error: any) {
          console.error(`Erreur détaillée pour la formation ${formation._id}:`, {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
            headers: {
              ...headers,
              Authorization: headers.Authorization.substring(0, 30) + '...'
            }
          });
          
          if (error.response?.status === 401) {
            toast.error('Session expirée, veuillez vous reconnecter');
            navigate('/login');
            return;
          }
        }
      }

      // Mettre à jour l'état avec tous les résultats
      setQuizResults(allResults);
      console.log('Total des résultats récupérés:', allResults.length);
    } catch (error: any) {
      console.error('Erreur lors de la récupération des données:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        headers: headers ? {
          ...headers,
          Authorization: headers.Authorization.substring(0, 30) + '...'
        } : undefined
      });
      
      if (error.response?.status === 401) {
        toast.error('Session expirée, veuillez vous reconnecter');
        navigate('/login');
        return;
      }
      
      setError('Erreur lors de la récupération des données');
      toast.error('Erreur lors de la récupération des données');
    } finally {
      setLoading(false);
    }
  };

  // Effet pour charger les données au montage du composant
  useEffect(() => {
    fetchQuizResults();
  }, []);

  // Fonction pour formater le score
  const formatScore = (score: number) => {
    return score.toFixed(1);
  };

  // Fonction pour obtenir la classe de style du badge de statut
  const getStatusBadgeClass = (status: string) => {
    return status === 'Réussi' ? 'bg-success' : 'bg-danger';
  };

  // Rendu du composant
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid px-4 py-5">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-4 py-5">
      <div className="row">
        <div className="col-12">
          <div className="card shadow-sm quiz-card">
            <div className="card-header bg-white py-3">
              <h5 className="mb-0">Liste des Résultats des Quiz</h5>
            </div>
            <div className="card-body">
              {/* Tableau des résultats */}
              <div className="table-responsive">
                <table className="table table-hover quiz-table">
                  <thead>
                    <tr>
                      <th>Quiz</th>
                      <th>Formation</th>
                      <th>Étudiant</th>
                      <th>Instructeur</th>
                      <th>Date</th>
                      <th>Score</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quizResults.map((result) => (
                      <tr key={result._id}>
                        <td>{result.quizTitle}</td>
                        <td>{result.formationId?.title || 'Formation inconnue'}</td>
                        <td>{`${result.studentId?.firstName || ''} ${result.studentId?.lastName || ''}`}</td>
                        <td>{`${result.instructorId?.firstName || ''} ${result.instructorId?.lastName || ''}`}</td>
                        <td>
                          {format(new Date(result.completedAt), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                        </td>
                        <td>
                          <span className="badge bg-primary quiz-badge">
                            {formatScore(result.score)}/20
                          </span>
                          <br />
                          <small className="text-muted">
                            {result.correctAnswers}/{result.totalQuestions} questions
                          </small>
                        </td>
                        <td>
                          <span className={`badge quiz-badge ${getStatusBadgeClass(result.status)}`}>
                            {result.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {quizResults.length === 0 && (
                <div className="text-center py-5">
                  <i className="ph ph-exam text-muted mb-3" style={{ fontSize: '48px' }}></i>
                  <p className="text-muted">Aucun résultat de quiz disponible</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizList; 