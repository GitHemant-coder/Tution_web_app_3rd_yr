/**
 * AcademicCalendarAdmin.jsx — Admin-only Academic Calendar manager.
 *
 * Features:
 *  - Create a new semester academic calendar (year, semester, start/end dates)
 *  - List existing calendars
 *  - Delete a calendar (cascades its events)
 *  - Select a calendar to view/manage its events
 *  - Add / edit / delete events with category, priority, time window
 */

import React, { useEffect, useState } from "react";
import { get, post, put, remove } from "../api/api";
import { showSuccess, showError } from "../utils/toast";

const SEMESTER_OPTIONS = [
  { value: "FIRST", label: "First Semester" },
  { value: "SECOND", label: "Second Semester" },
  { value: "THIRD", label: "Third Semester" },
  { value: "FOURTH", label: "Fourth Semester" },
  { value: "FIFTH", label: "Fifth Semester" },
  { value: "SIXTH", label: "Sixth Semester" },
  { value: "SEVENTH", label: "Seventh Semester" },
  { value: "EIGHTH", label: "Eighth Semester" },
];

const CATEGORY_OPTIONS = [
  "EXAMINATION",
  "QUIZ_TEST",
  "ASSIGNMENT",
  "HOLIDAY",
  "PROJECT_MILESTONE",
  "SEMINAR_WORKSHOP",
  "COLLEGE_EVENT",
  "PARENT_TEACHER_MEETING",
  "OTHER",
];

const PRIORITY_OPTIONS = ["NORMAL", "IMPORTANT", "CRITICAL"];

const emptyEventForm = {
  title: "",
  description: "",
  date: "",
  start_time: "",
  end_time: "",
  category: "OTHER",
  priority: "NORMAL",
};

const emptyCalendarForm = {
  academic_year: "",
  semester: "FIRST",
  start_date: "",
  end_date: "",
  status: "ACTIVE",
};

