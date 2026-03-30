import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Breadcrumb from '../../components/Breadcrumb';

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImage?: string;
}

interface Formation {
  _id: string;
  title: string;
  price: number;
  category: string;
  level: string;
}

interface Instructor {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImage?: string;
  supervisedStudents: {
    student: Student;
    formations: Formation[];
    supervisionStatus: string;
    supervisionRequestDate: string;
  }[];
}

const InstructorSupervision = () => {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInstructor, setSelectedInstructor] = useState<string | null>(null);

  useEffect(() => {
    fetchInstructors();
  }, []);

  const fetchInstructors = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/admin/instructors-with-students');
      setInstructors(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching instructors:', error);
      toast.error('Erreur lors de la récupération des instructeurs');
      setLoading(false);
    }
  };

  const filteredInstructors = instructors
    .filter(instructor => instructor.supervisedStudents.length > 0)
    .filter(instructor => {
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      return (
        instructor.firstName.toLowerCase().includes(searchLower) ||
        instructor.lastName.toLowerCase().includes(searchLower) ||
        instructor.email.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  return (
    <>
      <Breadcrumb pageName="Supervision des Étudiants" />

      <div className="rounded-xl border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-lg hover:shadow-xl transition-all duration-300 dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="animate-fadeIn">
            <h2 className="text-2xl font-bold text-black dark:text-white mb-2">
              Liste des Instructeurs avec Étudiants
            </h2>
            <p className="text-base text-gray-600 dark:text-gray-400">
              {filteredInstructors.length} instructeur{filteredInstructors.length > 1 ? 's' : ''} avec des étudiants à superviser
            </p>
          </div>

          {filteredInstructors.length > 0 && (
            <div className="relative animate-slideInRight">
            <input
              type="text"
              placeholder="Rechercher un instructeur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-80 rounded-xl border-2 border-stroke bg-transparent py-3 pl-12 pr-4 outline-none focus:border-primary transition-all duration-300 hover:border-primary/60 dark:border-strokedark dark:bg-boxdark"
            />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path d="M9 17C13.4183 17 17 13.4183 17 9C17 4.58172 13.4183 1 9 1C4.58172 1 1 4.58172 1 9C1 13.4183 4.58172 17 9 17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M19 19L14.65 14.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent shadow-md"></div>
          </div>
        ) : filteredInstructors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 animate-fadeIn">
            <div className="w-24 h-24 mb-6 text-gray-400 dark:text-gray-600">
              <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Aucun instructeur avec des étudiants
            </h3>
            <p className="text-lg text-gray-500 dark:text-gray-400 text-center max-w-md">
              Il n'y a actuellement aucun instructeur avec des étudiants à superviser.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            {filteredInstructors.map((instructor, index) => (
              <div 
                key={instructor._id} 
                className="bg-white dark:bg-boxdark rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden animate-fadeInUp border border-stroke/10 max-w-sm mx-auto w-full"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="p-3">
                  <div className="flex items-center gap-3 mb-3">
                    {instructor.profileImage ? (
                      <div className="relative">
                      <img
                          src={instructor.profileImage.startsWith('http') 
                            ? instructor.profileImage 
                            : `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/uploads/profiles/${instructor.profileImage}`}
                        alt={`${instructor.firstName} ${instructor.lastName}`}
                          className="w-16 h-16 rounded-full object-cover border-2 border-primary/20 shadow-md"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://ui-avatars.com/api/?name=' + 
                              encodeURIComponent(`${instructor.firstName} ${instructor.lastName}`) +
                              '&background=3b82f6&color=fff&size=96';
                          }}
                        />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-success rounded-full border-2 border-white dark:border-boxdark"></div>
                      </div>
                    ) : (
                      <div className="relative">
                        <img
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(`${instructor.firstName} ${instructor.lastName}`)}&background=3b82f6&color=fff&size=96`}
                          alt={`${instructor.firstName} ${instructor.lastName}`}
                          className="w-16 h-16 rounded-full object-cover border-2 border-primary/20 shadow-md"
                        />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-success rounded-full border-2 border-white dark:border-boxdark"></div>
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-black dark:text-white mb-1">
                        {instructor.firstName} {instructor.lastName}
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 flex items-center text-sm">
                        <svg className="w-4 h-4 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {instructor.email}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <button
                      onClick={() => setSelectedInstructor(selectedInstructor === instructor._id ? null : instructor._id)}
                      className="flex items-center justify-between w-full text-left py-2.5 px-4 rounded-lg bg-gray-50 dark:bg-boxdark-2 hover:bg-gray-100 dark:hover:bg-boxdark-3 transition-all duration-300"
                    >
                      <span className="text-sm font-semibold text-primary">
                        {instructor.supervisedStudents.length} étudiants supervisés
                      </span>
                      <svg
                        className={`w-4 h-4 text-primary transform transition-transform duration-300 ${
                          selectedInstructor === instructor._id ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {selectedInstructor === instructor._id && (
                      <div className="mt-4 space-y-4 animate-slideInDown">
                        {instructor.supervisedStudents.map((supervision) => (
                          <div 
                            key={supervision.student._id} 
                            className="bg-gray-50 dark:bg-boxdark-2 rounded-lg p-3 hover:shadow-md border border-stroke/10 transition-all duration-300"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0">
                              {supervision.student.profileImage ? (
                                  <div className="relative">
                                    <img
                                      src={supervision.student.profileImage.startsWith('http') 
                                        ? supervision.student.profileImage 
                                        : `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/uploads/profiles/${supervision.student.profileImage}`}
                                      alt={`${supervision.student.firstName} ${supervision.student.lastName}`}
                                      className="w-12 h-12 rounded-full object-cover border-2 border-primary/20 shadow-sm"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = 'https://ui-avatars.com/api/?name=' + 
                                          encodeURIComponent(`${supervision.student.firstName} ${supervision.student.lastName}`) +
                                          '&background=3b82f6&color=fff&size=64';
                                      }}
                                    />
                                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center ${
                                      supervision.supervisionStatus === 'accepted' 
                                        ? 'bg-success text-white' 
                                        : 'bg-warning text-white'
                                    } border-2 border-white dark:border-boxdark-2`}>
                                      {supervision.supervisionStatus === 'accepted' ? (
                                        <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                      ) : (
                                        <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="relative">
                                    <img
                                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(`${supervision.student.firstName} ${supervision.student.lastName}`)}&background=3b82f6&color=fff&size=64`}
                                  alt={`${supervision.student.firstName} ${supervision.student.lastName}`}
                                      className="w-12 h-12 rounded-full object-cover border-2 border-primary/20 shadow-sm"
                                    />
                                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center ${
                                      supervision.supervisionStatus === 'accepted' 
                                        ? 'bg-success text-white' 
                                        : 'bg-warning text-white'
                                    } border-2 border-white dark:border-boxdark-2`}>
                                      {supervision.supervisionStatus === 'accepted' ? (
                                        <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                      ) : (
                                        <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                      )}
                                    </div>
                                </div>
                              )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <h3 className="text-base font-semibold text-black dark:text-white truncate">
                                  {supervision.student.firstName} {supervision.student.lastName}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                  {supervision.student.email}
                                </p>
                            <div className="mt-2">
                                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                                    supervision.supervisionStatus === 'accepted'
                                      ? 'bg-success/10 text-success'
                                      : 'bg-warning/10 text-warning'
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                      supervision.supervisionStatus === 'accepted' ? 'bg-success' : 'bg-warning'
                                    }`}></span>
                                    {supervision.supervisionStatus === 'accepted' ? 'Accepté' : 'En attente'}
                                      </span>
                                    </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @keyframes slideInDown {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes slideInRight {
            from {
              opacity: 0;
              transform: translateX(20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
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

          .animate-fadeIn {
            animation: fadeIn 0.5s ease-out;
          }

          .animate-slideInDown {
            animation: slideInDown 0.3s ease-out;
          }

          .animate-slideInRight {
            animation: slideInRight 0.5s ease-out;
          }

          .animate-fadeInUp {
            animation: fadeInUp 0.5s ease-out forwards;
          }

          .bg-success {
            background-color: #10b981;
          }

          .bg-warning {
            background-color: #f59e0b;
          }

          .text-success {
            color: #10b981;
          }

          .text-warning {
            color: #f59e0b;
          }

          .bg-success\/10 {
            background-color: rgba(16, 185, 129, 0.1);
          }

          .bg-warning\/10 {
            background-color: rgba(245, 158, 11, 0.1);
          }

          .bg-primary\/10 {
            background-color: rgba(59, 130, 246, 0.1);
          }

          .dark .dark\:bg-boxdark-3 {
            background-color: #1e2a37;
          }
        `}
      </style>
    </>
  );
};

export default InstructorSupervision; 