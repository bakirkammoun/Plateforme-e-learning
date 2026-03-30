"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import axios from "axios";

const BlogOne = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
          setError('Please login to view your events');
          setLoading(false);
          return;
        }

        const response = await axios.get(
          'http://localhost:5000/api/events/joined',
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        // Sort events by date (most recent first) and take only the 3 most recent
        const sortedEvents = response.data
          .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
          .slice(0, 3);
          
        setEvents(sortedEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
        setError('Error fetching events');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <section className='blog py-120 mash-bg-main mash-bg-main-two position-relative'>
      <img
        src='assets/images/shapes/shape2.png'
        alt=''
        className='shape two animation-scalation'
      />
      <img
        src='assets/images/shapes/shape6.png'
        alt=''
        className='shape four animation-scalation'
      />
      <div className='container'>
        <div className='section-heading text-center'>
          <h2 className='mb-24 wow bounceIn'>My Latest Events</h2>
          <p className='wow bounceInUp'>
            Discover the latest events you've participated in
          </p>
        </div>
        
        {loading ? (
          <div className="text-center py-5">Loading events...</div>
        ) : error ? (
          <div className="text-center py-5 text-danger">{error}</div>
        ) : events.length === 0 ? (
          <div className="text-center py-5">You haven't participated in any events yet</div>
        ) : (
          <div className='row gy-4'>
            {events.map((event, index) => (
              <div
                key={event._id}
                className='col-lg-4 col-sm-6'
                data-aos='fade-up'
                data-aos-duration={200 + (index * 200)}
              >
                <div className='blog-item scale-hover-item bg-main-25 rounded-16 p-12 h-100 border border-neutral-30'>
                  <div className='rounded-12 overflow-hidden position-relative'>
                    <Link href={`/event-details?id=${event._id}`} className='w-100 h-100'>
                      <img
                        src={event.image ? `http://localhost:5000${event.image}` : 'assets/images/thumbs/blog-img1.png'}
                        alt={event.title}
                        className='scale-hover-item__img rounded-12 cover-img transition-2'
                        style={{ height: '200px', objectFit: 'cover' }}
                      />
                    </Link>
                  </div>
                  <div className='p-24 pt-32'>
                    <div className=''>
                      <span className='px-20 py-8 bg-main-two-600 rounded-8 text-white fw-medium mb-20'>
                        {event.category || 'Event'}
                      </span>
                      <h4 className='mb-28'>
                        <Link href={`/event-details?id=${event._id}`} className='link text-line-2'>
                          {event.title}
                        </Link>
                      </h4>
                      <div className='flex-align gap-14 flex-wrap my-20'>
                        <div className='flex-align gap-8'>
                          <span className='text-neutral-500 text-2xl d-flex'>
                            <i className='ph ph-user-circle' />
                          </span>
                          <span className='text-neutral-500 text-lg'>{event.organizer?.name || 'Organizer'}</span>
                        </div>
                        <span className='w-8 h-8 bg-neutral-100 rounded-circle' />
                        <div className='flex-align gap-8'>
                          <span className='text-neutral-500 text-2xl d-flex'>
                            <i className='ph ph-calendar-dot' />
                          </span>
                          <span className='text-neutral-500 text-lg'>
                            {new Date(event.startDate).toLocaleDateString()}
                          </span>
                        </div>
                        <span className='w-8 h-8 bg-neutral-100 rounded-circle' />
                        <div className='flex-align gap-8'>
                          <span className='text-neutral-500 text-2xl d-flex'>
                            <i className='ph ph-map-pin' />
                          </span>
                          <span className='text-neutral-500 text-lg'>{event.location || 'Lieu non spécifié'}</span>
                        </div>
                      </div>
                      <p className='text-neutral-500 text-line-2'>
                        {event.description?.substring(0, 100) || 'Aucune description disponible'}...
                      </p>
                    </div>
                    <div className='pt-24 border-top border-neutral-50 mt-28 border-dashed border-0'>
                      <Link
                        href={`/event-details?id=${event._id}`}
                        className='flex-align gap-8 text-main-600 hover-text-decoration-underline transition-1 fw-semibold'
                        tabIndex={0}
                      >
                        View details
                        <i className='ph ph-arrow-right' />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="text-center mt-5">
          <Link 
            href="http://localhost:3000/events" 
            className="btn btn-primary btn-lg px-4 py-3 rounded-pill shadow-sm hover-shadow-md transition-all d-flex align-items-center justify-content-center mx-auto"
            style={{ fontSize: '1.1rem', minHeight: '50px', maxWidth: '200px' }}
          >
            <i className="ph ph-calendar-check me-2"></i>
            <span>View all events</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default BlogOne;
