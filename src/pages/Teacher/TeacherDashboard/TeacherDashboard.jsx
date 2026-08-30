import { useEffect, useMemo, useState } from "react";
import {
  getNotices,
  getCalendarDates,
  getTasks,
  getTeacherAttendanceRecords,
  updateTask,
} from "../../../services/api";
import { StatsCard } from "../../../components/StatsCard/StatsCard";
import { NoticeCard } from "../../../components/NoticeCard/NoticeCard";
import { EventCard } from "../../../components/EventCard/EventCard";
import EmptyState from "../../../components/EmptyState/EmptyState";
import { LoadingSpinner } from "../../../components/LoadingSpinner/LoadingSpinner";
import { useNavigate } from "react-router-dom";
import "./TeacherDashboard.css";

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [notices, setNotices] = useState([]);
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [attendanceStatus, setAttendanceStatus] = useState("Not marked");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const teacher = useMemo(
    () => JSON.parse(localStorage.getItem("teacherData")) || {},
    []
  );

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      setError("");
      try {
        const [noticesData, eventsData, tasksData, attendanceData] = await Promise.all([
          getNotices(),
          getCalendarDates(),
          getTasks(),
          getTeacherAttendanceRecords(teacher.teacherID),
        ]);

        setNotices(noticesData || []);
        setEvents(eventsData || []);
        setTasks(
          (tasksData || []).filter(
            (t) =>
              t.assignedTo === teacher.fullName ||
              t.assignedTeacherId === teacher.teacherID
          )
        );

        // Check localStorage first for manually marked attendance (priority)
        const today = new Date().toDateString();
        const storedDate = localStorage.getItem("attendanceMarkedDate");
        const storedStatus = localStorage.getItem("attendanceStatus");

        if (storedDate === today && storedStatus) {
          // Teacher manually marked attendance
          setAttendanceStatus(storedStatus);
        } else {
          // No manual marking - show "Not marked" (ignore backend auto-absent)
          setAttendanceStatus("Not marked");
        }
      } catch (fetchError) {
        setError(fetchError.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [teacher.fullName, teacher.teacherID]);

  const upcomingEvents = useMemo(() => {
    const today = new Date();
    return (events || [])
      .filter((item) => new Date(item.eventDate) >= today)
      .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate))
      .slice(0, 3);
  }, [events]);

  const recentNotices = useMemo(() => (notices || []).slice(0, 3), [notices]);

  const pendingTasks = useMemo(
    () => tasks.filter((t) => t.status !== "Completed"),
    [tasks]
  );

  const stats = {
    assignedTasks: tasks.length,
    pendingTasks: pendingTasks.length,
    completedTasks: tasks.filter((t) => t.status === "Completed").length,
    totalNotices: notices.length,
  };

  const attendanceStatusClass = attendanceStatus === "Present"
    ? "status-present"
    : attendanceStatus === "Absent"
    ? "status-absent"
    : "status-not-marked";

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <section className="dashboard-page teacher-dashboard">
      {loading ? (
        <div className="dashboard-page__status card">
          <LoadingSpinner />
          <span>Loading dashboard...</span>
        </div>
      ) : error ? (
        <div className="dashboard-page__status card dashboard-page__error">
          <h2>Unable to load dashboard</h2>
          <p>{error}</p>
        </div>
      ) : (
        <>
          <div className="dashboard-page__hero card">
            <div className="dashboard-page__hero-copy">
              <span className="dashboard-page__hero-chip">Today</span>
              <h1>🌟 Welcome back, {teacher.fullName || "Teacher"}</h1>
              <p>Your attendance status, assigned tasks, and upcoming events all in one place.</p>
            </div>
            <div className="dashboard-page__hero-date">
              <p>Dashboard snapshot</p>
              <strong>{todayLabel}</strong>
            </div>
          </div>

          <div className="dashboard-page__top">
            <div className="dashboard-page__stats-area">
              <div className="dashboard-page__stats">
                <StatsCard
                  label="Today's Attendance"
                  value={
                    <span className={`attendance-status-badge ${attendanceStatusClass}`}>
                      {attendanceStatus === "Present" && "✅ Present"}
                      {attendanceStatus === "Absent" && "❌ Absent"}
                      {attendanceStatus === "Not marked" && "⏳ Not Marked"}
                    </span>
                  }
                />
                <StatsCard
                  label="📋 Assigned Tasks"
                  value={stats.assignedTasks}
                />
                <StatsCard
                  label="⏳ Pending Tasks"
                  value={stats.pendingTasks}
                />
              </div>

              <section className="dashboard-panel card dashboard-page__notice-panel quick-actions">
                <div className="dashboard-panel__header">
                  <h3>⚡ Quick Actions</h3>
                </div>
                <div className="quick-actions__buttons">
                  <button
                    className="quick-action-btn"
                    onClick={() => navigate("/teacher/attendance")}
                  >
                    📍 Mark Attendance
                  </button>
                  <button
                    className="quick-action-btn"
                    onClick={() => navigate("/teacher/tasks")}
                  >
                    ✅ My Tasks
                  </button>
                  <button
                    className="quick-action-btn"
                    onClick={() => navigate("/teacher/notices")}
                  >
                    📢 Notices
                  </button>
                  <button
                    className="quick-action-btn"
                    onClick={() => navigate("/teacher/calendar")}
                  >
                    📅 Calendar
                  </button>
                </div>
              </section>
            </div>

            <section className="dashboard-panel card dashboard-page__notice-panel">
              <div className="dashboard-panel__header">
                <h3>📢 Latest Notices</h3>
              </div>
              {recentNotices.length > 0 ? (
                <div className="dashboard-panel__list">
                  {recentNotices.map((notice) => (
                    <NoticeCard
                      key={notice._id || notice.title}
                      notice={notice}
                      hideActions={true}
                    />
                  ))}
                </div>
              ) : (
                <p className="dashboard-panel__empty">No notices available.</p>
              )}
            </section>
          </div>

          {/* Upcoming Events */}
          {upcomingEvents.length > 0 && (
            <section className="dashboard-page__section card">
              <div className="dashboard-page__section-header">
                <h3>📅 Upcoming Events</h3>
              </div>
              <div className="dashboard-page__events">
                {upcomingEvents.map((event) => (
                  <EventCard key={event._id} event={event} />
                ))}
              </div>
            </section>
          )}

          {/* Pending Tasks */}
          {pendingTasks.length > 0 && (
            <section className="dashboard-page__section card">
              <div className="dashboard-page__section-header">
                <h3>✅ Pending Tasks</h3>
              </div>
              <div className="pending-tasks-list">
                {pendingTasks.slice(0, 4).map((task) => (
                  <div key={task._id} className="pending-task-item">
                    <div className="pending-task-info">
                      <p className="pending-task-title">{task.title}</p>
                      <p className="pending-task-desc">{task.description}</p>
                    </div>
                    <div className="pending-task-deadline">
                      {task.deadline
                        ? new Date(task.deadline).toLocaleDateString()
                        : "No deadline"}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </section>
  );
}
