import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { AlertCircle, AlertTriangle, Info, Bell, BellRing, CheckCircle } from 'lucide-react';

export default function ParentAlertsWidget({ studentId }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [studentName, setStudentName] = useState("");
  
  const API_BASE = 'http://localhost:8000/api';

  useEffect(() => {
    fetchAlerts();
  }, [studentId, fetchAlerts]);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE}/parent-alerts/${studentId || 1}/`);
      setAlerts(res.data.alerts || []);
      setStudentName(res.data.student_name);
    } catch (err) {
      console.error(err);
      setError("Failed to load parent alerts.");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  const markAsRead = (id) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  const getAlertIcon = (severity) => {
    switch (severity) {
      case 'critical': return <AlertCircle size={22} color="#ef4444" />;
      case 'warning': return <AlertTriangle size={22} color="#f59e0b" />;
      case 'reminder': return <BellRing size={22} color="#3b82f6" />;
      case 'positive': return <CheckCircle size={22} color="#10b981" />;
      default: return <Info size={22} color="var(--primary)" />;
    }
  };

  const getAlertColor = (severity) => {
    switch (severity) {
      case 'critical': return { bg: '#fef2f2', border: '#ef4444', text: '#ef4444' };
      case 'warning': return { bg: '#fffbeb', border: '#f59e0b', text: '#b45309' };
      case 'reminder': return { bg: '#eff6ff', border: '#3b82f6', text: '#1d4ed8' };
      case 'positive': return { bg: '#ecfdf5', border: '#10b981', text: '#047857' };
      default: return { bg: '#f8fafc', border: '#94a3b8', text: '#475569' };
    }
  };

  if (loading) return <div className="card card-modern pulse" style={{ padding: '30px', textAlign: 'center' }}>Loading dynamic alerts...</div>;
  if (error) return <div className="card card-modern" style={{ color: '#ef4444', padding: '20px' }}>{error}</div>;

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;

  return (
    <div className="card card-modern hover-lift slide-in-bottom">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <Bell size={24} color={criticalCount > 0 ? '#ef4444' : "var(--primary)"} fill={criticalCount > 0 ? '#ef4444' : "none"} /> 
            Smart Alerts for {studentName}
          </h3>
          <p className="small" style={{ opacity: 0.7, margin: 0 }}>
            Real-time academic risk monitoring and parental notifications.
          </p>
        </div>
        
        {alerts.length > 0 && (
          <div style={{ display: 'flex', gap: '8px' }}>
            {criticalCount > 0 && <span className="status-badge" style={{ background: '#fef2f2', color: '#ef4444' }}>{criticalCount} Critical</span>}
            {warningCount > 0 && <span className="status-badge" style={{ background: '#fffbeb', color: '#b45309' }}>{warningCount} Warnings</span>}
          </div>
        )}
      </div>

      {alerts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px', background: 'var(--bg-main)', borderRadius: '12px' }}>
          <CheckCircle size={40} color="#10b981" style={{ marginBottom: '12px' }} />
          <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-main)' }}>You're all caught up!</h4>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>No pending academic warnings or alerts for {studentName}.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {alerts.map((alert) => {
            const colors = getAlertColor(alert.severity);
            return (
              <div key={alert.id} style={{
                position: 'relative',
                background: 'white',
                border: `1px solid #e2e8f0`,
                borderLeft: `5px solid ${colors.border}`,
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                gap: '16px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                transition: 'all 0.2s',
              }}>
                <div style={{ marginTop: '2px' }}>
                  {getAlertIcon(alert.severity)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '10px' }}>
                    <h4 style={{ margin: 0, color: colors.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {alert.title}
                      <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', padding: '2px 6px', borderRadius: '4px', background: colors.bg, fontWeight: 800 }}>
                        {alert.type.replace('_', ' ')}
                      </span>
                    </h4>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>{alert.date}</span>
                  </div>
                  
                  <p style={{ margin: '0 0 12px 0', fontSize: '0.95rem', lineHeight: '1.5', color: '#334155' }}>
                    {alert.message}
                  </p>
                  
                  <div style={{ background: colors.bg, padding: '12px 16px', borderRadius: '8px', fontSize: '0.9rem', color: colors.text }}>
                    <strong>Recommended Action:</strong> {alert.suggestion}
                  </div>
                </div>
                
                <button 
                  onClick={() => markAsRead(alert.id)}
                  title="Mark as Read"
                  style={{
                    position: 'absolute', top: '16px', right: '16px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#cbd5e1', padding: '4px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.color = colors.text}
                  onMouseOut={(e) => e.currentTarget.style.color = '#cbd5e1'}
                >
                  ✕
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
}
