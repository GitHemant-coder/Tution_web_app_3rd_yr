import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { showSuccess, showError } from '../utils/toast';
import '../App.css';

const API_BASE = 'http://localhost:8000/api';

export default function Notes() {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date'); // 'date' or 'name'
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [watched, setWatched] = useState(new Set());
  
  const user = JSON.parse(localStorage.getItem('user'));
  const studentId = user?.studentId || 1;

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const materialsRes = await axios.get(`${API_BASE}/materials/`);
      const data = Array.isArray(materialsRes.data) ? materialsRes.data : [];
      setMaterials(data);
    } catch (err) {
      console.error("Error fetching materials:", err);
      showError("Failed to sync materials.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Load watched state from local storage
    const saved = localStorage.getItem(`watched_${studentId}`);
    if (saved) setWatched(new Set(JSON.parse(saved)));
    fetchData();
  }, [fetchData, studentId]);

  const handleInteraction = async (note) => {
    try {
      const newWatched = new Set(watched);
      newWatched.add(note.material_id);
      setWatched(newWatched);
      localStorage.setItem(`watched_${studentId}`, JSON.stringify([...newWatched]));

      await axios.post(`${API_BASE}/track-interaction/`, {
        student_id: studentId,
        material_id: note.material_id,
        rating: 5
      });
      
      if (note.file_url) {
        const fullUrl = `http://localhost:8000/${note.file_url}`;
        window.open(fullUrl, '_blank');
      }
    } catch (err) {
      console.error("Error with interaction:", err);
    }
  };

  const subjects = ['All', ...new Set(materials.map(m => m.subject || 'General'))];
  
  // Filtering & Search
  let processed = materials.filter(m => {
    const matchesFilter = filter === 'All' || (m.subject || 'General') === filter;
    const matchesSearch = m.title.toLowerCase().includes(search.toLowerCase()) || 
                         (m.description || '').toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Sorting
  processed.sort((a, b) => {
    if (sortBy === 'date') return new Date(b.date || 0) - new Date(a.date || 0);
    return a.title.localeCompare(b.title);
  });

  const recentlyAdded = [...materials].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 3);

  return (
    <div className="app-container page-enter-active">
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem' }}>Personalized Learning</h1>
        <p className="hero-subtitle">Smart recommendations based on your learning patterns.</p>
      </header>

      {/* Recently Added Section */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '24px' }}>🔥 Recently Added</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {recentlyAdded.map(note => (
            <div key={`recent-${note.material_id}`} className="card card-modern hover-lift slide-in-bottom delay-100" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                 <span className={`status-badge ${note.type === 'Video' ? 'status-accent' : 'status-success'}`}>{note.type}</span>
                 <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>{note.date}</span>
              </div>
              <h4 style={{ marginBottom: '12px' }}>{note.title}</h4>
              <button onClick={() => handleInteraction(note)} className="btn btn-modern btn-gradient" style={{ width: '100%', fontSize: '0.8rem' }}>View Now</button>
            </div>
          ))}
        </div>
      </section>

      {/* Toolbar */}
      <div className="card card-modern slide-in-top delay-200" style={{ marginBottom: '32px', padding: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <input 
              className="input-modern" 
              placeholder="Search lectures/notes..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
             <select className="input-modern" value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: '8px 16px' }}>
               {subjects.map(s => <option key={s} value={s}>{s}</option>)}
             </select>
             <select className="input-modern" value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: '8px 16px' }}>
                <option value="date">Latest First</option>
                <option value="name">A-Z Name</option>
             </select>
          </div>
        </div>
      </div>

      {/* Materials List */}
      <div className="card card-modern slide-in-bottom delay-300">
        {loading ? (
          <p style={{ textAlign: 'center', padding: '40px' }}>Syncing materials...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {processed.map((note) => (
              <div key={note.material_id} className="list-item" style={{ padding: '20px', opacity: watched.has(note.material_id) ? 0.7 : 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ fontSize: '2.5rem' }}>{note.type === 'Video' ? '🎬' : '📄'}</div>
                  <div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span className="small" style={{ color: 'var(--primary)', fontWeight: 700 }}>{note.subject}</span>
                        {watched.has(note.material_id) && <span style={{ fontSize: '0.7rem', color: 'gray' }}>✓ Viewed</span>}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '1.2rem' }}>{note.title}</div>
                    <div className="small" style={{ fontSize: '0.75rem' }}>{note.date} | {note.description}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <button onClick={() => handleInteraction(note)} className="btn btn-modern btn-outline-modern" style={{ padding: '8px 16px' }}>
                    {note.type === 'Video' ? 'Watch Lecture' : 'Open PDF'}
                  </button>
                </div>
              </div>
            ))}
            {processed.length === 0 && <p style={{ textAlign: 'center', padding: '60px', opacity: 0.5 }}>No results match your search.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
