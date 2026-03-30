'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Breadcrumb from "@/components/Breadcrumb";
import HeaderInstructor from "@/components/HeaderInstructor";
import FooterOne from "@/components/FooterOne";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const EditCourse = ({ params }) => {
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
      toast.error("Vous devez être connecté pour modifier un cours");
      router.push('/sign-in');
    } else {
      console.log('Utilisateur connecté:', user.role);
      fetchCategories();
      fetchCourseDetails();
    }
  }, [router, params.id]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/categories');
      if (response.data) {
        setCategories(response.data);
        const mains = response.data.filter(cat => !cat.parentCategory);
        setMainCategories(mains);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories:', error);
      toast.error('Erreur lors de la récupération des catégories');
    }
  };

  const fetchCourseDetails = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/formations/${params.id}`);
      if (response.data) {
        const course = response.data;
        setFormData({
          title: course.title,
          description: course.description,
          category: course.category,
          level: course.level,
          price: course.price,
          duration: course.duration,
          image: course.image,
        });

        // Trouver la catégorie principale correspondante
        const mainCat = mainCategories.find(cat => 
          cat.name === course.category || 
          (course.category === 'Informatique' && cat.name.includes('Informatique')) ||
          (course.category === 'Langues' && cat.name.includes('Langues')) ||
          (course.category === 'Concours et Formation Scolaire' && cat.name.includes('Concours'))
        );

        if (mainCat) {
          setSelectedMainCategoryId(mainCat._id);
          const subs = categories.filter(cat => cat.parentCategory === mainCat._id);
          setSubCategories(subs);
          
          // Trouver la sous-catégorie correspondante
          const subCat = subs.find(cat => cat.name === course.level);
          if (subCat) {
            setSelectedSubCategoryId(subCat._id);
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des détails du cours:', error);
      toast.error('Erreur lors de la récupération des détails du cours');
    }
  };

  useEffect(() => {
    if (selectedMainCategoryId) {
      const subs = categories.filter(cat => cat.parentCategory === selectedMainCategoryId);
      setSubCategories(subs);
    } else {
      setSubCategories([]);
    }
  }, [selectedMainCategoryId, categories]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const token = localStorage.getItem('authToken');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token || !user || !user.id) {
      toast.error("Vous devez être connecté pour modifier un cours");
      router.push('/sign-in');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.put(
        `http://localhost:5000/api/formations/${params.id}`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status === 200) {
        toast.success("Cours modifié avec succès!");
        router.push('/my-courses');
      }
    } catch (error) {
      console.error('Erreur lors de la modification du cours:', error);
      toast.error(error.response?.data?.message || "Erreur lors de la modification du cours");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <HeaderInstructor />
      <Breadcrumb title="Modifier le cours" />
      <ToastContainer />

      <section className="add-course-section py-120 position-relative overflow-hidden">
        <div className="container">
          <div className="section-heading text-center mb-50">
            <div className="flex-align d-inline-flex gap-8 mb-16" data-aos="fade-down">
              <span className="text-main-600 text-2xl d-flex">
                <i className="ph-bold ph-pencil-circle"></i>
              </span>
              <h5 className="text-main-600 mb-0">Modifier le cours</h5>
            </div>
            <h2 className="mb-24" data-aos="fade-up">Modifiez votre cours</h2>
            <p data-aos="fade-up" data-aos-delay="100" className="text-neutral-500 max-w-800 mx-auto">
              Modifiez les détails de votre cours pour le rendre encore meilleur.
            </p>
          </div>

          <div className="row justify-content-center">
            <div className="col-xl-10">
              <div className="card border-0 shadow-lg rounded-24 p-sm-50 p-20 bg-white position-relative overflow-hidden" data-aos="zoom-in" data-aos-delay="200">
                <form onSubmit={handleSubmit} className="needs-validation position-relative">
                  <div className="row g-32">
                    {/* Course Title */}
                    <div className="col-md-12">
                      <div className="form-group hover-border-main" data-aos="fade-up" data-aos-delay="300">
                        <label className="form-label fw-semibold mb-16">
                          <i className="ph-bold ph-book-open me-2 text-main-600"></i>
                          Titre du cours *
                        </label>
                        <input
                          type="text"
                          className="form-control bg-main-25 border-2 border-neutral-30 rounded-pill py-16 px-24 transition-all hover-border-main focus-border-main"
                          value={formData.title}
                          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                          required
                          placeholder="Entrez le titre du cours"
                        />
                      </div>
                    </div>

                    {/* Course Description */}
                    <div className="col-md-12">
                      <div className="form-group hover-border-main" data-aos="fade-up" data-aos-delay="400">
                        <label className="form-label fw-semibold mb-16">
                          <i className="ph-bold ph-text-align-left me-2 text-main-600"></i>
                          Description du cours *
                        </label>
                        <textarea
                          className="form-control bg-main-25 border-2 border-neutral-30 rounded-16 py-16 px-24 transition-all hover-border-main focus-border-main"
                          rows="5"
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          required
                          placeholder="Décrivez le contenu de votre cours"
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
                          Prix (DT) *
                        </label>
                        <input
                          type="number"
                          className="form-control bg-main-25 border-2 border-neutral-30 rounded-pill py-16 px-24 transition-all hover-border-main focus-border-main"
                          value={formData.price}
                          onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                          required
                          min="0"
                          step="0.01"
                          placeholder="Définissez le prix du cours"
                        />
                      </div>
                    </div>

                    {/* Duration */}
                    <div className="col-md-6">
                      <div className="form-group hover-border-main" data-aos="fade-up" data-aos-delay="900">
                        <label className="form-label fw-semibold mb-16">
                          <i className="ph-bold ph-clock me-2 text-main-600"></i>
                          Durée (heures) *
                        </label>
                        <input
                          type="number"
                          className="form-control bg-main-25 border-2 border-neutral-30 rounded-pill py-16 px-24 transition-all hover-border-main focus-border-main"
                          value={formData.duration}
                          onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                          required
                          min="1"
                          placeholder="Spécifiez la durée du cours"
                        />
                      </div>
                    </div>

                    {/* Course Image */}
                    <div className="col-md-12">
                      <div className="form-group hover-border-main" data-aos="fade-up" data-aos-delay="1000">
                        <label className="form-label fw-semibold mb-16">
                          <i className="ph-bold ph-image me-2 text-main-600"></i>
                          Image du cours *
                        </label>
                        <div className="d-flex align-items-center gap-4">
                          {formData.image && (
                            <div className="position-relative" style={{ width: '120px', height: '120px' }}>
                              <img
                                src={formData.image}
                                alt="Aperçu du cours"
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
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      setFormData(prev => ({ ...prev, image: reader.result }));
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                                accept="image/*"
                              />
                            </div>
                            <small className="text-muted d-block mt-3">
                              <i className="ph-bold ph-info me-1"></i>
                              Taille maximale: 5MB. Taille recommandée: 600x400px
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
                              Modification en cours...
                            </>
                          ) : (
                            <>
                              <i className="ph-bold ph-check-circle me-2"></i>
                              Enregistrer les modifications
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

export default EditCourse; 