'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Dashboard.module.css';
import { FaHome, FaBook, FaCalendarPlus, FaCog, FaUserGraduate, FaComments, FaList, FaPlus, FaStar, FaQuestionCircle, FaCommentDots, FaCalendarAlt, FaLifeRing, FaArchive } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Image from 'next/image';

const Dashboard = () => {
  const pathname = usePathname();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [showCoursesSubmenu, setShowCoursesSubmenu] = useState(false);
  const [showManagementSubmenu, setShowManagementSubmenu] = useState(false);

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
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleCoursesSubmenu = () => {
    setShowCoursesSubmenu(!showCoursesSubmenu);
  };

  const toggleManagementSubmenu = () => {
    setShowManagementSubmenu(!showManagementSubmenu);
  };

  const blueIconStyle = { color: '#0d6efd' };
  const orangeIconStyle = { color: '#fd7e14' };

  const menuItems = [
    { 
      name: 'Home', 
      path: '/index-2', 
      icon: <FaHome size={18} style={blueIconStyle} />,
      submenu: null
    },
    { 
      name: 'Courses', 
      path: '#', 
      icon: <FaBook size={18} style={blueIconStyle} />,
      submenu: [
        { name: 'My Courses', path: '/my-courses', icon: <FaList size={16} style={blueIconStyle} /> },
        { name: 'Add Course', path: '/add-course', icon: <FaPlus size={16} style={blueIconStyle} /> }
      ]
    },
    { 
      name: 'Add Events', 
      path: '/add-event', 
      icon: <FaCalendarPlus size={18} style={blueIconStyle} />,
      submenu: null
    },
    { 
      name: 'Enrollment Requests', 
      path: '/instructor/enrollments', 
      icon: <FaUserGraduate size={18} style={blueIconStyle} />,
      submenu: null
    },
    { 
      name: 'Mentored Students', 
      path: '/management', 
      icon: <FaList size={18} style={blueIconStyle} />,
      submenu: null
    },
    { 
      name: 'Quiz Management', 
      path: '/index-2/quiz-management', 
      icon: <FaQuestionCircle size={18} style={orangeIconStyle} />,
      submenu: null
    },
    { 
      name: 'Top Courses', 
      path: '/index-2/top-courses', 
      icon: <FaStar size={18} style={orangeIconStyle} />,
      submenu: null
    },
    { 
      name: 'Course Comments', 
      path: '/index-2/course-comments', 
      icon: <FaCommentDots size={18} style={orangeIconStyle} />,
      submenu: null
    },
    { 
      name: 'Upcoming Events', 
      path: '/index-2/upcoming-events', 
      icon: <FaCalendarAlt size={18} style={orangeIconStyle} />,
      submenu: null
    },
    { 
      name: 'Archives', 
      path: '/index-2/archives', 
      icon: <FaArchive size={18} style={orangeIconStyle} />, 
      submenu: null
    },
    { 
      name: 'Support', 
      path: '/index-2/support', 
      icon: <FaLifeRing size={18} style={orangeIconStyle} />, 
      submenu: null
    }
  ];

  return (
    <div className={`${styles.dashboard} ${pathname === '/index-2' ? styles.index3 : ''}`}>
      <div className={styles.dashboardContent}>
        <div className={styles.dashboardHeader}>
          <div className={styles.logoContainer}>
            <Image
              src="/assets/images/logo/logo.png"
              alt="Logo"
              width={100}
              height={40}
              className={styles.logo}
            />
          </div>
          <h3>Menu Principal</h3>
        </div>
        <nav className={styles.dashboardNav}>
          {menuItems.map((item) => (
            <div key={item.path} className={styles.menuItem}>
              {item.submenu ? (
                <div 
                  className={`${styles.dashboardNavItem} ${pathname.startsWith(item.path) ? styles.active : ''}`}
                  onClick={item.name === 'Courses' ? toggleCoursesSubmenu : toggleManagementSubmenu}
                >
                  <span className={styles.icon}>{item.icon}</span>
                  <span className={styles.text}>{item.name}</span>
                  <span className={styles.arrow}>
                    {item.name === 'Courses' 
                      ? (showCoursesSubmenu ? '▼' : '▶')
                      : (showManagementSubmenu ? '▼' : '▶')}
                  </span>
                </div>
              ) : (
                <Link
                  href={item.path}
                  className={`${styles.dashboardNavItem} ${pathname === item.path ? styles.active : ''}`}
                >
                  <span className={styles.icon}>{item.icon}</span>
                  <span className={styles.text}>{item.name}</span>
                </Link>
              )}
              
              {item.submenu && (
                <div className={`${styles.submenu} ${(item.name === 'Courses' && showCoursesSubmenu) || (item.name === 'Management' && showManagementSubmenu) ? styles.show : ''}`}>
                  {item.submenu.map((subItem) => (
                    <Link
                      key={subItem.path}
                      href={subItem.path}
                      className={`${styles.submenuItem} ${pathname === subItem.path ? styles.active : ''}`}
                    >
                      <span className={styles.submenuIcon}>{subItem.icon}</span>
                      <span className={styles.submenuText}>{subItem.name}</span>
                      {subItem.name === 'Enrollment Requests' && pendingCount > 0 && (
                        <span className={styles.notificationBadge}>{pendingCount}</span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Dashboard;