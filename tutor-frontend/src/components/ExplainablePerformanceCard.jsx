import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ExplainablePerformanceCard.css';

const ExplainablePerformanceCard = ({ studentId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!studentId) return;
    
    const fetchExplainableData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`http://localhost:8000/api/explain-performance/${studentId}/`);
        setData(response.data);
      } catch (err) {
        console.error("Error fetching explainable performance info:", err);
        setError("Could not load AI performance insights.");
      } finally {
        setLoading(false);
      }
    };

    fetchExplainableData();
  }, [studentId]);

  if (loading) {
    return (
      <div className="card card-modern ep-card pulse">
        <h3 className="ep-title">✨ AI Performance Insights</h3>
        <div className="ep-loading-state">Analyzing backend data...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card card-modern ep-card">
        <h3 className="ep-title">✨ AI Performance Insights</h3>
        <div className="ep-error-state">{error || 'No data available.'}</div>
      </div>
    );
  }

  // Label badge color logic
  let labelClass = 'ep-badge-average';
  if (data.prediction_label === 'Excellent') labelClass = 'ep-badge-excellent';
  else if (data.prediction_label === 'Good') labelClass = 'ep-badge-good';
  else if (data.prediction_label === 'At Risk') labelClass = 'ep-badge-risk';

  return (
    <div className="card card-modern ep-card hover-lift delay-100">
      <div className="ep-header">
        <h3 className="ep-title">✨ AI Performance Insights</h3>
      </div>
      
      <div className="ep-prediction-box">
        <div className="ep-score-wrap">
          <span className="ep-score-val">{data.predicted_score}</span>
          <span className="ep-score-label">Predicted Score</span>
        </div>
        <div className={`ep-status-badge ${labelClass}`}>
          {data.prediction_label}
        </div>
      </div>
      
      <p className="ep-summary">{data.summary}</p>

      <div className="ep-factors-section">
        <h4 className="ep-section-title">Key Contributing Factors</h4>
        <div className="ep-factors-grid">
          {data.factors.map((factor, idx) => {
            let impactClass = 'ep-impact-neutral';
            if (factor.impact.includes('Positive')) impactClass = 'ep-impact-positive';
            else if (factor.impact.includes('Negative')) impactClass = 'ep-impact-negative';
            
            return (
              <div key={idx} className={`ep-factor-card ${impactClass}`}>
                <div className="ep-factor-head">
                  <span className="ep-factor-name">{factor.name}</span>
                  <span className={`ep-factor-cont ${impactClass}`}>{factor.contribution}</span>
                </div>
                <div className="ep-factor-value">Current Value: <strong>{factor.value}</strong></div>
                <div className="ep-factor-impact-badge">{factor.impact}</div>
                <div className="ep-factor-reason">{factor.reason}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="ep-recommendations-section">
        <h4 className="ep-section-title">AI Action Plan</h4>
        <ul className="ep-rec-list">
          {data.recommendations.map((rec, i) => (
            <li key={i} className="ep-rec-item">
              <span className="ep-rec-icon">🎯</span> {rec}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ExplainablePerformanceCard;
