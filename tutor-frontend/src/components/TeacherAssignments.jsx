import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { showSuccess, showError } from "../utils/toast";

const API_BASE = "http://localhost:8000/api";

/**
 * TeacherAssignments — shown inside TeacherDashboard under the "📋 Assignments" tab.
 *
 * Features:
 *  - Form to create a new assignment (title, description, deadline, PDF upload)
 *  - List of all assignments the teacher has created
 *  - Delete an assignment
 *  - Click "View Submissions" to see which students submitted and download their PDFs
 */
const TeacherAssignments = () => {
  // ── State ─────────────────────────────────────────────────────────────────
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state for creating a new assignment
  const [form, setForm] = useState({
    title: "",
    description: "",
    deadline: "",
  });
  const [pdfFile, setPdfFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Which assignment's submissions panel is open (null = none)
  const [viewSubmissions, setViewSubmissions] = useState(null); // { assignment, submissions }

  // ── Token helper ──────────────────────────────────────────────────────────
  const token = localStorage.getItem("token");
  const authHeader = { Authorization: `Bearer ${token}` };

  // ── Load assignments ───────────────────────────────────────────────────────
  const fetchAssignments = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/assignments/`, { headers: authHeader });
      setAssignments(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Failed to fetch assignments", e);
    } finally {
      setLoading(false);
    }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // ── Create assignment ──────────────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return showError("Title is required");
    if (!form.deadline) return showError("Deadline is required");
    if (!pdfFile) return showError("Please attach an assignment PDF");

    const formData = new FormData();
    formData.append("title", form.title);
    formData.append("description", form.description);
    formData.append("deadline", form.deadline);
    formData.append("pdf", pdfFile);

    try {
      setSubmitting(true);
      await axios.post(`${API_BASE}/assignments/`, formData, {
        headers: { ...authHeader, "Content-Type": "multipart/form-data" },
      });
      showSuccess("Assignment published to students!");
      setForm({ title: "", description: "", deadline: "" });
      setPdfFile(null);
      // Reset file input
      document.getElementById("teacher-assignment-pdf-input").value = "";
      fetchAssignments();
    } catch (err) {
      showError(err.response?.data?.msg || "Failed to create assignment");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete assignment ──────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this assignment? This will also remove all student submissions.")) return;
    try {
      await axios.delete(`${API_BASE}/assignments/${id}/delete/`, { headers: authHeader });
      showSuccess("Assignment deleted");
      fetchAssignments();
      if (viewSubmissions?.assignment?.id === id) setViewSubmissions(null);
    } catch (err) {
      showError(err.response?.data?.msg || "Delete failed");
    }
  };

  // ── View submissions for one assignment ───────────────────────────────────
  const handleViewSubmissions = async (assignment) => {
    if (viewSubmissions?.assignment?.id === assignment.id) {
      // Toggle off
      setViewSubmissions(null);
      return;
    }
    try {
      const res = await axios.get(`${API_BASE}/assignments/${assignment.id}/submissions/`, {
        headers: authHeader,
      });
      setViewSubmissions({ assignment, submissions: res.data.submissions || [] });
    } catch (err) {
      showError("Failed to load submissions");
    }
  };

  // ── Status badge helper ────────────────────────────────────────────────────
  const deadlineLabel = (deadline, isPast) => {
    const d = new Date(deadline);
    return (
      <span style={{
        fontSize: "0.75rem",
        color: isPast ? "#ef4444" : "#22c55e",
        fontWeight: 600,
      }}>
        {isPast ? "⏰ Expired" : "⏳ Open"} — {d.toLocaleDateString()} {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </span>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

      {/* ── Create Assignment Form ─────────────────────────────────────── */}
      <div className="card card-modern slide-in-left delay-300">
        <h3 style={{ marginBottom: "20px" }}>📋 Create New Assignment</h3>
        <form className="form" onSubmit={handleCreate}>
          <div className="form-group">
            <label className="form-label">Assignment Title *</label>
            <input
              className="input input-modern"
              placeholder="e.g. Chapter 4 – Newton's Laws of Motion"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Instructions / Description</label>
            <textarea
              className="input input-modern"
              rows={3}
              placeholder="What should the student do? Any special instructions..."
              value={form.description}
              style={{ resize: "vertical" }}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Submission Deadline *</label>
            {/* datetime-local gives a date+time picker — no extra library needed */}
            <input
              type="datetime-local"
              className="input input-modern"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Assignment PDF (Question Paper) *</label>
            <input
              id="teacher-assignment-pdf-input"
              type="file"
              accept=".pdf"
              className="input input-modern"
              onChange={(e) => setPdfFile(e.target.files[0])}
            />
            <span className="small" style={{ opacity: 0.6 }}>Only PDF files are accepted.</span>
          </div>

          <button
            type="submit"
            className="btn btn-modern btn-gradient"
            style={{ width: "100%", marginTop: "6px" }}
            disabled={submitting}
          >
            {submitting ? "Publishing..." : "📤 Publish Assignment to Students"}
          </button>
        </form>
      </div>

      {/* ── Assignment List ────────────────────────────────────────────────── */}
      <div className="card card-modern">
        <h3 style={{ marginBottom: "20px" }}>📚 Your Assignments ({assignments.length})</h3>

        {loading ? (
          <p className="small" style={{ opacity: 0.6 }}>Loading...</p>
        ) : assignments.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", opacity: 0.7, border: "2px dashed var(--border)", borderRadius: "12px" }}>
            <p style={{ margin: 0 }}>You haven't created any assignments yet.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {assignments.map((a) => (
              <div key={a.id}>
                {/* Assignment card */}
                <div
                  className="card card-modern hover-lift"
                  style={{ padding: "16px 20px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "4px" }}>{a.title}</div>
                    {a.description && (
                      <div className="small" style={{ opacity: 0.7, marginBottom: "6px" }}>{a.description}</div>
                    )}
                    <div style={{ marginBottom: "6px" }}>{deadlineLabel(a.deadline, a.is_past_deadline)}</div>
                    <div className="small" style={{ opacity: 0.6 }}>
                      👤 {a.submission_count} submission{a.submission_count !== 1 ? "s" : ""}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                    {/* Download question PDF */}
                    <a
                      href={`${API_BASE}${a.pdf_url}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-modern btn-outline-modern"
                      style={{ padding: "6px 14px", fontSize: "0.82rem" }}
                      onClick={(e) => {
                        // Attach token via fetch instead (because anchor can't set headers)
                        // The backend accepts authenticated requests — open in new tab for now
                      }}
                    >
                      📄 Download PDF
                    </a>

                    <button
                      className="btn btn-modern btn-outline-modern"
                      style={{ padding: "6px 14px", fontSize: "0.82rem" }}
                      onClick={() => handleViewSubmissions(a)}
                    >
                      {viewSubmissions?.assignment?.id === a.id ? "🔽 Hide Submissions" : "📬 View Submissions"}
                    </button>

                    <button
                      className="btn btn-modern"
                      style={{ padding: "6px 14px", fontSize: "0.82rem", background: "#ef4444", color: "white" }}
                      onClick={() => handleDelete(a.id)}
                    >
                      🗑 Delete
                    </button>
                  </div>
                </div>

                {/* Expandable submissions panel */}
                {viewSubmissions?.assignment?.id === a.id && (
                  <div
                    className="card card-modern"
                    style={{ marginTop: "8px", marginLeft: "20px", padding: "16px", border: "1px solid var(--border)" }}
                  >
                    <h4 style={{ margin: "0 0 12px 0" }}>📬 Student Submissions for "{a.title}"</h4>
                    {viewSubmissions.submissions.length === 0 ? (
                      <p className="small" style={{ opacity: 0.6 }}>No students have submitted yet.</p>
                    ) : (
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
                        <thead>
                          <tr style={{ borderBottom: "2px solid var(--border)" }}>
                            <th style={{ textAlign: "left", padding: "8px 10px" }}>Student</th>
                            <th style={{ textAlign: "left", padding: "8px 10px" }}>Submitted At</th>
                            <th style={{ textAlign: "left", padding: "8px 10px" }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {viewSubmissions.submissions.map((s) => (
                            <tr key={s.id} style={{ borderBottom: "1px solid var(--border)" }}>
                              <td style={{ padding: "8px 10px", fontWeight: 600 }}>{s.student_name}</td>
                              <td style={{ padding: "8px 10px", opacity: 0.7 }}>
                                {new Date(s.submitted_at).toLocaleString()}
                              </td>
                              <td style={{ padding: "8px 10px" }}>
                                <a
                                  href={`${API_BASE}${s.pdf_url}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="btn btn-modern btn-outline-modern"
                                  style={{ padding: "4px 12px", fontSize: "0.8rem" }}
                                >
                                  📥 Download
                                </a>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherAssignments;
