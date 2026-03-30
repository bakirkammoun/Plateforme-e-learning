"use client";
import { useEffect, useRef, useState } from "react";
import Slider from "react-slick";
import ModalVideo from "react-modal-video";
import Link from "next/link";
const BannerThree = () => {
  const sliderRef = useRef();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let WOW;
    if (typeof window !== "undefined") {
      WOW = require("wowjs");
      const wowInstance = new WOW.WOW({ live: false });
      wowInstance.init();
    }
  }, []);

  const handleBeforeChange = () => {
    if (typeof document !== "undefined") {
      const wowElements = document.querySelectorAll(".wow");
      wowElements.forEach((el) => {
        el.style.visibility = "hidden";
        el.classList.remove("animated");
      });
    }
  };

  const handleAfterChange = () => {
    if (typeof window !== "undefined") {
      const WOW = require("wowjs");
      const wowInstance = new WOW.WOW({ live: false });
      wowInstance.init();

      const wowElements = document.querySelectorAll(".wow");
      wowElements.forEach((el) => {
        el.style.visibility = "visible";
      });
    }
  };

  const settings = {
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: false,
    autoplaySpeed: 2000,
    speed: 900,
    dots: false,
    pauseOnHover: true,
    arrows: false,
    draggable: true,
    infinite: true,
    fade: true,

    beforeChange: handleBeforeChange,
    afterChange: handleAfterChange,
  };
  return (
    <section className='banner-three position-relative responsive-arrow overflow-hidden' style={{ marginTop: '70px' }}>
      <button
        type='button'
        id='banner-three-prev'
        onClick={() => sliderRef.current.slickPrev()}
        className='slick-arrow-prev slick-arrow flex-center rounded-circle bg-white text-main-600 hover-border-main-600 text-2xl hover-bg-main-600 hover-text-white transition-1 w-56 h-56 position-absolute ms-16 inset-inline-start-0 top-50 translate-middle-y z-3'
      >
        <i className='ph-bold ph-arrow-left' />
      </button>
      <button
        type='button'
        id='banner-three-next'
        onClick={() => sliderRef.current.slickNext()}
        className='slick-arrow-next slick-arrow flex-center rounded-circle bg-white text-main-600 hover-border-main-600 text-2xl hover-bg-main-600 hover-text-white transition-1 w-56 h-56 position-absolute me-16 inset-inline-end-0 top-50 translate-middle-y z-3'
      >
        <i className='ph-bold ph-arrow-right' />
      </button>
      <Slider ref={sliderRef} {...settings} className='banner-three__slider '>
        <div>
          <div
            className='banner-three__item background-img bg-img linear-overlay position-relative'
            style={{
              backgroundImage: `url(${"/assets/images/thumbs/banner-three-img1.png"})`,
            }}
          >
            <div className='container'>
              <div className='row'>
                <div className='col-xxl-6 col-xl-8 col-lg-10 z-1'>
                  <div className='banner-content pe-md-4'>
                    <div className='flex-align gap-8 mb-16 wow bounceInDown'>
                      
                    
                    </div>
                    <h1 className='display2 mb-24 text-white fw-medium wow bounceInLeft'>
                      Develop Your Skills,{" "}
                      <span
                        className='text-yellow-600  wow bounceInRight'
                        data-wow-duration='2s'
                        data-wow-delay='.5s'
                      >
                        {" "}
                        Build{" "}
                      </span>{" "}
                      Your Future
                    </h1>
                    <p className='text-white text-line-2 wow bounceInDown'>
                      Welcome to our online learning platform. Whether you're a student, 
                      professional, or lifelong learner...
                    </p>
                  </div>
                  <div className='buttons-wrapper flex-align flex-wrap gap-24 mt-40'>
                    <Link
                      href='/my-courses'
                      className='btn btn-main rounded-pill flex-align gap-8  wow bounceInLeft'
                      data-wow-duration='1s'
                      data-wow-delay='.5s'
                    >
                      Discover Courses
                      <i className='ph-bold ph-arrow-up-right d-flex text-lg' />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div>
          <div
            className='banner-three__item background-img bg-img linear-overlay position-relative'
            style={{
              backgroundImage: `url(${"/assets/images/thumbs/banner-three-img2.png"})`,
            }}
          >
            <div className='container'>
              <div className='row'>
                <div className='col-xxl-6 col-xl-8 col-lg-10 z-1'>
                  <div className='banner-content pe-md-4'>
                    <div className='flex-align gap-8 mb-16 wow bounceInDown'>
                      <span className='text-yellow-600 text-2xl d-flex'>
                        
                      </span>
                      <h5 className='text-yellow-600 mb-0 fw-medium'>
                    
                      </h5>
                    </div>
                    <h1 className='display2 mb-24 text-white fw-medium wow bounceInLeft'>
                      Expert Instructors,
                      <span
                        className='text-yellow-600  wow bounceInRight'
                        data-wow-duration='2s'
                        data-wow-delay='.5s'
                      >
                        {" "}
                        Real{" "}
                      </span>{" "}
                      Results
                    </h1>
                    <p className='text-white text-line-2 wow bounceInDown'>
                      Our platform connects you with qualified and experienced instructors 
                      to help you achieve your learning goals...
                    </p>
                  </div>
                  <div className='buttons-wrapper flex-align flex-wrap gap-24 mt-40'>
                    <Link
                      href='/my-courses'
                      className='btn btn-main rounded-pill flex-align gap-8  wow bounceInLeft'
                      data-wow-duration='1s'
                      data-wow-delay='.5s'
                    >
                      Meet Our Instructors
                      <i className='ph-bold ph-arrow-up-right d-flex text-lg' />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div
            className='banner-three__item background-img bg-img linear-overlay position-relative'
            style={{
              backgroundImage: `url(${"/assets/images/thumbs/banner-three-img3.png"})`,
            }}
          >
            <div className='container'>
              <div className='row'>
                <div className='col-xxl-6 col-xl-8 col-lg-10 z-1'>
                  <div className='banner-content pe-md-4'>
                    <div className='flex-align gap-8 mb-16 wow bounceInDown'>
                      <span className='text-yellow-600 text-2xl d-flex'>
                       
                      </span>
                      <h5 className='text-yellow-600 mb-0 fw-medium'>
                      
                      </h5>
                    </div>
                    <h1 className='display2 mb-24 text-white fw-medium wow bounceInLeft'>
                      Tailored Courses,
                      <span
                        className='text-yellow-600  wow bounceInRight'
                        data-wow-duration='2s'
                        data-wow-delay='.5s'
                      >
                        {" "}
                        Guaranteed{" "}
                      </span>{" "}
                      Progress
                    </h1>
                    <p className='text-white text-line-2 wow bounceInDown'>
                      Personalized courses for all levels, from languages to computer science, 
                      including competition preparation...
                    </p>
                  </div>
                  <div className='buttons-wrapper flex-align flex-wrap gap-24 mt-40'>
                    <Link
                      href='/my-courses'
                      className='btn btn-main rounded-pill flex-align gap-8  wow bounceInLeft'
                      data-wow-duration='1s'
                      data-wow-delay='.5s'
                    >
                      Register Now
                      <i className='ph-bold ph-arrow-up-right d-flex text-lg' />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Slider>
      <ModalVideo
        channel='youtube'
        autoplay
        isOpen={isOpen}
        videoId='XxVg_s8xAms'
        onClose={() => setIsOpen(false)}
        allowFullScreen
      />
      <style jsx>{`
        .banner-three__item {
          height: 500px;
        }

        .banner-three__item.background-img {
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }

        .banner-content {
          padding: 40px;
          position: relative;
          top: -50px;
        }

        .banner-content .flex-align {
          margin-top: 0;
        }

        .banner-content h1 {
          margin-top: -200px;
        }

        .buttons-wrapper {
          margin-top: 30px;
        }
      `}</style>
    </section>
  );
};

export default BannerThree;
