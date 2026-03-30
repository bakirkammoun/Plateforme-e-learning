'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import axios from 'axios';

const CourseGridView = () => {
  const [formations, setFormations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    const fetchFormations = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/formations?sort=${sortBy}`);
        setFormations(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Erreur:', err);
        setError('Erreur lors du chargement des formations');
        setLoading(false);
      }
    };

    fetchFormations();
  }, [sortBy]);

  if (loading) return <div>Chargement des formations...</div>;
  if (error) return <div>{error}</div>;

  return (
    <section className='course-grid-view py-120'>
      <div className='container'>
        <div className='flex-between gap-16 flex-wrap mb-40'>
          <span className='text-neutral-500'>
            Affichage de {formations.length} formations
          </span>
          <div className='flex-align gap-8'>
            <span className='text-neutral-500 flex-shrink-0'>Trier par :</span>
            <select 
              className='form-select ps-20 pe-28 py-8 fw-semibold rounded-pill bg-main-25 border border-neutral-30 text-neutral-700'
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value='newest'>Plus récent</option>
              <option value='oldest'>Plus ancien</option>
              <option value='price_asc'>Prix croissant</option>
              <option value='price_desc'>Prix décroissant</option>
            </select>
          </div>
        </div>

        <div className='row gy-4'>
          {formations.map((formation) => (
            <div key={formation._id} className='col-lg-4 col-sm-6'>
              <div className='course-item bg-main-25 rounded-16 p-12 h-100 border border-neutral-30'>
                <div className='course-item__thumb rounded-12 overflow-hidden position-relative'>
                  <Link href={`/course-details/${formation._id}`} className='w-100 h-100'>
                    <img
                      src={formation.image || '/assets/images/default-course.png'}
                      alt={formation.title}
                      className='course-item__img rounded-12 cover-img transition-2'
                    />
                  </Link>
                  <div className='flex-align gap-8 bg-main-600 rounded-pill px-24 py-12 text-white position-absolute inset-block-start-0 inset-inline-start-0 mt-20 ms-20 z-1'>
                    <span className='text-2xl d-flex'>
                      <i className='ph ph-clock' />
                    </span>
                    <span className='text-lg fw-medium'>{formation.duration}h</span>
                  </div>
                </div>

                <div className='course-item__content'>
                  <div>
                    <h4 className='mb-28'>
                      <Link href={`/course-details/${formation._id}`} className='link text-line-2'>
                        {formation.title}
                      </Link>
                    </h4>
                    <div className='flex-between gap-8 flex-wrap mb-16'>
                      <div className='flex-align gap-8'>
                        <span className='text-neutral-700 text-2xl d-flex'>
                          <i className='ph-bold ph-video-camera' />
                        </span>
                        <span className='text-neutral-700 text-lg fw-medium'>
                          {formation.level}
                        </span>
                      </div>
                      <div className='flex-align gap-8'>
                        <span className='text-neutral-700 text-2xl d-flex'>
                          <i className='ph-bold ph-chart-bar' />
                        </span>
                        <span className='text-neutral-700 text-lg fw-medium'>
                          {formation.category}
                        </span>
                      </div>
                    </div>

                    <div className='flex-between gap-8 flex-wrap'>
                      <div className='flex-align gap-4'>
                        <span className='text-2xl fw-medium text-warning-600 d-flex'>
                          <i className='ph-fill ph-star' />
                        </span>
                        <span className='text-lg text-neutral-700'>
                          {formation.rating || 0}
                          <span className='text-neutral-100'>({formation.numberOfRatings || 0})</span>
                        </span>
                      </div>
                      {formation.instructorId && (
                        <div className='flex-align gap-8'>
                          <span className='text-neutral-700 text-2xl d-flex'>
                            <img
                              src={formation.instructorId.image || '/assets/images/default-avatar.png'}
                              alt='Instructor'
                              className='w-32 h-32 object-fit-cover rounded-circle'
                            />
                          </span>
                          <span className='text-neutral-700 text-lg fw-medium'>
                            {formation.instructorId.firstName} {formation.instructorId.lastName}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className='flex-between gap-8 pt-24 border-top border-neutral-50 mt-28 border-dashed border-0'>
                    <h4 className='mb-0 text-main-two-600'>${formation.price}</h4>
                    <Link
                      href={`/apply-admission/${formation._id}`}
                      className='flex-align gap-8 text-main-600 hover-text-decoration-underline transition-1 fw-semibold'
                    >
                      S'inscrire
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

export default CourseGridView;
