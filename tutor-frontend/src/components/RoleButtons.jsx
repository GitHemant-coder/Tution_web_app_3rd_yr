import React from 'react';
import '../App.css';

const roles = [
  { id: 'student', name: 'Student', icon: '👨‍🎓', desc: 'I want to learn' },
  { id: 'teacher', name: 'Teacher', icon: '🧑‍🏫', desc: 'I want to teach' },
  { id: 'parent', name: 'Parent', icon: '👪', desc: 'Monitor progress' }
];

export default function RoleButtons({ active, onSelect }) {
  return (
    <div className="role-grid">
      {roles.map((profile) => (
        <div
          key={profile.id}
          className={`role-card ${active === profile.id ? 'active' : ''}`}
          onClick={() => onSelect(profile.id)}
        >
          <div className="role-icon">{profile.icon}</div>
          <div className="role-name">{profile.name}</div>
          <div className="small" style={{ opacity: 0.7 }}>{profile.desc}</div>
        </div>
      ))}
    </div>
  );
}
