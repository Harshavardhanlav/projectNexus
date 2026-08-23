import { useEffect, useState } from "react";
import { createTask, getTasks, deleteTask, updateTask, getTeachers } from "../../services/api";
import  EmptyState  from "../../components/EmptyState/EmptyState";
import { LoadingSpinner } from "../../components/LoadingSpinner/LoadingSpinner";
import { ConfirmModal } from "../../components/ConfirmModal/ConfirmModal";
import { CalendarDays, ClipboardCheck, Pencil, Plus, Search, Trash2, UserRound } from "lucide-react";
import "./Tasks.css";
const initialForm = {
  title: "",
  description: "",
  assignedTo: "",
  deadline: "",
  status: "Pending",
};

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
const [statusFilter, setStatusFilter] = useState("All");
const [showForm, setShowForm] = useState(false);
const [teachers, setTeachers] = useState([]);
const [selectedTask, setSelectedTask] = useState(null);
const [isEditing, setIsEditing] = useState(false);

useEffect(() => {
  fetchTasks();
  fetchTeachers();
}, []);

  async function fetchTasks() {
    setLoading(true);
    setError("");
    try {
      const data = await getTasks();
      setTasks(data || []);
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  }

  function handleInputChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    try {
      if (isEditing) {
        await updateTask(selectedTask._id, form);
      } else {
        await createTask(form);
      }
      setForm(initialForm);
      setShowForm(false);
      setIsEditing(false);
      setSelectedTask(null);
      await fetchTasks();
    } catch (submitError) {
      setMessage(submitError.message);
    }
  }

  function handleEdit(task) {
    setSelectedTask(task);
    setForm({
      title: task.title || "",
      description: task.description || "",
      assignedTo: task.assignedTo || "",
      deadline: task.deadline || "",
      status: task.status || "Pending"
    });
    setIsEditing(true);
    setShowForm(true);
  }

function handleDelete(task) {

   setSelectedTask(task);

   setConfirmAction({
      title: "Delete Task?",
      message: `Are you sure you want to delete "${task.title}"?`
   });

}
async function fetchTeachers() {

  try {

    const data = await getTeachers();

    setTeachers(data || []);

  } catch (error) {

    console.error(error);

  }

}
async function confirmDeleteAction() {

   try {

      await deleteTask(selectedTask._id);

      await fetchTasks();

      setConfirmAction(null);

      setSelectedTask(null);

   } catch (error) {

      setMessage(error.message);

   }

}
const filteredTasks = tasks.filter((task) => {

  const matchesSearch =
    task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.assignedTo?.toLowerCase().includes(searchTerm.toLowerCase());

  const matchesStatus =
    statusFilter === "All" ||
    task.status === statusFilter;

  return matchesSearch && matchesStatus;
});
  return (
    <section className="tasks-page">
      <div className="tasks-page__header">
        <div className="tasks-page__header-copy">
          <span className="tasks-page__eyebrow">TASK MANAGEMENT</span>
          <h1>Tasks</h1>
          <p>Manage and track all teacher tasks.</p>
        </div>
        <button className="primary tasks-page__create" onClick={() => setShowForm(true)}>
          <Plus size={17} aria-hidden="true" />
          <span>Create Task</span>
        </button>
      </div>

      <div className="tasks-page__layout">

        <div className="tasks-list card">
          <div className="tasks-list__heading">
            <div>
              <span className="tasks-list__eyebrow">WORK QUEUE</span>
              <h2>Task List</h2>
            </div>
            <span className="tasks-list__count">{filteredTasks.length} tasks</span>
          </div>
          <div className="tasks-toolbar">

  <div className="tasks-search-box">
    <Search className="tasks-search-icon" size={18} aria-hidden="true" />

    <input
      type="text"
      placeholder="Search tasks..."
      className="tasks-search"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />

  </div>

  <select
    className="tasks-filter"
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value)}
  >
    <option value="All">All Tasks</option>
    <option value="Pending">Pending</option>
    <option value="Completed">Completed</option>
  </select>

