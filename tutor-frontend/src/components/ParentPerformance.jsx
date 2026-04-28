import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ExplainablePerformanceCard from './ExplainablePerformanceCard';

const API_BASE = 'http://localhost:8000/api';

export default function ParentPerformance({ studentId }) {
  const [student, setStudent] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inputId, setInputId] = useState(studentId || '');
  const [searched, setSearched] = useState(false);

  const fetchStudentData = async (id) => {
    if (!id) return;
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const [studentRes, predRes] = await Promise.all([
        axios.get(`${API_BASE}/student/${id}/`),
        axios.get(`${API_BASE}/predict-student-performance/${id}/`)
      ]);
      setStudent(studentRes.data);
      setPrediction(predRes.data);
    } catch (err) {
      setError('Student not found. Please check the ID and try again.');
      setStudent(null);
      setPrediction(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) fetchStudentData(studentId);
  }, [studentId]);

  const getScoreColor = (score) => {
    if (score >= 85) return '#10b981';
    if (score >= 70) return '#f59e0b';
    if (score >= 50) return '#3b82f6';
    return '#ef4444';
  };



  return (
    <div className="page-enter-active">
      {/* Search bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <input
          className="input input-modern"
          type="number"
          placeholder="Enter Student ID (e.g. 5)"
          value={inputId}
          onChange={e => setInputId(e.target.value)}
          style={{ flex: 1 }}
        />
        <button
          className="btn btn-modern btn-gradient"
          onClick={() => fetchStudentData(inputId)}
          disabled={loading}
          style={{ whiteSpace: 'nowrap' }}
        >
          {loading ? 'Searching...' : '🔍 Analyse'}
        </button>
      </div>

      {error && <p style={{ color: '#ef4444', marginBottom: '16px' }}>{error}</p>}

      {!searched && !student && (
        <div style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔎</div>
          <p>Enter your child's Student ID above to view their full academic report.</p>
        </div>
      )}

      {student && prediction && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Student Profile Card */}
          <div className="card card-modern slide-in-bottom delay-100" style={{ borderLeft: '5px solid var(--primary)', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.4rem' }}>{student.name}</h3>
                <span className="small" style={{ color: 'var(--primary)' }}>Student ID: {student.id}</span>
              </div>
              <span className={`status-badge ${student.is_passing ? 'status-success' : 'status-danger'}`} style={{ fontSize: '0.85rem', padding: '8px 16px' }}>
                {student.is_passing ? '✅ PASSING' : '❌ AT RISK'}
              </span>
            </div>
          </div>

          {/* AI Explainable Performance Card */}
          <ExplainablePerformanceCard studentId={student.id} />

          {/* Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {[
              { label: '📝 Quiz Score', value: `${student.quiz_score}%` },
              { label: '📅 Attendance', value: `${student.attendance}%` },
              { label: '⏱️ Study Hours', value: `${student.study_hours} hrs/day` },
            ].map((m, i) => (
              <div key={i} className="card card-modern slide-in-bottom delay-300" style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{m.value}</div>
                <div className="small" style={{ opacity: 0.7, marginTop: '4px' }}>{m.label}</div>
              </div>
            ))}
          </div>

          {/* Input metrics used by AI */}
          <div className="card card-modern slide-in-left delay-400" style={{ padding: '20px' }}>
            <h4 style={{ marginBottom: '16px' }}>📊 Detailed Input Analysis</h4>
            {[
              { label: 'Quiz Score', value: prediction.input_data.quiz_score, max: 100 },
              { label: 'Attendance Rate', value: prediction.input_data.attendance, max: 100 },
              { label: 'Daily Study Hours', value: prediction.input_data.study_hours, max: 12 },
            ].map((item, i) => (
              <div key={i} style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span className="small" style={{ fontWeight: 600 }}>{item.label}</span>
                  <span className="small" style={{ fontWeight: 700, color: getScoreColor((item.value / item.max) * 100) }}>
                    {item.value}
                  </span>
                </div>
                <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min((item.value / item.max) * 100, 100)}%`,
                    height: '100%',
                    background: getScoreColor((item.value / item.max) * 100),
                    borderRadius: '4px'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
