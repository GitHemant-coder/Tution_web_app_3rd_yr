import React, { useState } from 'react';
import axios from 'axios';
import './DynamicPerformanceInsights.css';

const DynamicPerformanceInsights = () => {
  const [formData, setFormData] = useState({
    name: '',
    quiz_score: '',
    attendance: '',
    study_hours: '',
    assignment_score: '',
    exam_score: '',
    subject: ''
  });

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setData(null);

    // Basic frontend validation
    if (
      formData.quiz_score === '' ||
      formData.attendance === '' ||
      formData.study_hours === ''
    ) {
      setError('Please fill in Quiz Score, Attendance, and Study Hours.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:8000/api/explain-performance-dynamic/', formData);
      setData(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to generate insights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderResults = () => {
    if (loading) {
      return (
        <div className="dp-loading pulse">
          <span className="dp-loading-icon">🤖</span>
          <p>Analyzing your inputs with AI...</p>
        </div>
      );
    }

    if (error) {
      return <div className="dp-error">{error}</div>;
    }

    if (!data) return null;

    let labelClass = 'dp-badge-average';
    if (data.prediction_label === 'Excellent') labelClass = 'dp-badge-excellent';
    else if (data.prediction_label === 'Good') labelClass = 'dp-badge-good';
    else if (data.prediction_label === 'At Risk') labelClass = 'dp-badge-risk';

    return (
      <div className="dp-results-container slide-in-top delay-100">
        <h3 className="dp-section-title">✨ AI Performance Insights</h3>
        
        <div className="dp-prediction-box">
          <div className="dp-score-wrap">
            <span className="dp-score-val">{data.predicted_score}</span>
            <span className="dp-score-label">Predicted Score</span>
          </div>
          <div className={`dp-status-badge ${labelClass}`}>
            {data.prediction_label}
          </div>
        </div>
        
        <p className="dp-summary">{data.summary}</p>

        <h4 className="dp-section-title">Key Contributing Factors</h4>
        <div className="dp-factors-grid">
          {data.factors.map((factor, idx) => {
            let impactClass = 'dp-impact-neutral';
            if (factor.impact.includes('Positive')) impactClass = 'dp-impact-positive';
            else if (factor.impact.includes('Negative')) impactClass = 'dp-impact-negative';
            
            return (
              <div key={idx} className={`dp-factor-card ${impactClass}`}>
                <div className="dp-factor-head">
                  <span className="dp-factor-name">{factor.name}</span>
                  <span className={`dp-factor-cont ${impactClass}`}>{factor.contribution}</span>
                </div>
                <div className="dp-factor-value">Your Value: <strong>{factor.value}</strong></div>
                <div className="dp-factor-impact-badge">{factor.impact}</div>
                <div className="dp-factor-reason">{factor.reason}</div>
              </div>
            );
          })}
        </div>

        <h4 className="dp-section-title mt-4">AI Action Plan</h4>
        <ul className="dp-rec-list">
          {data.recommendations.map((rec, i) => (
            <li key={i} className="dp-rec-item">
              <span className="dp-rec-icon">🎯</span> {rec}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="card card-modern dp-main-card hover-lift">
      <div className="dp-header" style={{ marginBottom: "20px" }}>
        <h3 className="dp-main-title">🔮 Dynamic Self-Analysis</h3>
      </div>
      <form className="dp-form" onSubmit={handleSubmit}>
        <div className="dp-form-grid">
          <div className="dp-input-group">
            <label>Name (Optional)</label>
            <input type="text" name="name" className="input-modern" placeholder="Enter your name" value={formData.name} onChange={handleChange} />
          </div>
          <div className="dp-input-group">
            <label>Subject (Optional)</label>
            <input type="text" name="subject" className="input-modern" placeholder="e.g. Mathematics" value={formData.subject} onChange={handleChange} />
          </div>
          <div className="dp-input-group required">
            <label>Quiz Score (0-100) *</label>
            <input type="number" name="quiz_score" className="input-modern" placeholder="85" min="0" max="100" value={formData.quiz_score} onChange={handleChange} required />
          </div>
          <div className="dp-input-group required">
            <label>Attendance (%) *</label>
            <input type="number" name="attendance" className="input-modern" placeholder="90" min="0" max="100" value={formData.attendance} onChange={handleChange} required />
          </div>
          <div className="dp-input-group required">
            <label>Study Hrs/Day *</label>
            <input type="number" name="study_hours" className="input-modern" placeholder="3" min="0" max="24" step="0.5" value={formData.study_hours} onChange={handleChange} required />
          </div>
          <div className="dp-input-group">
            <label>Assignment Score (0-100)</label>
            <input type="number" name="assignment_score" className="input-modern" placeholder="75" min="0" max="100" value={formData.assignment_score} onChange={handleChange} />
          </div>
        </div>
        <button type="submit" className="btn btn-modern btn-gradient dp-submit-btn" disabled={loading}>
          {loading ? 'Generating...' : 'Generate My AI Performance Insights'}
        </button>
      </form>

      {renderResults()}
    </div>
  );
};

export default DynamicPerformanceInsights;
