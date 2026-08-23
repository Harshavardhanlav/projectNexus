import { useEffect, useState, useMemo } from "react";
import { LoadingSpinner } from "../../../components/LoadingSpinner/LoadingSpinner";
import EmptyState from "../../../components/EmptyState/EmptyState";
import "./TeacherMyAttendance.css";

export default function TeacherMyAttendance() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [searchDate, setSearchDate] = useState("");

  const teacher = JSON.parse(localStorage.getItem("teacherData")) || {};

  useEffect(() => {
    fetchAttendance();
  }, []);

  async function fetchAttendance() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `https://community-service-project-backend.onrender.com/attendance?teacherId=${teacher.teacherID}`
      );
      const data = await response.json();
      setAttendance(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Failed to load attendance records");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Filter attendance based on date range
  const filteredAttendance = useMemo(() => {
    let filtered = attendance;
    const now = new Date();

    if (filterType === "Today") {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      filtered = filtered.filter((record) => {
        const recordDate = new Date(record.attendanceDate);
        return recordDate >= today && recordDate < new Date(today.getTime() + 86400000);
      });
    } else if (filterType === "Week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(
        (record) => new Date(record.attendanceDate) >= weekAgo
      );
    } else if (filterType === "Month") {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(
        (record) => new Date(record.attendanceDate) >= monthAgo
      );
    }

    // Apply date search
    if (searchDate) {
      const searchDateObj = new Date(searchDate);
      filtered = filtered.filter((record) => {
        const recordDate = new Date(record.attendanceDate);
        return (
          recordDate.toDateString() === searchDateObj.toDateString()
        );
      });
    }

    return filtered.sort(
      (a, b) => new Date(b.attendanceDate) - new Date(a.attendanceDate)
    );
  }, [attendance, filterType, searchDate]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    const total = filteredAttendance.length;
    const present = filteredAttendance.filter(
      (record) => record.status === "Present"
    ).length;
    const absent = total - present;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    return { present, absent, total, percentage };
  }, [filteredAttendance]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <section className="my-attendance-page">
      <div className="my-attendance__container">
        {/* Header */}
        <div className="my-attendance__header card">
          <div className="my-attendance__header-content">
            <span className="my-attendance__eyebrow">NEXUS WORKSPACE</span>
            <h1>My Reports</h1>
            <p>View your monthly attendance performance and attendance history.</p>
          </div>
        </div>

        {/* Summary Cards */}
        {!loading && (
          <div className="my-attendance__summary">
            <div className="summary-card summary-card--total">
              <div className="summary-card__icon">📋</div>
              <div className="summary-card__content">
                <span className="summary-card__label">Total Days</span>
                <span className="summary-card__value">{summary.total}</span>
              </div>
            </div>

            <div className="summary-card summary-card--present">
              <div className="summary-card__icon">✅</div>
              <div className="summary-card__content">
                <span className="summary-card__label">Total Present</span>
                <span className="summary-card__value">{summary.present}</span>
              </div>
            </div>

            <div className="summary-card summary-card--absent">
              <div className="summary-card__icon">❌</div>
              <div className="summary-card__content">
                <span className="summary-card__label">Total Absent</span>
                <span className="summary-card__value">{summary.absent}</span>
              </div>
            </div>

            <div className="summary-card summary-card--percentage">
              <div className="summary-card__icon">📈</div>
              <div className="summary-card__content">
                <span className="summary-card__label">Attendance %</span>
                <span className="summary-card__value">{summary.percentage}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="my-attendance__filters card">
          <div className="filter-group">
            <label className="filter-label">Filter by Period</label>
            <div className="filter-buttons">
              {["All", "Today", "Week", "Month"].map((type) => (
                <button
                  key={type}
                  className={`filter-btn ${filterType === type ? "active" : ""}`}
                  onClick={() => {
                    setFilterType(type);
                    setSearchDate("");
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">Search by Date</label>
            <input
              type="date"
              className="filter-input"
              value={searchDate}
              onChange={(e) => {
                setSearchDate(e.target.value);
                setFilterType("All");
              }}
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="my-attendance__status card">
            <LoadingSpinner />
            <span>Loading attendance records...</span>
          </div>
        ) : error ? (
          <div className="my-attendance__error card">
            <h3>⚠️ Error</h3>
            <p>{error}</p>
          </div>
        ) : filteredAttendance.length === 0 ? (
          <EmptyState
            title="No Attendance Records"
            message="You don't have any attendance records for the selected period."
          />
        ) : (
          <div className="my-attendance__table-wrapper card">
            <table className="my-attendance__table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check-in Time</th>
                  <th>Status</th>
                  <th>Location Verified</th>
                  <th>Distance</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendance.map((record) => (
                  <tr key={record._id} className={`status-${record.status?.toLowerCase()}`}>
                    <td>
                      <span className="record-date">
                        {formatDate(record.attendanceDate)}
                      </span>
                    </td>
                    <td>
                      <span className="record-time">
                        {formatTime(record.attendanceDate)}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge status-${record.status?.toLowerCase()}`}>
                        {record.status === "Present" ? "✅" : "❌"} {record.status}
                      </span>
                    </td>
                    <td>
                      <span className="location-verified">✓ Verified</span>
                    </td>
                    <td>
                      <span className="distance-badge">
                        {Math.round(record.distanceFromSchool || 0)}m
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Refresh Button */}
        {!loading && (
          <div className="my-attendance__actions">
            <button className="refresh-btn" onClick={fetchAttendance}>
              🔄 Refresh Records
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
