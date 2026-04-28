import React, { useState, useEffect } from 'react';
import RoleButtons from '../components/RoleButtons';
import { post } from '../api/api';
import { ToastContainer } from 'react-toastify';
import { showSuccess, showError } from '../utils/toast';
import { useNavigate, useLocation } from 'react-router-dom';
import '../App.css';

export default function Login() {
  const [role, setRole] = useState('student');
  const [form, setForm] = useState({ email: '', password: '' });
  const [isForcePasswordChange, setIsForcePasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.role === 'admin') {
      setRole('admin');
    }
  }, [location.state]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      showError('Enter email/username and password');
      return;
    }

    try {
      const data = await post('/auth/login', {
        email: form.email,
        password: form.password,
      });

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      if (data.user.forcePasswordChange) {
        setIsForcePasswordChange(true);
        showSuccess('Welcome! Please set a new permanent password to continue.');
      } else {
        showSuccess('Logged in successfully!');
        routeUser(data.user);
      }
    } catch (err) {
      showError(err.msg || 'Login failed');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      showError('Passwords do not match');
      return;
    }

    try {
      await post('/auth/change-password/', { new_password: newPassword }, true);
      showSuccess('Password updated successfully!');
      
      // Update local storage to remove force flag
      const user = JSON.parse(localStorage.getItem('user'));
      user.forcePasswordChange = false;
      localStorage.setItem('user', JSON.stringify(user));

      setIsForcePasswordChange(false);
      routeUser(user);
    } catch (err) {
      showError(err.msg || 'Failed to update password');
    }
  };

  const routeUser = (userData) => {
    if (userData.role === 'teacher') {
      localStorage.setItem('teacherData', JSON.stringify(userData));
      navigate('/teacher-dashboard');
    } else if (userData.role === 'student') {
      localStorage.setItem('studentData', JSON.stringify(userData));
      navigate('/dashboard');
    } else if (userData.role === 'parent') {
      navigate('/parent-dashboard');
    } else if (userData.role === 'admin') {
      navigate('/admin-dashboard');
    } else {
      navigate('/');
    }
  };

  // Change Password Prompt View
  if (isForcePasswordChange) {
    return (
      <div className="app-container page-enter-active" style={{ maxWidth: '600px', margin: '100px auto' }}>
        <div className="card card-modern floating-delayed" style={{ padding: '40px', borderTop: '4px solid var(--primary)' }}>
          <h2 style={{ marginBottom: '16px', fontSize: '2rem' }}>Update Your Password</h2>
          <p className="hero-subtitle" style={{ marginBottom: '30px' }}>
            This is your first time logging in with an admin-assigned temporary password. Please configure a secure password to access your dashboard.
          </p>
          
          <form className="form" onSubmit={handlePasswordChange}>
            <div className="form-group slide-in-top delay-100">
              <label className="form-label">New Password</label>
              <input
                className="input input-modern"
                placeholder="••••••••"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="form-group slide-in-top delay-200" style={{ marginBottom: '30px' }}>
              <label className="form-label">Confirm New Password</label>
              <input
                className="input input-modern"
                placeholder="••••••••"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-modern btn-gradient slide-in-top delay-300" style={{ width: '100%', height: '50px' }}>
              Save Secure Password & Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container page-enter-active" style={{ maxWidth: '1000px' }}>
      <div style={{ display: 'flex', gap: '40px', alignItems: 'center', minHeight: '70vh', flexWrap: 'wrap' }}>

        {/* Information Panel */}
        <div style={{ flex: 1, minWidth: '300px' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>Welcome Back</h2>
          <p className="hero-subtitle">
            Access your personalized learning portal and continue your educational journey.
          </p>

          <div style={{ marginTop: '32px' }}>
            <h4 style={{ marginBottom: '12px' }}>Choose Your Role</h4>
            <RoleButtons
              active={role}
              onSelect={(r) => { setRole(r); }}
            />
          </div>
          
          <div style={{ padding: '20px', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '12px', marginTop: '30px', borderLeft: '4px solid var(--primary)' }}>
            <h4 style={{ color: 'var(--primary)', marginBottom: '8px', fontSize: '0.9rem' }}>Account Access</h4>
            <p className="small" style={{ opacity: 0.8, margin: 0 }}>
              Self-registration is disabled for this academic institution. 
              Please contact your administrator exclusively if you require a Student, Parent, or Teacher account.
            </p>
          </div>
        </div>

        {/* Form Panel */}
        <div className="card card-modern hover-lift floating-delayed" style={{ flex: '0 0 450px', minWidth: '320px' }}>
            <>
              <h3 style={{ marginBottom: '24px', fontSize: '1.5rem' }}>Login to Your Account</h3>
              <form className="form" onSubmit={handleLogin}>
                <div className="form-group slide-in-left delay-100">
                  <label className="form-label">Username or Email</label>
                  <input
                    className="input input-modern"
                    placeholder="Enter assigned username/email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div className="form-group slide-in-left delay-200">
                  <label className="form-label">Password</label>
                  <input
                    className="input input-modern"
                    placeholder="••••••••"
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                </div>
                <button type="submit" className="btn btn-modern btn-gradient slide-in-left delay-300" style={{ width: '100%', marginTop: '16px', height: '50px' }}>
                  Secure Login
                </button>
              </form>
            </>
        </div>
      </div>
    </div>
  );
}
