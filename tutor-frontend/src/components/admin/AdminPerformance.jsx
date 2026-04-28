import React, { useState, useEffect } from "react";
import { get, post } from "../../api/api";

import { Trophy, Plus, Save, X, Edit2, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { put, remove } from "../../api/api";

export default function AdminPerformance() {
  const [records, setRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editMode, setEditMode] = useState(null); // stores the _id of the record being edited
  const [formData, setFormData] = useState({
    student: "",
    subject: "",
    score: "",
    maxScore: "",
    remarks: "",
  });

  useEffect(() => {
    fetchPerformance();
    fetchStudents();
  }, []);

  const fetchPerformance = async () => {
    try {
      const data = await get("/admin/performance", true);
      setRecords(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const data = await get("/admin/students", true);
      setStudents(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await put(`/admin/performance/${editMode}`, formData, true);
        toast.success("Performance record updated!");
      } else {
        await post("/admin/performance", formData, true);
        toast.success("Performance record added!");
      }
      setShowAdd(false);
      setEditMode(null);
      setFormData({
        student: "",
        subject: "",
        score: "",
        maxScore: "",
        remarks: "",
      });
      fetchPerformance();
    } catch (err) {
      toast.error(err.msg || err.error || "Failed to save record");
    }
  };

  const handleEdit = (record) => {
    setFormData({
      student: record.student._id,
      subject: record.subject,
      score: record.score,
      maxScore: record.maxScore,
      remarks: record.remarks || "",
    });
    setEditMode(record._id);
    setShowAdd(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      await remove(`/admin/performance/${id}`, true);
      toast.success("Record deleted successfully!");
      fetchPerformance();
    } catch (err) {
      toast.error(err.msg || "Failed to delete record");
    }
  };

  if (loading) return <div>Loading performance data...</div>;

  return (
    <div className="page-enter-active">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
        }}
      >
        <h2 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Trophy size={28} className="text-primary" /> Student Performance
        </h2>
        <button
          className="btn btn-modern btn-gradient"
          onClick={() => {
            setShowAdd(!showAdd);
            if (showAdd) {
              setEditMode(null);
              setFormData({
                student: "",
                subject: "",
                score: "",
                maxScore: "",
                remarks: "",
              });
            }
          }}
        >
          {showAdd ? <X size={18} /> : <Plus size={18} />}{" "}
          {showAdd ? "Cancel" : editMode ? "Cancel Edit" : "Add Record"}
        </button>
      </div>

      {showAdd && (
        <div
          className="card card-modern fade-in"
          style={{
            marginBottom: "30px",
            borderTop: "4px solid var(--primary)",
          }}
        >
          <h4 style={{ marginBottom: "20px" }}>
            {editMode ? "Update" : "Entry"} Performance Details
          </h4>
          <form
            onSubmit={handleSubmit}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr 1fr",
              gap: "15px",
            }}
          >
            <div>
              <label className="small">Student</label>
              <select
                className="input-modern"
                required
                value={formData.student}
                onChange={(e) =>
                  setFormData({ ...formData, student: e.target.value })
                }
              >
                <option value="">Select Student</option>
                {students.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="small">Subject</label>
              <input
                type="text"
                className="input-modern"
                placeholder="Math, Science..."
                required
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
              />
            </div>
            <div>
              <label className="small">Score</label>
              <input
                type="number"
                className="input-modern"
                placeholder="85"
                required
                value={formData.score}
                onChange={(e) =>
                  setFormData({ ...formData, score: e.target.value })
                }
              />
            </div>
            <div>
              <label className="small">Max Score</label>
              <input
                type="number"
                className="input-modern"
                placeholder="100"
                required
                value={formData.maxScore}
                onChange={(e) =>
                  setFormData({ ...formData, maxScore: e.target.value })
                }
              />
            </div>
            <div style={{ gridColumn: "span 3" }}>
              <label className="small">Remarks</label>
              <input
                type="text"
                className="input-modern"
                placeholder="Excellent progress..."
                value={formData.remarks}
                onChange={(e) =>
                  setFormData({ ...formData, remarks: e.target.value })
                }
              />
            </div>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button
                type="submit"
                className="btn btn-modern btn-gradient"
                style={{ width: "100%", height: "45px" }}
              >
                <Save size={18} /> Save Record
              </button>
            </div>
          </form>
        </div>
      )}

      <div
        className="card card-modern slide-in-top delay-100"
        style={{ padding: "0", overflow: "hidden" }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#f8fafc" }}>
            <tr>
              <th style={{ padding: "20px", textAlign: "left" }}>Student</th>
              <th style={{ padding: "20px", textAlign: "left" }}>Subject</th>
              <th style={{ padding: "20px", textAlign: "left" }}>Score</th>
              <th style={{ padding: "20px", textAlign: "left" }}>Percentage</th>
              <th style={{ padding: "20px", textAlign: "left" }}>Remarks</th>
              <th style={{ padding: "20px", textAlign: "left" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  style={{ padding: "20px", textAlign: "center" }}
                >
                  No records found
                </td>
              </tr>
            ) : (
              records.map((r) => (
                <tr key={r._id} style={{ borderTop: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "20px" }}>{r.student?.name}</td>
                  <td style={{ padding: "20px" }}>
                    <span
                      className="status-badge"
                      style={{ background: "#eef2ff", color: "#4f46e5" }}
                    >
                      {r.subject}
                    </span>
                  </td>
                  <td style={{ padding: "20px" }}>
                    {r.score} / {r.maxScore}
                  </td>
                  <td style={{ padding: "20px", fontWeight: "bold" }}>
                    {((r.score / r.maxScore) * 100).toFixed(1)}%
                  </td>
                  <td
                    style={{
                      padding: "20px",
                      fontSize: "0.85rem",
                      color: "#64748b",
                    }}
                  >
                    {r.remarks || "---"}
                  </td>
                  <td style={{ padding: "20px" }}>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button
                        onClick={() => handleEdit(r)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#4f46e5",
                        }}
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(r._id)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#ef4444",
                        }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
