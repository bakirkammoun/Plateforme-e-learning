"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import axios from "axios";
import Image from "next/image";

const ChooseUsTwo = () => {
  const [quizResults, setQuizResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchQuizResults = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || user.role !== 'instructor') {
          setError('Unauthorized access');
          setLoading(false);
          return;
        }

        const response = await axios.get(`http://localhost:5000/api/formations/instructor/${user.id}/quiz-results`);
        setQuizResults(response.data);
      } catch (error) {
        console.error('Error fetching results:', error);
        setError('Error fetching quiz results');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizResults();
  }, []);

  const getScoreBadgeClass = (score) => {
    if (score >= 80) return 'bg-success';
    if (score >= 70) return 'bg-warning';
    return 'bg-danger';
  };

  const handleImageError = (e) => {
    e.target.src = '/assets/images/avatar/default-avatar.png';
  };

  const displayedResults = showAll ? quizResults : quizResults.slice(0, 4);

  return (
    <section className='choose-us-two pt-120'>
      <div className='container'>
        <div className='row align-items-end'>
          <div className='col-lg-7 pe-xl-5'>
            <div className='pb-80 mb-lg-5 me-lg-5'>
              <div className='flex-align d-inline-flex gap-8 mb-16 wow bounceInDown'>
                <span className='text-main-600 text-2xl d-flex'>
                  <i className='ph-bold ph-graduation-cap' />
                </span>
                <h5 className='text-main-600 mb-0'>Quiz Statistics</h5>
              </div>
              <h2 className='mb-24 wow bounceIn'>
                Tracking My Students' Performance
              </h2>
              <p className='text-neutral-500 text-line-2 wow bounceInUp'>
                Track your students' quiz and assessment results in real-time.
                Analyze their progress and identify areas for improvement.
              </p>
              <p className='text-neutral-500 text-line-2 mt-24 wow bounceInUp'>
                Detailed reports allow you to adapt your teaching to each student's needs.
              </p>
              <Link
                href='/about'
                className='btn btn-main rounded-pill flex-align d-inline-flex gap-8 mt-40'
              >
                Read More
                <i className='ph-bold ph-arrow-up-right d-flex text-lg' />
              </Link>
            </div>
          </div>
          <div className='col-lg-5'>
            <div
              className='pt-40 pb-90 px-60 bg-neutral-900 rounded-top-4'
              data-aos='fade-up-left'
            >
              <h4 className='mb-28 pb-28 border-bottom border-top-0 border-start-0 border-end-0 border-opacity-25 border-white border-dashed text-white'>
                Students Who Took Quizzes
              </h4>
              {loading ? (
                <div className='text-center text-white'>
                  <div className='spinner-border text-primary' role='status'>
                    <span className='visually-hidden'>Loading...</span>
                  </div>
                </div>
              ) : error ? (
                <div className='text-danger'>{error}</div>
              ) : quizResults.length === 0 ? (
                <div className='text-white text-center'>No quiz results available</div>
              ) : (
                <>
                  <div className='student-list'>
                    {displayedResults.map((result, index) => (
                      <div key={index} className='student-item mb-24'>
                        <div className='flex-between align-items-center'>
                          <div className='d-flex align-items-center gap-3'>
                            <div className='student-avatar'>
                              <img 
                                src={result.studentImage} 
                                alt={result.studentName} 
                                className='rounded-circle' 
                                width="40" 
                                height="40" 
                                onError={handleImageError}
                              />
                            </div>
                            <div>
                              <h6 className='text-white mb-0'>{result.studentName}</h6>
                              <small className='text-neutral-400'>
                                {result.formationTitle} - {result.quizName}
                              </small>
                            </div>
                          </div>
                          <div className='text-end'>
                            <span className={`badge ${getScoreBadgeClass(result.score)}`}>
                              Score: {result.score}%
                            </span>
                            <small className='d-block text-neutral-400 mt-1'>
                              {new Date(result.date).toLocaleDateString('en-US')}
                            </small>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {quizResults.length > 4 && (
                    <div className='text-center mt-4'>
                      <button 
                        className='btn btn-outline-light rounded-pill'
                        onClick={() => setShowAll(!showAll)}
                      >
                        {showAll ? 'Show Less' : 'Show All'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ChooseUsTwo;
