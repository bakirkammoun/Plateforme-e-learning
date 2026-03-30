import React, { useState, useEffect } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { Link, useNavigate } from "react-router-dom";
import axios from 'axios';
import { toast } from 'react-hot-toast';

interface Notification {
  _id: string;
  type: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [role, setRole] = useState<string>("admin");
  const [hiddenNotifications, setHiddenNotifications] = useState<Set<string>>(new Set());
  const [isExpanded, setIsExpanded] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Aucun token trouvé');
        return;
      }
      
      // Utiliser la route normale pour les notifications
      const response = await axios.get('http://localhost:5000/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Notifications reçues:', response.data);
      if (response.data && Array.isArray(response.data)) {
        setNotifications(response.data);
        setUnreadCount(response.data.filter(n => !n.isRead).length);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Erreur lors de la récupération des notifications:', error.response?.data || error.message);
      } else {
        console.error('Erreur lors de la récupération des notifications:', error);
      }
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Aucun token trouvé');
        return;
      }
      
      await axios.patch(
        'http://localhost:5000/api/notifications/mark-all-read',
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      // Mettre à jour l'état local des notifications pour les marquer comme lues
      const updatedNotifications = notifications.map(n => ({ ...n, isRead: true }));
      setNotifications(updatedNotifications);
      setUnreadCount(0);
      toast.success('Toutes les notifications ont été marquées comme lues');
    } catch (error) {
      console.error('Erreur lors du marquage des notifications comme lues:', error);
      toast.error('Erreur lors du marquage des notifications');
    }
  };

  const handleNotificationClick = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Aucun token trouvé');
        return;
      }
      
      const notification = notifications.find(n => n._id === notificationId);
      if (!notification) return;
      
      // Marquer la notification comme lue
      await axios.patch(
        `http://localhost:5000/api/notifications/${notificationId}/read`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      // Rediriger en fonction du type de notification
      if (notification.type === 'enrollment_request') {
        navigate('/enrollments');
      } else if (notification.type === 'payment_completed') {
        window.location.href = 'http://localhost:3005/payments';
      } else if (notification.type === 'instructor_signup' || notification.type === 'student_signup') {
        // Récupérer l'ID de l'utilisateur depuis les données de la notification
        const userId = notification.data?.userId;
        if (userId) {
          window.location.href = `http://localhost:3005/basic-tables?userId=${userId}`;
        } else {
          window.location.href = 'http://localhost:3005/basic-tables';
        }
      } else if (notification.type === 'course_added') {
        // Rediriger vers la page des formations avec l'ID du cours en paramètre
        const courseId = notification.data?.courseId;
        if (courseId) {
          window.location.href = `/formations?courseId=${courseId}`;
        } else {
          window.location.href = '/formations';
        }
      } else if (notification.type === 'event_added') {
        // Rediriger vers la page des événements avec l'ID de l'événement en paramètre
        const eventId = notification.data?.eventId;
        if (eventId) {
          navigate(`/events?eventId=${eventId}`);
        } else {
          navigate('/events');
        }
      } else if (notification.type === 'quiz_completed') {
        // Rediriger vers la page des certificats avec les informations du quiz
        const formationId = notification.data?.formationId;
        const quizId = notification.data?.quizId;
        if (formationId && quizId) {
          navigate(`/certificates?formationId=${formationId}&quizId=${quizId}`);
        } else {
          navigate('/certificates');
        }
      }

      // Mettre à jour l'état local
      setNotifications(prev => 
        prev.map(n => 
          n._id === notificationId 
            ? { ...n, isRead: true }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la notification:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(); // Format date : "19/02/2025, 14:25"
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'enrollment_request':
        return (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
        );
      case 'payment_completed':
        return (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-success/10 text-success">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 8h6m-5 0a3 3 0 110 6H9l3 3m-3-6h6m6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'instructor_signup':
      case 'student_signup':
        return (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-warning/10 text-warning">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
        );
      case 'course_added':
        return (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-info/10 text-info">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        );
      case 'quiz_completed':
        return (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="relative">
      <button
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-stroke bg-white text-gray-500 transition-colors hover:text-gray-700 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={toggleDropdown}
      >
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-danger text-xs font-medium text-white shadow-lg">
            {unreadCount}
          </span>
        )}
        <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20">
          <path d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248Z" />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        className="absolute -right-[240px] mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-stroke bg-white shadow-lg dark:border-strokedark dark:bg-boxdark sm:w-[361px] lg:right-0"
      >
        <div className="flex items-center justify-between border-b border-stroke px-4 py-3 dark:border-strokedark">
          <h5 className="text-lg font-semibold text-black dark:text-white">
            Notifications {unreadCount > 0 && `(${unreadCount})`}
          </h5>
          {notifications.length > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm font-medium text-primary hover:text-primary/80"
            >
              Tout marquer comme lu
            </button>
          )}
        </div>

        <div className="no-scrollbar h-[380px] overflow-y-auto px-4">
          {notifications.length > 0 ? (
            <div className="flex flex-col gap-4 py-4">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification._id)}
                  className={`group flex cursor-pointer items-center gap-4 rounded-lg border border-stroke p-2.5 hover:border-primary dark:border-strokedark dark:hover:border-primary ${
                    !notification.isRead ? 'bg-gray-50 dark:bg-meta-4' : ''
                  }`}
                >
                  {getNotificationIcon(notification.type)}
                  <div className="flex flex-1 flex-col gap-1">
                    <p className={`text-sm font-medium ${!notification.isRead ? 'text-black dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {formatDate(notification.createdAt)}
                      </p>
                      {notification.type === 'quiz_completed' && (
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          notification.data?.status === 'Réussi' 
                            ? 'bg-success/10 text-success' 
                            : 'bg-danger/10 text-danger'
                        }`}>
                          Score: {notification.data?.score}/20
                        </span>
                      )}
                    </div>
                  </div>
                  {!notification.isRead && (
                    <span className="h-2.5 w-2.5 rounded-full bg-primary"></span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center">
              <div className="flex h-15 w-15 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="mt-4 text-gray-500 dark:text-gray-400">
                Aucune notification pour le moment
              </p>
            </div>
          )}
        </div>

        <div className="mt-auto border-t border-stroke px-4 py-3 dark:border-strokedark">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/enrollments');
              }}
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Inscriptions
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                window.location.href = 'http://localhost:3005/payments';
              }}
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Paiements
            </button>
          </div>
        </div>
      </Dropdown>
    </div>
  );
}
