'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from "next/link";
import axios from 'axios';

const CourseDetails = () => {
  const params = useParams();
  const [formation, setFormation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFormationDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/formations/${params.id}`);
        setFormation(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Erreur:', err);
        setError('Erreur lors du chargement des détails de la formation');
        setLoading(false);
      }
    };

    if (params.id) {
      fetchFormationDetails();
    }
  }, [params.id]);

  if (loading) return <div>Chargement des détails...</div>;
  if (error) return <div>{error}</div>;
  if (!formation) return <div>Formation non trouvée</div>;

  return (
    <section className='course-details py-120'>
      <div className='container'>
        <div className='row g-24'>
          <div className='col-lg-8'>
            <div className='course-details__content bg-white rounded-16 p-12 box-shadow-md'>
              <div className='course-details__thumb rounded-12 overflow-hidden'>
                <img
                  src={formation.image || '/assets/images/default-course.png'}
                  alt={formation.title}
                  className='w-100 object-fit-cover'
                />
              </div>
              <div className='course-details__info p-24'>
                <h3 className='mb-16'>{formation.title}</h3>
                <p className='mb-24'>{formation.description}</p>

                {/* Informations sur la formation */}
                <div className='course-info bg-neutral-25 rounded-12 p-24 mb-32'>
                  <h4 className='mb-24'>Détails de la formation</h4>
                  <div className='row g-24'>
                    <div className='col-sm-6'>
                      <div className='flex-align gap-12'>
                        <span className='text-2xl d-flex text-main-600'>
                          <i className='ph-bold ph-clock' />
                        </span>
                        <div>
                          <p className='mb-4 text-neutral-700'>Durée</p>
                          <h6 className='mb-0'>{formation.duration} heures</h6>
                        </div>
                      </div>
                    </div>
                    <div className='col-sm-6'>
                      <div className='flex-align gap-12'>
                        <span className='text-2xl d-flex text-main-600'>
                          <i className='ph-bold ph-chart-bar' />
                        </span>
                        <div>
                          <p className='mb-4 text-neutral-700'>Niveau</p>
                          <h6 className='mb-0'>{formation.level}</h6>
                        </div>
                      </div>
                    </div>
                    <div className='col-sm-6'>
                      <div className='flex-align gap-12'>
                        <span className='text-2xl d-flex text-main-600'>
                          <i className='ph-bold ph-users' />
                        </span>
                        <div>
                          <p className='mb-4 text-neutral-700'>Catégorie</p>
                          <h6 className='mb-0'>{formation.category}</h6>
                        </div>
                      </div>
                    </div>
                    <div className='col-sm-6'>
                      <div className='flex-align gap-12'>
                        <span className='text-2xl d-flex text-main-600'>
                          <i className='ph-bold ph-star' />
                        </span>
                        <div>
                          <p className='mb-4 text-neutral-700'>Note</p>
                          <h6 className='mb-0'>{formation.rating || 0} ({formation.numberOfRatings || 0} avis)</h6>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Informations sur l'instructeur */}
                {formation.instructorId && (
                  <div className='instructor-info bg-neutral-25 rounded-12 p-24 mb-32'>
                    <h4 className='mb-24'>Instructeur</h4>
                    <div className='flex-align gap-16'>
                      <img
                        src={formation.instructorId.image || '/assets/images/default-avatar.png'}
                        alt={`${formation.instructorId.firstName} ${formation.instructorId.lastName}`}
                        className='w-80 h-80 rounded-circle object-fit-cover'
                      />
                      <div>
                        <h5 className='mb-8'>{formation.instructorId.firstName} {formation.instructorId.lastName}</h5>
                        <p className='mb-0'>{formation.instructorId.email}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className='col-lg-4'>
            <div className='course-details__sidebar bg-white rounded-16 p-24 box-shadow-md'>
              <div className='price-info mb-24'>
                <h3 className='mb-0'>${formation.price}</h3>
              </div>
              <Link
                href={`/apply-admission/${formation._id}`}
                className='btn btn-main w-100 text-center mb-16'
              >
                S'inscrire maintenant
              </Link>
              <div className='course-features bg-neutral-25 rounded-12 p-24'>
                <h5 className='mb-24'>Cette formation inclut :</h5>
                <ul className='list-unstyled mb-0'>
                  <li className='flex-align gap-12 mb-16'>
                    <span className='text-2xl d-flex text-main-600'>
                      <i className='ph-bold ph-clock' />
                    </span>
                    <span>{formation.duration} heures de cours</span>
                  </li>
                  <li className='flex-align gap-12 mb-16'>
                    <span className='text-2xl d-flex text-main-600'>
                      <i className='ph-bold ph-certificate' />
                    </span>
                    <span>Certificat de fin de formation</span>
                  </li>
                  <li className='flex-align gap-12 mb-16'>
                    <span className='text-2xl d-flex text-main-600'>
                      <i className='ph-bold ph-infinity' />
                    </span>
                    <span>Accès à vie</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CourseDetails;
