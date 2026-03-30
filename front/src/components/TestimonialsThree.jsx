"use client";
import { useRef, useState, useEffect } from "react";
import Slider from "react-slick";
import axios from "axios";

const TestimonialsThree = () => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const sliderRef = useRef(null);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const user = JSON.parse(localStorage.getItem('user'));
        
        if (!token || !user) {
          console.log('No auth token or user found');
          setError('Authentication required');
          setLoading(false);
          return;
        }

        console.log('Fetching comments for instructor:', user.id);
        const response = await axios.get(
          `http://localhost:5000/api/instructor/${user.id}/comments`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        console.log('Comments fetched:', response.data);
        setComments(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching comments:', error.response || error);
        setError(error.response?.data?.message || 'Failed to load comments');
        setLoading(false);
      }
    };

    fetchComments();
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
    draggable: false,
    infinite: true,
    centerMode: true,
    centerPadding: "0px",

    responsive: [
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
      <section className='testimonials-three py-120 bg-main-25 position-relative z-1 overflow-hidden'>
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
      <section className='testimonials-three py-120 bg-main-25 position-relative z-1 overflow-hidden'>
        <div className='container'>
          <div className='text-center'>
            <p className="text-danger">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  if (!comments || comments.length === 0) {
    return (
      <section className='testimonials-three py-120 bg-main-25 position-relative z-1 overflow-hidden'>
        <div className='container'>
          <div className='text-center'>
            <p>No comments yet</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className='testimonials-three py-120 bg-main-25 position-relative z-1 overflow-hidden'>
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
      <img
        src='assets/images/shapes/shape4.png'
        alt=''
        className='shape one animation-scalation'
      />
      <div className='container'>
        <div className='row gy-4 align-items-center flex-wrap-reverse'>
          <div className='col-xl-7'>
            <Slider
              ref={sliderRef}
              {...settings}
              className='testimonials-three-slider'
            >
              {comments.map((comment) => (
                <div key={comment._id} className='testimonials-three-item bg-white p-24 rounded-12 box-shadow-md'>
                  <div className='w-90 h-90 rounded-circle position-relative mb-4'>
                    <img
                      src={comment.userId.profileImage || 'assets/images/thumbs/default-avatar.png'}
                      alt={`${comment.userId.firstName} ${comment.userId.lastName}`}
                      className='cover-img rounded-circle'
                      onError={(e) => {
                        e.target.src = 'assets/images/thumbs/default-avatar.png';
                      }}
                    />
                    <span className='w-40 h-40 bg-main-two-600 flex-center border border-white border-2 rounded-circle position-absolute inset-block-end-0 inset-inline-end-0 mt--5 me--5'>
                      <img src='assets/images/icons/quote-two-icon.png' alt='' />
                    </span>
                  </div>
                  <p className='text-neutral-500 my-24'>
                    {comment.content}
                  </p>
                  <div className='d-flex justify-content-between align-items-center'>
                    <div>
                      <h4 className='mb-16 text-lg'>{comment.userId.firstName} {comment.userId.lastName}</h4>
                      <span className='text-neutral-500'>
                        Course: {comment.formationId.title}
                      </span>
                      <br />
                      <span className='text-neutral-500'>
                        {new Date(comment.createdAt).toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    {comment.replies && comment.replies.length > 0 && (
                      <span className='badge bg-primary'>
                        {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </Slider>
          </div>
          <div className='col-xl-5 ps-xl-5'>
            <div className='flex-align d-inline-flex gap-8 mb-16 wow bounceInDown'>
              <span className='text-main-600 text-2xl d-flex'>
                <i className='ph-bold ph-chats-circle' />
              </span>
              <h5 className='text-main-600 mb-0'>Comments</h5>
            </div>
            <h2 className='mb-24 wow bounceInRight'>What Our Students Say</h2>
            <p className='text-neutral-500 text-line-4 wow bounceInUp'>
              Discover our students' feedback on your courses. 
              Share your own experiences and ask questions to enrich the discussion.
            </p>
            <div className='flex-align gap-16 mt-40'>
              <button
                type='button'
                id='testimonials-three-prev'
                onClick={() => sliderRef.current.slickPrev()}
                className='slick-arrow flex-center rounded-circle border border-gray-100 hover-border-main-600 text-xl hover-bg-main-600 hover-text-white transition-1 w-48 h-48'
              >
                <i className='ph ph-caret-left' />
              </button>
              <button
                type='button'
                id='testimonials-three-next'
                onClick={() => sliderRef.current.slickNext()}
                className='slick-arrow flex-center rounded-circle border border-gray-100 hover-border-main-600 text-xl hover-bg-main-600 hover-text-white transition-1 w-48 h-48'
              >
                <i className='ph ph-caret-right' />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsThree;
