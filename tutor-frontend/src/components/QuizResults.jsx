/**
 * QuizResults.jsx — Teacher Quiz Results & Integrity Viewer
 *
 * Shows a teacher:
 * - All quizzes they've created (dropdown selector)
 * - For the selected quiz: all student attempts with scores
 * - Integrity metrics: tab switches, fullscreen exits, window blurs, time away
 * - Status: NORMAL or REVIEW_RECOMMENDED
 * - Expandable rows showing individual integrity events with timestamps
 *
 * Teacher only sees their own quizzes (backend enforces this).
 */

import React, { useEffect, useState } from "react";
import { get } from "../api/api";
import { showError } from "../utils/toast";
import "../App.css";

export default function QuizResults() {
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuizId, setSelectedQuizId] = useState("");
  const [report, setReport] = useState(null); // { quiz_title, results: [...] }
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null); // attempt_id of expanded row

  // ── Load teacher's own quizzes on mount ──────────────────────────────
  useEffect(() => {
    fetchMyQuizzes();
  }, []);

  const fetchMyQuizzes = async () => {
    try {
      setLoadingQuizzes(true);
      const data = await get("/quizzes/", true);
      // Backend already filters by teacher=user for teacher role
      setQuizzes(data || []);
      if (data && data.length > 0) {
        setSelectedQuizId(data[0].id);
      }
    } catch (err) {
      showError("Failed to load your quizzes.");
    } finally {
      setLoadingQuizzes(false);
    }
  };

  // ── Fetch results when a quiz is selected ────────────────────────────
  useEffect(() => {
    if (selectedQuizId) {
      fetchReport(selectedQuizId);
    } else {
      setReport(null);
    }
    // eslint-disable-next-line
  }, [selectedQuizId]);

  const fetchReport = async (quizId) => {
    try {
      setLoadingReport(true);
      setExpandedRow(null);
      const data = await get(`/quizzes/${quizId}/results/`, true);
      setReport(data);
    } catch (err) {
      showError("Failed to load quiz results.");
      setReport(null);
    } finally {
      setLoadingReport(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <div className="card card-modern" style={{ padding: "28px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div>
          <h3 style={{ margin: 0 }}>📊 Student Marks & Integrity Report</h3>
          <p className="small" style={{ opacity: 0.7, marginTop: "6px" }}>
            View scores and screen-exit activity for quizzes you've created.
          </p>
        </div>

        {/* Quiz selector */}
        <div style={{ minWidth: "260px" }}>
          <label className="form-label" style={{ marginBottom: "6px" }}>
            Select Quiz
          </label>
          {loadingQuizzes ? (
            <div className="small" style={{ opacity: 0.6 }}>
              Loading quizzes...
            </div>
          ) : quizzes.length === 0 ? (
            <div className="small" style={{ opacity: 0.6 }}>
              You haven't created any quizzes yet.
            </div>
          ) : (
            <select
              className="input input-modern"
              value={selectedQuizId}
              onChange={(e) => setSelectedQuizId(Number(e.target.value))}
            >
              {quizzes.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.title} ({q.subject}) — {q.question_count} Qs
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Body */}
      {loadingReport ? (
        <div
          className="card card-modern pulse"
          style={{ padding: "60px", textAlign: "center", opacity: 0.7 }}
        >
          Loading results...
        </div>
      ) : !report ? (
        <div
          className="card card-modern"
          style={{ padding: "60px", textAlign: "center", opacity: 0.6 }}
        >
          {quizzes.length === 0
            ? "Create a quiz first to see student results here."
            : "Select a quiz to view results."}
        </div>
      ) : report.results.length === 0 ? (
        <div
          className="card card-modern"
          style={{ padding: "60px", textAlign: "center", opacity: 0.6 }}
        >
          No attempts yet for <strong>{report.quiz_title}</strong>.
        </div>
      ) : (
        <>
          {/* Summary chips */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              marginBottom: "20px",
              flexWrap: "wrap",
            }}
          >
            <div
              className="card card-modern"
              style={{
                padding: "10px 20px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span style={{ fontWeight: 700, fontSize: "1.3rem" }}>
                {report.results.length}
              </span>
              <span className="small" style={{ opacity: 0.7 }}>
                Total Attempts
              </span>
            </div>
            <div
              className="card card-modern"
              style={{
                padding: "10px 20px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  fontSize: "1.3rem",
                  color: "#eab308",
                }}
              >
                {
                  report.results.filter(
                    (r) => r.integrity.status === "REVIEW_RECOMMENDED",
                  ).length
                }
              </span>
              <span className="small" style={{ opacity: 0.7 }}>
                ⚠️ Review Recommended
              </span>
            </div>
            <div
              className="card card-modern"
              style={{
                padding: "10px 20px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  fontSize: "1.3rem",
                  color: "#22c55e",
                }}
              >
                {
                  report.results.filter((r) => r.integrity.status === "NORMAL")
                    .length
                }
              </span>
              <span className="small" style={{ opacity: 0.7 }}>
                ✅ Normal
              </span>
            </div>
          </div>

          {/* Results table */}
          <div
            className="card card-modern"
            style={{ padding: "0", overflow: "auto" }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "780px",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "rgba(56,189,248,0.08)",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  {[
                    "Student",
                    "Score",
                    "Tab Switches",
                    "Fullscreen Exits",
                    "Window Blurs",
                    "Time Away",
                    "Status",
                    "Details",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "14px 16px",
                        textAlign: "left",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        opacity: 0.7,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.results.map((r) => {
                  const ig = r.integrity;
                  const isReview = ig.status === "REVIEW_RECOMMENDED";
                  const isExpanded = expandedRow === r.attempt_id;

                  return (
                    <React.Fragment key={r.attempt_id}>
                      <tr
                        style={{
                          borderBottom: "1px solid var(--border)",
                          transition: "background 0.2s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "rgba(255,255,255,0.02)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <td style={{ padding: "14px 16px", fontWeight: 600 }}>
                          {r.student_name}
                        </td>

                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ fontWeight: 700 }}>{r.score}</span>
                          <span style={{ opacity: 0.5 }}>/{r.total_marks}</span>
                          {r.total_marks > 0 && (
                            <div className="small" style={{ opacity: 0.6 }}>
                              {Math.round((r.score / r.total_marks) * 100)}%
                            </div>
                          )}
                        </td>

                        <td style={{ padding: "14px 16px" }}>
                          <span
                            style={{
                              color:
                                ig.tab_switches > 0 ? "#eab308" : "inherit",
                              fontWeight: ig.tab_switches > 0 ? 700 : 400,
                            }}
                          >
                            {ig.tab_switches}
                          </span>
                        </td>

                        <td style={{ padding: "14px 16px" }}>
                          <span
                            style={{
                              color:
                                ig.fullscreen_exits > 0 ? "#eab308" : "inherit",
                              fontWeight: ig.fullscreen_exits > 0 ? 700 : 400,
                            }}
                          >
                            {ig.fullscreen_exits}
                          </span>
                        </td>

                        <td style={{ padding: "14px 16px" }}>
                          <span
                            style={{
                              color:
                                ig.window_blurs > 0 ? "#eab308" : "inherit",
                              fontWeight: ig.window_blurs > 0 ? 700 : 400,
                            }}
                          >
                            {ig.window_blurs}
                          </span>
                        </td>

                        <td style={{ padding: "14px 16px" }}>
                          {ig.total_time_away > 0 ? (
                            <span style={{ color: "#eab308", fontWeight: 700 }}>
                              {ig.total_time_away}s
                            </span>
                          ) : (
                            <span style={{ opacity: 0.5 }}>0s</span>
                          )}
                        </td>

                        <td style={{ padding: "14px 16px" }}>
                          <span
                            className={`status-badge ${isReview ? "" : "status-success"}`}
                            style={
                              isReview
                                ? {
                                    background: "rgba(234,179,8,0.15)",
                                    color: "#eab308",
                                    border: "1px solid rgba(234,179,8,0.3)",
                                    whiteSpace: "nowrap",
                                  }
                                : { whiteSpace: "nowrap" }
                            }
                          >
                            {isReview ? "⚠️ Review" : "✅ Normal"}
                          </span>
                        </td>

                        <td style={{ padding: "14px 16px" }}>
                          {ig.events.length > 0 ? (
                            <button
                              className="btn btn-modern btn-outline-modern"
                              style={{
                                padding: "4px 12px",
                                fontSize: "0.75rem",
                              }}
                              onClick={() =>
                                setExpandedRow(isExpanded ? null : r.attempt_id)
                              }
                            >
                              {isExpanded ? "Hide" : "Show"} ({ig.events.length}
                              )
                            </button>
                          ) : (
                            <span style={{ opacity: 0.4, fontSize: "0.8rem" }}>
                              No events
                            </span>
                          )}
                        </td>
                      </tr>

                      {/* Expanded: individual integrity events */}
                      {isExpanded && ig.events.length > 0 && (
                        <tr>
                          <td
                            colSpan={8}
                            style={{
                              padding: "0 16px 16px 48px",
                              background: "rgba(234,179,8,0.04)",
                            }}
                          >
                            <div style={{ paddingTop: "12px" }}>
                              <p
                                className="small"
                                style={{
                                  fontWeight: 700,
                                  marginBottom: "8px",
                                  opacity: 0.7,
                                }}
                              >
                                INTEGRITY EVENTS FOR{" "}
                                {r.student_name.toUpperCase()}
                              </p>
                              <table
                                style={{
                                  width: "100%",
                                  borderCollapse: "collapse",
                                }}
                              >
                                <thead>
                                  <tr>
                                    {[
                                      "Event Type",
                                      "Timestamp",
                                      "Duration Away",
                                    ].map((h) => (
                                      <th
                                        key={h}
                                        style={{
                                          textAlign: "left",
                                          padding: "6px 12px",
                                          fontSize: "0.75rem",
                                          opacity: 0.6,
                                        }}
                                      >
                                        {h}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {ig.events.map((ev, idx) => (
                                    <tr
                                      key={idx}
                                      style={{
                                        borderTop: "1px solid var(--border)",
                                      }}
                                    >
                                      <td style={{ padding: "8px 12px" }}>
                                        <span
                                          style={{
                                            fontWeight: 600,
                                            color: "#eab308",
                                          }}
                                        >
                                          {ev.event_type === "TAB_SWITCH" &&
                                            "🔀 Tab Switch"}
                                          {ev.event_type ===
                                            "FULLSCREEN_EXIT" &&
                                            "⛶ Fullscreen Exit"}
                                          {ev.event_type === "WINDOW_BLUR" &&
                                            "🪟 Window Blur"}
                                        </span>
                                      </td>
                                      <td
                                        style={{
                                          padding: "8px 12px",
                                          fontFamily: "monospace",
                                          fontSize: "0.8rem",
                                          opacity: 0.8,
                                        }}
                                      >
                                        {ev.timestamp
                                          ? new Date(
                                              ev.timestamp,
                                            ).toLocaleTimeString()
                                          : "—"}
                                      </td>
                                      <td
                                        style={{
                                          padding: "8px 12px",
                                          opacity: 0.8,
                                        }}
                                      >
                                        {ev.duration_seconds > 0
                                          ? `${Number(ev.duration_seconds).toFixed(1)}s`
                                          : "—"}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
