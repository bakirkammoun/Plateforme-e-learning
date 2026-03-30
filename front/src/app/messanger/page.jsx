"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Chat from '@/components/chat/Chat';
import HeaderStudent from '@/components/Header';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import 'react-toastify/dist/ReactToastify.css';

const MessengerPage = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const [supervisedCVs, setSupervisedCVs] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [userProfileImage, setUserProfileImage] = useState(null);
  const [conversationProfileImages, setConversationProfileImages] = useState({});

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const userStr = localStorage.getItem('user');

        if (!token || !userStr) {
          console.log('Token ou données utilisateur manquants');
          router.push('/sign-in');
          return false;
        }

        // Vérifier la validité du token
        const response = await axios.get('http://localhost:5000/api/auth/verify-token', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (!response.data.success) {
          console.log('Token invalide');
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          router.push('/sign-in');
          return false;
        }

        // Mettre à jour les données utilisateur si nécessaire
        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }

        return true;
      } catch (error) {
        console.error('Erreur de vérification:', error);
        
        // Ne pas supprimer les données si c'est une erreur réseau
        if (error.response?.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          router.push('/sign-in');
        }
        return false;
      }
    };

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Vérifier l'authentification d'abord
        const isAuthenticated = await checkAuth();
        if (!isAuthenticated) return;

        const token = localStorage.getItem('authToken');
        const userData = JSON.parse(localStorage.getItem('user'));
        
        setUser(userData);
        
        // Créer une instance axios avec la configuration
        const api = axios.create({
          baseURL: 'http://localhost:5000/api',
            headers: { 
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          timeout: 15000
        });

        // Fonction pour récupérer les conversations selon le rôle
        const fetchConversations = async () => {
          if (userData.role === 'instructor') {
            const { data } = await api.get('/cv/instructor/supervised-cvs');
            if (data.success && data.cvs) {
              return data.cvs
            .filter(cv => cv.supervisionStatus === 'accepted')
            .map(cv => ({
              id: cv._id,
              with: cv.userId,
              status: cv.supervisionStatus,
              lastMessage: cv.lastMessage || null,
              unreadCount: cv.unreadCount || 0
            }));
            }
          } else if (userData.role === 'student') {
            const { data } = await api.get('/cv/me');
            if (data.success && data.cv && data.cv.supervisionStatus === 'accepted') {
              const supervisorRes = await api.get(`/users/${data.cv.supervisorId}`);
              if (supervisorRes.data && supervisorRes.data.user) {
                return [{
                  id: data.cv._id,
                  with: {
                    _id: supervisorRes.data.user._id,
                    firstName: supervisorRes.data.user.firstName,
                    lastName: supervisorRes.data.user.lastName
                  },
                  status: data.cv.supervisionStatus,
                  lastMessage: data.cv.lastMessage || null,
                  unreadCount: data.cv.unreadCount || 0
                }];
              }
            }
          }
          return [];
        };

        // Récupérer les conversations
        const conversationsData = await fetchConversations();
        setConversations(conversationsData);

      } catch (error) {
        console.error('Erreur:', error);
        
        // Gérer les erreurs d'authentification
        if (error.response?.status === 401) {
          toast.error("Session expired. Please log in again.");
          router.push('/sign-in');
          return;
        }

        // Gérer les autres erreurs
        const message = error.response?.data?.message || "Error loading conversations";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  useEffect(() => {
    const fetchProfileImages = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const userStr = localStorage.getItem('user');
        if (!userStr) return;

        const userData = JSON.parse(userStr);
        
        // Récupérer l'image de profil de l'utilisateur connecté
        if (userData.profileImage) {
          setUserProfileImage(userData.profileImage);
        }

        // Récupérer les images de profil des conversations
        if (conversations.length > 0) {
          const images = {};
          for (const conv of conversations) {
            try {
              const response = await axios.get(`http://localhost:5000/api/users/${conv.with._id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (response.data?.user?.profileImage) {
                images[conv.with._id] = response.data.user.profileImage;
              }
            } catch (error) {
              console.error(`Erreur lors de la récupération de l'image pour ${conv.with._id}:`, error);
            }
          }
          setConversationProfileImages(images);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des images de profil:', error);
      }
    };

    fetchProfileImages();
  }, [conversations]);

  const breadcrumbItems = [
    { label: "Home", link: "/" },
    { label: "Messages", link: "/messanger" },
  ];

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger m-4" role="alert">
        {typeof error === 'string' ? error : error.message || 'An error occurred'}
      </div>
    );
  }

  return (
    <>
      <HeaderStudent />
      <div className="page-wrapper">
        <div className="page-content">
          {debugInfo && debugInfo.error && (
            <div className="debug-info">
              <h4>Debug Information :</h4>
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          )}
        
          <div className="messenger-container">
            <div className="conversations-sidebar">
              <div className="sidebar-header">
                <div className="user-profile">
                  <div className="avatar-wrapper">
                    {userProfileImage ? (
                      <img 
                        src={userProfileImage} 
                        alt="Profile" 
                        className="avatar-image"
                      />
                    ) : (
                      <div className="avatar-placeholder">
                        {user?.firstName?.[0]?.toUpperCase() || ''}
                        {user?.lastName?.[0]?.toUpperCase() || ''}
                      </div>
                    )}
                    <span className="status-dot online"></span>
                  </div>
                  <div className="user-info">
                    <h3>{user?.firstName} {user?.lastName}</h3>
                    <span className="status-text">Online</span>
                  </div>
              </div>
              <div className="search-box">
                  <i className="ph-bold ph-magnifying-glass"></i>
                <input 
                  type="text" 
                  placeholder="Search conversations..." 
                  className="search-input"
                />
              </div>
            </div>
            
            <div className="conversations-list">
              {loading ? (
                <div className="loading-state">
                  <div className="loading-spinner">
                      <i className="ph-bold ph-spinner animate-spin"></i>
                  </div>
                  <span>Loading conversations...</span>
                </div>
              ) : error ? (
                <div className="error-state">
                  <div className="error-icon">
                      <i className="ph-bold ph-warning-circle"></i>
                  </div>
                  <p>{typeof error === 'string' ? error : 'Error loading conversations'}</p>
                  <button 
                      className="retry-btn"
                    onClick={() => window.location.reload()}
                  >
                      <i className="ph-bold ph-arrows-clockwise"></i>
                    Retry
                  </button>
                </div>
              ) : conversations.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                      <i className="ph-bold ph-chat-dots"></i>
                  </div>
                  <p>
                    {user?.role === 'student' 
                      ? "You don't have an accepted supervisor yet"
                      : "You don't have any students with accepted supervision"}
                  </p>
                  <small className="help-text">
                    {user?.role === 'instructor' && 
                      "Make sure you have accepted the student's supervision request"}
                  </small>
                </div>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`conversation-item ${selectedConversation?.id === conv.id ? 'active' : ''}`}
                    onClick={() => setSelectedConversation(conv)}
                  >
                    <div className="conversation-avatar">
                      <div className="avatar-wrapper">
                          {conversationProfileImages[conv.with._id] ? (
                          <img 
                              src={conversationProfileImages[conv.with._id]} 
                            alt={`${conv.with.firstName} ${conv.with.lastName}`}
                            className="avatar-image"
                          />
                        ) : (
                          <div className="avatar-placeholder">
                            {conv.with.firstName?.[0]?.toUpperCase() || ''}
                            {conv.with.lastName?.[0]?.toUpperCase() || ''}
                          </div>
                        )}
                        <span className="status-dot online"></span>
                      </div>
                    </div>
                    <div className="conversation-info">
                      <div className="conversation-header">
                        <h3>{conv.with.firstName} {conv.with.lastName}</h3>
                        <span className="last-time">
                          {conv.lastMessage?.createdAt ? (
                            new Date(conv.lastMessage.createdAt).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          ) : ''}
                        </span>
                      </div>
                      <div className="conversation-preview">
                        <p>
                          {conv.lastMessage?.content ? (
                            <span className="last-message">{conv.lastMessage.content}</span>
                          ) : (
                            <span className="role-label">
                              {user?.role === 'student' ? 'Your supervisor' : 'Supervised student'}
                            </span>
                          )}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="unread-badge">{conv.unreadCount}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="chat-area">
            {selectedConversation ? (
              <Chat 
                cvId={selectedConversation.id}
                recipientId={selectedConversation.with._id}
                recipientName={`${selectedConversation.with.firstName || ''} ${selectedConversation.with.lastName || ''}`}
              />
            ) : (
              <div className="no-chat-selected">
                  <i className="ph-bold ph-chat-dots"></i>
                  <h3>Welcome to your messages</h3>
                  <p>Select a conversation to start chatting</p>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .page-wrapper {
          min-height: 100vh;
          background: #f0f2f5;
          padding: 0;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .page-wrapper::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 200px;
          background: linear-gradient(135deg, #0084ff 0%, #0073e6 100%);
          z-index: 0;
        }

        .page-wrapper::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 200px;
          background: 
            radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
          z-index: 1;
        }

        .page-content {
          flex: 1;
          width: 100%;
          height: 100%;
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
        }

        .messenger-container {
          display: grid;
          grid-template-columns: 350px 1fr;
          background: #ffffff;
          height: 100%;
          margin: 0;
          border-radius: 0;
          box-shadow: none;
          position: relative;
          overflow: hidden;
          flex: 1;
        }

        .conversations-sidebar {
          background: #ffffff;
          border-right: 1px solid #e4e6eb;
          display: flex;
          flex-direction: column;
          width: 350px;
          position: relative;
          height: 100%;
          overflow: hidden;
        }

        .sidebar-header {
          padding: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          background: linear-gradient(135deg, #0084ff 0%, #0073e6 100%);
          position: sticky;
          top: 0;
          z-index: 10;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          flex-shrink: 0;
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          padding: 12px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .avatar-wrapper {
          position: relative;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          overflow: hidden;
        }

        .avatar-image {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .avatar-placeholder {
          width: 100%;
          height: 100%;
          background: #ffffff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          color: #0084ff;
          font-size: 18px;
          text-transform: uppercase;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .status-dot {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #31a24c;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .user-info h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #ffffff;
        }

        .status-text {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.8);
        }

        .search-box {
          position: relative;
          margin-top: 12px;
        }

        .search-box i {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255, 255, 255, 0.8);
          font-size: 20px;
        }

        .search-input {
          width: 100%;
          padding: 12px 12px 12px 40px;
          border: none;
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          font-size: 15px;
          color: #ffffff;
          transition: all 0.2s ease;
        }

        .search-input::placeholder {
          color: rgba(255, 255, 255, 0.8);
        }

        .search-input:focus {
          outline: none;
          background: rgba(255, 255, 255, 0.15);
          box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.2);
        }

        .conversations-list {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
          background: #ffffff;
          height: calc(100% - 140px); /* Ajuster en fonction de la hauteur du header */
          position: relative;
        }

        .conversations-list::-webkit-scrollbar {
          width: 6px;
        }

        .conversations-list::-webkit-scrollbar-track {
          background: transparent;
        }

        .conversations-list::-webkit-scrollbar-thumb {
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 3px;
        }

        .conversations-list::-webkit-scrollbar-thumb:hover {
          background-color: rgba(0, 0, 0, 0.3);
        }

        .conversation-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: 4px;
          background: #ffffff;
          border: 1px solid #e4e6eb;
        }

        .conversation-item:hover {
          background: #f0f2f5;
          transform: translateY(-1px);
        }

        .conversation-item.active {
          background: #e7f3ff;
          border-color: #0084ff;
        }

        .conversation-avatar {
          flex-shrink: 0;
        }

        .conversation-info {
          flex: 1;
          min-width: 0;
        }

        .conversation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }

        .conversation-header h3 {
          margin: 0;
          font-size: 15px;
          font-weight: 600;
          color: #050505;
        }

        .last-time {
          font-size: 12px;
          color: #65676b;
        }

        .conversation-preview {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .conversation-preview p {
          margin: 0;
          font-size: 13px;
          color: #65676b;
        }

        .last-message {
          color: #65676b;
        }

        .role-label {
          color: #65676b;
          font-style: italic;
        }

        .unread-badge {
          background: #0084ff;
          color: white;
          font-size: 12px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 10px;
          min-width: 20px;
          text-align: center;
        }

        .chat-area {
          background: #f0f2f5;
          position: relative;
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .chat-messages-container {
          flex: 1;
          overflow-y: auto;
          position: relative;
          height: calc(100% - 120px); /* Ajuster en fonction de la hauteur du header et footer */
        }

        .chat-messages-container::-webkit-scrollbar {
          width: 6px;
        }

        .chat-messages-container::-webkit-scrollbar-track {
          background: transparent;
        }

        .chat-messages-container::-webkit-scrollbar-thumb {
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 3px;
        }

        .chat-messages-container::-webkit-scrollbar-thumb:hover {
          background-color: rgba(0, 0, 0, 0.3);
        }

        .chat-footer {
          padding: 12px 16px;
          background: #ffffff;
          border-top: 1px solid #e4e6eb;
          flex-shrink: 0;
          position: relative;
          z-index: 10;
        }

        .no-chat-selected {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #65676b;
          padding: 40px;
          text-align: center;
          background: #f0f2f5;
        }

        .no-chat-selected i {
          font-size: 80px;
          color: #0084ff;
          margin-bottom: 24px;
          animation: robotAnimation 2s infinite;
          display: inline-block;
        }

        @keyframes robotAnimation {
          0% {
            transform: translateY(0) rotate(0deg);
          }
          25% {
            transform: translateY(-10px) rotate(5deg);
          }
          50% {
            transform: translateY(0) rotate(0deg);
          }
          75% {
            transform: translateY(-10px) rotate(-5deg);
          }
          100% {
            transform: translateY(0) rotate(0deg);
          }
        }

        .no-chat-selected h3 {
          font-size: 24px;
          font-weight: 600;
          color: #050505;
          margin: 0 0 12px 0;
          animation: fadeInUp 0.8s ease-out;
        }

        .no-chat-selected p {
          font-size: 16px;
          max-width: 400px;
          margin: 0;
          color: #65676b;
          line-height: 1.5;
          animation: fadeInUp 1s ease-out;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .loading-state,
        .empty-state,
        .error-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
          text-align: center;
          height: 100%;
        }

        .loading-spinner,
        .empty-icon,
        .error-icon {
          font-size: 40px;
          margin-bottom: 16px;
          color: #0084ff;
        }

        .retry-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border: none;
          border-radius: 20px;
          background: #0084ff;
          color: #ffffff;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-top: 16px;
        }

        .retry-btn:hover {
          background: #0073e6;
        }

        .help-text {
          color: #65676b;
          font-size: 13px;
          margin-top: 8px;
          font-style: italic;
        }

        @media (max-width: 768px) {
          .page-wrapper::before,
          .page-wrapper::after {
            height: 150px;
          }

          .page-wrapper {
            padding: 0;
          }

          .messenger-container {
            grid-template-columns: 1fr;
            height: 100%;
          }

          .conversations-sidebar {
            width: 100%;
            display: ${selectedConversation ? 'none' : 'flex'};
          }

          .chat-area {
            display: ${selectedConversation ? 'flex' : 'none'};
            width: 100%;
          }

          .sidebar-header {
            padding: 16px;
          }

          .user-profile {
            padding: 10px;
          }

          .avatar-wrapper {
            width: 40px;
            height: 40px;
          }

          .user-info h3 {
            font-size: 15px;
          }
        }
      `}</style>
    </>
  );
};

export default MessengerPage;
