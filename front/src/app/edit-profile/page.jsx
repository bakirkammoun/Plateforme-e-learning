"use client";

import { useState, useEffect } from "react";
import Breadcrumb from "@/components/Breadcrumb";
import FooterOne from "@/components/FooterOne";
import HeaderInstructor from "@/components/Header";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from "axios";

const EditProfile = () => {
  const [userData, setUserData] = useState({
    _id: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: '',
    profileImage: null,
    role: '',
    isApproved: false
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadUserData();
  }, []);

  const fetchUserProfile = async (userId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/admin/users/profile/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération du profil:", error);
      throw error;
    }
  };

  const loadUserData = async () => {
    try {
      // Récupérer les données du localStorage
      const userStr = localStorage.getItem('user');
      console.log('User data from localStorage:', userStr); // Debug log

      if (!userStr) {
        console.log('No user data in localStorage');
        toast.error("Veuillez vous connecter");
        window.location.href = '/login';
        return;
      }

      let localUser;
      try {
        localUser = JSON.parse(userStr);
        console.log('Parsed user data:', localUser); // Debug log
      } catch (e) {
        console.error('Error parsing user data:', e);
        toast.error("Erreur de format des données utilisateur");
        return;
      }

      if (!localUser || !localUser._id) {
        console.log('Invalid user data structure:', localUser);
        // Essayer de récupérer l'ID d'une autre manière si possible
        const userId = localUser?.id || localUser?._id;
        if (!userId) {
          toast.error("Données utilisateur incomplètes");
          window.location.href = '/login';
          return;
        }
        localUser._id = userId;
      }

      try {
        // Récupérer les données fraîches depuis le backend
        console.log('Fetching user profile for ID:', localUser._id);
        const freshUserData = await fetchUserProfile(localUser._id);
        console.log('Received fresh user data:', freshUserData);

        if (!freshUserData) {
          throw new Error('Aucune donnée reçue du serveur');
        }

        // Mettre à jour les données utilisateur
        setUserData({
          _id: freshUserData._id || localUser._id,
          firstName: freshUserData.firstName || localUser.firstName || '',
          lastName: freshUserData.lastName || localUser.lastName || '',
          email: freshUserData.email || localUser.email || '',
          phone: freshUserData.phone || localUser.phone || '',
          bio: freshUserData.bio || localUser.bio || '',
          profileImage: freshUserData.profileImage || localUser.profileImage || null,
          role: freshUserData.role || localUser.role || '',
          isApproved: freshUserData.isApproved || localUser.isApproved || false
        });

        // Mettre à jour l'image de profil
        if (freshUserData.profileImage) {
          setPreviewImage(freshUserData.profileImage);
        }

        // Mettre à jour le localStorage avec les données fraîches
        localStorage.setItem('user', JSON.stringify(freshUserData));

      } catch (error) {
        console.error('Error fetching fresh user data:', error);
        // En cas d'échec de récupération des données fraîches, utiliser les données locales
        setUserData({
          _id: localUser._id,
          firstName: localUser.firstName || '',
          lastName: localUser.lastName || '',
          email: localUser.email || '',
          phone: localUser.phone || '',
          bio: localUser.bio || '',
          profileImage: localUser.profileImage || null,
          role: localUser.role || '',
          isApproved: localUser.isApproved || false
        });

        if (localUser.profileImage) {
          setPreviewImage(localUser.profileImage);
        }

        toast.warning("Impossible de récupérer les dernières données du serveur");
      }

    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      toast.error("Erreur lors du chargement des données utilisateur");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!userData.firstName?.trim()) newErrors.firstName = "Le prénom est requis";
    if (!userData.lastName?.trim()) newErrors.lastName = "Le nom est requis";
    if (!userData.email?.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/\S+@\S+\.\S+/.test(userData.email)) {
      newErrors.email = "Format d'email invalide";
    }
    if (userData.phone && !/^\+?[\d\s-]{8,}$/.test(userData.phone)) {
      newErrors.phone = "Numéro de téléphone invalide";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Vérification de la taille du fichier (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        toast.error("L'image est trop grande. La taille maximale est de 2MB");
        return;
      }

      // Vérification du type de fichier
      if (!file.type.startsWith('image/')) {
        toast.error("Veuillez sélectionner une image valide");
        return;
      }

      try {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = function(e) {
          img.src = e.target.result;
          img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Définir la taille maximale souhaitée
            const maxSize = 400;
            let width = img.width;
            let height = img.height;

            // Calculer les nouvelles dimensions en conservant le ratio
            if (width > height) {
              if (width > maxSize) {
                height = Math.round((height * maxSize) / width);
                width = maxSize;
              }
            } else {
              if (height > maxSize) {
                width = Math.round((width * maxSize) / height);
                height = maxSize;
              }
            }

            canvas.width = width;
            canvas.height = height;

            // Dessiner l'image redimensionnée
            ctx.drawImage(img, 0, 0, width, height);

            // Convertir en base64 avec une qualité de 0.8
            const resizedImage = canvas.toDataURL('image/jpeg', 0.8);
            
            // Mettre à jour l'aperçu et les données utilisateur
            setPreviewImage(resizedImage);
            setUserData(prev => ({
              ...prev,
              profileImage: resizedImage
            }));

            toast.success("Photo de profil mise à jour avec succès");
          };
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error("Erreur lors du traitement de l'image:", error);
        toast.error("Une erreur est survenue lors du traitement de l'image");
      }
    }
  };

  const updateUser = async (userId, userData) => {
    try {
      if (!userId) {
        throw new Error("ID utilisateur requis");
      }

      const updateData = {
        firstName: userData.firstName?.trim(),
        lastName: userData.lastName?.trim(),
        email: userData.email?.trim(),
        phone: userData.phone?.trim() || '',
        bio: userData.bio?.trim() || '',
        role: userData.role,
        isApproved: userData.isApproved
      };

      if (userData.profileImage) {
        updateData.profileImage = userData.profileImage;
      }

      const response = await axios.put(
        `http://localhost:5000/api/admin/users/${userId}/update`,
        updateData,
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.data.user) {
        // Mettre à jour le localStorage
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Mettre à jour l'état
        setUserData(response.data.user);
        
        toast.success("Profil mis à jour avec succès");
        return response.data;
      } else {
        throw new Error('Aucune donnée utilisateur dans la réponse');
      }
    } catch (error) {
      console.error('Erreur de mise à jour:', error);
      const errorMessage = error.response?.data?.message || error.message || "Erreur lors de la mise à jour du profil";
      toast.error(errorMessage);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      await updateUser(userData._id, userData);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <HeaderInstructor />
        <main className="wrapper">
          <div className="container py-80">
            <div className="text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
            </div>
          </div>
        </main>
        <FooterOne />
      </>
    );
  }

  return (
    <>
      <HeaderInstructor />
      <ToastContainer />
      <main className="wrapper">
        <Breadcrumb pageTitle="Edit Profile" />
        
        <div className="container py-80">
          <div className="row justify-content-center">
            <div className="col-xl-10">
              {/* Cover Section with Animated Background */}
              <div className="position-relative mb-24">
                <div className="cover-image rounded-4" style={{
                  height: '250px',
                  background: 'linear-gradient(45deg, #2563eb, #3b82f6, #60a5fa)',
                  backgroundSize: '200% 200%',
                  animation: 'gradientBG 15s ease infinite',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Animated Background Elements */}
                  <div className="animated-bg-elements">
                    <div className="circle circle-1"></div>
                    <div className="circle circle-2"></div>
                    <div className="circle circle-3"></div>
                    <div className="wave wave-1"></div>
                    <div className="wave wave-2"></div>
                  </div>
                  
                  <div className="position-absolute bottom-0 start-0 p-24 w-100">
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center">
                        <div className="profile-image-wrapper">
                          <div className="profile-image position-relative">
                            <img 
                              src={previewImage || '/assets/images/avatar/default-profile.png'} 
                              alt="Profile" 
                              className="profile-img rounded-circle border border-4 border-white"
                              style={{
                                width: '120px',
                                height: '120px',
                                objectFit: 'cover',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                              }}
                            />
                            <div className="upload-overlay position-absolute bottom-0 end-0 bg-primary rounded-circle p-2">
                              <label htmlFor="profileImage" className="upload-button cursor-pointer">
                                <i className="ph ph-camera text-white"></i>
                              </label>
                            </div>
                          </div>
                        </div>
                        <div className="ms-24">
                          <h4 className="text-white mb-4">{userData.firstName} {userData.lastName}</h4>
                          <p className="text-white-50 mb-0">Update your personal information and profile picture</p>
                        </div>
                      </div>
                      <div className="d-none d-md-block">
                        <div className="stats-card bg-white bg-opacity-10 rounded-4 p-16">
                          <div className="d-flex align-items-center">
                            <i className="ph ph-user-circle text-white me-2"></i>
                            <span className="text-white">{userData.role}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Ajout de l'input file */}
                <input
                  type="file"
                  id="profileImage"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="d-none"
                />
              </div>

              <div className="card border-light shadow-sm rounded-4 p-sm-50 p-20">
                <form onSubmit={handleSubmit} className="needs-validation">
                  <div className="row g-24">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label fw-medium d-flex align-items-center">
                          <i className="ph ph-user me-2 text-primary"></i>
                          First Name *
                        </label>
                        <div className="input-group">
                          <span className="input-group-text bg-main-25 border-0 rounded-start-pill">
                            <i className="ph ph-user text-primary"></i>
                          </span>
                          <input
                            type="text"
                            className={`form-control bg-main-25 border-neutral-30 rounded-end-pill py-12 px-24 ${errors.firstName ? 'is-invalid' : ''}`}
                            value={userData.firstName}
                            onChange={(e) => setUserData(prev => ({...prev, firstName: e.target.value}))}
                            placeholder="Enter your first name"
                          />
                        </div>
                        {errors.firstName && <div className="invalid-feedback">{errors.firstName}</div>}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label fw-medium d-flex align-items-center">
                          <i className="ph ph-user me-2 text-primary"></i>
                          Last Name *
                        </label>
                        <div className="input-group">
                          <span className="input-group-text bg-main-25 border-0 rounded-start-pill">
                            <i className="ph ph-user text-primary"></i>
                          </span>
                          <input
                            type="text"
                            className={`form-control bg-main-25 border-neutral-30 rounded-end-pill py-12 px-24 ${errors.lastName ? 'is-invalid' : ''}`}
                            value={userData.lastName}
                            onChange={(e) => setUserData(prev => ({...prev, lastName: e.target.value}))}
                            placeholder="Enter your last name"
                          />
                        </div>
                        {errors.lastName && <div className="invalid-feedback">{errors.lastName}</div>}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label fw-medium d-flex align-items-center">
                          <i className="ph ph-envelope me-2 text-primary"></i>
                          Email *
                        </label>
                        <div className="input-group">
                          <span className="input-group-text bg-main-25 border-0 rounded-start-pill">
                            <i className="ph ph-envelope text-primary"></i>
                          </span>
                          <input
                            type="email"
                            className={`form-control bg-main-25 border-neutral-30 rounded-end-pill py-12 px-24 ${errors.email ? 'is-invalid' : ''}`}
                            value={userData.email}
                            onChange={(e) => setUserData(prev => ({...prev, email: e.target.value}))}
                            placeholder="Enter your email"
                          />
                        </div>
                        {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label fw-medium d-flex align-items-center">
                          <i className="ph ph-phone me-2 text-primary"></i>
                          Phone
                        </label>
                        <div className="input-group">
                          <span className="input-group-text bg-main-25 border-0 rounded-start-pill">
                            <i className="ph ph-phone text-primary"></i>
                          </span>
                          <input
                            type="tel"
                            className={`form-control bg-main-25 border-neutral-30 rounded-end-pill py-12 px-24 ${errors.phone ? 'is-invalid' : ''}`}
                            value={userData.phone}
                            onChange={(e) => setUserData(prev => ({...prev, phone: e.target.value}))}
                            placeholder="+1 234 567 890"
                          />
                        </div>
                        {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="form-group">
                        <label className="form-label fw-medium d-flex align-items-center">
                          <i className="ph ph-info me-2 text-primary"></i>
                          Bio
                        </label>
                        <div className="input-group">
                          <span className="input-group-text bg-main-25 border-0 rounded-start-4">
                            <i className="ph ph-info text-primary"></i>
                          </span>
                          <textarea
                            className="form-control bg-main-25 border-neutral-30 rounded-end-4 py-12 px-24"
                            value={userData.bio}
                            onChange={(e) => setUserData(prev => ({...prev, bio: e.target.value}))}
                            rows="5"
                            placeholder="Tell us about yourself"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-center mt-48">
                    <button
                      type="submit"
                      className="btn btn-primary rounded-pill px-30 py-12 d-inline-flex align-items-center"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Updating...
                        </>
                      ) : (
                        <>
                          <i className="ph ph-check-circle me-2"></i>
                          Update Profile
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
      <FooterOne />

      <style jsx>{`
        @keyframes gradientBG {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .animated-bg-elements {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .circle {
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
        }

        .circle-1 {
          width: 300px;
          height: 300px;
          top: -100px;
          right: -100px;
          animation: float 8s ease-in-out infinite;
        }

        .circle-2 {
          width: 200px;
          height: 200px;
          bottom: -50px;
          left: -50px;
          animation: float 6s ease-in-out infinite;
        }

        .circle-3 {
          width: 150px;
          height: 150px;
          top: 50%;
          right: 10%;
          animation: float 7s ease-in-out infinite;
        }

        .wave {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 50px;
          background: rgba(255, 255, 255, 0.1);
          transform-origin: bottom;
        }

        .wave-1 {
          animation: wave 3s ease-in-out infinite;
        }

        .wave-2 {
          animation: wave 3s ease-in-out infinite;
          animation-delay: 1.5s;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }

        @keyframes wave {
          0%, 100% { transform: scaleX(1); }
          50% { transform: scaleX(1.2); }
        }

        .profile-image-wrapper {
          position: relative;
          display: inline-block;
        }

        .upload-overlay {
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .upload-overlay:hover {
          transform: scale(1.1) rotate(5deg);
          background-color: #1d4ed8 !important;
        }

        .form-control {
          transition: all 0.3s ease;
        }

        .form-control:focus {
          box-shadow: 0 0 0 0.2rem rgba(37, 99, 235, 0.25);
          border-color: #2563eb;
        }

        .input-group-text {
          transition: all 0.3s ease;
        }

        .input-group:hover .input-group-text {
          background-color: #eff6ff !important;
        }

        .btn-primary {
          transition: all 0.3s ease;
          background: linear-gradient(45deg, #2563eb, #3b82f6);
          border: none;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.1), 0 2px 4px -1px rgba(37, 99, 235, 0.06);
          background: linear-gradient(45deg, #1d4ed8, #2563eb);
        }

        .card {
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
          background: rgba(255, 255, 255, 0.95);
        }

        .card:hover {
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          transform: translateY(-2px);
        }

        .stats-card {
          backdrop-filter: blur(5px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </>
  );
};

export default EditProfile;