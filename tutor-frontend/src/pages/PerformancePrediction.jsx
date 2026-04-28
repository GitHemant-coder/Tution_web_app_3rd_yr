import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { showSuccess, showError } from '../utils/toast';
import { Brain, Search, GraduationCap, Clock, Percent, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PerformancePrediction() {
  const [formData, setFormData] = useState({
    quiz_score: '',
    attendance: '',
    study_hours: ''
  });
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingPersonal, setLoadingPersonal] = useState(true);

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
  
  // Mock student ID - in a real app, this comes from auth context
  const studentId = JSON.parse(localStorage.getItem('user'))?.studentId || 1;

  const fetchPersonalPrediction = React.useCallback(async () => {
    try {
      setLoadingPersonal(true);
      const res = await axios.get(`${API_BASE}/predict-student-performance/${studentId}/`);
      setPrediction(res.data);
      // Auto-fill form with personal data
      if (res.data.input_data) {
        setFormData({
          quiz_score: res.data.input_data.quiz_score,
          attendance: res.data.input_data.attendance,
          study_hours: res.data.input_data.study_hours
        });
      }
    } catch (err) {
      console.error("Personal prediction fetch failed:", err);
    } finally {
      setLoadingPersonal(false);
    }
  }, [API_BASE, studentId]);

  useEffect(() => {
    fetchPersonalPrediction();
  }, [fetchPersonalPrediction]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    if (!formData.quiz_score || !formData.attendance || !formData.study_hours) {
      showError("Please fill all inputs.");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE}/predict-performance/`, formData);
      setPrediction(res.data);
      showSuccess("New prediction generated!");
    } catch (err) {
      console.error(err);
      showError("Failed to generate prediction.");
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'Excellent': return '#22c55e';
      case 'Good': return '#6366f1';
      case 'Average': return '#f59e0b';
      case 'At Risk': return '#ef4444';
      default: return '#64748b';
    }
  };

  return (
    <div className="app-container page-enter-active">
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2.8rem', color: 'var(--text-main)', marginBottom: '8px' }}>Personal AI Analysis</h1>
          <p className="hero-subtitle">Smart performance prediction and learning recommendations.</p>
        </div>
        <Link to="/notes" className="btn btn-modern btn-gradient" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={18} /> View Recommended Materials
        </Link>
      </header>

      {loadingPersonal ? (
        <div className="card card-modern pulse" style={{ textAlign: 'center', padding: '100px' }}>Analyzing your records...</div>
      ) : (
        <div className="dashboard-grid" style={{ gridTemplateColumns: 'minmax(400px, 1fr) 1.5fr' }}>
          {/* Input Form */}
          <div className="card card-modern slide-in-left delay-100">
            <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Brain size={28} color="var(--primary)" /> Academic Features
            </h3>
            <p className="small" style={{ marginBottom: '25px', opacity: 0.7 }}>
              Adjust these values to see how your predicted score changes.
            </p>
            <form className="form" onSubmit={handlePredict}>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Percent size={16} /> Quiz Score (%)
                </label>
                <input
                  className="input input-modern"
                  name="quiz_score"
                  type="number"
                  placeholder="e.g. 85"
                  min="0"
                  max="100"
                  value={formData.quiz_score}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Search size={16} /> Attendance Percentage (%)
                </label>
                <input
                  className="input input-modern"
                  name="attendance"
                  type="number"
                  placeholder="e.g. 92"
                  min="0"
                  max="100"
                  value={formData.attendance}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={16} /> Study Hours Per Day
                </label>
                <input
                  className="input input-modern"
                  name="study_hours"
                  type="number"
                  placeholder="e.g. 5"
                  min="0"
                  max="24"
                  step="0.1"
                  value={formData.study_hours}
                  onChange={handleChange}
                />
              </div>
              <button 
                type="submit" 
                className="btn btn-modern btn-gradient" 
                style={{ width: '100%', marginTop: '20px' }}
                disabled={loading}
              >
                {loading ? "Calculating..." : "Update Prediction"}
              </button>
            </form>
          </div>

          {/* Prediction Output */}
          <div className="card card-modern slide-in-right delay-200" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', background: 'white' }}>
            {!prediction ? (
              <div style={{ opacity: 0.5 }}>
                <GraduationCap size={64} style={{ marginBottom: '20px' }} />
                <p>Data not found for your ID. Try entering it manually.</p>
              </div>
            ) : (
              <div className="page-enter-active" style={{ width: '100%' }}>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', opacity: 0.6, marginBottom: '8px', letterSpacing: '1px' }}>
                  {prediction.student_id ? "PERSONALIZED PREDICTION" : "SIMULATED PREDICTION"}
                </div>
                <div style={{ fontSize: '5rem', fontWeight: 900, color: getLevelColor(prediction.performance_level), lineHeight: 1 }}>
                  {prediction.predicted_score}%
                </div>
                
                <div style={{ 
                  margin: '24px 0', 
                  padding: '12px 36px', 
                  background: getLevelColor(prediction.performance_level), 
                  color: 'white', 
                  borderRadius: '100px', 
                  display: 'inline-block',
                  fontWeight: 900,
                  fontSize: '1.4rem',
                  boxShadow: '0 10px 20px -5px rgba(0,0,0,0.1)'
                }}>
                  {prediction.performance_level.toUpperCase()}
                </div>

                {/* Progress Bar */}
                <div style={{ width: '80%', height: '14px', background: 'rgba(0,0,0,0.05)', borderRadius: '20px', margin: '30px auto 0', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${prediction.predicted_score}%`, 
                    height: '100%', 
                    background: getLevelColor(prediction.performance_level),
                    transition: 'width 1.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                  }} />
                </div>
                
                <div className="small" style={{ marginTop: '30px', maxWidth: '400px', margin: '30px auto 0', lineHeight: 1.6 }}>
                  <strong style={{ display: 'block', marginBottom: '10px' }}>Insights:</strong>
                  Your study patterns suggest you're currently in the <strong>{prediction.performance_level}</strong> bracket. 
                  Increasing your study hours or attending more sessions could significantly boost your predicted score.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
