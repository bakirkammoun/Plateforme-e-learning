import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Breadcrumb from '../../components/Breadcrumb';

interface Instructor {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  specialization?: string;
}

interface Category {
  _id: string;
  name: string;
  parentCategory?: string;
}

interface FormationFormData {
  title: string;
  description: string;
  category: string;
  level: string;
  duration: number;
  price: number;
  image: string;
  instructorId: string;
}

const FormationForm = () => {
  const navigate = useNavigate();
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [mainCategories, setMainCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [selectedMainCategoryId, setSelectedMainCategoryId] = useState('');
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState('');
  const [formData, setFormData] = useState<FormationFormData>({
    title: '',
    description: '',
    category: 'Langues',
    level: 'Débutant',
    duration: 0,
    price: 0,
    image: '',
    instructorId: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [filteredInstructors, setFilteredInstructors] = useState<Instructor[]>([]);

  const levels = [
    { value: 'Débutant', label: 'Débutant' },
    { value: 'Intermédiaire', label: 'Intermédiaire' },
    { value: 'Avancé', label: 'Avancé' }
  ];

  useEffect(() => {
    fetchInstructors();
    fetchCategories();
  }, []);

  const fetchInstructors = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/users');
      if (!response.ok) throw new Error('Erreur lors de la récupération des instructeurs');
      const data = await response.json();
      const instructorsList = data.filter((user: any) => user.role === 'instructor')
        .map((instructor: any) => ({
          _id: instructor._id,
          firstName: instructor.firstName,
          lastName: instructor.lastName,
          email: instructor.email,
          specialization: instructor.specialization
        }));
      setInstructors(instructorsList);
      if (instructorsList.length > 0) {
        setFormData(prev => ({ ...prev, instructorId: instructorsList[0]._id }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/categories');
      if (!response.ok) throw new Error('Erreur lors de la récupération des catégories');
      const data = await response.json();
      setCategories(Array.isArray(data) ? data : []);
      const mains = (Array.isArray(data) ? data : []).filter((cat: Category) => !cat.parentCategory);
      setMainCategories(mains);
      if (mains.length > 0) setSelectedMainCategoryId(mains[0]._id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    }
  };

  useEffect(() => {
    if (selectedMainCategoryId) {
      const subs = categories.filter(cat => cat.parentCategory === selectedMainCategoryId);
      setSubCategories(subs);
      setSelectedSubCategoryId('');
      if (subs.length === 0) {
        const mainCat = mainCategories.find(cat => cat._id === selectedMainCategoryId);
        setFormData(prev => ({ ...prev, category: mainCat ? mainCat.name : '' }));
      }
    } else {
      setSubCategories([]);
      setSelectedSubCategoryId('');
      setFormData(prev => ({ ...prev, category: '' }));
    }
  }, [selectedMainCategoryId, categories, mainCategories]);

  useEffect(() => {
    if (selectedSubCategoryId) {
      const subCat = subCategories.find(cat => cat._id === selectedSubCategoryId);
      if (subCat) {
        const matchingInstructors = instructors.filter(instructor => 
          instructor.specialization === subCat.name
        );
        setFilteredInstructors(matchingInstructors);
        if (matchingInstructors.length > 0) {
          setFormData(prev => ({ ...prev, instructorId: matchingInstructors[0]._id }));
        } else {
          setFormData(prev => ({ ...prev, instructorId: '' }));
        }
        setFormData(prev => ({ ...prev, category: subCat.name }));
      }
    } else {
      setFilteredInstructors([]);
      setFormData(prev => ({ ...prev, instructorId: '', category: '' }));
    }
  }, [selectedSubCategoryId, instructors, subCategories]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  const handleImageUpload = async (): Promise<string> => {
    if (!selectedImage) return '';

    const formData = new FormData();
    formData.append('image', selectedImage);

    try {
      const response = await fetch('http://localhost:5000/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Erreur lors de l\'upload de l\'image');
      const data = await response.json();
      return data.url;
    } catch (err) {
      throw new Error('Erreur lors de l\'upload de l\'image');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // Upload de l'image
      const imageUrl = await handleImageUpload();
      if (!imageUrl) {
        setError('L\'upload de l\'image est obligatoire');
        return;
      }

      // Déterminer la catégorie principale en fonction de la sous-catégorie
      const subCat = subCategories.find(cat => cat._id === selectedSubCategoryId);
      let mainCategory = 'Langues';
      if (subCat) {
        if (subCat.name.includes('Développement') || subCat.name.includes('Intelligence') || 
            subCat.name.includes('Graphique') || subCat.name.includes('Bureautique')) {
          mainCategory = 'Informatique';
        } else if (subCat.name.includes('Concours') || subCat.name.includes('Formation')) {
          mainCategory = 'Concours et Formation Scolaire';
        }
      }

      // Création de la formation avec les données formatées
      const formationData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: mainCategory,
        level: formData.level.trim(),
        duration: parseInt(formData.duration.toString(), 10),
        price: parseFloat(formData.price.toString()),
        image: imageUrl,
        instructorId: formData.instructorId.trim(),
        videos: []
      };

      // Debug: Afficher les valeurs des champs
      console.log('Formation Data:', formationData);

      // Vérification des données avant l'envoi
      const missingFields = [];
      if (!formationData.title) missingFields.push('titre');
      if (!formationData.description) missingFields.push('description');
      if (!formationData.category) missingFields.push('catégorie');
      if (!formationData.level) missingFields.push('niveau');
      if (!formationData.duration || isNaN(formationData.duration)) missingFields.push('durée');
      if (!formationData.price || isNaN(formationData.price)) missingFields.push('prix');
      if (!formationData.instructorId) missingFields.push('instructeur');
      if (!formationData.image) missingFields.push('image');

      // Vérification des valeurs valides
      if (!levels.some(l => l.value === formationData.level)) {
        setError('Le niveau sélectionné n\'est pas valide');
        return;
      }

      if (missingFields.length > 0) {
        setError(`Champs manquants ou invalides: ${missingFields.join(', ')}`);
        return;
      }

      const response = await fetch('http://localhost:5000/api/formations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formationData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erreur serveur:', errorData);
        throw new Error(errorData.message || 'Erreur lors de la création de la formation');
      }

      navigate('/formations');
    } catch (err) {
      console.error('Erreur lors de la soumission:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de la création de la formation');
    }
  };

  return (
    <>
      <Breadcrumb pageName="Ajouter une formation" />

      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
          <h3 className="font-medium text-black dark:text-white">
            Informations de la formation
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6.5">
          {error && (
            <div className="mb-4 rounded-lg bg-danger-500 bg-opacity-10 px-4 py-3 text-sm text-danger-500">
              {error}
            </div>
          )}

          <div className="mb-4.5 flex flex-col gap-6">
            <div>
              <label className="mb-2.5 block text-black dark:text-white">
                Titre <span className="text-meta-1">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Titre de la formation"
                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                required
              />
            </div>

            <div>
              <label className="mb-2.5 block text-black dark:text-white">
                Description <span className="text-meta-1">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={6}
                placeholder="Description de la formation"
                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                required
              />
            </div>

            <div className="flex flex-col gap-5.5 sm:flex-row">
              <div className="w-full sm:w-1/2">
                <label className="mb-2.5 block text-black dark:text-white">Catégorie parente</label>
                <select
                  value={selectedMainCategoryId}
                  onChange={e => setSelectedMainCategoryId(e.target.value)}
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                  required
                >
                  <option value="">Sélectionnez une grande catégorie</option>
                  {mainCategories.map((cat) => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              {subCategories.length > 0 && (
                <div className="w-full sm:w-1/2">
                  <label className="mb-2.5 block text-black dark:text-white">Nom de la catégorie *</label>
                  <select
                    value={selectedSubCategoryId}
                    onChange={e => setSelectedSubCategoryId(e.target.value)}
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                    required
                  >
                    <option value="">Sélectionnez une sous-catégorie</option>
                    {subCategories.map((cat) => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              )}
              </div>

            <div className="flex flex-col gap-5.5 sm:flex-row">
              <div className="w-full sm:w-1/2">
                <label className="mb-2.5 block text-black dark:text-white">
                  Niveau <span className="text-meta-1">*</span>
                </label>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleInputChange}
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                  required
                >
                  <option value="">Sélectionnez un niveau</option>
                  {levels.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full sm:w-1/2">
                <label className="mb-2.5 block text-black dark:text-white">
                  Durée (en heures) <span className="text-meta-1">*</span>
                </label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  min="0"
                  step="0.5"
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                  required
                />
              </div>
              </div>

            <div className="flex flex-col gap-5.5 sm:flex-row">
              <div className="w-full sm:w-1/2">
                <label className="mb-2.5 block text-black dark:text-white">
                  Prix (en DT) <span className="text-meta-1">*</span>
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                  required
                />
            </div>

              <div className="w-full sm:w-1/2">
              <label className="mb-2.5 block text-black dark:text-white">
                Instructeur <span className="text-meta-1">*</span>
              </label>
              <select
                name="instructorId"
                value={formData.instructorId}
                onChange={handleInputChange}
                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                required
                disabled={!selectedSubCategoryId || filteredInstructors.length === 0}
              >
                <option value="">Sélectionnez un instructeur</option>
                {filteredInstructors.map((instructor) => (
                  <option key={instructor._id} value={instructor._id}>
                    {instructor.firstName} {instructor.lastName} - {instructor.specialization}
                  </option>
                ))}
              </select>
              {selectedSubCategoryId && filteredInstructors.length === 0 && (
                <p className="text-danger mt-2">Aucun instructeur disponible pour cette spécialisation</p>
              )}
              </div>
            </div>

            <div>
              <label className="mb-2.5 block text-black dark:text-white">
                Image de couverture <span className="text-meta-1">*</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full cursor-pointer rounded-lg border-[1.5px] border-stroke bg-transparent font-medium outline-none transition file:mr-5 file:border-collapse file:cursor-pointer file:border-0 file:border-r file:border-solid file:border-stroke file:bg-whiter file:py-3 file:px-5 file:hover:bg-primary file:hover:bg-opacity-10 focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:file:border-form-strokedark dark:file:bg-white/30 dark:file:text-white dark:focus:border-primary"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="flex w-full justify-center rounded bg-primary p-3 font-medium text-gray"
          >
            Créer la formation
          </button>
        </form>
      </div>
    </>
  );
};

export default FormationForm; 