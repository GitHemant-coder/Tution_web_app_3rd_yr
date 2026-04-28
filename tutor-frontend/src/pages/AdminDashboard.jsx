import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import {
    LayoutDashboard,
    Users as UsersIcon,
    CreditCard,
    Link as LinkIcon,
    Bell,
    Trophy,
    LogOut,
    Menu,
    X
} from 'lucide-react';

import AdminStats from '../components/admin/AdminStats';
import AdminUsers from '../components/admin/AdminUsers';
import AdminPayments from '../components/admin/AdminPayments';
import AdminAssignments from '../components/admin/AdminAssignments';
import AdminNotifications from '../components/admin/AdminNotifications';
import AdminPerformance from '../components/admin/AdminPerformance';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('overview');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const navigate = useNavigate();

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (!mobile) setSidebarOpen(true);
            else setSidebarOpen(false);
        };
        
        handleResize(); // Initial check
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const tabs = [
        { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={20} /> },
        { id: 'users', label: 'Users', icon: <UsersIcon size={20} /> },
        { id: 'payments', label: 'Payments', icon: <CreditCard size={20} /> },
        { id: 'assignments', label: 'Assignments', icon: <LinkIcon size={20} /> },
        { id: 'performance', label: 'Performance', icon: <Trophy size={20} /> },
        { id: 'notifications', label: 'Send Notifications', icon: <Bell size={20} /> },
    ];

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const handleTabSwitch = (id) => {
        setActiveTab(id);
        if (isMobile) setSidebarOpen(false);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'overview': return <AdminStats />;
            case 'users': return <AdminUsers />;
            case 'payments': return <AdminPayments />;
            case 'assignments': return <AdminAssignments />;
            case 'performance': return <AdminPerformance />;
            case 'notifications': return <AdminNotifications />;
            default: return <AdminStats />;
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', overflowX: 'hidden' }}>
            
            {/* Mobile Header Overlay Trigger */}
            {isMobile && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '60px', background: 'white', zIndex: 20, display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid #f1f5f9', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <button onClick={() => setSidebarOpen(true)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <Menu size={24} color="var(--primary)" />
                    </button>
                    <span style={{ fontWeight: 800, color: 'var(--primary)', marginLeft: '15px', fontSize: '1.2rem' }}>TutorConnect</span>
                </div>
            )}

            {/* Backdrop for Mobile */}
            {isMobile && sidebarOpen && (
                <div 
                    style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 25 }}
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside style={{
                width: '280px',
                background: 'white',
                borderRight: '1px solid #f1f5f9',
                padding: '30px 20px',
                display: 'flex',
                flexDirection: 'column',
                position: 'fixed',
                height: '100vh',
                zIndex: 30,
                transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
                transition: 'transform 0.3s ease',
                boxShadow: isMobile && sidebarOpen ? '4px 0 10px rgba(0,0,0,0.1)' : 'none'
            }}>
                <div style={{ marginBottom: '40px', paddingLeft: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '1.4rem', fontWeight: '800', color: 'var(--primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <LayoutDashboard size={28} /> TutorConnect
                    </div>
                    {isMobile && (
                        <button onClick={() => setSidebarOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                            <X size={24} color="#64748b" />
                        </button>
                    )}
                </div>

                <nav style={{ flex: 1, overflowY: 'auto', paddingRight: '5px' }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => handleTabSwitch(tab.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                width: '100%',
                                padding: '14px 16px',
                                border: 'none',
                                background: activeTab === tab.id ? 'var(--primary-light)' : 'transparent',
                                color: activeTab === tab.id ? 'var(--primary)' : '#64748b',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                transition: 'all 0.2s',
                                marginBottom: '8px',
                                textAlign: 'left'
                            }}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </nav>

                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px', marginTop: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', marginBottom: '20px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                            {user.name?.charAt(0) || 'A'}
                        </div>
                        <div>
                            <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{user.name || 'Admin'}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>System Admin</div>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="btn btn-modern btn-outline-modern" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', justifyContent: 'flex-start' }}>
                        <LogOut size={18} /> Logout Session
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ 
                flex: 1, 
                marginLeft: isMobile ? '0' : '280px', 
                padding: isMobile ? '80px 20px 40px 20px' : '40px',
                transition: 'margin-left 0.3s ease',
                width: '100%'
            }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                    <div>
                        <h1 style={{ fontSize: isMobile ? '1.5rem' : '1.8rem', fontWeight: '800' }}>
                            {tabs.find(t => t.id === activeTab)?.label}
                        </h1>
                        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Management & Control Panel</p>
                    </div>
                </header>

                <div className="page-enter-active">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
}
