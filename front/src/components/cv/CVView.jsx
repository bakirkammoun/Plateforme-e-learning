'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useRouter } from 'next/navigation';

const CVView = ({ cvId }) => {
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personal');
  const [isProcessing, setIsProcessing] = useState(false);
  const [supervisionStatus, setSupervisionStatus] = useState(null);
  const searchParams = useSearchParams();
  const studentId = searchParams.get('student');
  const router = useRouter();

  console.log('CVView mounted with:', { cvId, studentId });

  useEffect(() => {
    const fetchCV = async () => {
      try {
        const token = localStorage.getItem('authToken');
        console.log('Token présent:', !!token);

        if (!token) {
          console.error('Token manquant');
          toast.error('Veuillez vous connecter pour voir ce CV');
          router.push('/login');
          return;
        }

        console.log('Tentative de récupération du CV:', cvId);
        const response = await axios.get(`http://localhost:5000/api/cv/${cvId}`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Réponse du serveur:', response.data);

        if (response.data.success && response.data.cv) {
          setFormData(response.data.cv);
        } else {
          throw new Error(response.data.message || 'Erreur lors du chargement du CV');
        }
      } catch (error) {
        console.error('Erreur détaillée:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });

        if (error.response?.status === 401) {
          localStorage.removeItem('authToken');
          toast.error('Session expirée, veuillez vous reconnecter');
          router.push('/login');
        } else if (error.response?.status === 403) {
          toast.error('Vous n\'avez pas les droits pour accéder à ce CV');
        } else {
          toast.error(error.response?.data?.message || 'Erreur lors du chargement du CV');
        }
      } finally {
        setLoading(false);
      }
    };

    if (cvId) {
      fetchCV();
    } else {
      console.error('ID du CV manquant');
      toast.error('ID du CV manquant');
      setLoading(false);
    }
  }, [cvId, router]);

  useEffect(() => {
    const checkSupervisionStatus = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          console.error('Token manquant');
          return;
        }

        console.log('Vérification du statut de supervision pour le CV:', cvId);
        const response = await axios.get(`http://localhost:5000/api/cv/${cvId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.data.success && response.data.cv) {
          console.log('Statut de supervision:', response.data.cv.supervisionStatus);
          setSupervisionStatus(response.data.cv.supervisionStatus);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du statut:', error);
        toast.error('Erreur lors de la vérification du statut de la demande');
      }
    };

    if (cvId) {
      const interval = setInterval(checkSupervisionStatus, 5000); // Vérifier toutes les 5 secondes
      checkSupervisionStatus(); // Vérification initiale
      return () => clearInterval(interval);
    }
  }, [cvId]);

  const handleSupervisionResponse = async (isAccepted) => {
    try {
      setIsProcessing(true);
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        toast.error('Veuillez vous connecter pour effectuer cette action');
        return;
      }

      console.log('Envoi de la réponse d\'encadrement:', {
        cvId,
        status: isAccepted ? 'accepted' : 'rejected'
      });

      const response = await axios.post(
        `http://localhost:5000/api/cv/${cvId}/supervision-response`,
        {
          status: isAccepted ? 'accepted' : 'rejected'
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        const newStatus = isAccepted ? 'accepted' : 'rejected';
        setSupervisionStatus(newStatus);
        
        toast.success(
          isAccepted 
            ? 'Demande d\'encadrement acceptée. Redirection vers la page de gestion...' 
            : 'Demande d\'encadrement refusée. Redirection vers la page de gestion...',
          {
            duration: 2000
          }
        );
        
        // Attendre un peu avant de rediriger pour que l'utilisateur puisse voir le message
        setTimeout(() => {
          router.push('/management');
        }, 2000);
      } else {
        throw new Error(response.data.message || 'Une erreur est survenue');
      }
    } catch (error) {
      console.error('Erreur lors de la réponse à la demande d\'encadrement:', error);
      toast.error(
        error.response?.data?.message || 
        'Une erreur est survenue lors de la réponse à la demande d\'encadrement'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="alert alert-danger m-4" role="alert">
        CV non trouvé ou accès non autorisé
      </div>
    );
  }

  return (
    <section className='tutor-details py-120'>
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      
      <div className='container'>
        {/* Boutons de réponse pour l'encadrement */}
        {supervisionStatus === 'pending' && (
          <div className='border border-neutral-30 rounded-12 bg-white p-8 mb-32'>
            <div className='border border-neutral-30 rounded-12 bg-main-25 p-24'>
              <div className='d-flex justify-content-between align-items-center'>
                <h4 className='mb-0'>Demande d'encadrement</h4>
                <div className='d-flex gap-3'>
                  <button
                    onClick={() => handleSupervisionResponse(true)}
                    disabled={isProcessing}
                    className='btn btn-primary rounded-pill hover-bg-primary-700 flex-center gap-8'
                  >
                    <i className='ph-bold ph-check text-xl'></i>
                    Accepter l'encadrement
                  </button>
                  <button
                    onClick={() => handleSupervisionResponse(false)}
                    disabled={isProcessing}
                    className='btn btn-danger rounded-pill flex-center gap-8'
                  >
                    <i className='ph-bold ph-x text-xl'></i>
                    Refuser l'encadrement
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Message de statut si une décision a déjà été prise */}
        {supervisionStatus === 'accepted' && (
          <div className='border border-neutral-30 rounded-12 bg-white p-8 mb-32'>
            <div className='border border-success-100 rounded-12 bg-success-25 p-24'>
              <div className='d-flex align-items-center gap-3'>
                <i className='ph-bold ph-check-circle text-success-600 text-2xl'></i>
                <h4 className='mb-0 text-success-600'>Vous avez accepté d'encadrer cet étudiant</h4>
              </div>
            </div>
          </div>
        )}
        {supervisionStatus === 'rejected' && (
          <div className='border border-neutral-30 rounded-12 bg-white p-8 mb-32'>
            <div className='border border-danger-100 rounded-12 bg-danger-25 p-24'>
              <div className='d-flex align-items-center gap-3'>
                <i className='ph-bold ph-x-circle text-danger-600 text-2xl'></i>
                <h4 className='mb-0 text-danger-600'>Vous avez refusé d'encadrer cet étudiant</h4>
              </div>
            </div>
          </div>
        )}

        <div className='row gy-4'>
          <div className='col-lg-4'>
            <div className='border border-neutral-30 rounded-12 bg-white p-8'>
              <div className='border border-neutral-30 rounded-12 bg-main-25 p-32'>
                <div className='p-16 border border-neutral-50 rounded-circle aspect-ratio-1 max-w-150 max-h-150 mx-auto'>
                  <div className='position-relative'>
                    {formData.profileImage ? (
                      <img
                        src={`http://localhost:5000/uploads/cv-images/${formData.profileImage}`}
                        alt="Photo de profil"
                        className='rounded-circle bg-dark-yellow aspect-ratio-1 cover-img w-100 h-100 object-fit-cover'
                        onError={(e) => {
                          e.target.src = '/assets/images/thumbs/profile-placeholder.png';
                        }}
                      />
                    ) : (
                      <img
                        src="/assets/images/thumbs/profile-placeholder.png"
                        alt="Photo de profil par défaut"
                        className='rounded-circle bg-dark-yellow aspect-ratio-1 cover-img w-100 h-100 object-fit-cover'
                      />
                    )}
                  </div>
                </div>
                <div className='mt-40'>
                  <h4 className='text-center mb-16'>{formData.name || 'Nom non spécifié'}</h4>
                </div>
                <div className='d-flex flex-column gap-16 mt-28'>
                  <div className='flex-align gap-16'>
                    <span className='text-2xl text-main-600'>
                      <i className='ph-bold ph-phone-call' />
                    </span>
                    <p className='mb-0'>{formData.phone || 'Non spécifié'}</p>
                  </div>
                  <div className='flex-align gap-16'>
                    <span className='text-2xl text-success-600'>
                      <i className='ph-bold ph-envelope-simple' />
                    </span>
                    <p className='mb-0'>{formData.email || 'Non spécifié'}</p>
                  </div>
                  <div className='flex-align gap-16'>
                    <span className='text-2xl text-warning-600'>
                      <i className='ph-bold ph-map-pin-line' />
                    </span>
                    <p className='mb-0'>{formData.address || 'Non spécifié'}</p>
                  </div>
                  {formData.linkedin && (
                    <div className='flex-align gap-16'>
                      <span className='text-2xl text-info-600'>
                        <i className='ph-bold ph-linkedin-logo' />
                      </span>
                      <a href={formData.linkedin} target="_blank" rel="noopener noreferrer" className='text-decoration-none'>
                        LinkedIn
                      </a>
                    </div>
                  )}
                  {formData.github && (
                    <div className='flex-align gap-16'>
                      <span className='text-2xl text-dark'>
                        <i className='ph-bold ph-github-logo' />
                      </span>
                      <a href={formData.github} target="_blank" rel="noopener noreferrer" className='text-decoration-none'>
                        GitHub
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className='col-lg-8'>
            <ul className='nav nav-pills common-tab d-inline-flex gap-16 bg-white p-12 border border-neutral-30 rounded-pill' role='tablist'>
              <li className='nav-item' role='presentation'>
                <button
                  className={`nav-link rounded-pill bg-main-25 text-md fw-medium text-neutral-500 flex-center w-100 gap-8 ${activeTab === 'personal' ? 'active' : ''}`}
                  onClick={() => setActiveTab('personal')}
                  type='button'
                  role='tab'
                >
                  <i className='text-xl text-main-600 d-flex ph-bold ph-user' />
                  À propos
                </button>
              </li>
              <li className='nav-item' role='presentation'>
                <button
                  className={`nav-link rounded-pill bg-main-25 text-md fw-medium text-neutral-500 flex-center w-100 gap-8 ${activeTab === 'experience' ? 'active' : ''}`}
                  onClick={() => setActiveTab('experience')}
                  type='button'
                  role='tab'
                >
                  <i className='text-xl text-main-600 d-flex ph-bold ph-briefcase' />
                  Expérience
                </button>
              </li>
              <li className='nav-item' role='presentation'>
                <button
                  className={`nav-link rounded-pill bg-main-25 text-md fw-medium text-neutral-500 flex-center w-100 gap-8 ${activeTab === 'education' ? 'active' : ''}`}
                  onClick={() => setActiveTab('education')}
                  type='button'
                  role='tab'
                >
                  <i className='text-xl text-main-600 d-flex ph-bold ph-graduation-cap' />
                  Formation
                </button>
              </li>
            </ul>

            <div className='tab-content mt-4'>
              <div className={`tab-pane fade ${activeTab === 'personal' ? 'show active' : ''}`}>
                <div className='border border-neutral-30 rounded-12 bg-white p-8'>
                  <div className='border border-neutral-30 rounded-12 bg-main-25 p-32'>
                    <h4>Résumé professionnel</h4>
                    <span className='d-block border border-neutral-30 my-24 border-dashed' />
                    <div className='bg-white rounded-8 p-4'>
                      <div className='row g-4'>
                        <div className='col-12'>
                          <p>{formData.summary || 'Aucun résumé professionnel fourni'}</p>
                        </div>
                        <div className='col-12'>
                          <h5>Compétences techniques</h5>
                          <p>{formData.technicalSkills || 'Aucune compétence technique renseignée'}</p>
                        </div>
                        <div className='col-md-6'>
                          <h5>Soft Skills</h5>
                          <p>{formData.softSkills || 'Aucune soft skill renseignée'}</p>
                        </div>
                        <div className='col-md-6'>
                          <h5>Langues</h5>
                          <p>{formData.languages || 'Aucune langue renseignée'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`tab-pane fade ${activeTab === 'experience' ? 'show active' : ''}`}>
                <div className='border border-neutral-30 rounded-12 bg-white p-8'>
                  <div className='border border-neutral-30 rounded-12 bg-main-25 p-32'>
                    <h4>Expérience professionnelle</h4>
                    <span className='d-block border border-neutral-30 my-24 border-dashed' />
                    <div className='bg-white rounded-8 p-4'>
                      {formData.workExperience && formData.workExperience.length > 0 ? (
                        formData.workExperience.map((exp, index) => (
                          <div key={index} className='mb-4 p-4 border border-neutral-40 rounded-8'>
                            <div className='row g-3'>
                              <div className='col-12'>
                                <h5>{exp.title}</h5>
                                <p className='mb-1'>{exp.company}</p>
                                <p className='text-muted'>
                                  {exp.startDate} - {exp.endDate || 'Présent'}
                                </p>
                                <p>{exp.description}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p>Aucune expérience professionnelle renseignée</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className={`tab-pane fade ${activeTab === 'education' ? 'show active' : ''}`}>
                <div className='border border-neutral-30 rounded-12 bg-white p-8'>
                  <div className='border border-neutral-30 rounded-12 bg-main-25 p-32'>
                    <h4>Formation</h4>
                    <span className='d-block border border-neutral-30 my-24 border-dashed' />
                    <div className='bg-white rounded-8 p-4'>
                      {formData.education && formData.education.length > 0 ? (
                        formData.education.map((edu, index) => (
                          <div key={index} className='mb-4 p-4 border border-neutral-40 rounded-8'>
                            <div className='row g-3'>
                              <div className='col-12'>
                                <h5>{edu.degree}</h5>
                                <p className='mb-1'>{edu.institution}</p>
                                <p className='text-muted'>{edu.graduationDate}</p>
                                {edu.gpa && <p>GPA: {edu.gpa}</p>}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p>Aucune formation renseignée</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CVView; 