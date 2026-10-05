/**
 * QuizIntegrityReport.jsx — Teacher Integrity Report Page
 *
 * Shows a table of all student attempts for a given quiz, with:
 * - Student name, score, tab switches, fullscreen exits, time away
 * - Status: NORMAL or REVIEW_RECOMMENDED
 * - Expandable row to see individual events + timestamps
 *
 * Accessed at: /quiz/:quizId/results (teacher only)
 */

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { get } from "../api/api";
import { showError } from "../utils/toast";
import "../App.css";

export default function QuizIntegrityReport() {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null); // { quiz_title, results: [...] }
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null); // attempt_id of expanded row

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || user.role !== "teacher") {
      navigate("/login");
      return;
    }
    fetchReport();
    // eslint-disable-next-line
  }, [quizId]);

  const fetchReport = async () => {
    try {
      const data = await get(`/quizzes/${quizId}/results/`, true);
      setReport(data);
    } catch (err) {
      showError("Failed to load quiz results.");
      navigate("/teacher-dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        className="app-container page-enter-active"
        style={{ textAlign: "center", paddingTop: "100px" }}
      >
        <div className="card card-modern pulse" style={{ padding: "60px" }}>
          Loading report...
        </div>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="app-container page-enter-active">
      {/* Header */}
      <header style={{ marginBottom: "32px" }}>
        <button
          className="btn btn-modern btn-outline-modern"
          onClick={() => navigate("/teacher-dashboard")}
          style={{ marginBottom: "16px" }}
        >
          ← Back to Dashboard
        </button>
        <h1 style={{ fontSize: "2.2rem", marginBottom: "8px" }}>
          🔍 Integrity Report
        </h1>
        <p className="hero-subtitle">{report.quiz_title}</p>
      </header>

      {/* Summary chips */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "28px",
          flexWrap: "wrap",
        }}
      >
        <div className="card card-modern" style={{ padding: "12px 24px" }}>
          <span style={{ fontWeight: 700 }}>{report.results.length}</span>
          <span className="small" style={{ marginLeft: "8px", opacity: 0.7 }}>
            Total Attempts
          </span>
        </div>
        <div className="card card-modern" style={{ padding: "12px 24px" }}>
          <span style={{ fontWeight: 700, color: "#eab308" }}>
            {
              report.results.filter(
                (r) => r.integrity.status === "REVIEW_RECOMMENDED",
              ).length
            }
          </span>
          <span className="small" style={{ marginLeft: "8px", opacity: 0.7 }}>
            Review Recommended
          </span>
        </div>
        <div className="card card-modern" style={{ padding: "12px 24px" }}>
          <span style={{ fontWeight: 700, color: "#22c55e" }}>
            {
              report.results.filter((r) => r.integrity.status === "NORMAL")
                .length
            }
          </span>
          <span className="small" style={{ marginLeft: "8px", opacity: 0.7 }}>
            Normal
          </span>
        </div>
      </div>

      {report.results.length === 0 ? (
        <div
          className="card card-modern"
          style={{ padding: "60px", textAlign: "center", opacity: 0.6 }}
        >
          No attempts yet for this quiz.
        </div>
      ) : (
        <div
          className="card card-modern"
          style={{ padding: "0", overflow: "hidden" }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
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
                  "Time Away",
                  "Status",
                  "Details",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "14px 16px",
                      textAlign: "left",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      opacity: 0.7,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
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
                      {/* Student name */}
                      <td style={{ padding: "14px 16px", fontWeight: 600 }}>
                        {r.student_name}
                      </td>

                      {/* Score */}
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ fontWeight: 700 }}>{r.score}</span>
                        <span style={{ opacity: 0.5 }}>/{r.total_marks}</span>
                        {r.total_marks > 0 && (
                          <div className="small" style={{ opacity: 0.6 }}>
                            {Math.round((r.score / r.total_marks) * 100)}%
                          </div>
                        )}
                      </td>

                      {/* Tab switches */}
                      <td style={{ padding: "14px 16px" }}>
                        <span
                          style={{
                            color: ig.tab_switches > 0 ? "#eab308" : "inherit",
                            fontWeight: ig.tab_switches > 0 ? 700 : 400,
                          }}
                        >
                          {ig.tab_switches}
                        </span>
                      </td>

                      {/* Fullscreen exits */}
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

                      {/* Time away */}
                      <td style={{ padding: "14px 16px" }}>
                        {ig.total_time_away > 0 ? (
                          <span style={{ color: "#eab308", fontWeight: 700 }}>
                            {ig.total_time_away}s
                          </span>
                        ) : (
                          <span style={{ opacity: 0.5 }}>0s</span>
                        )}
                      </td>

                      {/* Status badge */}
                      <td style={{ padding: "14px 16px" }}>
                        <span
                          className={`status-badge ${isReview ? "" : "status-success"}`}
                          style={
                            isReview
                              ? {
                                  background: "rgba(234,179,8,0.15)",
                                  color: "#eab308",
                                  border: "1px solid rgba(234,179,8,0.3)",
                                }
                              : {}
                          }
                        >
                          {isReview ? "⚠️ Review Recommended" : "✅ Normal"}
                        </span>
                      </td>

                      {/* Expand button */}
                      <td style={{ padding: "14px 16px" }}>
                        {ig.events.length > 0 ? (
                          <button
                            className="btn btn-modern btn-outline-modern"
                            style={{ padding: "4px 12px", fontSize: "0.75rem" }}
                            onClick={() =>
                              setExpandedRow(isExpanded ? null : r.attempt_id)
                            }
                          >
                            {isExpanded ? "Hide" : "Show"} ({ig.events.length})
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
                          colSpan={7}
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
                                        {ev.event_type === "FULLSCREEN_EXIT" &&
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
                                      {new Date(
                                        ev.timestamp,
                                      ).toLocaleTimeString()}
                                    </td>
                                    <td
                                      style={{
                                        padding: "8px 12px",
                                        opacity: 0.8,
                                      }}
                                    >
                                      {ev.duration_seconds > 0
                                        ? `${ev.duration_seconds.toFixed(1)}s`
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
      )}
    </div>
  );
}