export default function AcademicCalendarAdmin() {
  const [calendars, setCalendars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCalendar, setSelectedCalendar] = useState(null);

  const [calendarForm, setCalendarForm] = useState(emptyCalendarForm);
  const [creatingCalendar, setCreatingCalendar] = useState(false);

  const [eventForm, setEventForm] = useState(emptyEventForm);
  const [editingEventId, setEditingEventId] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [savingEvent, setSavingEvent] = useState(false);

  // Prevents double-fire on rapid clicks
  const [deletingId, setDeletingId] = useState(null);

  const fetchCalendars = async () => {
    try {
      setLoading(true);
      const data = await get("/academic-calendar/", true);
      setCalendars(Array.isArray(data) ? data : []);
    } catch (e) {
      showError("Failed to load academic calendars.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendars();
  }, []);

  const openCalendar = async (id) => {
    try {
      const data = await get(`/academic-calendar/${id}/`, true);
      setSelectedCalendar(data);
    } catch (e) {
      showError("Failed to open calendar.");
    }
  };

  const handleCreateCalendar = async (e) => {
    e.preventDefault();
    if (
      !calendarForm.academic_year ||
      !calendarForm.start_date ||
      !calendarForm.end_date
    ) {
      showError("Academic year, start date and end date are required.");
      return;
    }
    try {
      setCreatingCalendar(true);
      const created = await post("/academic-calendar/", calendarForm, true);
      showSuccess("Calendar created!");
      setCalendarForm(emptyCalendarForm);
      await fetchCalendars();
      openCalendar(created.id);
    } catch (err) {
      const msg = err?.data
        ? Object.values(err.data).flat().join(" ")
        : err?.message || "Failed to create calendar.";
      showError(msg);
    } finally {
      setCreatingCalendar(false);
    }
  };

  // ─── DELETE CALENDAR ────────────────────────────────────────────────────
  const handleDeleteCalendar = async (id) => {
    // Prevent double-fire
    if (deletingId === id) return;

    const ok = window.confirm(
      "Are you sure you want to delete this academic calendar?\n\n" +
        "This will also remove all of its academic events.",
    );
    if (!ok) return;

    try {
      setDeletingId(id);
      await remove(`/academic-calendar/${id}/`, true);
      showSuccess("Calendar deleted.");
      if (selectedCalendar?.id === id) setSelectedCalendar(null);
    } catch (e) {
      // If it's already gone (404), treat as success — the goal is achieved.
      const status = e?.status || e?.data?.status;
      if (status === 404) {
        showSuccess("Calendar already removed.");
        if (selectedCalendar?.id === id) setSelectedCalendar(null);
      } else {
        showError(e?.message || "Delete failed.");
      }
    } finally {
      setDeletingId(null);
      // ALWAYS refresh from server so UI stays truthful
      await fetchCalendars();
    }
  };
  // ────────────────────────────────────────────────────────────────────────

  const openAddEvent = () => {
    setEditingEventId(null);
    setEventForm(emptyEventForm);
    setShowEventModal(true);
  };

  const openEditEvent = (ev) => {
    setEditingEventId(ev.id);
    setEventForm({
      title: ev.title || "",
      description: ev.description || "",
      date: ev.date || "",
      start_time: ev.start_time || "",
      end_time: ev.end_time || "",
      category: ev.category || "OTHER",
      priority: ev.priority || "NORMAL",
    });
    setShowEventModal(true);
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (!selectedCalendar) return;
    if (!eventForm.title || !eventForm.date) {
      showError("Title and date are required.");
      return;
    }
    try {
      setSavingEvent(true);
      const payload = {
        title: eventForm.title,
        description: eventForm.description,
        date: eventForm.date,
        start_time: eventForm.start_time || null,
        end_time: eventForm.end_time || null,
        category: eventForm.category,
        priority: eventForm.priority,
        calendar: selectedCalendar.id,
      };
      if (editingEventId) {
        await put(
          `/academic-calendar/${selectedCalendar.id}/events/${editingEventId}/`,
          payload,
          true,
        );
        showSuccess("Event updated.");
      } else {
        await post(
          `/academic-calendar/${selectedCalendar.id}/events/`,
          payload,
          true,
        );
        showSuccess("Event added.");
      }
      setShowEventModal(false);
      setEventForm(emptyEventForm);
      setEditingEventId(null);
      openCalendar(selectedCalendar.id);
    } catch (err) {
      const msg = err?.data
        ? Object.values(err.data).flat().join(" ")
        : err?.message || "Failed to save event.";
      showError(msg);
    } finally {
      setSavingEvent(false);
    }
  };

  // ─── DELETE EVENT ───────────────────────────────────────────────────────
  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm("Delete this event?")) return;
    try {
      await remove(
        `/academic-calendar/${selectedCalendar.id}/events/${eventId}/`,
        true,
      );
      showSuccess("Event deleted.");
    } catch (e) {
      const status = e?.status || e?.data?.status;
      if (status === 404) {
        showSuccess("Event already removed.");
      } else {
        showError(e?.message || "Delete failed.");
      }
    } finally {
      if (selectedCalendar) await openCalendar(selectedCalendar.id);
    }
  };
  // ────────────────────────────────────────────────────────────────────────

  const priorityStyle = (p) => {
    if (p === "CRITICAL")
      return { bg: "rgba(239,68,68,0.15)", color: "#ef4444" };
    if (p === "IMPORTANT")
      return { bg: "rgba(234,179,8,0.15)", color: "#eab308" };
    return { bg: "rgba(56,189,248,0.12)", color: "var(--primary)" };
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Create Calendar Form */}
      <div className="card card-modern slide-in-left">
        <h3 style={{ marginBottom: "20px" }}>📅 Create Academic Calendar</h3>
        <form onSubmit={handleCreateCalendar}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            <div className="form-group">
              <label className="form-label">Academic Year *</label>
              <input
                className="input input-modern"
                placeholder="e.g. 2026-27"
                value={calendarForm.academic_year}
                onChange={(e) =>
                  setCalendarForm({
                    ...calendarForm,
                    academic_year: e.target.value,
                  })
                }
              />
            </div>
            <div className="form-group">
              <label className="form-label">Semester *</label>
              <select
                className="input input-modern"
                value={calendarForm.semester}
                onChange={(e) =>
                  setCalendarForm({ ...calendarForm, semester: e.target.value })
                }
              >
                {SEMESTER_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Start Date *</label>
              <input
                type="date"
                className="input input-modern"
                value={calendarForm.start_date}
                onChange={(e) =>
                  setCalendarForm({
                    ...calendarForm,
                    start_date: e.target.value,
                  })
                }
              />
            </div>
            <div className="form-group">
              <label className="form-label">End Date *</label>
              <input
                type="date"
                className="input input-modern"
                value={calendarForm.end_date}
                onChange={(e) =>
                  setCalendarForm({ ...calendarForm, end_date: e.target.value })
                }
              />
            </div>
          </div>
          <button
            type="submit"
            className="btn btn-modern btn-gradient"
            style={{ width: "100%", marginTop: "10px" }}
            disabled={creatingCalendar}
          >
            {creatingCalendar ? "Creating..." : "➕ Create Calendar"}
          </button>
        </form>
      </div>

      {/* Calendars List */}
      <div className="card card-modern">
        <h3 style={{ marginBottom: "20px" }}>
          📚 Existing Calendars ({calendars.length})
        </h3>
        {loading ? (
          <p className="small" style={{ opacity: 0.6 }}>
            Loading...
          </p>
        ) : calendars.length === 0 ? (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              opacity: 0.7,
              border: "2px dashed var(--border)",
              borderRadius: "12px",
            }}
          >
            No calendars yet. Create one above.
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {calendars.map((c) => (
              <div
                key={c.id}
                className="card card-modern hover-lift"
                style={{
                  padding: "16px 20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: "1rem" }}>
                    {c.semester_display} — {c.academic_year}
                  </div>
                  <div className="small" style={{ opacity: 0.7 }}>
                    {c.start_date} → {c.end_date} · {c.event_count} event
                    {c.event_count !== 1 ? "s" : ""}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    className="btn btn-modern btn-outline-modern"
                    style={{ padding: "6px 14px", fontSize: "0.82rem" }}
                    onClick={() => openCalendar(c.id)}
                  >
                    📂 Manage Events
                  </button>
                  <button
                    className="btn btn-modern"
                    style={{
                      padding: "6px 14px",
                      fontSize: "0.82rem",
                      background: "#ef4444",
                      color: "white",
                      opacity: deletingId === c.id ? 0.6 : 1,
                      cursor: deletingId === c.id ? "wait" : "pointer",
                    }}
                    onClick={() => handleDeleteCalendar(c.id)}
                    disabled={deletingId === c.id}
                  >
                    {deletingId === c.id ? "Deleting..." : "🗑 Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Calendar — Events */}
      {selectedCalendar && (
        <div className="card card-modern">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div>
              <h3 style={{ margin: 0 }}>
                {selectedCalendar.semester_display} —{" "}
                {selectedCalendar.academic_year}
              </h3>
              <p className="small" style={{ opacity: 0.7, marginTop: "4px" }}>
                {selectedCalendar.start_date} → {selectedCalendar.end_date}
              </p>
            </div>
            <button
              className="btn btn-modern btn-gradient"
              onClick={openAddEvent}
            >
              + Add Event
            </button>
          </div>

          {selectedCalendar.events.length === 0 ? (
            <div
              style={{
                padding: "40px",
                textAlign: "center",
                opacity: 0.6,
                border: "2px dashed var(--border)",
                borderRadius: "12px",
              }}
            >
              No events yet. Click "Add Event" to create one.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.9rem",
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--border)" }}>
                    {[
                      "Date",
                      "Event",
                      "Category",
                      "Priority",
                      "Time",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: "left",
                          padding: "10px 12px",
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          opacity: 0.7,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedCalendar.events.map((ev) => {
                    const ps = priorityStyle(ev.priority);
                    return (
                      <tr
                        key={ev.id}
                        style={{ borderBottom: "1px solid var(--border)" }}
                      >
                        <td style={{ padding: "10px 12px", fontWeight: 600 }}>
                          {ev.date}
                        </td>
                        <td style={{ padding: "10px 12px" }}>{ev.title}</td>
                        <td style={{ padding: "10px 12px" }}>
                          <span className="status-badge status-accent">
                            {ev.category_display}
                          </span>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <span
                            style={{
                              background: ps.bg,
                              color: ps.color,
                              padding: "3px 10px",
                              borderRadius: "12px",
                              fontSize: "0.72rem",
                              fontWeight: 700,
                            }}
                          >
                            {ev.priority_display}
                          </span>
                        </td>
                        <td style={{ padding: "10px 12px", opacity: 0.8 }}>
                          {ev.start_time && ev.end_time
                            ? `${String(ev.start_time).slice(0, 5)} – ${String(ev.end_time).slice(0, 5)}`
                            : String(ev.start_time || "—").slice(0, 5)}
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button
                              className="btn btn-modern btn-outline-modern"
                              style={{
                                padding: "4px 10px",
                                fontSize: "0.75rem",
                              }}
                              onClick={() => openEditEvent(ev)}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              className="btn btn-modern"
                              style={{
                                padding: "4px 10px",
                                fontSize: "0.75rem",
                                background: "#ef4444",
                                color: "white",
                              }}
                              onClick={() => handleDeleteEvent(ev.id)}
                            >
                              🗑
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Event Modal */}
      {showEventModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={() => setShowEventModal(false)}
        >
          <div
            className="card card-modern"
            style={{
              maxWidth: "560px",
              width: "100%",
              padding: "28px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: "20px" }}>
              {editingEventId ? "✏️ Edit Event" : "➕ Add Event"}
            </h3>
            <form onSubmit={handleSaveEvent}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input
                  className="input input-modern"
                  placeholder="e.g. Mid-Term Examination"
                  value={eventForm.title}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, title: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="input input-modern"
                  rows={2}
                  style={{ resize: "vertical" }}
                  placeholder="Optional notes for students/teachers..."
                  value={eventForm.description}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, description: e.target.value })
                  }
                />
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                }}
              >
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input
                    type="date"
                    className="input input-modern"
                    value={eventForm.date}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, date: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select
                    className="input input-modern"
                    value={eventForm.category}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, category: e.target.value })
                    }
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input
                    type="time"
                    className="input input-modern"
                    value={eventForm.start_time}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, start_time: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input
                    type="time"
                    className="input input-modern"
                    value={eventForm.end_time}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, end_time: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select
                    className="input input-modern"
                    value={eventForm.priority}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, priority: e.target.value })
                    }
                  >
                    {PRIORITY_OPTIONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
                <button
                  type="button"
                  className="btn btn-modern btn-outline-modern"
                  style={{ flex: 1 }}
                  onClick={() => setShowEventModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-modern btn-gradient"
                  style={{ flex: 2 }}
                  disabled={savingEvent}
                >
                  {savingEvent
                    ? "Saving..."
                    : editingEventId
                      ? "Save Changes"
                      : "Add Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}