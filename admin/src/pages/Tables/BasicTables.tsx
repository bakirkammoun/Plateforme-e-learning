import React, { useState, useEffect } from 'react';
import Breadcrumb from '../../components/Breadcrumb';
import ComponentCard from "../../components/common/ComponentCard";
import BasicTableOne from "../../components/tables/BasicTableOne";
import PageMeta from "../../components/common/PageMeta";
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

interface Formation {
  _id: string;
  title: string;
  instructorId: string;
  students: string[];
}

interface Event {
  _id: string;
  title: string;
  instructorId: string;
  startDate: string;
  endDate: string;
  location: string;
}

type SectorKey = 'languages' | 'computerScience' | 'competitions';

interface Sector {
  name: string;
  options: string[];
}

type Sectors = Record<SectorKey, Sector>;

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isApproved: boolean;
  createdAt: string;
  specialization?: string;
  interests?: string[];
  sector?: string;
}

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

interface UserDetails {
  formations: Formation[];
  events: Event[];
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedSector, setSelectedSector] = useState('all');
  const [selectedSpecialization, setSelectedSpecialization] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(15);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof User;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
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
  const location = useLocation();
  const [targetUserId, setTargetUserId] = useState<string | null>(null);

  // Ajouter état pour le loading du toggle
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);

  // Ajouter état pour le message
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const navigate = useNavigate();

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

  useEffect(() => {
    // Vérifier si un userId est présent dans l'URL
    const params = new URLSearchParams(location.search);
    const userId = params.get('userId');
    if (userId) {
      setTargetUserId(userId);
    }
    
    fetchUsers();
  }, [location]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/users');
      const data = await response.json();
      setUsers(data);
      setLoading(false);
      
      // Si un userId est spécifié dans l'URL, sélectionner cet utilisateur
      if (targetUserId) {
        const user = data.find((u: User) => u._id === targetUserId);
        if (user) {
          setSelectedUser(user);
          fetchUserDetails(user._id, user.role);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userId: string, role: string) => {
    setLoadingDetails(true);
    try {
      let formations = [];
      let events = [];

      if (role === 'student') {
        const formationsResponse = await fetch(`http://localhost:5000/api/formations/student/${userId}`);
        formations = await formationsResponse.json();
      } else if (role === 'instructor') {
        const formationsResponse = await fetch(`http://localhost:5000/api/formations/instructor/${userId}`);
        formations = await formationsResponse.json();
        
        const eventsResponse = await fetch(`http://localhost:5000/api/events/instructor/${userId}`);
        events = await eventsResponse.json();
      }

      setUserDetails({ formations, events });
    } catch (error) {
      console.error('Erreur lors de la récupération des détails:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleUserClick = (user: User) => {
    if (user.role === 'student' || user.role === 'instructor') {
      setSelectedUser(user);
      fetchUserDetails(user._id, user.role);
    }
  };

  const handleEdit = (user: User) => {
    // Naviguer vers la page d'édition de l'utilisateur
    navigate(`/admin/users/edit/${user._id}`);
  };

  const handleDelete = async (userId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          setUsers(users.filter(user => user._id !== userId));
          toast.success('Utilisateur supprimé avec succès');
        } else {
          throw new Error('Erreur lors de la suppression');
        }
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        toast.error('Erreur lors de la suppression de l\'utilisateur');
      }
    }
  };

  const handleSort = (key: keyof User) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Fonction pour gérer le changement de statut
  const handleStatusToggle = async (userId: string, currentStatus: boolean) => {
    try {
      setTogglingUserId(userId); // Ajouter l'indicateur de chargement
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isApproved: !currentStatus
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la mise à jour du statut');
      }

      // Mettre à jour l'état local après une réponse réussie
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user._id === userId 
            ? { ...user, isApproved: !currentStatus }
            : user
        )
      );

      // Afficher un message de succès
      setMessage(data.message);
      setMessageType('success');
    } catch (error) {
      console.error('Erreur:', error);
      setMessage(error instanceof Error ? error.message : 'Erreur lors de la mise à jour du statut');
      setMessageType('error');
    } finally {
      setTogglingUserId(null); // Réinitialiser l'indicateur de chargement
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

      const data = await response.json();
      setUsers([...users, data]);
      setShowAddUserModal(false);
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
      setMessage('Utilisateur ajouté avec succès');
      setMessageType('success');
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

  const handleInterestChange = (value: string) => {
    const newInterests = newUser.interests.includes(value)
      ? newUser.interests.filter(i => i !== value)
      : [...newUser.interests, value];
    setNewUser({ ...newUser, interests: newInterests });
  };

  const filteredUsers = users
    .filter(user => {
      const matchesSearch = (
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      const matchesRole = selectedRole === 'all' || user.role === selectedRole;
      const matchesSector = selectedSector === 'all' || user.sector === selectedSector;
      const matchesSpecialization = selectedSpecialization === 'all' || user.specialization === selectedSpecialization;
      
      // Filtrer par userId si spécifié dans l'URL
      const matchesUserId = !targetUserId || user._id === targetUserId;
      
      return matchesSearch && matchesRole && matchesSector && matchesSpecialization && matchesUserId;
    })
    .sort((a, b) => {
      if (!sortConfig) return 0;
      
      const key = sortConfig.key as keyof User;
      const aValue = a[key];
      const bValue = b[key];

      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return sortConfig.direction === 'asc' ? 1 : -1;
      if (bValue === undefined) return sortConfig.direction === 'asc' ? -1 : 1;

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

  // Get current users for pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-boxdark-2">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="React.js Basic Tables Dashboard | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Basic Tables Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <Breadcrumb pageName="Gestion des Utilisateurs" />

      {/* User List */}
      <div className="mx-auto w-[1200px] rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        {message && (
          <div className={`mb-4 p-4 rounded ${
            messageType === 'success' 
              ? 'bg-success-500 bg-opacity-10 text-success-500' 
              : 'bg-danger-500 bg-opacity-10 text-danger-500'
          }`}>
            {message}
          </div>
        )}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2">
            <h2 className="text-title-md2 font-semibold text-black dark:text-white">
              Liste des Utilisateurs
            </h2>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {filteredUsers.length} utilisateurs au total
            </p>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Table Content */}
          <div className="w-[800px]">
            <div className="w-full">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-2 text-left dark:bg-meta-4">
                    <th className="w-[160px] py-4 px-2 font-medium text-black dark:text-white">
                      <button
                        onClick={() => handleSort('firstName')}
                        className="flex items-center gap-1"
                      >
                        Nom complet
                        {sortConfig?.key === 'firstName' && (
                          <span className="text-xs">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </button>
                    </th>
                    <th className="w-[130px] py-4 px-2 font-medium text-black dark:text-white">
                      <button
                        onClick={() => handleSort('email')}
                        className="flex items-center gap-1"
                      >
                        Email
                        {sortConfig?.key === 'email' && (
                          <span className="text-xs">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </button>
                    </th>
                    <th className="w-[90px] py-4 px-2 font-medium text-black dark:text-white">
                      <button
                        onClick={() => handleSort('role')}
                        className="flex items-center gap-1"
                      >
                        Rôle
                        {sortConfig?.key === 'role' && (
                          <span className="text-xs">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </button>
                    </th>
                    <th className="w-[90px] py-4 px-2 font-medium text-black dark:text-white">
                      Statut
                    </th>
                    <th className="w-[110px] py-4 px-2 font-medium text-black dark:text-white">
                      <button
                        onClick={() => handleSort('createdAt')}
                        className="flex items-center gap-1"
                      >
                        Date d'inscription
                        {sortConfig?.key === 'createdAt' && (
                          <span className="text-xs">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentUsers.map((user) => (
                    <tr 
                      key={user._id}
                      className="hover:bg-gray-50 dark:hover:bg-meta-4"
                    >
                      <td className="border-b border-[#eee] py-4 px-2 dark:border-strokedark">
                        {user.role === 'admin' ? (
                          <Link
                            to={`http://localhost:3005/profile?id=${user._id}`}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <div className="flex-shrink-0">
                              <img
                                src={`https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=random`}
                                alt={`${user.firstName} ${user.lastName}`}
                                className="h-8 w-8 rounded-full object-cover"
                              />
                            </div>
                            <h5 className="font-medium text-black dark:text-white">
                              {user.firstName} {user.lastName}
                            </h5>
                          </Link>
                        ) : user.role === 'student' ? (
                          <Link
                            to={`/student/${user._id}`}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <div className="flex-shrink-0">
                              <img
                                src={`https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=random`}
                                alt={`${user.firstName} ${user.lastName}`}
                                className="h-8 w-8 rounded-full object-cover"
                              />
                            </div>
                            <h5 className="font-medium text-black dark:text-white">
                              {user.firstName} {user.lastName}
                            </h5>
                          </Link>
                        ) : (
                          <Link
                            to={`/instructor/${user._id}`}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <div className="flex-shrink-0">
                              <img
                                src={`https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=random`}
                                alt={`${user.firstName} ${user.lastName}`}
                                className="h-8 w-8 rounded-full object-cover"
                              />
                            </div>
                            <h5 className="font-medium text-black dark:text-white">
                              {user.firstName} {user.lastName}
                            </h5>
                          </Link>
                        )}
                      </td>
                      <td className="border-b border-[#eee] py-4 px-2 dark:border-strokedark">
                        <p className="text-black dark:text-white">{user.email}</p>
                      </td>
                      <td className="border-b border-[#eee] py-4 px-2 dark:border-strokedark">
                        <span className={`inline-flex rounded-full px-2 py-1 text-sm font-medium ${
                          user.role === 'admin'
                            ? 'bg-success-500 bg-opacity-10 text-success-500'
                            : user.role === 'instructor'
                            ? 'bg-warning bg-opacity-10 text-warning'
                            : 'bg-primary bg-opacity-10 text-primary'
                        }`}>
                          {user.role === 'admin' ? 'Admin' : user.role === 'instructor' ? 'Instructeur' : 'Étudiant'}
                        </span>
                      </td>
                      <td className="border-b border-[#eee] py-4 px-2 dark:border-strokedark">
                        <div className="flex items-center gap-2">
                          <div 
                            className={`relative inline-flex h-6 w-11 cursor-pointer rounded-full transition-colors duration-200 ease-in-out
                              ${user.isApproved ? 'bg-success-500' : 'bg-danger-500'}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (togglingUserId !== user._id) {
                                const message = user.isApproved 
                                  ? 'Êtes-vous sûr de vouloir désactiver ce compte ?' 
                                  : 'Êtes-vous sûr de vouloir activer ce compte ?';
                                if (window.confirm(message)) {
                                  handleStatusToggle(user._id, user.isApproved);
                                }
                              }
                            }}
                          >
                            <span 
                              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out 
                                ${user.isApproved ? 'translate-x-6' : 'translate-x-1'}
                                ${togglingUserId === user._id ? 'animate-pulse' : ''}`}
                            />
                          </div>
                          <span className={`text-sm font-medium ${
                            user.isApproved 
                              ? 'text-success-500' 
                              : 'text-danger-500'
                          }`}>
                            {user.isApproved ? 'Actif' : 'Inactif'}
                          </span>
                        </div>
                      </td>
                      <td className="border-b border-[#eee] py-4 px-2 dark:border-strokedark">
                        {formatDate(user.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-center mt-4 mb-4">
              <nav className="flex items-center gap-2">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-md ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-primary text-white hover:bg-primary/80'
                  }`}
                >
                  Précédent
                </button>
                
                {[...Array(totalPages)].map((_, index) => (
                  <button
                    key={index + 1}
                    onClick={() => paginate(index + 1)}
                    className={`px-3 py-1 rounded-md ${
                      currentPage === index + 1
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
                
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded-md ${
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-primary text-white hover:bg-primary/80'
                  }`}
                >
                  Suivant
                </button>
              </nav>
            </div>
          </div>

          {/* Filters Sidebar */}
          <div className="w-[320px] flex-shrink-0 rounded-lg border border-stroke bg-white p-6 dark:border-strokedark dark:bg-boxdark">
            <div className="flex-between mb-6">
              <h4 className="text-lg font-medium text-black dark:text-white">Filtres</h4>
            </div>

            <div className="space-y-6">
              {/* Search Filter */}
              <div>
                <h6 className="mb-4 text-lg font-medium text-black dark:text-white">Recherche</h6>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Rechercher un utilisateur..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-lg border border-stroke bg-transparent py-3 pl-10 pr-4 outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                      <path d="M9 17C13.4183 17 17 13.4183 17 9C17 4.58172 13.4183 1 9 1C4.58172 1 1 4.58172 1 9C1 13.4183 4.58172 17 9 17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M19 19L14.65 14.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                </div>
              </div>

              {/* Role Filter */}
              <div>
                <h6 className="mb-4 text-lg font-medium text-black dark:text-white">Rôles</h6>
                <div className="flex flex-col gap-2">
                  {['admin', 'instructor', 'student'].map((role) => (
                    <div key={role} className="custom-radio">
                      <input
                        type="radio"
                        name="role"
                        id={role}
                        checked={selectedRole === role}
                        onChange={() => setSelectedRole(role)}
                        className="peer sr-only"
                      />
                      <label
                        htmlFor={role}
                        className="flex cursor-pointer items-center justify-between rounded-lg border border-stroke p-3 hover:bg-gray-50 peer-checked:border-primary peer-checked:bg-primary/5 dark:border-strokedark dark:hover:bg-meta-4"
                      >
                        <span className="text-sm font-medium text-black dark:text-white">
                          {role === 'admin' ? 'Administrateur' : role === 'instructor' ? 'Instructeur' : 'Étudiant'}
                        </span>
                        <span className="peer-checked:border-primary peer-checked:bg-primary">
                          <svg className="h-4 w-4 text-primary" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                          </svg>
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sector Filter */}
              <div>
                <h6 className="mb-4 text-lg font-medium text-black dark:text-white">Secteurs</h6>
                <div className="flex flex-col gap-2">
                  {Object.entries(sectors).map(([key, sector]) => (
                    <div key={key} className="custom-radio">
                      <input
                        type="radio"
                        name="sector"
                        id={key}
                        checked={selectedSector === key}
                        onChange={() => {
                          setSelectedSector(key);
                          setSelectedSpecialization('all');
                        }}
                        className="peer sr-only"
                      />
                      <label
                        htmlFor={key}
                        className="flex cursor-pointer items-center justify-between rounded-lg border border-stroke p-3 hover:bg-gray-50 peer-checked:border-primary peer-checked:bg-primary/5 dark:border-strokedark dark:hover:bg-meta-4"
                      >
                        <span className="text-sm font-medium text-black dark:text-white">
                          {sector.name}
                        </span>
                        <span className="peer-checked:border-primary peer-checked:bg-primary">
                          <svg className="h-4 w-4 text-primary" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                          </svg>
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Specialization Filter */}
              {selectedSector !== 'all' && (
                <div>
                  <h6 className="mb-4 text-lg font-medium text-black dark:text-white">Spécialisations</h6>
                  <div className="flex flex-col gap-2">
                    {sectors[selectedSector as keyof Sectors].options.map((option) => (
                      <div key={option} className="custom-radio">
                        <input
                          type="radio"
                          name="specialization"
                          id={option}
                          checked={selectedSpecialization === option}
                          onChange={() => setSelectedSpecialization(option)}
                          className="peer sr-only"
                        />
                        <label
                          htmlFor={option}
                          className="flex cursor-pointer items-center justify-between rounded-lg border border-stroke p-3 hover:bg-gray-50 peer-checked:border-primary peer-checked:bg-primary/5 dark:border-strokedark dark:hover:bg-meta-4"
                        >
                          <span className="text-sm font-medium text-black dark:text-white">
                            {option}
                          </span>
                          <span className="peer-checked:border-primary peer-checked:bg-primary">
                            <svg className="h-4 w-4 text-primary" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                            </svg>
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reset Button */}
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedRole('all');
                  setSelectedSector('all');
                  setSelectedSpecialization('all');
                }}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-center font-medium text-white transition-all hover:bg-opacity-90"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Réinitialiser les filtres
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* User Details Modal */}
      {selectedUser && userDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 dark:bg-boxdark">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-black dark:text-white">
                Détails de {selectedUser.firstName} {selectedUser.lastName}
              </h3>
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setUserDetails(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            {loadingDetails ? (
              <div className="flex h-40 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {userDetails.formations.length > 0 && (
                  <div>
                    <h4 className="mb-3 text-lg font-medium text-black dark:text-white">
                      {selectedUser.role === 'student' ? 'Formations suivies' : 'Formations créées'}
                    </h4>
                    <div className="space-y-2">
                      {userDetails.formations.map(formation => (
                        <div 
                          key={formation._id}
                          className="rounded-lg border border-stroke p-4 dark:border-strokedark"
                        >
                          <h5 className="text-base font-medium text-black dark:text-white">
                            {formation.title}
                          </h5>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedUser.role === 'instructor' && userDetails.events.length > 0 && (
                  <div>
                    <h4 className="mb-3 text-lg font-medium text-black dark:text-white">
                      Événements créés
                    </h4>
                    <div className="space-y-2">
                      {userDetails.events.map(event => (
                        <div 
                          key={event._id}
                          className="rounded-lg border border-stroke p-4 dark:border-strokedark"
                        >
                          <h5 className="text-base font-medium text-black dark:text-white">
                            {event.title || 'Sans titre'}
                          </h5>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {event.startDate && event.endDate ? (
                              <>
                                Du {new Date(event.startDate).toLocaleDateString('fr-FR')} au {new Date(event.endDate).toLocaleDateString('fr-FR')}
                              </>
                            ) : 'Dates non spécifiées'}
                          </p>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {event.location || 'Lieu non spécifié'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {userDetails.formations.length === 0 && (
                  <p className="text-center text-gray-500 dark:text-gray-400">
                    {selectedUser.role === 'student' 
                      ? 'Aucune formation suivie'
                      : 'Aucune formation créée'}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .custom-radio {
          position: relative;
        }

        .custom-radio input:checked + label {
          border-color: #0066FF;
          background-color: rgba(0, 102, 255, 0.05);
        }

        .custom-radio input:checked + label span:last-child {
          display: block;
        }

        .custom-radio input:not(:checked) + label span:last-child {
          display: none;
        }

        .custom-radio label {
          transition: all 0.3s ease;
        }

        .custom-radio label:hover {
          background-color: #F8FAFC;
        }

        @media (prefers-color-scheme: dark) {
          .custom-radio input:checked + label {
            background-color: rgba(0, 102, 255, 0.1);
          }

          .custom-radio label:hover {
            background-color: #1E293B;
          }
        }
      `}</style>
    </>
  );
};

export default UserManagement;
