'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

const ExploreCourseOne = () => {
  const [formations, setFormations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchFormations = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          toast.error('Veuillez vous connecter pour voir vos formations');
          router.push('/login');
          return;
        }

        const response = await axios.get('http://localhost:5000/api/enrollments/student/enrollments', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        // Filtrer uniquement les formations approuvées et limiter à 3
        const approvedFormations = response.data
          .filter(enrollment => enrollment.status === 'approved')
          .slice(0, 3)
          .map(enrollment => enrollment.formationId);

        setFormations(approvedFormations);
        setLoading(false);
      } catch (err) {
        console.error('Erreur:', err);
        setError('Erreur lors du chargement des formations');
        setLoading(false);
      }
    };

    fetchFormations();
  }, [router]);

  if (loading) return (
    <div className="py-120 bg-main-25">
      <div className="container">
        <div className="text-center">
          <div className="spinner-border text-main-600" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-3">Chargement de vos formations...</p>
        </div>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="py-120 bg-main-25">
      <div className="container">
        <div className="alert alert-danger text-center">
          <i className="ph ph-warning-circle me-2"></i>
          {error}
        </div>
      </div>
    </div>
  );

  return (
    <section className='explore-course py-120 bg-main-25 position-relative z-1'>
      <img
        src='assets/images/shapes/shape2.png'
        alt=''
        className='shape six animation-scalation'
      />
      <img
        src='assets/images/shapes/shape3.png'
        alt=''
        className='shape four animation-rotation'
      />
      <div className='container'>
        <div className='section-heading text-center style-flex gap-24'>
          <div className='section-heading__inner text-start'>
            <div className='flex-align gap-8 mb-16 wow bounceInDown'>
              <span className='w-8 h-8 bg-main-600 rounded-circle' />
              <h5 className='text-main-600 mb-0'>Learning</h5>
            </div>
            <h2 className='mb-0 wow bounceIn'>
            My Current Training Courses
            </h2>
          </div>
          <div className='section-heading__content'>
            <p className='section-heading__desc text-start mt-0 text-line-2 wow bounceInUp'>
            Continue your learning with your current training courses
            </p>
          </div>
        </div>

        {formations.length === 0 ? (
          <div className="text-center py-5">
            <div className="bg-white rounded-16 p-40 box-shadow-md">
              <i className="ph ph-graduation-cap text-main-600" style={{ fontSize: '3rem' }}></i>
              <h3 className="mt-4">Vous n'avez pas encore de formations en cours</h3>
              <p className="text-neutral-500">Explorez notre catalogue de formations pour commencer votre apprentissage</p>
              <Link href="/formations" className="btn btn-main rounded-pill mt-4">
                Découvrir les formations
              </Link>
            </div>
          </div>
        ) : (
          <div className='row g-24'>
            {formations.map((formation, index) => (
              <div 
                key={formation._id} 
                className='col-lg-4 col-sm-6'
                data-aos='fade-up'
                data-aos-duration={300 + (index * 100)}
              >
                <div className='course-item bg-white rounded-16 p-12 h-100 box-shadow-md hover-shadow-lg transition-2'>
                  <div className='course-item__thumb rounded-12 overflow-hidden position-relative'>
                    <Link href={`/formation-copy/${formation._id}`}>
                      <img
                        src={formation.image || 'assets/images/default-course.png'}
                        alt={formation.title}
                        className='course-item__img rounded-12 cover-img transition-2'
                        style={{ height: '200px', objectFit: 'cover' }}
                      />
                      <div className='position-absolute inset-0 bg-main-600 opacity-0 hover-opacity-20 transition-2'></div>
                    </Link>
                    <div className='flex-align gap-8 bg-main-600 rounded-pill px-24 py-12 text-white position-absolute inset-block-start-0 inset-inline-start-0 mt-20 ms-20 z-1'>
                      <span className='text-2xl d-flex'>
                        <i className='ph ph-clock' />
                      </span>
                      <span className='text-lg fw-medium'>{formation.duration}h</span>
                    </div>
                    <div className='position-absolute inset-block-end-0 inset-inline-start-0 mb-20 ms-20 z-1'>
                      <span className='px-20 py-8 bg-white rounded-8 text-main-600 fw-medium'>
                        {formation.level || 'Débutant'}
                      </span>
                    </div>
                  </div>

                  <div className='course-item__content p-24'>
                    <div>
                      <h4 className='mb-16'>
                        <Link href={`/formation-copy/${formation._id}`} className='link text-line-2 hover-text-main-600 transition-1'>
                          {formation.title}
                        </Link>
                      </h4>
                      
                      {formation.instructorId && (
                        <div className='flex-align gap-8 mb-16'>
                          <div className='w-40 h-40 rounded-circle overflow-hidden'>
                            <img 
                              src={formation.instructorId.profileImage || 'assets/images/thumbs/instructor-img1.png'} 
                              alt={`${formation.instructorId.firstName} ${formation.instructorId.lastName}`}
                              className='w-100 h-100 object-fit-cover'
                            />
                          </div>
                          <div>
                            <h6 className='mb-0 fw-medium'>by: {formation.instructorId.firstName} {formation.instructorId.lastName}</h6>
                            <p className='text-neutral-500 text-sm mb-0'>{formation.instructorId.title || 'Instructeur'}</p>
                          </div>
                        </div>
                      )}

                      <div className='flex-between gap-8 flex-wrap mb-16'>
                        <div className='flex-align gap-4'>
                          <span className='text-2xl fw-medium text-warning-600 d-flex'>
                            <i className='ph-fill ph-star' />
                          </span>
                          <span className='text-lg text-neutral-700'>
                            {formation.rating || 0}
                            <span className='text-neutral-100'>({formation.numberOfRatings || 0})</span>
                          </span>
                        </div>
                        <div className='flex-align gap-4'>
                          <span className='text-2xl fw-medium text-main-600 d-flex'>
                            <i className='ph-fill ph-users' />
                          </span>
                          <span className='text-lg text-neutral-700'>
                            {Array.isArray(formation.enrolledStudents) ? formation.enrolledStudents.length : 0} Students
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className='flex-between gap-8 pt-24 border-top border-neutral-50 mt-28 border-dashed border-0'>
                      <Link
                        href={`/formation-copy/${formation._id}`}
                        className='btn btn-main-600 w-100 d-flex align-items-center justify-content-center gap-8'
                      >
                        <i className='ph ph-play-circle'></i>
                        Continuer la formation
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ExploreCourseOne;
