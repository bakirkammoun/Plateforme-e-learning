'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Breadcrumb from "@/components/Breadcrumb";
import CertificateOne from "@/components/CertificateOne";
import EventsAllOne from "@/components/EventsAllOne";
import FooterOne from "@/components/FooterOne";
import Header from "@/components/Header";
import Animation from "@/helper/Animation";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Debounce function
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const EVENTS_PER_PAGE = 9;

const EventsPage = () => {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilters, setActiveFilters] = useState({
    dateRange: {
      start: '',
      end: '',
      preset: 'custom'
    },
    colors: []
  });

  const checkUpcomingEvents = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/events');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const allEvents = await response.json();
      setEvents(allEvents);
      setFilteredEvents(allEvents);
    } catch (error) {
      console.error('Error checking events:', error);
      toast.error('Error loading events. Please try again.');
      setEvents([]);
      setFilteredEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Memoized filter function
  const filterEvents = useMemo(() => {
    return (allEvents, filters, search) => {
      setIsFiltering(true);
      let result = [...allEvents];

      // Apply search filter
      if (search) {
        const searchLower = search.toLowerCase();
        result = result.filter(event => 
          event.title?.toLowerCase().includes(searchLower) ||
          event.description?.toLowerCase().includes(searchLower) ||
          event.location?.toLowerCase().includes(searchLower)
        );
      }

      // Apply date filter
      if (filters.dateRange.start && filters.dateRange.end) {
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        result = result.filter(event => {
          const eventDate = new Date(event.startDate);
          return eventDate >= startDate && eventDate <= endDate;
        });
      }

      // Apply color/priority filter
      if (filters.colors.length > 0) {
        result = result.filter(event => {
          const colorMap = {
            'high': 'Danger',
            'medium': 'Warning',
            'low': 'Success',
            'info': 'Primary'
          };
          
          return filters.colors.some(priority => colorMap[priority] === event.color);
        });
      }

      return result;
    };
  }, []);

  // Get paginated events
  const getPaginatedEvents = (events) => {
    const startIndex = (currentPage - 1) * EVENTS_PER_PAGE;
    const endIndex = startIndex + EVENTS_PER_PAGE;
    return events.slice(startIndex, endIndex);
  };

  // Calculate total pages
  const totalPages = Math.ceil(filteredEvents.length / EVENTS_PER_PAGE);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((value) => {
      setSearchTerm(value);
      setCurrentPage(1); // Reset to first page on search
      const newFiltered = filterEvents(events, activeFilters, value);
      setFilteredEvents(newFiltered);
      setIsFiltering(false);
    }, 300),
    [events, activeFilters]
  );

  // Handle immediate filters
  const handleFilterChange = useCallback((type, value) => {
    setIsFiltering(true);
    let newFilters = { ...activeFilters };

    switch (type) {
      case 'date':
        newFilters.dateRange = value;
        break;
      case 'color':
        const colorIndex = activeFilters.colors.indexOf(value);
        if (colorIndex === -1) {
          newFilters.colors = [...activeFilters.colors, value];
        } else {
          newFilters.colors = activeFilters.colors.filter(c => c !== value);
        }
        break;
      case 'reset':
        newFilters = {
          dateRange: { start: '', end: '', preset: 'custom' },
          colors: []
        };
        setSearchTerm('');
        break;
    }

    setCurrentPage(1); // Reset to first page on filter change
    setActiveFilters(newFilters);
    const newFiltered = filterEvents(events, newFilters, searchTerm);
    setFilteredEvents(newFiltered);
    setTimeout(() => setIsFiltering(false), 300);
  }, [events, activeFilters, searchTerm, filterEvents]);

  const handleDatePresetChange = useCallback((preset) => {
    const today = new Date();
    let start = today;
    let end = today;

    switch (preset) {
      case 'today':
        start = new Date(today.setHours(0, 0, 0, 0));
        end = new Date(today.setHours(23, 59, 59, 999));
        break;
      case 'thisWeek':
        start = new Date(today.setDate(today.getDate() - today.getDay()));
        end = new Date(new Date(start).setDate(start.getDate() + 6));
        break;
      case 'thisMonth':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      default:
        break;
    }

    handleFilterChange('date', {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
      preset
    });
  }, [handleFilterChange]);

  // Initial load
  useEffect(() => {
    checkUpcomingEvents();
  }, []);

  // Apply filters when events change
  useEffect(() => {
    if (events.length > 0) {
      const filtered = filterEvents(events, activeFilters, searchTerm);
      setFilteredEvents(filtered);
    }
  }, [events, filterEvents, activeFilters, searchTerm]);

  const paginatedEvents = getPaginatedEvents(filteredEvents);

  return (
    <>
      <ToastContainer />
      <Animation />
      <Header />
      <Breadcrumb title="Events" />

      <section className='py-120' style={{ backgroundColor: '#F5F7FE' }}>
        <div className='container-fluid px-lg-80'>
          <div className='row g-4'>
            <div className="col-lg-3">
              <div className="filter-sidebar">
                <div className="filter-header d-flex justify-content-between align-items-center mb-4">
                  <h5 className="m-0 d-flex align-items-center">
                    <span className="filter-icon-wrapper me-2">
                      <i className="ph ph-funnel"></i>
                    </span>
                    Filters
                    <span className={`filter-count ms-2 ${isFiltering ? 'updating' : ''}`}>
                      ({filteredEvents.length})
                    </span>
                  </h5>
                  <button 
                    className="btn-reset" 
                    onClick={() => handleFilterChange('reset')}
                  >
                    <i className="ph ph-x me-1"></i>
                    Clear All
                  </button>
                </div>

                <div className="filter-section mb-4">
                  <label className="filter-label">Search Events</label>
                  <div className="search-wrapper">
                    <i className="ph ph-magnifying-glass search-icon"></i>
                    <input
                      type="text"
                      className="search-input"
                      placeholder="Search events..."
                      value={searchTerm}
                      onChange={(e) => debouncedSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div className="filter-section mb-4">
                  <h6 className="filter-title">
                    <span className="filter-icon-wrapper me-2">
                      <i className="ph ph-calendar"></i>
                    </span>
                    Date Filter
                  </h6>
                  <div className="date-filter-options">
                    <div className="date-buttons">
                      <button
                        type="button"
                        className={`date-button ${activeFilters.dateRange.preset === 'today' ? 'active' : ''}`}
                        onClick={() => handleDatePresetChange('today')}
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        className={`date-button ${activeFilters.dateRange.preset === 'thisWeek' ? 'active' : ''}`}
                        onClick={() => handleDatePresetChange('thisWeek')}
                      >
                        This Week
                      </button>
                      <button
                        type="button"
                        className={`date-button ${activeFilters.dateRange.preset === 'thisMonth' ? 'active' : ''}`}
                        onClick={() => handleDatePresetChange('thisMonth')}
                      >
                        This Month
                      </button>
                      <button
                        type="button"
                        className={`date-button ${activeFilters.dateRange.preset === 'custom' ? 'active' : ''}`}
                        onClick={() => handleDatePresetChange('custom')}
                      >
                        Custom
                      </button>
                    </div>
                    
                    {activeFilters.dateRange.preset === 'custom' && (
                      <div className="custom-date-range">
                        <div className="date-inputs">
                          <div className="date-input-group">
                            <label className="date-label">Start Date</label>
                            <input
                              type="date"
                              className="date-input"
                              value={activeFilters.dateRange.start}
                              onChange={(e) => handleFilterChange('date', {
                                ...activeFilters.dateRange,
                                start: e.target.value,
                                preset: 'custom'
                              })}
                            />
                          </div>
                          <div className="date-input-group">
                            <label className="date-label">End Date</label>
                            <input
                              type="date"
                              className="date-input"
                              value={activeFilters.dateRange.end}
                              onChange={(e) => handleFilterChange('date', {
                                ...activeFilters.dateRange,
                                end: e.target.value,
                                preset: 'custom'
                              })}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="filter-section">
                  <h6 className="filter-title">
                    <span className="filter-icon-wrapper me-2">
                      <i className="ph ph-flag"></i>
                    </span>
                    Event Priority
                  </h6>
                  <div className="priority-options">
                    {[
                      { id: 'high', label: 'High Priority', desc: 'Urgent', color: 'danger', icon: 'ph-warning-circle' },
                      { id: 'medium', label: 'Medium Priority', desc: 'Important', color: 'warning', icon: 'ph-clock' },
                      { id: 'low', label: 'Low Priority', desc: 'Optional', color: 'success', icon: 'ph-check-circle' },
                      { id: 'info', label: 'Informational', desc: 'General', color: 'primary', icon: 'ph-info' }
                    ].map((priority) => (
                      <div 
                        key={priority.id}
                        className={`priority-option ${activeFilters.colors.includes(priority.id) ? 'active' : ''}`}
                        onClick={() => handleFilterChange('color', priority.id)}
                      >
                        <div className="priority-checkbox-wrapper">
                          <input
                            type="checkbox"
                            id={`priority-${priority.id}`}
                            checked={activeFilters.colors.includes(priority.id)}
                            onChange={() => {}}
                            className="priority-checkbox"
                          />
                          <label htmlFor={`priority-${priority.id}`} className="priority-label">
                            <span className={`priority-dot bg-${priority.color}`}>
                              <i className={`ph ${priority.icon}`}></i>
                            </span>
                            <div className="priority-text">
                              <span className="priority-name">{priority.label}</span>
                              <span className="priority-desc">({priority.desc})</span>
                            </div>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-9">
              <div className={`events-container ${isLoading ? 'loading' : ''} ${isFiltering ? 'filtering' : ''}`}>
                {isLoading ? (
                  <div className="loading-overlay">
                    <div className="loading-spinner"></div>
                    <p>Loading events...</p>
                  </div>
                ) : filteredEvents.length === 0 ? (
                  <div className="no-events-message">
                    <i className="ph ph-calendar-x text-4xl text-neutral-400 mb-3"></i>
                    <h3>No Events Found</h3>
                    <p className="text-neutral-500">Try adjusting your filters or search criteria</p>
                  </div>
                ) : (
                  <>
                    <EventsAllOne events={paginatedEvents} />
                    
                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="pagination-container mt-40">
                        <div className="pagination d-flex justify-content-center gap-2">
                          <button
                            className={`pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                          >
                            <i className="ph ph-arrow-left"></i>
                          </button>
                          
                          {[...Array(totalPages)].map((_, index) => (
                            <button
                              key={index + 1}
                              className={`pagination-btn ${currentPage === index + 1 ? 'active' : ''}`}
                              onClick={() => handlePageChange(index + 1)}
                            >
                              {index + 1}
                            </button>
                          ))}
                          
                          <button
                            className={`pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`}
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                          >
                            <i className="ph ph-arrow-right"></i>
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <CertificateOne />
      <FooterOne />

      <style jsx>{`
        .filter-sidebar {
          background: white;
          padding: 24px;
          border-radius: 16px;
          box-shadow: 0 4px 25px rgba(0, 0, 0, 0.08);
          position: sticky;
          top: 20px;
          border: 1px solid rgba(0, 0, 0, 0.05);
        }

        .filter-header {
          margin-bottom: 24px;
        }

        .filter-icon-wrapper {
          width: 32px;
          height: 32px;
          background: #f0f7ff;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0d6efd;
        }

        .btn-reset {
          background: none;
          border: none;
          color: #666;
          font-size: 13px;
          padding: 6px 12px;
          border-radius: 20px;
          transition: all 0.2s;
        }

        .btn-reset:hover {
          background: #fee2e2;
          color: #ef4444;
        }

        .filter-section {
          padding-bottom: 20px;
          border-bottom: 1px solid #f0f0f0;
          margin-bottom: 20px;
        }

        .filter-section:last-child {
          border-bottom: none;
          padding-bottom: 0;
          margin-bottom: 0;
        }

        .filter-label {
          font-size: 14px;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 12px;
          display: block;
        }

        .search-wrapper {
          position: relative;
        }

        .search-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #666;
          font-size: 16px;
        }

        .search-input {
          width: 100%;
          padding: 12px 16px 12px 44px;
          border: 1px solid #e0e0e0;
          border-radius: 12px;
          font-size: 14px;
          transition: all 0.2s;
          background: #f8f9ff;
        }

        .search-input:focus {
          border-color: #0d6efd;
          box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.1);
          outline: none;
        }

        .filter-option {
          padding: 8px 12px;
          border-radius: 8px;
          transition: background-color 0.2s;
          cursor: pointer;
        }

        .filter-option:hover {
          background: #f0f7ff;
        }

        .filter-radio {
          margin-right: 8px;
        }

        .custom-date-range {
          margin-top: 16px;
          background: #f8f9ff;
          padding: 16px;
          border-radius: 12px;
        }

        .date-inputs {
          display: flex;
          gap: 12px;
        }

        .date-input-group {
          flex: 1;
        }

        .date-label {
          font-size: 12px;
          color: #666;
          margin-bottom: 6px;
          display: block;
        }

        .date-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          font-size: 13px;
          background: white;
          transition: all 0.2s;
        }

        .date-input:focus {
          border-color: #0d6efd;
          box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.1);
          outline: none;
        }

        @media (max-width: 576px) {
          .date-inputs {
            flex-direction: column;
          }
        }

        .priority-options {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .priority-option {
          padding: 12px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid transparent;
        }

        .priority-option:hover {
          background-color: #f8f9ff;
          border-color: #e5e7eb;
        }

        .priority-option.active {
          background-color: #f0f7ff;
          border-color: #2563eb;
        }

        .priority-checkbox-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .priority-dot {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 16px;
        }

        .priority-text {
          display: flex;
          flex-direction: column;
        }

        .priority-name {
          font-weight: 600;
          color: #1a1a1a;
          font-size: 14px;
        }

        .priority-desc {
          color: #6b7280;
          font-size: 12px;
        }

        .bg-danger {
          background-color: #dc3545;
        }

        .bg-warning {
          background-color: #ffc107;
        }

        .bg-success {
          background-color: #198754;
        }

        .bg-primary {
          background-color: #0d6efd;
        }

        @media (max-width: 991px) {
          .filter-sidebar {
            margin-bottom: 24px;
            position: static;
          }
        }

        .date-filter-options {
          margin-top: 16px;
        }

        .date-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .date-button {
          flex: 1;
          min-width: 80px;
          padding: 8px 12px;
          background: #f8f9ff;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          font-size: 13px;
          color: #666;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
          white-space: nowrap;
        }

        .date-button:hover {
          background: #f0f7ff;
          border-color: #0d6efd;
          color: #0d6efd;
        }

        .date-button.active {
          background: #0d6efd;
          border-color: #0d6efd;
          color: white;
        }

        .events-container {
          position: relative;
          min-height: 200px;
        }

        .events-container.loading {
          opacity: 1;
        }

        .events-container.filtering {
          opacity: 1;
        }

        .loading-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 16px;
          z-index: 10;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #f0f7ff;
          border-top-color: #0d6efd;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        .filter-count {
          transition: all 0.3s ease;
        }

        .filter-count.updating {
          transform: scale(1.1);
          color: #0d6efd;
        }

        .date-button {
          position: relative;
          overflow: hidden;
        }

        .date-button::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          background: rgba(13, 110, 253, 0.2);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          transition: width 0.3s ease, height 0.3s ease;
        }

        .date-button:active::after {
          width: 200px;
          height: 200px;
          opacity: 0;
        }

        .priority-option {
          transform-origin: left center;
          transition: all 0.2s ease;
        }

        .priority-option:hover {
          transform: translateX(4px);
        }

        .priority-checkbox:checked + .priority-label .priority-dot {
          transform: scale(1.1);
          transition: transform 0.2s ease;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .search-input {
          transition: all 0.3s ease;
        }

        .search-input:focus {
          transform: translateY(-1px);
        }

        .filter-section {
          opacity: 0;
          animation: fadeIn 0.3s ease forwards;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .filter-section:nth-child(1) { animation-delay: 0.1s; }
        .filter-section:nth-child(2) { animation-delay: 0.2s; }
        .filter-section:nth-child(3) { animation-delay: 0.3s; }

        /* Pagination Styles */
        .pagination-container {
          margin-top: 2rem;
        }

        .pagination {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
        }

        .pagination-btn {
          min-width: 40px;
          height: 40px;
          padding: 0.5rem;
          border: 1px solid #e5e7eb;
          background-color: white;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #1a1a1a;
          font-weight: 500;
        }

        .pagination-btn:hover:not(.disabled) {
          background-color: #f0f7ff;
          border-color: #0d6efd;
          color: #0d6efd;
          transform: translateY(-2px);
        }

        .pagination-btn.active {
          background-color: #0d6efd;
          border-color: #0d6efd;
          color: white;
        }

        .pagination-btn.disabled {
          opacity: 0.5;
          cursor: not-allowed;
          pointer-events: none;
        }

        .pagination-btn i {
          font-size: 1.2rem;
        }

        @media (max-width: 576px) {
          .pagination-btn {
            min-width: 36px;
            height: 36px;
            padding: 0.25rem;
          }
        }
      `}</style>
    </>
  );
};

export default EventsPage;
