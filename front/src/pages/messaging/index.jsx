import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const MessagingPage = () => {
  const router = useRouter();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const userData = JSON.parse(userStr);
          setUser(userData);

          // Si c'est un étudiant, récupérer uniquement la conversation avec son encadrant accepté
          if (userData.role === 'student') {
            const response = await axios.get('http://localhost:5000/api/cv/my-cv', {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.data && response.data.supervisionStatus === 'accepted') {
              setConversations([{
                id: response.data._id,
                with: response.data.supervisor,
                status: response.data.supervisionStatus,
                lastMessage: null
              }]);
            }
          } 
          // Si c'est un enseignant, récupérer les conversations avec les étudiants encadrés
          else if (userData.role === 'instructor') {
            const response = await axios.get('http://localhost:5000/api/cv/supervised', {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const activeConversations = response.data
              .filter(cv => cv.supervisionStatus === 'accepted')
              .map(cv => ({
                id: cv._id,
                with: cv.student,
                status: cv.supervisionStatus,
                lastMessage: null
              }));
            
            setConversations(activeConversations);
          }
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des conversations:', error);
        toast.error('Erreur lors de la récupération des conversations');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleConversationClick = (conversationId) => {
    router.push(`/messaging/${conversationId}`);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <i className="ph ph-spinner animate-spin"></i>
        </div>
      </div>
    );
  }

  return (
    <div className="messaging-container">
      <div className="messaging-header">
        <h1>Messagerie d'encadrement</h1>
        <p>
          {user?.role === 'student' 
            ? 'Discutez avec votre encadrant'
            : 'Discutez avec vos étudiants encadrés'}
        </p>
      </div>

      <div className="conversations-list">
        {conversations.length === 0 ? (
          <div className="no-conversations">
            {user?.role === 'student' 
              ? "Vous n'avez pas encore d'encadrant accepté"
              : "Vous n'encadrez aucun étudiant pour le moment"}
          </div>
        ) : (
          conversations.map((conv) => (
            <div 
              key={conv.id} 
              className="conversation-card" 
              onClick={() => handleConversationClick(conv.id)}
            >
              <div className="conversation-avatar">
                <i className="ph ph-user-circle"></i>
              </div>
              <div className="conversation-info">
                <h3>{conv.with.firstName} {conv.with.lastName}</h3>
                <p>{user?.role === 'student' ? 'Votre encadrant' : 'Étudiant encadré'}</p>
              </div>
              <div className="conversation-action">
                <button className="chat-button">
                  <i className="ph ph-chat-circle-text"></i>
                  Ouvrir
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        .messaging-container {
          max-width: 800px;
          margin: 2rem auto;
          padding: 0 1rem;
        }

        .messaging-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .messaging-header h1 {
          color: #1e293b;
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }

        .messaging-header p {
          color: #64748b;
          font-size: 1.1rem;
        }

        .conversations-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .conversation-card {
          background: white;
          border-radius: 12px;
          padding: 1rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid #e5e7eb;
        }

        .conversation-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .conversation-avatar {
          width: 48px;
          height: 48px;
          background: #f0f7ff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          color: #0d6efd;
        }

        .conversation-info {
          flex: 1;
        }

        .conversation-info h3 {
          margin: 0;
          color: #1e293b;
          font-size: 1rem;
          font-weight: 600;
        }

        .conversation-info p {
          margin: 0.25rem 0 0 0;
          color: #64748b;
          font-size: 0.875rem;
        }

        .chat-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: #0d6efd;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 0.875rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .chat-button:hover {
          background: #0b5ed7;
        }

        .no-conversations {
          text-align: center;
          padding: 3rem;
          background: white;
          border-radius: 12px;
          color: #64748b;
          border: 2px dashed #e5e7eb;
        }

        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 400px;
        }

        .loading-spinner {
          font-size: 2rem;
          color: #0d6efd;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default MessagingPage; 