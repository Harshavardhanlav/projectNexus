import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoadingSpinner } from "../../../components/LoadingSpinner/LoadingSpinner";
import { getTeacherAttendanceRecords } from "../../../services/api";
import { getCurrentLocation, isWithinSchoolRadius, formatDistance } from "../../../utils/geolocation";
import { SCHOOL_CONFIG } from "../../../config/schoolConfig";
import "./TeacherMarkAttendance.css";

export default function TeacherMarkAttendance() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [locationData, setLocationData] = useState(null);
  const [distanceData, setDistanceData] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState("Not marked");
  const [markedTime, setMarkedTime] = useState(null);

  const teacher = JSON.parse(localStorage.getItem("teacherData")) || {};

  // Check if attendance already marked today (only from localStorage - teacher's manual action)
  useEffect(() => {
    async function loadTodayAttendance() {
      const todayDateString = new Date().toDateString();
      const storedDate = localStorage.getItem("attendanceMarkedDate");
      const storedTime = localStorage.getItem("attendanceMarkedTime");
      const storedStatus = localStorage.getItem("attendanceStatus");

      // Only show "Already Marked" if teacher manually marked it (localStorage entry exists)
      // This distinguishes manual marking from backend auto-marking
      if (storedDate === todayDateString && storedStatus) {
        setAttendanceMarked(true);
        setAttendanceStatus(storedStatus);
        setMarkedTime(storedTime);
        return;
      }

      // If no localStorage record, show "Not marked" even if backend has an auto-absent record
      // This ensures the UI shows a neutral state before the teacher manually marks
      setAttendanceStatus("Not marked");
    }

    loadTodayAttendance();
  }, [teacher.teacherID]);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleGetLocation = async () => {
    setLocationLoading(true);
    setError("");
    try {
      const location = await getCurrentLocation();
      setLocationData(location);

      // Check if within school radius
      const distance = isWithinSchoolRadius(
        location.latitude,
        location.longitude,
        SCHOOL_CONFIG.latitude,
        SCHOOL_CONFIG.longitude,
        SCHOOL_CONFIG.radiusMeters
      );

      setDistanceData(distance);
    } catch (err) {
      setError(
        err.message || "Unable to get location. Please enable location services."
      );
    } finally {
      setLocationLoading(false);
    }
  };

  const handleMarkAttendance = async () => {
    setError("");
    setSuccess("");

    if (!locationData) {
      setError("Please get your location first");
      return;
    }

    if (!distanceData?.isWithin) {
      setError("You are outside the school premises. Attendance cannot be marked.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("https://community-service-project-backend.onrender.com/attendance/mark-attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teacherId: teacher.teacherID,
          teacherName: teacher.fullName,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          timestamp: locationData.timestamp,
          distanceFromSchool: distanceData.distance,
          status: "Present",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("✅ Attendance marked successfully!");
        setLocationData(null);
        setDistanceData(null);
        
        // Store attendance marked status in localStorage
        const today = new Date().toDateString();
        localStorage.setItem("attendanceMarkedDate", today);
        localStorage.setItem("attendanceMarkedTime", new Date().toLocaleTimeString());
        localStorage.setItem("attendanceStatus", "Present"); // Store the actual status
        setAttendanceMarked(true);
        setAttendanceStatus("Present");
        setMarkedTime(new Date().toLocaleTimeString());
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate("/teacher/my-attendance");
        }, 2000);
      } else {
        setError(data.message || "Failed to mark attendance");
      }
    } catch (err) {
      setError("Error marking attendance: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <section className="mark-attendance-page">
      <div className="mark-attendance__container">
        {/* Header Card */}
        <div className="mark-attendance__hero card">
          <div className="mark-attendance__hero-content">
            <h1>📍 Mark Your Attendance</h1>
            <p>
              Mark your daily attendance by confirming your location within the school premises.
            </p>
          </div>
        </div>

        {/* Teacher Info Card */}
        <div className="mark-attendance__info card">
          <div className="mark-attendance__info-item">
            <span className="mark-attendance__label">Teacher Name</span>
            <span className="mark-attendance__value">{teacher.fullName || "N/A"}</span>
          </div>
          <div className="mark-attendance__info-item">
            <span className="mark-attendance__label">Teacher ID</span>
            <span className="mark-attendance__value">{teacher.teacherID || "N/A"}</span>
          </div>
          <div className="mark-attendance__info-item">
            <span className="mark-attendance__label">Current Date</span>
            <span className="mark-attendance__value">{formatDate(currentTime)}</span>
          </div>
          <div className="mark-attendance__info-item">
            <span className="mark-attendance__label">Current Time</span>
            <span className="mark-attendance__value mark-attendance__time">
              {formatTime(currentTime)}
            </span>
          </div>
        </div>

        {/* Already Marked Message */}
        {attendanceMarked ? (
          <div className="mark-attendance__success-complete card">
            <div className="mark-attendance__success-content">
              <span className="mark-attendance__success-icon-large">✅</span>
              <h2>Attendance Already Marked</h2>
              <p>
                Your attendance for today is already recorded as{' '}
                <strong>{attendanceStatus}</strong>.
              </p>
              <div className="mark-attendance__marked-info">
                <span className="mark-attendance__label">Marked at:</span>
                <span className="mark-attendance__value">{markedTime || "N/A"}</span>
              </div>
              <button
                className="mark-attendance__btn mark-attendance__btn--primary"
                onClick={() => navigate("/teacher/my-attendance")}
              >
                View Your Attendance History
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Location Status Card */}
            <div className="mark-attendance__location-card card">
              <h3>📌 Location Status</h3>

              {locationData ? (
                <div className="mark-attendance__location-data">
                  <div className="mark-attendance__location-item">
                    <span className="mark-attendance__label">Latitude</span>
                    <span className="mark-attendance__value">
                      {locationData.latitude.toFixed(6)}
                    </span>
                  </div>
                  <div className="mark-attendance__location-item">
                    <span className="mark-attendance__label">Longitude</span>
                    <span className="mark-attendance__value">
                      {locationData.longitude.toFixed(6)}
                    </span>
                  </div>

                  {distanceData && (
                    <>
                      <div className="mark-attendance__location-item">
                        <span className="mark-attendance__label">Distance from School</span>
                        <span
                          className={`mark-attendance__value ${
                            distanceData.isWithin
                              ? "mark-attendance__distance--inside"
                              : "mark-attendance__distance--outside"
                          }`}
                        >
                          {distanceData.distance} meters
                        </span>
                      </div>

                      <div className="mark-attendance__status-indicator">
                        <div
                          className={`mark-attendance__status-badge ${
                            distanceData.isWithin ? "status--inside" : "status--outside"
                          }`}
                        >
                          {distanceData.isWithin ? "✅ Inside Radius" : "❌ Outside Radius"}
                        </div>
                      </div>
                    </>
                  )}

                  <button
                    className="mark-attendance__btn mark-attendance__btn--secondary"
                    onClick={handleGetLocation}
                    disabled={locationLoading}
                  >
                    {locationLoading ? "Getting Location..." : "🔄 Refresh Location"}
                  </button>
                </div>
              ) : (
                <div className="mark-attendance__no-location">
                  <p>Click the button below to get your current location</p>
                  <button
                    className="mark-attendance__btn mark-attendance__btn--primary"
                    onClick={handleGetLocation}
                    disabled={locationLoading}
                  >
                    {locationLoading ? <LoadingSpinner /> : "📍 Get My Location"}
                  </button>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mark-attendance__error card">
                <span className="mark-attendance__error-icon">⚠️</span>
                <p>{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mark-attendance__success card">
                <span className="mark-attendance__success-icon">{success}</span>
              </div>
            )}

            {/* Action Buttons */}
            {locationData && (
              <div className="mark-attendance__actions">
                <button
                  className={`mark-attendance__btn mark-attendance__btn--submit ${
                    !distanceData?.isWithin ? "disabled" : ""
                  }`}
                  onClick={handleMarkAttendance}
                  disabled={loading || !distanceData?.isWithin}
                >
                  {loading ? "Marking Attendance..." : "✅ Mark Attendance"}
                </button>
                <button
                  className="mark-attendance__btn mark-attendance__btn--cancel"
                  onClick={() => {
                    setLocationData(null);
                    setDistanceData(null);
                  }}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
