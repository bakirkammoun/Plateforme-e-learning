"use client";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import Slider from "react-slick";
import axios from "axios";

const BlogTwo = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const sliderRef = useRef(null);
  
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const user = JSON.parse(localStorage.getItem('user'));
        
        if (!token || !user) {
          console.log('No auth token or user found');
          setError('Authentication required');
          setLoading(false);
          return;
        }

        console.log('Fetching events for instructor:', user.id);
        const response = await axios.get(
          `http://localhost:5000/api/events/instructor/${user.id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        console.log('Events fetched:', response.data);
        setEvents(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching events:', error.response || error);
        setError(error.response?.data?.message || 'Failed to load events');
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const settings = {
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: false,
    autoplaySpeed: 2000,
    speed: 900,
    dots: false,
    pauseOnHover: true,
    arrows: false,
    draggable: true,
    infinite: true,

    responsive: [
      {
        breakpoint: 1299,
        settings: {
          slidesToShow: 2,
          arrows: false,
        },
      },
      {
        breakpoint: 767,
        settings: {
          slidesToShow: 2,
          arrows: false,
        },
      },
      {
        breakpoint: 575,
        settings: {
          slidesToShow: 1,
          arrows: false,
        },
      },
    ],
  };

  if (loading) {
    return (
      <section className='blog-two py-120 bg-main-25'>
        <div className='container'>
          <div className='text-center'>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className='blog-two py-120 bg-main-25'>
        <div className='container'>
          <div className='text-center'>
            <p className="text-danger">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  if (!events || events.length === 0) {
    return (
      <section className='blog-two py-120 bg-main-25'>
        <div className='container'>
          <div className='text-center'>
            <p>No events at the moment</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className='blog-two py-120 bg-main-25'>
      <div className='container'>
        <div className='section-heading text-center'>
          <div className='flex-align d-inline-flex gap-8 mb-16 wow bounceInDown'>
            <span className='text-main-600 text-2xl d-flex'>
              <i className='ph-bold ph-calendar' />
            </span>
            <h5 className='text-main-600 mb-0'>My Events</h5>
          </div>
          <h2 className='mb-24 wow bounceIn'>Upcoming Events</h2>
          <p className=' wow bounceInUp'>
            Discover the events you've created and manage them easily
          </p>
        </div>
        <Slider ref={sliderRef} {...settings} className='blog-two-slider'>
          {events.map((event) => (
            <div
              key={event._id}
              className='scale-hover-item bg-white rounded-16 p-12 h-100'
              data-aos='fade-up'
              data-aos-duration={200}
            >
              <div className='course-item__thumb rounded-12 overflow-hidden position-relative'>
                <Link href={`/event-details?id=${event._id}`} className='w-100 h-100'>
                  <img
                    src={event.image ? `http://localhost:5000${event.image}` : '/assets/images/thumbs/event-details-img.png'}
                    alt={event.title}
                    className='scale-hover-item__img rounded-12 cover-img transition-2 w-full h-[200px] object-cover'
                    onError={(e) => {
                      console.error('Error loading image:', e.target.src);
                      e.target.src = '/assets/images/thumbs/event-details-img.png';
                    }}
                  />
                </Link>
                <div className='position-absolute inset-inline-end-0 inset-block-end-0 me-16 mb-16 py-12 px-24 rounded-8 bg-main-three-600 text-white fw-medium'>
                  <h3 className='mb-0 text-white fw-medium'>{new Date(event.date).getDate()}</h3>
                  {new Date(event.date).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                </div>
              </div>
              <div className='pt-32 pb-24 px-16 position-relative'>
                <h4 className='mb-28'>
                  <Link href={`/event-details/${event._id}`} className='link text-line-2'>
                    {event.title}
                  </Link>
                </h4>
                <div className='flex-align gap-14 flex-wrap my-20'>
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
                    <span className='text-neutral-500 text-lg'>
                      {new Date(event.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <span className='w-8 h-8 bg-neutral-100 rounded-circle' />
                  <div className='flex-align gap-8'>
                    <span className='text-neutral-500 text-2xl d-flex'>
                      <i className='ph ph-users' />
                    </span>
                    <span className='text-neutral-500 text-lg'>{event.participants?.length || 0}</span>
                  </div>
                </div>
                <div className='flex-between gap-8 pt-24 border-top border-neutral-50 mt-28 border-dashed border-0'>
                  <Link
                    href={`/event-details?id=${event._id}`}
                    className='flex-align gap-8 text-main-600 hover-text-decoration-underline transition-1 fw-semibold'
                    tabIndex={0}
                  >
                    View Details
                    <i className='ph ph-arrow-right' />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </Slider>
        <div className='flex-align gap-16 mt-40 justify-content-center'>
          <button
            type='button'
            id='blog-two-prev'
            onClick={() => sliderRef.current.slickPrev()}
            className=' slick-arrow flex-center rounded-circle border border-gray-100 hover-border-main-600 text-xl hover-bg-main-600 hover-text-white transition-1 w-48 h-48'
          >
            <i className='ph ph-caret-left' />
          </button>
          <button
            type='button'
            id='blog-two-next'
            onClick={() => sliderRef.current.slickNext()}
            className=' slick-arrow flex-center rounded-circle border border-gray-100 hover-border-main-600 text-xl hover-bg-main-600 hover-text-white transition-1 w-48 h-48'
          >
            <i className='ph ph-caret-right' />
          </button>
        </div>
      </div>
    </section>
  );
};

export default BlogTwo;
