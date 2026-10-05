/**
 * AcademicCalendarView.jsx — Read-only academic calendar for Teachers & Students.
 */

import React, { useEffect, useState } from "react";
import { get } from "../api/api";
import { showError } from "../utils/toast";

const MONTH_NAMES = [
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

// Build a YYYY-MM-DD string in LOCAL time (avoids the UTC shift bug).
const toLocalISO = (dateObj) => {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

// Parse a YYYY-MM-DD string as LOCAL time (avoids UTC→local shift bug).
const parseLocalISO = (iso) => {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const priorityStyle = (p) => {
  if (p === "CRITICAL") return { bg: "rgba(239,68,68,0.15)", color: "#ef4444" };
  if (p === "IMPORTANT")
    return { bg: "rgba(234,179,8,0.15)", color: "#eab308" };
  return { bg: "rgba(56,189,248,0.12)", color: "var(--primary)" };
};

export default function AcademicCalendarView() {
  const [calendars, setCalendars] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [calendar, setCalendar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [upcoming, setUpcoming] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [cals, up] = await Promise.all([
          get("/academic-calendar/", true),
          get("/academic-calendar/upcoming/?limit=5", true),
        ]);
        setCalendars(Array.isArray(cals) ? cals : []);
        setUpcoming(Array.isArray(up) ? up : []);
        if (cals && cals.length > 0) {
          setSelectedId(cals[0].id);
        }
      } catch (e) {
        showError("Failed to load calendar.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    (async () => {
      try {
        const data = await get(`/academic-calendar/${selectedId}/`, true);
        setCalendar(data);
        if (data.start_date) {
          const d = parseLocalISO(data.start_date);
          setCurrentMonth(d);
          setSelectedDay(null);
        }
      } catch (e) {
        showError("Failed to load calendar details.");
      }
    })();
  }, [selectedId]);

  const getMonthGrid = (year, month) => {
    const firstDay = new Date(year, month, 1);
    const startWeekday = (firstDay.getDay() + 6) % 7; // Mon = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(year, month, d));
    }
    return cells;
  };

  const eventsForDate = (dateObj) => {
    if (!calendar || !dateObj) return [];
    const iso = toLocalISO(dateObj);
    return calendar.events.filter((ev) => ev.date === iso);
  };

  const fmtDate = (iso) => {
    if (!iso) return "";
    const d = parseLocalISO(iso);
    return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
  };

  // Time is fine as-is (no timezone shift on HH:MM:SS)
  const fmtTime = (t) => {
    if (!t) return "";
    return String(t).slice(0, 5); // "09:00:00" → "09:00"
  };

  if (loading) {
    return (
      <div
        className="card card-modern"
        style={{ padding: "60px", textAlign: "center", opacity: 0.7 }}
      >
        Loading academic calendar...
      </div>
    );
  }

  if (calendars.length === 0) {
    return (
      <div
        className="card card-modern"
        style={{ padding: "60px", textAlign: "center", opacity: 0.6 }}
      >
        No academic calendar published yet.
      </div>
    );
  }

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const grid = getMonthGrid(year, month);
  const selectedEvents = selectedDay
    ? calendar?.events.filter((ev) => ev.date === selectedDay) || []
    : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div className="card card-modern" style={{ padding: "20px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <h3 style={{ margin: 0 }}>📅 Academic Calendar</h3>
            {calendar && (
              <p className="small" style={{ opacity: 0.7, marginTop: "4px" }}>
                {calendar.semester_display} · {calendar.academic_year} ·{" "}
                {fmtDate(calendar.start_date)} → {fmtDate(calendar.end_date)}
              </p>
            )}
          </div>
          {calendars.length > 1 && (
            <select
              className="input input-modern"
              style={{ maxWidth: "300px" }}
              value={selectedId || ""}
              onChange={(e) => setSelectedId(Number(e.target.value))}
            >
              {calendars.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.semester_display} — {c.academic_year}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}
      >
        <div className="card card-modern" style={{ padding: "20px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <button
              className="btn btn-modern btn-outline-modern"
              style={{ padding: "6px 12px" }}
              onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
            >
              ←
            </button>
            <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>
              {MONTH_NAMES[month]} {year}
            </div>
            <button
              className="btn btn-modern btn-outline-modern"
              style={{ padding: "6px 12px" }}
              onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
            >
              →
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "6px",
              marginBottom: "8px",
            }}
          >
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div
                key={d}
                className="small"
                style={{
                  textAlign: "center",
                  fontWeight: 700,
                  opacity: 0.6,
                  padding: "6px 0",
                }}
              >
                {d}
              </div>
            ))}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "6px",
            }}
          >
            {grid.map((cell, idx) => {
              if (!cell) return <div key={idx} />;
              const iso = toLocalISO(cell);
              const dayEvents = eventsForDate(cell);
              const isSelected = selectedDay === iso;
              const hasCritical = dayEvents.some(
                (ev) => ev.priority === "CRITICAL",
              );
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDay(iso)}
                  style={{
                    aspectRatio: "1",
                    border: isSelected
                      ? "2px solid var(--primary)"
                      : "1px solid var(--border)",
                    background: isSelected
                      ? "rgba(56,189,248,0.12)"
                      : "var(--card-bg)",
                    borderRadius: "8px",
                    cursor: "pointer",
                    position: "relative",
                    color: "var(--text)",
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: "0.9rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {cell.getDate()}
                  {dayEvents.length > 0 && (
                    <span
                      style={{
                        position: "absolute",
                        bottom: "6px",
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: hasCritical ? "#ef4444" : "var(--primary)",
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {selectedDay && (
            <div className="card card-modern" style={{ padding: "16px" }}>
              <h4 style={{ margin: 0, marginBottom: "10px" }}>
                {fmtDate(selectedDay)}
              </h4>
              {selectedEvents.length === 0 ? (
                <p className="small" style={{ opacity: 0.6, margin: 0 }}>
                  No events on this day.
                </p>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {selectedEvents.map((ev) => {
                    const ps = priorityStyle(ev.priority);
                    return (
                      <div
                        key={ev.id}
                        style={{
                          padding: "10px 12px",
                          borderRadius: "8px",
                          background: "var(--bg-main)",
                          borderLeft: `3px solid ${ps.color}`,
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                          {ev.title}
                        </div>
                        <div
                          className="small"
                          style={{ opacity: 0.7, marginTop: "4px" }}
                        >
                          {ev.category_display} ·{" "}
                          <span
                            style={{
                              background: ps.bg,
                              color: ps.color,
                              padding: "1px 8px",
                              borderRadius: "10px",
                              fontSize: "0.7rem",
                              fontWeight: 700,
                            }}
                          >
                            {ev.priority_display}
                          </span>
                        </div>
                        {(ev.start_time || ev.end_time) && (
                          <div
                            className="small"
                            style={{ opacity: 0.7, marginTop: "4px" }}
                          >
                            🕐 {fmtTime(ev.start_time) || "—"} –{" "}
                            {fmtTime(ev.end_time) || "—"}
                          </div>
                        )}
                        {ev.description && (
                          <div
                            className="small"
                            style={{ opacity: 0.85, marginTop: "6px" }}
                          >
                            {ev.description}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="card card-modern" style={{ padding: "16px" }}>
            <h4 style={{ margin: 0, marginBottom: "10px" }}>
              🔔 Upcoming Events
            </h4>
            {upcoming.length === 0 ? (
              <p className="small" style={{ opacity: 0.6, margin: 0 }}>
                No upcoming events.
              </p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                {upcoming.map((ev) => {
                  const ps = priorityStyle(ev.priority);
                  return (
                    <div
                      key={ev.id}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "8px",
                        background: "var(--bg-main)",
                        borderLeft: `3px solid ${ps.color}`,
                      }}
                    >
                      <div
                        className="small"
                        style={{ opacity: 0.7, fontWeight: 700 }}
                      >
                        {fmtDate(ev.date)}
                      </div>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: "0.9rem",
                          marginTop: "2px",
                        }}
                      >
                        {ev.title}
                      </div>
                      {(ev.start_time || ev.end_time) && (
                        <div
                          className="small"
                          style={{ opacity: 0.7, marginTop: "2px" }}
                        >
                          {fmtTime(ev.start_time) || "—"} –{" "}
                          {fmtTime(ev.end_time) || "—"}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
