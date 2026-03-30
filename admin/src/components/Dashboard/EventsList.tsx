import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';

interface Event {
  _id: string;
  title: string;
  color: 'Danger' | 'Success' | 'Primary' | 'Warning';
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  location: string;
  description?: string;
  image?: string;
}

const ITEMS_PER_PAGE = 9;

const EventsList = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date');
  const [filterColor, setFilterColor] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchParams] = useSearchParams();
  const eventIdParam = searchParams.get('eventId');

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [searchTerm, filterColor, sortBy]);

  const fetchEvents = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/events');
      const eventsData = response.data;
      if (Array.isArray(eventsData)) {
        setEvents(eventsData);
      }
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors de la récupération des événements:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (color: string) => {
    const colorMap: { [key: string]: { bg: string; text: string; border: string } } = {
      Danger: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
      Success: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
      Primary: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
      Warning: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-200' }
    };
    return colorMap[color] || { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' };
  };

  const formatDate = (date: string, time: string) => {
    const dateObj = new Date(`${date}T${time}`);
    return dateObj.toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getColorLabel = (color: string) => {
    const colorLabels: { [key: string]: string } = {
      Danger: 'Urgent',
      Success: 'Confirmé',
      Primary: 'En cours',
      Warning: 'En attente'
    };
    return colorLabels[color] || color;
  };

  const filteredAndSortedEvents = events
    .filter(event => {
      const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          event.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesColor = filterColor === 'all' || event.color === filterColor;
      
      // Si un eventId est spécifié, ne montrer que cet événement
      if (eventIdParam) {
        return event._id === eventIdParam;
      }
      
      return matchesSearch && matchesColor;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(`${a.startDate}T${a.startTime}`);
        const dateB = new Date(`${b.startDate}T${b.startTime}`);
        return dateA.getTime() - dateB.getTime();
      } else {
        return a.title.localeCompare(b.title);
      }
    });

  // Pagination calculations
  const totalPages = Math.ceil(filteredAndSortedEvents.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedEvents = filteredAndSortedEvents.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-xl font-semibold text-black dark:text-white">
            Événements à venir
          </h4>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {filteredAndSortedEvents.length} événement(s) trouvé(s)
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-stroke bg-transparent py-2 pl-10 pr-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-strokedark dark:bg-boxdark"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <path d="M9 17C13.4183 17 17 13.4183 17 9C17 4.58172 13.4183 1 9 1C4.58172 1 1 4.58172 1 9C1 13.4183 4.58172 17 9 17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M19 19L14.65 14.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </div>

          <select
            value={filterColor}
            onChange={(e) => setFilterColor(e.target.value)}
            className="rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-strokedark dark:bg-boxdark"
          >
            <option value="all">Toutes les priorités</option>
            <option value="Primary">En cours</option>
            <option value="Success">Confirmé</option>
            <option value="Warning">En attente</option>
            <option value="Danger">Urgent</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'title')}
            className="rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-strokedark dark:bg-boxdark"
          >
            <option value="date">Trier par date</option>
            <option value="title">Trier par titre</option>
          </select>

          <Link
            to="/calendar"
            className="inline-flex items-center justify-center rounded-lg bg-primary py-2 px-6 text-sm font-medium text-white hover:bg-opacity-90 transition-all duration-200 hover:shadow-lg"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Voir le calendrier
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {paginatedEvents.map((event) => {
          const { bg, text, border } = getStatusColor(event.color);
          return (
          <div
            key={event._id}
              className="group relative overflow-hidden rounded-xl border border-stroke bg-white shadow-1 transition-all duration-300 hover:shadow-3xl dark:border-strokedark dark:bg-boxdark"
            >
              <div className="relative h-48 w-full overflow-hidden">
                <Link to={`/events/${event._id}`} className="block h-full">
                  <img
                    src={event.image || '/img/event-default.jpg'}
                  alt={event.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                </Link>
                <span className={`absolute top-4 right-4 rounded-lg ${bg} ${text} ${border} px-4 py-1 text-sm font-semibold shadow-sm`}>
                  {getColorLabel(event.color)}
                </span>
              </div>

              <div className="p-6">
                <Link to={`/events/${event._id}`}>
                  <h3 className="mb-4 text-xl font-semibold text-black line-clamp-2 dark:text-white hover:text-primary transition-colors duration-200">
                    {event.title}
                  </h3>
                </Link>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center text-body dark:text-bodydark">
                    <svg className="mr-2 h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Début: {formatDate(event.startDate, event.startTime)}
                  </div>

                  <div className="flex items-center text-body dark:text-bodydark">
                    <svg className="mr-2 h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                  Fin: {formatDate(event.endDate, event.endTime)}
              </div>

                  <div className="flex items-center text-body dark:text-bodydark">
                    <svg className="mr-2 h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                    <span className="line-clamp-1">{event.location}</span>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between gap-2">
                  <Link
                    to={`/events/${event._id}`}
                    className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 transition-all duration-200 hover:shadow-lg"
                  >
                    <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Voir détails
                  </Link>

                  <div className="flex gap-2">
                    <Link
                      to={`/events/${event._id}/edit`}
                      className="inline-flex items-center justify-center rounded-lg border border-primary px-2 py-2 text-xs font-medium text-primary hover:bg-primary hover:text-white transition-colors duration-200"
                    >
                      <svg className="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Modifier
                    </Link>

                    <button
                      onClick={() => {
                        if (window.confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
                          // Add delete functionality here
                        }
                      }}
                      className="inline-flex items-center justify-center rounded-lg border border-danger px-2 py-2 text-xs font-medium text-danger hover:bg-danger hover:text-white transition-colors duration-200"
                    >
                      <svg className="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8 mb-4">
          <nav className="flex space-x-2" aria-label="Pagination">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 rounded-lg border border-stroke text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:border-strokedark dark:hover:bg-meta-4"
            >
              Précédent
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
              <button
                key={pageNumber}
                onClick={() => handlePageChange(pageNumber)}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  pageNumber === currentPage
                    ? 'bg-primary text-white'
                    : 'border border-stroke hover:bg-gray-100 dark:border-strokedark dark:hover:bg-meta-4'
                }`}
              >
                {pageNumber}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 rounded-lg border border-stroke text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:border-strokedark dark:hover:bg-meta-4"
            >
              Suivant
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default EventsList; 