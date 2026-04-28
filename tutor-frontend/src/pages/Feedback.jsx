import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../App.css';

const Feedback = () => {
  const [message, setMessage] = useState('');
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const token = localStorage.getItem('token');
        // Fetch users with role 'teacher'
        const res = await axios.get('http://localhost:5000/api/users/teachers', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTeachers(res.data);
        if (res.data.length > 0) setSelectedTeacher(res.data[0]._id);
      } catch (err) {
        console.error("Error fetching teachers:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeachers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedTeacher) {
      toast.error('Please select a teacher and enter feedback');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/feedback',
        { message, teacher: selectedTeacher },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Feedback submitted successfully!');
      setMessage('');
    } catch (err) {
      toast.error('Error submitting feedback');
      console.error(err);
    }
  };

  return (
    <div className="app-container page-enter-active">
      <div className="card card-modern hover-lift slide-in-top delay-100" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div className="pulse" style={{ fontSize: '3rem', marginBottom: '10px' }}>🌟</div>
          <h1 style={{ fontSize: '2rem' }}>Teacher Feedback</h1>
          <p className="small">Share your experience with your instructors to help us improve.</p>
        </div>

        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label className="form-label">Select Instructor</label>
            <select
              className="input input-modern"
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              disabled={loading}
            >
              {teachers.length === 0 ? (
                <option>No teachers found</option>
              ) : (
                teachers.map(t => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))
              )}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Your Review</label>
            <textarea
              className="input input-modern"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What did you like? What can be improved?"
              rows="6"
              style={{ resize: 'vertical', minHeight: '120px' }}
            />
          </div>

          <button type="submit" className="btn btn-modern btn-gradient" style={{ width: '100%' }} disabled={loading}>
            Send Feedback anonymously
          </button>
        </form>
      </div>
    </div>
  );
};

export default Feedback;
