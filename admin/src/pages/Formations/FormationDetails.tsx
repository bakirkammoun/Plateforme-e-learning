import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Breadcrumb from '../../components/Breadcrumb';

interface Formation {
  _id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  duration: number;
  price: number;
  image: string;
  instructorId: {
    firstName: string;
    lastName: string;
    email: string;
  };
  status: string;
  rating: number;
  numberOfRatings: number;
  videos: Array<{
    title: string;
    url: string;
    duration: number;
  }>;
}

const FormationDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [formation, setFormation] = useState<Formation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    fetchFormationDetails();
  }, [id]);

  const fetchFormationDetails = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/formations/${id}`);
      if (!response.ok) throw new Error('Erreur lors de la récupération des détails');
      const data = await response.json();
      setFormation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedVideo(e.target.files[0]);
    }
  };

  const handleVideoUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVideo || !videoTitle) return;

    const formData = new FormData();
    formData.append('video', selectedVideo);

    try {
      setUploadProgress(10);
      const uploadResponse = await fetch('http://localhost:5000/api/upload/video', {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(50);
      if (!uploadResponse.ok) throw new Error('Erreur lors de l\'upload de la vidéo');
      const uploadData = await uploadResponse.json();

      setUploadProgress(75);
      const response = await fetch(`http://localhost:5000/api/formations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videos: [
            ...(formation?.videos || []),
            {
              title: videoTitle,
              url: uploadData.url,
              duration: 0
            }
          ]
        }),
      });

      if (!response.ok) throw new Error('Erreur lors de l\'ajout de la vidéo');

      setUploadProgress(100);
      fetchFormationDetails();
      setVideoTitle('');
      setSelectedVideo(null);
      setTimeout(() => setUploadProgress(0), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setUploadProgress(0);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/formations/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Erreur lors de la mise à jour du statut');
      fetchFormationDetails();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-boxdark-2">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error || !formation) {
    return (
      <div className="rounded-sm border border-stroke bg-white px-5 py-10 shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="flex h-40 items-center justify-center">
          <p className="text-danger">{error || 'Formation non trouvée'}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <Breadcrumb pageName="Détails de la formation" />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-black dark:text-white">
            {formation.title}
          </h1>
          <div className="flex items-center gap-3">
            <select
              value={formation.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="rounded-lg border-[1.5px] border-stroke bg-transparent py-2 px-4 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
            >
              <option value="draft">Brouillon</option>
              <option value="pending">En attente</option>
              <option value="published">Publié</option>
              <option value="rejected">Rejeté</option>
            </select>
            <button
              onClick={() => navigate(`/formations/edit/${id}`)}
              className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-primary px-6 py-2 text-center font-medium text-primary hover:bg-primary hover:text-white dark:border-primary dark:text-primary dark:hover:bg-primary dark:hover:text-white"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18.5 2.50023C18.8978 2.1024 19.4374 1.87891 20 1.87891C20.5626 1.87891 21.1022 2.1024 21.5 2.50023C21.8978 2.89805 22.1213 3.43762 22.1213 4.00023C22.1213 4.56284 21.8978 5.1024 21.5 5.50023L12 15.0002L8 16.0002L9 12.0002L18.5 2.50023Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Modifier
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex border-b border-stroke dark:border-strokedark">
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'details'
                ? 'border-b-2 border-primary text-primary'
                : 'text-body-color hover:text-primary dark:text-body-color-dark dark:hover:text-primary'
            }`}
            onClick={() => setActiveTab('details')}
          >
            Détails
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'videos'
                ? 'border-b-2 border-primary text-primary'
                : 'text-body-color hover:text-primary dark:text-body-color-dark dark:hover:text-primary'
            }`}
            onClick={() => setActiveTab('videos')}
          >
            Vidéos
          </button>
        </div>
      </div>

      {activeTab === 'details' ? (
        <div className="rounded-sm border border-stroke bg-white p-6.5 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="mb-4.5">
            <img
              src={formation.image}
              alt={formation.title}
              className="w-full rounded-lg object-cover max-h-96"
            />
          </div>

          <div className="mb-6">
            <h4 className="mb-4 text-xl font-semibold text-black dark:text-white">
              Description
            </h4>
            <p className="text-base text-body-color dark:text-body-color-dark">
              {formation.description}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border border-stroke bg-white p-4 dark:border-strokedark dark:bg-boxdark">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-primary bg-opacity-10 p-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-primary">
                    <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </span>
                <div>
                  <h5 className="text-sm font-medium text-body-color dark:text-body-color-dark">Durée</h5>
                  <p className="text-base font-semibold text-black dark:text-white">{formation.duration}h</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-stroke bg-white p-4 dark:border-strokedark dark:bg-boxdark">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-success-500 bg-opacity-10 p-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-success-500">
                    <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <div>
                  <h5 className="text-sm font-medium text-body-color dark:text-body-color-dark">Niveau</h5>
                  <p className="text-base font-semibold text-black dark:text-white">{formation.level}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-stroke bg-white p-4 dark:border-strokedark dark:bg-boxdark">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-warning bg-opacity-10 p-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-warning">
                    <path d="M20 12V22H4V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 7H2V12H22V7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 22V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 7H16.5C17.163 7 17.7989 6.73661 18.2678 6.26777C18.7366 5.79893 19 5.16304 19 4.5C19 3.83696 18.7366 3.20107 18.2678 2.73223C17.7989 2.26339 17.163 2 16.5 2C13 2 12 7 12 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <div>
                  <h5 className="text-sm font-medium text-body-color dark:text-body-color-dark">Prix</h5>
                  <p className="text-base font-semibold text-black dark:text-white">{formation.price}DT</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-stroke bg-white p-4 dark:border-strokedark dark:bg-boxdark">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-primary bg-opacity-10 p-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-primary">
                    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <div>
                  <h5 className="text-sm font-medium text-body-color dark:text-body-color-dark">Instructeur</h5>
                  <p className="text-base font-semibold text-black dark:text-white">
                    {formation.instructorId.firstName} {formation.instructorId.lastName}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="border-b border-stroke p-4 dark:border-strokedark">
            <h3 className="font-semibold text-black dark:text-white">
              Ajouter une vidéo
            </h3>
          </div>
          <div className="p-6.5">
            <form onSubmit={handleVideoUpload} className="space-y-4">
              <div>
                <label className="mb-2.5 block text-black dark:text-white">
                  Titre de la vidéo
                </label>
                <input
                  type="text"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="Titre de la vidéo"
                  className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="mb-2.5 block text-black dark:text-white">
                  Fichier vidéo
                </label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoChange}
                  className="w-full cursor-pointer rounded-lg border-[1.5px] border-stroke bg-transparent font-medium outline-none transition file:mr-5 file:border-collapse file:cursor-pointer file:border-0 file:border-r file:border-solid file:border-stroke file:bg-whiter file:py-3 file:px-5 file:hover:bg-primary file:hover:bg-opacity-10 focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:file:border-form-strokedark dark:file:bg-white/30 dark:file:text-white dark:focus:border-primary"
                  required
                />
              </div>

              {uploadProgress > 0 && (
                <div className="relative pt-1">
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block text-primary">
                        {uploadProgress}%
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 text-xs flex rounded bg-primary bg-opacity-10">
                    <div
                      style={{ width: `${uploadProgress}%` }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary transition-all duration-500"
                    ></div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="flex w-full justify-center rounded bg-primary p-3 font-medium text-gray hover:bg-opacity-90"
                disabled={!selectedVideo || !videoTitle}
              >
                Ajouter la vidéo
              </button>
            </form>

            <div className="mt-8 space-y-4">
              {formation.videos.map((video, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-stroke bg-white p-4 dark:border-strokedark dark:bg-boxdark"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-black dark:text-white">
                      {video.title}
                    </h4>
                    <span className="text-sm text-body-color dark:text-body-color-dark">
                      {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}
                    </span>
                  </div>
                  <video
                    className="w-full rounded-lg"
                    controls
                    src={video.url}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FormationDetails; 