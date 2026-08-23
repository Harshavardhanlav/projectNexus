import { NavLink } from "react-router-dom";
import "./TeacherSidebar.css";

const menuItems = [
  { label: "Dashboard", path: "/teacher/dashboard", icon: "🏠" },
  { label: "Mark Attendance", path: "/teacher/attendance", icon: "🖐️" },
  { label: "My Reports", path: "/teacher/my-attendance", icon: "📊" },
  { label: "My Tasks", path: "/teacher/tasks", icon: "✅" },
  { label: "Notices", path: "/teacher/notices", icon: "📢" },
  { label: "Calendar", path: "/teacher/calendar", icon: "📅" },
  { label: "Profile", path: "/teacher/profile", icon: "👤" },
  { label: "Settings", path: "/teacher/settings", icon: "⚙️" },
];

export function TeacherSidebar({ isOpen = false, onNavigate }) {
  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("teacherID");
    localStorage.removeItem("teacherName");
    localStorage.removeItem("teacherData");
    window.location.href = "/";
  };

  return (
    <aside className={`sidebar ${isOpen ? "sidebar--open" : ""}`}>
      <div className="sidebar__brand">
        <span className="sidebar__logo">
          <i style={{ fontStyle: "normal", marginRight: "8px", verticalAlign: "middle" }}>🎓</i>
          NEXUS
        </span>
        <h4>Teacher Portal</h4>
      </div>

      <nav className="sidebar__nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            onClick={onNavigate}
            className={({ isActive }) =>
              `sidebar__link ${isActive ? "sidebar__link--active" : ""}`
            }
          >
            <i style={{ fontStyle: "normal", marginRight: "12px", display: "inline-block" }}>
              {item.icon}
            </i>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div style={{ marginTop: "auto", paddingTop: "20px", borderTop: "1px solid #edf2f0" }}>
        <button
          type="button"
          onClick={handleLogout}
          style={{
            width: "100%",
            padding: "10px",
            backgroundColor: "#fee2e2",
            color: "#dc2626",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "14px"
          }}
        >
          🚪 Logout
        </button>
      </div>
    </aside>
  );
}
