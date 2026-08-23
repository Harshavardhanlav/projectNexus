import { NavLink } from "react-router-dom";
import "./Sidebar.css";

const menuItems = [
  { label: "Dashboard", path: "/", icon: "🏠" },
  { label: "Teacher Management", path: "/teachers", icon: "👨‍🏫" },
  { label: "Mark Attendance", path: "/attendance", icon: "🖐️" },
  { label: "Reports", path: "/attendance-reports", icon: "📊" },
  { label: "Calendar", path: "/calendar", icon: "📅" },
  { label: "Notices", path: "/notices", icon: "📢" },
  { label: "Tasks", path: "/tasks", icon: "✅" },
  { label: "Activity Logs", path: "/activity-logs", icon: "📝" },
  { label: "Settings", path: "/settings", icon: "⚙️" },
];

export function Sidebar({ isOpen = false, onNavigate }) {
  const handleLogout = () => {
  // Clear everything related to authentication
  localStorage.clear(); 
  
  // Use replace to ensure the history stack is cleared completely
  window.location.replace("/");
};

  return (
    <aside className={`sidebar ${isOpen ? "sidebar--open" : ""}`}>
      <div className="sidebar__brand">
        <span className="sidebar__logo">
    <i style={{ fontStyle: "normal", marginRight: "8px", verticalAlign: "middle" }}>🎓</i>
    NEXUS
  </span>
  <h4>Teacher Management</h4>
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
            {/* 🌟 Hardcoded style wrapper to force emojis to display inline with proper layout dimensions */}
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