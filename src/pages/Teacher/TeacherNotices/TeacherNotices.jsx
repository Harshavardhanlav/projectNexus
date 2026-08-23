import { useEffect, useState, useMemo } from "react";
import { getNotices } from "../../../services/api";
import EmptyState from "../../../components/EmptyState/EmptyState";
import { LoadingSpinner } from "../../../components/LoadingSpinner/LoadingSpinner";
import "./TeacherNotices.css";

export default function TeacherNotices() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All");

  useEffect(() => {
    fetchNotices();
  }, []);

  async function fetchNotices() {
    setLoading(true);
    setError("");
    try {
      const data = await getNotices();
      setNotices(Array.isArray(data) ? data : []);
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  }

  // Filter notices based on priority and search
  const filteredNotices = useMemo(() => {
    let filtered = notices;

    if (priorityFilter !== "All") {
      filtered = filtered.filter((notice) => notice.priority === priorityFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (notice) =>
          notice.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          notice.message?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }, [notices, priorityFilter, searchTerm]);

  // Summary stats
  const stats = useMemo(() => {
    return {
      total: notices.length,
      high: notices.filter((n) => n.priority === "High").length,
      medium: notices.filter((n) => n.priority === "Medium").length,
      low: notices.filter((n) => n.priority === "Low").length,
    };
  }, [notices]);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "#dc2626";
      case "Medium":
        return "#ea580c";
      case "Low":
        return "#16a34a";
      default:
        return "#6b7280";
    }
  };

  return (
    <section className="teacher-notices-page">
      <div className="teacher-notices__container">
        {/* Header */}
        <div className="teacher-notices__header card">
          <div className="teacher-notices__header-content">
            <span className="teacher-notices__eyebrow">NEXUS WORKSPACE</span>
            <h1>Notices</h1>
            <p>Keep your community informed</p>
          </div>
        </div>

        {/* Stats Cards */}
        {!loading && (
          <div className="teacher-notices__stats">
            <div className="stat-card stat-card--total">
              <div className="stat-card__icon">📋</div>
              <div className="stat-card__content">
                <span className="stat-card__label">Total Notices</span>
                <span className="stat-card__value">{stats.total}</span>
              </div>
            </div>

            <div className="stat-card stat-card--high">
              <div className="stat-card__icon" style={{ color: "#dc2626" }}>
                ⚠️
              </div>
              <div className="stat-card__content">
                <span className="stat-card__label">High Priority</span>
                <span className="stat-card__value" style={{ color: "#dc2626" }}>
                  {stats.high}
                </span>
              </div>
            </div>

            <div className="stat-card stat-card--medium">
              <div className="stat-card__icon" style={{ color: "#ea580c" }}>
                ℹ️
              </div>
              <div className="stat-card__content">
                <span className="stat-card__label">Medium Priority</span>
                <span className="stat-card__value" style={{ color: "#ea580c" }}>
                  {stats.medium}
                </span>
              </div>
            </div>

            <div className="stat-card stat-card--low">
              <div className="stat-card__icon" style={{ color: "#16a34a" }}>
                ✓
              </div>
              <div className="stat-card__content">
                <span className="stat-card__label">Low Priority</span>
                <span className="stat-card__value" style={{ color: "#16a34a" }}>
                  {stats.low}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="teacher-notices__filters card">
          <div className="filter-group">
            <label className="filter-label">Filter by Priority</label>
            <div className="filter-buttons">
              {["All", "High", "Medium", "Low"].map((priority) => (
                <button
                  key={priority}
                  className={`filter-btn ${priorityFilter === priority ? "active" : ""}`}
                  style={
                    priority !== "All" && priorityFilter === priority
                      ? { borderColor: getPriorityColor(priority) }
                      : {}
                  }
                  onClick={() => setPriorityFilter(priority)}
                >
                  {priority}
                </button>
              ))}
            </div>
          </div>

          <div className="search-group">
            <input
              type="text"
              placeholder="🔍 Search notices..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="teacher-notices__status card">
            <LoadingSpinner />
            <span>Loading notices...</span>
          </div>
        ) : error ? (
          <div className="teacher-notices__error card">
            <h3>⚠️ Error</h3>
            <p>{error}</p>
          </div>
        ) : filteredNotices.length === 0 ? (
          <EmptyState
            title={priorityFilter === "All" ? "No Notices" : `No ${priorityFilter} Priority Notices`}
            message="No notices available at the moment."
          />
        ) : (
          <div className="teacher-notices__list">
            {filteredNotices.map((notice) => (
              <div key={notice._id} className="notice-item card">
                <div className="notice-item__header">
                  <div className="notice-item__title-section">
                    <h3 className="notice-item__title">{notice.title}</h3>
                    <span
                      className={`priority-badge priority-${notice.priority?.toLowerCase()}`}
                      style={{ borderLeftColor: getPriorityColor(notice.priority) }}
                    >
                      {notice.priority === "High" && "🔴"}
                      {notice.priority === "Medium" && "🟠"}
                      {notice.priority === "Low" && "🟢"}
                      {" "}
                      {notice.priority || "Medium"}
                    </span>
                  </div>
                  <div className="notice-item__date">
                    {new Date(notice.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </div>

                <div className="notice-item__message">
                  {notice.message}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Refresh Button */}
        {!loading && (
          <div className="teacher-notices__actions">
            <button className="refresh-btn" onClick={fetchNotices}>
              🔄 Refresh Notices
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
