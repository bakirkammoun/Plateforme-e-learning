'use client';

import { useEffect, useState } from 'react';
import Link from "next/link";
import axios from 'axios';
import { toast } from 'react-hot-toast';

const MyJoinedEvents = () => {
  const [joinedEvents, setJoinedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 6;

  useEffect(() => {
    const fetchJoinedEvents = async () => {
      try {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
          toast.error('Veuillez vous connecter pour voir vos événements');
          setLoading(false);
          return;
        }

        // Envoyer la requête avec le token
        const response = await axios.get('http://localhost:5000/api/events/joined', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.data) {
          const sortedEvents = [...response.data].sort((a, b) => {
            return sortBy === 'newest' 
              ? new Date(b.startDate) - new Date(a.startDate)
              : new Date(a.startDate) - new Date(b.startDate);
          });
          setJoinedEvents(sortedEvents);
        }
      } catch (error) {
        console.error('Error fetching events:', error.response?.data || error.message);
        
        if (error.response?.status === 401) {
          toast.error('Session expirée, veuillez vous reconnecter');
          // Rediriger vers la page de connexion
          window.location.href = '/sign-in';
        } else {
          toast.error('Erreur lors du chargement des événements');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchJoinedEvents();
  }, [sortBy]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return {
      day: date.getDate(),
      month: date.toLocaleString('en-US', { month: 'short' }).toUpperCase()
    };
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // Calculer les événements pour la page courante
  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = joinedEvents.slice(indexOfFirstEvent, indexOfLastEvent);
  const totalPages = Math.ceil(joinedEvents.length / eventsPerPage);

  // Fonction pour changer de page
  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="text-center py-80">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className='blog-page-section py-120'>
      <div className='container'>
        <div className='flex-between gap-16 flex-wrap mb-40'>
          <span className='text-neutral-500'>
            Showing {currentEvents.length} of {joinedEvents.length} Joined Events
          </span>
          <div className='flex-align gap-16'>
            <div className='flex-align gap-8'>
              <span className='text-neutral-500 flex-shrink-0'>Sort By :</span>
              <select 
                className='form-select ps-20 pe-28 py-8 fw-medium rounded-pill bg-main-25 border border-neutral-30 text-neutral-700'
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
              </select>
            </div>
          </div>
        </div>
        <div className='row gy-4'>
          {joinedEvents.length === 0 ? (
            <div className="col-12 text-center py-40">
              <h3>You haven't joined any events yet</h3>
              <p className="mt-3">
                <Link href="/events" className="text-main-600 hover-text-decoration-underline">
                  Browse available events
                </Link>
              </p>
            </div>
          ) : (
            currentEvents.map((event) => {
              const eventDate = formatDate(event.startDate);
              const eventTime = formatTime(event.startDate);
              const isPastEvent = new Date(event.startDate) < new Date();
              
              return (
                <div key={event._id} className='col-lg-6'>
            <div className='scale-hover-item bg-main-25 rounded-16 p-12 h-100 border border-neutral-30 d-flex flex-sm-row flex-column'>
                    <div className='course-item__thumb rounded-12 overflow-hidden position-relative max-w-274 w-50'>
                      <Link href={`/event-details?id=${event._id}`} className='w-100 h-100'>
                  <img
                          src={event.image ? `http://localhost:5000${event.image}` : '/assets/images/thumbs/event-img1.png'}
                          alt={event.title}
                    className='scale-hover-item__img rounded-12 cover-img transition-2'
                  />
                </Link>
                <div className='position-absolute inset-inline-start-0 inset-block-start-0 ms-16 mt-16 py-12 px-24 rounded-8 bg-main-two-600 text-white fw-medium'>
                        <h3 className='mb-0 text-white fw-medium'>{eventDate.day}</h3>
                        {eventDate.month}
                </div>
              </div>
                    <div className='p-20 position-relative w-50'>
                <div className='flex-align gap-14 flex-wrap mb-20'>
                  <div className='flex-align gap-8'>
                    <span className='text-neutral-500 text-2xl d-flex'>
                            <i className='ph ph-map-pin' />
                    </span>
                          <span className='text-neutral-500 text-lg'>{event.location}</span>
                  </div>
                  <span className='w-8 h-8 bg-neutral-100 rounded-circle' />
                  <div className='flex-align gap-8'>
                    <span className='text-neutral-500 text-2xl d-flex'>
                            <i className='ph ph-clock' />
                    </span>
                          <span className='text-neutral-500 text-lg'>{eventTime}</span>
                  </div>
                </div>
                <h4 className='mb-28'>
                        <Link href={`/event-details?id=${event._id}`} className='link text-line-3'>
                          {event.title}
                  </Link>
                </h4>
                <div className='flex-between gap-8 pt-24 border-top border-neutral-50 mt-28 border-dashed border-0'>
                  <Link
                          href={`/event-details?id=${event._id}`}
                    className='flex-align gap-8 text-main-600 hover-text-decoration-underline transition-1 fw-semibold'
                  >
                          View Details
                    <i className='ph ph-arrow-right' />
                  </Link>
                </div>
              </div>
            </div>
          </div>
              );
            })
          )}
                </div>

        {/* Pagination Controls */}
        {joinedEvents.length > 0 && (
          <div className="pagination-wrapper mt-60 text-center">
            <nav>
              <ul className="pagination justify-content-center gap-3">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button
                    className="page-link rounded-8 text-main-600 bg-main-25 border-neutral-30 hover-bg-main-600 hover-text-white"
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <i className="ph ph-arrow-left" />
                  </button>
                </li>
                
                {[...Array(totalPages)].map((_, index) => (
                  <li key={index + 1} className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}>
                    <button
                      className={`page-link rounded-8 ${
                        currentPage === index + 1
                          ? 'bg-main-600 text-white border-main-600'
                          : 'text-main-600 bg-main-25 border-neutral-30 hover-bg-main-600 hover-text-white'
                      }`}
                      onClick={() => paginate(index + 1)}
                    >
                      {index + 1}
                    </button>
                  </li>
                ))}

                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button
                    className="page-link rounded-8 text-main-600 bg-main-25 border-neutral-30 hover-bg-main-600 hover-text-white"
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <i className="ph ph-arrow-right" />
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyJoinedEvents;
