import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { GraduationCap, X } from 'lucide-react';
import { post } from '../api/api';
import { showSuccess, showError } from '../utils/toast';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const logout = () => {
    localStorage.clear();
    navigate('/');
    window.location.reload();
  };

  const isLanding = location.pathname === '/';

  const scrollToSection = (id) => {
    if (!isLanding) {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          const offset = 80;
          const bodyRect = document.body.getBoundingClientRect().top;
          const elementRect = element.getBoundingClientRect().top;
          const elementPosition = elementRect - bodyRect;
          const offsetPosition = elementPosition - offset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }, 100);
    } else {
      const element = document.getElementById(id);
      if (element) {
        const offset = 80;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = element.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'teacher': return '/teacher-dashboard';
      case 'admin': return '/admin-dashboard';
      case 'parent': return '/parent-dashboard';
      default: return '/dashboard';
    }
  };

  const [secretClicks, setSecretClicks] = useState(0);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminForm, setAdminForm] = useState({ email: '', password: '' });

  const handleLogoClick = (e) => {
    e.preventDefault();
    if (!isLanding) {
      // If not on landing page, standard navigation
      if (secretClicks === 0) navigate('/');
      // Reset secret clicks if navigating away
      if (secretClicks > 0) setSecretClicks(0);
      return;
    }

    const newCount = secretClicks + 1;
    setSecretClicks(newCount);

    if (newCount === 3) {
      setShowAdminModal(true);
      setSecretClicks(0);
    } else {
      setTimeout(() => setSecretClicks(0), 1000);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    try {
      const data = await post('/auth/login', {
        email: adminForm.email,
        password: adminForm.password
      });

      if (data.user.role !== 'admin') {
        showError("Access Denied: Not an admin account");
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      showSuccess("Welcome, Admin!");
      setShowAdminModal(false);
      navigate('/admin-dashboard');
      window.location.reload();
    } catch (err) {
      showError(err.msg || "Admin login failed");
    }
  };


  return (
    <>
      <nav className="navbar" style={{ position: 'sticky', top: 0, zIndex: 1000 }}>
        <div className="nav-content">
          <a href="/" onClick={handleLogoClick} className="nav-logo" style={{ color: '#4f46e5', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <GraduationCap size={32} />
            <span style={{ fontWeight: 800, fontSize: '1.5rem', background: 'linear-gradient(135deg, #4f46e5, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>TutorConnect</span>
          </a>

          <div className="nav-links">
            {isLanding ? (
              <>
              <>
                <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}>Home</button>
                <button onClick={() => scrollToSection('how-it-works')} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}>How It Works</button>
                <button onClick={() => scrollToSection('notice-board')} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}>Notice Board</button>
                <button onClick={() => scrollToSection('contact')} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}>Contact</button>
              </>
              </>
            ) : (
              <Link to="/" className="nav-link">Home</Link>
            )}

            {user && (
              <>
                <Link to={getDashboardLink()} className="nav-link">Dashboard</Link>
                {user.role === 'student' && <Link to="/notes" className="nav-link">My Notes</Link>}
                <Link to="/profile" className="nav-link">Profile</Link>
              </>
            )}

            <div style={{ marginLeft: '12px' }}>
              {user ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem' }}>
                    {user.name}
                  </span>
                  <button onClick={logout} className="btn btn-modern btn-outline-modern" style={{ padding: '8px 20px', fontSize: '0.85rem' }}>
                    Logout
                  </button>
                </div>
              ) : (
                <Link to="/login" className="btn btn-modern btn-gradient" style={{ borderRadius: '100px', padding: '10px 30px' }}>
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Admin Login Modal */}
      {showAdminModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 2000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.2s'
        }}>
          <div className="card card-modern fade-in" style={{ width: '400px', padding: '40px', position: 'relative', background: 'white' }}>
            <button
              onClick={() => setShowAdminModal(false)}
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
            >
              <X size={24} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🛡️</div>
              <h2 style={{ fontSize: '1.8rem', color: '#1e293b' }}>Admin Access</h2>
              <p style={{ color: '#64748b' }}>Enter secure credentials to proceed</p>
            </div>

            <form onSubmit={handleAdminLogin} className="form">
              <div className="form-group">
                <label className="form-label">Admin Email</label>
                <input
                  className="input input-modern"
                  autoFocus
                  placeholder="admin@tutorconnect.com"
                  value={adminForm.email}
                  onChange={e => setAdminForm({ ...adminForm, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Access Key / Password</label>
                <input
                  className="input input-modern"
                  type="password"
                  placeholder="••••••••••••"
                  value={adminForm.password}
                  onChange={e => setAdminForm({ ...adminForm, password: e.target.value })}
                />
              </div>
              <button type="submit" className="btn btn-modern btn-gradient" style={{ width: '100%', marginTop: '10px', background: '#0f172a', borderColor: '#0f172a' }}>
                Verify & Enter
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
