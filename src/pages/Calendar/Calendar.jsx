import { useEffect, useMemo, useRef, useState } from "react";
import {
  createCalendarDate,
  getCalendarDates,
  updateCalendarDate,
  deleteCalendarDate
} from "../../services/api";
import { LoadingSpinner } from "../../components/LoadingSpinner/LoadingSpinner";
import { ConfirmModal } from "../../components/ConfirmModal/ConfirmModal";
import "./Calendar.css";

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function CalendarSelect({ value, options, onChange, ariaLabel }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);
  const selectedOption = options.find((option) => String(option.value) === String(value));

  useEffect(() => {
    function closeSelect(event) {
      if (!selectRef.current?.contains(event.target)) setIsOpen(false);
    }

    function closeOnEscape(event) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("mousedown", closeSelect);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeSelect);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <div className={`calendar-select ${isOpen ? "calendar-select--open" : ""}`} ref={selectRef}>
      <button
        type="button"
        className="calendar-select__trigger"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span>{selectedOption?.label || "Select an option"}</span>
        <span className="calendar-select__chevron" aria-hidden="true">⌄</span>
      </button>
      {isOpen && (
        <div className="calendar-select__menu" role="listbox" aria-label={ariaLabel}>
          {options.map((option) => (
            <button
              type="button"
              role="option"
              aria-selected={String(option.value) === String(value)}
              className={`calendar-select__option ${String(option.value) === String(value) ? "calendar-select__option--selected" : ""}`}
              key={String(option.value)}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Contextual Event Emoji Determiner
const getEventEmoji = (eventTitle) => {
  if (!eventTitle) return '📅';
  const title = eventTitle.toLowerCase();
  if (title.includes('exam') || title.includes('test')) return '📝';
  if (title.includes('sports') || title.includes('games')) return '🏆';
  if (title.includes('meeting') || title.includes('staff')) return '🤝';
  if (title.includes('fair') || title.includes('science')) return '🚀';
  return '📢';
};

export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const formRef = useRef(null);

  const toDateOnlyISOString = (date) => {
    const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0));
    return utcDate.toISOString();
  };

  const getLocalDate = (dateString) => {
    const date = new Date(dateString);
    return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  };
  const [form, setForm] = useState({ title: "", description: "", dayType: "Working", hasEvent: false });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!panelOpen) return undefined;

    const frameId = window.requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [panelOpen, selectedDate]);

  useEffect(() => {
    loadCalendar();
  }, []);

async function loadCalendar() {

  setLoading(true);

  setError("");

  try {

    const data = await getCalendarDates();

    console.log("Calendar Data:", data);

    setEvents(data || []);

  } catch (fetchError) {

    setError(fetchError.message);

  } finally {

    setLoading(false);

  }

}

  const firstDayOfMonth = useMemo(
    () => new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
    [currentDate]
  );

  const currentMonthLabel = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  const calendarDays = useMemo(() => {
    const days = [];
    const totalDays = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const startWeekday = firstDayOfMonth.getDay();

    for (let blank = 0; blank < startWeekday; blank++) {
      days.push({ empty: true, key: `blank-${blank}` });
    }

    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const record = events.find(
        (item) => getLocalDate(item.eventDate).toDateString() === date.toDateString()
      );
      days.push({ day, date, record, empty: false, key: date.toISOString() });
    }

    return days;
  }, [currentDate, events, firstDayOfMonth]);

function openDatePanel(date, record) {

  setSelectedDate(date);

  setSelectedRecord(record || null);

  setForm({
    title: record?.title || "",
    description: record?.description || "",
    dayType: record?.dayType || "Working",
    hasEvent: true
  });

  setPanelOpen(true);

}

  function handleNavigation(offset) {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  }

  function handleMonthChange(valueOrEvent) {
    const monthIndex = Number(typeof valueOrEvent === "object" ? valueOrEvent.target.value : valueOrEvent);
    setCurrentDate((prev) => new Date(prev.getFullYear(), monthIndex, 1));
  }

  function handleYearChange(event) {
    const yearValue = Number(event.target.value);
    setCurrentDate((prev) => new Date(yearValue, prev.getMonth(), 1));
  }

  function handleInputChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

async function saveEvent() {

  setMessage("");
  setSaving(true);

  try {

    const payload = {
      title: form.title,
      description: form.description,
      eventDate: toDateOnlyISOString(selectedDate),
      dayType: form.dayType,

      // Always mark event as existing
      hasEvent: true,
    };

    if (selectedRecord) {

      await updateCalendarDate(
        selectedRecord._id,
        payload
      );

    } else {

      await createCalendarDate(payload);

    }

    await loadCalendar();

    setPanelOpen(false);

    setSelectedRecord(null);

  } catch (submitError) {

    setMessage(submitError.message);

  } finally {

    setSaving(false);

  }

}

  async function confirmDeleteEvent() {
    if (!selectedRecord) {
      setPanelOpen(false);
      return;
    }
    setSaving(true);
    try {
await deleteCalendarDate(
   selectedRecord._id
);
      await loadCalendar();
      setConfirmDelete(false);
      setPanelOpen(false);
    } catch (deleteError) {
      setMessage(deleteError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="calendar-page">
      <div className="calendar-page__header card">
        <div className="page-header-block">
          <span className="calendar-page__eyebrow">NEXUS WORKSPACE</span>
          <h1>Calendar</h1>
          <p>Manage school events and working days.</p>
        </div>
      </div>

      <div className="calendar-page__toolbar card">
        <div className="calendar-page__jump">
          <label>
            Month
            <CalendarSelect
              value={currentDate.getMonth()}
              ariaLabel="Select calendar month"
              onChange={handleMonthChange}
              options={monthNames.map((name, index) => ({ value: index, label: name }))}
            />
          </label>
          <label>
            Year
            <input type="number" value={currentDate.getFullYear()} onChange={handleYearChange} min="2020" />
          </label>
        </div>
        <div className="calendar-page__toolbar-actions">
          <div className="calendar-page__selected-month">{currentMonthLabel}</div>
          <button type="button" className="secondary" onClick={() => handleNavigation(-1)}>
            Previous Month
          </button>
          <button type="button" className="secondary" onClick={() => handleNavigation(1)}>
            Next Month
          </button>
        </div>
      </div>

      {loading ? (
        <div className="calendar-page__loading">
          <LoadingSpinner />
          <span>Loading calendar dates...</span>
        </div>
      ) : error ? (
        <div className="calendar-page__error card">
          <h2>Unable to load calendar</h2>
          <p>{error}</p>
        </div>
      ) : (
        <div className="calendar-grid card">
          <div className="calendar-grid__header">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((weekday) => (
              <div key={weekday} className="calendar-grid__weekday">
                {weekday}
              </div>
            ))}
          </div>
          <div className="calendar-grid__body">
            {calendarDays.map((cell) => {
              const isSunday = cell.date?.getDay() === 0;
              const isHoliday = cell.record?.dayType === "Holiday";
              const isWorking = cell.record?.dayType === "Working" || (!cell.empty && !isHoliday);
              const hasEvent = cell.record?.hasEvent;

              const cellClasses = [
                "calendar-grid__cell",
                cell.empty ? "calendar-grid__cell--empty" : "",
                isSunday ? "calendar-grid__cell--sunday" : "",
                isHoliday ? "calendar-grid__cell--holiday" : "",
                isWorking ? "calendar-grid__cell--working" : "",
                selectedDate && cell.date?.toDateString() === selectedDate.toDateString() ? "calendar-grid__cell--selected" : "",
                hasEvent ? "calendar-grid__cell--event" : ""
              ].filter(Boolean).join(" ");

              return (
                <button
                  key={cell.key}
                  type="button"
                  className={cellClasses}
                  disabled={cell.empty}
                  onClick={() => cell.date && openDatePanel(cell.date, cell.record)}
                >
                  {!cell.empty && (
                    <>
                      <div className="calendar-grid__cell-top">
                        <span>{cell.day}</span>
                        {hasEvent && (
                          <span className="calendar-grid__event-emoji" title={cell.record.title}>
                            {getEventEmoji(cell.record.title)}
                          </span>
                        )}
                      </div>
                      {hasEvent && <div className="calendar-grid__event-dot"></div>}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Keep the selected-date editor in the normal Calendar document flow. */}
      {panelOpen && (
        <section ref={formRef} className="calendar-event-form card" aria-labelledby="calendar-event-form-title">
          <div className="calendar-event-form__header">
            <div>
              <span className="calendar-event-form__eyebrow">SELECTED DATE</span>
              <h2 id="calendar-event-form-title">{selectedDate ? selectedDate.toLocaleDateString("en-US", { dateStyle: "long" }) : "Manage Date"}</h2>
            </div>
            {selectedRecord && <span className="calendar-event-form__existing">Existing event</span>}
          </div>
          <div className="calendar-event-form__fields">
            <label>
              Event Title
              <input type="text" name="title" value={form.title} onChange={handleInputChange} required />
            </label>
            <label>
              Description
              <textarea name="description" value={form.description} onChange={handleInputChange} />
            </label>
            <label>
              Day Type
              <CalendarSelect
                value={form.dayType}
                ariaLabel="Select day type"
                onChange={(value) => handleInputChange({ target: { name: "dayType", value, type: "select-one" } })}
                options={[
                  { value: "Working", label: "Working Day" },
                  { value: "Holiday", label: "Holiday" },
                ]}
              />
            </label>
          </div>
          {message && <p className="calendar-event-form__message">{message}</p>}
          <div className="calendar-event-form__actions">
            {selectedRecord && (
              <button type="button" className="secondary delete-btn" onClick={() => setConfirmDelete(true)}>
                Delete Event
              </button>
            )}
            <button type="button" className="secondary" onClick={() => setPanelOpen(false)}>Cancel</button>
            <button type="button" className="primary" onClick={saveEvent} disabled={saving}>
              {saving ? "Saving..." : "Save Event"}
            </button>
          </div>
        </section>
      )}

      {confirmDelete && (
        <ConfirmModal
          title="Clear Event Configuration?"
          message="Are you sure you want to clear this scheduled event layout record details from your tracking ledger?"
          onConfirm={confirmDeleteEvent}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </section>
  );
}