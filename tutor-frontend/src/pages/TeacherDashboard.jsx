import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { showSuccess, showError } from "../utils/toast";
import "../App.css";
import NotificationList from "../components/shared/NotificationList";

const API_BASE = "http://localhost:8000/api";

const TeacherDashboard = () => {
  const [stats, setStats] = useState({ students_count: 0, materials_count: 0 });
  const [recentMaterials, setRecentMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [activeTab, setActiveTab] = useState("upload"); // 'upload' | 'record'

  // Upload form state
  const [materialForm, setMaterialForm] = useState({ title: "", description: "", subject: "Mathematics", type: "PDF" });
  const [file, setFile] = useState(null);

  // Live recorder state
  const [recForm, setRecForm] = useState({ title: "", description: "", subject: "Mathematics" });
  const [recording, setRecording] = useState(false);
  const [recorded, setRecorded] = useState(null); // Blob
  const [recordedUrl, setRecordedUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const videoPreviewRef = useRef(null);
  const liveStreamRef = useRef(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || user.role !== "teacher") {
      navigate("/login");
      return;
    }
    setTeacher(user);
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_BASE}/teacher-dashboard-sync/`);
      setStats({ students_count: res.data.students_count, materials_count: res.data.materials_count });
      setRecentMaterials(res.data.recent_materials || []);
    } catch (err) {
      console.error("Dashboard Sync Error:", err);
      showError("Failed to sync live data.");
    } finally {
      setLoading(false);
    }
  };

  // ─── File Upload Flow ────────────────────────────────────────────────────
  const handleMaterialUpload = async (e) => {
    e.preventDefault();
    if (!materialForm.title || !file) { showError("Title and File are required."); return; }
    const formData = new FormData();
    formData.append("title", materialForm.title);
    formData.append("description", materialForm.description);
    formData.append("subject", materialForm.subject);
    formData.append("type", materialForm.type);
    formData.append("file", file);
    try {
      setLoading(true);
      await axios.post(`${API_BASE}/upload-material/`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      showSuccess("Material published to students!");
      setMaterialForm({ title: "", description: "", subject: "Mathematics", type: "PDF" });
      setFile(null);
      fetchData();
    } catch { showError("Upload failed."); }
    finally { setLoading(false); }
  };

  // ─── Live Record Flow ─────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: "screen" },
        audio: true,
      });
      liveStreamRef.current = stream;
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play();
      }
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream, { mimeType: "video/webm; codecs=vp8,opus" });
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        setRecorded(blob);
        setRecordedUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
        if (videoPreviewRef.current) videoPreviewRef.current.srcObject = null;
      };
      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch (err) {
      showError("Could not access screen. Please allow screen sharing when prompted.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const uploadRecording = async () => {
    if (!recorded) { showError("No recording found. Please record a session first."); return; }
    if (!recForm.title) { showError("Please add a title for your lecture."); return; }
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `live_lecture_${timestamp}.webm`;
    const formData = new FormData();
    formData.append("title", recForm.title);
    formData.append("description", recForm.description || "Live recorded lecture");
    formData.append("subject", recForm.subject);
    formData.append("type", "Video");
    formData.append("file", recorded, filename);
    try {
      setUploading(true);
      await axios.post(`${API_BASE}/upload-material/`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      showSuccess("🎉 Live lecture published to all students!");
      setRecorded(null);
      setRecordedUrl(null);
      setRecForm({ title: "", description: "", subject: "Mathematics" });
      fetchData();
    } catch { showError("Upload failed. Please try again."); }
    finally { setUploading(false); }
  };

  const discardRecording = () => {
    setRecorded(null);
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedUrl(null);
  };

  if (!teacher) return (
    <div className="app-container page-enter-active">
      <div className="card card-modern pulse" style={{ textAlign: "center", padding: "100px" }}>🔐 Establishing Teacher Session...</div>
    </div>
  );

  return (
    <div className="app-container page-enter-active">
      {/* Header */}
      <header style={{ marginBottom: "40px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "20px" }}>
        <div>
          <h1 style={{ fontSize: "2.8rem", marginBottom: "8px" }}>Teacher Control</h1>
          <p className="hero-subtitle">Welcome back, <strong>{teacher?.name}</strong>! Your classroom is live.</p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <div className="card card-modern hover-lift delay-100" style={{ padding: "12px 24px", textAlign: "center" }}>
            <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--primary)" }}>ACTIVE STUDENTS</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{String(stats.students_count).padStart(2, "0")}</div>
          </div>
          <div className="card card-modern hover-lift delay-200" style={{ padding: "12px 24px", textAlign: "center" }}>
            <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--accent)" }}>ASSETS LIVE</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{String(stats.materials_count).padStart(2, "0")}</div>
          </div>
        </div>
      </header>

      <section style={{ marginBottom: "40px" }}>
        <NotificationList />
      </section>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "28px" }}>
        {[{ id: "upload", label: "📤 Upload Material" }, { id: "record", label: "🔴 Record Live Lecture" }].map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`btn ${activeTab === t.id ? "btn-modern btn-gradient" : "btn-modern btn-outline-modern"}`}
            style={{ borderRadius: "8px 8px 0 0", paddingBottom: "12px" }}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="dashboard-grid">

        {/* ── LEFT: Main Action Panel ─────────────────────────────────────── */}
        {activeTab === "upload" ? (
          <div className="card card-modern slide-in-left delay-300">
            <h3 style={{ marginBottom: "24px" }}>📤 Publish New Material</h3>
            <form className="form" onSubmit={handleMaterialUpload}>
              <div className="form-group">
                <label className="form-label">Material Title</label>
                <input className="input input-modern" placeholder="e.g. Intro to Algebra" value={materialForm.title}
                  onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input className="input input-modern" placeholder="Brief description..." value={materialForm.description}
                  onChange={(e) => setMaterialForm({ ...materialForm, description: e.target.value })} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <select className="input input-modern" value={materialForm.subject} onChange={(e) => setMaterialForm({ ...materialForm, subject: e.target.value })}>
                    {["Mathematics","Science","English","History","Computer Science"].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="input input-modern" value={materialForm.type} onChange={(e) => setMaterialForm({ ...materialForm, type: e.target.value })}>
                    <option value="PDF">PDF Document</option>
                    <option value="Video">Video Lecture</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Upload File</label>
                <input type="file" className="input input-modern" accept=".pdf,.mp4,.webm,.mov"
                  onChange={(e) => setFile(e.target.files[0])} />
              </div>
              <button type="submit" className="btn btn-modern btn-gradient" style={{ width: "100%", marginTop: "10px" }} disabled={loading}>
                {loading ? "Publishing..." : "📡 Broadcast to Students"}
              </button>
            </form>
          </div>
        ) : (
          /* ── RECORD TAB ─────────────────────────────────────────────────── */
          <div className="card card-modern slide-in-left delay-300" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <h3 style={{ marginBottom: "0" }}>🔴 Live Lecture Recorder</h3>
            <p className="small" style={{ opacity: 0.7, marginTop: "0" }}>
              Click "Start Recording" to share your screen and record your lecture. When done, fill in the details and broadcast it to all students instantly.
            </p>

            {/* Video Preview */}
            <div style={{ borderRadius: "12px", overflow: "hidden", background: "#0f172a", minHeight: "200px", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
              {recording && (
                <div style={{ position: "absolute", top: "12px", right: "12px", background: "#ef4444", color: "white", borderRadius: "20px", padding: "4px 12px", fontSize: "0.75rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "white", animation: "pulse 1s infinite" }}></span> LIVE
                </div>
              )}
              {recordedUrl ? (
                <video src={recordedUrl} controls style={{ width: "100%", maxHeight: "250px" }} />
              ) : (
                <video ref={videoPreviewRef} muted style={{ width: "100%", maxHeight: "250px", display: recording ? "block" : "none" }} />
              )}
              {!recording && !recordedUrl && (
                <div style={{ color: "#475569", textAlign: "center" }}>
                  <div style={{ fontSize: "3rem" }}>📹</div>
                  <p className="small">Preview will appear here when recording starts.</p>
                </div>
              )}
            </div>

            {/* Controls */}
            <div style={{ display: "flex", gap: "12px" }}>
              {!recording && !recorded && (
                <button className="btn btn-modern btn-gradient" style={{ flex: 1 }} onClick={startRecording}>
                  🔴 Start Recording
                </button>
              )}
              {recording && (
                <button className="btn btn-modern" style={{ flex: 1, background: "#ef4444", color: "white" }} onClick={stopRecording}>
                  ⏹ Stop Recording
                </button>
              )}
              {recorded && !recording && (
                <button className="btn btn-modern btn-outline-modern" style={{ flex: 1 }} onClick={discardRecording}>
                  🗑 Discard & Re-record
                </button>
              )}
            </div>

            {/* Upload form — shown only when recording is ready */}
            {recorded && !recording && (
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
                <h4 style={{ margin: 0 }}>Add Lecture Details</h4>
                <div className="form-group">
                  <label className="form-label">Lecture Title *</label>
                  <input className="input input-modern" placeholder="e.g. Chapter 3 – Quadratic Equations Live"
                    value={recForm.title} onChange={(e) => setRecForm({ ...recForm, title: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <input className="input input-modern" placeholder="What was covered in this session?"
                    value={recForm.description} onChange={(e) => setRecForm({ ...recForm, description: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <select className="input input-modern" value={recForm.subject} onChange={(e) => setRecForm({ ...recForm, subject: e.target.value })}>
                    {["Mathematics","Science","English","History","Computer Science"].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <button className="btn btn-modern btn-gradient" style={{ width: "100%" }} onClick={uploadRecording} disabled={uploading}>
                  {uploading ? "Uploading to students..." : "📡 Publish Live Lecture to Students"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── RIGHT: Recently Published ────────────────────────────────────── */}
        <div className="card card-modern hover-lift slide-in-right delay-400">
          <h3 style={{ marginBottom: "24px" }}>📖 Recently Published</h3>
          <div style={{ maxHeight: "500px", overflowY: "auto" }}>
            {recentMaterials.length === 0 ? (
              <p className="small" style={{ opacity: 0.5 }}>No materials published yet.</p>
            ) : (
              recentMaterials.map((m, idx) => (
                <div key={idx} className="list-item" style={{ padding: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "1.8rem" }}>{m.type === "Video" ? "🎬" : "📄"}</span>
                    <div>
                      <div style={{ fontWeight: 700 }}>{m.title}</div>
                      <div className="small">Subject: <strong>{m.subject}</strong></div>
                      <div className="small" style={{ opacity: 0.6 }}>{m.date}</div>
                    </div>
                  </div>
                  <span className={`status-badge ${m.type === "Video" ? "status-accent" : "status-success"}`}>
                    {m.type}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default TeacherDashboard;
