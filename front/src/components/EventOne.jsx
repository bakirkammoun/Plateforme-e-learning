'use client';  // Ajoute cette ligne en haut du fichier

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const EventOne = ({ limit = 6 }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/events');
      if (response.status !== 200) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to midnight

      // Filter future events and sort by date
      const futureEvents = response.data
        .filter(event => new Date(event.startDate) >= today)
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
        .slice(0, limit);

      setEvents(futureEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events. Please try again.');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return {
      day: date.getDate(),
      month: date.toLocaleString('en-US', { month: 'short' }).toUpperCase()
    };
  };

  return (
    <section className='course-list-view py-120 bg-gradient-to-b from-white to-gray-50'>
      <div className='container'>
        <div className='section-heading text-center mb-60'>
          <div className='flex-align d-inline-flex gap-8 mb-16'>
            <span className='text-main-600 text-2xl d-flex'>
              <i className='ph-bold ph-calendar-check' />
            </span>
            <h5 className='text-main-600 mb-0'>Our Events</h5>
          </div>
          <h2 className='mb-24'>Upcoming Events</h2>
        </div>

        {loading ? (
          <div className="text-center py-80">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-80">
            <h3 className="text-neutral-500">No upcoming events</h3>
            <p className="text-neutral-400">Check back later to discover our upcoming events</p>
          </div>
        ) : (
          <>
            <div className='row gy-4'>
              {events.map((event) => {
                const startDate = formatDate(event.startDate);
                return (
                  <div key={event._id} className='col-xl-4 col-sm-6'>
                    <div className='event-card scale-hover-item bg-white rounded-16 p-12 h-100 border border-neutral-30 shadow-sm hover:shadow-lg transition-all duration-300'>
                      <div className='event-card__thumb rounded-12 overflow-hidden position-relative'>
                        <Link
                          href={`/event-details?id=${event._id}`}
                          className='w-100 h-100'
                        >
                          <img
                            src={event.image ? `http://localhost:5000${event.image}` : '/assets/images/thumbs/event-img1.png'}
                            alt={event.title}
                            className='scale-hover-item__img rounded-12 cover-img transition-2'
                            style={{ height: '250px', objectFit: 'cover' }}
                          />
                          <div className='event-card__overlay position-absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-300'></div>
                        </Link>
                        <div className='event-date position-absolute inset-inline-end-0 inset-block-end-0 me-16 mb-16 py-12 px-24 rounded-8 bg-white text-primary fw-medium shadow-sm'>
                          <h3 className='mb-0'>{startDate.day}</h3>
                          {startDate.month}
                        </div>
                        <div className={`event-badge rounded-8 px-24 py-12 text-white position-absolute inset-block-start-0 inset-inline-start-0 mt-20 ms-20 z-1 ${
                          event.color === 'Danger' ? 'bg-danger-600' :
                          event.color === 'Success' ? 'bg-success-600' :
                          event.color === 'Warning' ? 'bg-warning-600' : 'bg-primary-600'
                        }`}>
                          {event.startTime}
                        </div>
                      </div>
                      <div className='pt-32 pb-24 px-16 position-relative'>
                        <h4 className='mb-28'>
                          <Link
                            href={`/event-details?id=${event._id}`}
                            className='link text-line-2 hover:text-primary transition-colors'
                          >
                            {event.title}
                          </Link>
                        </h4>
                        <div className='flex-align gap-8 mb-24'>
                          <span className='text-neutral-500 text-2xl d-flex'>
                            <i className='ph-bold ph-map-pin-line'></i>
                          </span>
                          <p className='text-neutral-500 text-lg'>
                            {event.location}
                          </p>
                        </div>
                        <div className='event-meta flex-align gap-16 pt-24 border-top border-neutral-50 mt-28'>
                          <div className='flex-align gap-8'>
                            <i className='ph-bold ph-clock text-primary'></i>
                            <span className='text-neutral-500 text-sm'>
                              {event.startTime} - {event.endTime}
                            </span>
                          </div>
                          <div className='flex-align gap-8'>
                            <i className='ph-bold ph-calendar text-primary'></i>
                            <span className='text-neutral-500 text-sm'>
                              {new Date(event.startDate).toLocaleDateString('en-US', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-center mt-60">
              <Link 
                href="/events" 
                className="btn btn-primary btn-lg rounded-pill px-40 py-12 fw-semibold d-inline-flex align-items-center gap-2"
              >
                View all events
                <i className="ph ph-arrow-right"></i>
              </Link>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .event-card {
          transition: all 0.3s ease;
        }

        .event-card:hover {
          transform: translateY(-5px);
        }

        .scale-hover-item__img {
          transition: transform 0.5s ease;
        }

        .scale-hover-item:hover .scale-hover-item__img {
          transform: scale(1.05);
        }

        .event-card__overlay {
          transition: all 0.3s ease;
        }

        .event-card:hover .event-card__overlay {
          background-color: rgba(0, 0, 0, 0.2);
        }

        .event-badge {
          transition: all 0.3s ease;
        }

        .event-card:hover .event-badge {
          transform: translateY(-2px);
        }
      `}</style>
    </section>
  );
};

export default EventOne;
