"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import axios from "axios";

const BannerOne = () => {
  const [followedInstructors, setFollowedInstructors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFollowedInstructors = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          console.log('Aucun token trouvé');
          setLoading(false);
          return;
        }

        // Récupérer l'utilisateur connecté
        const userStr = localStorage.getItem('user');
        if (!userStr) {
          console.log('Aucun utilisateur trouvé');
          setLoading(false);
          return;
        }

        const user = JSON.parse(userStr);
        const userId = user.id || user._id || (user.user && (user.user.id || user.user._id));
        
        if (!userId) {
          console.log('ID utilisateur non trouvé');
          setLoading(false);
          return;
        }

        console.log('Récupération des instructeurs suivis pour l\'utilisateur:', userId);
        
        const response = await axios.get(`http://localhost:5000/api/instructors/user/${userId}/followed`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        console.log('Réponse de l\'API:', response.data);

        if (Array.isArray(response.data)) {
          console.log('Instructeurs récupérés:', response.data);
          setFollowedInstructors(response.data);
        } else {
          console.log('Format de réponse inattendu:', response.data);
        }
      } catch (error) {
        console.error('Erreur détaillée lors de la récupération des instructeurs suivis:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFollowedInstructors();
  }, []);

  return (
    <section className='banner py-80 position-relative overflow-hidden'>
      <img
        src='assets/images/shapes/shape1.png'
        alt=''
        className='shape one animation-rotation'
      />
      <img
        src='assets/images/shapes/shape2.png'
        alt=''
        className='shape two animation-scalation'
      />
      <img
        src='assets/images/shapes/shape3.png'
        alt=''
        className='shape three animation-walking'
      />
      <img
        src='assets/images/shapes/shape4.png'
        alt=''
        className='shape four animation-scalation'
      />
      <img
        src='assets/images/shapes/shape5.png'
        alt=''
        className='shape five animation-walking'
      />
      <div className='container'>
        <div className='row gy-5 align-items-center'>
          <div className='col-xl-6'>
            <div className='banner-content pe-md-4'>
             
              <h1 className='display2 mb-24 wow bounceInLeft'>
                Find Your{" "}
                <span
                  className='text-main-two-600 wow bounceInRight'
                  data-wow-duration='2s'
                  data-wow-delay='.5s'
                >
                  Ideal
                </span>
                Course, Build{" "}
                <span
                  className='text-main-600 wow bounceInUp'
                  data-wow-duration='1s'
                  data-wow-delay='.5s'
                >
                  Skills
                </span>
              </h1>
              <p className='text-neutral-500 text-line-2 wow bounceInUp'>
                Welcome to Smartech, where learning knows no bounds. Whether
                you're a student, professional, or lifelong learner...
              </p>
              <div className='buttons-wrapper flex-align flex-wrap gap-24 mt-40'>
                <Link
                  href='/my-courses-list'
                  className='btn btn-main rounded-pill flex-align gap-8'
                  data-aos='fade-right'
                >
                  Browse Courses
                  <i className='ph-bold ph-arrow-up-right d-flex text-lg' />
                </Link>
                <Link
                  href='/about'
                  className='btn btn-outline-main rounded-pill flex-align gap-8'
                  data-aos='fade-left'
                >
                  About Us
                  <i className='ph-bold ph-arrow-up-right d-flex text-lg' />
                </Link>
              </div>
            </div>
          </div>
          <div className='col-xl-6'>
            <div className='banner-thumb position-relative'>
              <img
                src='assets/images/thumbs/banner-img.png'
                alt=''
                className='banner-thumb__img rounded-12 wow bounceIn'
                data-wow-duration='3s'
                data-wow-delay='.5s'
                data-tilt=''
                data-tilt-max={12}
                data-tilt-speed={500}
                data-tilt-perspective={5000}
                data-tilt-full-page-listening=''
                data-tilt-scale='1.02'
              />
              <img
                src='assets/images/shapes/curve-arrow.png'
                alt=''
                className='curve-arrow position-absolute'
              />
              <div
                className='banner-box one px-24 py-12 rounded-12 bg-white fw-medium box-shadow-lg d-inline-block'
                data-aos='fade-down'
              >
                <span className='text-main-600'>Enrolled</span> instructors
                <div className='enrolled-students mt-12'>
                  {loading ? (
                    <div className="text-center">Chargement...</div>
                  ) : followedInstructors.length > 0 ? (
                    followedInstructors.slice(0, 6).map((instructor) => (
                      <Link 
                        href={`/instructor-details?id=${instructor._id}`} 
                        key={instructor._id}
                      >
                        <img
                          src={instructor.profileImage || 'assets/images/thumbs/default-profile.png'}
                          alt={instructor.name || 'Instructor'}
                          className='w-48 h-48 rounded-circle object-fit-cover transition-2'
                          title={instructor.name || 'Instructor'}
                        />
                      </Link>
                    ))
                  ) : (
                    <div className="text-center text-neutral-500">Aucun instructeur suivi</div>
                  )}
                </div>
              </div>
              <div
                className='banner-box two px-24 py-12 rounded-12 bg-white fw-medium box-shadow-lg flex-align d-inline-flex gap-16'
                data-aos='fade-up'
              >
                <span className='banner-box__icon flex-shrink-0 w-48 h-48 bg-purple-400 text-white text-2xl flex-center rounded-circle'>
                  <i className='ph ph-watch' />
                </span>
                <div>
                  <h6 className='mb-4'>Fast Learning</h6>
                  <span className=''>For All Courses</span>
                </div>
              </div>
              <div
                className='banner-box three px-24 py-12 rounded-12 bg-white fw-medium box-shadow-lg flex-align d-inline-flex gap-16'
                data-aos='fade-left'
              >
                <span className='banner-box__icon flex-shrink-0 w-48 h-48 bg-main-50 text-main-600 text-2xl flex-center rounded-circle'>
                  <i className='ph ph-phone-call' />
                </span>
                <div>
                  <span className=''>Online Supports</span>
                  <a
                    href='tel:(+216) 29 706 046'
                    className='mt-8 fw-medium text-xl d-block text-main-600 hover-text-main-500'
                  >
                   (+216) 29 706 046
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BannerOne;
