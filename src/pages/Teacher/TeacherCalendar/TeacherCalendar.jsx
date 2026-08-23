import { useEffect, useState, useMemo } from "react";
import { getCalendarDates } from "../../../services/api";
import EmptyState from "../../../components/EmptyState/EmptyState";
import { LoadingSpinner } from "../../../components/LoadingSpinner/LoadingSpinner";
import "./TeacherCalendar.css";

export default function TeacherCalendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Helper function to parse date safely using local date values
  const getLocalDate = (dateString) => {
    const date = new Date(dateString);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  };

  useEffect(() => {
    fetchCalendar();
  }, []);

  async function fetchCalendar() {
    setLoading(true);
    setError("");
    try {
      const data = await getCalendarDates();
      setEvents(Array.isArray(data) ? data : []);
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  }

  const monthEvents = useMemo(() => {
    return events.filter((event) => {
      const eventDate = getLocalDate(event.eventDate);
      return (
        eventDate.getMonth() === currentMonth.getMonth() &&
        eventDate.getFullYear() === currentMonth.getFullYear()
      );
    });
  }, [events, currentMonth]);

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay();

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
  };

  const getEventsForDay = (day) => {
    const targetDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    
    return monthEvents.filter((event) => {
      const eventDate = getLocalDate(event.eventDate);
      // Compare by year, month, and day in local timezone
      return (
        eventDate.getFullYear() === targetDate.getFullYear() &&
        eventDate.getMonth() === targetDate.getMonth() &&
        eventDate.getDate() === targetDate.getDate()
      );
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDayTypeColor = (dayType) => {
    switch (dayType) {
      case "Holiday":
        return "#dc2626";
      case "Working":
        return "#16a34a";
      default:
        return "#6b7280";
    }
  };

  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <section className="teacher-calendar-page">
      <div className="teacher-calendar__container">
        {/* Header */}
        <div className="teacher-calendar__header card">
          <div className="teacher-calendar__header-content">
            <span className="teacher-calendar__eyebrow">NEXUS WORKSPACE</span>
            <h1>Calendar</h1>
            <p>View holidays, working days, and school events.</p>
          </div>
        </div>

        {loading ? (
          <div className="teacher-calendar__status card">
            <LoadingSpinner />
            <span>Loading calendar...</span>
          </div>
        ) : error ? (
          <div className="teacher-calendar__error card">
            <h3>⚠️ Error</h3>
            <p>{error}</p>
          </div>
        ) : (
          <>
            {/* Calendar */}
            <div className="teacher-calendar__wrapper card">
              <div className="calendar-header">
                <button className="calendar-nav-btn" onClick={handlePrevMonth}>
                  ❮
                </button>
                <h2 className="calendar-month">
                  {currentMonth.toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </h2>
                <button className="calendar-nav-btn" onClick={handleNextMonth}>
                  ❯
                </button>
              </div>

              <div className="calendar-weekdays">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="calendar-weekday">
                    {day}
                  </div>
                ))}
              </div>

              <div className="calendar-days">
                {calendarDays.map((day, index) => {
                  const dayEvents = day ? getEventsForDay(day) : [];
                  return (
                    <div
                      key={index}
                      className={`calendar-day ${!day ? "empty" : ""} ${
                        dayEvents.length > 0 ? "has-events" : ""
                      }`}
                      onClick={() => dayEvents.length > 0 && setSelectedEvent(dayEvents[0])}
                    >
                      {day && (
                        <>
                          <span className="calendar-day-number">{day}</span>
                          {dayEvents.length > 0 && (
                            <div className="calendar-day-events">
                              {dayEvents.map((event, idx) => (
                                <div
                                  key={event._id || idx}
                                  className="calendar-event-dot"
                                  style={{
                                    backgroundColor: getDayTypeColor(event.dayType),
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedEvent(event);
                                  }}
                                  title={event.title || event.dayType}
                                />
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="calendar-legend card">
              <div className="legend-item">
                <div
                  className="legend-dot"
                  style={{ backgroundColor: "#dc2626" }}
                />
                <span>Holiday</span>
              </div>
              <div className="legend-item">
                <div
                  className="legend-dot"
                  style={{ backgroundColor: "#16a34a" }}
                />
                <span>Working Day</span>
              </div>
            </div>

            {/* Events List */}
            {monthEvents.length > 0 ? (
              <div className="events-list card">
                <h3>📌 Events This Month</h3>
                <div className="events-items">
                  {monthEvents.map((event) => (
                    <div
                      key={event._id}
                      className="event-item"
                      onClick={() => setSelectedEvent(event)}
                    >
                      <div
                        className="event-color"
                        style={{ backgroundColor: getDayTypeColor(event.dayType) }}
                      />
                      <div className="event-content">
                        <p className="event-date">{formatDate(event.eventDate)}</p>
                        {event.title && <p className="event-title">{event.title}</p>}
                        <p className="event-type">{event.dayType}</p>
                        {event.description && <p className="event-desc">{event.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState
                title="No Events This Month"
                message="No holidays or special events scheduled for this month."
              />
            )}

            {/* Event Details Modal */}
            {selectedEvent && (
              <div
                className="event-modal-overlay"
                onClick={() => setSelectedEvent(null)}
              >
                <div className="event-modal card" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="modal-close"
                    onClick={() => setSelectedEvent(null)}
                  >
                    ✕
                  </button>
                  <div className="modal-content">
                    <div className="modal-header">
                      <h3 className="modal-title">{selectedEvent.title || selectedEvent.dayType}</h3>
                      <span 
                        className="modal-day-type"
                        style={{ backgroundColor: getDayTypeColor(selectedEvent.dayType) }}
                      >
                        {selectedEvent.dayType}
                      </span>
                    </div>
                    
                    <div className="modal-date-section">
                      <p className="modal-date">
                        {formatDate(selectedEvent.eventDate)}
                      </p>
                      <p className="modal-day">
                        {new Date(selectedEvent.eventDate).toLocaleDateString("en-US", { weekday: "long" })}
                      </p>
                    </div>

                    {selectedEvent.description && (
                      <div className="modal-description">
                        <span className="description-label">📝 Description:</span>
                        <p className="description-text">{selectedEvent.description}</p>
                      </div>
                    )}

                    <div className="modal-details">
                      <div className="detail-item">
                        <span className="detail-label">📅 Type:</span>
                        <span className="detail-value">{selectedEvent.dayType}</span>
                      </div>
                      {selectedEvent.createdBy && (
                        <div className="detail-item">
                          <span className="detail-label">👤 Created By:</span>
                          <span className="detail-value">{selectedEvent.createdBy}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
