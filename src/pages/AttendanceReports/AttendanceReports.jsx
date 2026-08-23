import { useEffect, useMemo, useRef, useState } from "react";
import { getTeachers, getTeacherAttendanceReport } from "../../services/api";
import { StatsCard } from "../../components/StatsCard/StatsCard";
import { AttendanceChart } from "../../components/AttendanceChart/AttendanceChart";
import  EmptyState  from "../../components/EmptyState/EmptyState";
import { LoadingSpinner } from "../../components/LoadingSpinner/LoadingSpinner";
import "./AttendanceReports.css";

const months = [
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

function ReportSelect({ value, options, onChange, ariaLabel }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);
  const selectedOption = options.find((option) => String(option.value) === String(value));

  useEffect(() => {
    function closeOnOutsideClick(event) {
      if (!selectRef.current?.contains(event.target)) setIsOpen(false);
    }

    function closeOnEscape(event) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <div className={`report-select ${isOpen ? "report-select--open" : ""}`} ref={selectRef}>
      <button
        type="button"
        className="report-select__trigger"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span>{selectedOption?.label || "Select an option"}</span>
        <span className="report-select__chevron" aria-hidden="true">⌄</span>
      </button>
      {isOpen && (
        <div className="report-select__menu" role="listbox" aria-label={ariaLabel}>
          {options.map((option) => (
            <button
              type="button"
              role="option"
              aria-selected={String(option.value) === String(value)}
              className={`report-select__option ${String(option.value) === String(value) ? "report-select__option--selected" : ""}`}
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

export default function AttendanceReports() {
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reportError, setReportError] = useState("");

  useEffect(() => {
    async function loadTeachers() {
      try {
        setLoading(true);
        const data = await getTeachers();
        if (data && Array.isArray(data) && data.length > 0) {
          setTeachers(data);
          setSelectedTeacher(data[0]?.teacherID || "");
        } else {
          setError("No teachers found in the system");
        }
      } catch (fetchError) {
        setError(fetchError.message || "Failed to load teachers");
      } finally {
        setLoading(false);
      }
    }
    loadTeachers();
  }, []);

  useEffect(() => {
    if (!selectedTeacher || !month || year === undefined) return;
    
    async function loadReport() {
      setReportError("");
      setReport(null);
      try {
        const data = await getTeacherAttendanceReport(selectedTeacher, month, year);
        if (data) {
          setReport(data);
        } else {
          setReportError("No attendance data available for selected period");
        }
      } catch (fetchError) {
        setReportError(fetchError.message || "Failed to load attendance report");
      }
    }
    loadReport();
  }, [selectedTeacher, month, year]);

  const chartData = useMemo(() => {
    if (!report) return [];
    const present = Number(report.presentDays || 0);
    const total = Number(report.totalWorkingDays || 0);
    return [
      { name: "Present", value: present },
      { name: "Absent", value: Math.max(total - present, 0) },
    ];
  }, [report]);

  return (
    <section className="attendance-reports-page">
      <div className="attendance-reports-header card">
        <div className="page-header-block">
          <span className="attendance-reports__eyebrow">NEXUS WORKSPACE</span>
          <h1>Reports</h1>
          <p>View monthly attendance performance and reports across NEXUS.</p>
        </div>
      </div>

      <div className="attendance-reports__filters card">
        <label className="attendance-reports__field">
          <span>Teacher</span>
          <ReportSelect
            value={selectedTeacher}
            ariaLabel="Select teacher"
            onChange={setSelectedTeacher}
            options={teachers.map((teacher) => ({
              value: teacher.teacherID,
              label: `${teacher.fullName} (${teacher.teacherID})`,
            }))}
          />
        </label>
        <label className="attendance-reports__field">
          <span>Month</span>
          <ReportSelect
            value={month}
            ariaLabel="Select month"
            onChange={setMonth}
            options={months.map((name, index) => ({ value: index, label: name }))}
          />
        </label>
        <label className="attendance-reports__field">
          <span>Year</span>
          <input type="number" value={year} onChange={(event) => setYear(Number(event.target.value))} min="2020" />
        </label>
      </div>

      {loading ? (
        <div className="attendance-reports-loading card">
          <LoadingSpinner />
          <span>Loading teachers...</span>
        </div>
      ) : error ? (
        <div className="attendance-reports-error card">
          <h3>Unable to load teachers</h3>
          <p>{error}</p>
        </div>
      ) : reportError && !report ? (
        <div className="attendance-reports-error card">
          <h3>Unable to load report</h3>
          <p>{reportError}</p>
        </div>
      ) : !report ? (
        <EmptyState title="No report data" message="Select a teacher and month to view attendance details." />
      ) : (
        <>
          <div className="attendance-reports__stats">
            <StatsCard label="Attendance Percentage" value={`${report.attendancePercentage || 0}%`} />
            <StatsCard label="Present Days" value={report.presentDays || 0} />
            <StatsCard label="Absent Days" value={Math.max(Number(report.totalWorkingDays || 0) - Number(report.presentDays || 0), 0)} />
            <StatsCard label="Working Days" value={report.totalWorkingDays || 0} />
          </div>
          <div className="attendance-reports__chart card">
            <div className="attendance-reports__chart-heading">
              <div>
                <span>PERFORMANCE</span>
                <h2>Monthly Attendance Overview</h2>
              </div>
              <span>{months[month]} {year}</span>
            </div>
            <AttendanceChart data={chartData} />
          </div>
        </>
      )}
    </section>
  );
}
