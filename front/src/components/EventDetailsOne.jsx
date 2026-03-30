"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import ModalVideo from "react-modal-video";
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const EventDetailsOne = () => {
  const searchParams = useSearchParams();
  const eventId = searchParams.get('id');
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isJoining, setIsJoining] = useState(false);
  const [userId, setUserId] = useState(null);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Récupérer les informations de l'utilisateur depuis le localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserRole(user.role);
        // Récupérer l'ID utilisateur en tenant compte des différentes structures possibles
        const userId = user.id || user._id || (user.user && (user.user.id || user.user._id));
        setUserId(userId);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!eventId) return;
      
      try {
        const response = await axios.get(`http://localhost:5000/api/events/${eventId}`);
        setEvent(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching event details:', error);
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [eventId]);

  const handleJoinEvent = async () => {
    try {
      if (!eventId) {
        toast.error('Event ID is missing');
        return;
      }
      if (!userId) {
        toast.error('Please log in to join this event');
        return;
      }

      setIsJoining(true);
      const token = localStorage.getItem('authToken');
      
      const response = await axios.post(
        `http://localhost:5000/api/events/${eventId}/join`,
        { userId },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        // Mettre à jour l'état local de l'événement avec les nouvelles données
        setEvent(prev => ({
          ...prev,
          participants: [...(prev.participants || []), userId]
        }));

        // Envoyer une notification à l'instructeur
        try {
          const user = JSON.parse(localStorage.getItem('user'));
          const notificationData = {
            type: 'event_joined',
            message: `${user.firstName} ${user.lastName} a rejoint votre événement : ${event.title}`,
            recipientId: event.instructorId,
            senderId: userId,
            data: {
              eventId: eventId,
              eventTitle: event.title,
              studentName: `${user.firstName} ${user.lastName}`,
              studentId: userId
            }
          };

          await axios.post(
            'http://localhost:5000/api/notifications',
            notificationData,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
        } catch (notificationError) {
          console.error('Error sending notification:', notificationError);
        }
      }
    } catch (error) {
      console.error('Error joining event:', error);
      const errorMessage = error.response?.data?.message || 'Error joining event';
      toast.error(errorMessage);
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveEvent = async () => {
    try {
      if (!eventId) {
        toast.error('Event ID is missing');
        return;
      }
      if (!userId) {
        toast.error('Please log in to leave this event');
        return;
      }

      setIsLeaving(true);
      const token = localStorage.getItem('authToken');
      
      const response = await axios.post(
        `http://localhost:5000/api/events/${eventId}/disjoin`,
        { userId },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        // Mettre à jour l'état local de l'événement
        setEvent(prev => ({
          ...prev,
          participants: prev.participants.filter(id => id !== userId)
        }));

        // Envoyer une notification à l'instructeur
        try {
          const user = JSON.parse(localStorage.getItem('user'));
          const notificationData = {
            type: 'event_left',
            message: `${user.firstName} ${user.lastName} a quitté votre événement : ${event.title}`,
            recipientId: event.instructorId,
            senderId: userId,
            data: {
              eventId: eventId,
              eventTitle: event.title,
              studentName: `${user.firstName} ${user.lastName}`,
              studentId: userId
            }
          };

          await axios.post(
            'http://localhost:5000/api/notifications',
            notificationData,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
        } catch (notificationError) {
          console.error('Error sending notification:', notificationError);
        }
      }
    } catch (error) {
      console.error('Error leaving event:', error);
      const errorMessage = error.response?.data?.message || 'Error leaving event';
      toast.error(errorMessage);
    } finally {
      setIsLeaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-120">
        <div className="container">
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="py-120">
        <div className="container">
          <div className="text-center">
            <h2>Event not found</h2>
            <p>The event you are looking for does not exist.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className='course-list-view py-120 bg-white'>
      <div className='container container--lg'>
        <img
          src='assets/images/thumbs/event-details-img.png'
          alt=''
          className='rounded-12'
        />
        <div className='container'>
          <div className='mt-60'>
            <div className='row gy-4'>
              <div className='col-lg-8'>
                <h1 className='display-4 mb-24 fw-semibold'>
                  {event.title}
                </h1>
                <p className='text-neutral-700 mb-32'>
                  {event.description}
                </p>

                <div className='row gy-4 mb-32'>
                  {event.eventDetails?.section1?.image1 && (
                    <div className='col-12 mb-5'>
                      <div className='mb-4'>
                        <img
                          src={`http://localhost:5000${event.eventDetails.section1.image1}`}
                          alt=''
                          className='rounded-16 w-100'
                          style={{ height: '300px', objectFit: 'cover' }}
                        />
                      </div>
                      <div className='px-3'>
                        <h4 className='mb-3'>{event.eventDetails.section1.title1 || 'Title'}</h4>
                        <p className='text-neutral-700'>
                          {event.eventDetails.section1.paragraph1 || 'Content'}
                        </p>
                      </div>
                    </div>
                  )}
                  {event.eventDetails?.section2?.image2 && (
                    <div className='col-12'>
                      <div className='mb-4'>
                        <img
                          src={`http://localhost:5000${event.eventDetails.section2.image2}`}
                          alt=''
                          className='rounded-16 w-100'
                          style={{ height: '300px', objectFit: 'cover' }}
                        />
                      </div>
                      <div className='px-3'>
                        <h4 className='mb-3'>{event.eventDetails.section2.title2 || 'Title'}</h4>
                        <p className='text-neutral-700'>
                          {event.eventDetails.section2.paragraph2 || 'Content'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className='col-lg-4'>
                <div className='bg-white box-shadow-md rounded-12 p-12 d-flex flex-column gap-12 border border-neutral-30 mt--200px'>
                  {event.eventDetails?.eventVideo && (
                    <div className='rounded-12 overflow-hidden'>
                      <div className='position-relative'>
                        <video
                          src={`http://localhost:5000${event.eventDetails.eventVideo}`}
                          controls
                          className='rounded-12 w-100'
                          style={{ height: '200px', objectFit: 'cover' }}
                        />
                      </div>
                    </div>
                  )}
                  <div className='rounded-12 bg-main-25 p-24'>
                    <div className='flex-between flex-wrap gap-16 border-bottom border-dashed border-top-0 border-end-0 border-start-0 border-neutral-40 pb-16 mb-16'>
                      <div className='flex-align gap-12'>
                        <span className='text-neutral-700 text-2xl d-flex'>
                          <i className='ph-bold ph-calendar-dot' />
                        </span>
                        <span className='text-neutral-700 text-lg fw-normal'>
                          Start Date
                        </span>
                      </div>
                      <span className='text-lg fw-medium text-neutral-700'>
                        {new Date(event.startDate).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className='flex-between flex-wrap gap-16 border-bottom border-dashed border-top-0 border-end-0 border-start-0 border-neutral-40 pb-16 mb-16'>
                      <div className='flex-align gap-12'>
                        <span className='text-neutral-700 text-2xl d-flex'>
                          <i className='ph-bold ph-clock' />
                        </span>
                        <span className='text-neutral-700 text-lg fw-normal'>
                          Start Time
                        </span>
                      </div>
                      <span className='text-lg fw-medium text-neutral-700'>
                        {event.startTime}
                      </span>
                    </div>
                    <div className='flex-between flex-wrap gap-16 border-bottom border-dashed border-top-0 border-end-0 border-start-0 border-neutral-40 pb-16 mb-16'>
                      <div className='flex-align gap-12'>
                        <span className='text-neutral-700 text-2xl d-flex'>
                          <i className='ph-bold ph-calendar-dot' />
                        </span>
                        <span className='text-neutral-700 text-lg fw-normal'>
                          End Time
                        </span>
                      </div>
                      <span className='text-lg fw-medium text-neutral-700'>
                        {event.endTime}
                      </span>
                    </div>
                    <div className='flex-between flex-wrap gap-16 border-bottom border-dashed border-top-0 border-end-0 border-start-0 border-neutral-40 pb-16 mb-16'>
                      <div className='flex-align gap-12'>
                        <span className='text-neutral-700 text-2xl d-flex'>
                          <i className='ph-bold ph-clock' />
                        </span>
                        <span className='text-neutral-700 text-lg fw-normal'>
                          End Date
                        </span>
                      </div>
                      <span className='text-lg fw-medium text-neutral-700'>
                        {new Date(event.endDate).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className='flex-between flex-wrap gap-16 border-bottom border-dashed border-top-0 border-end-0 border-start-0 border-neutral-40 pb-16 mb-16'>
                      <div className='flex-align gap-12'>
                        <span className='text-neutral-700 text-2xl d-flex'>
                          <i className='ph-bold ph-users-three' />
                        </span>
                        <span className='text-neutral-700 text-lg fw-normal'>
                          Participants
                        </span>
                      </div>
                      <span className='text-lg fw-medium text-neutral-700'>
                        {event.participants?.length || 0} / {event.maxParticipants}
                      </span>
                    </div>
                    <div className='flex-between flex-wrap gap-16'>
                      <div className='flex-align gap-12'>
                        <span className='text-neutral-700 text-2xl d-flex'>
                          <i className='ph-bold ph-map-pin-line' />
                        </span>
                        <span className='text-neutral-700 text-lg fw-normal'>
                          Location
                        </span>
                      </div>
                      <span className='text-lg fw-medium text-neutral-700'>
                        {event.location}
                      </span>
                    </div>
                  </div>
                  <span className='d-block border-bottom border-top-0 border-dashed border-main-100 my-32' />
                  {userRole === 'student' && (
                    <button
                      onClick={event.participants?.includes(userId) ? handleLeaveEvent : handleJoinEvent}
                      disabled={isJoining || isLeaving || (event.participants && !event.participants.includes(userId) && event.participants.length >= event.maxParticipants)}
                      className='btn btn-main rounded-pill flex-center gap-8 w-100'
                    >
                      {isJoining ? (
                        <span>Joining...</span>
                      ) : isLeaving ? (
                        <span>Leaving...</span>
                      ) : event.participants?.includes(userId) ? (
                        <>
                          Leave Event
                          <i className='ph-bold ph-sign-out d-flex text-lg' />
                        </>
                      ) : event.participants?.length >= event.maxParticipants ? (
                        'Event Full'
                      ) : (
                        <>
                          Join Now
                          <i className='ph-bold ph-arrow-up-right d-flex text-lg' />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ModalVideo
        channel='youtube'
        autoplay
        isOpen={isOpen}
        videoId='XxVg_s8xAms'
        onClose={() => setIsOpen(false)}
        allowFullScreen
      />
    </section>
  );
};

export default EventDetailsOne;
