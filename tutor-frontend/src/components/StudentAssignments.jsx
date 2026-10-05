/**
 * StudentAssignments.jsx — Student Assignment View & Submission
 *
 * Flow:
 * 1. Lists all assignments published by teachers
 * 2. Shows deadline status (Open / Expired) and submission status
 * 3. Student uploads a PDF answer before the deadline
 * 4. Student can re-submit before deadline (replaces old file)
 * 5. Download own submitted PDF or the teacher's question PDF
 *
 * API endpoints used (all require Bearer token):
 *   GET   /api/assignments/student/                — list assignments + own submission
 *   POST  /api/assignments/<id>/submit/            — upload answer PDF (multipart, field 'pdf')
 *   GET   /api/assignments/<id>/pdf/               — download teacher's question PDF
 *   GET   /api/submissions/<id>/pdf/               — download own submission PDF
 */

import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { showSuccess, showError } from "../utils/toast";

const API_BASE = "http://localhost:8000/api";

const StudentAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Per-assignment upload state (so multiple cards can each track their own file)
  const [files, setFiles] = useState({}); // { [assignmentId]: File }
  const [uploadingId, setUploadingId] = useState(null); // which assignment is uploading

  const token = localStorage.getItem("token");
  const authHeader = { Authorization: `Bearer ${token}` };

  // ── Load assignments ─────────────────────────────────────────────────────
  const fetchAssignments = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/assignments/student/`, {
        headers: authHeader,
      });
      setAssignments(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Failed to fetch assignments", e);
      showError("Could not load assignments.");
    } finally {
      setLoading(false);
    }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // ── File input handler ───────────────────────────────────────────────────
  const handleFileChange = (assignmentId, file) => {
    setFiles((prev) => ({ ...prev, [assignmentId]: file }));
  };

  // ── Submit (or re-submit) ────────────────────────────────────────────────
  const handleSubmit = async (assignment) => {
    const file = files[assignment.id];
    if (!file) {
      showError("Please choose a PDF file to upload.");
      return;
    }
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      showError("Only PDF files are allowed.");
      return;
    }

    const formData = new FormData();
    formData.append("pdf", file);

    try {
      setUploadingId(assignment.id);
      await axios.post(
        `${API_BASE}/assignments/${assignment.id}/submit/`,
        formData,
        { headers: { ...authHeader, "Content-Type": "multipart/form-data" } },
      );
      showSuccess(
        assignment.submission ? "Re-submitted successfully!" : "Assignment submitted!",
      );
      // Clear the picked file for this assignment
      setFiles((prev) => {
        const next = { ...prev };
        delete next[assignment.id];
        return next;
      });
      // Reset the file input visually
      const inputEl = document.getElementById(`student-assignment-file-${assignment.id}`);
      if (inputEl) inputEl.value = "";
      fetchAssignments();
    } catch (err) {
      showError(err.response?.data?.msg || "Submission failed");
    } finally {
      setUploadingId(null);
    }
  };

  // ── Deadline label helper ────────────────────────────────────────────────
  const deadlineLabel = (deadline, isPast) => {
    const d = new Date(deadline);
    return (
      <span
        style={{
          fontSize: "0.78rem",
          color: isPast ? "#ef4444" : "#22c55e",
          fontWeight: 600,
        }}
      >
        {isPast ? "⏰ Expired" : "⏳ Deadline"} —{" "}
        {d.toLocaleDateString()}{" "}
        {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </span>
    );
  };

  // ── Status badge helper ──────────────────────────────────────────────────
  const statusBadge = (status) => {
    const map = {
      submitted: { text: "✅ Submitted", bg: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.35)" },
      pending:   { text: "⏳ Pending",   bg: "rgba(234,179,8,0.15)", color: "#eab308", border: "1px solid rgba(234,179,8,0.35)" },
      overdue:   { text: "❌ Overdue",   bg: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.35)" },
    };
    const s = map[status] || map.pending;
    return (
      <span
        className="status-badge"
        style={{
          background: s.bg,
          color: s.color,
          border: s.border,
          padding: "4px 12px",
          borderRadius: "20px",
          fontSize: "0.75rem",
          fontWeight: 700,
          whiteSpace: "nowrap",
        }}
      >
        {s.text}
      </span>
    );
  };

  // ── Render ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="card card-modern" style={{ padding: "60px", textAlign: "center", opacity: 0.7 }}>
        Loading assignments...
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      <div>
        <h3 style={{ marginBottom: "6px" }}>📋 Your Assignments ({assignments.length})</h3>
        <p className="small" style={{ opacity: 0.7 }}>
          Download the question paper, submit your answer PDF before the deadline.
        </p>
      </div>

      {assignments.length === 0 ? (
        <div
          className="card card-modern"
          style={{
            padding: "50px",
            textAlign: "center",
            opacity: 0.7,
            border: "2px dashed var(--border)",
          }}
        >
          No assignments published yet. Check back later!
        </div>
      ) : (
        assignments.map((a) => {
          const sub = a.submission; // null or { id, submitted_at, pdf_url, status }
          const status = a.submission_status; // 'pending' | 'submitted' | 'overdue'
          const isOpen = !a.is_past_deadline;
          const pickedFile = files[a.id];
          const isUploading = uploadingId === a.id;

          return (
            <div key={a.id} className="card card-modern hover-lift" style={{ padding: "20px" }}>
              {/* Header row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: "240px" }}>
                  <div style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: "4px" }}>
                    {a.title}
                  </div>
                  {a.description && (
                    <div className="small" style={{ opacity: 0.75, marginBottom: "8px" }}>
                      {a.description}
                    </div>
                  )}
                  <div style={{ marginBottom: "6px" }}>
                    {deadlineLabel(a.deadline, a.is_past_deadline)}
                  </div>
                  <div className="small" style={{ opacity: 0.6 }}>
                    👨‍🏫 {a.teacher_name}
                  </div>
                </div>
                <div>{statusBadge(status)}</div>
              </div>

              {/* Question PDF download */}
              <div style={{ marginTop: "14px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <a
                  href={`${API_BASE}${a.pdf_url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-modern btn-outline-modern"
                  style={{ padding: "6px 14px", fontSize: "0.82rem" }}
                >
                  📄 Download Question Paper
                </a>

                {sub && (
                  <a
                    href={`${API_BASE}${sub.pdf_url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-modern btn-outline-modern"
                    style={{ padding: "6px 14px", fontSize: "0.82rem" }}
                  >
                    📥 Download My Submission
                  </a>
                )}
              </div>

              {/* Submission status detail */}
              {sub && (
                <div className="small" style={{ marginTop: "10px", opacity: 0.7 }}>
                  Submitted at:{" "}
                  <strong>{new Date(sub.submitted_at).toLocaleString()}</strong>
                </div>
              )}

              {/* Upload form — only if open deadline */}
              {isOpen ? (
                <div
                  style={{
                    marginTop: "16px",
                    paddingTop: "16px",
                    borderTop: "1px solid var(--border)",
                    display: "flex",
                    gap: "10px",
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <input
                    id={`student-assignment-file-${a.id}`}
                    type="file"
                    accept=".pdf"
                    className="input input-modern"
                    style={{ flex: 1, minWidth: "220px" }}
                    onChange={(e) => handleFileChange(a.id, e.target.files[0])}
                  />
                  <button
                    className="btn btn-modern btn-gradient"
                    style={{ padding: "10px 20px" }}
                    disabled={isUploading || !pickedFile}
                    onClick={() => handleSubmit(a)}
                  >
                    {isUploading
                      ? "Uploading..."
                      : sub
                        ? "🔁 Re-submit"
                        : "📤 Submit Assignment"}
                  </button>
                </div>
              ) : (
                <div
                  className="small"
                  style={{
                    marginTop: "14px",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.25)",
                    color: "#ef4444",
                  }}
                >
                  ⏰ Deadline has passed — submissions are closed.
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default StudentAssignments;