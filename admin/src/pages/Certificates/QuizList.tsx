import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../routes/config';
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
    email: string;
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
  const [filteredResults, setFilteredResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInstructor, setSelectedInstructor] = useState('');

  // Fonction pour vérifier l'authentification
  const checkAuth = () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      toast.error('Veuillez vous connecter pour accéder à cette page');
      navigate(ROUTES.AUTH.SIGNIN);
      return false;
    }

    // Vérifier le format du token
    let formattedToken = token;
    if (!token.startsWith('Bearer ')) {
      formattedToken = `Bearer ${token}`;
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
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        toast.error('Session expirée, veuillez vous reconnecter');
        navigate(ROUTES.AUTH.SIGNIN);
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
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            toast.error('Session expirée, veuillez vous reconnecter');
            navigate(ROUTES.AUTH.SIGNIN);
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
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            toast.error('Session expirée, veuillez vous reconnecter');
            navigate(ROUTES.AUTH.SIGNIN);
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
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        toast.error('Session expirée, veuillez vous reconnecter');
        navigate(ROUTES.AUTH.SIGNIN);
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

  // Fonction pour obtenir la mention en fonction du score
  const getMention = (score: number): string => {
    if (score >= 16) return 'Très bien';
    if (score >= 14) return 'Bien';
    if (score >= 12) return 'Assez bien';
    if (score >= 10) return 'Passable';
    return 'Insuffisant';
  };

  // Fonction pour obtenir la couleur de la mention
  const getMentionClass = (score: number): string => {
    if (score >= 16) return 'text-success fw-bold';
    if (score >= 14) return 'text-info fw-bold';
    if (score >= 12) return 'text-primary fw-bold';
    if (score >= 10) return 'text-warning fw-bold';
    return 'text-danger fw-bold';
  };

  // Fonction pour obtenir la liste unique des instructeurs
  const getUniqueInstructors = () => {
    const instructorsMap = new Map();
    quizResults.forEach(result => {
      const id = `${result.instructorId?.firstName} ${result.instructorId?.lastName}`;
      if (!instructorsMap.has(id)) {
        instructorsMap.set(id, {
          id,
          name: id
        });
      }
    });
    return Array.from(instructorsMap.values());
  };

  // Effet pour filtrer les résultats
  useEffect(() => {
    let results = [...quizResults];
    
    if (selectedInstructor) {
      results = results.filter(result => 
        (result.instructorId?.firstName + ' ' + result.instructorId?.lastName) === selectedInstructor
      );
    }
    
    if (searchTerm) {
      results = results.filter(result =>
        result.quizTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.formationId?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (result.studentId?.firstName + ' ' + result.studentId?.lastName).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredResults(results);
  }, [searchTerm, selectedInstructor, quizResults]);

  // Fonction pour formater la date de manière sécurisée
  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'Date non disponible';
    try {
      const date = new Date(dateString);
      // Vérifier si la date est valide
      if (isNaN(date.getTime())) {
        return 'Date invalide';
      }
      return format(date, 'dd MMMM yyyy à HH:mm', { locale: fr });
    } catch (error) {
      console.error('Erreur lors du formatage de la date:', error);
      return 'Date invalide';
    }
  };

  // Rendu du composant
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid px-4 py-5">
        <div className="alert alert-danger d-flex align-items-center" role="alert">
          <i className="bi bi-exclamation-circle me-2"></i>
          <div>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-4 py-5">
      {/* Header avec dégradé */}
      <div className="page-header">
        <div className="d-flex align-items-center">
          <div className="icon-wrapper">
            <i className="bi bi-journal-text"></i>
          </div>
          <div>
            <h4 className="mb-0">Liste des Résultats des Quiz</h4>
            <p className="mb-0">Consultez les résultats de tous les quiz passés</p>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="filters-container">
        <div className="filters-row">
          <div className="search-container">
            <div className="input-group">
              <span className="input-group-text">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Rechercher un quiz, une formation ou un étudiant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="instructor-container">
            <select
              className="form-select"
              value={selectedInstructor}
              onChange={(e) => setSelectedInstructor(e.target.value)}
            >
              <option value="">Tous les instructeurs</option>
              {getUniqueInstructors().map(instructor => (
                <option key={instructor.id} value={instructor.id}>
                  {instructor.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tableau des résultats */}
      <div className="card shadow-sm quiz-card">
        <div className="card-body">
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
                  <th>Mention</th>
                  <th>État</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.map((result) => (
                  <tr key={result._id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="icon-wrapper">
                          <i className="bi bi-file-text"></i>
                        </div>
                        <span>{result.quizTitle}</span>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="icon-wrapper">
                          <i className="bi bi-mortarboard"></i>
                        </div>
                        <span>{result.formationId?.title || 'Formation inconnue'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="icon-wrapper">
                          <i className="bi bi-person"></i>
                        </div>
                        <span>{`${result.studentId?.firstName || ''} ${result.studentId?.lastName || ''}`}</span>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="icon-wrapper">
                          <i className="bi bi-person-workspace"></i>
                        </div>
                        <span>{`${result.instructorId?.firstName || ''} ${result.instructorId?.lastName || ''}`}</span>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="icon-wrapper">
                          <i className="bi bi-calendar"></i>
                        </div>
                        <span>
                          {formatDate(result.completedAt)}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="icon-wrapper">
                          <i className="bi bi-trophy"></i>
                        </div>
                        <div>
                          <span className="badge bg-primary quiz-badge">
                            {formatScore(result.score)}/20
                          </span>
                          <br />
                          <small className="text-muted">
                            {result.correctAnswers}/{result.totalQuestions} questions
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`mention ${getMentionClass(result.score)}`}>
                        <i className={`bi ${result.score >= 10 ? 'bi-award' : 'bi-exclamation-circle'}`}></i>
                        {getMention(result.score)}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        {result.score >= 10 && (
                          <button 
                            className="action-btn success"
                            onClick={() => navigate('/certificates', { 
                              state: {
                                quizResult: {
                                  formation: result.formationId?.title,
                                  student: `${result.studentId?.firstName} ${result.studentId?.lastName}`,
                                  studentEmail: result.studentId?.email,
                                  date: result.completedAt,
                                  mention: getMention(result.score),
                                  score: result.score,
                                  quizTitle: result.quizTitle
                                }
                              }
                            })}
                          >
                            <i className="bi bi-award"></i>
                            Admis
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredResults.length === 0 && (
            <div className="no-results">
              <i className="bi bi-journal-text"></i>
              <p className="text-muted mb-0">Aucun résultat trouvé</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizList; 