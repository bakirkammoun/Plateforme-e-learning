"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import axios from 'axios';
import { toast } from 'react-hot-toast';

const HeaderStudent = () => {
  let pathname = usePathname();
  const [scroll, setScroll] = useState(false);
  const [isMenuActive, setIsMenuActive] = useState(false);
  const [userName, setUserName] = useState('Student');
  const [userRole, setUserRole] = useState('');
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const addToCart = (formation) => {
    setCartItems(prev => [...prev, formation]);
  };

  const removeFromCart = (formationId) => {
    const updatedCartItems = cartItems.filter(item => item._id !== formationId);
    setCartItems(updatedCartItems);
    localStorage.setItem('cartItems', JSON.stringify(updatedCartItems));
    toast.success('Item removed from cart');
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price || 0), 0);
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('❌ Missing token');
        return;
      }

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      console.log('👤 Connected user:', user);
      
      console.log('🔄 Fetching notifications...');
      const response = await axios.get('http://localhost:5000/api/notifications', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📨 Server response:', {
        status: response.status,
        notifications: response.data
      });

      if (Array.isArray(response.data)) {
        // Process all notifications
        const processedNotifications = response.data.map(notification => {
          console.log('Processing notification:', notification);

          switch (notification.type) {
            case 'certificate_generated':
              if (notification.data?.certificateData) {
                const { formation, mention, score } = notification.data.certificateData;
                return {
                  ...notification,
                  title: '🎓 New Certificate Available',
                  message: `Congratulations! Your certificate for "${formation}" is available (Grade: ${mention}, Score: ${score}/20)`,
                  icon: 'ph-certificate',
                  color: '#E8F5E9'
                };
              }
              break;

            case 'inscription_approved':
              return {
                ...notification,
                title: '✅ Registration Approved',
                message: `Your registration has been approved${notification.data?.formation ? ` for "${notification.data.formation}"` : ''}`,
                icon: 'ph-check-circle',
                color: '#E8F5E9'
              };

            case 'inscription_rejected':
              return {
                ...notification,
                title: '❌ Registration Rejected',
                message: `Your registration has been rejected${notification.data?.formation ? ` for "${notification.data.formation}"` : ''}`,
                icon: 'ph-x-circle',
                color: '#FFEBEE'
              };

            case 'supervision_accepted':
              return {
                ...notification,
                title: '👨‍🏫 Supervision Accepted',
                message: notification.message || 'Your supervision request has been accepted',
                icon: 'ph-check-circle',
                color: '#E8F5E9'
              };

            case 'supervision_rejected':
              return {
                ...notification,
                title: '❌ Supervision Rejected',
                message: notification.message || 'Your supervision request has been rejected',
                icon: 'ph-x-circle',
                color: '#FFEBEE'
              };

            case 'supervision_stopped':
              return {
                ...notification,
                title: '🛑 Supervision Stopped',
                message: notification.message || 'Your supervision has been stopped',
                icon: 'ph-stop-circle',
                color: '#FFEBEE'
              };

            case 'event_reminder':
              return {
                ...notification,
                title: '📅 Event Reminder',
                message: notification.message || 'You have an upcoming event',
                icon: 'ph-calendar',
                color: '#E3F2FD'
              };

            default:
              return {
                ...notification,
                title: notification.title || 'Notification',
                message: notification.message || 'New notification',
                icon: 'ph-bell',
                color: '#F5F5F5'
              };
          }
        }).filter(Boolean);

        // Get events the student is enrolled in
        try {
          const token = localStorage.getItem('authToken');
          if (!token) {
            console.error('❌ Missing token');
            return;
          }

          const eventsResponse = await axios.get('http://localhost:5000/api/events/joined', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          const joinedEvents = eventsResponse.data;
          
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(0, 0, 0, 0);

          const tomorrowEvents = joinedEvents.filter(event => {
            const eventDate = new Date(event.startDate);
            eventDate.setHours(0, 0, 0, 0);
            return eventDate.getTime() === tomorrow.getTime();
          });

          if (tomorrowEvents.length > 0) {
            // Create notifications for each event
            const eventNotifications = tomorrowEvents.map(event => {
              return {
                _id: `event_${event._id}`,
                type: 'event_reminder',
                title: '📅 Event Reminder',
                message: `The event "${event.title}" will take place tomorrow at ${event.startTime || 'the scheduled time'}!`,
                icon: 'ph-calendar',
                color: '#E3F2FD',
                data: {
                  eventId: event._id,
                  eventTitle: event.title,
                  eventDate: event.startDate,
                  eventTime: event.startTime,
                  eventLocation: event.location
                },
                isRead: false,
                createdAt: new Date().toISOString()
              };
            });

            // Add event notifications to the notifications list
            processedNotifications.push(...eventNotifications);
          }
        } catch (error) {
          console.error('❌ Error fetching events:', error);
        }

        // Sort notifications by date (most recent first)
        processedNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        console.log('Processed notifications:', processedNotifications);

        setNotifications(processedNotifications);
        const unreadCount = processedNotifications.filter(n => !n.isRead).length;
        setPendingCount(unreadCount);

        // Update notification badge
        if (unreadCount > 0) {
          document.title = `(${unreadCount}) New notifications`;
        } else {
          document.title = 'Dashboard';
        }
      }
    } catch (error) {
      console.error('❌ Error fetching notifications:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        router.push('/sign-in');
      }
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const initSelect2 = async () => {
        try {
          const $ = (await import('jquery')).default;
          window.jQuery = $;
          window.$ = $;
          await import("select2");
          const selectElement = $(".js-example-basic-single");
          if (selectElement.length > 0) {
            selectElement.select2();
          }
        } catch (error) {
          console.error("Error initializing select2:", error);
        }
      };

      initSelect2();

      // Get user role from localStorage
      const userRole = localStorage.getItem('userRole');
      setUserRole(userRole);

      // Récupération du nom d'utilisateur et du rôle
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const userData = JSON.parse(userStr);
          setUserName(userData.firstName || 'Student');
        }
      } catch (err) {
        console.error('Error:', err);
      }

      // Initialiser le panier depuis le localStorage
      const savedCartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
      setCartItems(savedCartItems);

      // Écouter les mises à jour du panier
      const handleCartUpdate = () => {
        const updatedCartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
        setCartItems(updatedCartItems);
      };

      window.addEventListener('cartUpdated', handleCartUpdate);
      
      return () => {
        window.removeEventListener('cartUpdated', handleCartUpdate);
      };
    }

    window.onscroll = () => {
      if (window.pageYOffset < 150) {
        setScroll(false);
      } else if (window.pageYOffset > 150) {
        setScroll(true);
      }
      return () => (window.onscroll = null);
    };
  }, []);

  useEffect(() => {
    // Charger les notifications au montage
    fetchNotifications();

    // Mettre en place l'intervalle de rafraîchissement
    const interval = setInterval(fetchNotifications, 30000); // 30 secondes

    // Écouter l'événement de génération de certificat
    const handleCertificateGenerated = (event) => {
      console.log('🎓 Événement de certificat généré reçu:', event.detail);
      
      // Ajouter la notification à la liste
      if (event.detail && event.detail.certificateData) {
        const { certificateData, notificationId } = event.detail;
        
        // Créer une nouvelle notification
        const newNotification = {
          _id: notificationId,
          type: 'certificate_generated',
          message: `Félicitations ! Votre certificat pour la formation "${certificateData.formation}" est disponible`,
          data: {
            certificateData
          },
          isRead: false,
          createdAt: new Date().toISOString()
        };
        
        // Ajouter la notification à la liste
        setNotifications(prev => [newNotification, ...prev]);
        
        // Mettre à jour le compteur
        setPendingCount(prev => prev + 1);
        
        // Afficher un toast
        toast.success('🎓 Nouveau certificat disponible !');
        
        // Mettre à jour le titre de la page
        document.title = '(1) Nouveau certificat disponible';
      }
    };

    // Ajouter l'écouteur d'événement
    window.addEventListener('certificateGenerated', handleCertificateGenerated);

    // Nettoyer l'intervalle et l'écouteur d'événement au démontage
    return () => {
      clearInterval(interval);
      window.removeEventListener('certificateGenerated', handleCertificateGenerated);
    };
  }, []); // Dépendances vides pour n'exécuter qu'au montage

  const handleNotificationClick = async (notification) => {
    try {
      console.log('Notification cliquée:', notification);
      const token = localStorage.getItem('authToken');
      
      // Si c'est une notification d'événement, la marquer comme lue localement
      if (notification._id.startsWith('event_')) {
        setNotifications(prev => 
          prev.map(n => 
            n._id === notification._id 
              ? { ...n, isRead: true }
              : n
          )
        );
        setPendingCount(prev => Math.max(0, prev - 1));
        router.push('/my-events-join');
        return;
      }
      
      // Pour les autres types de notifications, utiliser l'API
      await axios.patch(
        `http://localhost:5000/api/notifications/${notification._id}/read`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      // Mettre à jour l'état local
      setNotifications(prev => 
        prev.map(n => 
          n._id === notification._id 
            ? { ...n, isRead: true }
            : n
        )
      );
      setPendingCount(prev => Math.max(0, prev - 1));

      // Gérer les différents types de notifications
      switch (notification.type) {
        case 'supervision_accepted':
          toast.success('Votre demande d\'encadrement a été acceptée');
          router.push('/messanger');
          break;
        case 'supervision_rejected':
          toast.error('Votre demande d\'encadrement a été refusée');
          router.push('/instructor');
          break;
        case 'supervision_stopped':
          toast.error('Votre encadrement a été arrêté');
          router.push('/instructor');
          break;
        case 'certificate_generated':
          toast.success('Votre certificat est disponible !');
          if (notification.data?.certificateData) {
            const { formation, student, mention, score, date } = notification.data.certificateData;
            
            // Construire l'URL avec les paramètres
            const queryParams = new URLSearchParams({
              notificationId: notification._id,
              formation,
              student,
              mention,
              score,
              date
            }).toString();
            
            // Rediriger vers la page du certificat
            router.push(`/student/certificates?${queryParams}`);
          }
          break;
        case 'inscription_approved':
          toast.success('Votre inscription a été approuvée');
          if (notification.data?.formation) {
            router.push(`/formation/${notification.data.formation}`);
          } else {
            router.push('/my-courses-list');
          }
          break;
        case 'inscription_rejected':
          toast.error('Votre inscription a été refusée');
          router.push('/my-courses-list');
          break;
        default:
          console.log('Type de notification non géré:', notification.type);
          break;
      }
    } catch (error) {
      console.error('Erreur lors du traitement de la notification:', error);
      toast.error('Erreur lors du traitement de la notification');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    router.push('/sign-in');
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

  const getNotificationColor = (type) => {
    switch (type) {
      case 'supervision_request':
        return '#fff3cd';  // yellow background
      case 'supervision_accepted':
        return '#e6f4ea';  // green background
      case 'supervision_rejected':
      case 'supervision_stopped':
        return '#fce8e8';  // red background
      case 'certificate_generated':
        return '#E8F5E9';  // light green background
      case 'event_reminder':
        return '#E3F2FD';  // light blue background
      default:
        return '#f0f7ff';  // blue background
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'supervision_request':
        return <i className="ph ph-user-plus" style={{ color: '#ffc107' }}></i>;
      case 'supervision_accepted':
        return <i className="ph ph-check-circle" style={{ color: '#34a853' }}></i>;
      case 'supervision_rejected':
        return <i className="ph ph-x-circle" style={{ color: '#ea4335' }}></i>;
      case 'supervision_stopped':
        return <i className="ph ph-stop-circle" style={{ color: '#ea4335' }}></i>;
      case 'certificate_generated':
        return <i className="ph ph-certificate" style={{ color: '#4CAF50' }}></i>;
      case 'event_reminder':
        return <i className="ph ph-calendar" style={{ color: '#2196F3' }}></i>;
      default:
        return <i className="ph ph-bell" style={{ color: '#0d6efd' }}></i>;
    }
  };

  const getNotificationTitle = (type) => {
    switch (type) {
      case 'supervision_request':
        return 'Supervision Request Sent';
      case 'supervision_accepted':
        return 'Supervision Request Accepted';
      case 'supervision_rejected':
        return 'Supervision Request Rejected';
      case 'supervision_stopped':
        return 'Supervision Stopped';
      case 'certificate_generated':
        return 'New Certificate Available';
      case 'event_reminder':
        return '📅 Event Reminder';
      default:
        return 'Notification';
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem('authToken');
      await axios.patch('http://localhost:5000/api/notifications/mark-all-read', {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Mettre à jour l'état local
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setPendingCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error updating notifications:', error);
      toast.error('Error updating notifications');
    }
  };

  return (
    <>
      <div className={`side-overlay ${isMenuActive ? "show" : ""}`}></div>
      <header className={`header ${scroll ? "fixed-header" : ""}`}>
        <div className='container container--xl'>
          <nav className='header-inner flex-between gap-8'>
            <div className='header-content-wrapper flex-align flex-grow-1'>
              {/* Logo */}
              <div className='logo'>
                <Link href='/index-3' className='link'>
                  <img src='assets/images/logo/logo.png' alt='Logo' width={100}/>
                </Link>
              </div>

              {/* Menu */}
              <div className='header-menu d-lg-block d-none'>
                <ul className='nav-menu flex-align'>
                  <li className='nav-menu__item has-submenu'>
                    <Link href='/index-3' className='nav-menu__link'>Home</Link>
                  </li>
                  <li className='nav-menu__item has-submenu'>
                    <Link href='/my-courses-list' className='nav-menu__link'>My Courses</Link>
                  </li>
                  <li className='nav-menu__item has-submenu'>
                    <Link href='/my-events-join' className='nav-menu__link'>My Events</Link>
                  </li>
                  <li className='nav-menu__item has-submenu'>
                    <Link href='#' className='nav-menu__link'>Management</Link>
                    <ul className='nav-submenu scroll-sm'>
                      <li className='nav-submenu__item'>
                        <Link href='/instructor' className='nav-submenu__link'>Instructor List</Link>
                      </li>
                      <li className='nav-submenu__item'>
                        <Link href='/cv' className='nav-submenu__link'>My CV</Link>
                      </li>
                      <li className='nav-submenu__item'>
                        <Link href='/messanger' className='nav-submenu__link'>Messenger</Link>
                      </li>
                    </ul>
                  </li>
                </ul>
              </div>
            </div>

            {/* Header Right */}
            <div className='header-right flex-align'>
              <form action='#' className='search-form position-relative d-xl-block d-none'>
                <input
                  type='text'
                  className='common-input rounded-pill bg-main-25 pe-48 border-neutral-30'
                  placeholder='Search...'
                />
                <button
                  type='submit'
                  className='w-36 h-36 bg-main-600 hover-bg-main-700 rounded-circle flex-center text-md text-white position-absolute top-50 translate-middle-y inset-inline-end-0 me-8'
                >
                  <i className='ph-bold ph-magnifying-glass' />
                </button>
              </form>

              {/* Notification Icon */}
              <div 
                className='info-action w-52 h-52 bg-main-25 hover-bg-main-600 border border-neutral-30 rounded-circle flex-center text-2xl text-neutral-500 hover-text-white hover-border-main-600 position-relative'
              >
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                  className="w-full h-full flex-center"
              >
                <i className='ph ph-bell' />
                </button>
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
                      {notifications.map((notif, index) => (
                        <div 
                          key={notif._id || `notification-${index}`} 
                          className={`notification-item ${!notif.isRead ? 'unread' : ''}`}
                          onClick={() => handleNotificationClick(notif)}
                        >
                          <div className="notification-content">
                            <div className="notification-icon-wrapper" style={{
                              backgroundColor: getNotificationColor(notif.type)
                            }}>
                              {getNotificationIcon(notif.type)}
                            </div>
                            <div className="notification-details">
                              <h6>
                                {getNotificationTitle(notif.type)}
                              </h6>
                              <p>{notif.message}</p>
                              <div className="notification-meta">
                                <span className="notification-time">
                                  <i className="ph ph-clock"></i>
                                  {new Date(notif.createdAt).toLocaleDateString('fr-FR', {
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
                        onClick={handleMarkAllAsRead} 
                        className="mini-view-all"
                      >
                        Clear all
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Cart Icon */}
              <button 
                onClick={() => setShowCart(!showCart)}
                className='info-action w-52 h-52 bg-main-25 hover-bg-main-600 border border-neutral-30 rounded-circle flex-center text-2xl text-neutral-500 hover-text-white hover-border-main-600 position-relative'
              >
                <i className='ph ph-shopping-cart' />
                {cartItems.length > 0 && (
                  <span className="notification-badge" style={{ backgroundColor: '#ffcc00' }}>{cartItems.length}</span>
                )}
                
                {showCart && (
                  <div className="notification-dropdown cart-dropdown">
                    <div className="notification-header">
                      <span className="notification-title">
                        <div className="notification-icon">
                          <i className="ph ph-shopping-cart"></i>
                        </div>
                        <span>My Cart</span>
                      </span>
                      <span className="notification-count">{cartItems.length}</span>
                    </div>
                    
                    <div className="notification-list">
                      {cartItems.length === 0 ? (
                        <div className="p-4 text-center text-neutral-500">
                          Your cart is empty
                        </div>
                      ) : (
                        cartItems.map((item) => (
                          <div key={item._id} className="cart-item">
                            <div className="cart-item-content">
                              <div className="cart-item-image">
                                <img src={item.image || 'assets/images/default-course.png'} alt={item.title} />
                              </div>
                              <div className="cart-item-details">
                                <h6>{item.title}</h6>
                                <p className="cart-item-price">{item.price} DT</p>
                              </div>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeFromCart(item._id);
                                }}
                                className="cart-item-remove"
                              >
                                <i className="ph ph-x"></i>
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    {cartItems.length > 0 && (
                      <div className="cart-footer">
                        <div className="cart-total">
                          <span>Total:</span>
                          <span>{calculateTotal()} DT</span>
                        </div>
                        <Link href="/cart" className="btn btn-primary w-100">
                          Checkout
                        </Link>
                      </div>
                    )}
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
          <Link href='/index-3' className='mobile-menu__logo'>
            <img src='assets/images/logo/logo.png' alt='Logo' />
          </Link>
          <div className='mobile-menu__menu'>
            <ul className='nav-menu flex-align nav-menu--mobile'>
              <li className='nav-menu__item has-submenu'>
                <Link href='/index-3' className='nav-menu__link'>
                  <span className='nav-text'>Home</span>
                </Link>
              </li>
              <li className='nav-menu__item has-submenu'>
                <Link href='/my-courses-list' className='nav-menu__link'>My Courses</Link>
              </li>
              <li className='nav-menu__item has-submenu'>
                <Link href='/my-events-join' className='nav-menu__link'>My Events</Link>
              </li>
              <li className='nav-menu__item has-submenu'>
                <Link href='#' className='nav-menu__link'>Management</Link>
                <ul className='nav-submenu'>
                  <li className='nav-submenu__item'>
                    <Link href='/instructor' className='nav-submenu__link'>Instructor List</Link>
                  </li>
                  <li className='nav-submenu__item'>
                    <Link href='/cv' className='nav-submenu__link'>My CV</Link>
                  </li>
                  <li className='nav-submenu__item'>
                    <Link href='/messanger' className='nav-submenu__link'>Messenger</Link>
                  </li>
                </ul>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <style jsx>{`
        .notification-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background-color: #ef4444;
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

        .cart-dropdown {
          width: 320px;
        }

        .cart-item {
          padding: 12px 16px;
          border-bottom: 1px solid #f0f0f0;
        }

        .cart-item-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .cart-item-image {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          overflow: hidden;
        }

        .cart-item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .cart-item-details {
          flex: 1;
        }

        .cart-item-details h6 {
          font-size: 14px;
          margin: 0 0 4px 0;
          color: #1a1a1a;
        }

        .cart-item-price {
          font-size: 13px;
          color: #25ace4;
          margin: 0;
          font-weight: 600;
        }

        .cart-item-remove {
          background: none;
          border: none;
          color: #666;
          cursor: pointer;
          padding: 4px;
          font-size: 16px;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .cart-item-remove:hover {
          background: #fee2e2;
          color: #ef4444;
        }

        .cart-footer {
          padding: 16px;
          background: #f8f9ff;
          border-top: 1px solid #f0f0f0;
        }

        .cart-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          font-weight: 600;
          color: #1a1a1a;
        }

        .cart-total span:last-child {
          color: #25ace4;
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
      `}</style>
    </>
  );
};

export default HeaderStudent; 