</div>
          {loading ? (
            <div className="tasks-list__loading">
              <LoadingSpinner />
              <span>Loading tasks...</span>
            </div>
          ) : error ? (
            <div className="tasks-list__error">
              <h4>Unable to load tasks</h4>
              <p>{error}</p>
            </div>
          ) : tasks.length === 0 ? (
            <EmptyState title="No tasks yet" message="Assign your first task to keep the team moving." />
          ) : (
            <div className="tasks-grid">
              {filteredTasks.map((task) => (
<article key={task._id || task.title} className="task-card">
  <div className="task-card__icon"><ClipboardCheck size={20} aria-hidden="true" /></div>
  <div className="task-card__body">
    <div className="task-header">
      <h3 className="task-title">{task.title}</h3>
      <span className={`task-status task-status-${task.status?.toLowerCase()}`}>{task.status}</span>
    </div>
    <div className="task-description">{task.description}</div>
    <div className="task-meta">
      <div className="task-meta-item"><UserRound size={14} aria-hidden="true" /> {task.assignedTo || "Unassigned"}</div>
      <div className="task-meta-item"><CalendarDays size={14} aria-hidden="true" /> {task.deadline ? new Date(task.deadline).toLocaleDateString() : "No Deadline"}</div>
    </div>
  </div>
  <div className="task-card__actions">

    <button
      type="button"
      className="secondary"
      onClick={() => handleEdit(task)}
    >
      <Pencil size={14} aria-hidden="true" /> Edit
    </button>

    <button
      type="button"
      className="secondary"
      onClick={() => handleDelete(task)}
    >
      <Trash2 size={14} aria-hidden="true" /> Delete
    </button>

  </div>

</article>
              ))}
            </div>
          )}
        </div>
      </div>
{showForm && (

  <div className="task-modal">

    <div className="task-modal-content card">

      <div className="task-modal-header">

        <h3>{isEditing ? "Edit Task" : "Create Task"}</h3>

        <button
          type="button"
          className="secondary"
          onClick={() => {
            setShowForm(false);
            setIsEditing(false);
            setSelectedTask(null);
            setForm(initialForm);
          }}
        >
          Close
        </button>

      </div>

      <form onSubmit={handleSubmit}>

        <label>
          Task Title
          <input
            name="title"
            value={form.title}
            onChange={handleInputChange}
            required
          />
        </label>

        <label>
          Description
          <textarea
            name="description"
            rows="4"
            value={form.description}
            onChange={handleInputChange}
            required
          />
        </label>

<label>

  Assigned Teacher

  <select
    name="assignedTo"
    value={form.assignedTo}
    onChange={handleInputChange}
    required
  >

    <option value="">
      Select Teacher
    </option>

    {teachers.map((teacher) => (

      <option
        key={teacher._id}
        value={teacher.fullName}
      >
        {teacher.fullName} ({teacher.teacherID})
      </option>

    ))}

  </select>

</label>

        <div className="form-row">

          <label>
            Deadline
            <input
              name="deadline"
              type="date"
              value={form.deadline}
              onChange={handleInputChange}
            />
          </label>

          <label>
            Status
            <select
              name="status"
              value={form.status}
              onChange={handleInputChange}
            >
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
            </select>
          </label>

        </div>

        {message && (
          <p className="form-message">
            {message}
          </p>
        )}

        <button
          type="submit"
          className="primary"
        >
          {isEditing ? "Update Task" : "Create Task"}
        </button>

      </form>

    </div>

  </div>

)}
{confirmAction && (
  <ConfirmModal
    title={confirmAction.title}
    message={confirmAction.message}
    onCancel={() => {
      setConfirmAction(null);
      setSelectedTask(null);
    }}
    onConfirm={confirmDeleteAction}
    confirmLabel="Delete"
  />
)}
    </section>
  );
}
