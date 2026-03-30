"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const VideoOne = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [lastCourse, setLastCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInstructor, setIsInstructor] = useState(false);
  const [error, setError] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);

  useEffect(() => {
    // Reset isOpen when component mounts or videoUrl changes
    setIsOpen(false);
    const fetchLastCourse = async () => {
      try {
        // Check if user is logged in and is an instructor
        const userRole = localStorage.getItem('userRole');
        const userStr = localStorage.getItem('user');
        
        console.log("User role:", userRole);
        console.log("Raw user data:", userStr);
        
        if (userRole !== 'instructor') {
          console.log("User is not an instructor");
          setLoading(false);
          setIsInstructor(false);
          return;
        }
        
        // Get user ID from user object
        let instructorId = null;
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            console.log("Parsed user data:", user);
            
            // Check all possible ID locations
            instructorId = user.id || user._id || (user.user && (user.user.id || user.user._id));
            console.log("Instructor ID found:", instructorId);
          } catch (e) {
            console.error("Error parsing user data:", e);
          }
        }
        
        if (!instructorId) {
          console.log("No instructor logged in");
          setLoading(false);
          setIsInstructor(false);
          return;
        }
        
        setIsInstructor(true);

        // Use the new API route to get the last course with video
        console.log("Attempting to fetch last course with video...");
        const response = await axios.get(`http://localhost:5000/api/formations/instructor/${instructorId}/last-with-video`);
        
        console.log("API response:", response.data);
        
        if (response.data) {
          setLastCourse(response.data);
          
          // Extract video URL if it exists
          if (response.data.video && response.data.video.url) {
            console.log("Video URL found:", response.data.video.url);
            setVideoUrl(response.data.video.url);
          } else if (response.data.videos && response.data.videos.length > 0 && response.data.videos[0].url) {
            console.log("Video URL found in videos array:", response.data.videos[0].url);
            setVideoUrl(response.data.videos[0].url);
          } else {
            console.log("No video URL found in response");
          }
        }
      } catch (error) {
        console.error("Error fetching last course:", error);
        if (error.response && error.response.status === 404) {
          // No course with video found, try to get the last course without video
          console.log("No course with video found, attempting to fetch last course...");
          try {
            const fallbackResponse = await axios.get(`http://localhost:5000/api/formations/instructor/${instructorId}/last`);
            console.log("Fallback API response:", fallbackResponse.data);
            
            if (fallbackResponse.data) {
              setLastCourse(fallbackResponse.data);
              
              // Check if the course has videos
              if (fallbackResponse.data.videos && fallbackResponse.data.videos.length > 0 && fallbackResponse.data.videos[0].url) {
                console.log("Video URL found in fallback response:", fallbackResponse.data.videos[0].url);
                setVideoUrl(fallbackResponse.data.videos[0].url);
              }
            } else {
              setError("No course found. Create your first course to see it appear here.");
            }
          } catch (fallbackError) {
            console.error("Error in fallback fetch:", fallbackError);
            setError("Unable to fetch your courses. Please try again later.");
            setLastCourse(null);
          }
        } else {
          setError("An error occurred while loading your last course.");
          toast.error("Unable to load the last course");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLastCourse();
  }, []);

  // If user is not an instructor, display appropriate message
  if (!isInstructor) {
  return (
    <section className='video pt-120'>
      <div className='container'>
        <div className='section-heading text-center'>
          <div className='flex-align d-inline-flex gap-8 mb-16'>
            <span className='text-main-600 text-2xl d-flex'>
              <i className='ph-bold ph-book-open' />
            </span>
              <h5 className='text-main-600 mb-0'>Courses</h5>
          </div>
            <h2 className='mb-24 wow bounceIn'>Discover our courses</h2>
          <p className='wow bounceInDown'>
              Explore our catalog of quality courses, created by expert instructors.
          </p>
        </div>
      </div>
      <div className='video-img position-relative half-bg'>
        <div className='container wow bounceIn'>
          <img
              src='/assets/images/thumbs/event-detail-img3.png'
            className='rounded-12 cover-img'
              alt='Courses'
            data-tilt=''
            data-tilt-max={4}
            data-tilt-speed={500}
            data-tilt-perspective={5000}
            data-tilt-transition='1s'
          />
          <span
            onClick={() => setIsOpen(true)}
            className='play-button position-absolute start-50 top-50 translate-middle z-1 w-72 h-72 flex-center bg-main-two-600 text-white rounded-circle text-2xl'
          >
            <i className='ph-fill ph-play' />
          </span>
        </div>
      </div>
        {isOpen && (
          <div className="video-modal">
            <div className="video-modal-content">
              <span className="close-button" onClick={() => setIsOpen(false)}>&times;</span>
              <video 
                width="100%" 
                height="500" 
                controls
                autoPlay
                poster='/assets/images/thumbs/event-detail-img3.png'
              >
                <source src="https://www.youtube.com/embed/XxVg_s8xAms" type="video/mp4" />
                Your browser does not support video playback.
              </video>
            </div>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className='video pt-120 bg-gradient-to-b from-white to-gray-50'>
      <div className='container'>
        <div className='section-heading text-center'>
          <div className='flex-align d-inline-flex gap-8 mb-16 wow bounceInDown'>
            <span className='text-main-600 text-2xl d-flex'>
              <i className='ph-bold ph-book-open' />
            </span>
            <h5 className='text-main-600 mb-0'>Your latest course</h5>
          </div>
          <h2 className='mb-24 wow bounceIn text-4xl font-bold'>
            {lastCourse ? lastCourse.title : "No course available"}
          </h2>
          <p className='wow bounceInDown text-lg text-gray-600 max-w-3xl mx-auto'>
            {lastCourse 
              ? lastCourse.description 
              : error || "You haven't created any courses yet. Start creating your first course now!"}
          </p>
        </div>
      </div>
      <div className='video-img position-relative half-bg'>
        <div className='container wow bounceIn'>
          {loading ? (
            <div className="text-center py-12">
              <div className="spinner-border text-main-600" role="status" style={{ width: '3rem', height: '3rem' }}>
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : lastCourse && videoUrl ? (
            <div className="video-container shadow-2xl rounded-2xl overflow-hidden transform hover:scale-[1.02] transition-transform duration-300">
              <div className="video-player bg-black relative">
                {!isOpen ? (
                  <div className="relative">
                    <img
                      src='/assets/images/thumbs/event-detail-img3.png'
                      className='w-full h-[600px] object-cover'
                      alt='Placeholder'
                    />
                    <span
                      onClick={() => setIsOpen(true)}
                      className='play-button position-absolute start-50 top-50 translate-middle z-1 w-72 h-72 flex-center bg-main-two-600 text-white rounded-circle text-2xl cursor-pointer hover:bg-main-two-700 transition-colors'
                    >
                      <i className='ph-fill ph-play' />
                    </span>
                  </div>
                ) : (
                  <>
                    {videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') ? (
                      <iframe 
                        width="100%" 
                        height="600" 
                        src={`https://www.youtube.com/embed/${videoUrl.split('v=')[1] || videoUrl.split('/').pop()}?autoplay=1`} 
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
        allowFullScreen
                        className="rounded-lg"
                      ></iframe>
                    ) : (
                      <video 
                        width="100%" 
                        height="600" 
                        controls
                        className="rounded-lg"
                        poster='/assets/images/thumbs/event-detail-img3.png'
                        autoPlay
                      >
                        <source src={videoUrl} type="video/mp4" />
                        Your browser does not support video playback.
                      </video>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl shadow-lg p-8">
              <div className="text-6xl mb-4">📚</div>
              <p className="text-xl text-gray-600">No video available for this course</p>
              {error && <p className="text-red-500 mt-4 font-medium">{error}</p>}
            </div>
          )}
        </div>
      </div>
      <style jsx>{`
        .video-container {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          background: white;
          border-radius: 1rem;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }
        .video-player {
          width: 100%;
          background-color: #000;
          border-radius: 1rem;
          overflow: hidden;
        }
        @media (max-width: 768px) {
          .video-container {
            margin: 0 1rem;
          }
        }
      `}</style>
    </section>
  );
};

export default VideoOne;
