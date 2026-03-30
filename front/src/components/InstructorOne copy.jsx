"use client";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import Slider from "react-slick";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import { useRouter } from 'next/navigation';

const InstructorOne = () => {
  const instructorSliderRef = useRef(null);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchFollowedInstructors = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          toast.error('Please login to view your instructors');
          router.push('/login');
          return;
        }

        // Get the logged-in user
        const userStr = localStorage.getItem('user');
        if (!userStr) {
          toast.error('Session expired. Please login again');
          router.push('/login');
          return;
        }

        const user = JSON.parse(userStr);
        const userId = user.id || user._id || (user.user && (user.user.id || user.user._id));
        
        if (!userId) {
          toast.error('User ID not found');
          return;
        }

        // Use the dedicated route to get followed instructors
        const response = await axios.get(`http://localhost:5000/api/instructors/user/${userId}/followed`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        console.log('Followed instructors:', response.data);
        setInstructors(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching instructors:', error);
        toast.error('Error loading instructors');
        setLoading(false);
      }
    };

    fetchFollowedInstructors();
  }, [router]);

  const settings = {
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2000,
    speed: 1500,
    dots: false,
    pauseOnHover: true,
    arrows: false,
    infinite: instructors.length > 3,
    responsive: [
      {
        breakpoint: 1299,
        settings: {
          slidesToShow: 2,
          arrows: false,
          infinite: instructors.length > 2,
        },
      },
      {
        breakpoint: 767,
        settings: {
          slidesToShow: 2,
          arrows: false,
          infinite: instructors.length > 2,
        },
      },
      {
        breakpoint: 575,
        settings: {
          slidesToShow: 1,
          arrows: false,
          infinite: instructors.length > 1,
        },
      },
    ],
  };

  if (loading) {
    return (
      <section className='instructor py-120 bg-main-25 position-relative z-1'>
        <div className='container'>
          <div className='section-heading text-center'>
            <h2 className='mb-24'>My Instructors</h2>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (instructors.length === 0) {
    return (
      <section className='instructor py-120 bg-main-25 position-relative z-1'>
        <div className='container'>
          <div className='section-heading text-center'>
            <h2 className='mb-24'>My Instructors</h2>
            <p>You are not following any instructors yet.</p>
            <Link href='/instructor' className='btn btn-primary rounded-pill mt-4'>
              Discover instructors
              <i className='ph ph-arrow-right ms-2'></i>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <section className='instructor py-120 bg-main-25 position-relative z-1'>
        <img
          src='assets/images/shapes/shape2.png'
          alt=''
          className='shape one animation-scalation'
        />
        <img
          src='assets/images/shapes/shape6.png'
          alt=''
          className='shape six animation-scalation'
        />
        <div className='container'>
          <div className='section-heading text-center'>
            <h2 className='mb-24 wow bounceIn'>My Instructors</h2>
            <p className='wow bounceInUp'>
              Discover the instructors you follow and their courses.
            </p>
          </div>
          <Slider
            {...settings}
            ref={instructorSliderRef}
            className='instructor-slider'
          >
            {instructors.map((instructor) => (
              <div
                key={instructor._id}
                className='instructor-item scale-hover-item bg-white rounded-16 p-12 h-100 border border-neutral-30'
                data-aos='fade-up'
                data-aos-duration={200}
              >
                <div className='rounded-12 overflow-hidden position-relative bg-dark-yellow'>
                  <Link
                    href={`/instructor-details?id=${instructor._id}`}
                    className='w-100 h-100 d-flex align-items-end'
                  >
                    <img
                      src={instructor.profileImage ? `http://localhost:5000/${instructor.profileImage}` : 'assets/images/thumbs/instructor-img1.png'}
                      alt={instructor.firstName}
                      className='scale-hover-item__img rounded-12 cover-img transition-2'
                    />
                  </Link>
                </div>
                <div className='p-24 position-relative'>
                  <div className='social-infos'>
                    <ul className='social-list flex-align flex-column gap-12 mb-12'>
                      {instructor.socialLinks?.facebook && (
                        <li className='social-list__item'>
                          <a
                            href={instructor.socialLinks.facebook}
                            className='flex-center border border-white text-white w-44 h-44 rounded-circle text-xl hover-text-main hover-bg-white'
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <i className='ph-bold ph-facebook-logo' />
                          </a>
                        </li>
                      )}
                      {instructor.socialLinks?.twitter && (
                        <li className='social-list__item'>
                          <a
                            href={instructor.socialLinks.twitter}
                            className='flex-center border border-white text-white w-44 h-44 rounded-circle text-xl hover-text-main hover-bg-white'
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <i className='ph-bold ph-twitter-logo' />
                          </a>
                        </li>
                      )}
                      {instructor.socialLinks?.linkedin && (
                        <li className='social-list__item'>
                          <a
                            href={instructor.socialLinks.linkedin}
                            className='flex-center border border-white text-white w-44 h-44 rounded-circle text-xl hover-text-main hover-bg-white'
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <i className='ph-bold ph-linkedin-logo' />
                          </a>
                        </li>
                      )}
                    </ul>
                  </div>
                  <div className=''>
                    <h4 className='mb-28 pb-24 border-bottom border-neutral-50 mb-24 border-dashed border-0'>
                      <Link href={`/instructor-details?id=${instructor._id}`} className='link text-line-2'>
                        {instructor.firstName} {instructor.lastName}
                      </Link>
                    </h4>
                    <div className='flex-between gap-8 flex-wrap mb-16'>
                      <div className='flex-align gap-8'>
                        <span className='text-neutral-700 text-2xl d-flex'>
                          <i className='ph-bold ph-lightbulb' />
                        </span>
                        <span className='text-neutral-700 text-lg fw-medium'>
                          {instructor.specialization || 'Instructor'}
                        </span>
                      </div>
                      <div className='flex-align gap-8'>
                        <span className='text-neutral-700 text-2xl d-flex'>
                          <i className='ph-bold ph-book-open' />
                        </span>
                        <span className='text-neutral-700 text-lg fw-medium'>
                          {instructor.courses?.length || 0} Courses
                        </span>
                      </div>
                    </div>
                    <div className='flex-between gap-8 flex-wrap'>
                      <div className='flex-align gap-8'>
                        <span className='text-neutral-700 text-2xl d-flex'>
                          <i className='ph-bold ph-user-circle-plus' />
                        </span>
                        <span className='text-neutral-700 text-lg fw-medium'>
                          {instructor.followers?.length || 0} Followers
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className='pt-24 border-top border-neutral-50 mt-28 border-dashed border-0'>
                    <Link
                      href={`/instructor-details?id=${instructor._id}`}
                      className='flex-align gap-8 text-main-600 hover-text-decoration-underline transition-1 fw-semibold'
                    >
                      View profile
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
              id='instructor-prev'
              onClick={() => instructorSliderRef.current.slickPrev()}
              className='slick-arrow flex-center rounded-circle border border-gray-100 hover-border-main-600 text-xl hover-bg-main-600 hover-text-white transition-1 w-48 h-48'
            >
              <i className='ph ph-caret-left' />
            </button>
            <button
              type='button'
              id='instructor-next'
              onClick={() => instructorSliderRef.current.slickNext()}
              className='slick-arrow flex-center rounded-circle border border-gray-100 hover-border-main-600 text-xl hover-bg-main-600 hover-text-white transition-1 w-48 h-48'
            >
              <i className='ph ph-caret-right' />
            </button>
          </div>

          <div className='text-center mt-40'>
            <Link
              href='/instructor'
              className='btn btn-primary rounded-pill'
            >
               All instructors
              <i className='ph ph-arrow-right ms-2'></i>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default InstructorOne;
