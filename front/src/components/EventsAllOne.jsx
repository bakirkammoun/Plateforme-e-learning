'use client';  // Ajoute cette ligne en haut du fichier

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const EventsAllOne = ({ events: propEvents }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEvents, setFilteredEvents] = useState([]);

  useEffect(() => {
    if (propEvents) {
      const sortedEvents = [...propEvents].sort((a, b) => 
        new Date(b.startDate) - new Date(a.startDate)
      );
      setEvents(sortedEvents);
      setFilteredEvents(sortedEvents);
      setLoading(false);
    } else {
      fetchEvents();
    }
  }, [propEvents]);

  useEffect(() => {
    // Filter events based on search term
    const filtered = events.filter(event => 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort events
    const sorted = [...filtered].sort((a, b) => {
      const dateA = new Date(a.startDate);
      const dateB = new Date(b.startDate);
      
      if (sortBy === 'newest') {
        // Most recent to oldest
        return new Date(b.startDate) - new Date(a.startDate);
      } else {
        // Oldest to most recent
        return new Date(a.startDate) - new Date(b.startDate);
      }
    });

    setFilteredEvents(sorted);
  }, [searchTerm, events, sortBy]);

  const fetchEvents = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/events');
      if (response.status !== 200) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // Sort events by creation date before setting them
      const sortedEvents = [...response.data].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      setEvents(sortedEvents);
      setFilteredEvents(sortedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events. Please try again.');
      setEvents([]);
      setFilteredEvents([]);
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
    <section className='course-list-view bg-gradient-to-b from-white to-gray-50'>
      <div className='container'>
       

        {/* Filters Section */}
        <div className='flex-between gap-16 flex-wrap mb-40 bg-white p-24 rounded-16 shadow-sm'>
          <div className='flex-align gap-16'>
            <span className='text-neutral-500'>Showing {filteredEvents.length} events</span>
            <div className='flex-align gap-8'>
              <span className='text-neutral-500 flex-shrink-0'>Sort by:</span>
              <select 
                className='form-select ps-20 pe-28 py-8 fw-medium rounded-pill bg-main-25 border border-neutral-30 text-neutral-700 hover:border-primary transition-all'
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
              </select>
            </div>
          </div>
          <div className='flex-align gap-16'>
            <div className='search-box position-relative'>
              <input 
                type="text" 
                className='form-control ps-40 pe-16 py-8 rounded-pill bg-main-25 border border-neutral-30'
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <i className='ph ph-magnifying-glass position-absolute top-50 start-0 translate-middle-y ms-16 text-neutral-500'></i>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-80">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <div className='row gy-4'>
            {filteredEvents.map((event) => {
              const startDate = formatDate(event.startDate);
              const isPastEvent = new Date(event.startDate) < new Date();
              return (
                <div key={event._id} className='col-xl-4 col-sm-6'>
                  <div className={`event-card scale-hover-item bg-white rounded-16 p-12 h-100 border border-neutral-30 shadow-sm hover:shadow-lg transition-all duration-300 ${isPastEvent ? 'past-event' : ''}`}>
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
                        <div className={`event-card__overlay position-absolute inset-0 bg-black ${isPastEvent ? 'bg-opacity-40' : 'bg-opacity-0 hover:bg-opacity-20'} transition-all duration-300`}></div>
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
        )}
      </div>

      <style jsx>{`
        .event-card {
          transition: all 0.3s ease;
        }

        .event-card:hover {
          transform: translateY(-5px);
        }

        .past-event {
          position: relative;
        }

        .past-event .event-card__thumb::after {
          content: 'Past Event';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 8px 16px;
          border-radius: 8px;
          z-index: 2;
          font-weight: 500;
        }

        .past-event:hover {
          transform: none;
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

        .event-badge {
          transition: all 0.3s ease;
        }

        .event-card:hover .event-badge {
          transform: translateY(-2px);
        }

        .search-box input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 0.2rem rgba(37, 99, 235, 0.25);
        }

        .form-select:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 0.2rem rgba(37, 99, 235, 0.25);
        }

        @media (max-width: 768px) {
          .flex-between {
            flex-direction: column;
            gap: 1rem;
          }
          
          .search-box {
            width: 100%;
          }
          
          .search-box input {
            width: 100%;
          }
        }
      `}</style>
    </section>
  );
};

export default EventsAllOne;
