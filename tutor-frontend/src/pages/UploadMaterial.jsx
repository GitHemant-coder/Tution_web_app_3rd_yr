import React, { useState } from "react";
import axios from "axios";
import { showSuccess, showError } from "../utils/toast";
import '../App.css';

const UploadMaterial = () => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    subject: "Mathematics",
    type: "Video"
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const API_BASE = 'http://localhost:8000/api';

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!form.title || !file) {
      showError("Please provide a title and select a file.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("title", form.title);
    formData.append("description", form.description);
    formData.append("subject", form.subject);
    formData.append("type", form.type);
    formData.append("file", file);

    try {
      const res = await axios.post(`${API_BASE}/upload-material/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      showSuccess(res.data.message);
      setForm({ title: "", description: "", subject: "Mathematics", type: "Video" });
      setFile(null);
    } catch (err) {
      console.error("Error uploading material:", err);
      showError("Upload failed. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container page-enter-active">
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem' }}>Upload Study Portal</h1>
        <p className="hero-subtitle">Share your expert knowledge with students.</p>
      </header>

      <div className="card card-modern hover-lift slide-in-bottom delay-100" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h3 style={{ marginBottom: '24px' }}>Submit New Material</h3>
        
        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '8px' }}>Material Title</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="E.g., Intro to Linear Algebra"
              className="input-modern"
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '8px' }}>Subject</label>
              <select name="subject" value={form.subject} onChange={handleChange} className="form-control" style={{ width: '100%' }}>
                <option value="Mathematics">Mathematics</option>
                <option value="Science">Science</option>
                <option value="English">English</option>
                <option value="History">History</option>
                <option value="Computer Science">Computer Science</option>
              </select>
            </div>
            <div>
              <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '8px' }}>Content Type</label>
              <select name="type" value={form.type} onChange={handleChange} className="form-control" style={{ width: '100%' }}>
                <option value="Video">Video Lecture</option>
                <option value="PDF">PDF Notes</option>
              </select>
            </div>
          </div>

          <div>
            <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '8px' }}>Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Tell students what they will learn..."
              className="input-modern"
              rows="4"
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          <div>
            <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '8px' }}>Upload File</label>
            <input
              type="file"
              onChange={handleFileChange}
              className="input-modern"
              style={{ width: '100%' }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-modern btn-gradient"
            style={{ padding: '12px', marginTop: '10px' }}
            disabled={loading}
          >
            {loading ? 'Processing Upload...' : 'Publish to Students'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadMaterial;
