import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Breadcrumb from '../../components/Breadcrumb';
import { toast } from 'react-toastify';

interface Event {
  _id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  location: string;
  color: string;
  image?: string;
  instructorId: string;
}

const EventEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<Event>({
    _id: '',
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    location: '',
    color: 'Primary',
    image: '',
    instructorId: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/events/${id}`);
      const eventData = response.data;
      
      console.log('Fetched event data:', eventData);
      console.log('InstructorId from server:', eventData.instructorId);
      
      // Format dates for form inputs
      setFormData({
        ...eventData,
        startDate: eventData.startDate.split('T')[0],
        endDate: eventData.endDate.split('T')[0],
        instructorId: eventData.instructorId
      });
      
      if (eventData.image) {
        setImagePreview(eventData.image);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching event details:', error);
      toast.error('Erreur lors du chargement des détails de l\'événement');
      setLoading(false);
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
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Log the current form data
      console.log('Current form data:', formData);
      console.log('InstructorId in form data:', formData.instructorId);
      
      // Créer un objet JSON au lieu d'un FormData pour les données non-fichier
      const eventData = {
        title: formData.title,
        description: formData.description || '',
        color: formData.color,
        startDate: formData.startDate,
        endDate: formData.endDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        location: formData.location,
        instructorId: formData.instructorId // Ensure instructorId is included
      };

      // Log the data being sent
      console.log('Sending data to server:', eventData);
      console.log('InstructorId being sent:', eventData.instructorId);

      // Si une image est sélectionnée, utiliser FormData
      if (imageFile) {
        const formDataToSend = new FormData();
        
        // Ajouter tous les champs au FormData
        Object.keys(eventData).forEach(key => {
          formDataToSend.append(key, eventData[key as keyof typeof eventData]?.toString() || '');
          console.log(`Adding to FormData: ${key} = ${eventData[key as keyof typeof eventData]?.toString() || ''}`);
        });
        
        // Ajouter l'image
        formDataToSend.append('image', imageFile);
        
        // Envoyer avec FormData
        const response = await axios.put(`http://localhost:5000/api/events/${id}`, formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        console.log('Server response:', response.data);
      } else {
        // Sinon, envoyer comme JSON
        const response = await axios.put(`http://localhost:5000/api/events/${id}`, eventData);
        console.log('Server response:', response.data);
      }

      toast.success('Événement mis à jour avec succès');
      navigate(`/events/${id}`);
    } catch (error: any) {
      console.error('Error updating event:', error);
      
      // Log more detailed error information
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
      }
      
      toast.error(`Erreur lors de la mise à jour de l'événement: ${error.response?.data?.message || error.message}`);
    } finally {
      setSubmitting(false);
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
      <Breadcrumb pageName="Modifier l'événement" />

      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
          <h3 className="font-medium text-black dark:text-white">
            Informations de l'événement
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6.5">
          <div className="mb-4.5">
            <label className="mb-2.5 block text-black dark:text-white">
              Image de l'événement
            </label>
            <div className="relative">
              {imagePreview && (
                <div className="mb-4 relative w-full h-48 rounded-lg overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="Event preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
              />
            </div>
          </div>

          <div className="mb-4.5">
            <label className="mb-2.5 block text-black dark:text-white">
              Titre <span className="text-meta-1">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Titre de l'événement"
              required
              className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
            />
          </div>

          <div className="mb-4.5">
            <label className="mb-2.5 block text-black dark:text-white">
              Description <span className="text-meta-1">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              placeholder="Description de l'événement"
              required
              className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
            />
          </div>

          <div className="mb-4.5 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2.5 block text-black dark:text-white">
                Date de début <span className="text-meta-1">*</span>
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                required
                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
              />
            </div>

            <div>
              <label className="mb-2.5 block text-black dark:text-white">
                Heure de début <span className="text-meta-1">*</span>
              </label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                required
                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
              />
            </div>

            <div>
              <label className="mb-2.5 block text-black dark:text-white">
                Date de fin <span className="text-meta-1">*</span>
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                required
                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
              />
            </div>

            <div>
              <label className="mb-2.5 block text-black dark:text-white">
                Heure de fin <span className="text-meta-1">*</span>
              </label>
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                required
                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
              />
            </div>
          </div>

          <div className="mb-4.5">
            <label className="mb-2.5 block text-black dark:text-white">
              Lieu <span className="text-meta-1">*</span>
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="Lieu de l'événement"
              required
              className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
            />
          </div>

          <div className="mb-4.5">
            <label className="mb-2.5 block text-black dark:text-white">
              Priorité <span className="text-meta-1">*</span>
            </label>
            <select
              name="color"
              value={formData.color}
              onChange={handleInputChange}
              required
              className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
            >
              <option value="Danger">High Priority (Urgent)</option>
              <option value="Warning">Medium Priority (Important)</option>
              <option value="Primary">Low Priority (Optional)</option>
              <option value="Success">Informational</option>
            </select>
          </div>

          {/* Hidden input to store instructorId */}
          <input 
            type="hidden" 
            name="instructorId" 
            value={formData.instructorId} 
          />

          <div className="flex flex-wrap gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-md bg-primary py-3 px-6 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
            >
              {submitting ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  Enregistrement...
                </>
              ) : (
                <>
                  <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Enregistrer les modifications
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate(`/events/${id}`)}
              className="inline-flex items-center justify-center rounded-md border border-stroke py-3 px-6 text-center font-medium text-black hover:bg-gray-100 dark:border-strokedark dark:text-white dark:hover:bg-meta-4 lg:px-8 xl:px-10"
            >
              <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Annuler
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default EventEdit; 