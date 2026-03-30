'use client';

import { useEffect, useState } from 'react';
import HeaderStudent from '@/components/Header';
import axios from 'axios';
import Link from 'next/link';
import InscriptionForm from '@/components/InscriptionForm';
import { toast } from 'react-hot-toast';

const FormationDetails = ({ params }) => {
  const [formation, setFormation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inscriptionError, setInscriptionError] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [showInscriptionForm, setShowInscriptionForm] = useState(false);
  const [inscriptionRequestSuccess, setInscriptionRequestSuccess] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [failedImages, setFailedImages] = useState(new Set());
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [quizResponses, setQuizResponses] = useState({});
  const [quizResults, setQuizResults] = useState(null);
  const [completedQuizzes, setCompletedQuizzes] = useState(new Set());
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    fetchFormationDetails();
    fetchComments();
    checkEnrollmentStatus();
  }, [params.id]);

  const fetchFormationDetails = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const userStr = localStorage.getItem('user');
      
      if (!token || !userStr) {
        console.error('User not logged in');
        setLoading(false);
        return;
      }

      const user = JSON.parse(userStr);
      const userId = user.id;

      console.log('=== Enrollment Check ===');
      console.log('User ID:', userId);
      console.log('Formation ID:', params.id);

      const response = await axios.get(`http://localhost:5000/api/formations/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Server response:', response.data);
      
      setFormation(response.data);
      
      // Check if user is enrolled
      const isEnrolled = response.data.enrolledStudents.some(student => 
        student._id === userId || student.id === userId
      );
      
      console.log('Enrollment status:', isEnrolled);
      setIsEnrolled(isEnrolled);

      if (response.data.videos && response.data.videos.length > 0) {
        setSelectedVideo(response.data.videos[0]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching details:', error);
      setError('Error loading formation details');
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`http://localhost:5000/api/formations/${params.id}/comments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Map comments with proper user data
      const commentsWithProfiles = response.data.map(comment => ({
        ...comment,
        user: {
          ...comment.userId,
          _id: comment.userId._id,
          profileImage: comment.userId.profileImage || null
        },
        replies: comment.replies?.map(reply => ({
          ...reply,
          user: {
            ...reply.userId,
            _id: reply.userId._id,
            profileImage: reply.userId.profileImage || null
          }
        }))
      }));
      
      setComments(commentsWithProfiles);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('authToken');
      const user = JSON.parse(localStorage.getItem('user'));
      
      const response = await axios.post(
        `http://localhost:5000/api/formations/${params.id}/comments`,
        { 
          content: newComment.trim(),
          parentId: null
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Refresh comments to get the updated list with proper user data
      await fetchComments();
      
      setNewComment('');
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      toast.error(error.response?.data?.message || 'Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const token = localStorage.getItem('authToken');
      await axios.delete(
        `http://localhost:5000/api/formations/${params.id}/comments/${commentId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setComments(prevComments => prevComments.filter(comment => comment._id !== commentId));
      toast.success('Comment deleted successfully');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error(error.response?.data?.message || 'Failed to delete comment');
    }
  };

  const handleVideoSelect = (video) => {
    setSelectedVideo(video);
    setIsVideoPlaying(true);
  };

  const handleInscriptionSuccess = () => {
    setInscriptionRequestSuccess(true);
    setShowInscriptionForm(false);
    setInscriptionError(null);
    setTimeout(() => {
      setInscriptionRequestSuccess(false);
    }, 3000);
  };

  const handleInscriptionError = (error) => {
    console.error('Error during enrollment:', error);
    setInscriptionError(error.response?.data?.message || 'An error occurred during enrollment');
  };

  const handleReply = (commentId) => {
    if (replyTo === commentId) {
      setReplyTo(null);
      setReplyContent('');
    } else {
      setReplyTo(commentId);
      setReplyContent('');
    }
  };

  const handleReplySubmit = async (commentId, replyToId = null) => {
    if (!replyContent.trim()) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await axios.post(
        `http://localhost:5000/api/formations/${params.id}/comments`,
        {
          content: replyContent.trim(),
          parentId: commentId,
          replyToId: replyToId
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Refresh comments to get the updated list with proper user data
      await fetchComments();
      
      setReplyContent('');
      setReplyTo(null);
      toast.success('Reply added successfully');
    } catch (error) {
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      toast.error(error.response?.data?.message || 'Unable to add reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageError = (userId) => {
    setFailedImages(prev => new Set([...prev, userId]));
  };

  const handleQuizSelect = (quiz) => {
    setSelectedQuiz(quiz);
    setQuizResponses({});
    setQuizResults(null);
  };

  const handleAnswerSelect = (questionIndex, answerIndex) => {
    setQuizResponses(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }));
  };

  const handleQuizSubmit = async () => {
    if (!selectedQuiz) {
      console.error('No quiz selected');
      return;
    }

    // Authentication check
    const token = localStorage.getItem('authToken');
    let user;
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        console.error('User data not found in localStorage');
        toast.error('Please login again');
        return;
      }

      user = JSON.parse(userStr);
      const userId = user._id || user.id;
      if (!userId) {
        console.error('Missing user ID');
        toast.error('Invalid user data');
        return;
      }
      user._id = userId;
    } catch (error) {
      console.error('Error retrieving user data:', error);
      toast.error('Error retrieving user data');
      return;
    }

    if (!formation) {
      console.error('Missing formation data');
      toast.error('Error: incomplete formation data');
      return;
    }

    // Calculate answers and score
    let correctAnswers = 0;
    let results = [];

    // Calculate answers
    results = selectedQuiz.questions.map((question, index) => {
      const userAnswerIndex = quizResponses[index];
      const isCorrect = userAnswerIndex === question.correctAnswer;
      if (isCorrect) correctAnswers++;
      
      return {
        question: question.question,
        userAnswer: userAnswerIndex,
        correctAnswer: question.correctAnswer,
        isCorrect
      };
    });

    // Calculate score (out of 20)
    const score = (correctAnswers / selectedQuiz.questions.length) * 20;

    try {
      // Final check of required data
      if (!selectedQuiz._id || !user._id || !formation.instructorId) {
        console.error('Missing required data:', {
          quizId: selectedQuiz._id,
          userId: user._id,
          instructorId: formation.instructorId
        });
        toast.error('Missing data for quiz submission');
        return;
      }

      // Prepare data with value verification
      const quizData = {
        formationId: params.id,
        quizId: selectedQuiz._id,
        studentId: user._id,
        instructorId: formation.instructorId,
        quizTitle: selectedQuiz.title,
        score: parseFloat(score.toFixed(2)),
        totalQuestions: selectedQuiz.questions.length,
        correctAnswers: correctAnswers,
        answers: results,
        status: score >= 10 ? 'Passed' : 'Failed'
      };

      console.log('Quiz data to send:', quizData);

      const response = await axios.post(
        `http://localhost:5000/api/formations/${params.id}/quiz-results`,
        quizData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Server response:', response.data);

      setQuizResults({
        score,
        details: results,
        totalQuestions: selectedQuiz.questions.length,
        correctAnswers
      });

      setCompletedQuizzes(prev => new Set([...prev, selectedQuiz._id]));
      toast.success('Quiz completed successfully!');
    } catch (error) {
      console.error('Detailed error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach(err => {
          toast.error(`${err.field}: ${err.message}`);
        });
      } else {
        toast.error('Error submitting quiz: ' + error.message);
      }
    }
  };

  const checkEnrollmentStatus = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(
        `http://localhost:5000/api/formations/${params.id}/check-enrollment`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      setIsEnrolled(response.data.isEnrolled);
    } catch (error) {
      console.error('Error checking enrollment:', error);
    }
  };

  const handleEnrollment = async () => {
    try {
      setEnrolling(true);
      const token = localStorage.getItem('authToken');
        const userStr = localStorage.getItem('user');
        
        if (!token || !userStr) {
            toast.error('Please login to enroll');
        return;
      }

        // Parse user data
        const user = JSON.parse(userStr);
        const userId = user._id || user.id;

      console.log('=== Enrollment Details ===');
      console.log('Formation ID:', params.id);
        console.log('User ID:', userId);
        console.log('Token present:', !!token);
        console.log('User data:', user);

        // Check and update user interests if necessary
      try {
            const userResponse = await axios.get(
                `http://localhost:5000/api/users/${userId}`,
          {
            headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            const userData = userResponse.data;
            console.log('User data:', userData);

            if (!userData.interests || userData.interests.length === 0) {
                // Update user interests with formation category
                const formationResponse = await axios.get(
                    `http://localhost:5000/api/formations/${params.id}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );

                const formation = formationResponse.data;
                const defaultInterests = [formation.category];

                await axios.put(
                    `http://localhost:5000/api/users/${userId}`,
                    {
                        ...userData,
                        interests: defaultInterests
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );

                console.log('Updated interests:', defaultInterests);

                // Update user data in localStorage
                const updatedUser = { ...user, interests: defaultInterests };
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }
        } catch (userError) {
            console.error('Error updating interests:', userError.response?.data || userError.message);
            toast.error('Error updating profile');
        setEnrolling(false);
        return;
      }

      // Proceed with enrollment
      const response = await axios.post(
        `http://localhost:5000/api/formations/${params.id}/register`,
        {},
        {
          headers: {
                    'Authorization': `Bearer ${token}`
          }
        }
      );
      
      console.log('Server response:', response.data);

      setIsEnrolled(true);
      toast.success('Successfully enrolled in the formation!');
      
      // Update enrolled students count
      setFormation(prev => ({
        ...prev,
            enrolledStudents: [...(prev.enrolledStudents || []), userId]
      }));

        // Refresh formation details
        await fetchFormationDetails();
    } catch (error) {
        console.error('Detailed error:', {
        status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data
        });

        if (error.response?.status === 400) {
            const errorData = error.response.data;
            if (errorData.message) {
                toast.error(errorData.message);
            }
            if (errorData.errors && Array.isArray(errorData.errors)) {
                errorData.errors.forEach(err => {
                    console.error('Validation error:', err);
                    toast.error(err.message || err);
                });
            }
        } else {
      toast.error(error.response?.data?.message || 'Error enrolling in the formation');
        }
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <>
        <HeaderStudent />
        <div className="container py-5">
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <HeaderStudent />
        <div className="container py-5">
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        </div>
      </>
    );
  }

  if (!formation) {
    return (
      <>
        <HeaderStudent />
        <div className="container py-5">
          <div className="alert alert-warning" role="alert">
            Formation not found
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <HeaderStudent />
      <section className="course-details py-120">
        <div className="container">
          <div className="row gy-4">
            <div className="col-xl-8">
              <div className="course-details__content border border-neutral-30 rounded-12 bg-white p-12">
                {selectedQuiz ? (
                  <div className="quiz-section p-4">
                    <div className="quiz-header mb-4">
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="quiz-title">
                          <h3 className="mb-2">{selectedQuiz.title}</h3>
                          <p className="text-muted mb-0">
                            <i className="ph ph-question me-2"></i>
                            {selectedQuiz.questions?.length || 0} questions
                          </p>
                    </div>
                        <button
                          className="btn btn-outline-primary rounded-circle"
                          onClick={() => setSelectedQuiz(null)}
                        >
                          <i className="ph ph-x"></i>
                        </button>
                      </div>
                      <div className="quiz-progress mt-4">
                        <div className="progress" style={{ height: '8px' }}>
                          <div
                            className="progress-bar"
                            role="progressbar"
                                      style={{
                              width: `${(Object.keys(quizResponses).length / selectedQuiz.questions.length) * 100}%`,
                              transition: 'width 0.3s ease'
                            }}
                            aria-valuenow={(Object.keys(quizResponses).length / selectedQuiz.questions.length) * 100}
                            aria-valuemin="0"
                            aria-valuemax="100"
                          ></div>
                                    </div>
                        <p className="text-end mt-2 text-muted">
                          {Object.keys(quizResponses).length} / {selectedQuiz.questions.length} questions answered
                        </p>
                                </div>
                                </div>

                    {!quizResults ? (
                      <div className="quiz-questions">
                        {selectedQuiz.questions.map((question, questionIndex) => (
                          <div 
                            key={questionIndex} 
                            className={`question-card mb-4 p-4 border rounded-4 bg-white quiz-animate ${
                              quizResponses[questionIndex] !== undefined ? 'answered' : ''
                            }`}
                          >
                            <div className="question-header d-flex align-items-center mb-3">
                              <div className="question-number me-3">
                                <span className="badge bg-primary rounded-circle d-flex align-items-center justify-content-center">
                                  {questionIndex + 1}
                                </span>
                              </div>
                              <h5 className="mb-0">{question.question}</h5>
                            </div>
                            <div className="options-grid">
                              {question.options.map((option, optionIndex) => (
                                <div
                                  key={optionIndex}
                                  className={`option-item ${
                                    quizResponses[questionIndex] === optionIndex ? 'selected' : ''
                                  }`}
                                  onClick={() => handleAnswerSelect(questionIndex, optionIndex)}
                                >
                                  <div className="form-check">
                                    <input
                                      type="radio"
                                      className="form-check-input"
                                      name={`question-${questionIndex}`}
                                      id={`q${questionIndex}-option${optionIndex}`}
                                      checked={quizResponses[questionIndex] === optionIndex}
                                      onChange={() => handleAnswerSelect(questionIndex, optionIndex)}
                                    />
                                    <label
                                      className="form-check-label"
                                      htmlFor={`q${questionIndex}-option${optionIndex}`}
                                    >
                                      {option}
                                    </label>
                              </div>
                            </div>
                              ))}
                            </div>
                          </div>
                        ))}
                        <div className="text-center">
                                  <button
                            className="btn btn-primary btn-lg px-5 py-3 rounded-pill quiz-submit-btn"
                            onClick={handleQuizSubmit}
                            disabled={Object.keys(quizResponses).length !== selectedQuiz.questions.length}
                          >
                            <i className="ph ph-check me-2"></i>
                            Submit Quiz
                                  </button>
                                </div>
                              </div>
                    ) : (
                      <div className="quiz-results quiz-animate">
                        <div className={`result-card p-4 rounded-4 mb-4 ${
                          quizResults.score >= 10 ? 'success-card' : 'warning-card'
                        }`}>
                          <div className="text-center mb-4">
                            <div className="result-icon mb-3">
                              <i className={`ph ph-${quizResults.score >= 10 ? 'trophy' : 'warning'}`}></i>
                                          </div>
                            <h3 className="result-score mb-2">
                              {quizResults.score.toFixed(2)}/20
                            </h3>
                            <p className="result-text mb-0">
                              You answered correctly {quizResults.correctAnswers} out of {quizResults.totalQuestions}.
                              {quizResults.score >= 10
                                ? ' Congratulations! You passed the quiz!'
                                : ' Unfortunately, you did not meet the minimum passing score.'}
                            </p>
                                      </div>
                                      </div>

                        <div className="results-details">
                          {quizResults.details.map((result, index) => (
                            <div
                              key={index}
                              className={`result-item p-4 mb-3 rounded-4 quiz-animate ${
                                result.isCorrect ? 'correct-answer' : 'wrong-answer'
                              }`}
                            >
                              <div className="d-flex align-items-start">
                                <div className="result-icon me-3">
                                  <i className={`ph ph-${result.isCorrect ? 'check-circle' : 'x-circle'}`}></i>
                                    </div>
                                <div className="flex-grow-1">
                                  <h5 className="mb-3">Question {index + 1}: {result.question}</h5>
                                  <div className="answer-details">
                                    <p className="mb-2">
                                      <span className="text-muted">Your answer:</span>{' '}
                                      <span className={result.isCorrect ? 'text-success' : 'text-danger'}>
                                        {result.userAnswer}
                                      </span>
                                    </p>
                                    {!result.isCorrect && (
                                      <p className="mb-0">
                                        <span className="text-muted">Correct answer:</span>{' '}
                                        <span className="text-success">{result.correctAnswer}</span>
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                                  </div>
                                ))}
                              </div>

                        <div className="text-center mt-4">
                          <button
                            className="btn btn-primary btn-lg px-5 py-4 rounded-pill return-button"
                            onClick={() => setSelectedQuiz(null)}
                          >
                            <i className="ph ph-arrow-left me-2"></i>
                            Back to Course
                          </button>
                          </div>
                      </div>
                      )}
                    </div>
                ) : (
                  <>
                    <div className="video-player mb-40">
                      {selectedVideo ? (
                        <div className="video-container rounded-16 overflow-hidden">
                          <video
                            className="w-100"
                            controls
                            autoPlay={isVideoPlaying}
                            src={selectedVideo.url}
                            poster={selectedVideo.thumbnail || '/assets/images/video-placeholder.jpg'}
                          >
                            Your browser does not support video playback.
                          </video>
                  </div>
                      ) : (
                        <div className="text-center py-80">
                          <i className="ph ph-video-camera text-primary mb-16" style={{ fontSize: '48px' }}></i>
                          <p className="text-neutral-500">Select a video to start</p>
                </div>
                      )}
                    </div>

                    <div className="p-20">
                      <h2 className="mt-24 mb-24">{formation.title}</h2>
                      <p className="text-neutral-700">{formation.description}</p>

                      {/* Section Commentaires */}
                      <div className="comments-section mt-5">
                        <h4 className="comments-title mb-4">
                          <i className="ph ph-chats-circle text-primary me-2"></i>
                          Discussion ({comments.length})
                        </h4>

                        {/* Formulaire de commentaire */}
                        <div className="comment-form mb-4">
                          <form onSubmit={handleCommentSubmit} className="position-relative">
                            <textarea
                              className="form-control comment-input"
                              placeholder="Share your thoughts..."
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              rows="3"
                            ></textarea>
                            <button
                              type="submit"
                              className="btn btn-primary comment-submit-btn"
                              disabled={isSubmitting || !newComment.trim()}
                            >
                              {isSubmitting ? (
                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                              ) : (
                                <i className="ph ph-paper-plane-tilt"></i>
                              )}
                            </button>
                          </form>
                    </div>

                        {/* Liste des commentaires */}
                        <div className="comments-list">
                          {comments.map((comment) => (
                            <div key={comment._id} className="comment-card">
                              <div className="comment-header">
                                <div className="comment-user-info">
                                  {comment.user?.profileImage && !failedImages.has(comment.user._id) ? (
                                    <img
                                      src={comment.user.profileImage.startsWith('data:') 
                                        ? comment.user.profileImage 
                                        : `http://localhost:5000/${comment.user.profileImage}`}
                                      alt={`${comment.user.firstName} ${comment.user.lastName}`}
                                      className="comment-avatar"
                                      onError={() => handleImageError(comment.user._id)}
                                    />
                                  ) : (
                                    <div className="comment-avatar-placeholder">
                                      {`${comment.user?.firstName?.[0] || ''}${comment.user?.lastName?.[0] || ''}`.toUpperCase()}
                                    </div>
                                  )}
                                  <div className="comment-meta">
                                    <h6 className="comment-author">
                                      {comment.user?.firstName} {comment.user?.lastName}
                                    </h6>
                                    <span className="comment-date">
                                      {new Date(comment.createdAt).toLocaleDateString('en-US', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
              </div>
                                </div>
                                <button
                                  className="btn btn-primary btn-sm rounded-pill reply-button"
                                  onClick={() => handleReply(comment._id)}
                                >
                                  <i className="ph ph-chat-circle-text"></i>
                                </button>
            </div>

                              <div className="comment-content">
                                <p>{comment.content}</p>
                    </div>

                              {/* Formulaire de réponse */}
                              {replyTo === comment._id && (
                                <div className="reply-form">
                                  <textarea
                                    className="form-control reply-input"
                                    placeholder="Your reply..."
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    rows="2"
                                  ></textarea>
                                  <div className="reply-actions mt-2">
                                    <button
                                      className="btn btn-primary btn-sm rounded-pill"
                                      onClick={() => handleReplySubmit(comment._id)}
                                      disabled={isSubmitting || !replyContent.trim()}
                                    >
                                      {isSubmitting ? (
                                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  ) : (
                    <i className="ph ph-paper-plane-tilt"></i>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Réponses aux commentaires */}
                              {comment.replies && comment.replies.length > 0 && (
                                <div className="replies-list">
                                  {comment.replies.map((reply) => (
                                    <div key={reply._id} className="reply-card">
                                      <div className="reply-header">
                                        <div className="reply-user-info">
                                          {reply.user?.profileImage && !failedImages.has(reply.user._id) ? (
                                            <img
                                              src={reply.user.profileImage.startsWith('data:') 
                                                ? reply.user.profileImage 
                                                : `http://localhost:5000/${reply.user.profileImage}`}
                                              alt={`${reply.user.firstName} ${reply.user.lastName}`}
                                              className="reply-avatar"
                                              onError={() => handleImageError(reply.user._id)}
                                            />
                                          ) : (
                                            <div className="reply-avatar-placeholder">
                                              {`${reply.user?.firstName?.[0] || ''}${reply.user?.lastName?.[0] || ''}`.toUpperCase()}
                                            </div>
                                          )}
                                          <div className="reply-meta">
                                            <h6 className="reply-author">
                                              {reply.user?.firstName} {reply.user?.lastName}
                                            </h6>
                                            <span className="reply-date">
                                              {new Date(reply.createdAt).toLocaleDateString('en-US', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                              })}
                                            </span>
                                          </div>
                                        </div>
                                        <div className="reply-actions">
                        <button 
                                            className="btn btn-primary btn-sm rounded-pill reply-button"
                                            onClick={(e) => {
                                              e.preventDefault();
                                              handleReply(reply._id);
                                            }}
                                          >
                                            <i className="ph ph-chat-circle-text"></i>
                        </button>
                                        </div>
                                      </div>
                                      <div className="reply-content">
                                        <p>{reply.content}</p>
                                      </div>

                                      {/* Formulaire de réponse pour les réponses */}
                                      {replyTo === reply._id && (
                                        <div className="nested-reply-form">
                                          <textarea
                                            className="form-control reply-input"
                                            placeholder="Your reply..."
                                            value={replyContent}
                                            onChange={(e) => setReplyContent(e.target.value)}
                                            rows="2"
                                          ></textarea>
                                          <div className="reply-actions mt-2">
                                            <button
                                              className="btn btn-primary btn-sm rounded-pill"
                                              onClick={() => handleReplySubmit(comment._id, reply._id)}
                                              disabled={isSubmitting || !replyContent.trim()}
                                            >
                                              {isSubmitting ? (
                                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                              ) : (
                                                <i className="ph ph-paper-plane-tilt"></i>
                                              )}
                                            </button>
                                          </div>
                                        </div>
                                      )}

                                      {/* Réponses imbriquées */}
                                      {reply.replies && reply.replies.length > 0 && (
                                        <div className="nested-replies-list">
                                          {reply.replies.map((nestedReply) => (
                                            <div key={nestedReply._id} className="nested-reply-card">
                                              <div className="reply-header">
                                                <div className="reply-user-info">
                                                  {nestedReply.user?.profileImage && !failedImages.has(nestedReply.user._id) ? (
                                                    <img
                                                      src={nestedReply.user.profileImage.startsWith('data:') 
                                                        ? nestedReply.user.profileImage 
                                                        : `http://localhost:5000/${nestedReply.user.profileImage}`}
                                                      alt={`${nestedReply.user.firstName} ${nestedReply.user.lastName}`}
                                                      className="reply-avatar"
                                                      onError={() => handleImageError(nestedReply.user._id)}
                                                    />
                                                  ) : (
                                                    <div className="reply-avatar-placeholder">
                                                      {`${nestedReply.user?.firstName?.[0] || ''}${nestedReply.user?.lastName?.[0] || ''}`.toUpperCase()}
                                                    </div>
                                                  )}
                                                  <div className="reply-meta">
                                                    <h6 className="reply-author">
                                                      {nestedReply.user?.firstName} {nestedReply.user?.lastName}
                                                    </h6>
                                                    <span className="reply-date">
                                                      {new Date(nestedReply.createdAt).toLocaleDateString('en-US', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                      })}
                                                    </span>
                                                  </div>
                                                </div>
                                              </div>
                                              <div className="reply-content">
                                                <p>{nestedReply.content}</p>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    </>
                  )}
              </div>
                </div>

            <div className="col-xl-4">
              <div className="course-details__sidebar border border-neutral-30 rounded-12 bg-white p-24">
                <div className="formation-info mb-24">
                  <div className="d-flex align-items-center mb-16">
                    <i className="ph ph-clock text-primary me-12"></i>
                    <span>Duration: {formation.duration}h</span>
                  </div>
                  <div className="d-flex align-items-center mb-16">
                    <i className="ph ph-users text-primary me-12"></i>
                    <span>{formation.enrolledStudents?.length || 0} enrolled students</span>
                  </div>
                  <div className="d-flex align-items-center mb-16">
                    <i className="ph ph-book-open text-primary me-12"></i>
                    <span>{formation.videos?.length || 0} videos</span>
                  </div>
                  <div className="d-flex align-items-center mb-16">
                    <i className="ph ph-file-pdf text-primary me-12"></i>
                    <span>{formation.documents?.length || 0} documents</span>
                  </div>
                  <div className="d-flex align-items-center mb-24">
                    <i className="ph ph-exam text-primary me-12"></i>
                    <span>{formation.quizzes?.length || 0} quizzes</span>
                  </div>

                  {isEnrolled ? (
                    <div className="enrolled-status">
                      <i className="ph ph-check-circle text-success me-2"></i>
                      <span className="text-success">You are enrolled in this course</span>
                    </div>
                  ) : (
                    <button 
                      className="btn btn-primary w-100 registration-btn"
                      onClick={handleEnrollment}
                      disabled={enrolling}
                    >
                      {enrolling ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Enrollment in progress...
                        </>
                      ) : (
                        <>
                          <i className="ph ph-sign-in me-2"></i>
                          Enroll in the course
                        </>
                      )}
                    </button>
                  )}
                </div>

                <span className="d-block border-bottom border-neutral-30 my-24" />

                <div className="accordion common-accordion style-three" id="accordionExample">
                  <div className="accordion-item">
                    <h2 className="accordion-header bg-main-25">
                      <button
                        className="accordion-button bg-main-25"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#collapseOne"
                        aria-expanded="true"
                        aria-controls="collapseOne"
                      >
                        Course Content
                      </button>
                    </h2>
                    <div
                      id="collapseOne"
                      className="accordion-collapse collapse show"
                      data-bs-parent="#accordionExample"
                    >
                      <div className="accordion-body p-0 bg-main-25">
                        {/* Videos Section */}
                        <div className="section-title p-16 bg-light border-bottom">
                          <h6 className="mb-0">
                            <i className="ph ph-video-camera text-primary me-2"></i>
                            Video Lessons
                          </h6>
                        </div>
                        {formation.videos?.map((video, index) => (
                          <div 
                            key={video._id || index} 
                            className={`curriculam-item p-16 ${
                              selectedVideo?._id === video._id ? 'active-item' : ''
                            }`}
                            onClick={() => handleVideoSelect(video)}
                          >
                            <div className="d-flex align-items-center">
                              <div className="video-number me-3">
                                <span className="badge bg-primary rounded-circle">
                                  {index + 1}
                                </span>
                              </div>
                              <div className="flex-grow-1">
                                <h6 className="mb-0">{video.title}</h6>
                                <small className="text-neutral-500">
                                  <i className="ph ph-clock me-1"></i>
                                  {video.duration} min
                                </small>
                              </div>
                              <i className="ph ph-play-circle text-primary"></i>
                            </div>
                          </div>
                        ))}

                        {/* Documents Section */}
                        {formation.documents?.length > 0 && (
                          <>
                            <div className="section-title p-16 bg-light border-bottom mt-3">
                              <h6 className="mb-0">
                                <i className="ph ph-file-pdf text-primary me-2"></i>
                                Course Materials
                              </h6>
                            </div>
                            <div className="documents-grid">
                            {formation.documents.map((document, index) => (
                              <div 
                                key={`doc-${index}`}
                                  className="document-card p-16"
                              >
                                <div className="d-flex align-items-center">
                                    <div className="document-icon me-3">
                                      <i className="ph ph-file-pdf text-primary fs-4"></i>
                                  </div>
                                    <div className="flex-grow-1">
                                      <h6 className="mb-1">{document.title}</h6>
                                      <small className="text-neutral-500 d-block mb-2">{document.description}</small>
                                  <a
                                    href={document.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                        className="btn btn-sm btn-outline-primary rounded-pill"
                                    download
                                  >
                                        <i className="ph ph-download me-1"></i>
                                        Download PDF
                                  </a>
                                    </div>
                                </div>
                              </div>
                            ))}
                            </div>
                          </>
                        )}

                        {/* Quiz Section */}
                        {formation.quizzes?.length > 0 && (
                          <>
                            <div className="section-title p-16 bg-light border-bottom mt-3">
                              <h6 className="mb-0">
                                <i className="ph ph-exam text-primary me-2"></i>
                                Assessment Quizzes
                              </h6>
                            </div>
                            <div className="quiz-grid">
                            {formation.quizzes.map((quiz, index) => (
                              <div 
                                key={`quiz-${index}`}
                                  className={`quiz-card p-16 ${completedQuizzes.has(quiz._id) ? 'completed-quiz' : ''}`}
                                onClick={() => !completedQuizzes.has(quiz._id) && handleQuizSelect(quiz)}
                              >
                                <div className="d-flex align-items-center">
                                    <div className="quiz-icon me-3">
                                      <span className={`quiz-status-icon ${completedQuizzes.has(quiz._id) ? 'completed' : ''}`}>
                                        <i className={`ph ${completedQuizzes.has(quiz._id) ? 'ph-check-circle' : 'ph-exam'}`}></i>
                                      </span>
                                    </div>
                                  <div className="flex-grow-1">
                                      <h6 className="mb-1">{quiz.title}</h6>
                                      <div className="quiz-info">
                                        <span className="badge bg-light text-primary me-2">
                                          <i className="ph ph-question me-1"></i>
                                          {quiz.questions?.length || 0} questions
                                        </span>
                                        <span className="badge bg-light text-primary">
                                          <i className="ph ph-clock me-1"></i>
                                          {quiz.questions?.length * 2} min
                                        </span>
                                  </div>
                                      {completedQuizzes.has(quiz._id) ? (
                                        <span className="badge bg-success mt-2">Completed</span>
                                      ) : (
                                        <button className="btn btn-sm btn-outline-primary mt-2 rounded-pill">
                                          Start Quiz
                                        </button>
                                      )}
                                    </div>
                                </div>
                              </div>
                            ))}
                            </div>
                          </>
                        )}
                              </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          .course-details {
            background: linear-gradient(to bottom, #f8f9fa, #ffffff);
            padding: 3rem 0;
          }

          .video-container {
            position: relative;
            padding-top: 56.25%;
            background-color: #000;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }

          .video-container video {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .curriculam-item {
            cursor: pointer;
            transition: all 0.3s ease;
            border-bottom: 1px solid rgba(0,0,0,0.1);
            position: relative;
            overflow: hidden;
          }

          .curriculam-item:hover {
            background-color: #f8f9fa;
            transform: translateX(5px);
          }

          .curriculam-item.active-item {
            background-color: #e3f2fd;
            border-left: 4px solid #0d6efd;
          }

          .video-number .badge {
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.875rem;
          }

          .documents-grid {
            display: grid;
            gap: 0.5rem;
          }

          .document-card {
            background-color: #ffffff;
            transition: all 0.3s ease;
            border-radius: 8px;
            border: 1px solid #e9ecef;
          }

          .document-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }

          .quiz-grid {
            display: grid;
            gap: 0.5rem;
          }

          .quiz-card {
            background-color: #ffffff;
            transition: all 0.3s ease;
            border-radius: 8px;
            border: 1px solid #e9ecef;
            cursor: pointer;
          }

          .quiz-card:hover:not(.completed-quiz) {
            transform: translateY(-2px);
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }

          .quiz-status-icon {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background-color: #e3f2fd;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #0d6efd;
            font-size: 1.25rem;
          }

          .quiz-status-icon.completed {
            background-color: #d4edda;
            color: #28a745;
          }

          .quiz-info {
            margin-top: 0.5rem;
          }

          .completed-quiz {
            background-color: #f8f9fa;
            opacity: 0.8;
          }

          .section-title {
            background-color: #f8f9fa;
            border-left: 4px solid #0d6efd;
          }

          @media (max-width: 768px) {
            .course-details__sidebar {
              margin-top: 2rem;
            }

            .documents-grid,
            .quiz-grid {
              grid-template-columns: 1fr;
            }
          }

          @media (min-width: 769px) {
            .documents-grid,
            .quiz-grid {
              grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            }
          }

          .return-button {
            font-size: 1.1rem;
            font-weight: 600;
            min-height: 60px;
            min-width: 200px;
            transition: all 0.3s ease;
          }

          .return-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(13, 110, 253, 0.2);
          }

          /* Styles pour la section commentaires */
          .comments-section {
            margin-top: 3rem;
            padding-top: 2rem;
            border-top: 1px solid #e9ecef;
          }

          .comments-title {
            font-size: 1.5rem;
            font-weight: 600;
            color: #2c3345;
            margin-bottom: 1.5rem;
          }

          .comment-form {
            margin-bottom: 2rem;
          }

          .comment-input {
            border-radius: 12px;
            border: 2px solid #e9ecef;
            padding: 1rem;
            font-size: 1rem;
            resize: none;
            transition: all 0.3s ease;
          }

          .comment-input:focus {
            border-color: #0d6efd;
            box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
          }

          .comment-submit-btn {
            position: absolute;
            bottom: 1rem;
            right: 1rem;
            border-radius: 50%;
            padding: 0.75rem;
            height: 45px;
            width: 45px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            background-color: #0d6efd;
            border: none;
          }

          .comment-submit-btn i {
            font-size: 1.4rem;
          }

          .comment-submit-btn:hover {
            background-color: #0b5ed7;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(13, 110, 253, 0.25);
          }

          .comment-submit-btn:hover i {
            transform: scale(1.1);
            transition: transform 0.2s ease;
          }

          .comment-card {
            background: #ffffff;
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            transition: all 0.3s ease;
          }

          .comment-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }

          .comment-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 1rem;
            padding: 1rem;
            background-color: #f8f9fa;
            border-radius: 12px;
          }

          .comment-actions {
            display: flex;
            align-items: center;
            margin-left: 1rem;
          }

          .comment-actions button.btn-primary {
            background-color: #0d6efd;
            border-color: #0d6efd;
            color: white;
            padding: 0.375rem 1.25rem;
            font-size: 0.875rem;
            transition: all 0.3s ease;
            border-radius: 50px;
            white-space: nowrap;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .comment-actions button.btn-primary:hover {
            background-color: #0b5ed7;
            border-color: #0b5ed7;
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(13, 110, 253, 0.25);
          }

          .comment-user-info {
            display: flex;
            align-items: center;
            gap: 1rem;
          }

          .comment-meta {
            display: flex;
            flex-direction: column;
          }

          .comment-author {
            font-size: 1rem;
            font-weight: 600;
            color: #2c3345;
            margin: 0;
          }

          .comment-date {
            font-size: 0.875rem;
            color: #6c757d;
          }

          .comment-content {
            padding: 1rem;
          }

          .reply-button {
            background-color: #0d6efd;
            border-color: #0d6efd;
            color: white;
            padding: 0.75rem;
            height: 45px;
            width: 45px;
            border-radius: 50%;
            font-size: 0.875rem;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-left: auto;
          }

          .reply-button i {
            font-size: 1.4rem;
          }

          .reply-button:hover {
            background-color: #0b5ed7;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(13, 110, 253, 0.25);
          }

          .reply-button:hover i {
            transform: scale(1.1);
            transition: transform 0.2s ease;
          }

          .reply-form {
            margin-top: 1rem;
            margin-left: 3rem;
            padding: 1rem;
            background: #f8f9fa;
            border-radius: 12px;
            border-left: 3px solid #0d6efd;
          }

          .reply-input {
            border: 2px solid #e9ecef;
            border-radius: 12px;
            padding: 0.75rem;
            margin-bottom: 1rem;
            transition: all 0.3s ease;
          }

          .reply-input:focus {
            border-color: #0d6efd;
            box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.1);
          }

          @media (max-width: 768px) {
            .comment-header {
              flex-direction: column;
              gap: 1rem;
            }

            .reply-button {
              margin-left: 0;
              width: 100%;
              justify-content: center;
            }
          }

          .comment-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            object-fit: cover;
            border: 2px solid #fff;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }

          .comment-avatar-placeholder {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background-color: #0d6efd;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: 600;
            border: 2px solid #fff;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }

          .reply-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            object-fit: cover;
            border: 2px solid #fff;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }

          .reply-avatar-placeholder {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background-color: #6c757d;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 600;
            border: 2px solid #fff;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }

          .replies-list {
            margin-left: 3rem;
            margin-top: 1rem;
            border-left: 2px solid #e9ecef;
            padding-left: 1rem;
          }

          .reply-card {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1rem;
            transition: all 0.3s ease;
          }

          .reply-card:hover {
            background: #f0f0f0;
          }

          .reply-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;
          }

          .reply-user-info {
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }

          .reply-meta {
            display: flex;
            flex-direction: column;
          }

          .reply-author {
            font-size: 0.9rem;
            font-weight: 600;
            color: #2c3345;
            margin: 0;
          }

          .reply-date {
            font-size: 0.75rem;
            color: #6c757d;
          }

          .reply-content {
            padding: 0.5rem 0;
            font-size: 0.95rem;
            color: #4a5568;
          }

          .nested-reply-form {
            margin-top: 0.75rem;
            margin-left: 2.5rem;
            padding: 0.75rem;
            background: #fff;
            border-radius: 8px;
            border: 1px solid #e9ecef;
          }

          .nested-replies-list {
            margin-left: 2.5rem;
            margin-top: 0.75rem;
          }

          .nested-reply-card {
            background: #fff;
            border-radius: 8px;
            padding: 0.75rem;
            margin-bottom: 0.75rem;
            border: 1px solid #e9ecef;
          }

          .comment-user-info img,
          .reply-user-info img {
            transition: transform 0.3s ease;
          }

          .comment-user-info img:hover,
          .reply-user-info img:hover {
            transform: scale(1.1);
          }

          .reply-actions {
            margin-left: auto;
          }

          .reply-actions button {
            background-color: #0d6efd;
            color: white;
            border: none;
            padding: 0.75rem;
            height: 45px;
            width: 45px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
          }

          .reply-actions button i {
            font-size: 1.4rem;
          }

          .reply-actions button:hover {
            background-color: #0b5ed7;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(13, 110, 253, 0.25);
          }

          .reply-actions button:hover i {
            transform: scale(1.1);
            transition: transform 0.2s ease;
          }

          .reply-actions button:disabled {
            background-color: #ccc;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
          }

          .reply-actions button:disabled i {
            transform: none;
          }

          .registration-btn {
            padding: 1rem;
            font-size: 1rem;
            font-weight: 600;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            transition: all 0.3s ease;
            background-color: #0d6efd;
            border: none;
            box-shadow: 0 2px 4px rgba(13, 110, 253, 0.2);
          }

          .registration-btn i {
            font-size: 1.4rem;
            transition: transform 0.2s ease;
          }

          .registration-btn:hover {
            background-color: #0b5ed7;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(13, 110, 253, 0.3);
          }

          .registration-btn:hover i {
            transform: scale(1.1);
          }

          .registration-btn:active {
            transform: translateY(0);
            box-shadow: 0 2px 4px rgba(13, 110, 253, 0.2);
          }

          .enrolled-status {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            background-color: #d4edda;
            border-radius: 12px;
            color: #155724;
            font-weight: 600;
            gap: 0.5rem;
          }

          .enrolled-status i {
            font-size: 1.4rem;
          }
        `}</style>
      </section>
    </>
  );
};

export default FormationDetails; 