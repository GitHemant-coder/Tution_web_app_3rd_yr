import React, { useEffect, useState } from "react";
import axios from "axios";
import { showSuccess, showError } from "../utils/toast";
import "../App.css";

const ViewStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/students");
      setStudents(res.data);
    } catch (err) {
      console.error("Error fetching students:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (id, currentProgress) => {
    const nextProgress = currentProgress === 'Excellent' ? 'Steady' : (currentProgress === 'Steady' ? 'Needs Attention' : 'Excellent');
    try {
      await axios.put(`http://localhost:5000/api/students/${id}/progress`, { progress: nextProgress });
      showSuccess("Student status updated.");
      fetchStudents();
    } catch (err) {
      showError("Failed to update status.");
    }
  };

  if (loading) return (
    <div className="app-container page-enter-active">
      <div className="card card-modern pulse" style={{ textAlign: 'center', padding: '100px' }}>Loading real-time roster...</div>
    </div>
  );

  return (
    <div className="app-container page-enter-active">
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem' }}>Student Management</h1>
        <p className="hero-subtitle">Track progress and manage your assigned students in real-time.</p>
      </header>

      {students.length === 0 ? (
        <div className="card card-modern" style={{ textAlign: 'center', padding: '60px' }}>
          <div className="pulse" style={{ fontSize: '3rem', marginBottom: '16px' }}>👥</div>
          <p className="small">Your student list is currently empty.</p>
        </div>
      ) : (
        <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {students.map((student) => {
            const progress = student.extra?.progress || 'Steady';
            const progressColor = progress === 'Excellent' ? 'var(--success)' : (progress === 'Steady' ? 'var(--accent)' : 'var(--danger)');

            return (
              <div key={student._id} className="card card-modern hover-lift slide-in-bottom delay-100" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                    <div style={{
                      width: '50px',
                      height: '50px',
                      background: 'var(--primary-light)',
                      color: 'var(--primary)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem',
                      fontWeight: 800
                    }}>{student.name[0]}</div>
                    <div>
                      <h3 style={{ margin: 0 }}>{student.name}</h3>
                      <p className="small" style={{ margin: 0 }}>{student.email}</p>
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg)', padding: '15px', borderRadius: 'var(--radius-sm)', marginBottom: '20px' }}>
                    <div className="small" style={{ fontWeight: 800, marginBottom: '8px' }}>ACADEMIC STATUS</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: progressColor }}></div>
                      <span style={{ fontWeight: 700, color: progressColor }}>{progress}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => updateProgress(student._id, progress)}
                    className="btn btn-modern btn-outline-modern"
                    style={{ flex: 1, padding: '10px', fontSize: '0.8rem' }}
                  >
                    🔄 Update Status
                  </button>
                  <button className="btn btn-modern btn-gradient" style={{ flex: 1, padding: '10px', fontSize: '0.8rem' }}>
                    View Profile
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ViewStudents;
