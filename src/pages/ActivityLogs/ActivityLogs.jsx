import { useEffect, useState } from "react";
import { getActivityLogs } from "../../services/api";
import  EmptyState  from "../../components/EmptyState/EmptyState";
import { LoadingSpinner } from "../../components/LoadingSpinner/LoadingSpinner";
import "./ActivityLogs.css";

function getActivityPresentation(entry) {
  let badgeClass = "activity-badge--info";
  let emoji = "📝";
  const typeLower = (entry.type || "").toLowerCase();

  if (typeLower.includes("deleted")) {
    badgeClass = "activity-badge--danger";
    emoji = "🗑️";
  } else if (typeLower.includes("updated")) {
    badgeClass = "activity-badge--warning";
    emoji = "✏️";
  } else if (typeLower.includes("created") || typeLower.includes("added")) {
    badgeClass = "activity-badge--success";
    emoji = "✅";
  }

  if (typeLower.includes("notice")) {
    badgeClass = typeLower.includes("deleted") ? "activity-badge--danger" : "activity-badge--warning";
    emoji = "📢";
  } else if (typeLower.includes("teacher")) {
    emoji = "👨‍🏫";
  } else if (typeLower.includes("task")) {
    emoji = "✅";
  } else if (typeLower.includes("attendance")) {
    badgeClass = "activity-badge--success";
    emoji = "📋";
  }

  return {
    badgeClass,
    emoji,
    type: entry.type || "Event",
    title: entry.title || "Activity Update",
    description: entry.description || "-",
    timestamp: entry.date
      ? new Date(entry.date).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
      : "Just now",
  };
}

export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadLogs() {
      setLoading(true);
      setError("");
      try {
        const data = await getActivityLogs();
        setLogs(data || []);
      } catch (fetchError) {
        setError(fetchError.message);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  return (
    <section className="activity-logs-page">
      <div className="activity-logs-header card">
        <div className="page-header-block">
          <span className="activity-logs__eyebrow">NEXUS WORKSPACE</span>
          <h1>Activity Logs</h1>
          <p>A clear operational trail</p>
        </div>
      </div>

      {loading ? (
        <div className="activity-logs-loading card">
          <LoadingSpinner />
          <span>Loading activity logs...</span>
        </div>
      ) : error ? (
        <div className="activity-logs-error card">
          <h3>Unable to load activity logs</h3>
          <p>{error}</p>
        </div>
      ) : logs.length === 0 ? (
        <EmptyState title="No activity logged" message="No activity has been recorded yet." />
      ) : (
        <>
        <div className="activity-table-container">
          <table className="activity-table">
            <thead>
              <tr>
                <th>Action Type</th>
                <th>Target Event</th>
                <th>Description Details</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((entry) => {
                const activity = getActivityPresentation(entry);
                return (
                  <tr key={entry.id || entry.date}>
                    <td>
                      <span className={`activity-badge ${activity.badgeClass}`}>
                        <i>{activity.emoji}</i>
                        {activity.type}
                      </span>
                    </td>
                    <td>
                      <span className="activity-target">{activity.title}</span>
                    </td>
                    <td>
                      <span className="activity-description">{activity.description}</span>
                    </td>
                    <td className="activity-time-cell">
                      {activity.timestamp}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="activity-log-cards" aria-label="Activity log cards">
          {logs.map((entry) => {
            const activity = getActivityPresentation(entry);
            return (
              <article className="activity-log-card" key={`mobile-${entry.id || entry.date}`}>
                <div className="activity-log-card__action">
                  <span className={`activity-badge ${activity.badgeClass}`}>
                    <i>{activity.emoji}</i>
                    {activity.type}
                  </span>
                </div>
                <div className="activity-log-card__target">
                  <span>Target</span>
                  <strong>{activity.title}</strong>
                </div>
                <p className="activity-log-card__description">{activity.description}</p>
                <time className="activity-log-card__time">{activity.timestamp}</time>
              </article>
            );
          })}
        </div>
        </>
      )}
    </section>
  );
}