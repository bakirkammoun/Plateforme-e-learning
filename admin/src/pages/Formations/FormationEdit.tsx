import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Breadcrumb from '../../components/Breadcrumb';

interface Instructor {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
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

const FormationEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [instructors, setInstructors] = useState<Instructor[]>([]);
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFormation();
    fetchInstructors();
  }, [id]);

  const fetchFormation = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/formations/${id}`);
      if (!response.ok) throw new Error('Erreur lors de la récupération de la formation');
      const data = await response.json();
      setFormData({
        title: data.title,
        description: data.description,
        category: data.category,
        level: data.level,
        duration: data.duration,
        price: data.price,
        image: data.image,
        instructorId: data.instructorId?._id || '',
      });
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setLoading(false);
    }
  };

  const fetchInstructors = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/users');
      if (!response.ok) throw new Error('Erreur lors de la récupération des instructeurs');
      const data = await response.json();
      const instructorsList = data.filter((user: any) => user.role === 'instructor');
      setInstructors(instructorsList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    }
  };

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
    if (!selectedImage) return formData.image;

    const formDataImg = new FormData();
    formDataImg.append('image', selectedImage);

    try {
      const response = await fetch('http://localhost:5000/api/upload/image', {
        method: 'POST',
        body: formDataImg,
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
      const imageUrl = selectedImage ? await handleImageUpload() : formData.image;

      const formationData = {
        ...formData,
        image: imageUrl,
      };

      const response = await fetch(`http://localhost:5000/api/formations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formationData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la mise à jour de la formation');
      }

      navigate('/formations');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <>
      <Breadcrumb pageName="Modifier la formation" />

      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
          <h3 className="font-medium text-black dark:text-white">
            Modifier les informations de la formation
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
                <label className="mb-2.5 block text-black dark:text-white">
                  Catégorie <span className="text-meta-1">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                  required
                >
                  <option value="Langues">Langues</option>
                  <option value="Informatique">Informatique</option>
                  <option value="Concours et Formation Scolaire">Concours et Formation Scolaire</option>
                </select>
              </div>

              <div className="w-full sm:w-1/2">
                <label className="mb-2.5 block text-black dark:text-white">
                  {formData.category === 'Langues' ? 'Niveau' : 'Type'} <span className="text-meta-1">*</span>
                </label>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleInputChange}
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                  required
                >
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

            <div className="flex flex-col gap-5.5 sm:flex-row">
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

              <div className="w-full sm:w-1/2">
                <label className="mb-2.5 block text-black dark:text-white">
                  Prix (DT) <span className="text-meta-1">*</span>
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
            </div>

            <div>
              <label className="mb-2.5 block text-black dark:text-white">
                Instructeur <span className="text-meta-1">*</span>
              </label>
              <select
                name="instructorId"
                value={formData.instructorId}
                onChange={handleInputChange}
                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                required
              >
                <option value="">Sélectionnez un instructeur</option>
                {instructors.map((instructor) => (
                  <option key={instructor._id} value={instructor._id}>
                    {instructor.firstName} {instructor.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2.5 block text-black dark:text-white">
                Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full cursor-pointer rounded border-[1.5px] border-stroke bg-transparent font-medium outline-none transition file:mr-5 file:border-collapse file:cursor-pointer file:border-0 file:border-r file:border-solid file:border-stroke file:bg-whiter file:py-3 file:px-5 file:hover:bg-primary file:hover:bg-opacity-10 focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:file:border-form-strokedark dark:file:bg-white/30 dark:file:text-white dark:focus:border-primary"
              />
              {formData.image && !selectedImage && (
                <div className="mt-2">
                  <img
                    src={formData.image}
                    alt="Current formation"
                    className="h-32 w-auto object-cover rounded"
                  />
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="flex w-full justify-center rounded bg-primary p-3 font-medium text-gray hover:bg-opacity-90"
          >
            Mettre à jour la formation
          </button>
        </form>
      </div>
    </>
  );
};

export default FormationEdit;
