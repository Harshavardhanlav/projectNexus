import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getDashboardSummary,
  getTodayAttendanceSummary,
  getNotices,
  getCalendarDates,
  getActivityLogs,
} from "../../services/api";
import { StatsCard } from "../../components/StatsCard/StatsCard";
import { AttendanceChart } from "../../components/AttendanceChart/AttendanceChart";
import { NoticeCard } from "../../components/NoticeCard/dNoticeCard";
import { EventCard } from "../../components/EventCard/EventCard";
import  EmptyState from "../../components/EmptyState/EmptyState";
import { LoadingSpinner } from "../../components/LoadingSpinner/LoadingSpinner";
import { QuickActions } from "../../components/QuickActions/QuickActions";
import "./Dashboard.css";
export default function Dashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [notices, setNotices] = useState([]);
  const [events, setEvents] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      setError("");
      try {
        const [dashboardData, attendanceData, noticesData, calendarData, activityData] = await Promise.all([
          getDashboardSummary(),
          getTodayAttendanceSummary(),
          getNotices(),
          getCalendarDates(),
          getActivityLogs(),
        ]);

        setSummary(dashboardData);
        setAttendanceSummary(attendanceData);
        setNotices(noticesData || []);
        setEvents(calendarData || []);
        setActivity(activityData || []);
      } catch (fetchError) {
        setError(fetchError.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const upcomingEvents = useMemo(() => {
    const today = new Date();
    return (events || [])
      .filter((item) => new Date(item.eventDate) >= today)
      .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate))
      .slice(0, 3);
  }, [events]);

  const recentNotices = useMemo(() => (notices || []).slice(0, 3), [notices]);
  const recentActivities = useMemo(() => (activity || []).slice(0, 4), [activity]);

  const isEmptyDashboard = useMemo(
    () =>
      !loading &&
      summary &&
      summary.teacherCount === 0 &&
      summary.noticeCount === 0 &&
      summary.pendingTasks === 0,
    [loading, summary]
  );

  const chartData = [
    { name: "Present", value: attendanceSummary?.present || 0 },
    { name: "Absent", value: attendanceSummary?.absent || 0 },
    { name: "Attendance %", value: attendanceSummary?.percentage || 0 },
  ];

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <section className="dashboard-page">
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
      ) : isEmptyDashboard ? (
        <EmptyState
          title="Welcome to NEXUS"
          message="No teachers added yet. No notices created. No tasks assigned. Create your first record to get started."
        />
      ) : (
        <>
          <div className="dashboard-page__hero card">
            <div className="dashboard-page__hero-copy">
              <span className="dashboard-page__hero-chip">Today</span>
              <h1>🌟Welcome back</h1>
              <p>Live school metrics, attendance insights, and upcoming event summaries all in one place.</p>
            </div>
            <div className="dashboard-page__hero-date">
              <p>Dashboard snapshot</p>
              <strong>{todayLabel}</strong>
            </div>
          </div>

          <div className="dashboard-page__top">
<div className="dashboard-page__stats-area">
  <div className="dashboard-page__stats">
    <StatsCard label="👨‍🏫Total Teachers" value={summary?.teacherCount ?? 0} />
    <StatsCard label="📊Attendance" value={`${attendanceSummary?.percentage ?? 0}%`} />
    <StatsCard label="📋Pending Tasks" value={summary?.pendingTasks ?? 0} />
  </div>

  <QuickActions />
</div>

            <section className="dashboard-panel card dashboard-page__notice-panel card46">
              <div className="dashboard-panel__header">
                <h3>Recent Notices</h3>
              </div>
              {recentNotices.length > 0 ? (
                <div className="dashboard-panel__list">
                  {recentNotices.map((notice) => (
                    <NoticeCard
                      key={notice._id || notice.title}
                      notice={notice}
                      onEdit={() => {}}
                      onDelete={() => {}}
                    />
                  ))}
                </div>
              ) : (
                <p className="dashboard-panel__empty">No notices available.</p>
              )}
            </section>
          </div>

          <div className="dashboard-page__grid">
            <AttendanceChart data={chartData} />

            <div className="dashboard-page__panels">
              <section className="dashboard-panel card card23">
                <div className="dashboard-panel__header">
                  <h3>Upcoming Events</h3>
                </div>
                {upcomingEvents.length > 0 ? (
<div className="dashboard-panel__list">
  {upcomingEvents.map((event) => (
    <div
      key={event._id || event.eventDate}
      className="dashboard-event-item"
    >

      <span
        className={`event-status ${
          event.eventType === "Holiday"
            ? "event-status-holiday"
            : "event-status-working"
        }`}
      >
        {event.eventType}
      </span>

      <EventCard
        event={event}
        onClick={() => navigate("/calendar")}
      />

    </div>
  ))}
</div>
                ) : (
                  <p className="dashboard-panel__empty">No upcoming events scheduled.</p>
                )}
              </section>

            </div>
          </div>
        </>
      )}
    </section>
  );
}
