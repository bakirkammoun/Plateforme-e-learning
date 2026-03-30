import React, { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventInput, DateSelectArg, EventClickArg } from '@fullcalendar/core';
import { Modal } from "../components/ui/modal";
import { useModal } from "../hooks/useModal";
import PageMeta from "../components/common/PageMeta";
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface ExtendedProps {
  level: string;
  location: string;
  description: string;
  maxParticipants: number;
  startTime: string;
  endTime: string;
  image?: string;
}

interface CalendarEvent extends EventInput {
  extendedProps: ExtendedProps;
  id: string;
  title: string;
  start: string;
  end: string;
}

const eventIcons: { [key: string]: string } = {
  Primary: "🎯",
  Success: "✅",
  Danger: "⚠️",
  Warning: "📅"
};

const Calendar: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [eventTitle, setEventTitle] = useState<string>("");
  const [eventStartDate, setEventStartDate] = useState<string>("");
  const [eventEndDate, setEventEndDate] = useState<string>("");
  const [eventLevel, setEventLevel] = useState<string>("");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [eventImage, setEventImage] = useState<File | null>(null);
  const [eventStartTime, setEventStartTime] = useState<string>("");
  const [eventEndTime, setEventEndTime] = useState<string>("");
  const [eventLocation, setEventLocation] = useState<string>("");
  const [eventDescription, setEventDescription] = useState<string>("");
  const [eventMaxParticipants, setEventMaxParticipants] = useState<number>(0);
  const calendarRef = useRef<FullCalendar>(null);
  const { isOpen, openModal, closeModal } = useModal();

  const calendarsEvents = {
    Danger: "danger",
    Success: "success",
    Primary: "primary",
    Warning: "warning",
  };

  const eventImages: { [key: string]: string } = {
    Danger: "/images/danger.png",
    Success: "/images/success.png",
    Primary: "/images/primary.png",
    Warning: "/images/warning.png",
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/events');
      console.log('Events received:', response.data);

      const formattedEvents = response.data.map((event: any) => {
        const startDateTime = new Date(event.startDate);
        startDateTime.setHours(
          parseInt(event.startTime.split(':')[0]),
          parseInt(event.startTime.split(':')[1])
        );

        const endDateTime = new Date(event.endDate);
        endDateTime.setHours(
          parseInt(event.endTime.split(':')[0]),
          parseInt(event.endTime.split(':')[1])
        );

        return {
          id: event._id,
          title: event.title,
          start: startDateTime.toISOString(),
          end: endDateTime.toISOString(),
          backgroundColor: getEventColor(event.color),
          borderColor: getEventColor(event.color),
          allDay: false,
          extendedProps: {
            calendar: event.color,
            location: event.location,
            description: event.description,
            maxParticipants: event.maxParticipants,
            imageUrl: event.image,
            startTime: event.startTime,
            endTime: event.endTime
          }
        };
      });

      console.log('Setting events:', formattedEvents);
      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Error loading events');
    }
  };

  const getEventColor = (color: string): string => {
    const colors: Record<string, string> = {
      Primary: '#3b82f6',
      Success: '#22c55e',
      Danger: '#ef4444',
      Warning: '#f59e0b'
    };
    return colors[color] || colors.Primary;
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(selectInfo.startStr);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      toast.error("Impossible de créer un événement dans le passé", {
        position: "center-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
      return;
    }

    resetModalFields();
    setEventStartDate(selectInfo.startStr);
    setEventEndDate(selectInfo.endStr || selectInfo.startStr);
    openModal();
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = clickInfo.event;
    setSelectedEvent(event as unknown as CalendarEvent);
    setEventTitle(event.title);
    setEventStartDate(event.start?.toISOString().split("T")[0] || "");
    setEventEndDate(event.end?.toISOString().split("T")[0] || "");
    setEventLevel(event.extendedProps.calendar);
    openModal();
  };

  const handleAddOrUpdateEvent = async () => {
    try {
      const eventData: Partial<CalendarEvent> = {
        title: eventTitle,
        start: `${eventStartDate}T${eventStartTime}`,
        end: `${eventEndDate}T${eventEndTime}`,
        extendedProps: {
          level: eventLevel,
          location: eventLocation,
          description: eventDescription,
          maxParticipants: eventMaxParticipants,
          startTime: eventStartTime,
          endTime: eventEndTime
        }
      };

      if (selectedEvent) {
        // Update existing event
        const formData = new FormData();
        Object.entries(eventData).forEach(([key, value]) => {
          if (key === 'extendedProps') {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, String(value));
          }
        });

        if (eventImage) {
          formData.append('image', eventImage);
        }

        const response = await axios.put(
          `http://localhost:5000/api/events/${selectedEvent.id}`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        if (response.status === 200) {
          const updatedEvent: CalendarEvent = {
            ...selectedEvent,
            ...eventData,
            extendedProps: {
              ...selectedEvent.extendedProps,
              ...eventData.extendedProps,
              image: response.data.image || selectedEvent.extendedProps.image
            }
          };

          setEvents(prevEvents => 
            prevEvents.map(event => 
              event.id === selectedEvent.id ? updatedEvent : event
            )
          );
          toast.success('Event updated successfully');
        }
      } else {
        // Create new event
        const formData = new FormData();
        Object.entries(eventData).forEach(([key, value]) => {
          if (key === 'extendedProps') {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, String(value));
          }
        });

        if (eventImage) {
          formData.append('image', eventImage);
        }

        const response = await axios.post(
          'http://localhost:5000/api/events',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        if (response.status === 201) {
          const newEvent: CalendarEvent = {
            ...response.data,
            extendedProps: {
              level: eventLevel,
              location: eventLocation,
              description: eventDescription,
              maxParticipants: eventMaxParticipants,
              startTime: eventStartTime,
              endTime: eventEndTime,
              image: response.data.image
            }
          };
          setEvents(prevEvents => [...prevEvents, newEvent]);
          toast.success('Event created successfully');
        }
      }
      closeModal();
      resetModalFields();
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred while saving the event');
    }
  };

  const resetModalFields = () => {
    setEventTitle("");
    setEventStartDate("");
    setEventEndDate("");
    setEventLevel("");
    setSelectedEvent(null);
    setEventImage(null);
    setEventStartTime("");
    setEventEndTime("");
    setEventLocation("");
    setEventDescription("");
    setEventMaxParticipants(0);
  };

  const handleDeleteEvent = async (event: CalendarEvent) => {
    try {
      // Demander confirmation avant de supprimer
      if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
        return;
      }

      // Supprimer l'événement de l'API
      const response = await axios.delete(`http://localhost:5000/api/events/${event.id}`);
      
      if (response.status === 200) {
        // Mettre à jour l'état local
        setEvents((prevEvents) => prevEvents.filter((e) => e.id !== event.id));
        
        // Afficher une notification de succès
        toast.success('Événement supprimé avec succès');
        
        // Fermer le modal
        closeModal();
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression de l\'événement');
    }
  };

  const renderEventContent = (eventInfo: any) => {
    const colorClass = `fc-bg-${eventInfo.event.extendedProps.calendar.toLowerCase()}`;
    const imageUrl = eventInfo.event.extendedProps.imageUrl;
    const eventIcon = eventIcons[eventInfo.event.extendedProps.calendar] || "📅";
    const isDangerOrWarning = eventInfo.event.extendedProps.calendar === 'Danger' || 
                             eventInfo.event.extendedProps.calendar === 'Warning';

    return (
      <div className={`event-fc-color flex fc-event-main ${colorClass} p-1 rounded ${
        isDangerOrWarning ? 'border-2 border-white' : ''
      }`}>
        <span className="text-lg mr-2">{eventIcon}</span>
        <div className="flex flex-col">
          <div className="fc-event-time text-xs opacity-75">{eventInfo.timeText}</div>
          <div className="fc-event-title font-medium">{eventInfo.event.title}</div>
        </div>
      </div>
    );
  };

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      
      <PageMeta
        title="React.js Calendar Dashboard | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Calendar Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] shadow-lg">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Event Calendar</h2>
            <button
              onClick={openModal}
              className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              <span className="text-xl">+</span>
              Add New Event
            </button>
          </div>
          <div className="custom-calendar">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay",
              }}
              events={events}
              selectable={true}
              select={handleDateSelect}
              eventClick={handleEventClick}
              eventContent={renderEventContent}
              height="auto"
              dayMaxEvents={true}
              eventDidMount={(info) => {
                console.log('Event mounted:', info.event);
              }}
              buttonText={{
                today: 'Today',
                month: 'Month',
                week: 'Week',
                day: 'Day'
              }}
              buttonIcons={{
                prev: 'chevron-left',
                next: 'chevron-right',
                today: 'calendar-check'
              }}
            />
          </div>
        </div>

        <Modal
          isOpen={isOpen}
          onClose={closeModal}
          className="max-w-[700px] p-6 lg:p-10"
        >
          <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-100 flex items-center justify-center">
                <span className="text-2xl">
                  {selectedEvent ? eventIcons[eventLevel] || "📝" : "✨"}
                </span>
              </div>
              <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
                {selectedEvent ? "Edit Event" : "Add New Event"}
              </h5>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Plan your next big moment: schedule or edit an event to stay on track
              </p>
            </div>

            <div className="mt-8 space-y-6">
              {/* Title Input */}
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                  Event Title
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    📌
                  </span>
                  <input
                    id="event-title"
                    type="text"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    className="pl-10 dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    placeholder="Enter event title"
                  />
                </div>
              </div>

              {/* Color Selection */}
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                  Event Color
                </label>
                <div className="grid grid-cols-4 gap-4">
                  {Object.entries(calendarsEvents).map(([key, value]) => (
                    <button
                      key={key}
                      onClick={() => setEventLevel(key)}
                      className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all duration-300 ${
                        eventLevel === key
                          ? `border-${value}-500 bg-${value}-50`
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-xl">{eventIcons[key]}</span>
                      <span className="text-sm font-medium">{key}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date and Time Inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                    Start Date
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      📅
                    </span>
                    <input
                      id="event-start-date"
                      type="date"
                      value={eventStartDate}
                      onChange={(e) => setEventStartDate(e.target.value)}
                      className="pl-10 dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                    Start Time
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      ⏰
                    </span>
                    <input
                      id="event-start-time"
                      type="time"
                      value={eventStartTime}
                      onChange={(e) => setEventStartTime(e.target.value)}
                      className="pl-10 dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                    End Date
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      📅
                    </span>
                    <input
                      id="event-end-date"
                      type="date"
                      value={eventEndDate}
                      onChange={(e) => setEventEndDate(e.target.value)}
                      className="pl-10 dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                    End Time
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      ⏰
                    </span>
                    <input
                      id="event-end-time"
                      type="time"
                      value={eventEndTime}
                      onChange={(e) => setEventEndTime(e.target.value)}
                      className="pl-10 dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    />
                  </div>
                </div>
              </div>

              {/* Location Input */}
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                  Event Location
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    📍
                  </span>
                  <input
                    id="event-location"
                    type="text"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    className="pl-10 dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    placeholder="Enter event location"
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                  Event Image
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    🖼️
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setEventImage(e.target.files ? e.target.files[0] : null)}
                    className="pl-10 dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center gap-4 mt-8 modal-footer sm:justify-end">
              {selectedEvent ? (
                <>
                  <button
                    onClick={() => handleDeleteEvent(selectedEvent)}
                    type="button"
                    className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-red-500 text-sm font-medium text-white hover:bg-red-600 transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    <span>🗑️</span>
                    Supprimer l'événement
                  </button>
                  <button
                    onClick={handleAddOrUpdateEvent}
                    type="button"
                    className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-brand-500 text-sm font-medium text-white hover:bg-brand-600 transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    <span>✅</span>
                    Mettre à jour
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={closeModal}
                    type="button"
                    className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
                  >
                    <span>❌</span>
                    Cancel
                  </button>
                  <button
                    onClick={handleAddOrUpdateEvent}
                    type="button"
                    className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-brand-500 text-sm font-medium text-white hover:bg-brand-600 transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    <span>✅</span>
                    Create Event
                  </button>
                </>
              )}
            </div>
          </div>
        </Modal>
      </div>

      <style>{`
        .custom-calendar {
          background: white;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }

        .fc {
          background: white;
          border-radius: 16px;
          padding: 20px;
        }

        .fc-toolbar-title {
          font-size: 1.5rem !important;
          font-weight: 600 !important;
          color: #1f2937;
        }

        .fc-button {
          background-color: #f3f4f6 !important;
          border: 1px solid #e5e7eb !important;
          color: #4b5563 !important;
          padding: 0.5rem 1rem !important;
          border-radius: 0.5rem !important;
          font-weight: 500 !important;
          transition: all 0.3s ease !important;
        }

        .fc-button:hover {
          background-color: #e5e7eb !important;
          transform: translateY(-1px);
        }

        .fc-button-active {
          background-color: #3b82f6 !important;
          border-color: #3b82f6 !important;
          color: white !important;
        }

        .fc-event {
          border-radius: 8px !important;
          padding: 4px !important;
          border: none !important;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
        }

        .fc-event.fc-bg-danger,
        .fc-event.fc-bg-warning {
          border: 2px solid white !important;
        }

        .fc-event-title {
          font-weight: 500 !important;
        }

        .fc-day-today {
          background-color: #f3f4f6 !important;
        }

        .fc-highlight {
          background-color: #e5e7eb !important;
        }

        .fc-daygrid-day.fc-day-today {
          background-color: #f3f4f6 !important;
        }

        .fc-daygrid-day-number {
          font-weight: 500 !important;
        }

        .fc-col-header-cell {
          padding: 8px !important;
          font-weight: 600 !important;
          color: #4b5563 !important;
        }

        .fc-daygrid-day.fc-day-today .fc-daygrid-day-number {
          background-color: #3b82f6 !important;
          color: white !important;
          border-radius: 50% !important;
          width: 24px !important;
          height: 24px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }

        .fc-event-time {
          font-size: 0.875rem !important;
          opacity: 0.8 !important;
        }

        .fc-event-title {
          font-size: 0.875rem !important;
          font-weight: 500 !important;
        }

        .fc-daygrid-event {
          margin: 2px 0 !important;
        }

        .fc-daygrid-event-dot {
          display: none !important;
        }

        .fc-event-main {
          padding: 4px 8px !important;
        }

        .fc-event-main-frame {
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
        }

        .fc-event-time {
          margin-right: 8px !important;
        }

        .fc-event-title {
          flex-grow: 1 !important;
        }

        .fc-event {
          cursor: pointer !important;
          transition: all 0.3s ease !important;
        }

        .fc-event:hover {
          transform: translateY(-1px) !important;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1) !important;
        }

        @media (max-width: 768px) {
          .fc-toolbar {
            flex-direction: column !important;
            gap: 1rem !important;
          }

          .fc-toolbar-title {
            font-size: 1.25rem !important;
          }

          .fc-button {
            padding: 0.375rem 0.75rem !important;
            font-size: 0.875rem !important;
          }
        }
      `}</style>
    </>
  );
};

export default Calendar;
