import React, { useState, useEffect } from 'react';
import { get, put } from '../../api/api';
import { Bell, Check, Clock, Info, AlertTriangle, AlertCircle, Megaphone } from 'lucide-react';

export default function NotificationList() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = React.useCallback(async () => {
        try {
            setLoading(true);
            const data = await get('/notifications/my/', true);
            if (Array.isArray(data)) {
                setNotifications(data);
            }
        } catch (err) {
            console.error("Failed to fetch notifications:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const markAsRead = async (id) => {
        try {
            await put(`/notifications/${id}/read/`, {}, true);
            setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (err) {
            console.error("Failed to mark read:", err);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'Urgent': return <AlertCircle size={20} color="#ef4444" />;
            case 'Warning': return <AlertTriangle size={20} color="#f59e0b" />;
            case 'Announcement': return <Megaphone size={20} color="#8b5cf6" />;
            case 'Reminder': return <Clock size={20} color="#3b82f6" />;
            default: return <Info size={20} color="#10b981" />;
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    if (loading && notifications.length === 0) return <div style={{ color: '#64748b' }}>Checking alerts...</div>;

    return (
        <div className="page-enter-active card card-modern">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Bell size={22} className="text-primary" />
                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-dark)' }}>Notifications</h3>
                    {unreadCount > 0 && (
                        <span style={{ background: '#ef4444', color: 'white', fontSize: '0.75rem', padding: '2px 10px', borderRadius: '12px', fontWeight: 'bold' }}>
                            {unreadCount} new
                        </span>
                    )}
                </div>
                <button
                    onClick={fetchNotifications}
                    className="btn btn-modern btn-outline-modern"
                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                >
                    Refresh
                </button>
            </div>

            {notifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                    <Bell size={30} color="#cbd5e1" style={{ marginBottom: '10px' }} />
                    <p style={{ color: '#64748b', margin: 0 }}>You're all caught up! No recent notifications.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '500px', overflowY: 'auto', paddingRight: '5px' }}>
                    {notifications.map(notif => (
                        <div
                            key={notif.id}
                            className={`card slide-in-top`}
                            style={{
                                padding: '15px 20px',
                                background: notif.is_read ? '#f8fafc' : '#ffffff',
                                border: '1px solid',
                                borderColor: notif.is_read ? '#e2e8f0' : (notif.is_important ? '#fca5a5' : '#bfdbfe'),
                                borderLeft: `5px solid ${notif.is_read ? '#cbd5e1' : (notif.is_important ? '#ef4444' : 'var(--primary)')}`,
                                transition: 'all 0.2s',
                                boxShadow: notif.is_read ? 'none' : '0 4px 6px rgba(0,0,0,0.05)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                gap: '15px',
                                borderRadius: '8px'
                            }}
                        >
                            <div style={{ display: 'flex', gap: '15px', width: '100%' }}>
                                <div style={{ marginTop: '2px' }}>{getIcon(notif.type)}</div>
                                <div style={{ flex: 1 }}>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <div style={{ fontWeight: notif.is_read ? '500' : '700', color: notif.is_read ? '#475569' : '#0f172a', fontSize: '1rem' }}>
                                            {notif.title}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                            {new Date(notif.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                    
                                    <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: notif.is_read ? '#64748b' : '#334155', lineHeight: '1.4' }}>
                                        {notif.message}
                                    </p>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <span style={{
                                            fontSize: '0.7rem', 
                                            padding: '3px 8px', 
                                            borderRadius: '4px', 
                                            background: '#f1f5f9', 
                                            color: '#64748b',
                                            fontWeight: '600'
                                        }}>
                                            {notif.type}
                                        </span>
                                        {notif.is_important && (
                                            <span style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 'bold' }}>PRIORITY</span>
                                        )}
                                    </div>
                                    
                                </div>
                            </div>

                            {!notif.is_read && (
                                <button
                                    onClick={() => markAsRead(notif.id)}
                                    style={{ 
                                        border: '1px solid #e2e8f0', 
                                        background: '#f8fafc', 
                                        borderRadius: '50%', 
                                        width: '32px', 
                                        height: '32px', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        cursor: 'pointer', 
                                        color: '#64748b',
                                        transition: 'all 0.2s',
                                        padding: 0,
                                        flexShrink: 0
                                    }}
                                    title="Mark as read"
                                    onMouseOver={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = 'var(--primary)'; }}
                                    onMouseOut={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#64748b'; }}
                                >
                                    <Check size={16} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
