"use client";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import Slider from "react-slick";
import { useRouter } from "next/navigation";

const categories = [
  {
    id: 1,
    name: "Languages",
    description: "Learn new languages with our specialized courses",
    icon: "assets/images/icons/category-icon1.png",
    value: "languages",
    colorClass: "main",
  },
  {
    id: 2,
    name: "Computer Science",
    description: "Discover computer science and programming",
    icon: "assets/images/icons/category-icon2.png",
    value: "computerScience",
    colorClass: "main-two",
  },
  {
    id: 3,
    name: "Competitions and Academic Training",
    description: "Prepare for competitions and exams",
    icon: "assets/images/icons/category-icon3.png",
    value: "competitions",
    colorClass: "main-three",
  },
];

const CategoryOne = () => {
  const sliderRef = useRef(null);
  const router = useRouter();
  const [courseCounts, setCourseCounts] = useState({
    languages: 0,
    computerScience: 0,
    competitions: 0
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCourseCounts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch all formations
        const response = await fetch('http://localhost:5000/api/formations');
        
        if (!response.ok) {
          throw new Error('Error fetching data');
        }
        
        const formations = await response.json();
        
        // Count formations by category
        const counts = {
          languages: formations.filter(f => f.category === 'Langues').length,
          computerScience: formations.filter(f => f.category === 'Informatique').length,
          competitions: formations.filter(f => f.category === 'Concours et Formation Scolaire').length
        };
        
        setCourseCounts(counts);
      } catch (error) {
        console.error('Detailed error:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourseCounts();
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
    responsive: [
      {
        breakpoint: 1199,
        settings: {
          slidesToShow: 3,
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

  const handleCategoryClick = (category) => {
    router.push(`/formations?category=${category}`);
  };

  return (
    <section className='category py-120 position-relative z-1 mash-bg-main mash-bg-main-two mash-reverse'>
      <div className='container'>
        <div className='section-heading text-center'>
          <div className='flex-align d-inline-flex gap-8 mb-16 wow bounceInDown'>
            <span className='text-main-600 text-2xl d-flex'>
              <i className='ph-bold ph-book' />
            </span>
            <h5 className='text-main-600 mb-0'>Categories</h5>
          </div>
          <h2 className='mb-24 wow bounceIn'>
            Elevate Your Learning Experience
          </h2>
          <p className='wow bounceInUp'>
            Our platform offers courses in different categories to meet your learning needs
          </p>
        </div>

        {error && (
          <div className="alert alert-danger text-center mb-4">
            {error}
          </div>
        )}

        <Slider ref={sliderRef} {...settings} className='category-item-slider'>
          {categories.map((category) => (
            <div
              key={category.id}
              className={`category-item animation-item h-100 text-center px-16 py-32 rounded-12 bg-${category.colorClass}-25 border border-neutral-30 hover-border-${category.colorClass}-600 transition-2 cursor-pointer`}
              data-aos='fade-up'
              data-aos-duration={200 * category.id}
              onClick={() => handleCategoryClick(category.value)}
            >
              <span className={`w-96 h-96 flex-center d-inline-flex bg-white text-${category.colorClass}-600 text-40 rounded-circle box-shadow-md mb-24`}>
                <img
                  src={category.icon}
                  className='animate__flipInY'
                  alt={category.name}
                />
              </span>
              <h4 className='display-four mb-16 text-neutral-700'>
                {category.name}
              </h4>
              <p className='text-neutral-500 text-lg text-line-2'>
                {category.description}
              </p>
              <div
                className={`py-12 px-24 bg-white rounded-8 border border-neutral-30 mt-28 fw-semibold text-${category.colorClass}-600 hover-bg-${category.colorClass}-600 hover-text-white hover-border-${category.colorClass}-600`}
              >
                {isLoading ? (
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                ) : (
                  `${courseCounts[category.value] || 0} Courses`
                )}
              </div>
            </div>
          ))}
        </Slider>

        <div className='flex-align gap-16 mt-40 justify-content-center'>
          <button
            type='button'
            id='category-prev'
            onClick={() => sliderRef.current.slickPrev()}
            className='slick-arrow flex-center rounded-circle border border-gray-100 hover-border-main-600 text-xl hover-bg-main-600 hover-text-white transition-1 w-48 h-48'
          >
            <i className='ph ph-caret-left' />
          </button>
          <button
            type='button'
            id='category-next'
            onClick={() => sliderRef.current.slickNext()}
            className='slick-arrow flex-center rounded-circle border border-gray-100 hover-border-main-600 text-xl hover-bg-main-600 hover-text-white transition-1 w-48 h-48'
          >
            <i className='ph ph-caret-right' />
          </button>
        </div>
      </div>
    </section>
  );
};

export default CategoryOne;
