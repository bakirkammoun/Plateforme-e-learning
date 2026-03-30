import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Breadcrumb from '../../components/Breadcrumb';
import PageMeta from '../../components/common/PageMeta';

type SectorKey = 'languages' | 'computerScience' | 'competitions';

interface Sector {
  name: string;
  options: string[];
}

type Sectors = Record<SectorKey, Sector>;

interface NewUser {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  isApproved: boolean;
  specialization: string;
  interests: string[];
  sector: string;
}

const AddUser = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [newUser, setNewUser] = useState<NewUser>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'student',
    isApproved: true,
    specialization: '',
    interests: [],
    sector: ''
  });

  const sectors: Sectors = {
    languages: {
      name: "Languages",
      options: ["Français", "Anglais", "Espagnol", "Allemand", "Italien"]
    },
    computerScience: {
      name: "Computer Science",
      options: [
        "IT Development",
        "Artificial Intelligence and Big Data",
        "Graphics and Digital Marketing",
        "Office automation"
      ]
    },
    competitions: {
      name: "Competitions and School Training",
      options: [
        "Preparation for Competitions",
        "Training for All Levels"
      ]
    }
  };

  const handleAddUser = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'ajout de l\'utilisateur');
      }

      setMessage('Utilisateur ajouté avec succès');
      setMessageType('success');
      
      // Réinitialiser le formulaire
      setNewUser({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'student',
        isApproved: true,
        specialization: '',
        interests: [],
        sector: ''
      });

      // Rediriger vers la liste des utilisateurs après 2 secondes
      setTimeout(() => {
        navigate('/admin/users');
      }, 2000);
    } catch (error) {
      console.error('Erreur:', error);
      setMessage('Erreur lors de l\'ajout de l\'utilisateur');
      setMessageType('error');
    }
  };

  const handleSectorChange = (sectorKey: string) => {
    if (newUser.role === 'instructor') {
      setNewUser({ ...newUser, sector: newUser.sector === sectorKey ? '' : sectorKey, specialization: '' });
    } else {
      setNewUser({ ...newUser, sector: sectorKey });
    }
  };

  const handleSpecializationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setNewUser({ ...newUser, specialization: e.target.value });
  };

  return (
    <>
      <PageMeta
        title="Ajouter un utilisateur | Admin Dashboard"
        description="Page d'ajout d'un nouvel utilisateur"
      />
      <Breadcrumb pageName="Ajouter un utilisateur" />

      <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        {message && (
          <div className={`mb-4 p-4 rounded ${
            messageType === 'success' 
              ? 'bg-success-500 bg-opacity-10 text-success-500' 
              : 'bg-danger-500 bg-opacity-10 text-danger-500'
          }`}>
            {message}
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Prénom
              </label>
              <input
                type="text"
                value={newUser.firstName}
                onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                className="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nom
              </label>
              <input
                type="text"
                value={newUser.lastName}
                onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                className="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mot de passe
              </label>
              <input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Rôle
            </label>
            <select
              value={newUser.role}
              onChange={(e) => {
                setNewUser({ 
                  ...newUser, 
                  role: e.target.value,
                  specialization: '',
                  interests: [],
                  sector: ''
                });
              }}
              className="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark"
            >
              <option value="student">Étudiant</option>
              <option value="instructor">Instructeur</option>
            </select>
          </div>

          {newUser.role && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {newUser.role === 'instructor' ? 'Sélectionner un secteur' : 'Sélectionner vos secteurs'}
              </label>
              <div className="options-container mb-4">
                <div className="flex flex-wrap gap-3">
                  {Object.entries(sectors).map(([key, sector]) => (
                    <div
                      key={key}
                      className={`option-button ${newUser.sector === key ? 'active' : ''}`}
                      onClick={() => handleSectorChange(key)}
                    >
                      <i className={`ph-bold ${
                        key === 'languages' ? 'ph-translate' :
                        key === 'computerScience' ? 'ph-desktop' :
                        'ph-graduation-cap'
                      }`}></i>
                      <span className="text">{sector.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {newUser.role === 'instructor' && newUser.sector && Object.keys(sectors).includes(newUser.sector) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sélectionner une spécialisation
              </label>
              <select
                value={newUser.specialization}
                onChange={handleSpecializationChange}
                className="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark"
                required
              >
                <option value="">Choisir une spécialisation</option>
                {sectors[newUser.sector as SectorKey]?.options?.map((option: string) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          )}

          {newUser.role === 'student' && newUser.sector && Object.keys(sectors).includes(newUser.sector) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sélectionner vos intérêts
              </label>
              <select
                value={newUser.interests.join(', ')}
                onChange={(e) => {
                  const interestsArray = e.target.value.split(',').map(interest => interest.trim());
                  setNewUser({ ...newUser, interests: interestsArray });
                }}
                className="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark"
                required
              >
                <option value="">Choisir vos intérêts</option>
                {sectors[newUser.sector as SectorKey]?.options?.map((option: string) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isApproved"
              checked={newUser.isApproved}
              onChange={(e) => setNewUser({ ...newUser, isApproved: e.target.checked })}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="isApproved" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Compte actif
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => navigate('/admin/users')}
            className="rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-strokedark dark:text-gray-300 dark:hover:bg-meta-4"
          >
            Annuler
          </button>
          <button
            onClick={handleAddUser}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
          >
            Ajouter
          </button>
        </div>
      </div>

      <style>{`
        .options-container {
          width: 100%;
        }

        .option-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background-color: #F8FAFC;
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 500;
          color: #64748B;
        }

        .option-button.active {
          background-color: #0066FF;
          color: white;
        }

        .option-button:hover:not(.active) {
          background-color: #EEF2FF;
          color: #3B82F6;
        }

        .option-button .text {
          font-size: 16px;
        }

        @media (max-width: 768px) {
          .option-button {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </>
  );
};

export default AddUser; 