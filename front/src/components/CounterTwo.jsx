"use client";
import { useState, useEffect } from "react";
import CountUp from "react-countup";
import VisibilitySensor from "react-visibility-sensor";
import axios from "axios";

const CounterTwo = () => {
  const [stats, setStats] = useState({
    totalFormations: 0,
    totalStudents: 0,
    averageRating: 0,
    totalMessages: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || user.role !== 'instructor') {
          console.log('User not logged in or not an instructor');
          return;
        }

        console.log('Fetching stats for instructor:', user.id);
        const response = await fetch(`http://localhost:5000/api/instructors/${user.id}/stats`);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Stats data:', data);
        
        const formations = parseInt(data.totalFormations) || 0;
        const students = parseInt(data.totalStudents) || 0;
        const rating = parseFloat(data.averageRating) || 0;
        const messages = parseInt(data.totalMessages) || 0;
        
        console.log('Values after conversion:', { formations, students, rating, messages });
        
        setStats({
          totalFormations: formations,
          totalStudents: students,
          averageRating: rating,
          totalMessages: messages
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div>Loading statistics...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <section className='counter-three py-120 bg-main-25'>
      <div className='container'>
        <div className='p-16 rounded-16 bg-white'>
          <div className='row gy-4'>
            <div
              className='col-xl-3 col-sm-6 col-xs-6'
              data-aos='fade-up'
              data-aos-duration={200}
            >
              <div className='counter-three-item animation-item h-100 text-center px-16 py-32 rounded-12 bg-main-25 border border-neutral-30'>
                <span className='w-80 h-80 flex-center d-inline-flex bg-white text-main-600 text-40 rounded-circle box-shadow-md mb-24'>
                  <i className='animate__wobble ph ph-book-open' />
                </span>

                <VisibilitySensor partialVisibility offset={{ bottom: 200 }}>
                  {({ isVisible }) => (
                    <h2 className='display-four mb-16 text-neutral-700 counter'>
                      {isVisible ? <CountUp end={stats.totalFormations} /> : 0}
                    </h2>
                  )}
                </VisibilitySensor>
                <span className='text-neutral-500 text-lg'>
                  Total Courses
                </span>
              </div>
            </div>
            <div
              className='col-xl-3 col-sm-6 col-xs-6'
              data-aos='fade-up'
              data-aos-duration={400}
            >
              <div className='counter-three-item animation-item h-100 text-center px-16 py-32 rounded-12 bg-main-two-25 border border-neutral-30'>
                <span className='w-80 h-80 flex-center d-inline-flex bg-white text-main-two-600 text-40 rounded-circle box-shadow-md mb-24'>
                  <i className='animate__wobble ph ph-users-three' />
                </span>
                <VisibilitySensor partialVisibility offset={{ bottom: 200 }}>
                  {({ isVisible }) => (
                    <h2 className='display-four mb-16 text-neutral-700 counter'>
                      {isVisible ? <CountUp end={stats.totalStudents} /> : 0}
                    </h2>
                  )}
                </VisibilitySensor>
                <span className='text-neutral-500 text-lg'>
                  Enrolled Students
                </span>
              </div>
            </div>
            <div
              className='col-xl-3 col-sm-6 col-xs-6'
              data-aos='fade-up'
              data-aos-duration={600}
            >
              <div className='counter-three-item animation-item h-100 text-center px-16 py-32 rounded-12 bg-main-25 border border-neutral-30'>
                <span className='w-80 h-80 flex-center d-inline-flex bg-white text-main-600 text-40 rounded-circle box-shadow-md mb-24'>
                  <i className='animate__wobble ph ph-thumbs-up' />
                </span>
                <VisibilitySensor partialVisibility offset={{ bottom: 200 }}>
                  {({ isVisible }) => (
                    <h2 className='display-four mb-16 text-neutral-700 counter'>
                      {isVisible ? <CountUp end={stats.averageRating} decimals={1} /> : 0}
                    </h2>
                  )}
                </VisibilitySensor>
                <span className='text-neutral-500 text-lg'>
                  Satisfaction Rate
                </span>
              </div>
            </div>
            <div
              className='col-xl-3 col-sm-6 col-xs-6'
              data-aos='fade-up'
              data-aos-duration={800}
            >
              <div className='counter-three-item animation-item h-100 text-center px-16 py-32 rounded-12 bg-main-two-25 border border-neutral-30'>
                <span className='w-80 h-80 flex-center d-inline-flex bg-white text-main-two-600 text-40 rounded-circle box-shadow-md mb-24'>
                  <i className='animate__wobble ph ph-envelope-simple-open' />
                </span>
                <VisibilitySensor partialVisibility offset={{ bottom: 200 }}>
                  {({ isVisible }) => (
                    <h2 className='display-four mb-16 text-neutral-700 counter'>
                      {isVisible ? <CountUp end={stats.totalMessages} /> : 0}
                    </h2>
                  )}
                </VisibilitySensor>
                <span className='text-neutral-500 text-lg'>
                  Messages in Messenger
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CounterTwo;
