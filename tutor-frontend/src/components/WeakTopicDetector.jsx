import React, { useState } from 'react';
import axios from 'axios';
import { Target, Plus, Trash2, ShieldAlert, CheckCircle, HelpCircle } from 'lucide-react';
import { showSuccess, showError } from '../utils/toast';

export default function WeakTopicDetector() {
  const [subject, setSubject] = useState('');
  const [topics, setTopics] = useState([
    { id: 1, name: '', score: '', confidence: 3 }
  ]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const API_BASE = 'http://localhost:8000/api';

  const addTopic = () => {
    setTopics([...topics, { id: Date.now(), name: '', score: '', confidence: 3 }]);
  };

  const removeTopic = (id) => {
    if (topics.length > 1) {
      setTopics(topics.filter(t => t.id !== id));
    }
  };

  const handleChange = (id, field, value) => {
    setTopics(topics.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim()) return showError("Please enter a subject name.");
    
    // Validate topics
    const validTopics = topics.filter(t => t.name.trim() && t.score !== '');
    if (validTopics.length === 0) return showError("Please add at least one complete topic.");

    setLoading(true);
    try {
      const payload = {
        subject: subject,
        topics: validTopics.map(t => ({
          name: t.name,
          score: Number(t.score),
          confidence: Number(t.confidence)
        }))
      };
      
      const res = await axios.post(`${API_BASE}/weak-topics/`, payload);
      setResults(res.data);
      showSuccess("Topics analyzed successfully!");
    } catch (err) {
      console.error(err);
      showError("Failed to detect topics.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Weak': return '#ef4444'; // Red
      case 'Moderate': return '#eab308'; // Yellow
      case 'Strong': return '#22c55e'; // Green
      default: return 'var(--primary)';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Weak': return <ShieldAlert size={18} color="#ef4444" />;
      case 'Moderate': return <HelpCircle size={18} color="#ca8a04" />;
      case 'Strong': return <CheckCircle size={18} color="#16a34a" />;
      default: return null;
    }
  };

  return (
    <div className="card card-modern hover-lift slide-in-bottom">
      <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Target size={24} color="var(--primary)" /> Weak Topic Detector
      </h3>
      <p className="small" style={{ opacity: 0.8, marginBottom: '24px' }}>
        Enter your chapter scores to identify exactly what you need to revise first.
      </p>

      {!results ? (
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Subject Target</label>
            <input 
              type="text" 
              className="input-modern" 
              placeholder="e.g., Mathematics" 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              style={{ width: '100%', maxWidth: '400px' }}
            />
          </div>

          <div style={{ marginBottom: '16px', fontWeight: 600, fontSize: '0.9rem' }}>Enter Topic Data</div>
          
          <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
            {topics.map((t, i) => (
              <div key={t.id} style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input 
                  type="text" 
                  className="input-modern" 
                  placeholder="Topic Name (e.g., Algebra)" 
                  value={t.name}
                  onChange={(e) => handleChange(t.id, 'name', e.target.value)}
                  style={{ flex: '1 1 200px' }}
                />
                <input 
                  type="number" 
                  className="input-modern" 
                  placeholder="Score %" 
                  min="0" max="100"
                  value={t.score}
                  onChange={(e) => handleChange(t.id, 'score', e.target.value)}
                  style={{ width: '100px' }}
                />
                <select 
                  className="input-modern" 
                  value={t.confidence}
                  onChange={(e) => handleChange(t.id, 'confidence', e.target.value)}
                  style={{ width: '160px', padding: '10px' }}
                  title="Your personal confidence level"
                >
                  <option value={1}>1 - Weakest</option>
                  <option value={2}>2 - Weak</option>
                  <option value={3}>3 - Neutral</option>
                  <option value={4}>4 - Confident</option>
                  <option value={5}>5 - Mastery</option>
                </select>
                
                {topics.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => removeTopic(t.id)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px' }}
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="button" onClick={addTopic} className="btn btn-outline-modern" style={{ fontSize: '0.85rem', display: 'flex', gap: '6px', alignItems: 'center' }}>
              <Plus size={16} /> Add Topic
            </button>
            <button type="submit" className="btn btn-modern btn-gradient" disabled={loading}>
              {loading ? 'Analyzing...' : 'Detect Weak Topics'}
            </button>
          </div>
        </form>
      ) : (
        <div className="slide-in-right">
          <div style={{ padding: '20px', background: 'var(--bg-main)', borderRadius: '12px', borderLeft: `6px solid ${results.weak_topics.length > 0 ? '#ef4444' : '#22c55e'}`, marginBottom: '24px' }}>
            <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-main)' }}>AI Topic Assessment for {results.subject}</h4>
            <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', opacity: 0.9 }}>{results.summary}</p>
          </div>

          <h4 style={{ marginBottom: '16px' }}>Revise First (Priority Order)</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
            {results.results.map((res, idx) => (
              <div key={idx} style={{ 
                padding: '16px', 
                borderRadius: '12px', 
                border: '1px solid #e2e8f0',
                background: 'white',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: getStatusColor(res.status) }}></div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{res.topic}</span>
                    <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', background: `${getStatusColor(res.status)}15`, color: getStatusColor(res.status), fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {getStatusIcon(res.status)} {res.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    {res.score}% Score
                  </div>
                </div>
                
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '8px' }}>
                  <strong>Diagnostic:</strong> {res.reason}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                  <strong>Action Plan:</strong> {res.recommendation}
                </div>
              </div>
            ))}
          </div>

          <button onClick={() => setResults(null)} className="btn btn-outline-modern" style={{ fontSize: '0.85rem' }}>
            ← Analyze Another Subject
          </button>
        </div>
      )}
    </div>
  );
}
