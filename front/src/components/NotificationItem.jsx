'use client';

import { useRouter } from 'next/navigation';
import axios from 'axios';

const NotificationItem = ({ notification, onRead }) => {
  const router = useRouter();

  const handleClick = async () => {
    try {
      // Marquer comme lu
      if (!notification.isRead) {
        await onRead(notification._id);
      }

      // Rediriger en fonction du type de notification
      if (notification.type === 'supervision_request') {
        router.push('/management');
      } else if (notification.data && notification.data.url) {
        router.push(notification.data.url);
      }
    } catch (error) {
      console.error('Erreur lors du traitement de la notification:', error);
    }
  };

  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'supervision_request':
        return 'ph-bold ph-user-plus';
      case 'supervision_response':
        return notification.data.status === 'accepted' ? 'ph-bold ph-check-circle' : 'ph-bold ph-x-circle';
      case 'supervision_stopped':
        return 'ph-bold ph-stop-circle';
      default:
        return 'ph-bold ph-bell';
    }
  };

  const getNotificationColor = () => {
    switch (notification.type) {
      case 'supervision_request':
        return 'text-warning';
      case 'supervision_response':
        return notification.data.status === 'accepted' ? 'text-success' : 'text-danger';
      case 'supervision_stopped':
        return 'text-danger';
      default:
        return 'text-primary';
    }
  };

  return (
    <div 
      className={`notification-item d-flex align-items-start p-3 border-bottom cursor-pointer hover-bg-light ${notification.isRead ? 'bg-white' : 'bg-light'}`}
      onClick={handleClick}
    >
      <div className={`notification-icon me-3 ${getNotificationColor()}`}>
        <i className={getNotificationIcon()} style={{ fontSize: '1.5rem' }}></i>
      </div>
      <div className="notification-content flex-grow-1">
        <p className="notification-message mb-1">{notification.message}</p>
        <small className="text-muted">
          {new Date(notification.createdAt).toLocaleString('fr-FR')}
        </small>
      </div>
      {!notification.isRead && (
        <span className="badge bg-primary rounded-circle p-2"></span>
      )}

      <style jsx>{`
        .notification-item {
          transition: all 0.2s ease;
        }

        .notification-item:hover {
          background-color: #f8f9fa;
        }

        .cursor-pointer {
          cursor: pointer;
        }

        .hover-bg-light:hover {
          background-color: #f8f9fa !important;
        }

        .notification-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background-color: #f8f9fa;
        }

        .text-warning {
          color: #ffc107;
        }

        .text-success {
          color: #198754;
        }

        .text-danger {
          color: #dc3545;
        }

        .text-primary {
          color: #0d6efd;
        }
      `}</style>
    </div>
  );
};

export default NotificationItem; 