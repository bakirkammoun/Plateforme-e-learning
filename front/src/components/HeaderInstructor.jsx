"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import $ from "jquery";
import { usePathname, useRouter } from "next/navigation";
import axios from 'axios';
import { toast } from 'react-hot-toast';

const HeaderInstructor = () => {
  let pathname = usePathname();
  const [scroll, setScroll] = useState(false);
  const [isMenuActive, setIsMenuActive] = useState(false);
  const [userName, setUserName] = useState('Instructor');
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const isLogoAndMenu =
    pathname !== '/index-2' &&
    pathname !== '/index-2/top-courses' &&
    pathname !== '/index-2/quiz-management' &&
    pathname !== '/index-2/course-comments' &&
    pathname !== '/index-2/upcoming-events' &&
    pathname !== '/index-2/support' &&
    pathname !== '/index-2/archives';

  // Function to check upcoming events
  const checkUpcomingEvents = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/events');
      const allEvents = response.data;
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const tomorrowEvents = allEvents.filter(event => {
        const eventDate = new Date(event.startDate);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate.getTime() === tomorrow.getTime();
      });

      setNotifications(tomorrowEvents.map(event => ({
        id: event._id,
        title: event.title,
        message: `The event "${event.title}" will take place tomorrow!`,
        date: event.startDate
      })));
    } catch (error) {
      console.error('Error checking events:', error);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      import("select2").then(() => {
        const selectElement = $(".js-example-basic-single");
        if (selectElement.length > 0) {
          selectElement.select2();
        }
      });

      // Récupération du nom d'utilisateur
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const userData = JSON.parse(userStr);
          setUserName(userData.firstName || 'Instructor');
        }
      } catch (err) {
        console.error('Erreur:', err);
      }

      // Vérifier les événements au chargement
      checkUpcomingEvents();

      // Vérifier toutes les heures
      const interval = setInterval(checkUpcomingEvents, 3600000);
      return () => clearInterval(interval);
    }

    window.onscroll = () => {
      if (window.pageYOffset < 150) {
        setScroll(false);
      } else if (window.pageYOffset > 150) {
        setScroll(true);
      }
      return () => (window.onscroll = null);
    };

    fetchPendingEnrollments();
  }, []);

  const fetchPendingEnrollments = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get('http://localhost:5000/api/enrollments/instructor/enrollments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const pending = response.data.filter(e => e.status === 'pending').length;
      setPendingCount(pending);
    } catch (error) {
      console.error('Error retrieving enrollments:', error);
    }
  };

  const handleLogout = () => {
    try {
      // Remove all authentication data
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('userRole');
      
      // Show success message
      toast.success('Successfully logged out');
      
      // Redirect to login page with a small delay to allow toast to display
      setTimeout(() => {
        router.push('/sign-in');
      }, 500);
    } catch (error) {
      console.error('Error during logout:', error);
      toast.error('Error during logout');
    }
  };

  const handleProfileClick = () => {
    router.push('/edit-profile');
  };

  const toggleMenu = () => {
    setIsMenuActive(!isMenuActive);
    if (!isMenuActive) {
      document.body.classList.add("scroll-hide-sm");
    } else {
      document.body.classList.remove("scroll-hide-sm");
    }
  };

  const closeMenu = () => {
    setIsMenuActive(false);
    document.body.classList.remove("scroll-hide-sm");
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await axios.get('http://localhost:5000/api/notifications', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        setNotifications(response.data);
        setPendingCount(response.data.filter(n => !n.isRead).length);
      } catch (error) {
        console.error('Erreur lors de la récupération des notifications:', error);
      }
    };

    fetchNotifications();
    // Rafraîchir les notifications toutes les 30 secondes
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = async (notification) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('Token d\'authentification manquant');
        toast.error('Erreur d\'authentification');
        return;
      }

      if (!notification || !notification._id) {
        console.error('Notification invalide:', notification);
        toast.error('Notification invalide');
        return;
      }

      console.log('Tentative de mise à jour de la notification:', {
        notificationId: notification._id,
        type: notification.type,
        isRead: notification.isRead
      });
      
      // Marquer la notification comme lue
      const response = await axios.patch(
        `http://localhost:5000/api/notifications/${notification._id}/read`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Réponse du serveur:', response.data);

      // Mettre à jour l'état local
      setNotifications(prev => 
        prev.map(n => 
          n._id === notification._id 
            ? { ...n, isRead: true }
            : n
        )
      );
      setPendingCount(prev => Math.max(0, prev - 1));

      // Rediriger en fonction du type de notification
      if (notification.type === 'enrollment_request') {
        router.push('/instructor/enrollments');
      } else if (notification.type === 'cv_shared') {
        const cvId = notification.data?.cvId;
        const studentId = notification.data?.studentId;
        if (cvId && studentId) {
          router.push(`/cv/${cvId}?student=${studentId}`);
        } else {
          console.warn('Données manquantes pour la redirection CV:', notification.data);
        }
      } else if (notification.type === 'event_joined' || notification.type === 'event_left') {
        const eventId = notification.data?.eventId;
        if (eventId) {
          router.push(`/event-details?id=${eventId}`);
        } else {
          console.warn('ID d\'événement manquant:', notification.data);
        }
      }
    } catch (error) {
      console.error('Erreur détaillée lors de la mise à jour de la notification:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        notification: notification?._id
      });

      let errorMessage = 'Erreur lors de la mise à jour de la notification';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      toast.error(errorMessage);
    }
  };

  // Fonction pour marquer les messages comme lus
  const markMessagesAsRead = async () => {
    try {
      const token = localStorage.getItem('authToken');
      await axios.post('http://localhost:5000/api/messages/mark-as-read', {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      // Réinitialiser le compteur localement
      setUnreadMessages(0);
    } catch (error) {
      console.error('Erreur lors du marquage des messages comme lus:', error);
    }
  };

  // Fonction pour récupérer le nombre de messages non lus
  const fetchUnreadMessages = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get('http://localhost:5000/api/messages/unread-count', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setUnreadMessages(response.data.count);
    } catch (error) {
      console.error('Erreur lors de la récupération des messages non lus:', error);
    }
  };

  // Gestionnaire de clic sur l'icône de messagerie
  const handleMessageClick = async () => {
    // Marquer les messages comme lus avant de rediriger
    await markMessagesAsRead();
    router.push('/messanger');
  };

  useEffect(() => {
    fetchUnreadMessages();
    const interval = setInterval(fetchUnreadMessages, 30000);

    // Marquer les messages comme lus si on est sur la page de messagerie
    if (pathname === '/messanger') {
      markMessagesAsRead();
    }

    return () => clearInterval(interval);
  }, [pathname]);

  return (
    <>
      <div className={`side-overlay ${isMenuActive ? "show" : ""}`}></div>
      <header
        className={`header ${scroll ? "fixed-header" : ""}`}
        style={{
          position: 'fixed',
          top: 0,
          left: isLogoAndMenu ? 0 : 250,
          width: isLogoAndMenu ? '100%' : 'calc(100% - 250px)',
          zIndex: 1000,
          background: '#fff',
        }}
      >
        <div>
          <nav className='header-inner flex-between gap-8'>
            <div className='header-content-wrapper flex-align flex-grow-1'>
              {/* Logo */}
              {isLogoAndMenu && (
              <div className='logo'>
                <Link href='/index-2' className='link'>
                    <img src='assets/images/logo/logo.png' alt='Logo' width={100}/>
                </Link>
              </div>
              )}

              {/* Menu */}
              {isLogoAndMenu && (
              <div className='header-menu d-lg-block d-none'>
                <ul className='nav-menu flex-align'>
                  <li className='nav-menu__item has-submenu'>
                      <Link href='/index-2' className='nav-menu__link'>Home</Link>
                  </li>
                  <li className='nav-menu__item has-submenu'>
                    <Link href='#' className='nav-menu__link'>Courses</Link>
                    <ul className='nav-submenu scroll-sm'>
                      <li className='nav-submenu__item'>
                          <Link href='/my-courses' className='nav-submenu__link'>My Courses</Link>
                      </li>
                      <li className='nav-submenu__item'>
                          <Link href='/add-course' className='nav-submenu__link'>Add Courses</Link>
                      </li>
                    </ul>
                  </li>
                  <li className='nav-menu__item has-submenu'>
                    <Link href='/add-event' className='nav-menu__link'>Add events</Link>
                  </li>
                  <li className='nav-menu__item has-submenu'>
                    <Link href='/management' className='nav-menu__link'>Management</Link>
                  </li>
                </ul>
              </div>
              )}

              {/* Search Form */}
              <form action='#' className='search-form position-relative d-xl-block d-none' 
                style={{ width: isLogoAndMenu ? '300px' : '400px' }}>
                <input
                  type='text'
                  className='common-input rounded-pill bg-main-25 pe-48 border-neutral-30'
                  placeholder='Search...'
                />
                <button
                  type='submit'
                  className='w-36 h-36 bg-main-600 hover-bg-main-600 rounded-circle flex-center text-md text-white position-absolute top-50 translate-middle-y inset-inline-end-0 me-8'
                >
                  <i className='ph-bold ph-magnifying-glass' />
                </button>
              </form>
            </div>

            {/* Header Right */}
            <div className='header-right flex-align'>
              {/* Messaging Icon */}
              <button 
                onClick={handleMessageClick}
                className='info-action w-52 h-52 bg-main-25 hover-bg-main-600 border border-neutral-30 rounded-circle flex-center text-2xl text-neutral-500 hover-text-white hover-border-main-600 position-relative'
              >
                <i className='ph ph-chat-circle-dots' />
                {unreadMessages > 0 && (
                  <span className="notification-badge">{unreadMessages}</span>
                )}
              </button>

              {/* Notification Icon */}
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className='info-action w-52 h-52 bg-main-25 hover-bg-main-600 border border-neutral-30 rounded-circle flex-center text-2xl text-neutral-500 hover-text-white hover-border-main-600 position-relative'
              >
                <i className='ph ph-bell' />
                {pendingCount > 0 && (
                  <span className="notification-badge">{pendingCount}</span>
                )}
                
                {showNotifications && notifications.length > 0 && (
                  <div className="notification-dropdown">
                    <div className="notification-header">
                      <span className="notification-title">
                        <div className="notification-icon">
                          <i className="ph ph-bell-ringing"></i>
                        </div>
                        <span>Notifications</span>
                      </span>
                      <span className="notification-count">{notifications.length}</span>
                    </div>
                    
                    <div className="notification-list">
                      {notifications.map((notif) => (
                        <div 
                          key={notif._id} 
                          className={`notification-item ${!notif.isRead ? 'unread' : ''}`}
                          onClick={() => handleNotificationClick(notif)}
                        >
                          <div className="notification-content">
                            <div className="notification-icon-wrapper">
                              {notif.type === 'enrollment_request' && <i className="ph ph-user-plus"></i>}
                              {notif.type === 'enrollment_approved' && <i className="ph ph-check-circle"></i>}
                              {notif.type === 'enrollment_rejected' && <i className="ph ph-x-circle"></i>}
                              {notif.type === 'cv_shared' && <i className="ph ph-file-text"></i>}
                              {notif.type === 'event_joined' && <i className="ph ph-user-plus" style={{ color: '#34a853' }}></i>}
                              {notif.type === 'event_left' && <i className="ph ph-user-minus" style={{ color: '#ea4335' }}></i>}
                              {notif.type === 'instructor_followed' && <i className="ph ph-user-plus" style={{ color: '#4285f4' }}></i>}
                            </div>
                            <div className="notification-details">
                              <h6>
                                {notif.type === 'enrollment_request' && 'New Mentoring Request'}
                                {notif.type === 'enrollment_approved' && 'Enrollment Update'}
                                {notif.type === 'enrollment_rejected' && 'Enrollment Update'}
                                {notif.type === 'cv_shared' && 'New CV Shared'}
                                {notif.type === 'event_joined' && 'New Participant'}
                                {notif.type === 'event_left' && 'Participant Removed'}
                                {notif.type === 'instructor_followed' && 'New Follower'}
                              </h6>
                              <p>
                                {notif.type === 'cv_shared' 
                                  ? 'A student has shared their CV with you.\nClick to view it.'
                                  : notif.message}
                              </p>
                              <div className="notification-meta">
                                <span className="notification-time">
                                  <i className="ph ph-clock"></i>
                                  {new Date(notif.createdAt).toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="notification-footer">
                      <button 
                        onClick={() => router.push('/instructor/enrollments')} 
                        className="mini-view-all"
                      >
                        View All Enrollments
                      </button>
                    </div>
                  </div>
                )}
              </button>

              <div className="flex-align gap-8">
                <button 
                  onClick={handleProfileClick}
                  className='info-action w-52 h-52 bg-main-25 hover-bg-main-600 border border-neutral-30 rounded-circle flex-center text-2xl text-neutral-500 hover-text-white hover-border-main-600'
                >
                  <i className='ph ph-user-circle' />
                </button>
                <button 
                  onClick={handleLogout}
                  className='info-action w-52 h-52 bg-main-25 hover-bg-main-600 border border-neutral-30 rounded-circle flex-center text-2xl text-neutral-500 hover-text-white hover-border-main-600'
                >
                  <i className='ph ph-sign-out' />
                </button>
              </div>

              <button
                type='button'
                className='toggle-mobileMenu d-lg-none text-neutral-200 flex-center'
                onClick={toggleMenu}
              >
                <i className='ph ph-list' />
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile Menu */}
      <div className={`mobile-menu scroll-sm d-lg-none d-block ${isMenuActive ? "active" : ""}`}>
        <button type='button' className='close-button' onClick={closeMenu}>
          <i className='ph ph-x' />
        </button>
        <div className='mobile-menu__inner'>
          <Link href='/index-2' className='mobile-menu__logo'>
            <img src='assets/images/logo/logo.png' alt='Logo' />
          </Link>
          <div className='mobile-menu__menu'>
            <ul className='nav-menu flex-align nav-menu--mobile'>
              {/* Suppression des éléments de menu qui seront déplacés vers le dashboard */}
            </ul>
          </div>
        </div>
      </div>

      <style jsx>{`
        .header-inner {
          display: flex;
          align-items: center;
          height: 80px;
        }

        .logo {
          display: flex;
          align-items: center;
          height: 100%;
        }

        .logo .link {
          display: flex;
          align-items: center;
          height: 100%;
        }

        .search-form {
          width: 400px;
          height: 45px;
        }

        .search-form input {
          width: 100%;
          height: 100%;
          padding: 10px 20px;
          font-size: 14px;
          border-radius: 25px;
        }

        .search-form button {
          height: 36px;
          width: 36px;
          right: 5px;
          top: 50%;
          transform: translateY(-50%);
        }

        .notification-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background-color:rgb(255, 2, 2);
          color: white;
          border-radius: 50%;
          min-width: 22px;
          height: 22px;
          font-size: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
          font-weight: 600;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          animation: pulse 2s infinite;
        }

        .notification-dropdown {
          position: absolute;
          top: calc(100% + 15px);
          right: -10px;
          width: 380px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 25px rgba(0, 0, 0, 0.08);
          overflow: hidden;
          z-index: 1050;
          opacity: 0;
          transform: translateY(10px);
          animation: slideIn 0.3s ease forwards;
          border: 1px solid rgba(0, 0, 0, 0.05);
        }

        .notification-header {
          padding: 16px 20px;
          background: #ffffff;
          border-bottom: 1px solid #f0f0f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .notification-title {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 15px;
          font-weight: 600;
          color: #1a1a1a;
        }

        .notification-icon {
          width: 32px;
          height: 32px;
          background: #f0f7ff;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .notification-icon i {
          color: #0d6efd;
          font-size: 16px;
        }

        .notification-count {
          background: #f0f7ff;
          color: #0d6efd;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .notification-list {
          max-height: 380px;
          overflow-y: auto;
          padding: 8px 0;
        }

        .notification-list::-webkit-scrollbar {
          width: 5px;
        }

        .notification-list::-webkit-scrollbar-track {
          background: transparent;
        }

        .notification-list::-webkit-scrollbar-thumb {
          background: #e0e0e0;
          border-radius: 3px;
        }

        .notification-item {
          padding: 12px 20px;
          transition: all 0.2s ease;
          cursor: pointer;
          border-bottom: 1px solid #f5f5f5;
        }

        .notification-item:last-child {
          border-bottom: none;
        }

        .notification-item:hover {
          background-color: #f8f9ff;
        }

        .notification-content {
          display: flex;
          gap: 16px;
          align-items: flex-start;
        }

        .notification-icon-wrapper {
          width: 36px;
          height: 36px;
          background: #f0f7ff;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .notification-icon-wrapper i {
          color: #0d6efd;
          font-size: 16px;
        }

        .notification-details {
          flex-grow: 1;
        }

        .notification-details h6 {
          font-size: 14px;
          font-weight: 600;
          color: #1a1a1a;
          margin: 0 0 4px 0;
        }

        .notification-details p {
          font-size: 13px;
          color: #666;
          margin: 0 0 8px 0;
          line-height: 1.4;
          white-space: pre-line;
        }

        .notification-meta {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .notification-time {
          font-size: 11px;
          color: #888;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .notification-time i {
          font-size: 12px;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
          }
          70% {
            box-shadow: 0 0 0 6px rgba(239, 68, 68, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
          }
        }

        .notification-footer {
          padding: 8px;
          background: #f8f9ff;
          border-top: 1px solid #f0f0f0;
          text-align: center;
        }

        .mini-view-all {
          font-size: 7px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.7px;
          padding: 4px 8px;
          border-radius: 12px;
          background: #fff;
          transition: all 0.2s ease;
          display: inline-block;
          text-decoration: none;
        }

        .mini-view-all:hover {
          background: #0d6efd;
          color: white;
          transform: translateY(-1px);
        }

        @media (max-width: 576px) {
          .notification-dropdown {
            width: 320px;
            right: -50px;
          }
        }

        .badge {
          font-size: 0.75rem;
          padding: 0.25em 0.6em;
          font-weight: 600;
        }

        .nav-submenu__link {
          position: relative;
        }

        .nav-submenu__link:hover .badge {
          transform: scale(1.1);
        }

        .badge {
          transition: transform 0.2s ease;
        }

        .notification-item.unread {
          background-color: #f0f7ff;
          position: relative;
        }

        .notification-item.unread::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 8px;
          transform: translateY(-50%);
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: #0d6efd;
        }

        .message-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background-color:rgb(55, 255, 0);
          color: white;
          border-radius: 50%;
          min-width: 22px;
          height: 22px;
          font-size: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
          font-weight: 600;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          animation: pulse 2s infinite;
        }
      `}</style>
    </>
  );
};

export default HeaderInstructor; 