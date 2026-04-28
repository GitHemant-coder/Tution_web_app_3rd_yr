import React, { useState, useEffect } from "react";
import { get, put } from "../../api/api";
import { Check, X, FileText } from "lucide-react";
import { toast } from "react-toastify";

export default function AdminNotes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotes();
    const interval = setInterval(fetchNotes, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchNotes = async () => {
    try {
      const data = await get("/admin/notes/pending", true);
      setNotes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (id, status) => {
    try {
      await put(`/admin/notes/${id}/approve`, { status }, true);
      toast.success(`Note ${status} successfully`);
      fetchNotes();
    } catch (err) {
      toast.error("Process failed");
    }
  };

  if (loading) return <div>Loading pending notes...</div>;

  return (
    <div className="page-enter-active">
      <h2 style={{ marginBottom: "30px" }}>Approve Study Material</h2>
      {notes.length === 0 ? (
        <div
          className="card card-modern fade-in"
          style={{ textAlign: "center", color: "#64748b" }}
        >
          <FileText
            size={48}
            style={{ margin: "0 auto 20px", opacity: "0.5" }}
          />
          <p>No pending notes to review.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "20px" }}>
          {notes.map((note) => (
            <div
              key={note._id}
              className="card card-modern hover-lift slide-in-top delay-100"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h3 style={{ fontSize: "1.2rem", marginBottom: "5px" }}>
                  {note.title}
                </h3>
                <p className="small">
                  Uploaded by: <strong>{note.uploadedBy?.name}</strong>
                </p>
                <p style={{ marginTop: "10px", color: "#475569" }}>
                  {note.content}
                </p>
              </div>
              <div style={{ display: "flex", gap: "15px" }}>
                <button
                  onClick={() => handleApproval(note._id, "approved")}
                  className="btn btn-modern btn-gradient"
                  style={{ background: "#10b981", boxShadow: "none" }}
                >
                  <Check size={18} /> Approve
                </button>
                <button
                  onClick={() => handleApproval(note._id, "rejected")}
                  className="btn btn-modern btn-outline-modern"
                  style={{ color: "#ef4444", background: "#fee2e2" }}
                >
                  <X size={18} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
