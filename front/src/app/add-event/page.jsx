'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Breadcrumb from "@/components/Breadcrumb";
import FooterOne from "@/components/FooterOne";
import { toast } from 'react-toastify';
import HeaderStudent from '@/components/Header';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import EventDetailsForm from '@/components/EventDetailsForm';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const AddEvent = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventImage, setEventImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventActions, setShowEventActions] = useState(false);
  const [actionPosition, setActionPosition] = useState({ x: 0, y: 0 });
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    startTime: '09:00',
    endTime: '17:00',
    location: '',
    color: 'Primary',
    maxParticipants: 0,
    isPublic: true,
    instructorId: '',
    eventDetails: {
      section1: {},
      section2: {}
    },
    image: null
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [previews, setPreviews] = useState({});
  const [dateError, setDateError] = useState(null);
  const [conflictingEvent, setConflictingEvent] = useState(null);
  const [currentUserId, setCurrentUserId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availableDates, setAvailableDates] = useState([]);
  const [suggestedDate, setSuggestedDate] = useState(null);
  const [suggestedDateText, setSuggestedDateText] = useState('');
  const [suggestedDateStatus, setSuggestedDateStatus] = useState('available');
  const [existingEventOnDate, setExistingEventOnDate] = useState(null);
  const [userEvents, setUserEvents] = useState([]);

  useEffect(() => {
    const fetchUserAndEvents = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const userStr = localStorage.getItem('user');
        
        console.log('Token from localStorage:', token);
        console.log('Raw user data from localStorage:', userStr);
        
        let user;
        try {
          user = JSON.parse(userStr);
          console.log('Parsed user data:', user);
        } catch (e) {
          console.error('Error parsing user from localStorage:', e);
          toast.error('Erreur de session utilisateur');
          router.push('/sign-in');
          return;
        }

        // Vérification plus détaillée de l'objet utilisateur
        if (!token) {
          console.log('Token missing');
          toast.error('Veuillez vous connecter pour créer des événements');
          router.push('/sign-in');
          return;
        }

        if (!user) {
          console.log('User data missing');
          toast.error('Données utilisateur manquantes');
          router.push('/sign-in');
          return;
        }

        // Vérifier toutes les possibilités d'ID
        const userId = user.id || user._id || (user.user && (user.user.id || user.user._id));
        console.log('Found user ID:', userId);

        if (!userId) {
          console.log('User ID not found in:', user);
          toast.error('ID utilisateur non trouvé');
          router.push('/sign-in');
          return;
        }

        // Mettre à jour l'ID de l'instructeur
        setCurrentUserId(userId);
        setFormData(prev => ({
          ...prev,
          instructorId: userId
        }));

        console.log('User ID set successfully:', userId);
        
        // Récupérer les événements
        await fetchEvents();

      } catch (error) {
        console.error('Erreur lors de la récupération du profil:', error);
        toast.error('Erreur lors de la récupération du profil');
      }
    };

    fetchUserAndEvents();
  }, []);

  useEffect(() => {
    const fetchUserEvents = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const user = JSON.parse(localStorage.getItem('user'));
        if (!token || !user || !user.id) return;

        const response = await axios.get(`http://localhost:5000/api/events/instructor/${user.id}`);
        setUserEvents(response.data);
      } catch (error) {
        console.error('Erreur lors de la récupération des événements de l\'enseignant:', error);
      }
    };

    fetchUserEvents();
  }, []);

  const calculateAvailableDates = (eventsList) => {
    try {
      console.log('Calcul des dates disponibles...');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setHours(23, 59, 59, 999);
      
      const allDates = [];
      const currentDate = new Date(today);
      
      while (currentDate <= nextMonth) {
        if (currentDate.getDay() !== 0 && currentDate >= today) {
          allDates.push(new Date(currentDate.getTime()));
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      console.log(`Nombre total de dates possibles: ${allDates.length}`);
      
      const available = allDates.filter(date => {
        // Vérifier si la date est déjà occupée par un événement
        return !eventsList.some(event => {
          try {
            if (!event.start || !event.end) return false;
            
            const eventStart = new Date(event.start);
            const eventEnd = new Date(event.end);
            const checkDate = new Date(date);
            
            // Normaliser les heures pour la comparaison
            eventStart.setHours(0, 0, 0, 0);
            eventEnd.setHours(23, 59, 59, 999);
            checkDate.setHours(12, 0, 0, 0);
            
            return checkDate >= eventStart && checkDate <= eventEnd;
          } catch (error) {
            console.error('Erreur lors de la comparaison des dates:', error);
            return false;
          }
        });
      });
      
      console.log(`Nombre de dates disponibles: ${available.length}`);
      setAvailableDates(available);
    } catch (error) {
      console.error('Erreur dans calculateAvailableDates:', error);
      setAvailableDates([]);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/events');
      // N'affiche que les événements non archivés dans le calendrier
      const filteredEvents = response.data.filter(event => !event.isArchived);
      const formattedEvents = filteredEvents.map(event => {
        const startDateTime = new Date(event.startDate);
        const endDateTime = new Date(event.endDate);
        startDateTime.setHours(
          parseInt(event.startTime?.split(':')[0] || '0'),
          parseInt(event.startTime?.split(':')[1] || '0')
        );
        endDateTime.setHours(
          parseInt(event.endTime?.split(':')[0] || '23'),
          parseInt(event.endTime?.split(':')[1] || '59')
        );
        return {
          id: event._id,
          title: event.title,
          start: startDateTime.toISOString(),
          end: endDateTime.toISOString(),
          color: getEventColor(event.color),
          allDay: false,
          extendedProps: {
            location: event.location,
            description: event.description,
            maxParticipants: event.maxParticipants,
            image: event.image,
            eventDetails: event.eventDetails,
            isPublic: event.isPublic,
            instructorId: event.instructorId
          }
        };
      });
      setEvents(formattedEvents);
      calculateAvailableDates(formattedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Error loading events');
    }
  };

  const getEventColor = (color) => {
    const colors = {
      Primary: '#3b82f6',
      Success: '#22c55e',
      Danger: '#ef4444',
      Warning: '#f59e0b'
    };
    return colors[color] || colors.Primary;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Mettre à jour le state avec la nouvelle valeur sans validation
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Vérifier la cohérence entre date de début et de fin
    if (name === 'startDate' && formData.endDate) {
      const startDate = new Date(value);
      const endDate = new Date(formData.endDate);
      if (startDate > endDate) {
        setDateError('La date de début doit être avant la date de fin');
      } else {
        setDateError('');
      }
    } else if (name === 'endDate' && formData.startDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(value);
      if (endDate < startDate) {
        setDateError('La date de fin doit être après la date de début');
      } else {
        setDateError('');
      }
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }));
    }
  };

  const checkDateAvailability = (date) => {
    if (!date) return { isAvailable: true };

    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    const conflict = userEvents.find(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      eventStart.setHours(0, 0, 0, 0);
      eventEnd.setHours(0, 0, 0, 0);

      return checkDate >= eventStart && checkDate <= eventEnd;
    });

    if (conflict) {
      return {
        isAvailable: false,
        conflictingEvent: {
          title: conflict.title,
          date: formatDateToFrench(new Date(conflict.startDate))
        }
      };
    }

    return { isAvailable: true };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Vérifier si l'enseignant a déjà un événement à cette date
    const { isAvailable, conflictingEvent: conflict } = checkDateAvailability(formData.startDate);
    if (!isAvailable) {
      setDateError(`Vous avez déjà un événement prévu à cette date : "${conflict.title}" (${conflict.date})`);
      setConflictingEvent(conflict);
      toast.error("Impossible de créer l'événement - Conflit de dates");
      return;
    }

    console.log('Formulaire soumis');
    
    const token = localStorage.getItem('authToken');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      toast.error("Veuillez vous connecter pour créer un événement");
      router.push('/sign-in');
      return;
    }

    // Vérifier que les champs requis sont remplis
    if (!formData.title || !formData.startDate || !formData.endDate || !formData.location) {
      console.log('Données manquantes:', {
        title: formData.title,
        startDate: formData.startDate,
        endDate: formData.endDate,
        location: formData.location
      });
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Début de la création/modification de l\'événement');
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);

      const [startHours, startMinutes] = formData.startTime.split(':');
      const [endHours, endMinutes] = formData.endTime.split(':');
      
      startDate.setHours(parseInt(startHours), parseInt(startMinutes), 0);
      endDate.setHours(parseInt(endHours), parseInt(endMinutes), 0);

      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('startDate', startDate.toISOString());
      formDataToSend.append('endDate', endDate.toISOString());
      formDataToSend.append('startTime', formData.startTime);
      formDataToSend.append('endTime', formData.endTime);
      formDataToSend.append('location', formData.location);
      formDataToSend.append('color', formData.color);
      formDataToSend.append('maxParticipants', formData.maxParticipants);
      formDataToSend.append('instructorId', currentUserId);
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      let response;
      if (isUpdating && selectedEvent) {
        // Mise à jour d'un événement existant
        console.log('Mise à jour de l\'événement:', selectedEvent.id);
        response = await axios.put(
          `http://localhost:5000/api/events/${selectedEvent.id}`,
          formDataToSend,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        toast.success('Événement mis à jour avec succès');
      } else {
        // Création d'un nouvel événement
        console.log('Création d\'un nouvel événement');
        response = await axios.post(
          'http://localhost:5000/api/events',
          formDataToSend,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );

        // Envoyer une notification aux administrateurs
        try {
          const notificationData = {
            type: 'event_added',
            message: `${userStr.firstName} ${userStr.lastName} a créé un nouvel événement : ${formData.title}`,
            recipientRole: 'admin',
            senderId: currentUserId,
            data: {
              eventId: response.data._id,
              eventTitle: formData.title,
              eventDate: formData.startDate,
              eventLocation: formData.location,
              creatorName: `${userStr.firstName} ${userStr.lastName}`
            }
          };
          
          console.log('Envoi de notification pour événement:', notificationData);
          
          const notificationResponse = await axios.post(
            'http://localhost:5000/api/notifications',
            notificationData,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          console.log('Réponse de la notification:', notificationResponse.data);
        } catch (notificationError) {
          console.error('Erreur lors de l\'envoi de la notification:', notificationError);
          console.error('Détails de l\'erreur:', {
            message: notificationError.message,
            response: notificationError.response?.data,
            status: notificationError.response?.status
          });
          // Ne pas bloquer la création de l'événement si la notification échoue
        }

        toast.success('Événement créé avec succès');
      }

      console.log('Réponse du serveur:', response.data);
      
      // Réinitialiser le formulaire et l'état
      setFormData({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        startTime: '09:00',
        endTime: '17:00',
        location: '',
        color: 'Primary',
        maxParticipants: 0,
        isPublic: true,
        instructorId: currentUserId,
        eventDetails: {
          section1: {},
          section2: {}
        },
        image: null
      });
      
      // Réinitialiser l'état de mise à jour
      setIsUpdating(false);
      setSelectedEvent(null);
      
      // Rafraîchir la liste des événements
      await fetchEvents();

    } catch (error) {
      console.error('Erreur détaillée:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        data: error.response?.config?.data,
        stack: error.stack
      });
      
      if (error.response?.data?.message) {
        toast.error(`Erreur: ${error.response.data.message}`);
      } else {
        toast.error('Une erreur est survenue lors de la création/modification de l\'événement');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEventClick = (info) => {
    // Ne rien faire lors du clic sur l'événement
  };

  const handleUpdateClick = (event) => {
    if (event) {
      console.log('Préparation de la mise à jour de l\'événement:', event.id);
      const startDate = new Date(event.start);
      const endDate = new Date(event.end);
      
      setFormData({
        title: event.title,
        description: event.extendedProps.description || '',
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        startTime: startDate.toTimeString().slice(0, 5),
        endTime: endDate.toTimeString().slice(0, 5),
        location: event.extendedProps.location || '',
        color: event.backgroundColor === '#3b82f6' ? 'Primary' :
               event.backgroundColor === '#22c55e' ? 'Success' :
               event.backgroundColor === '#ef4444' ? 'Danger' : 'Warning',
        maxParticipants: event.extendedProps.maxParticipants || 0,
        isPublic: event.extendedProps.isPublic ?? true,
        eventDetails: event.extendedProps.eventDetails || {
          section1: {},
          section2: {}
        },
        image: event.extendedProps.image || null
      });

      if (event.extendedProps.image) {
        setImagePreview(`http://localhost:5000${event.extendedProps.image}`);
      }
      
      setIsUpdating(true);
      setSelectedEvent(event);
    }
  };

  const handleDeleteEvent = async (event) => {
    if (!event) return;

    try {
      // Archiver uniquement (soft delete)
      await axios.post(`http://localhost:5000/api/events/${event.id}/archive`);
      await fetchEvents(); // Met à jour le calendrier
      if (typeof fetchArchivedEvents === 'function') {
        await fetchArchivedEvents(); // Met à jour la liste des archives si dispo
      }
      toast.success('Event archived successfully');
    } catch (error) {
      console.error('Error archiving event:', error);
      toast.error('Error archiving event');
    }
  };

  const handleUpdateEvent = async () => {
    if (!selectedEvent) return;
    setIsUpdating(true);

    try {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      
      if (endDate < startDate) {
        toast.error('End date must be after start date');
        return;
      }

      let imageUrl = selectedEvent.extendedProps.image || '';
      if (eventImage) {
        const formData = new FormData();
        formData.append('image', eventImage);
        const uploadResponse = await axios.post('http://localhost:5000/api/upload/image', formData);
        imageUrl = uploadResponse.data.url;
      }

      const eventData = {
        ...formData,
        image: imageUrl,
        startDate: formData.startDate,
        endDate: formData.endDate,
        startTime: formData.startTime || '09:00',
        endTime: formData.endTime || '17:00'
      };

      await axios.put(`http://localhost:5000/api/events/${selectedEvent.id}`, eventData);
      toast.success('Event updated successfully');
      setSelectedEvent(null);
      fetchEvents();
      setIsUpdating(false);
      setFormData({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        startTime: '09:00',
        endTime: '17:00',
        location: '',
        color: 'Primary',
        maxParticipants: 0,
        isPublic: true,
        eventDetails: {
          section1: {},
          section2: {}
        },
        image: null
      });
      setEventImage(null);
      setImagePreview('');
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error(error.response?.data?.message || 'Error updating event');
    }
  };

  const confirmDelete = async () => {
    await handleDeleteEvent(selectedEvent);
    setShowDeleteConfirm(false);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    const formattedDate = date.toISOString().split('T')[0];
    const formattedTime = '09:00';
    
    setFormData(prev => ({
      ...prev,
      startDate: formattedDate,
      startTime: formattedTime,
      endDate: formattedDate,
      endTime: '17:00'
    }));
  };

  const tileClassName = ({ date }) => {
    const dateStr = date.toISOString().split('T')[0];
    const isAvailable = availableDates.some(availableDate => 
      availableDate.toISOString().split('T')[0] === dateStr
    );
    
    return isAvailable ? 'available-date' : '';
  };

  const tileContent = ({ date }) => {
    const dateStr = date.toISOString().split('T')[0];
    const isAvailable = availableDates.some(availableDate => 
      availableDate.toISOString().split('T')[0] === dateStr
    );
    
    return isAvailable ? (
      <div className="available-badge">
        <i className="ph-bold ph-check-circle"></i>
      </div>
    ) : null;
  };

  const fetchSuggestedDate = async () => {
    try {
      console.log('Début de la récupération de la date suggérée');
      const response = await axios.get('http://localhost:5000/api/events/suggest-date');
      console.log('Réponse reçue:', response.data);
      
      if (response.data.suggestedDate) {
        const date = new Date(response.data.suggestedDate);
        setSuggestedDate(date);
        setAvailableDates(response.data.availableDates.map(date => new Date(date)));
        
        // Vérifier les événements à la date suggérée
        if (response.data.eventsOnSuggestedDate && response.data.eventsOnSuggestedDate.length > 0) {
          setSuggestedDateStatus('hasEvent');
          setExistingEventOnDate(response.data.eventsOnSuggestedDate[0]);
        } else {
          setSuggestedDateStatus('available');
          setExistingEventOnDate(null);
        }
      }
    } catch (error) {
      console.error('Erreur détaillée:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
      toast.error(error.response?.data?.message || 'Erreur lors de la récupération des suggestions');
    }
  };

  useEffect(() => {
    fetchSuggestedDate();
  }, []);

  useEffect(() => {
    if (suggestedDate) {
      const formattedDate = formatDateToFrench(suggestedDate);
      setSuggestedDateText(formattedDate);
    }
  }, [suggestedDate]);

  const formatDateToFrench = (date) => {
    if (!date) return '';
    // Ajuster la date pour le fuseau horaire local
    const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    return localDate.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateForInput = (date) => {
    if (!date) return '';
    // Ajuster la date pour le fuseau horaire local
    const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    return localDate.toISOString().split('T')[0];
  };

  const handleIconClick = () => {
    if (suggestedDate) {
      const formattedDate = formatDateToFrench(suggestedDate);
      const inputDate = formatDateForInput(suggestedDate);
      
      // Vérifier si l'enseignant a déjà un événement à cette date
      const { isAvailable, conflictingEvent: conflict } = checkDateAvailability(inputDate);
      if (!isAvailable) {
        setDateError(`Vous avez déjà un événement prévu à cette date : "${conflict.title}" (${conflict.date})`);
        setConflictingEvent(conflict);
        toast.error("Date non disponible - Conflit d'événement");
        return;
      }
      
      setDateError(null);
      setConflictingEvent(null);
      setFormData(prev => ({
        ...prev,
        startDate: inputDate,
        endDate: inputDate
      }));
      
      toast.success(`Date sélectionnée : ${formattedDate}`);
    }
  };

  return (
    <div className="wrapper">
      <HeaderStudent />
      <Breadcrumb
        title="Event Management"
        currentPage="Add Event"
        links={[
          { label: "Home", path: "/" },
          { label: "Events", path: "/events" }
        ]}
      />
      
      <section className='py-120' style={{ backgroundColor: '#F5F7FE' }}>
        <div className='container'>
          {/* Main Content Card */}
          <div className="card border-0 rounded-24 p-sm-40 p-20 bg-white shadow-sm">
            {/* Calendar Section */}
            <div className="mb-5">
                <h4 className="card-title mb-30 d-flex align-items-center">
                  <i className="ph ph-calendar me-2 text-main-600"></i>
                  Event Calendar
                </h4>
                <div className="calendar-container">
                  <div className="calendar-note">
                    <i 
                      className={`ph ${suggestedDateStatus === 'available' ? 'ph-calendar-check text-success' : 'ph-calendar-x text-warning'}`}
                      onClick={handleIconClick}
                      style={{ cursor: 'pointer' }}
                      title="Cliquez pour sélectionner cette date"
                    ></i>
                    <div>
                      <p className="mb-0 fw-bold">Suggestion de date optimale :</p>
                      {suggestedDateText ? (
                        <>
                          <p className="mb-0">{suggestedDateText}</p>
                          {suggestedDateStatus === 'hasEvent' && existingEventOnDate && (
                            <div className="mt-2 text-warning">
                              <small>
                                <i className="ph ph-warning me-1"></i>
                                Il existe déjà un événement à cette date : "{existingEventOnDate.title}"
                              </small>
                            </div>
                          )}
                          {suggestedDateStatus === 'available' && (
                            <div className="mt-2 text-success">
                              <small>
                                <i className="ph ph-check-circle me-1"></i>
                                Cette date est parfaitement disponible pour votre événement
                                <span className="ms-2 text-muted">(Cliquez sur l'icône pour sélectionner)</span>
                              </small>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="mb-0">Chargement des suggestions...</p>
                      )}
                      <div className="d-flex align-items-center gap-2 mt-2">
                        <button 
                          className="btn btn-sm btn-link text-main-600 p-0"
                          onClick={fetchSuggestedDate}
                        >
                          <i className="ph ph-arrows-clockwise me-1"></i>
                          Trouver une autre date
                        </button>
                      </div>
                    </div>
                  </div>
                  <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    headerToolbar={{
                      left: 'prev,next today',
                      center: 'title',
                      right: 'dayGridMonth,timeGridWeek,timeGridDay'
                    }}
                    height={700}
                    events={events}
                    editable={false}
                    selectable={true}
                    selectMirror={true}
                    dayMaxEvents={3}
                    weekends={true}
                    locale="fr"
                    eventClick={handleEventClick}
                    eventContent={(eventInfo) => {
                      // Récupérer l'ID de l'utilisateur connecté
                      const currentUser = JSON.parse(localStorage.getItem('user'));
                      const userId = currentUser?.id || currentUser?._id || currentUser?.user?.id || currentUser?.user?._id;
                      const isOwner = eventInfo.event.extendedProps.instructorId === userId;

                      return (
                      <div className="d-flex align-items-center justify-content-between w-100">
                        <span className="event-title">{eventInfo.event.title}</span>
                          {isOwner && (
                        <div className="event-actions d-flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateClick(eventInfo.event);
                            }}
                            className="btn btn-sm btn-link text-white p-0"
                          >
                            <i className="ph ph-pencil"></i>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDeleteConfirm(true);
                              setSelectedEvent(eventInfo.event);
                            }}
                            className="btn btn-sm btn-link text-white p-0"
                          >
                            <i className="ph ph-trash"></i>
                          </button>
                      </div>
                    )}
                        </div>
                      );
                    }}
                    buttonText={{
                      today: 'Today',
                      month: 'Month',
                      week: 'Week',
                      day: 'Day'
                    }}
                  />
              </div>
            </div>

            {/* Event Form Section */}
            <div className="mt-5">
              <div className="d-flex justify-content-between align-items-center mb-30">
                <h4 className="card-title d-flex align-items-center m-0">
                  <i className={`ph ${isUpdating ? 'ph-pencil' : 'ph-plus'} me-2 text-main-600`}></i>
                  {isUpdating ? 'Update Event' : 'New Event'}
                </h4>
              </div>
              
                <form onSubmit={handleSubmit} className="needs-validation">
                  <div className="row g-32">
                    {dateError && (
                      <div className="col-12">
                        <div className="alert alert-danger d-flex align-items-center" role="alert">
                          <i className="ph ph-warning-circle me-2 fs-4"></i>
                          <div>
                            <strong>Conflit d'événement :</strong>
                            <p className="mb-0">{dateError}</p>
                            {conflictingEvent && (
                              <small className="d-block mt-1 text-danger-emphasis">
                                Veuillez choisir une autre date ou modifier l'événement existant.
                              </small>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                  {/* Title with icon */}
                  <div className="col-md-12">
                    <div className="form-group hover-border-main">
                        <label className="form-label fw-semibold mb-16">
                          <i className="ph ph-text-t me-2 text-main-600"></i>
                        Event Title
                        </label>
                        <input
                          type="text"
                          name="title"
                          required
                          value={formData.title}
                          onChange={handleInputChange}
                          placeholder="Enter event title"
                        className="form-control bg-main-25 border-2 border-neutral-30 rounded-pill py-16 px-24"
                        />
                      </div>
                    </div>

                  {/* Event Image */}
                  <div className="col-md-12">
                    <div className="form-group hover-border-main">
                      <label className="form-label fw-semibold mb-16">
                        <i className="ph ph-image me-2 text-main-600"></i>
                        Event Image
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="form-control bg-main-25 border-2 border-neutral-30 rounded-pill py-16 px-24"
                      />
                    </div>
                  </div>

                  {/* Description with icon */}
                  <div className="col-md-12">
                    <div className="form-group hover-border-main">
                        <label className="form-label fw-semibold mb-16">
                          <i className="ph ph-text-align-left me-2 text-main-600"></i>
                          Description
                        </label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          rows={3}
                          placeholder="Describe your event"
                        className="form-control bg-main-25 border-2 border-neutral-30 rounded-16 py-16 px-24"
                        ></textarea>
                      </div>
                    </div>

                  {/* Dates and Times with icons */}
                  <div className="col-md-3">
                    <div className="form-group hover-border-main">
                        <label className="form-label fw-semibold mb-16">
                          <i className="ph ph-calendar me-2 text-main-600"></i>
                        Start Date
                        </label>
                        <input
                          type="date"
                          name="startDate"
                          required
                          value={formData.startDate}
                          onChange={handleInputChange}
                        className="form-control bg-main-25 border-2 border-neutral-30 rounded-pill py-16 px-24"
                        />
                      </div>
                    </div>

                  <div className="col-md-3">
                    <div className="form-group hover-border-main">
                        <label className="form-label fw-semibold mb-16">
                          <i className="ph ph-clock me-2 text-main-600"></i>
                          Start Time
                        </label>
                        <input
                          type="time"
                          name="startTime"
                          value={formData.startTime}
                          onChange={handleInputChange}
                        className="form-control bg-main-25 border-2 border-neutral-30 rounded-pill py-16 px-24"
                        />
                      </div>
                    </div>

                  <div className="col-md-3">
                    <div className="form-group hover-border-main">
                        <label className="form-label fw-semibold mb-16">
                          <i className="ph ph-calendar me-2 text-main-600"></i>
                        End Date
                        </label>
                        <input
                          type="date"
                          name="endDate"
                          required
                          value={formData.endDate}
                          onChange={handleInputChange}
                        className="form-control bg-main-25 border-2 border-neutral-30 rounded-pill py-16 px-24"
                        />
                      </div>
                    </div>

                  <div className="col-md-3">
                    <div className="form-group hover-border-main">
                        <label className="form-label fw-semibold mb-16">
                          <i className="ph ph-clock me-2 text-main-600"></i>
                          End Time
                        </label>
                        <input
                          type="time"
                          name="endTime"
                          value={formData.endTime}
                          onChange={handleInputChange}
                        className="form-control bg-main-25 border-2 border-neutral-30 rounded-pill py-16 px-24"
                        />
                      </div>
                    </div>

                  {/* Location and Color with icons */}
                    <div className="col-md-6">
                    <div className="form-group hover-border-main">
                        <label className="form-label fw-semibold mb-16">
                          <i className="ph ph-map-pin me-2 text-main-600"></i>
                          Location
                        </label>
                        <input
                          type="text"
                          name="location"
                          value={formData.location}
                          onChange={handleInputChange}
                          placeholder="Event location"
                        className="form-control bg-main-25 border-2 border-neutral-30 rounded-pill py-16 px-24"
                        />
                      </div>
                    </div>

                  <div className="col-md-3">
                    <div className="form-group hover-border-main">
                        <label className="form-label fw-semibold mb-16">
                          <i className="ph ph-palette me-2 text-main-600"></i>
                          Event Color
                        </label>
                        <select
                          name="color"
                          value={formData.color}
                          onChange={handleInputChange}
                          className="form-select bg-main-25 border-2 border-neutral-30 rounded-pill py-16 px-24"
                        >
                          <option value="Primary">🎯 Primary</option>
                          <option value="Success">✅ Success</option>
                          <option value="Danger">⚠️ Danger</option>
                          <option value="Warning">📅 Warning</option>
                        </select>
                      </div>
                    </div>

                  <div className="col-md-3">
                    <div className="form-group hover-border-main">
                        <label className="form-label fw-semibold mb-16">
                          <i className="ph ph-users me-2 text-main-600"></i>
                          Maximum Participants
                        </label>
                        <input
                          type="number"
                          name="maxParticipants"
                          value={formData.maxParticipants}
                          onChange={handleInputChange}
                          min="0"
                          placeholder="Unlimited if 0"
                        className="form-control bg-main-25 border-2 border-neutral-30 rounded-pill py-16 px-24"
                        />
                      </div>
                    </div>

                  {/* Submit and Additional Details Buttons */}
                  <div className="col-12 d-flex justify-content-between align-items-center mt-40">
                        <button
                          type="button"
                      className="btn btn-main rounded-pill px-32 py-16 hover-transform-sm"
                          onClick={() => setShowEventDetails(!showEventDetails)}
                        >
                      <i className="ph ph-info me-2"></i>
                      Additional Details
                        </button>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        onClick={(e) => {
                          console.log('Bouton cliqué');
                          handleSubmit(e);
                        }}
                      className="btn btn-main rounded-pill px-50 py-16 hover-transform-sm"
                      >
                          {isSubmitting ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              {isUpdating ? 'Updating Event...' : 'Creating Event...'}
                            </>
                          ) : (
                            <>
                              <i className="ph ph-check-circle me-2"></i>
                              {isUpdating ? 'Update Event' : 'Create Event'}
                            </>
                          )}
                      </button>
                    </div>

                  {/* Additional Details Form - Toggleable */}
                  {showEventDetails && (
                    <div className="col-12">
                      <div className="card border-0 rounded-16 p-32 bg-white shadow-sm">
                        <div className="mb-24">
                          <h5 className="card-title d-flex align-items-center m-0 text-main-600">
                            <i className="ph ph-info me-2"></i>
                            Additional Details
                          </h5>
                  </div>
                        
                        <div className="row g-32">
                          {/* Event Video */}
                          <div className="col-12">
                            <div className="form-group hover-border-main">
                              <label className="form-label fw-semibold mb-16">
                                <i className="ph ph-video-camera me-2 text-main-600"></i>
                                Event Video
                              </label>
                              <div className="file-upload-wrapper">
                                <input
                                  type="file"
                                  accept="video/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      setFormData(prev => ({
                                        ...prev,
                                        eventDetails: {
                                          ...prev.eventDetails,
                                          eventVideo: file
                                        }
                                      }));
                                    }
                                  }}
                                  className="form-control bg-main-25 border-2 border-neutral-30 rounded-pill py-16 px-24"
                                />
              </div>
                            </div>
                          </div>

                          {/* Section 1 */}
                          <div className="col-12">
                            <div className="card border bg-main-25 rounded-16 p-24">
                              <h6 className="card-title d-flex align-items-center mb-24">
                                <i className="ph ph-number-circle-one me-2 text-main-600"></i>
                                Section 1
                              </h6>
                              <div className="row g-24">
                                <div className="col-12">
                                  <div className="form-group hover-border-main">
                                    <label className="form-label fw-semibold mb-16">
                                      <i className="ph ph-image me-2 text-main-600"></i>
                                      Image
                                    </label>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          setFormData(prev => ({
                                            ...prev,
                                            eventDetails: {
                                              ...prev.eventDetails,
                                              section1: {
                                                ...prev.eventDetails.section1,
                                                image1: file
                                              }
                                            }
                                          }));
                                          setPreviews(prev => ({
                                            ...prev,
                                            image1: URL.createObjectURL(file)
                                          }));
                                        }
                                      }}
                                      className="form-control bg-white border-2 border-neutral-30 rounded-pill py-16 px-24"
                                    />
                                  </div>
                                </div>
                                <div className="col-12">
                                  <div className="form-group hover-border-main">
                                    <label className="form-label fw-semibold mb-16">
                                      <i className="ph ph-text-t me-2 text-main-600"></i>
                                      Title
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="Enter section title"
                                      value={formData.eventDetails.section1.title1 || ''}
                                      onChange={(e) => {
                                        setFormData(prev => ({
                                          ...prev,
                                          eventDetails: {
                                            ...prev.eventDetails,
                                            section1: {
                                              ...prev.eventDetails.section1,
                                              title1: e.target.value
                                            }
                                          }
                                        }));
                                      }}
                                      className="form-control bg-white border-2 border-neutral-30 rounded-pill py-16 px-24"
                                    />
                                  </div>
                                </div>
                                <div className="col-12">
                                  <div className="form-group hover-border-main">
                                    <label className="form-label fw-semibold mb-16">
                                      <i className="ph ph-text-align-left me-2 text-main-600"></i>
                                      Content
                                    </label>
                                    <textarea
                                      placeholder="Enter section content"
                                      value={formData.eventDetails.section1.paragraph1 || ''}
                                      onChange={(e) => {
                                        setFormData(prev => ({
                                          ...prev,
                                          eventDetails: {
                                            ...prev.eventDetails,
                                            section1: {
                                              ...prev.eventDetails.section1,
                                              paragraph1: e.target.value
                                            }
                                          }
                                        }));
                                      }}
                                      rows={4}
                                      className="form-control bg-white border-2 border-neutral-30 rounded-16 py-16 px-24"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Section 2 */}
                          <div className="col-12">
                            <div className="card border bg-main-25 rounded-16 p-24">
                              <h6 className="card-title d-flex align-items-center mb-24">
                                <i className="ph ph-number-circle-two me-2 text-main-600"></i>
                                Section 2
                              </h6>
                              <div className="row g-24">
                                <div className="col-12">
                                  <div className="form-group hover-border-main">
                                    <label className="form-label fw-semibold mb-16">
                                      <i className="ph ph-image me-2 text-main-600"></i>
                                      Image
                                    </label>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          setFormData(prev => ({
                                            ...prev,
                                            eventDetails: {
                                              ...prev.eventDetails,
                                              section2: {
                                                ...prev.eventDetails.section2,
                                                image2: file
                                              }
                                            }
                                          }));
                                          setPreviews(prev => ({
                                            ...prev,
                                            image2: URL.createObjectURL(file)
                                          }));
                                        }
                                      }}
                                      className="form-control bg-white border-2 border-neutral-30 rounded-pill py-16 px-24"
                                    />
                                  </div>
                                </div>
                                <div className="col-12">
                                  <div className="form-group hover-border-main">
                                    <label className="form-label fw-semibold mb-16">
                                      <i className="ph ph-text-t me-2 text-main-600"></i>
                                      Title
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="Enter section title"
                                      value={formData.eventDetails.section2.title2 || ''}
                                      onChange={(e) => {
                                        setFormData(prev => ({
                                          ...prev,
                                          eventDetails: {
                                            ...prev.eventDetails,
                                            section2: {
                                              ...prev.eventDetails.section2,
                                              title2: e.target.value
                                            }
                                          }
                                        }));
                                      }}
                                      className="form-control bg-white border-2 border-neutral-30 rounded-pill py-16 px-24"
                                    />
                                  </div>
                                </div>
                                <div className="col-12">
                                  <div className="form-group hover-border-main">
                                    <label className="form-label fw-semibold mb-16">
                                      <i className="ph ph-text-align-left me-2 text-main-600"></i>
                                      Content
                                    </label>
                                    <textarea
                                      placeholder="Enter section content"
                                      value={formData.eventDetails.section2.paragraph2 || ''}
                                      onChange={(e) => {
                                        setFormData(prev => ({
                                          ...prev,
                                          eventDetails: {
                                            ...prev.eventDetails,
                                            section2: {
                                              ...prev.eventDetails.section2,
                                              paragraph2: e.target.value
                                            }
                                          }
                                        }));
                                      }}
                                      rows={4}
                                      className="form-control bg-white border-2 border-neutral-30 rounded-16 py-16 px-24"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content bg-white rounded-16 p-32">
            <div className="text-center">
              <i className="ph ph-warning-circle text-danger" style={{ fontSize: '48px' }}></i>
              <h5 className="mt-3">Delete Event</h5>
              <p className="text-muted">Are you sure you want to delete this event?</p>
              <div className="d-flex justify-content-center gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn btn-light rounded-pill px-32 py-12"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="btn btn-danger rounded-pill px-32 py-12"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <FooterOne />

      <style jsx>{`
        .py-120 {
          padding-top: 120px;
          padding-bottom: 120px;
        }

        .rounded-24 {
          border-radius: 24px;
        }

        .rounded-16 {
          border-radius: 16px;
        }

        .p-32 {
          padding: 32px;
        }

        .px-32 {
          padding-left: 32px;
          padding-right: 32px;
        }

        .py-16 {
          padding-top: 16px;
          padding-bottom: 16px;
        }

        .px-24 {
          padding-left: 24px;
          padding-right: 24px;
        }

        .mb-16 {
          margin-bottom: 16px;
        }

        .mt-40 {
          margin-top: 40px;
        }

        .g-32 {
          gap: 32px;
        }

        .form-control, .form-select {
          transition: all 0.3s ease;
        }

        .bg-main-25 {
          background-color: rgba(13, 110, 253, 0.05);
        }

        .border-neutral-30 {
          border-color: #e9ecef;
        }

        .text-main-600 {
          color: #0d6efd;
        }

        .hover-border-main:hover .form-control,
        .hover-border-main:hover .form-select {
          border-color: #0d6efd;
          background-color: white;
        }

        .btn-main {
          background-color: #0d6efd;
          border-color: #0d6efd;
          color: white;
          transition: all 0.3s ease;
        }

        .btn-main:hover {
          background-color: #0b5ed7;
          border-color: #0b5ed7;
          transform: translateY(-2px);
        }

        .btn-main-outline {
          color: #0d6efd;
          border: 2px solid #0d6efd;
          background: transparent;
          transition: all 0.3s ease;
        }

        .btn-main-outline:hover {
          background: #0d6efd;
          color: white;
          transform: translateY(-2px);
        }

        .calendar-container {
          position: relative;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.05);
          margin-bottom: 2rem;
        }

        .calendar-note {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: white;
          padding: 20px 30px;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          gap: 16px;
          z-index: 10;
          max-width: 400px;
          width: 90%;
        }

        .calendar-note i {
          font-size: 32px;
          color: #4f46e5;
          transition: transform 0.2s ease;
        }

        .calendar-note i:hover {
          transform: scale(1.1);
        }

        .calendar-note p {
          margin: 0;
          color: #1f2937;
        }

        .calendar-note small {
          display: block;
          margin-top: 8px;
        }

        :global(.fc) {
          background: white;
          min-height: 600px;
        }

        :global(.fc-header-toolbar) {
          padding: 1.5rem;
          margin-bottom: 0 !important;
          background: #f8f9fa;
          border-bottom: 1px solid #e9ecef;
        }

        :global(.fc-view) {
          padding: 1rem;
        }

        :global(.fc-day-header) {
          padding: 1rem 0 !important;
          font-weight: 600;
        }

        :global(.fc-daygrid-day) {
          min-height: 80px !important;
        }

        :global(.fc-daygrid-day-number) {
          font-size: 1rem;
          font-weight: 500;
          padding: 0.5rem;
        }

        :global(.fc-event) {
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal-content {
          width: 100%;
          max-width: 400px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
          animation: modalFadeIn 0.3s ease;
        }

        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 991px) {
          .py-120 {
            padding-top: 80px;
            padding-bottom: 80px;
          }
        }

        .g-24 {
          gap: 24px;
        }

        .p-24 {
          padding: 24px;
        }

        .form-group {
          position: relative;
        }

        .form-control::file-selector-button {
          display: none;
        }

        .form-control[type="file"] {
          padding-left: 16px;
        }

        .form-control[type="file"]::before {
          content: 'Choose File';
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          background: #0d6efd;
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }

        .form-control[type="file"]:hover::before {
          background: #0b5ed7;
        }

        .btn-outline-primary:hover {
          background-color: #f8f9fa !important;
          color: #0d6efd !important;
          border-color: #0d6efd !important;
          box-shadow: 0 2px 4px rgba(13, 110, 253, 0.1);
        }

        .hover-transform-sm:hover {
          transform: translateY(-2px);
        }

        .calendar-wrapper {
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .available-date {
          background-color: rgba(79, 70, 229, 0.1);
          border-radius: 50%;
        }

        .available-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background-color: var(--main-color, #4f46e5);
          color: white;
          border-radius: 50%;
          margin-top: 4px;
        }

        .calendar-legend {
          display: flex;
          gap: 16px;
          justify-content: center;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .react-calendar {
          width: 100%;
          border: none;
          font-family: inherit;
        }

        .react-calendar__tile--now {
          background: var(--main-color, #4f46e5);
          color: white;
        }

        .react-calendar__tile--active {
          background: var(--main-color, #4f46e5) !important;
          color: white !important;
        }

        .react-calendar__tile:hover {
          background: rgba(79, 70, 229, 0.1);
        }

        .react-calendar__navigation button:enabled:hover,
        .react-calendar__navigation button:enabled:focus {
          background-color: rgba(79, 70, 229, 0.1);
        }
      `}</style>
    </div>
  );
};

export default AddEvent;