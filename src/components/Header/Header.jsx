import "./Header.css";
import { useLocation } from "react-router-dom";

const pageTitles = {
  "/": ["Dashboard", "School operations overview"],
  "/teachers": ["Teacher Management", "People and access"],
  "/attendance": ["Attendance", "Daily presence tracking"],
  "/attendance-reports": ["Reports", "Monthly attendance performance"],
  "/calendar": ["Calendar", "Events and important dates"],
  "/notices": ["Notices", "Keep your community informed"],
  "/tasks": ["Tasks", "Assignments and follow-through"],
  "/activity-logs": ["Activity Logs", "A clear operational trail"],
  "/settings": ["Settings", "Workspace preferences"],
  "/teacher/dashboard": ["Dashboard", "Your teaching workspace"],
  "/teacher/attendance": ["Mark Attendance", "Record today's presence"],
  "/teacher/my-attendance": ["My Reports", "Your monthly attendance performance"],
  "/teacher/tasks": ["My Tasks", "Assigned work and deadlines"],
  "/teacher/notices": ["Notices", "Updates from your school"],
  "/teacher/calendar": ["Calendar", "Events and important dates"],
  "/teacher/profile": ["Profile", "Your professional details"],
  "/teacher/settings": ["Settings", "Account preferences"],
};

export function Header({ onMenuClick }) {
  const location = useLocation();
  const [title, description] = pageTitles[location.pathname] || pageTitles["/"];
  const isCalendarRoute = location.pathname === "/calendar" || location.pathname === "/teacher/calendar";
  const isNoticesRoute = location.pathname === "/notices" || location.pathname === "/teacher/notices";

  return (
    <header className={`page-header ${isCalendarRoute ? "page-header--calendar" : ""} ${isNoticesRoute ? "page-header--notices" : ""}`}>
      <button type="button" className="mobile-menu-button" onClick={onMenuClick} aria-label="Open navigation">
        ☰
      </button>
      {!isCalendarRoute && !isNoticesRoute && (
        <div className="page-header__copy">
          <p className="page-header__eyebrow">NEXUS WORKSPACE</p>
          <h1 className="page-header__title">{title}</h1>
          <p className="page-header__description">{description}</p>
        </div>
      )}
      {/* Theme toggle button has been removed */}
    </header>
  );
}