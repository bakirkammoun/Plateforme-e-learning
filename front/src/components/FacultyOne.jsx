"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import axios from "axios";

const FacultyOne = () => {
  const [topFormations, setTopFormations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTopFormations = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        console.log('User from localStorage:', user);
        
        if (!user || user.role !== 'instructor') {
          console.log('User not logged in or not an instructor');
          setLoading(false);
          return;
        }

        console.log('Fetching top formations for instructor:', user.id);
        const response = await axios.get(`http://localhost:5000/api/instructors/${user.id}/top-formations`);
        console.log('Top formations response:', response.data);
        
        if (response.data && Array.isArray(response.data)) {
          setTopFormations(response.data);
        } else {
          console.error('Invalid response format:', response.data);
          setError('Invalid data format');
        }
      } catch (error) {
        console.error('Error fetching formations:', error);
        setError(error.response?.data?.message || 'Error fetching formations');
      } finally {
        setLoading(false);
      }
    };

    fetchTopFormations();
  }, []);

  if (loading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  if (topFormations.length === 0) {
    return (
      <section className='faculty pb-120 bg-main-25'>
        <div className='container'>
          <div className='section-heading text-center'>
            <div className='flex-align d-inline-flex gap-8 mb-16 wow bounceInDown'>
              <span className='text-main-600 text-2xl d-flex'>
                <i className='ph-bold ph-book-open' />
              </span>
              <h5 className='text-main-600 mb-0'>
                My Most Popular Courses
              </h5>
            </div>
            <h2 className='mb-24 wow bounceIn'>Top 3 Courses</h2>
            <p className='wow bounceInUp'>
              You don't have any courses yet. Start creating courses to see them appear here.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className='faculty pb-120 bg-main-25' style={{ marginTop: '26px' }}>
      <div className='container'>
        <div className='section-heading text-center'>
          <div className='flex-align d-inline-flex gap-8 mb-16 wow bounceInDown'>
            <span className='text-main-600 text-2xl d-flex'>
              <i className='ph-bold ph-book-open' />
            </span>
            <h5 className='text-main-600 mb-0'>
              My Most Popular Courses
            </h5>
          </div>
          <h2 className='mb-24 wow bounceIn'>Top 3 Courses</h2>
          <p className='wow bounceInUp'>
            Discover my most appreciated courses by students.
          </p>
          <div className='mt-4'>
            <Link
              href="/my-courses"
              className='btn btn-primary btn-lg'
            >
              <i className='ph ph-book-open me-2'></i>
              My Courses
            </Link>
          </div>
        </div>
        <div className='row gy-4'>
          {topFormations.map((formation, index) => (
          <div
              key={formation._id}
            className='col-lg-4 col-md-6'
            data-aos='fade-up'
              data-aos-duration={200 * (index + 1)}
          >
            <div className='scale-hover-item bg-white rounded-16 p-12 h-100 box-shadow-md'>
              <div className='course-item__thumb rounded-12 overflow-hidden position-relative'>
                  <Link href={`/course-details/${formation._id}`} className='w-100 h-100'>
                  <img
                      src={formation.image || '/assets/images/thumbs/faculty-img1.png'}
                      alt={formation.title}
                    className='scale-hover-item__img rounded-12 cover-img transition-2'
                  />
                </Link>
              </div>
              <div className='pt-32 pb-24 px-16 position-relative'>
                <div className=''>
                  <span className='text-up py-12 px-24 rounded-8 bg-main-three-600 text-white fw-medium'>
                      {formation.enrolledStudents?.length || 0} enrolled students
                  </span>
                  <div className='flex-between gap-8 flex-wrap mb-16'>
                    <div className='flex-align gap-4'>
                      <span className='text-2xl fw-medium text-warning-600 d-flex'>
                        <i className='ph-fill ph-star' />
                      </span>
                      <span className='text-lg text-neutral-700'>
                          {formation.rating?.toFixed(1) || '0.0'}
                          <span className='text-neutral-100'>
                            ({formation.numberOfRatings || 0})
                          </span>
                      </span>
                    </div>
                  </div>
                  <h4 className='mb-28'>
                      <Link href={`/course-details/${formation._id}`} className='link text-line-2'>
                        {formation.title}
                    </Link>
                  </h4>
                    <p className='text-neutral-500 text-md mb-0'>
                      {formation.description}
                    </p>
                </div>
                <div className='flex-between gap-8 pt-24 border-top border-neutral-50 mt-28 border-dashed border-0'>
                    <Link
                      href={`/course-details/${formation._id}`}
                    className='flex-align gap-8 text-main-600 hover-text-decoration-underline transition-1 fw-semibold'
                    tabIndex={0}
                    >
                      View Course
                    <i className='ph ph-arrow-right' />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FacultyOne;
