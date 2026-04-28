import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy } from 'lucide-react';

export default function StudentPerformanceTracker({ studentId }) {
    const [performance, setPerformance] = useState([]);
    const [loading, setLoading] = useState(true);
    const API_BASE = 'http://localhost:8000/api';

    useEffect(() => {
        if (!studentId) return;
        
        const fetchPerformance = async () => {
            try {
                const res = await axios.get(`${API_BASE}/student/performance/${studentId}/`);
                setPerformance(res.data);
            } catch (err) {
                console.error("Error fetching student performance:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchPerformance();
    }, [studentId]);

    if (!studentId) return null;
    if (loading) return <div>Loading performance records...</div>;

    return (
        <div className="card card-modern slide-in-bottom delay-100" style={{ padding: '30px' }}>
            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Trophy size={24} className="text-primary" /> Admin Official Marks
            </h3>
            
            {performance.length === 0 ? (
                <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px', textAlign: 'center', color: '#64748b' }}>
                    No official marks have been published by the admin yet.
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                    {performance.map((record) => (
                        <div key={record.id} style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px', borderLeft: '4px solid var(--primary)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{record.subject}</span>
                                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{record.created_at}</span>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '10px' }}>
                                <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-main)' }}>{record.score}</span>
                                <span style={{ color: '#64748b' }}>/ {record.max_score}</span>
                            </div>
                            
                            <div style={{ width: '100%', background: '#e2e8f0', height: '6px', borderRadius: '10px', overflow: 'hidden', marginBottom: '15px' }}>
                                <div style={{ 
                                    height: '100%', 
                                    width: `${record.percentage}%`, 
                                    background: record.percentage >= 80 ? '#10b981' : record.percentage >= 50 ? '#f59e0b' : '#ef4444' 
                                }}></div>
                            </div>
                            
                            <div style={{ fontSize: '0.9rem', color: '#475569', background: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <strong>Remarks:</strong> {record.remarks || '---'}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
