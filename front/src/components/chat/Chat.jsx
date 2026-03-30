import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import EmojiPicker from 'emoji-picker-react';

const Chat = ({ cvId, recipientId, recipientName }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState([]);
  const [showScrollButtons, setShowScrollButtons] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startScrollTop, setStartScrollTop] = useState(0);
  const scrollbarRef = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [scrollHeight, setScrollHeight] = useState(0);
  const [thumbHeight, setThumbHeight] = useState(0);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [recipientProfileImage, setRecipientProfileImage] = useState(null);
  const [userProfileImage, setUserProfileImage] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const checkScroll = () => {
    const container = messagesContainerRef.current;
    if (container) {
      const hasOverflow = container.scrollHeight > container.clientHeight;
      const isNotAtTop = container.scrollTop > 100;
      setShowScrollButton(isNotAtTop && hasOverflow);
    }
  };

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const scrollPercentage = (scrollTop / (scrollHeight - clientHeight)) * 100;
      setScrollPosition(scrollPercentage);
    }
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setStartY(e.clientY);
    setStartScrollTop(messagesContainerRef.current.scrollTop);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;

    const container = messagesContainerRef.current;
    if (!container) return;

    const deltaY = e.clientY - startY;
    const scrollHeight = container.scrollHeight - container.clientHeight;
    const scrollRatio = deltaY / (container.clientHeight - 40);
    const newScrollTop = startScrollTop + (scrollHeight * scrollRatio);
    
    container.scrollTop = Math.max(0, Math.min(newScrollTop, scrollHeight));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const updateScrollDimensions = () => {
    const container = messagesContainerRef.current;
    if (container) {
      const { scrollHeight, clientHeight } = container;
      setScrollHeight(scrollHeight);
      
      // Calculer la hauteur du thumb en fonction de la longueur du contenu
      const ratio = clientHeight / scrollHeight;
      const calculatedHeight = Math.max(40, Math.min(100, clientHeight * ratio));
      setThumbHeight(calculatedHeight);
    }
  };

  useEffect(() => {
    if (!cvId) {
      console.error('CV ID manquant');
      setError('Impossible to load messages: CV ID manquant');
      return;
    }
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [cvId]);

  useEffect(() => {
    scrollToBottom();
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => {
      window.removeEventListener('resize', checkScroll);
    };
  }, [messages]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      updateScrollDimensions();
      container.addEventListener('scroll', handleScroll);
      window.addEventListener('resize', updateScrollDimensions);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', updateScrollDimensions);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [isDragging, startY, startScrollTop]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      checkScroll(); // Vérifier l'état initial
    }
    return () => {
      if (container) {
        container.removeEventListener('scroll', checkScroll);
      }
    };
  }, []);

  useEffect(() => {
    const fetchProfileImages = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const user = JSON.parse(localStorage.getItem('user'));

        // Récupérer l'image de profil de l'utilisateur connecté
        if (user && user._id) {
          const userResponse = await axios.get(`http://localhost:5000/api/users/${user._id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (userResponse.data?.user?.profileImage) {
            setUserProfileImage(userResponse.data.user.profileImage);
          }
        }

        // Récupérer l'image de profil du destinataire
        if (recipientId) {
          const recipientResponse = await axios.get(`http://localhost:5000/api/users/${recipientId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (recipientResponse.data?.user?.profileImage) {
            setRecipientProfileImage(recipientResponse.data.user.profileImage);
          }
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des images de profil:', error);
      }
    };

    if (recipientId) {
      fetchProfileImages();
    }
  }, [recipientId]);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        throw new Error('Informations utilisateur manquantes');
      }

      console.log('Récupération des messages pour:', {
        cvId,
        userRole: user.role,
        recipientId
      });

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await axios.get(`${API_URL}/api/messages/${cvId}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data) {
        console.log('Messages récupérés:', response.data.length);
        setMessages(response.data);
        setError(null);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des messages:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      const errorMessage = error.response?.data?.message || 'Erreur lors de la récupération des messages';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Vérifications initiales
    if (!cvId || !recipientId) {
      console.error('Données manquantes:', { cvId, recipientId });
      toast.error('Impossible d\'envoyer le message : données manquantes');
      return;
    }

    if (!newMessage.trim() && files.length === 0) {
      toast.error('Veuillez entrer un message ou sélectionner un fichier');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        throw new Error('Informations utilisateur manquantes');
      }

      console.log('Préparation de l\'envoi du message:', {
        cvId,
        recipientId,
        content: newMessage.trim(),
        userRole: user.role,
        userId: user._id
      });

      const formData = new FormData();
      formData.append('content', newMessage.trim());
      formData.append('recipientId', recipientId);
      
      files.forEach(file => {
        formData.append('attachments', file);
      });

      // Log des données avant envoi
      console.log('Données du message:', {
        url: `http://localhost:5000/api/messages/${cvId}`,
        content: newMessage.trim(),
        recipientId,
        filesCount: files.length
      });

      const response = await axios.post(
        `http://localhost:5000/api/messages/${cvId}`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      console.log('Réponse du serveur:', response.data);

      if (response.data) {
        setMessages(prevMessages => [...prevMessages, response.data]);
        setNewMessage('');
        setFiles([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setError(null);
        toast.success('Message sent successfully');
        // Rafraîchir les messages immédiatement
        fetchMessages();
      }
    } catch (error) {
      console.error('Erreur détaillée lors de l\'envoi du message:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        cvId,
        recipientId
      });
      
      let errorMessage = 'Erreur lors de l\'envoi du message';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (filename) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(
        `http://localhost:5000/api/messages/attachment/${filename}`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      toast.error('Erreur lors du téléchargement du fichier');
    }
  };

  const scrollToTop = () => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const onEmojiClick = (emojiObject) => {
    setNewMessage(prevMessage => prevMessage + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className="chat-content">
      <div className="chat-header">
        <div className="chat-header-left">
          <div className="avatar-wrapper">
            {recipientProfileImage ? (
              <img 
                src={recipientProfileImage} 
                alt={recipientName}
                className="profile-image"
              />
            ) : (
            <div className="avatar-placeholder">
              {recipientName.split(' ').map(name => name[0]).join('')}
            </div>
            )}
            <span className="status-dot online"></span>
          </div>
          <div className="recipient-info">
            <h3>{recipientName}</h3>
            <span className="status-text">Online</span>
          </div>
        </div>
        <div className="chat-header-actions">
          <button className="action-btn" title="Search">
            <i className="ph-bold ph-magnifying-glass"></i>
          </button>
          <button className="action-btn" title="More options">
            <i className="ph-bold ph-dots-three-vertical"></i>
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          <i className="ph-bold ph-warning-circle"></i>
          {error}
          <button className="alert-close" onClick={() => setError(null)}>
            <i className="ph-bold ph-x"></i>
          </button>
        </div>
      )}

      <div className="chat-messages-container">
      <div className="messages-wrapper">
          <div className="messages-container" ref={messagesContainerRef}>
            {isLoadingMore && (
              <div className="loading-more">
                <i className="ph-bold ph-spinner animate-spin"></i>
                <span>Loading messages...</span>
              </div>
            )}
            
          {messages.length === 0 ? (
            <div className="no-messages">
              <div className="no-messages-icon">
                  <i className="ph-bold ph-chat-centered-text"></i>
              </div>
                <h4>No messages</h4>
                <p>Start the conversation!</p>
            </div>
          ) : (
            <div className="messages-list">
              {messages.map((message, index) => {
                const userStr = localStorage.getItem('user');
                if (!userStr) {
                  console.error('Utilisateur non trouvé dans le localStorage');
                  return null;
                }

                let user;
                try {
                  user = JSON.parse(userStr);
                  // Vérifier toutes les possibilités d'ID
                  const userId = user.id || user._id || (user.user && (user.user.id || user.user._id));
                  if (!userId) {
                    console.error('ID utilisateur non trouvé dans:', user);
                    return null;
                  }
                  user._id = userId; // Normaliser l'ID
                } catch (error) {
                  console.error('Erreur lors du parsing des données utilisateur:', error);
                  return null;
                }

                if (!message.sender || !message.sender._id) {
                  console.error('Données de l\'expéditeur manquantes:', message);
                  return null;
                }
                
                // Ajout des logs pour déboguer
                console.log('Données utilisateur complètes:', {
                  userId: user._id,
                  userRole: user.role,
                  userName: user.firstName + ' ' + user.lastName
                });
                console.log('Comparaison des IDs:', {
                  userId: user._id,
                  senderId: message.sender._id,
                  messageContent: message.content
                });
                
                const isCurrentUser = user._id === message.sender._id;
                console.log('Est-ce le message de l\'utilisateur actuel?', isCurrentUser);
                
                return (
                  <div 
                    key={message._id} 
                    style={{
                      display: 'flex',
                      width: '100%',
                      justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
                      marginBottom: '16px'
                    }}
                  >
                    <div 
                      style={{
                        maxWidth: '65%',
                        padding: '12px 16px',
                        borderRadius: '18px',
                        backgroundColor: isCurrentUser ? '#0084ff' : '#f0f2f5',
                        color: isCurrentUser ? 'white' : 'black',
                        borderBottomRightRadius: isCurrentUser ? '4px' : '18px',
                        borderBottomLeftRadius: isCurrentUser ? '18px' : '4px',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                        wordBreak: 'break-word'
                      }}
                    >
                      <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.4' }}>
                        {message.content}
                      </p>
                      {message.attachments && message.attachments.length > 0 && (
                        <div style={{ marginTop: '8px' }}>
                          {message.attachments.map((attachment, index) => (
                            <div 
                              key={index}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px',
                                borderRadius: '10px',
                                backgroundColor: isCurrentUser ? 'rgba(255, 255, 255, 0.1)' : 'white',
                                color: isCurrentUser ? 'white' : 'black',
                                marginTop: '4px'
                              }}
                            >
                              <i className="ph-bold ph-file-text"></i>
                              <span>{attachment.filename}</span>
                              <i className="ph-bold ph-download"></i>
                            </div>
                          ))}
                        </div>
                      )}
                      <div style={{
                        fontSize: '11px',
                        marginTop: '4px',
                        textAlign: 'right',
                        color: isCurrentUser ? 'rgba(255, 255, 255, 0.7)' : '#65676b'
                      }}>
                        {new Date(message.createdAt).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        </div>
        <div className="custom-scrollbar" ref={scrollbarRef}>
          <div 
            className="scroll-thumb"
            style={{ 
              top: `${scrollPosition}%`,
              height: `${thumbHeight}px`,
              cursor: isDragging ? 'grabbing' : 'grab'
            }}
            onMouseDown={handleMouseDown}
          />
        </div>
        {showScrollButton && (
          <div className="scroll-controls">
            <button className="scroll-btn" onClick={scrollToTop} title="Voir les anciens messages">
              <i className="ph-bold ph-caret-up"></i>
            </button>
          </div>
        )}
      </div>

      <div className="chat-footer">
        <div className="message-form">
          <div className="form-actions">
            <button 
              type="button" 
              className="action-btn emoji-btn"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <i className="ph-bold ph-smiley"></i>
            </button>
            <button 
              type="button" 
              className="action-btn" 
              onClick={() => fileInputRef.current.click()}
            >
              <i className="ph-bold ph-paperclip"></i>
            </button>
          </div>

          {showEmojiPicker && (
            <div className="emoji-picker-container">
              <EmojiPicker
                onEmojiClick={onEmojiClick}
                width={300}
                height={400}
              />
            </div>
          )}
          
          <div className="input-wrapper">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Write your message..."
              className="message-input"
              disabled={loading}
            />
          </div>
          
          <button 
            type="submit" 
            className="send-btn" 
            onClick={handleSubmit} 
            disabled={loading}
          >
            {loading ? (
              <i className="ph-bold ph-spinner animate-spin"></i>
            ) : (
              <i className="ph-bold ph-paper-plane-right"></i>
            )}
          </button>

          <input
            type="file"
            multiple
            onChange={handleFileChange}
            ref={fileInputRef}
            className="file-input"
          />
        </div>

        {files.length > 0 && (
          <div className="selected-files">
            {files.map((file, index) => (
              <div key={index} className="selected-file">
                <i className="ph-bold ph-file-text"></i>
                <span>{file.name}</span>
                <button onClick={() => setFiles(files.filter((_, i) => i !== index))}>
                  <i className="ph-bold ph-x"></i>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .chat-content {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #ffffff;
          position: relative;
        }

        .chat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: #ffffff;
          border-bottom: 1px solid #e4e6eb;
          flex-shrink: 0;
          height: 60px;
        }

        .chat-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .avatar-wrapper {
          position: relative;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          overflow: hidden;
        }

        .profile-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }

        .avatar-placeholder {
          width: 100%;
          height: 100%;
          background: #e4e6eb;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          color: #65676b;
          font-size: 16px;
          text-transform: uppercase;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .status-dot {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #31a24c;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .recipient-info {
          display: flex;
          flex-direction: column;
        }

        .recipient-info h3 {
          margin: 0;
          font-size: 15px;
          font-weight: 600;
          color: #050505;
        }

        .status-text {
          font-size: 13px;
          color: #65676b;
        }

        .chat-header-actions {
          display: flex;
          gap: 8px;
        }

        .action-btn {
          width: 36px;
          height: 36px;
          border: none;
          border-radius: 50%;
          background: transparent;
          color: #0084ff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 20px;
        }

        .action-btn:hover {
          background: #f0f2f5;
        }

        .action-btn i {
          color: #0084ff;
          font-weight: bold;
        }

        .message-status i {
          color: #0084ff;
          font-weight: bold;
        }

        .attachment i {
          color: #0084ff;
          font-weight: bold;
        }

        .selected-file i {
          color: #0084ff;
          font-weight: bold;
        }

        .scroll-btn i {
          color: #0084ff;
          font-weight: bold;
        }

        .no-messages-icon i {
          color: #0084ff;
          font-weight: bold;
        }

        .alert i {
          color: #0084ff;
          font-weight: bold;
        }

        .alert-close i {
          color: #0084ff;
          font-weight: bold;
        }

        .loading-more i {
          color: #0084ff;
          font-weight: bold;
        }

        .chat-messages-container {
          flex: 1;
          position: relative;
          overflow: hidden;
          min-height: 0;
          background: linear-gradient(135deg, 
            rgba(0, 132, 255, 0.05) 0%,
            rgba(255, 165, 0, 0.05) 100%
          );
        }

        .messages-wrapper {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          overflow: hidden;
          background: 
            radial-gradient(circle at 20% 20%, rgba(0, 132, 255, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(255, 165, 0, 0.03) 0%, transparent 50%);
        }

        .messages-container {
          height: 100%;
          overflow-y: auto;
          padding: 16px;
          scroll-behavior: smooth;
          scrollbar-width: thin;
          -ms-overflow-style: none;
          background: transparent;
        }

        .messages-container::-webkit-scrollbar {
          width: 6px;
        }

        .messages-container::-webkit-scrollbar-track {
          background: transparent;
        }

        .messages-container::-webkit-scrollbar-thumb {
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 3px;
        }

        .messages-container::-webkit-scrollbar-thumb:hover {
          background-color: rgba(0, 0, 0, 0.3);
        }

        .messages-list {
          display: flex;
          flex-direction: column;
          padding: 16px;
          width: 100%;
        }

        .message-container {
          display: flex;
          width: 100%;
          margin-bottom: 16px;
        }

        .message-container.sent {
          justify-content: flex-end;
        }

        .message-container.received {
          justify-content: flex-start;
        }

        .message-bubble {
          max-width: 65%;
          padding: 12px 16px;
          border-radius: 18px;
          position: relative;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .sent .message-bubble {
          background-color: #0084ff;
          color: white;
          border-bottom-right-radius: 4px;
          margin-left: auto;
        }

        .received .message-bubble {
          background-color: #f0f2f5;
          color: #1c1e21;
          border-bottom-left-radius: 4px;
          margin-right: auto;
        }

        .message-text {
          margin: 0;
          font-size: 14px;
          line-height: 1.4;
        }

        .attachments {
          margin-top: 8px;
        }

        .attachment {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          border-radius: 10px;
          margin-top: 4px;
          cursor: pointer;
        }

        .sent .attachment {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .received .attachment {
          background: white;
          color: #1c1e21;
        }

        .message-time {
          font-size: 11px;
          margin-top: 4px;
          text-align: right;
        }

        .sent .message-time {
          color: rgba(255, 255, 255, 0.7);
        }

        .received .message-time {
          color: #65676b;
        }

        .no-messages {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          padding: 40px;
          text-align: center;
          animation: fadeIn 0.5s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .no-messages-icon {
          width: 64px;
          height: 64px;
          background: rgba(0, 132, 255, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }

        .no-messages-icon i {
          font-size: 32px;
          color: #0084ff;
          font-weight: bold;
        }

        .no-messages h4 {
          margin: 0 0 8px 0;
          font-size: 18px;
          color: #050505;
          font-weight: 600;
        }

        .no-messages p {
          margin: 0;
          font-size: 14px;
          color: #65676b;
          max-width: 300px;
          line-height: 1.5;
        }

        @media (max-width: 768px) {
          .message-bubble {
            max-width: 75%;
          }
        }

        .chat-footer {
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.9);
          border-top: 1px solid #e4e6eb;
          flex-shrink: 0;
          height: 60px;
          backdrop-filter: blur(5px);
        }

        .message-form {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(240, 242, 245, 0.9);
          padding: 8px 12px;
          border-radius: 24px;
          backdrop-filter: blur(5px);
        }

        .input-wrapper {
          flex: 1;
        }

        .message-input {
          width: 100%;
          border: none;
          background: transparent;
          padding: 8px;
          font-size: 15px;
          color: #050505;
          outline: none;
        }

        .message-input::placeholder {
          color: #65676b;
        }

        .send-btn {
          width: 36px;
          height: 36px;
          border: none;
          border-radius: 50%;
          background: linear-gradient(135deg, #0084ff, #0073e6);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 20px;
        }

        .send-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #0073e6, #0062cc);
          transform: scale(1.05);
        }

        .send-btn:disabled {
          background: #e4e6eb;
          cursor: not-allowed;
        }

        .file-input {
          display: none;
        }

        .selected-files {
          margin-top: 12px;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .selected-file {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          background: rgba(240, 242, 245, 0.9);
          border-radius: 16px;
          font-size: 13px;
          backdrop-filter: blur(5px);
        }

        .selected-file button {
          border: none;
          background: transparent;
          color: #65676b;
          cursor: pointer;
          padding: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s ease;
        }

        .selected-file button:hover {
          background: #e4e6eb;
          color: #050505;
        }

        .scroll-to-top {
          position: absolute;
          bottom: 20px;
          right: 20px;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0084ff, #0073e6);
          color: white;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          transition: all 0.2s ease;
          z-index: 1000;
        }

        .scroll-to-top:hover {
          background: linear-gradient(135deg, #0073e6, #0062cc);
          transform: translateY(-2px);
        }

        @media (max-width: 768px) {
          .chat-header {
            padding: 12px 16px;
            height: 60px;
          }

          .avatar-wrapper {
            width: 36px;
            height: 36px;
          }

          .recipient-info h3 {
            font-size: 14px;
          }

          .status-text {
            font-size: 12px;
          }

          .scroll-to-top {
            bottom: 16px;
            right: 16px;
            width: 36px;
            height: 36px;
          }
        }

        .emoji-picker-container {
          position: absolute;
          bottom: 100%;
          left: 0;
          margin-bottom: 10px;
          z-index: 1000;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          border-radius: 12px;
          overflow: hidden;
        }

        .emoji-btn {
          color: #0084ff;
          font-size: 20px;
          transition: all 0.2s ease;
        }

        .emoji-btn:hover {
          color: #0073e6;
          transform: scale(1.1);
        }

        .form-actions {
          display: flex;
          gap: 8px;
        }
      `}</style>
    </div>
  );
};

export default Chat; 