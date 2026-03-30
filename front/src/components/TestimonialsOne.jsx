"use client";
import { useEffect, useState } from "react";
import axios from "axios";

const TestimonialsOne = () => {
  const [quizResults, setQuizResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const loadSlick = async () => {
      if (typeof window !== "undefined") {
        const $ = (await import("jquery")).default;
        require("slick-carousel");

        const thumbsSlider = $(".testimonials__thumbs-slider");
        const mainSlider = $(".testimonials__slider");

        if (thumbsSlider.length && mainSlider.length) {
          // Initialize the sliders
          thumbsSlider.slick({
            slidesToShow: 1,
            slidesToScroll: 1,
            arrows: false,
            fade: true,
            rtl: $("html").attr("dir") === "rtl",
            asNavFor: ".testimonials__slider",
          });

          mainSlider.slick({
            slidesToShow: 1,
            slidesToScroll: 1,
            asNavFor: ".testimonials__thumbs-slider",
            dots: false,
            arrows: true,
            rtl: $("html").attr("dir") === "rtl",
            focusOnSelect: true,
            nextArrow: "#testimonials-next",
            prevArrow: "#testimonials-prev",
          });
        }
      }
    };

    const fetchQuizResults = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const token = localStorage.getItem('authToken');
        
        if (!user || !token) {
          setError('Please login to view your results');
          setLoading(false);
          return;
        }

        const response = await axios.get(
          `http://localhost:5000/api/formations/student/${user.id}/quiz-results`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        setQuizResults(response.data);
      } catch (error) {
        console.error('Error retrieving results:', error);
        setError('Error retrieving quiz results');
      } finally {
        setLoading(false);
      }
    };

    loadSlick();
    fetchQuizResults();

    return () => {
      if (typeof window !== "undefined") {
        const $ = require("jquery");
        // Destroy sliders on unmount
        $(".testimonials__thumbs-slider").slick("unslick");
        $(".testimonials__slider").slick("unslick");
      }
    };
  }, []);

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? quizResults.length - 1 : prevIndex - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === quizResults.length - 1 ? 0 : prevIndex + 1
    );
  };

  if (loading) {
    return <div className="text-center py-5">Loading results...</div>;
  }

  if (error) {
    return <div className="text-center py-5 text-danger">Error: {error}</div>;
  }

  const currentResult = quizResults.length > 0 ? quizResults[currentIndex] : null;

  return (
    <section className='testimonials py-120 position-relative z-1 bg-main-25'>
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
        <div className='row gy-5'>
          <div className='col-lg-6'>
            <div className='testimonials__thumbs pe-lg-5 me-xxl-5'>
              {currentResult ? (
                <div
                  className='testimonials__thumbs wow bounceIn'
                  data-tilt=''
                  data-tilt-max={15}
                  data-tilt-speed={500}
                  data-tilt-perspective={5000}
                  data-tilt-full-page-listening=''
                >
                  <img 
                    src={currentResult.formationImage || 'assets/images/thumbs/testimonial-img1.png'} 
                    alt={currentResult.formationTitle} 
                    style={{ width: '600px', height: '300px', objectFit: 'cover', marginTop: '100px' }}
                  />
                </div>
              ) : (
                <div
                  className='testimonials__thumbs wow bounceIn'
                  data-tilt=''
                  data-tilt-max={15}
                  data-tilt-speed={500}
                  data-tilt-perspective={5000}
                  data-tilt-full-page-listening=''
                >
                  <img 
                    src='assets/images/thumbs/testimonial-img1.png' 
                    alt='' 
                    style={{ width: '600px', height: '300px', objectFit: 'cover', marginTop: '20px' }}
                  />
                </div>
              )}
            </div>
          </div>
          <div className='col-lg-6'>
            <div className='testimonials__content'>
              <div className='section-heading style-left'>
                <div className='flex-align gap-8 mb-16 wow bounceInDown'>
                  <span className='w-8 h-8 bg-main-600 rounded-circle' />
                  <h5 className='text-main-600 mb-0'>My Quiz Results</h5>
                </div>
                <h2 className='mb-24 wow bounceIn'>
                  Quiz Results from My Courses
                </h2>
                <p className='text-neutral-500 text-line-2 wow bounceInUp'>
                  View your quiz results from completed courses
                </p>
              </div>
              <div className='testimonials__slider'>
                {currentResult ? (
                  <div className='testimonials-item'>
                    <ul
                      className='flex-align gap-8 mb-16'
                      data-aos='fade-left'
                      data-aos-duration={800}
                    >
                      {[...Array(5)].map((_, i) => (
                        <li key={i} className='text-warning-600 text-xl d-flex'>
                          <i className={`ph-fill ${i < Math.floor(currentResult.score / 20) ? 'ph-star' : 'ph-star-half'}`} />
                        </li>
                      ))}
                    </ul>
                    <p
                      className='text-neutral-700'
                      data-aos='fade-left'
                      data-aos-duration={1200}
                    >
                      "I scored {currentResult.score} on the quiz for {currentResult.formationTitle}. 
                      I correctly answered {currentResult.correctAnswers} questions out of {currentResult.totalQuestions} 
                      in {currentResult.timeSpent || 'a few'} minutes."
                    </p>
                    <h4 className='mt-48 mb-8' data-aos='fade-left'>
                      {currentResult.formationTitle}
                    </h4>
                    <span className='text-neutral-700' data-aos='fade-left'>
                      Quiz completed on {new Date(currentResult.completedAt).toLocaleDateString()}
                    </span>
                  </div>
                ) : (
                  <div className='testimonials-item'>
                    <ul
                      className='flex-align gap-8 mb-16'
                      data-aos='fade-left'
                      data-aos-duration={800}
                    >
                      <li className='text-warning-600 text-xl d-flex'>
                        <i className='ph-fill ph-star' />
                      </li>
                      <li className='text-warning-600 text-xl d-flex'>
                        <i className='ph-fill ph-star' />
                      </li>
                      <li className='text-warning-600 text-xl d-flex'>
                        <i className='ph-fill ph-star' />
                      </li>
                      <li className='text-warning-600 text-xl d-flex'>
                        <i className='ph-fill ph-star' />
                      </li>
                      <li className='text-warning-600 text-xl d-flex'>
                        <i className='ph-fill ph-star-half' />
                      </li>
                    </ul>
                    <p
                      className='text-neutral-700'
                      data-aos='fade-left'
                      data-aos-duration={1200}
                    >
                      "You don't have any quiz results yet. Start taking courses and completing quizzes to see your results here."
                    </p>
                    <h4 className='mt-48 mb-8' data-aos='fade-left'>
                      No Results
                    </h4>
                    <span className='text-neutral-700' data-aos='fade-left'>
                      Start your learning journey
                    </span>
                  </div>
                )}
              </div>
              <div className='flex-align gap-16 mt-40'>
                <button
                  type='button'
                  id='testimonials-prev'
                  className='slick-arrow flex-center rounded-circle border border-gray-100 hover-border-main-600 text-xl hover-bg-main-600 hover-text-white transition-1 w-48 h-48'
                  onClick={handlePrev}
                >
                  <i className='ph ph-caret-left' />
                </button>
                <button
                  type='button'
                  id='testimonials-next'
                  className='slick-arrow flex-center rounded-circle border border-gray-100 hover-border-main-600 text-xl hover-bg-main-600 hover-text-white transition-1 w-48 h-48'
                  onClick={handleNext}
                >
                  <i className='ph ph-caret-right' />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsOne;
