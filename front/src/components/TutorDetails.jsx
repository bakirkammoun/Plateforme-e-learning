'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const TutorDetails = () => {
  const [formData, setFormData] = useState({
    // Personal Information
    profileImage: '',
    name: '',
    dateOfBirth: '',
    nationality: '',
    phone: '',
    email: '',
    address: '',
    linkedin: '',
    github: '',
    portfolio: '',
    
    // Professional Summary
    summary: '',

    // Skills
    technicalSkills: '',
    softSkills: '',
    languages: '',

    // Work Experience
    workExperience: [{
      title: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      description: ''
    }],

    // Education
    education: [{
      degree: '',
      institution: '',
      location: '',
      graduationDate: '',
      gpa: ''
    }],

    // Projects
    projects: [{
      name: '',
      technologies: '',
      description: '',
      link: ''
    }],

    // Certifications
    certifications: [{
      name: '',
      issuer: '',
      date: '',
      link: ''
    }]
  });

  const [imagePreview, setImagePreview] = useState('assets/images/thumbs/profile-placeholder.png');
  const [activeTab, setActiveTab] = useState('personal');
  const [cvId, setCvId] = useState(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [favoriteInstructors, setFavoriteInstructors] = useState([]);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [instructors, setInstructors] = useState([]);
  const [showInstructorModal, setShowInstructorModal] = useState(false);
  const [supervisionStatus, setSupervisionStatus] = useState(null);

  const handleInputChange = (e, index, section) => {
    const { name, value } = e.target;
    
    if (section) {
      setFormData(prevState => ({
        ...prevState,
        [section]: prevState[section].map((item, i) => {
          if (i === index) {
            return { ...item, [name.split('.')[1]]: value };
          }
          return item;
        })
      }));
    } else {
      setFormData(prevState => ({
        ...prevState,
        [name]: value
      }));
    }
  };

  const handleAddItem = (section) => {
    const emptyItems = {
      workExperience: {
        title: '',
        company: '',
        location: '',
        startDate: '',
        endDate: '',
        description: ''
      },
      education: {
        degree: '',
        institution: '',
        location: '',
        graduationDate: '',
        gpa: ''
      },
      projects: {
        name: '',
        technologies: '',
        description: '',
        link: ''
      },
      certifications: {
        name: '',
        issuer: '',
        date: '',
        link: ''
      }
    };

    setFormData(prevState => ({
      ...prevState,
      [section]: [...prevState[section], emptyItems[section]]
    }));
  };

  const handleRemoveItem = (section, index) => {
    setFormData(prevState => ({
      ...prevState,
      [section]: prevState[section].filter((_, i) => i !== index)
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    let savingToast = null;

    try {
      const token = localStorage.getItem('authToken');
      const userStr = localStorage.getItem('user');
      
      if (!token || !userStr) {
        toast.error('Veuillez vous reconnecter pour sauvegarder votre CV', {
          position: "top-center",
          autoClose: 5000
        });
        window.location.href = '/login';
        return;
      }

      const user = JSON.parse(userStr);
      
      if (!user || !user.id) {
        toast.error('Session invalide. Veuillez vous reconnecter.', {
          position: "top-center",
          autoClose: 5000
        });
        window.location.href = '/login';
        return;
      }

      // Message initial de sauvegarde
      savingToast = toast.loading('Sauvegarde de votre CV en cours...', {
        position: "top-center"
      });

      const formDataToSend = new FormData();

      // Add user ID explicitly
      formDataToSend.append('userId', user.id);

      // Add profile image if exists
      if (formData.profileImage instanceof File) {
        formDataToSend.append('profileImage', formData.profileImage);
      }

      // Add all personal information fields
      Object.keys(formData).forEach(key => {
        if (key !== 'profileImage' && !Array.isArray(formData[key])) {
          formDataToSend.append(key, formData[key] || '');
        }
      });

      // Add arrays as JSON strings
      ['workExperience', 'education', 'projects', 'certifications'].forEach(key => {
        if (Array.isArray(formData[key])) {
          formDataToSend.append(key, JSON.stringify(formData[key]));
        }
      });

      // Log the data being sent
      console.log('Données envoyées:', {
        userId: user.id,
        personalInfo: Object.fromEntries(
          Object.entries(formData).filter(([key]) => 
            key !== 'profileImage' && !Array.isArray(formData[key])
          )
        ),
        hasImage: formData.profileImage instanceof File,
        arrays: ['workExperience', 'education', 'projects', 'certifications'].reduce((acc, key) => ({
          ...acc,
          [key]: formData[key]
        }), {})
      });

      // Envoyer la requête avec le token
      const response = await axios.post('http://localhost:5000/api/cv', formDataToSend, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        timeout: 10000 // Timeout après 10 secondes
      });

      if (response.data.success) {
        setCvId(response.data.cv._id);
        
        toast.update(savingToast, {
          render: "✅ CV enregistré avec succès !",
          type: "success",
          isLoading: false,
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true
        });

        if (response.data.cv.profileImage) {
          setImagePreview(`http://localhost:5000/uploads/cv-images/${response.data.cv.profileImage}`);
        }
      } else {
        throw new Error(response.data.message || 'Erreur lors de la sauvegarde du CV');
      }
    } catch (error) {
      console.error('Erreur détaillée lors de la sauvegarde:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        stack: error.stack
      });
      
      // S'assurer que le toast de chargement est fermé
      if (savingToast) {
        toast.dismiss(savingToast);
      }

      if (error.response?.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        toast.error('Session expirée. Veuillez vous reconnecter.', {
          position: "top-center",
          autoClose: 5000
        });
        window.location.href = '/login';
      } else if (error.code === 'ECONNABORTED') {
        toast.error('La requête a pris trop de temps. Veuillez réessayer.', {
          position: "top-center",
          autoClose: 5000
        });
      } else if (error.response?.status === 500) {
        toast.error(
          'Erreur serveur lors de la sauvegarde du CV. Veuillez vérifier que tous les champs sont correctement remplis.',
          {
            position: "top-center",
            autoClose: 5000
          }
        );
      } else {
        toast.error(
          error.response?.data?.message || 
          'Erreur lors de l\'enregistrement du CV. Veuillez réessayer.',
          {
            position: "top-center",
            autoClose: 5000
          }
        );
      }
    }
  };

  const handleShare = () => {
    setShowFavorites(!showFavorites);
  };

  const handleShareWithInstructor = async (instructor) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast.error('Veuillez vous connecter pour partager votre CV');
        return;
      }

      if (!instructor) {
        toast.error('Veuillez sélectionner un instructeur');
        return;
      }

      // Vérifier si le CV existe
      if (!cvId) {
        toast.error('Veuillez d\'abord créer votre CV');
        return;
      }

      // Vérifier si une demande est déjà en cours avec cet instructeur
      if (supervisionStatus && supervisionStatus.supervisorId === instructor._id && supervisionStatus.status === 'pending') {
        // Demander confirmation à l'utilisateur
        const confirmResend = window.confirm(
          'Une demande d\'encadrement est déjà en cours avec cet instructeur. Voulez-vous renouveler votre demande?'
        );
        
        if (!confirmResend) {
          return;
        }
      }

      // Préparer les données pour l'envoi
      const shareData = {
        instructorId: instructor._id
      };

      // Envoyer la demande au serveur
      const response = await axios.post(
        `http://localhost:5000/api/cv/share/${cvId}`,
        shareData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        // Créer une notification pour l'instructeur
        const userStr = localStorage.getItem('user');
        const user = JSON.parse(userStr);
        
        await axios.post('http://localhost:5000/api/notifications', {
          type: 'cv_shared',
          recipientId: instructor._id,
          senderId: user.id,
          data: {
            cvId: cvId,
            studentId: user.id,
            studentName: `${user.firstName} ${user.lastName}`
          },
          message: 'Nouveau CV partagé'
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        toast.success('Votre CV a été partagé avec succès avec l\'instructeur');
        setShowFavorites(false);
        
        // Mettre à jour l'état local du CV
        setSupervisionStatus({
          status: 'pending',
          supervisorId: instructor._id
        });
      }
    } catch (error) {
      console.error('Erreur lors du partage du CV:', error);
      if (error.response) {
        toast.error(error.response.data.message || 'Erreur lors du partage du CV');
      } else {
        toast.error('Erreur lors du partage du CV');
      }
    }
  };

  const handleCancelSupervision = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast.error('Veuillez vous connecter pour annuler la demande', {
          position: "top-center",
          autoClose: 3000
        });
        return;
      }

      const response = await axios.post(
        `http://localhost:5000/api/cv/${cvId}/cancel-supervision`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setSupervisionStatus(null);
        toast.success('Demande d\'encadrement annulée avec succès', {
          position: "top-center",
          autoClose: 3000
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'annulation de la demande:', error);
      toast.error('Erreur lors de l\'annulation de la demande', {
        position: "top-center",
        autoClose: 3000
      });
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormData(prevState => ({
          ...prevState,
          profileImage: file
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const loadCV = async () => {
      try {
        const token = localStorage.getItem('authToken');
        console.log('État initial de la connexion:', {
          tokenExists: !!token,
          tokenLength: token ? token.length : 0,
          tokenStart: token ? token.substring(0, 20) + '...' : 'No token'
        });

        if (!token) {
          console.error('Token manquant lors du chargement initial');
          toast.error('Veuillez vous connecter pour accéder à votre CV', {
            position: "top-center",
            autoClose: 5000
          });
          return;
        }

        console.log('Loading CV...');
        const response = await axios.get('http://localhost:5000/api/cv/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        console.log('CV loaded:', response.data);

        if (response.data.success && response.data.cv) {
          const cv = response.data.cv;
          setCvId(cv._id);
          setSupervisionStatus({
            status: cv.supervisionStatus,
            supervisorId: cv.supervisorId
          });
          
          // Update form data with CV data
          setFormData(prevState => ({
            ...prevState,
            name: cv.name || '',
            phone: cv.phone || '',
            email: cv.email || '',
            address: cv.address || '',
            linkedin: cv.linkedin || '',
            github: cv.github || '',
            summary: cv.summary || '',
            technicalSkills: cv.technicalSkills || '',
            softSkills: cv.softSkills || '',
            languages: cv.languages || '',
            workExperience: cv.workExperience?.length ? cv.workExperience : [{
              title: '',
              company: '',
              location: '',
              startDate: '',
              endDate: '',
              description: ''
            }],
            education: cv.education?.length ? cv.education : [{
              degree: '',
              institution: '',
              location: '',
              graduationDate: '',
              gpa: ''
            }],
            projects: cv.projects?.length ? cv.projects : [{
              name: '',
              technologies: '',
              description: '',
              link: ''
            }],
            certifications: cv.certifications?.length ? cv.certifications : [{
              name: '',
              issuer: '',
              date: '',
              link: ''
            }]
          }));

          // Update image preview if exists
          if (cv.profileImage) {
            setImagePreview(`http://localhost:5000/uploads/cv-images/${cv.profileImage}`);
          }

          toast.success('CV chargé avec succès!', {
            position: "top-right",
            autoClose: 3000
          });
        }
      } catch (error) {
        console.error('Error loading CV:', error);
        const errorMessage = error.response?.data?.message || 'Erreur lors du chargement du CV';
        if (error.response?.status !== 404) { // Ne pas afficher d'erreur si le CV n'existe pas encore
          toast.error(errorMessage, {
            position: "top-center",
            autoClose: 5000
          });
        }
      }
    };

    loadCV();
    // Charger les favoris au démarrage
    const fetchFavoriteInstructors = () => {
      try {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
          return;
        }

        const user = JSON.parse(userStr);
        if (!user || !user.id) {
          return;
        }

        const storageKey = `favoriteInstructors_${user.id}`;
        const storedFavorites = JSON.parse(localStorage.getItem(storageKey) || '[]');
        setFavoriteInstructors(storedFavorites);
      } catch (error) {
        console.error('Erreur lors de la récupération des instructeurs favoris:', error);
      }
    };

    fetchFavoriteInstructors();
  }, []); // Exécuté une seule fois au chargement du composant

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
      
      {/* Modal pour afficher les favoris */}
      {showFavorites && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Choisir un enseignant</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowFavorites(false)}
                ></button>
              </div>
              <div className="modal-body">
                {favoriteInstructors.length > 0 ? (
                  <div className="list-group">
                    {favoriteInstructors.map((instructor) => (
                      <div 
                        key={instructor._id} 
                        className="list-group-item list-group-item-action d-flex align-items-center gap-3 py-3"
                      >
                        <img
                          src={instructor.profileImage || '/assets/images/thumbs/default-instructor.png'}
                          alt={`${instructor.firstName} ${instructor.lastName}`}
                          className="rounded-circle"
                          style={{ width: '48px', height: '48px', objectFit: 'cover' }}
                        />
                        <div>
                          <h6 className="mb-0">{instructor.firstName} {instructor.lastName}</h6>
                          <small className="text-muted">{instructor.specialization || 'Instructor'}</small>
                        </div>
                        <button
                          onClick={() => handleShareWithInstructor(instructor)}
                          className="btn btn-sm btn-primary ms-auto"
                        >
                          Partager
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-4">Aucun enseignant favori</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal pour sélectionner un instructeur */}
      {showInstructorModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Sélectionner un enseignant</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowInstructorModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {instructors.length > 0 ? (
                  <div className="list-group">
                    {instructors.map((instructor) => (
                      <div 
                        key={instructor._id} 
                        className="list-group-item list-group-item-action d-flex align-items-center gap-3 py-3"
                      >
                        <img
                          src={instructor.profileImage || '/assets/images/thumbs/default-instructor.png'}
                          alt={`${instructor.firstName} ${instructor.lastName}`}
                          className="rounded-circle"
                          style={{ width: '48px', height: '48px', objectFit: 'cover' }}
                        />
                        <div>
                          <h6 className="mb-0">{instructor.firstName} {instructor.lastName}</h6>
                          <small className="text-muted">{instructor.specialization || 'Enseignant'}</small>
                        </div>
                        <button
                          onClick={() => {
                            handleShareWithInstructor(instructor);
                            setShowInstructorModal(false);
                          }}
                          className="btn btn-sm btn-primary ms-auto"
                        >
                          Partager
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-4">Aucun enseignant disponible</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className='container'>
        <div className='row gy-4'>
          <div className='col-lg-4'>
            <div className='border border-neutral-30 rounded-12 bg-white p-8'>
              <div className='border border-neutral-30 rounded-12 bg-main-25 p-32'>
                <div className='p-16 border border-neutral-50 rounded-circle aspect-ratio-1 max-w-150 max-h-150 mx-auto'>
                  <div className='position-relative'>
                    <img
                      src={imagePreview}
                      alt='Profile'
                      className='rounded-circle bg-dark-yellow aspect-ratio-1 cover-img w-100 h-100 object-fit-cover'
                    />
                    <label htmlFor="profileImage" className='w-32 h-32 bg-success-600 rounded-circle border border-main-25 border-3 flex-center text-white position-absolute inset-block-end-0 inset-inline-end-0 me-4 cursor-pointer'>
                      <i className='ph-bold ph-pencil' />
                    </label>
                    <input 
                      type="file" 
                      id="profileImage" 
                      className="d-none" 
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </div>
                </div>
                <div className='mt-40'>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange(e)}
                    className='form-control text-center mb-16'
                    placeholder="Your Full Name"
                  />
                  </div>
                <div className='d-flex flex-column gap-16 mt-28'>
                  <div className='flex-align gap-16'>
                    <span className='text-2xl text-main-600'>
                      <i className='ph-bold ph-phone-call' />
                    </span>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange(e)}
                      className='form-control'
                      placeholder="Phone Number"
                    />
                  </div>
                  <div className='flex-align gap-16'>
                    <span className='text-2xl text-success-600'>
                      <i className='ph-bold ph-envelope-simple' />
                    </span>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange(e)}
                      className='form-control'
                      placeholder="Email Address"
                    />
                  </div>
                  <div className='flex-align gap-16'>
                    <span className='text-2xl text-warning-600'>
                      <i className='ph-bold ph-map-pin-line' />
                    </span>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange(e)}
                      className='form-control'
                      placeholder="Location"
                    />
                  </div>
                  <div className='flex-align gap-16'>
                    <span className='text-2xl text-info-600'>
                      <i className='ph-bold ph-linkedin-logo' />
                    </span>
                    <input
                      type="url"
                      name="linkedin"
                      value={formData.linkedin}
                      onChange={(e) => handleInputChange(e)}
                      className='form-control'
                      placeholder="LinkedIn Profile URL"
                    />
                  </div>
                  <div className='flex-align gap-16'>
                    <span className='text-2xl text-dark'>
                      <i className='ph-bold ph-github-logo' />
                    </span>
                    <input
                      type="url"
                      name="github"
                      value={formData.github}
                      onChange={(e) => handleInputChange(e)}
                      className='form-control'
                      placeholder="GitHub Profile URL"
                    />
                  </div>
                  </div>
              </div>
            </div>
          </div>
          <div className='col-lg-8'>
            <ul
              className='nav nav-pills common-tab d-inline-flex gap-16 bg-white p-12 border border-neutral-30 rounded-pill'
              role='tablist'
            >
              <li className='nav-item' role='presentation'>
                <button
                  className={`nav-link rounded-pill bg-main-25 text-md fw-medium text-neutral-500 flex-center w-100 gap-8 ${activeTab === 'personal' ? 'active' : ''}`}
                  onClick={() => setActiveTab('personal')}
                  type='button'
                  role='tab'
                >
                  <i className='text-xl text-main-600 d-flex ph-bold ph-user' />
                  About Me
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
                  Experience
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
                  Education
                </button>
              </li>
            </ul>
            <div className='tab-content mt-4'>
              <div className={`tab-pane fade ${activeTab === 'personal' ? 'show active' : ''}`}>
                <div className='border border-neutral-30 rounded-12 bg-white p-8'>
                  <div className='border border-neutral-30 rounded-12 bg-main-25 p-32'>
                    <div className='d-flex justify-content-between align-items-center mb-16'>
                      <h4>Professional Summary</h4>
                      <div className='d-flex gap-3'>
                        <button onClick={handleShare} className='btn btn-outline-primary rounded-pill text-main-600 border-primary hover:text-main-600 hover:bg-transparent'>
                          <i className='ph-bold ph-share me-2 text-main-600'></i>
                          Share CV
                        </button>
                        <button onClick={handleSave} className='btn btn-primary rounded-pill'>
                          <i className='ph-bold ph-floppy-disk me-2'></i>
                          Save Changes
                        </button>
                          </div>
                    </div>
                      <span className='d-block border border-neutral-30 my-24 border-dashed' />
                    <form className='bg-white rounded-8 p-4'>
                      <div className='row g-4'>
                        <div className='col-12'>
                          <label className='form-label fw-medium mb-12'>Professional Summary</label>
                          <textarea
                            name="summary"
                            value={formData.summary}
                            onChange={(e) => handleInputChange(e)}
                            className='form-control bg-main-25 border-neutral-40 rounded-8'
                            rows="4"
                            placeholder="Write a brief summary of your professional background and career objectives..."
                          />
                      </div>
                        <div className='col-12'>
                          <label className='form-label fw-medium mb-12'>Technical Skills</label>
                          <textarea
                            name="technicalSkills"
                            value={formData.technicalSkills}
                            onChange={(e) => handleInputChange(e)}
                            className='form-control bg-main-25 border-neutral-40 rounded-8'
                            rows="3"
                            placeholder="List your technical skills (e.g., Programming languages, frameworks, tools)..."
                              />
                            </div>
                        <div className='col-md-6'>
                          <label className='form-label fw-medium mb-12'>Soft Skills</label>
                          <textarea
                            name="softSkills"
                            value={formData.softSkills}
                            onChange={(e) => handleInputChange(e)}
                            className='form-control bg-main-25 border-neutral-40 rounded-8'
                            rows="3"
                            placeholder="List your soft skills..."
                              />
                            </div>
                        <div className='col-md-6'>
                          <label className='form-label fw-medium mb-12'>Languages</label>
                          <textarea
                            name="languages"
                            value={formData.languages}
                            onChange={(e) => handleInputChange(e)}
                            className='form-control bg-main-25 border-neutral-40 rounded-8'
                            rows="3"
                            placeholder="List languages you speak..."
                              />
                            </div>
                          </div>
                    </form>
                            </div>
                            </div>
                          </div>
              <div className={`tab-pane fade ${activeTab === 'experience' ? 'show active' : ''}`}>
                <div className='border border-neutral-30 rounded-12 bg-white p-8'>
                    <div className='border border-neutral-30 rounded-12 bg-main-25 p-32'>
                    <div className='d-flex justify-content-between align-items-center mb-16'>
                      <h4>Work Experience</h4>
                      <button 
                        type="button"
                        onClick={() => handleAddItem('workExperience')} 
                        className='btn btn-primary rounded-pill'
                      >
                        <i className='ph-bold ph-plus me-2'></i>
                        Add Experience
                      </button>
                            </div>
                        <span className='d-block border border-neutral-30 my-24 border-dashed' />
                    <div className='bg-white rounded-8 p-4'>
                      {formData.workExperience.map((exp, index) => (
                        <div key={index} className='mb-4 p-4 border border-neutral-40 rounded-8 position-relative'>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem('workExperience', index)}
                            className='btn p-0 position-absolute top-0 end-0 mt-3 me-3 transition-all hover:scale-110'
                          >
                            <i className='ph-bold ph-trash text-xl text-danger-500'></i>
                          </button>
                          <div className='row g-3'>
                            <div className='col-md-6'>
                              <label className='form-label fw-medium mb-12'>Job Title</label>
                              <input
                                type="text"
                                name={`workExperience[${index}].title`}
                                value={exp.title}
                                onChange={(e) => handleInputChange(e, index, 'workExperience')}
                                className='form-control bg-main-25 border-neutral-40 rounded-8'
                                placeholder="e.g. Software Engineer"
                              />
                        </div>
                            <div className='col-md-6'>
                              <label className='form-label fw-medium mb-12'>Company</label>
                              <input
                                type="text"
                                name={`workExperience[${index}].company`}
                                value={exp.company}
                                onChange={(e) => handleInputChange(e, index, 'workExperience')}
                                className='form-control bg-main-25 border-neutral-40 rounded-8'
                                placeholder="Company Name"
                              />
                            </div>
                            <div className='col-md-6'>
                              <label className='form-label fw-medium mb-12'>Start Date</label>
                          <input
                                type="date"
                                name={`workExperience[${index}].startDate`}
                                value={exp.startDate}
                                onChange={(e) => handleInputChange(e, index, 'workExperience')}
                                className='form-control bg-main-25 border-neutral-40 rounded-8'
                          />
                        </div>
                            <div className='col-md-6'>
                              <label className='form-label fw-medium mb-12'>End Date</label>
                              <input
                                type="date"
                                name={`workExperience[${index}].endDate`}
                                value={exp.endDate}
                                onChange={(e) => handleInputChange(e, index, 'workExperience')}
                                className='form-control bg-main-25 border-neutral-40 rounded-8'
                              />
                      </div>
                            <div className='col-12'>
                              <label className='form-label fw-medium mb-12'>Description</label>
                              <textarea
                                name={`workExperience[${index}].description`}
                                value={exp.description}
                                onChange={(e) => handleInputChange(e, index, 'workExperience')}
                                className='form-control bg-main-25 border-neutral-40 rounded-8'
                                rows="3"
                                placeholder="Describe your responsibilities and achievements..."
                              />
                          </div>
                        </div>
                        </div>
                      ))}
                      </div>
                        </div>
                          </div>
                        </div>
              <div className={`tab-pane fade ${activeTab === 'education' ? 'show active' : ''}`}>
                <div className='border border-neutral-30 rounded-12 bg-white p-8'>
                  <div className='border border-neutral-30 rounded-12 bg-main-25 p-32'>
                    <div className='d-flex justify-content-between align-items-center mb-16'>
                      <h4>Education</h4>
                          <button
                        type="button"
                        onClick={() => handleAddItem('education')} 
                        className='btn btn-primary rounded-pill'
                      >
                        <i className='ph-bold ph-plus me-2'></i>
                        Add Education
                          </button>
                        </div>
                        <span className='d-block border border-neutral-30 my-24 border-dashed' />
                    <div className='bg-white rounded-8 p-4'>
                      {formData.education.map((edu, index) => (
                        <div key={index} className='mb-4 p-4 border border-neutral-40 rounded-8 position-relative'>
                      <button
                            type="button"
                            onClick={() => handleRemoveItem('education', index)}
                            className='btn p-0 position-absolute top-0 end-0 mt-3 me-3 transition-all hover:scale-110'
                      >
                            <i className='ph-bold ph-trash text-xl text-danger-500'></i>
                      </button>
                          <div className='row g-3'>
                            <div className='col-md-6'>
                              <label className='form-label fw-medium mb-12'>Degree</label>
                          <input
                                type="text"
                                name={`education[${index}].degree`}
                                value={edu.degree}
                                onChange={(e) => handleInputChange(e, index, 'education')}
                                className='form-control bg-main-25 border-neutral-40 rounded-8'
                                placeholder="e.g. Bachelor of Science in Computer Science"
                          />
                        </div>
                            <div className='col-md-6'>
                              <label className='form-label fw-medium mb-12'>Institution</label>
                          <input
                                type="text"
                                name={`education[${index}].institution`}
                                value={edu.institution}
                                onChange={(e) => handleInputChange(e, index, 'education')}
                                className='form-control bg-main-25 border-neutral-40 rounded-8'
                                placeholder="Institution Name"
                          />
                        </div>
                            <div className='col-md-6'>
                              <label className='form-label fw-medium mb-12'>Graduation Date</label>
                              <input
                                type="date"
                                name={`education[${index}].graduationDate`}
                                value={edu.graduationDate}
                                onChange={(e) => handleInputChange(e, index, 'education')}
                                className='form-control bg-main-25 border-neutral-40 rounded-8'
                              />
                            </div>
                            <div className='col-md-6'>
                              <label className='form-label fw-medium mb-12'>GPA</label>
                              <input
                                type="text"
                                name={`education[${index}].gpa`}
                                value={edu.gpa}
                                onChange={(e) => handleInputChange(e, index, 'education')}
                                className='form-control bg-main-25 border-neutral-40 rounded-8'
                                placeholder="e.g. 3.8/4.0"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
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

export default TutorDetails;

