"use client";

import Link from "next/link";
import { useRouter } from 'next/navigation';
import { useState, useEffect } from "react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const InstructorAll = () => {
  const router = useRouter();
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ratedInstructors, setRatedInstructors] = useState(new Set());
  const [hoveredStars, setHoveredStars] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialization, setSelectedSpecialization] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [specializations] = useState({
    languages: {
      name: "Languages",
      options: ["Français", "Espagnol", "Anglais", "Allemand", "Italien"]
    },
    computerScience: {
      name: "Computer Science",
      options: [
        "IT Development",
        "Artificial Intelligence and Big Data",
        "Graphics and Digital Marketing",
        "Office automation"
      ]
    },
    competitions: {
      name: "Competitions and School Training",
      options: [
        "Preparation for Competitions",
        "Training for All Levels"
      ]
    }
  });
  const instructorsPerPage = 9;

  useEffect(() => {
    const fetchInstructors = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/instructors", {
          headers: {
            'Content-Type': 'application/json'
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch instructors: ${response.statusText}`);
        }

        const data = await response.json();
        if (!Array.isArray(data)) {
          throw new Error("Invalid data format received from server");
        }
        
        setInstructors(data);
        
        setLoading(false);

        // Load rated instructors
        const savedRatedInstructors = localStorage.getItem('ratedInstructors');
        if (savedRatedInstructors) {
          setRatedInstructors(new Set(JSON.parse(savedRatedInstructors)));
        }
      } catch (err) {
        console.error("Error fetching instructors:", err);
        setError("Failed to load instructors. Please try again later.");
        setLoading(false);
      }
    };

    fetchInstructors();
  }, []);

  // Filter instructors based on search term and specialization
  const filteredInstructors = instructors.filter(instructor => {
    if (!instructor) return false;
    const fullName = `${instructor.firstName} ${instructor.lastName}`.toLowerCase();
    const searchMatch = fullName.includes(searchTerm.toLowerCase());
    const specializationMatch = !selectedSpecialization || instructor.specialization === selectedSpecialization;
    return searchMatch && specializationMatch;
  });

  // Calculate pagination
  const indexOfLastInstructor = currentPage * instructorsPerPage;
  const indexOfFirstInstructor = indexOfLastInstructor - instructorsPerPage;
  const currentInstructors = filteredInstructors.slice(indexOfFirstInstructor, indexOfLastInstructor);
  const totalPages = Math.ceil(filteredInstructors.length / instructorsPerPage);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRating = async (instructorId, rating) => {
    try {
      if (ratedInstructors.has(instructorId)) {
        toast.warning('You have already rated this instructor');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/instructors/${instructorId}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rating })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit rating');
      }

      const ratingData = await response.json();

      // Mettre à jour l'état local avec les nouvelles données de notation
      const updatedInstructors = instructors.map(instructor => {
        if (instructor._id === instructorId) {
          return {
            ...instructor,
            rating: ratingData.rating,
            numberOfRatings: ratingData.numberOfRatings
          };
        }
        return instructor;
      });

      setInstructors(updatedInstructors);
      
      // Sauvegarder l'instructeur comme déjà noté
      const newRatedInstructors = new Set(ratedInstructors);
      newRatedInstructors.add(instructorId);
      setRatedInstructors(newRatedInstructors);
      localStorage.setItem('ratedInstructors', JSON.stringify([...newRatedInstructors]));

      toast.success('Rating submitted successfully');
    } catch (error) {
      console.error('Error rating instructor:', error);
      toast.error(error.message || 'Failed to submit rating');
    }
  };

  const handleStarHover = (instructorId, starIndex) => {
    if (!ratedInstructors.has(instructorId)) {
      setHoveredStars({
        ...hoveredStars,
        [instructorId]: starIndex
      });
    }
  };

  const handleStarLeave = (instructorId) => {
    if (!ratedInstructors.has(instructorId)) {
      setHoveredStars({
        ...hoveredStars,
        [instructorId]: 0
      });
    }
  };

  const renderStars = (instructorId, currentRating) => {
    const stars = [];
    const isRated = ratedInstructors.has(instructorId);
    const hoverRating = hoveredStars[instructorId] || 0;

    for (let i = 1; i <= 5; i++) {
      const isFilled = i <= (hoverRating || currentRating);
      stars.push(
        <button
          key={i}
          onClick={() => handleRating(instructorId, i)}
          onMouseEnter={() => handleStarHover(instructorId, i)}
          onMouseLeave={() => handleStarLeave(instructorId)}
          disabled={isRated}
          className={`star-btn ${isRated ? 'disabled' : ''} ${isFilled ? 'filled' : ''}`}
          style={{
            background: 'none',
            border: 'none',
            cursor: isRated ? 'default' : 'pointer',
            padding: '0 2px',
            transition: 'all 0.2s ease'
          }}
        >
          <i 
            className={`ph-fill ph-star`}
            style={{
              color: isFilled ? '#ffc107' : '#e4e5e9',
              fontSize: '20px'
            }}
          />
        </button>
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="flex-center py-120">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-120 text-center">
        <p className="text-danger">Error: {error}</p>
      </div>
    );
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <section className="instructor py-120 position-relative z-1">
        <img
          src="assets/images/shapes/shape2.png"
          alt=""
          className="shape one animation-scalation"
        />
        <img
          src="assets/images/shapes/shape6.png"
          alt=""
          className="shape six animation-scalation"
        />
        <div className="container">
          <div className="section-heading text-center">
            <h2 className="mb-24">Course Instructors</h2>
            <p className="">
              Join us on this journey of discovery, growth, and transformation.
              Together, let's shape a brighter future
            </p>
          </div>

          {/* Search and Filter Section */}
          <div className="search-filter-section mb-40">
            <div className="row g-4">
              <div className="col-lg-7">
                <form action="#" className="search-form position-relative w-100">
                  <input
                    type="text"
                    className="common-input rounded-pill bg-main-25 pe-48 border-neutral-30 w-100"
                    placeholder="Search instructors by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="w-36 h-36 bg-main-600 hover-bg-main-700 rounded-circle flex-center text-md text-white position-absolute top-50 translate-middle-y inset-inline-end-0 me-8"
                  >
                    <i className="ph-bold ph-magnifying-glass" />
                  </button>
                </form>
              </div>
              <div className="col-lg-5">
                <select
                  className="common-input rounded-pill bg-main-25 border-neutral-30 w-100 text-neutral-800"
                  value={selectedSpecialization}
                  onChange={(e) => setSelectedSpecialization(e.target.value)}
                >
                  <option value="">All Specializations</option>
                  {Object.entries(specializations).map(([key, category]) => (
                    <optgroup key={key} label={category.name}>
                      {category.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="row gy-4">
            {currentInstructors.filter(instructor => instructor !== null).map((instructor) => (
              <div key={instructor._id} className="col-lg-4 col-sm-6">
                <div className="instructor-item scale-hover-item bg-white rounded-16 p-12 h-100 border border-neutral-30">
                  <div className="rounded-12 overflow-hidden position-relative bg-dark-yellow">
                    <Link
                      href={`/instructor-details?id=${instructor._id}`}
                      className="w-100 h-100 d-flex align-items-end"
                    >
                      <img
                        src={instructor.profileImage || "/assets/images/thumbs/default-instructor.png"}
                        alt={`${instructor.firstName} ${instructor.lastName}`}
                        className="scale-hover-item__img rounded-12 cover-img transition-2"
                      />
                    </Link>
                  </div>
                  <div className="p-24 position-relative">
                    <div className="social-infos">
                      <ul className="social-list flex-align flex-column gap-12 mb-12">
                        {instructor.socialLinks?.facebook && (
                          <li className="social-list__item">
                            <a
                              href={instructor.socialLinks.facebook}
                              className="flex-center border border-white text-white w-44 h-44 rounded-circle text-xl hover-text-main hover-bg-white"
                            >
                              <i className="ph-bold ph-facebook-logo" />
                          </a>
                        </li>
                          )}
                          {instructor.socialLinks?.twitter && (
                            <li className="social-list__item">
                          <a
                                href={instructor.socialLinks.twitter}
                                className="flex-center border border-white text-white w-44 h-44 rounded-circle text-xl hover-text-main hover-bg-white"
                          >
                                <i className="ph-bold ph-twitter-logo" />
                          </a>
                        </li>
                          )}
                          {instructor.socialLinks?.linkedin && (
                            <li className="social-list__item">
                          <a
                                href={instructor.socialLinks.linkedin}
                                className="flex-center border border-white text-white w-44 h-44 rounded-circle text-xl hover-text-main hover-bg-white"
                          >
                                <i className="ph-bold ph-linkedin-logo" />
                          </a>
                        </li>
                          )}
                      </ul>
                    </div>
                    <div className="">
                      <h4 className="mb-28 pb-24 border-bottom border-neutral-50 mb-24 border-dashed border-0">
                    <Link
                          href={`/instructor-details?id=${instructor._id}`}
                          className="link text-line-2"
                        >
                          {instructor.firstName} {instructor.lastName}
                      </Link>
                    </h4>
                      <div className="flex-between gap-8 flex-wrap mb-16">
                        <div className="flex-align gap-8">
                          <span className="text-neutral-700 text-2xl d-flex">
                            <i className="ph-bold ph-lightbulb" />
                        </span>
                          <span className="text-neutral-700 text-lg fw-medium">
                            {instructor.specialization || "Instructor"}
                        </span>
                      </div>
                        <div className="flex-align gap-8">
                          <span className="text-neutral-700 text-2xl d-flex">
                            <i className="ph-bold ph-book-open" />
                        </span>
                          <span className="text-neutral-700 text-lg fw-medium">
                            {instructor.courses?.length || 0} Course{instructor.courses?.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      </div>
                      <div className="flex-between gap-8 flex-wrap">
                        <div className="flex-align gap-8">
                          <span className="text-neutral-700 text-2xl d-flex">
                            <i className="ph-bold ph-users" />
                          </span>
                          <span className="text-neutral-700 text-lg fw-medium">
                            {instructor.followers?.length || 0} Followers
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="pt-24 border-top border-neutral-50 mt-28 border-dashed border-0">
                      <Link
                        href={`/instructor-details?id=${instructor._id}`}
                        className="flex-align gap-8 text-main-600 hover-text-decoration-underline transition-1 fw-semibold"
                      >
                        View Profile
                        <i className="ph ph-arrow-right" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="course-pagination mt-60">
              <nav>
                <ul className="pagination gap-3 justify-content-center">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button
                      className="page-link rounded-8 border-neutral-40 bg-white text-neutral-900 hover-bg-main-600 hover-text-white"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <i className="ph-bold ph-caret-left"></i>
                    </button>
                  </li>
                  {[...Array(totalPages)].map((_, index) => (
                    <li
                      key={index + 1}
                      className={`page-item`}
                    >
                      <button
                        className={`page-link rounded-8 border-neutral-40 hover-bg-main-600 hover-text-white ${
                          currentPage === index + 1 
                          ? 'bg-main-600 text-white border-main-600' 
                          : 'bg-white text-neutral-900'
                        }`}
                        onClick={() => handlePageChange(index + 1)}
                      >
                        {index + 1}
                      </button>
                    </li>
                  ))}
                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button
                      className="page-link rounded-8 border-neutral-40 bg-white text-neutral-900 hover-bg-main-600 hover-text-white"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <i className="ph-bold ph-caret-right"></i>
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      </section>
      <style jsx global>{`
        .rating-container {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .stars-container {
          display: flex;
          align-items: center;
        }
        .rating-count {
          font-size: 14px;
          color: #6c757d;
        }
        .star-btn {
          transition: transform 0.2s ease;
          position: relative;
          z-index: 1;
        }
        .star-btn:not(.disabled):hover {
          transform: scale(1.2);
        }
        .star-btn.disabled {
          opacity: 0.7;
          cursor: default;
        }
        .star-btn:not(.disabled):hover i {
          color: #ffc107 !important;
        }
        .star-btn:not(.disabled):hover ~ button i {
          color: #e4e5e9 !important;
        }
        .stars-container:hover .star-btn:not(.disabled):not(:hover) i {
          color: #e4e5e9;
        }
      `}</style>
    </>
  );
};

export default InstructorAll;
