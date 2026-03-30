"use client";
import CountUp from "react-countup";
import VisibilitySensor from "react-visibility-sensor";
import { useState, useEffect } from "react";
import axios from "axios";

const CounterOne = () => {
  const [instructorCount, setInstructorCount] = useState(0);
  const [followedCount, setFollowedCount] = useState(0);
  const [totalHours, setTotalHours] = useState(0);
  const [purchasedCount, setPurchasedCount] = useState(0);
  const [joinedEventsCount, setJoinedEventsCount] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get authentication data
        const token = localStorage.getItem('authToken');
        const userStr = localStorage.getItem('user');

        console.log('Token present:', !!token);
        console.log('User string present:', !!userStr);

        if (!token || !userStr) {
          console.log('Missing authentication');
          return;
        }

        let userData;
        try {
          userData = JSON.parse(userStr);
          console.log('User data:', userData);
        } catch (e) {
          console.error('Error parsing user data:', e);
          return;
        }

        if (!userData || !userData.id) {
          console.error('Missing user ID in:', userData);
          return;
        }

        const userId = userData.id;
        console.log('User ID:', userId);

        const headers = {
          'Authorization': `Bearer ${token}`
        };

        // Get total number of instructors
        const instructorsResponse = await axios.get('http://localhost:5000/api/instructors/count');
        console.log('Instructors response:', instructorsResponse.data);
        setInstructorCount(instructorsResponse.data.count);

        // Get number of joined events
        const eventsResponse = await axios.get(
          `http://localhost:5000/api/events/user/${userId}/joined-count`,
          { headers }
        );
        console.log('Joined events response:', eventsResponse.data);
        setJoinedEventsCount(eventsResponse.data.count);

        // Get number of followed instructors
        const followedResponse = await axios.get(
          `http://localhost:5000/api/instructors/user/${userId}/followed`,
          { headers }
        );
        console.log('Followed instructors response:', followedResponse.data);
        const followedCount = Array.isArray(followedResponse.data) ? followedResponse.data.length : 0;
        console.log('Setting followed count to:', followedCount);
        setFollowedCount(followedCount);

        // Get total training hours
        const hoursResponse = await axios.get(
          `http://localhost:5000/api/formations/user/${userId}/total-hours`,
          { headers }
        );
        
        console.log('Training hours response:', hoursResponse.data);
        
        if (hoursResponse.data) {
          const hours = hoursResponse.data.totalHours || 0;
          console.log('Setting total hours to:', hours);
          setTotalHours(hours);
        }

        // Get number of purchased formations
        const purchasedResponse = await axios.get(
          `http://localhost:5000/api/formations/user/${userId}/purchased-count`,
          { headers }
        );
        console.log('Purchased formations response:', purchasedResponse.data);
        setPurchasedCount(purchasedResponse.data.count || 0);

      } catch (error) {
        console.error('Detailed error:', error.response?.data || error.message);
        setError(error.message);
      }
    };

    fetchData();
  }, []);

  if (error) {
    return <div className="alert alert-danger">Error: {error}</div>;
  }

  return (
    <section className='counter py-120'>
      <div className='container'>
        <div className='row gy-4'>
          <div
            className='col-xl-3 col-sm-6 col-xs-6'
            data-aos='fade-up'
            data-aos-duration={200}
          >
            <div className='counter-item animation-item h-100 text-center px-16 py-32 rounded-12 bg-main-25 border border-neutral-30'>
              <span className='w-80 h-80 flex-center d-inline-flex bg-white text-main-600 text-40 rounded-circle box-shadow-md mb-24'>
                <i className='animate__wobble ph ph-calendar-check' />
              </span>

              <VisibilitySensor partialVisibility offset={{ bottom: 200 }}>
                {({ isVisible }) => (
                  <h2 className='display-four mb-16 text-neutral-700 counter'>
                    {isVisible ? <CountUp end={joinedEventsCount} /> : null}E
                  </h2>
                )}
              </VisibilitySensor>
              <span className='text-neutral-500 text-lg'>
                Number of joined events
              </span>
            </div>
          </div>
          <div
            className='col-xl-3 col-sm-6 col-xs-6'
            data-aos='fade-up'
            data-aos-duration={400}
          >
            <div className='counter-item animation-item h-100 text-center px-16 py-32 rounded-12 bg-main-two-25 border border-neutral-30'>
              <span className='w-80 h-80 flex-center d-inline-flex bg-white text-main-two-600 text-40 rounded-circle box-shadow-md mb-24'>
                <i className='animate__wobble ph ph-video-camera' />
              </span>
              <VisibilitySensor partialVisibility offset={{ bottom: 200 }}>
                {({ isVisible }) => {
                  console.log('Visibility changed:', isVisible);
                  console.log('Total hours value:', totalHours);
                  return (
                    <h2 className='display-four mb-16 text-neutral-700 counter'>
                      <CountUp 
                        end={totalHours} 
                        duration={2.5}
                        separator=" "
                        decimals={0}
                        decimal=","
                      />
                      <span className="text-lg ml-2">H</span>
                    </h2>
                  );
                }}
              </VisibilitySensor>
              <span className='text-neutral-500 text-lg'>
                Number of training hours
              </span>
            </div>
          </div>
          <div
            className='col-xl-3 col-sm-6 col-xs-6'
            data-aos='fade-up'
            data-aos-duration={600}
          >
            <div className='counter-item animation-item h-100 text-center px-16 py-32 rounded-12 bg-main-25 border border-neutral-30'>
              <span className='w-80 h-80 flex-center d-inline-flex bg-white text-main-600 text-40 rounded-circle box-shadow-md mb-24'>
                <i className='animate__wobble ph ph-shopping-cart' />
              </span>
              <VisibilitySensor partialVisibility offset={{ bottom: 200 }}>
                {({ isVisible }) => (
                  <h2 className='display-four mb-16 text-neutral-700 counter'>
                    {isVisible ? <CountUp end={purchasedCount} duration={2.5} /> : null}F
                  </h2>
                )}
              </VisibilitySensor>
              <span className='text-neutral-500 text-lg'>
                Purchased formations
              </span>
            </div>
          </div>
          <div
            className='col-xl-3 col-sm-6 col-xs-6'
            data-aos='fade-up'
            data-aos-duration={800}
          >
            <div className='counter-item animation-item h-100 text-center px-16 py-32 rounded-12 bg-main-two-25 border border-neutral-30'>
              <span className='w-80 h-80 flex-center d-inline-flex bg-white text-main-two-600 text-40 rounded-circle box-shadow-md mb-24'>
                <i className='animate__wobble ph ph-users-three' />
              </span>
              <VisibilitySensor partialVisibility offset={{ bottom: 200 }}>
                {({ isVisible }) => {
                  console.log('Followed count value:', followedCount);
                  return (
                    <h2 className='display-four mb-16 text-neutral-700 counter'>
                      {isVisible ? <CountUp end={followedCount} duration={2.5} /> : null}E
                    </h2>
                  );
                }}
              </VisibilitySensor>
              <span className='text-neutral-500 text-lg'>
                Followed instructors
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CounterOne;
