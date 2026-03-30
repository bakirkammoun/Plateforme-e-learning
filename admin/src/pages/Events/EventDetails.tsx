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
}

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/events/${id}`);
      setEvent(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching event details:', error);
      toast.error('Erreur lors du chargement des détails de l\'événement');
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
      try {
        await axios.delete(`http://localhost:5000/api/events/${id}`);
        toast.success('Événement supprimé avec succès');
        navigate('/events');
      } catch (error) {
        console.error('Error deleting event:', error);
        toast.error('Erreur lors de la suppression de l\'événement');
      }
    }
  };

  const formatDateTime = (date: string, time: string) => {
    const dateObj = new Date(`${date}T${time}`);
    return dateObj.toLocaleString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (color: string) => {
    const colorMap: { [key: string]: { bg: string; text: string; border: string } } = {
      Danger: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
      Success: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
      Primary: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
      Warning: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-200' }
    };
    return colorMap[color] || { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' };
  };

  const getColorLabel = (color: string) => {
    const colorLabels: { [key: string]: string } = {
      Danger: 'Urgent',
      Success: 'Confirmé',
      Primary: 'En cours',
      Warning: 'En attente'
    };
    return colorLabels[color] || color;
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg text-gray-500">Événement non trouvé</p>
      </div>
    );
  }

  const { bg, text, border } = getStatusColor(event.color);

  return (
    <>
      <Breadcrumb pageName="Détails de l'événement" />

      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="relative h-64 md:h-80 lg:h-96 w-full overflow-hidden">
          <img
            src={event.image || '/img/event-default.jpg'}
            alt={event.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <span className={`absolute top-6 right-6 rounded-lg ${bg} ${text} ${border} px-4 py-2 text-sm font-semibold shadow-sm`}>
            {getColorLabel(event.color)}
          </span>
        </div>

        <div className="p-6 md:p-8 lg:p-10">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-black dark:text-white mb-4">
              {event.title}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              {event.description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div className="flex items-center">
                <svg className="w-6 h-6 text-primary mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Début</p>
                  <p className="text-base font-medium text-black dark:text-white">
                    {formatDateTime(event.startDate, event.startTime)}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <svg className="w-6 h-6 text-primary mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Fin</p>
                  <p className="text-base font-medium text-black dark:text-white">
                    {formatDateTime(event.endDate, event.endTime)}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center">
                <svg className="w-6 h-6 text-primary mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Lieu</p>
                  <p className="text-base font-medium text-black dark:text-white">
                    {event.location}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mt-8">
            <button
              onClick={() => navigate(`/events/${id}/edit`)}
              className="inline-flex items-center justify-center rounded-md bg-primary py-3 px-6 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
            >
              <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Modifier l'événement
            </button>

            <button
              onClick={handleDelete}
              className="inline-flex items-center justify-center rounded-md border border-danger py-3 px-6 text-center font-medium text-danger hover:bg-danger hover:text-white lg:px-8 xl:px-10"
            >
              <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Supprimer l'événement
            </button>

            <button
              onClick={() => navigate('/events')}
              className="inline-flex items-center justify-center rounded-md border border-stroke py-3 px-6 text-center font-medium text-black hover:bg-gray-100 dark:border-strokedark dark:text-white dark:hover:bg-meta-4 lg:px-8 xl:px-10"
            >
              <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Retour à la liste
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default EventDetails; 