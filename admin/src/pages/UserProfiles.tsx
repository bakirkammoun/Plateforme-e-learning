import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';

interface UserData {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phone?: string;
  address?: string;
  bio?: string;
  profileImage?: string;
  isApproved: boolean;
  createdAt: string;
  lastLogin?: string;
}

const UserProfiles = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/auth/signin');
        return;
      }

      // Toujours récupérer les données depuis l'API
      const response = await fetch('http://localhost:5000/api/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des données');
      }

      const data = await response.json();
      setUserData(data);
      // Mettre à jour le localStorage avec les nouvelles données
      localStorage.setItem('user', JSON.stringify(data));
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/auth/signin');
        return;
      }

      // Si une nouvelle image est sélectionnée, l'uploader d'abord
      if (selectedImage) {
        const formData = new FormData();
        formData.append('profileImage', selectedImage);

        const imageResponse = await fetch(`http://localhost:5000/api/users/me/profile-image`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (!imageResponse.ok) {
          const errorData = await imageResponse.json();
          throw new Error(errorData.message || 'Erreur lors de l\'upload de l\'image');
        }

        const imageData = await imageResponse.json();
        if (userData) {
          setUserData({
            ...userData,
            profileImage: imageData.profileImage
          });
        }
      }

      // Créer un objet avec les données à mettre à jour
      const updateData = {
        firstName: userData?.firstName || '',
        lastName: userData?.lastName || '',
        phone: userData?.phone || '',
        bio: userData?.bio || ''
      };

      console.log('Données envoyées:', updateData);

      // Envoyer les données
      const response = await fetch(`http://localhost:5000/api/users/me`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la mise à jour');
      }

      const updatedUser = await response.json();
      console.log('Réponse du serveur:', updatedUser);
      
      setUserData(updatedUser);
      setIsEditing(false);
      setSelectedImage(null);
      setPreviewUrl(null);
      setMessage({ type: 'success', text: 'Profil mis à jour avec succès' });
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (err) {
      console.error('Erreur détaillée:', err);
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Erreur lors de la mise à jour' });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedImage(null);
    setPreviewUrl(null);
    fetchAdminData(); // Réinitialiser les données
    setMessage(null);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-boxdark-2">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-boxdark-2">
        <div className="text-center">
          <h2 className="mb-4 text-2xl font-bold text-danger-500">Erreur</h2>
          <p className="text-gray-600 dark:text-gray-400">{error || 'Utilisateur non trouvé'}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Breadcrumb pageName="Profil Utilisateur" />

      <div className="overflow-hidden rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        {message && (
          <div className={`mb-4 p-4 rounded ${
            message.type === 'success' 
              ? 'bg-success-500 bg-opacity-10 text-success-500' 
              : 'bg-danger-500 bg-opacity-10 text-danger-500'
          }`}>
            {message.text}
          </div>
        )}

        <div className="relative z-20 h-35 md:h-65">
          <div className="h-full w-full rounded-tl-sm rounded-tr-sm bg-gradient-to-r from-primary to-primary-500"></div>
          <div className="absolute left-6 z-10 mt-[30px] sm:left-8 flex items-center gap-4">
            <div className="relative h-[100px] w-[100px] rounded-full border-4 border-white bg-white dark:border-boxdark">
              <img 
                src={previewUrl || (userData.profileImage ? `http://localhost:5000/uploads/profile-images/${userData.profileImage}` : `https://ui-avatars.com/api/?name=${userData.firstName}+${userData.lastName}&background=random`)} 
                alt="profile" 
                className="h-full w-full rounded-full object-cover" 
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://ui-avatars.com/api/?name=${userData.firstName}+${userData.lastName}&background=random`;
                }}
              />
              {isEditing && (
              <label
                  htmlFor="profileImage"
                className="absolute bottom-0 right-0 flex h-8.5 w-8.5 cursor-pointer items-center justify-center rounded-full bg-primary text-white hover:bg-opacity-90"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M12 8V12M8 10H12M10.6667 3.33333L11.7333 4.4M12.7333 1L15 3.26667L13.9333 4.33333L11.6667 2.06667L12.7333 1ZM11.3333 4.8L4.8 11.3333H2V8.53333L8.53333 2L11.3333 4.8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </label>
              )}
              <input
                type="file"
                id="profileImage"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>
            <div className="text-white">
              <h2 className="text-2xl font-bold">{userData.firstName} {userData.lastName}</h2>
              <p className="text-sm opacity-80">{userData.email}</p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 pt-20 sm:px-8">
          <div className="flex justify-end mb-6">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2 text-center font-medium text-white hover:bg-opacity-90"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M14.5 2.5L17.5 5.5M3.5 16.5L2.5 17.5M5.5 14.5L4.5 15.5M14.5 2.5L2.5 14.5M14.5 2.5L17.5 5.5M3.5 16.5L2.5 17.5M5.5 14.5L4.5 15.5M14.5 2.5L2.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Modifier le profil
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-success-500 px-6 py-2 text-center font-medium text-white hover:bg-opacity-90"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M16.5 5.5L7.5 14.5L3.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Enregistrer
                </button>
                <button
                  onClick={handleCancel}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-danger-500 px-6 py-2 text-center font-medium text-white hover:bg-opacity-90"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Annuler
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Informations personnelles */}
            <div className="flex flex-col gap-6">
              <h3 className="text-2xl font-semibold text-black dark:text-white">
                Informations Personnelles
              </h3>

              <div className="flex flex-col gap-5.5">
                <div>
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Prénom & Nom
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="text"
                      value={userData.firstName}
                      onChange={(e) => setUserData({...userData, firstName: e.target.value})}
                      disabled={!isEditing}
                      className="w-full rounded border border-stroke bg-gray py-3 px-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary disabled:opacity-50"
                    />
                    <input
                      type="text"
                      value={userData.lastName}
                      onChange={(e) => setUserData({...userData, lastName: e.target.value})}
                      disabled={!isEditing}
                      className="w-full rounded border border-stroke bg-gray py-3 px-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary disabled:opacity-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Email
                  </label>
                  <input
                    type="email"
                    value={userData.email}
                    onChange={(e) => setUserData({...userData, email: e.target.value})}
                    disabled={!isEditing}
                    className="w-full rounded border border-stroke bg-gray py-3 px-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Téléphone
                  </label>
                  <input
                    type="text"
                    value={userData.phone || ''}
                    onChange={(e) => setUserData({...userData, phone: e.target.value})}
                    disabled={!isEditing}
                    className="w-full rounded border border-stroke bg-gray py-3 px-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            {/* Informations professionnelles */}
            <div className="flex flex-col gap-6">
              <h3 className="text-2xl font-semibold text-black dark:text-white">
                Informations Professionnelles
              </h3>

              <div className="flex flex-col gap-5.5">
                <div>
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Rôle
                  </label>
                  <div className="relative">
                    <select
                      value={userData.role}
                      disabled={true}
                      className="w-full appearance-none rounded border border-stroke bg-gray py-3 px-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary disabled:opacity-50"
                    >
                      <option value="admin">Administrateur</option>
                      <option value="instructor">Instructeur</option>
                      <option value="student">Étudiant</option>
                    </select>
                    <span className="absolute right-4 top-1/2 -translate-y-1/2">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  </div>
                </div>

                <div>
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Bio
                  </label>
                  <textarea
                    value={userData.bio || ''}
                    onChange={(e) => setUserData({...userData, bio: e.target.value})}
                    disabled={!isEditing}
                    rows={6}
                    className="w-full rounded border border-stroke bg-gray py-3 px-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary disabled:opacity-50"
                  />
                </div>

                {userData.lastLogin && (
                <div>
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                      Dernière connexion
                  </label>
                    <p className="text-black dark:text-white">
                      {new Date(userData.lastLogin).toLocaleString('fr-FR')}
                    </p>
                </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserProfiles;
