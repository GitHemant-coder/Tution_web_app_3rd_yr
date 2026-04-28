import React, { useState, useEffect } from 'react';
import { Calendar, BookOpen, Target, RefreshCw, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import './StudyPlan.css';

export default function StudyPlan({ studentId }) {
  const [planData, setPlanData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStudyPlan = async () => {
    if (!studentId) return;
    
    setLoading(true);
    setError(null);
    try {
      // In development, handle trailing slash depending on django config. Standard is with slash.
      const response = await fetch(`http://localhost:8000/api/study-plan/${studentId}/`);
      if (!response.ok) {
        throw new Error('Failed to generate study plan');
      }
      const data = await response.json();
      setPlanData(data);
    } catch (err) {
      setError(err.message || 'An error occurred while fetching the plan');
    } finally {
      setTimeout(() => setLoading(false), 500); // Small delay for smooth UI transition
    }
  };

  useEffect(() => {
    fetchStudyPlan();
  }, [studentId]);

  if (loading) {
    return (
      <div className="study-plan-container">
        <div className="loading-spinner-container">
          <div className="spinner"></div>
          <p>Generating your personalized AI Study Plan...</p>
        </div>
      </div>
    );
  }

  if (error || !planData) {
    return (
      <div className="study-plan-container">
        <div className="plan-message" style={{ background: '#fef2f2', color: '#ef4444', borderLeftColor: '#ef4444' }}>
          <AlertTriangle size={24} />
          <div>
            <h3>Error loading plan</h3>
            <p>{error || "Could not load plan"}</p>
          </div>
          <button onClick={fetchStudyPlan} className="regenerate-btn" style={{ marginLeft: 'auto' }}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="study-plan-container">
      <div className="study-plan-header">
        <div>
          <div className="study-plan-title">
            <Target size={28} color="#4f46e5" />
            <h2>📊 Your AI-Powered Study Plan</h2>
          </div>
          <p className="study-plan-subtitle">Generated based on your performance and habits</p>
        </div>
        <button 
          onClick={fetchStudyPlan} 
          className="regenerate-btn"
          disabled={loading}
        >
          <RefreshCw size={18} className={loading ? 'regenerate-icon' : ''} />
          <span>Regenerate Plan</span>
        </button>
      </div>

      <div className="plan-message">
        <TrendingUp size={24} color="#166534" />
        <div>
          <strong>You're improving, keep going 💪</strong>
          <p style={{ margin: '4px 0 0 0' }}>{planData.message}</p>
        </div>
      </div>

      {planData.weak_subjects && planData.weak_subjects.length > 0 && (
        <div className="weak-subjects-badges">
          {planData.weak_subjects.map((sub, idx) => (
            <div key={idx} className="weak-subject-badge">
              <AlertTriangle size={14} /> Weak Subject: {sub}
            </div>
          ))}
        </div>
      )}

      <div className="plan-grid">
        {planData.plan.map((dayPlan, index) => (
          <div 
            key={index} 
            className="plan-card" 
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="card-accent-line" style={{ backgroundColor: dayPlan.color }}></div>
            
            <div className="day-header">
              <Calendar size={16} />
              {dayPlan.day}
            </div>
            
            <div className="subject-name">
              <BookOpen size={20} color={dayPlan.color} />
              {dayPlan.subject}
            </div>
            
            <div className="task-desc">
               <CheckCircle size={18} color="#64748b" style={{ flexShrink: 0, marginTop: '2px' }} />
               <span>{dayPlan.task}</span>
            </div>
            
            <div style={{ marginTop: '12px', textAlign: 'right' }}>
              <span style={{ 
                fontSize: '0.75rem', 
                fontWeight: 600, 
                color: dayPlan.color,
                background: `${dayPlan.color}15`,
                padding: '4px 8px',
                borderRadius: '12px'
              }}>
                {dayPlan.level} Priority
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
