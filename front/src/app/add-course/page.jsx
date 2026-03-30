'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Breadcrumb from "@/components/Breadcrumb";
import HeaderInstructor from "@/components/HeaderInstructor";
import FooterOne from "@/components/FooterOne";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AddCourse = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [mainCategories, setMainCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [selectedMainCategoryId, setSelectedMainCategoryId] = useState('');
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    level: '',
    price: '',
    duration: '',
    image: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const user = JSON.parse(localStorage.getItem('user'));
    if (!token || !user || !user.id) {
      toast.error("Vous devez être connecté pour créer un cours");
      router.push('/sign-in');
    } else {
      console.log('Utilisateur connecté:', user.role);
      fetchCategories();
    }
  }, [router]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/categories');
      if (response.data) {
        setCategories(response.data);
        const mains = response.data.filter(cat => !cat.parentCategory);
        setMainCategories(mains);
        if (mains.length > 0) {
          setSelectedMainCategoryId(mains[0]._id);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories:', error);
      toast.error('Erreur lors de la récupération des catégories');
    }
  };

  useEffect(() => {
    if (selectedMainCategoryId) {
      const subs = categories.filter(cat => cat.parentCategory === selectedMainCategoryId);
      setSubCategories(subs);
      setSelectedSubCategoryId('');
    } else {
      setSubCategories([]);
      setSelectedSubCategoryId('');
    }
  }, [selectedMainCategoryId, categories]);

  useEffect(() => {
    if (selectedSubCategoryId) {
      const subCat = subCategories.find(cat => cat._id === selectedSubCategoryId);
      if (subCat) {
        // Déterminer la catégorie principale en fonction de la sous-catégorie
        let mainCategory = 'Langues';
        if (subCat.name.includes('Développement') || subCat.name.includes('Intelligence') || 
            subCat.name.includes('Graphique') || subCat.name.includes('Bureautique')) {
          mainCategory = 'Informatique';
        } else if (subCat.name.includes('Concours') || subCat.name.includes('Formation')) {
          mainCategory = 'Concours et Formation Scolaire';
        }
        
        setFormData(prev => ({ 
          ...prev, 
          category: mainCategory
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, category: '' }));
    }
  }, [selectedSubCategoryId, subCategories]);

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 600;
          const MAX_HEIGHT = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
          resolve(dataUrl);
        };
      };
    });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }

      try {
        const compressedImage = await compressImage(file);
        setFormData(prev => ({ ...prev, image: compressedImage }));
      } catch (error) {
        console.error('Error processing image:', error);
        toast.error("Error processing image");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const token = localStorage.getItem('authToken'); // Utiliser authToken au lieu de token
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token || !user || !user.id) {
      toast.error("Vous devez être connecté pour créer un cours");
      router.push('/sign-in');
      setLoading(false);
      return;
    }

    // Validate numeric fields
    const price = parseFloat(formData.price);
    const duration = parseFloat(formData.duration);

    if (isNaN(price) || price < 0) {
      toast.error("Veuillez entrer un prix valide");
      setLoading(false);
      return;
    }

    if (isNaN(duration) || duration < 1) {
      toast.error("Veuillez entrer une durée valide");
      setLoading(false);
      return;
    }

    const formationData = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      level: formData.level,
      price: price,
      duration: duration,
      image: formData.image,
      instructorId: user.id,
      status: 'draft'
    };

    try {
      // Créer la formation
      const response = await axios.post('http://localhost:5000/api/formations', formationData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 201) {
        // Créer l'archive
        const archiveData = {
          type: 'formation',
          originalId: response.data._id,
          data: {
            ...formationData,
            createdAt: new Date().toISOString()
          }
        };

        // Envoyer les données d'archive
        await axios.post('http://localhost:5000/api/archives', archiveData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        toast.success("Formation créée et archivée avec succès!");
        router.push('/my-courses');
      }
    } catch (error) {
      console.error('Erreur:', error);
      if (error.response?.status === 401) {
        toast.error("Session expirée, veuillez vous reconnecter");
        router.push('/sign-in');
      } else {
        toast.error(error.response?.data?.message || "Erreur lors de la création de la formation");
      }
    } finally {
      setLoading(false);
    }
  };

  const archiveFormation = async (formation) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast.error('Veuillez vous connecter pour archiver une formation');
        return;
      }

      const archiveData = {
        type: 'formation',
        originalId: formation.id,
        data: {
          title: formation.title,
          description: formation.description,
          duration: formation.duration,
          price: formation.price,
          startDate: formation.startDate,
          endDate: formation.endDate,
          maxParticipants: formation.maxParticipants,
          image: formation.image,
          instructorId: formation.instructorId,
          isPublic: formation.isPublic
        }
      };

      await axios.post('http://localhost:5000/api/archives', archiveData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Formation archivée avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'archivage:', error);
      throw error;
    }
  };

  const handleDeleteFormation = async (formation) => {
    if (!formation) return;

    try {
      // Archiver la formation avant de la supprimer
      await archiveFormation(formation);

      // Supprimer la formation
      await axios.delete(`http://localhost:5000/api/formations/${formation.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      toast.success('Formation archivée et supprimée avec succès');
      fetchFormations();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression de la formation');
    }
  };

  const handleUpdateFormation = async (formationId) => {
    try {
      const formation = formations.find(f => f.id === formationId);
      if (!formation) {
        toast.error('Formation non trouvée');
        return;
      }

      // Archiver l'ancienne version de la formation avant la mise à jour
      await archiveFormation(formation);

      const formationData = {
        ...formData,
        instructorId: userId
      };

      await axios.put(`http://localhost:5000/api/formations/${formationId}`, formationData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      toast.success('Formation archivée et mise à jour avec succès');
      resetForm();
      fetchFormations();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast.error('Erreur lors de la mise à jour de la formation');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      duration: '',
      price: '',
      startDate: '',
      endDate: '',
      maxParticipants: 0,
      isPublic: true,
      image: null
    });
  };

  return (
    <>
      <HeaderInstructor />
      <Breadcrumb title="Add New Course" />
      <ToastContainer />

      <section className="add-course-section py-120 position-relative overflow-hidden">
        <img
          src='assets/images/shapes/shape2.png'
          alt=''
          className='shape two animation-scalation'
        />
        <img
          src='assets/images/shapes/shape4.png'
          alt=''
          className='shape six animation-walking'
        />
        
        <div className="container">
          <div className="section-heading text-center mb-50">
            <div className="flex-align d-inline-flex gap-8 mb-16" data-aos="fade-down">
              <span className="text-main-600 text-2xl d-flex">
                <i className="ph-bold ph-plus-circle"></i>
              </span>
              <h5 className="text-main-600 mb-0">Create New Course</h5>
            </div>
            <h2 className="mb-24" data-aos="fade-up">Share Your Knowledge with the World</h2>
            <p data-aos="fade-up" data-aos-delay="100" className="text-neutral-500 max-w-800 mx-auto">
              Create an engaging and comprehensive course that will help students achieve their learning goals. 
              Fill in all the details below to get started.
            </p>
          </div>

          <div className="row justify-content-center">
            <div className="col-xl-10">
              <div className="card border-0 shadow-lg rounded-24 p-sm-50 p-20 bg-white position-relative overflow-hidden" data-aos="zoom-in" data-aos-delay="200">
                <div className="card-decoration position-absolute top-0 end-0 mt-n40 me-n40">
                  <div className="shape-circle bg-main-50 w-120 h-120 rounded-circle"></div>
                </div>
                <div className="card-decoration position-absolute bottom-0 start-0 mb-n40 ms-n40">
                  <div className="shape-circle bg-main-two-50 w-120 h-120 rounded-circle"></div>
                </div>

                <form onSubmit={handleSubmit} className="needs-validation position-relative">
                  <div className="row g-32">
                    {/* Course Title */}
                    <div className="col-md-12">
                      <div className="form-group hover-border-main" data-aos="fade-up" data-aos-delay="300">
                        <label className="form-label fw-semibold mb-16">
                          <i className="ph-bold ph-book-open me-2 text-main-600"></i>
                          Course Title *
                        </label>
                        <input
                          type="text"
                          className="form-control bg-main-25 border-2 border-neutral-30 rounded-pill py-16 px-24 transition-all hover-border-main focus-border-main"
                          value={formData.title}
                          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                          required
                          placeholder="Enter an engaging course title"
                        />
                      </div>
                    </div>

                    {/* Course Description */}
                    <div className="col-md-12">
                      <div className="form-group hover-border-main" data-aos="fade-up" data-aos-delay="400">
                        <label className="form-label fw-semibold mb-16">
                          <i className="ph-bold ph-text-align-left me-2 text-main-600"></i>
                          Course Description *
                        </label>
                        <textarea
                          className="form-control bg-main-25 border-2 border-neutral-30 rounded-16 py-16 px-24 transition-all hover-border-main focus-border-main"
                          rows="5"
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          required
                          placeholder="Describe what students will learn in your course"
                        />
                      </div>
                    </div>

                    {/* Category Selection */}
                    <div className="col-md-6">
                      <div className="form-group hover-border-main" data-aos="fade-up" data-aos-delay="500">
                        <label className="form-label fw-semibold mb-16">
                          <i className="ph-bold ph-folders me-2 text-main-600"></i>
                          Catégorie parente *
                        </label>
                        <select
                          className="form-select bg-main-25 border-2 border-neutral-30 rounded-pill py-16 px-24 transition-all hover-border-main focus-border-main"
                          value={selectedMainCategoryId}
                          onChange={(e) => setSelectedMainCategoryId(e.target.value)}
                          required
                        >
                          <option value="">Sélectionnez une grande catégorie</option>
                          {mainCategories.map((cat) => (
                            <option key={cat._id} value={cat._id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Sub-category Selection */}
                    {subCategories.length > 0 && (
                      <div className="col-md-6">
                        <div className="form-group hover-border-main" data-aos="fade-up" data-aos-delay="600">
                          <label className="form-label fw-semibold mb-16">
                            <i className="ph-bold ph-folders me-2 text-main-600"></i>
                            Sous-catégorie *
                          </label>
                          <select
                            className="form-select bg-main-25 border-2 border-neutral-30 rounded-pill py-16 px-24 transition-all hover-border-main focus-border-main"
                            value={selectedSubCategoryId}
                            onChange={(e) => setSelectedSubCategoryId(e.target.value)}
                            required
                          >
                            <option value="">Sélectionnez une sous-catégorie</option>
                            {subCategories.map((cat) => (
                              <option key={cat._id} value={cat._id}>{cat.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Level Selection */}
                    <div className="col-md-6">
                      <div className="form-group hover-border-main" data-aos="fade-up" data-aos-delay="700">
                        <label className="form-label fw-semibold mb-16">
                          <i className="ph-bold ph-chart-bar me-2 text-main-600"></i>
                          Niveau *
                        </label>
                        <select
                          className="form-select bg-main-25 border-2 border-neutral-30 rounded-pill py-16 px-24 transition-all hover-border-main focus-border-main"
                          value={formData.level}
                          onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value }))}
                          required
                        >
                          <option value="">Sélectionnez un niveau</option>
                          {formData.category === 'Langues' && (
                            <>
                              <option value="Débutant">Débutant</option>
                              <option value="Elémentaire">Elémentaire</option>
                              <option value="Intermédiaire">Intermédiaire</option>
                              <option value="Avancé">Avancé</option>
                              <option value="Autonome">Autonome</option>
                              <option value="Maîtrise">Maîtrise</option>
                            </>
                          )}
                          {formData.category === 'Informatique' && (
                            <>
                              <option value="Développement Informatique">Développement Informatique</option>
                              <option value="Intelligence Artificielle et Big Data">Intelligence Artificielle et Big Data</option>
                              <option value="Graphique et Marketing Digital">Graphique et Marketing Digital</option>
                              <option value="Bureautique">Bureautique</option>
                            </>
                          )}
                          {formData.category === 'Concours et Formation Scolaire' && (
                            <>
                              <option value="Préparation aux Concours">Préparation aux Concours</option>
                              <option value="Formation pour Tous les Niveaux">Formation pour Tous les Niveaux</option>
                            </>
                          )}
                        </select>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="col-md-6">
                      <div className="form-group hover-border-main" data-aos="fade-up" data-aos-delay="800">
                        <label className="form-label fw-semibold mb-16">
                          <i className="ph-bold ph-currency-dollar me-2 text-main-600"></i>
                          Price ($) *
                        </label>
                        <input
                          type="number"
                          className="form-control bg-main-25 border-2 border-neutral-30 rounded-pill py-16 px-24 transition-all hover-border-main focus-border-main"
                          value={formData.price}
                          onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                          required
                          min="0"
                          step="0.01"
                          placeholder="Set your course price"
                        />
                      </div>
                    </div>

                    {/* Duration */}
                    <div className="col-md-6">
                      <div className="form-group hover-border-main" data-aos="fade-up" data-aos-delay="900">
                        <label className="form-label fw-semibold mb-16">
                          <i className="ph-bold ph-clock me-2 text-main-600"></i>
                          Duration (hours) *
                        </label>
                        <input
                          type="number"
                          className="form-control bg-main-25 border-2 border-neutral-30 rounded-pill py-16 px-24 transition-all hover-border-main focus-border-main"
                          value={formData.duration}
                          onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                          required
                          min="1"
                          placeholder="Specify course duration"
                        />
                      </div>
                    </div>

                    {/* Course Image */}
                    <div className="col-md-12">
                      <div className="form-group hover-border-main" data-aos="fade-up" data-aos-delay="1000">
                        <label className="form-label fw-semibold mb-16">
                          <i className="ph-bold ph-image me-2 text-main-600"></i>
                          Course Image *
                        </label>
                        <div className="d-flex align-items-center gap-4">
                          {formData.image && (
                            <div className="position-relative" style={{ width: '120px', height: '120px' }}>
                              <img
                                src={formData.image}
                                alt="Course preview"
                                className="rounded-16 w-100 h-100 object-fit-cover border-2 border-main-600"
                              />
                              <div className="position-absolute top-0 start-0 w-100 h-100 bg-dark bg-opacity-10 rounded-16"></div>
                            </div>
                          )}
                          <div className="flex-grow-1">
                            <div className="file-upload-wrapper">
                              <input
                                type="file"
                                className="form-control bg-main-25 border-2 border-neutral-30 rounded-pill py-16 px-24 transition-all hover-border-main focus-border-main"
                                onChange={handleImageChange}
                                accept="image/*"
                                required={!formData.image}
                              />
                            </div>
                            <small className="text-muted d-block mt-3">
                              <i className="ph-bold ph-info me-1"></i>
                              Max file size: 5MB. Recommended size: 600x400px
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="col-12 text-center mt-50" data-aos="fade-up" data-aos-delay="1100">
                      <button
                        type="submit"
                        className="btn btn-main rounded-pill px-40 py-16 hover-transform-none btn-lg position-relative overflow-hidden"
                        disabled={loading}
                      >
                        <span className="btn-text-wrapper position-relative">
                          {loading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Creating Your Course...
                            </>
                          ) : (
                            <>
                              <i className="ph-bold ph-check-circle me-2"></i>
                              Create Course
                            </>
                          )}
                        </span>
                        <div className="btn-bg-wrapper position-absolute top-0 start-0 w-100 h-100 bg-main-700 opacity-0 transition-all"></div>
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      <FooterOne />
    </>
  );
};

export default AddCourse;
