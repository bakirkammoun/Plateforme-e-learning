'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Breadcrumb from "@/components/Breadcrumb";
import HeaderInstructor from "@/components/HeaderInstructor";
import FooterOne from "@/components/FooterOne";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CourseDetails = ({ params }) => {
  const router = useRouter();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [newVideo, setNewVideo] = useState({ title: '', file: null, description: '' });
  const [editingVideo, setEditingVideo] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [newDocument, setNewDocument] = useState({ title: '', file: null, description: '' });
  const [editingDocument, setEditingDocument] = useState(null);
  const [newQuiz, setNewQuiz] = useState({
    title: '',
    description: '',
    questions: [{ question: '', options: ['', '', '', ''], correctAnswer: 0 }]
  });
  const [editingQuiz, setEditingQuiz] = useState(null);

  useEffect(() => {
    fetchCourseDetails();
  }, [params.id]);

  const fetchCourseDetails = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/formations/${params.id}`);
      setCourse(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching course details:', error);
      toast.error('Error loading course details');
      setLoading(false);
    }
  };

  const handleVideoSubmit = async (e) => {
    e.preventDefault();
    try {
      setUploadProgress(10);
      const formData = new FormData();
      formData.append('video', newVideo.file);

      // Upload video file
      const uploadResponse = await axios.post('http://localhost:5000/api/upload/video', formData, {
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        },
      });

      setUploadProgress(90);

      const updatedVideos = [...(course.videos || [])];
      if (editingVideo !== null) {
        updatedVideos[editingVideo] = {
          title: newVideo.title,
          url: uploadResponse.data.url,
          description: newVideo.description
        };
      } else {
        updatedVideos.push({
          title: newVideo.title,
          url: uploadResponse.data.url,
          description: newVideo.description
        });
      }

      await axios.put(`http://localhost:5000/api/formations/${params.id}`, {
        ...course,
        videos: updatedVideos
      });

      setCourse({ ...course, videos: updatedVideos });
      setNewVideo({ title: '', file: null, description: '' });
      setEditingVideo(null);
      setUploadProgress(100);
      toast.success('Video updated successfully');

      // Reset progress after a short delay
      setTimeout(() => setUploadProgress(0), 1000);
    } catch (error) {
      console.error('Error updating video:', error);
      toast.error('Error updating video');
      setUploadProgress(0);
    }
  };

  const handleDeleteVideo = async (index) => {
    if (window.confirm('Are you sure you want to delete this video?')) {
      try {
        const updatedVideos = course.videos.filter((_, i) => i !== index);
        await axios.put(`http://localhost:5000/api/formations/${params.id}`, {
          ...course,
          videos: updatedVideos
        });
        setCourse({ ...course, videos: updatedVideos });
        toast.success('Video deleted successfully');
      } catch (error) {
        console.error('Error deleting video:', error);
        toast.error('Error deleting video');
      }
    }
  };

  const handleDocumentSubmit = async (e) => {
    e.preventDefault();
    try {
      setUploadProgress(10);
      const formData = new FormData();
      formData.append('document', newDocument.file);

      const uploadResponse = await axios.post('http://localhost:5000/api/upload/document', formData, {
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        },
      });

      setUploadProgress(90);

      const updatedDocuments = [...(course.documents || [])];
      if (editingDocument !== null) {
        updatedDocuments[editingDocument] = {
          title: newDocument.title,
          url: uploadResponse.data.url,
          description: newDocument.description
        };
      } else {
        updatedDocuments.push({
          title: newDocument.title,
          url: uploadResponse.data.url,
          description: newDocument.description
        });
      }

      await axios.put(`http://localhost:5000/api/formations/${params.id}`, {
        ...course,
        documents: updatedDocuments
      });

      setCourse({ ...course, documents: updatedDocuments });
      setNewDocument({ title: '', file: null, description: '' });
      setEditingDocument(null);
      setUploadProgress(100);
      toast.success('Document ajouté avec succès');

      setTimeout(() => setUploadProgress(0), 1000);
    } catch (error) {
      console.error('Error updating document:', error);
      toast.error('Erreur lors de l\'ajout du document');
      setUploadProgress(0);
    }
  };

  const handleDeleteDocument = async (index) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      try {
        const updatedDocuments = course.documents.filter((_, i) => i !== index);
        await axios.put(`http://localhost:5000/api/formations/${params.id}`, {
          ...course,
          documents: updatedDocuments
        });
        setCourse({ ...course, documents: updatedDocuments });
        toast.success('Document supprimé avec succès');
      } catch (error) {
        console.error('Error deleting document:', error);
        toast.error('Erreur lors de la suppression du document');
      }
    }
  };

  const handleQuizSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedQuizzes = [...(course.quizzes || [])];
      if (editingQuiz !== null) {
        updatedQuizzes[editingQuiz] = newQuiz;
      } else {
        updatedQuizzes.push(newQuiz);
      }

      await axios.put(`http://localhost:5000/api/formations/${params.id}`, {
        ...course,
        quizzes: updatedQuizzes
      });

      setCourse({ ...course, quizzes: updatedQuizzes });
      setNewQuiz({
        title: '',
        description: '',
        questions: [{ question: '', options: ['', '', '', ''], correctAnswer: 0 }]
      });
      setEditingQuiz(null);
      toast.success('Quiz ajouté avec succès');
    } catch (error) {
      console.error('Error updating quiz:', error);
      toast.error('Erreur lors de l\'ajout du quiz');
    }
  };

  const handleDeleteQuiz = async (index) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce quiz ?')) {
      try {
        const updatedQuizzes = course.quizzes.filter((_, i) => i !== index);
        await axios.put(`http://localhost:5000/api/formations/${params.id}`, {
          ...course,
          quizzes: updatedQuizzes
        });
        setCourse({ ...course, quizzes: updatedQuizzes });
        toast.success('Quiz supprimé avec succès');
      } catch (error) {
        console.error('Error deleting quiz:', error);
        toast.error('Erreur lors de la suppression du quiz');
      }
    }
  };

  const addQuestion = () => {
    setNewQuiz({
      ...newQuiz,
      questions: [
        ...newQuiz.questions,
        { question: '', options: ['', '', '', ''], correctAnswer: 0 }
      ]
    });
  };

  const removeQuestion = (index) => {
    const updatedQuestions = newQuiz.questions.filter((_, i) => i !== index);
    setNewQuiz({
      ...newQuiz,
      questions: updatedQuestions
    });
  };

  const updateQuestion = (index, field, value) => {
    const updatedQuestions = [...newQuiz.questions];
    if (field === 'question') {
      updatedQuestions[index].question = value;
    } else if (field.startsWith('option')) {
      const optionIndex = parseInt(field.replace('option', ''));
      updatedQuestions[index].options[optionIndex] = value;
    } else if (field === 'correctAnswer') {
      updatedQuestions[index].correctAnswer = parseInt(value);
    }
    setNewQuiz({
      ...newQuiz,
      questions: updatedQuestions
    });
  };

  if (loading) {
    return (
      <>
        <HeaderInstructor />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-main-600"></div>
        </div>
        <FooterOne />
      </>
    );
  }

  return (
    <>
      <HeaderInstructor />
      <Breadcrumb title="Détails du cours" />
      <ToastContainer />

      <section className="course-details-section py-80">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              <div className="bg-white rounded-16 p-32 box-shadow-md">
                {/* Course Header */}
                <div className="course-header mb-40">
                  <div className="d-flex justify-content-between align-items-start mb-24">
                    <div>
                      <h2 className="mb-16">{course.title}</h2>
                      <div className="d-flex flex-wrap gap-3">
                        <span className="badge bg-main-25 text-main-600 px-3 py-2 rounded-pill">
                          <i className="ph ph-graduation-cap me-2"></i>
                          {course.category}
                        </span>
                        <span className="badge bg-main-25 text-main-600 px-3 py-2 rounded-pill">
                          <i className="ph ph-chart-bar me-2"></i>
                          {course.level}
                        </span>
                        <span className="badge bg-main-25 text-main-600 px-3 py-2 rounded-pill">
                          <i className="ph ph-clock me-2"></i>
                          {course.duration}h
                        </span>
                        <span className="badge bg-main-25 text-main-600 px-3 py-2 rounded-pill">
                          <i className="ph ph-users me-2"></i>
                          {course.enrolledStudents?.length || 0} Students
                        </span>
                      </div>
                    </div>
                    <div className="text-end">
                      <h3 className="text-main-600 mb-2">${course.price}</h3>
                      <span className={`badge ${course.status === 'published' ? 'bg-success' : course.status === 'pending' ? 'bg-warning' : 'bg-secondary'}`}>
                        {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="course-image mb-32">
                    <img 
                      src={course.image} 
                      alt={course.title}
                      className="w-100 rounded-12 object-fit-cover"
                      style={{ maxHeight: '400px' }}
                    />
                  </div>

                  <div className="course-description">
                    <h4 className="mb-16">
                      <i className="ph ph-info me-2 text-main-600"></i>
                      Course Description
                    </h4>
                    <p className="text-neutral-600">{course.description}</p>
                  </div>
                </div>

                {/* Navigation Tabs */}
                <div className="course-tabs mb-32">
                  <ul className="nav nav-tabs border-bottom border-2">
                    <li className="nav-item">
                      <button 
                        className={`nav-link ${activeTab === 'overview' ? 'active' : ''} px-24 py-12`}
                        onClick={() => setActiveTab('overview')}
                      >
                        <i className="ph ph-info me-2"></i>
                        Aperçu
                      </button>
                    </li>
                    <li className="nav-item">
                      <button 
                        className={`nav-link ${activeTab === 'videos' ? 'active' : ''} px-24 py-12`}
                        onClick={() => setActiveTab('videos')}
                      >
                        <i className="ph ph-video me-2"></i>
                        Vidéos
                      </button>
                    </li>
                    <li className="nav-item">
                      <button 
                        className={`nav-link ${activeTab === 'documents' ? 'active' : ''} px-24 py-12`}
                        onClick={() => setActiveTab('documents')}
                      >
                        <i className="ph ph-file-pdf me-2"></i>
                        Documents
                      </button>
                    </li>
                    <li className="nav-item">
                      <button 
                        className={`nav-link ${activeTab === 'quizzes' ? 'active' : ''} px-24 py-12`}
                        onClick={() => setActiveTab('quizzes')}
                      >
                        <i className="ph ph-exam me-2"></i>
                        Quiz
                      </button>
                    </li>
                  </ul>
                </div>

                {/* Tab Content */}
                {activeTab === 'overview' && (
                  <div className="overview-tab">
                    <div className="course-stats">
                      <h4 className="mb-24">
                        <i className="ph ph-chart-line-up me-2 text-main-600"></i>
                        Course Statistics
                      </h4>
                      <div className="row g-4">
                        <div className="col-md-3">
                          <div className="stat-card bg-main-25 p-24 rounded-12 text-center">
                            <i className="ph ph-users text-main-600 display-6 mb-2"></i>
                            <h3 className="mb-2">{course.enrolledStudents?.length || 0}</h3>
                            <p className="text-neutral-500 mb-0">Enrolled Students</p>
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="stat-card bg-main-25 p-24 rounded-12 text-center">
                            <i className="ph ph-star text-main-600 display-6 mb-2"></i>
                            <h3 className="mb-2">{course.rating || 0}</h3>
                            <p className="text-neutral-500 mb-0">Average Rating</p>
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="stat-card bg-main-25 p-24 rounded-12 text-center">
                            <i className="ph ph-video-camera text-main-600 display-6 mb-2"></i>
                            <h3 className="mb-2">{course.videos?.length || 0}</h3>
                            <p className="text-neutral-500 mb-0">Total Videos</p>
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="stat-card bg-main-25 p-24 rounded-12 text-center">
                            <i className="ph ph-clock text-main-600 display-6 mb-2"></i>
                            <h3 className="mb-2">{course.duration}h</h3>
                            <p className="text-neutral-500 mb-0">Total Duration</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'videos' && (
                  <div className="videos-tab">
                    {/* Add/Edit Video Form */}
                    <div className="video-form bg-main-25 p-24 rounded-12 mb-32">
                      <h4 className="mb-24">
                        <i className="ph ph-plus-circle me-2 text-main-600"></i>
                        {editingVideo !== null ? 'Edit Video' : 'Add New Video'}
                      </h4>
                      <form onSubmit={handleVideoSubmit}>
                        <div className="row g-4">
                          <div className="col-md-6">
                            <div className="form-group">
                              <label className="form-label">
                                <i className="ph ph-text-t me-2"></i>
                                Video Title
                              </label>
                              <input
                                type="text"
                                className="form-control rounded-pill"
                                value={newVideo.title}
                                onChange={(e) => setNewVideo({...newVideo, title: e.target.value})}
                                placeholder="Enter video title"
                                required
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-group">
                              <label className="form-label">
                                <i className="ph ph-article me-2"></i>
                                Description
                              </label>
                              <textarea
                                className="form-control rounded-12"
                                value={newVideo.description}
                                onChange={(e) => setNewVideo({...newVideo, description: e.target.value})}
                                placeholder="Enter video description"
                                rows="3"
                                required
                              />
                            </div>
                          </div>
                          <div className="col-12">
                            <div className="form-group">
                              <label className="form-label">
                                <i className="ph ph-upload-simple me-2"></i>
                                Video File
                              </label>
                              <div className="upload-zone p-24 bg-white rounded-12 border-2 border-dashed border-neutral-300 text-center cursor-pointer hover-bg-neutral-50 transition-all">
                                <input
                                  type="file"
                                  accept="video/*"
                                  onChange={(e) => setNewVideo({...newVideo, file: e.target.files[0]})}
                                  className="d-none"
                                  id="videoFile"
                                  required={!editingVideo}
                                />
                                <label htmlFor="videoFile" className="mb-0 cursor-pointer">
                                  <i className="ph ph-upload-simple display-6 text-main-600 mb-2"></i>
                                  <p className="mb-0">Click or drag video file to upload</p>
                                  <small className="text-neutral-500">Maximum file size: 500MB</small>
                                </label>
                              </div>
                              {uploadProgress > 0 && (
                                <div className="mt-3">
                                  <div className="progress" style={{ height: '6px' }}>
                                    <div
                                      className="progress-bar bg-main-600"
                                      role="progressbar"
                                      style={{ width: `${uploadProgress}%` }}
                                      aria-valuenow={uploadProgress}
                                      aria-valuemin="0"
                                      aria-valuemax="100"
                                    ></div>
                                  </div>
                                  <small className="text-neutral-500">{uploadProgress}% uploaded</small>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="mt-24 text-end">
                          {editingVideo !== null && (
                            <button
                              type="button"
                              className="btn btn-outline-secondary rounded-pill me-2"
                              onClick={() => {
                                setEditingVideo(null);
                                setNewVideo({ title: '', file: null, description: '' });
                              }}
                            >
                              <i className="ph ph-x me-2"></i>
                              Cancel
                            </button>
                          )}
                          <button 
                            type="submit" 
                            className="btn btn-main rounded-pill"
                            disabled={uploadProgress > 0 && uploadProgress < 100}
                          >
                            <i className="ph ph-check me-2"></i>
                            {editingVideo !== null ? 'Update Video' : 'Add Video'}
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* Videos List */}
                    <div className="videos-list">
                      <h4 className="mb-24">
                        <i className="ph ph-video-camera me-2 text-main-600"></i>
                        Course Videos
                      </h4>
                      {course.videos && course.videos.length > 0 ? (
                        <div className="row g-4">
                          {course.videos.map((video, index) => (
                            <div key={index} className="col-md-6">
                              <div className="video-card bg-white p-24 rounded-12 border border-neutral-200 hover-border-main-600 transition-all">
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                  <h5 className="mb-0">{video.title}</h5>
                                  <div className="dropdown">
                                    <button className="btn btn-link p-0" data-bs-toggle="dropdown">
                                      <i className="ph ph-dots-three-vertical"></i>
                                    </button>
                                    <ul className="dropdown-menu">
                                      <li>
                                        <button 
                                          className="dropdown-item"
                                          onClick={() => {
                                            setEditingVideo(index);
                                            setNewVideo({
                                              title: video.title,
                                              description: video.description,
                                              file: null
                                            });
                                          }}
                                        >
                                          <i className="ph ph-pencil me-2"></i>
                                          Edit
                                        </button>
                                      </li>
                                      <li>
                                        <button 
                                          className="dropdown-item text-danger"
                                          onClick={() => handleDeleteVideo(index)}
                                        >
                                          <i className="ph ph-trash me-2"></i>
                                          Delete
                                        </button>
                                      </li>
                                    </ul>
                                  </div>
                                </div>
                                <div className="video-preview mb-3">
                                  <video
                                    className="w-100 rounded-8"
                                    controls
                                    src={video.url}
                                  />
                                </div>
                                <div className="video-info">
                                  <p className="text-neutral-500 mb-2">
                                    <i className="ph ph-article me-2"></i>
                                    {video.description}
                                  </p>
                                  <div className="d-flex justify-content-end">
                                    <button 
                                      onClick={() => handleDeleteVideo(index)}
                                      className="btn btn-sm btn-danger rounded-pill"
                                    >
                                      <i className="ph ph-trash me-2"></i>
                                      Delete Video
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-48 bg-main-25 rounded-12">
                          <i className="ph ph-video-camera text-main-600 display-4"></i>
                          <p className="mt-16 text-neutral-500">No videos added yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'documents' && (
                  <div className="documents-tab">
                    {/* Formulaire d'ajout/modification de document */}
                    <div className="document-form bg-main-25 p-24 rounded-12 mb-32">
                      <h4 className="mb-24">
                        <i className="ph ph-plus-circle me-2 text-main-600"></i>
                        {editingDocument !== null ? 'Modifier le document' : 'Ajouter un nouveau document'}
                      </h4>
                      <form onSubmit={handleDocumentSubmit}>
                        <div className="row g-4">
                          <div className="col-md-6">
                            <div className="form-group">
                              <label className="form-label">
                                <i className="ph ph-text-t me-2"></i>
                                Titre du document
                              </label>
                              <input
                                type="text"
                                className="form-control rounded-pill"
                                value={newDocument.title}
                                onChange={(e) => setNewDocument({...newDocument, title: e.target.value})}
                                placeholder="Entrez le titre du document"
                                required
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-group">
                              <label className="form-label">
                                <i className="ph ph-article me-2"></i>
                                Description
                              </label>
                              <textarea
                                className="form-control rounded-12"
                                value={newDocument.description}
                                onChange={(e) => setNewDocument({...newDocument, description: e.target.value})}
                                placeholder="Entrez la description du document"
                                rows="3"
                                required
                              />
                            </div>
                          </div>
                          <div className="col-12">
                            <div className="form-group">
                              <label className="form-label">
                                <i className="ph ph-file-pdf me-2"></i>
                                Fichier PDF
                              </label>
                              <div className="upload-zone p-24 bg-white rounded-12 border-2 border-dashed border-neutral-300 text-center cursor-pointer hover-bg-neutral-50 transition-all">
                                <input
                                  type="file"
                                  accept=".pdf"
                                  onChange={(e) => setNewDocument({...newDocument, file: e.target.files[0]})}
                                  className="d-none"
                                  id="documentFile"
                                  required={!editingDocument}
                                />
                                <label htmlFor="documentFile" className="mb-0 cursor-pointer">
                                  <i className="ph ph-file-pdf display-6 text-main-600 mb-2"></i>
                                  <p className="mb-0">Cliquez ou glissez un fichier PDF</p>
                                  <small className="text-neutral-500">Taille maximale : 10MB</small>
                                </label>
                              </div>
                              {uploadProgress > 0 && (
                                <div className="mt-3">
                                  <div className="progress" style={{ height: '6px' }}>
                                    <div
                                      className="progress-bar bg-main-600"
                                      role="progressbar"
                                      style={{ width: `${uploadProgress}%` }}
                                      aria-valuenow={uploadProgress}
                                      aria-valuemin="0"
                                      aria-valuemax="100"
                                    ></div>
                                  </div>
                                  <small className="text-neutral-500">{uploadProgress}% téléchargé</small>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="mt-24 text-end">
                          {editingDocument !== null && (
                            <button
                              type="button"
                              className="btn btn-outline-secondary rounded-pill me-2"
                              onClick={() => {
                                setEditingDocument(null);
                                setNewDocument({ title: '', file: null, description: '' });
                              }}
                            >
                              <i className="ph ph-x me-2"></i>
                              Annuler
                            </button>
                          )}
                          <button 
                            type="submit" 
                            className="btn btn-main rounded-pill"
                            disabled={uploadProgress > 0 && uploadProgress < 100}
                          >
                            <i className="ph ph-check me-2"></i>
                            {editingDocument !== null ? 'Mettre à jour' : 'Ajouter'}
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* Liste des documents */}
                    <div className="documents-list">
                      <h4 className="mb-24">
                        <i className="ph ph-files me-2 text-main-600"></i>
                        Documents du cours
                      </h4>
                      {course.documents && course.documents.length > 0 ? (
                        <div className="row g-4">
                          {course.documents.map((document, index) => (
                            <div key={index} className="col-md-6">
                              <div className="document-card bg-white p-24 rounded-12 border border-neutral-200 hover-border-main-600 transition-all">
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                  <h5 className="mb-0">{document.title}</h5>
                                  <div className="dropdown">
                                    <button className="btn btn-link p-0" data-bs-toggle="dropdown">
                                      <i className="ph ph-dots-three-vertical"></i>
                                    </button>
                                    <ul className="dropdown-menu">
                                      <li>
                                        <button 
                                          className="dropdown-item"
                                          onClick={() => {
                                            setEditingDocument(index);
                                            setNewDocument({
                                              title: document.title,
                                              description: document.description,
                                              file: null
                                            });
                                          }}
                                        >
                                          <i className="ph ph-pencil me-2"></i>
                                          Modifier
                                        </button>
                                      </li>
                                      <li>
                                        <button 
                                          className="dropdown-item text-danger"
                                          onClick={() => handleDeleteDocument(index)}
                                        >
                                          <i className="ph ph-trash me-2"></i>
                                          Supprimer
                                        </button>
                                      </li>
                                    </ul>
                                  </div>
                                </div>
                                <p className="text-neutral-500 mb-3">
                                  <i className="ph ph-article me-2"></i>
                                  {document.description}
                                </p>
                                <div className="d-flex justify-content-between align-items-center">
                                  <a 
                                    href={document.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="btn btn-sm btn-outline-primary rounded-pill"
                                  >
                                    <i className="ph ph-download me-2"></i>
                                    Télécharger
                                  </a>
                                  <button 
                                    onClick={() => handleDeleteDocument(index)}
                                    className="btn btn-sm btn-danger rounded-pill"
                                  >
                                    <i className="ph ph-trash me-2"></i>
                                    Supprimer
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-48 bg-main-25 rounded-12">
                          <i className="ph ph-file-pdf text-main-600 display-4"></i>
                          <p className="mt-16 text-neutral-500">Aucun document ajouté</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'quizzes' && (
                  <div className="quizzes-tab">
                    {/* Formulaire d'ajout/modification de quiz */}
                    <div className="quiz-form bg-main-25 p-24 rounded-12 mb-32">
                      <h4 className="mb-24">
                        <i className="ph ph-plus-circle me-2 text-main-600"></i>
                        {editingQuiz !== null ? 'Modifier le quiz' : 'Ajouter un nouveau quiz'}
                      </h4>
                      <form onSubmit={handleQuizSubmit}>
                        <div className="row g-4">
                          <div className="col-md-6">
                            <div className="form-group">
                              <label className="form-label">
                                <i className="ph ph-text-t me-2"></i>
                                Titre du quiz
                              </label>
                              <input
                                type="text"
                                className="form-control rounded-pill"
                                value={newQuiz.title}
                                onChange={(e) => setNewQuiz({...newQuiz, title: e.target.value})}
                                placeholder="Entrez le titre du quiz"
                                required
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-group">
                              <label className="form-label">
                                <i className="ph ph-article me-2"></i>
                                Description
                              </label>
                              <textarea
                                className="form-control rounded-12"
                                value={newQuiz.description}
                                onChange={(e) => setNewQuiz({...newQuiz, description: e.target.value})}
                                placeholder="Entrez la description du quiz"
                                rows="3"
                                required
                              />
                            </div>
                          </div>
                        </div>

                        {/* Questions du quiz */}
                        <div className="questions-section mt-32">
                          <div className="d-flex justify-content-between align-items-center mb-24">
                            <h5 className="mb-0">
                              <i className="ph ph-question me-2 text-main-600"></i>
                              Questions
                            </h5>
                            <button
                              type="button"
                              className="btn btn-outline-primary rounded-pill"
                              onClick={addQuestion}
                            >
                              <i className="ph ph-plus me-2"></i>
                              Ajouter une question
                            </button>
                          </div>

                          {newQuiz.questions.map((question, questionIndex) => (
                            <div key={questionIndex} className="question-card bg-white p-24 rounded-12 mb-24 border border-neutral-200">
                              <div className="d-flex justify-content-between align-items-start mb-3">
                                <h6 className="mb-0">Question {questionIndex + 1}</h6>
                                {newQuiz.questions.length > 1 && (
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger rounded-pill"
                                    onClick={() => removeQuestion(questionIndex)}
                                  >
                                    <i className="ph ph-x"></i>
                                  </button>
                                )}
                              </div>

                              <div className="form-group mb-3">
                                <input
                                  type="text"
                                  className="form-control"
                                  value={question.question}
                                  onChange={(e) => updateQuestion(questionIndex, 'question', e.target.value)}
                                  placeholder="Entrez la question"
                                  required
                                />
                              </div>

                              <div className="options-grid">
                                {question.options.map((option, optionIndex) => (
                                  <div key={optionIndex} className="form-group">
                                    <div className="input-group">
                                      <div className="input-group-text">
                                        <input
                                          type="radio"
                                          name={`correct-answer-${questionIndex}`}
                                          checked={question.correctAnswer === optionIndex}
                                          onChange={() => updateQuestion(questionIndex, 'correctAnswer', optionIndex)}
                                          required
                                        />
                                      </div>
                                      <input
                                        type="text"
                                        className="form-control"
                                        value={option}
                                        onChange={(e) => updateQuestion(questionIndex, `option${optionIndex}`, e.target.value)}
                                        placeholder={`Option ${optionIndex + 1}`}
                                        required
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-24 text-end">
                          {editingQuiz !== null && (
                            <button
                              type="button"
                              className="btn btn-outline-secondary rounded-pill me-2"
                              onClick={() => {
                                setEditingQuiz(null);
                                setNewQuiz({
                                  title: '',
                                  description: '',
                                  questions: [{ question: '', options: ['', '', '', ''], correctAnswer: 0 }]
                                });
                              }}
                            >
                              <i className="ph ph-x me-2"></i>
                              Annuler
                            </button>
                          )}
                          <button 
                            type="submit" 
                            className="btn btn-main rounded-pill"
                          >
                            <i className="ph ph-check me-2"></i>
                            {editingQuiz !== null ? 'Mettre à jour' : 'Ajouter'}
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* Liste des quiz */}
                    <div className="quizzes-list">
                      <h4 className="mb-24">
                        <i className="ph ph-exam me-2 text-main-600"></i>
                        Quiz du cours
                      </h4>
                      {course.quizzes && course.quizzes.length > 0 ? (
                        <div className="row g-4">
                          {course.quizzes.map((quiz, index) => (
                            <div key={index} className="col-md-6">
                              <div className="quiz-card bg-white p-24 rounded-12 border border-neutral-200 hover-border-main-600 transition-all">
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                  <h5 className="mb-0">{quiz.title}</h5>
                                  <div className="dropdown">
                                    <button className="btn btn-link p-0" data-bs-toggle="dropdown">
                                      <i className="ph ph-dots-three-vertical"></i>
                                    </button>
                                    <ul className="dropdown-menu">
                                      <li>
                                        <button 
                                          className="dropdown-item"
                                          onClick={() => {
                                            setEditingQuiz(index);
                                            setNewQuiz(quiz);
                                          }}
                                        >
                                          <i className="ph ph-pencil me-2"></i>
                                          Modifier
                                        </button>
                                      </li>
                                      <li>
                                        <button 
                                          className="dropdown-item text-danger"
                                          onClick={() => handleDeleteQuiz(index)}
                                        >
                                          <i className="ph ph-trash me-2"></i>
                                          Supprimer
                                        </button>
                                      </li>
                                    </ul>
                                  </div>
                                </div>
                                <p className="text-neutral-500 mb-3">
                                  <i className="ph ph-article me-2"></i>
                                  {quiz.description}
                                </p>
                                <div className="d-flex justify-content-between align-items-center">
                                  <span className="badge bg-main-25 text-main-600">
                                    {quiz.questions.length} question{quiz.questions.length !== 1 ? 's' : ''}
                                  </span>
                                  <button 
                                    onClick={() => handleDeleteQuiz(index)}
                                    className="btn btn-sm btn-danger rounded-pill"
                                  >
                                    <i className="ph ph-trash me-2"></i>
                                    Supprimer
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-48 bg-main-25 rounded-12">
                          <i className="ph ph-exam text-main-600 display-4"></i>
                          <p className="mt-16 text-neutral-500">Aucun quiz ajouté</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <FooterOne />

      <style jsx>{`
        .course-details-section {
          background-color: #f8fafc;
        }

        .nav-tabs {
          border-bottom: 2px solid #e5e7eb;
        }

        .nav-tabs .nav-link {
          border: none;
          color: #6b7280;
          padding: 12px 24px;
          font-weight: 500;
          position: relative;
        }

        .nav-tabs .nav-link.active {
          color: #2563eb;
          background: none;
          border-bottom: 2px solid #2563eb;
          margin-bottom: -2px;
        }

        .document-card, .quiz-card {
          transition: all 0.3s ease;
        }

        .document-card:hover, .quiz-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }

        .upload-zone {
          transition: all 0.3s ease;
        }

        .upload-zone:hover {
          border-color: #2563eb;
        }

        .btn-main {
          background-color: #2563eb;
          color: white;
        }

        .btn-main:hover {
          background-color: #1d4ed8;
        }

        .options-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin-top: 1rem;
        }

        @media (max-width: 768px) {
          .options-grid {
            grid-template-columns: 1fr;
          }
        }

        .question-card {
          position: relative;
        }

        .question-card .btn-outline-danger {
          position: absolute;
          top: 1rem;
          right: 1rem;
        }
      `}</style>
    </>
  );
};

export default CourseDetails; 