import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { showSuccess, showError } from '../utils/toast';
import '../App.css';

export default function RequestTutor() {
  const [form, setForm] = useState({ subject: '', message: '', prefTime: '' });
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/users/teachers');
        setTeachers(res.data);
      } catch (err) {
        console.error("Error fetching teachers:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeachers();
  }, []);

  const submitRequest = async (e) => {
    e.preventDefault();
    if (!form.subject) {
      showError('Please specify a subject.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/tutor-requests',
        {
          subject: form.subject,
          message: form.message,
          extra: { prefTime: form.prefTime }
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showSuccess(`Your discovery request for ${form.subject} has been sent to our admin team!`);
      setForm({ subject: '', message: '', prefTime: '' });
    } catch (err) {
      showError('Failed to submit request. Please try again.');
    }
  };

  return (
    <div className="app-container page-enter-active">
      <div className="card card-modern hover-lift slide-in-top delay-100" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🤝</div>
          <h1 style={{ fontSize: '2rem' }}>Request Discovery</h1>
          <p className="small">We'll help you find the best instructor from our database.</p>
        </div>

        <form onSubmit={submitRequest} className="form">
          <div className="form-group">
            <label className="form-label">Search Subject</label>
            <input
              className="input input-modern"
              placeholder="e.g. Quantum Mechanics, Digital Marketing"
              value={form.subject}
              onChange={e => setForm({ ...form, subject: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Available Times</label>
            <input
              className="input input-modern"
              placeholder="e.g. Weeknights after 8pm"
              value={form.prefTime}
              onChange={e => setForm({ ...form, prefTime: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Learning Goals (Optional)</label>
            <textarea
              className="input input-modern"
              rows="4"
              placeholder="What specifically do you want to achieve?"
              value={form.message}
              onChange={e => setForm({ ...form, message: e.target.value })}
            />
          </div>

          <button type="submit" className="btn btn-modern btn-gradient" style={{ width: '100%', marginTop: '10px' }}>
            Submit Real-time Request
          </button>
        </form>

        <div style={{ marginTop: '40px', paddingTop: '30px', borderTop: '1px solid #f1f5f9' }}>
          <p className="small" style={{ textAlign: 'center', marginBottom: '15px', fontWeight: 700 }}>AVAILABLE TOP INSTRUCTORS</p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {loading ? <p className="small">Loading instructors...</p> : (
              teachers.slice(0, 5).map(t => (
                <div key={t._id} style={{ padding: '6px 15px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '100px', fontSize: '0.8rem', fontWeight: 600 }}>
                  {t.name}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
