import React, { useState } from 'react';
import { Calendar, BookOpen, Clock, Target, Rocket, Plus, Minus, ChevronRight, RefreshCw, Edit3, Flame } from 'lucide-react';
import './StudyCalendar.css';
import { post } from '../api/api';


const EMPTY_CHAPTER = { name: '', weightage: '', difficulty: 'Medium' };
const EMPTY_SUBJECT = { name: '', chapters: [{ ...EMPTY_CHAPTER }] };

export default function StudyCalendar({ studentId }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [completedDays, setCompletedDays] = useState({});

  const [examDate, setExamDate] = useState('');
  const [dailyHours, setDailyHours] = useState(3);
  const [planStyle, setPlanStyle] = useState('Balanced');
  const [subjects, setSubjects] = useState([{ ...EMPTY_SUBJECT, chapters: [{ ...EMPTY_CHAPTER }] }]);

  // ── Subject handlers ──────────────────────────────────────────
  const addSubject = () => setSubjects(prev => [...prev, { name: '', chapters: [{ ...EMPTY_CHAPTER }] }]);
  const removeSubject = (si) => setSubjects(prev => prev.filter((_, i) => i !== si));
  const updateSubjectName = (si, val) => setSubjects(prev => {
    const next = [...prev];
    next[si] = { ...next[si], name: val };
    return next;
  });

  // ── Chapter handlers ──────────────────────────────────────────
  const addChapter = (si) => setSubjects(prev => {
    const next = [...prev];
    next[si] = { ...next[si], chapters: [...next[si].chapters, { ...EMPTY_CHAPTER }] };
    return next;
  });
  const removeChapter = (si, ci) => setSubjects(prev => {
    const next = [...prev];
    next[si] = { ...next[si], chapters: next[si].chapters.filter((_, i) => i !== ci) };
    return next;
  });
  const updateChapter = (si, ci, field, val) => setSubjects(prev => {
    const next = [...prev];
    const chaps = [...next[si].chapters];
    chaps[ci] = { ...chaps[ci], [field]: val };
    next[si] = { ...next[si], chapters: chaps };
    return next;
  });

  // ── Submit ────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError('');

    if (!examDate) { setError('Please select an exam date.'); return; }
    for (const s of subjects) {
      if (!s.name.trim()) { setError('Every subject must have a name.'); return; }
      for (const ch of s.chapters) {
        if (!ch.name.trim()) { setError('Every chapter must have a name.'); return; }
        if (!ch.weightage || isNaN(Number(ch.weightage)) || Number(ch.weightage) < 1 || Number(ch.weightage) > 100) {
          setError(`Chapter "${ch.name || 'unnamed'}" has an invalid weightage (must be 1–100).`); return;
        }
      }
    }

    setStep(2); setLoading(true);

    try {
      const data = await post('/study-calendar/', {
        student_id: studentId || 1,
        subjects,
        exam_date: examDate,
        daily_study_hours: Number(dailyHours),
        plan_style: planStyle,
      });
      setResult(data);
      setCompletedDays({});
      setTimeout(() => { setStep(3); setLoading(false); }, 900);
    } catch (err) {
      setError(err.msg || err.message || 'Generation failed');
      setStep(1); setLoading(false);
    }

  };

  const TYPE_COLOR = {
    Study: '#4f46e5', Revision: '#3b82f6', 'Mock Test': '#f97316', Exam: '#7c3aed',
  };

  // ── STEP 1: FORM ──────────────────────────────────────────────
  if (step === 1) return (
    <div className="study-calendar-wrapper">
      <div className="calendar-header">
        <div className="calendar-title-row">
          <Calendar size={28} color="#4f46e5" />
          <h2>AI Study Calendar</h2>
        </div>
        <p className="calendar-subtitle">Enter your subjects, chapters, weightage and difficulty to generate a full smart study plan.</p>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '12px 16px', color: '#dc2626', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontWeight: 600 }}>
          <Flame size={18} /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Top row: date / hours / style */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          <div className="form-group">
            <label className="form-label">📅 Exam Date</label>
            <input type="date" className="form-input" value={examDate} onChange={e => setExamDate(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">⏱️ Daily Study Hours</label>
            <input type="number" className="form-input" value={dailyHours} min={1} max={12} onChange={e => setDailyHours(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">🎯 Plan Style</label>
            <select className="form-select" value={planStyle} onChange={e => setPlanStyle(e.target.value)}>
              <option value="Light">Relaxed – More Revision</option>
              <option value="Balanced">Balanced – Standard Pace</option>
              <option value="Intensive">Aggressive – Fast Paced</option>
            </select>
          </div>
        </div>

        {/* Subjects */}
        {subjects.map((subj, si) => (
          <div key={si} style={{ background: '#f1f5f9', borderRadius: 10, padding: 16, marginBottom: 16, border: '1px solid #cbd5e1' }}>
            {/* Subject header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <label className="form-label">Subject {si + 1} Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Mathematics, DBMS, Physics"
                  value={subj.name}
                  onChange={e => updateSubjectName(si, e.target.value)}
                  required
                />
              </div>
              {subjects.length > 1 && (
                <button type="button" onClick={() => removeSubject(si)}
                  style={{ marginTop: 22, background: '#fee2e2', border: 'none', borderRadius: 6, padding: '8px 12px', color: '#dc2626', cursor: 'pointer', fontWeight: 700 }}>
                  ✕ Remove
                </button>
              )}
            </div>

            {/* Chapters label row */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 32px', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Chapter Name</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Weightage %</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Difficulty</span>
              <span></span>
            </div>

            {/* Chapter rows */}
            {subj.chapters.map((ch, ci) => (
              <div key={ci} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 32px', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder={`Chapter ${ci + 1} name`}
                  value={ch.name}
                  onChange={e => updateChapter(si, ci, 'name', e.target.value)}
                  required
                />
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g. 30"
                  value={ch.weightage}
                  min={1}
                  max={100}
                  onChange={e => updateChapter(si, ci, 'weightage', e.target.value)}
                  required
                />
                <select
                  className="form-select"
                  value={ch.difficulty}
                  onChange={e => updateChapter(si, ci, 'difficulty', e.target.value)}
                >
                  <option value="Easy">🟢 Easy</option>
                  <option value="Medium">🟡 Medium</option>
                  <option value="Hard">🔴 Hard</option>
                </select>
                {subj.chapters.length > 1 ? (
                  <button type="button" onClick={() => removeChapter(si, ci)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Minus size={18} />
                  </button>
                ) : <span />}
              </div>
            ))}

            {/* Add chapter */}
            <button type="button" onClick={() => addChapter(si)}
              style={{ background: 'none', border: '1px dashed #94a3b8', borderRadius: 6, padding: '6px 14px', color: '#4f46e5', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <Plus size={14} /> Add Chapter
            </button>
          </div>
        ))}

        {/* Add subject */}
        <button type="button" onClick={addSubject}
          style={{ width: '100%', padding: '10px', background: '#eef2ff', color: '#4f46e5', border: '2px dashed #a5b4fc', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 14, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <Plus size={16} /> Add Another Subject
        </button>

        {/* Generate */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn-primary" disabled={loading}>
            <Target size={18} /> Generate AI Study Calendar
          </button>
        </div>
      </form>
    </div>
  );

  // ── STEP 2: LOADING ───────────────────────────────────────────
  if (step === 2) return (
    <div className="study-calendar-wrapper" style={{ textAlign: 'center', padding: '60px 20px' }}>
      <RefreshCw size={42} color="#4f46e5" className="regenerate-icon" style={{ marginBottom: 16 }} />
      <h3 style={{ color: '#1e293b', marginBottom: 8 }}>Building Your Smart Study Plan...</h3>
      <p style={{ color: '#64748b' }}>Allocating days based on weightage, difficulty & timeline</p>
    </div>
  );

  // ── STEP 3: RESULT ────────────────────────────────────────────
  if (step === 3 && result) {
    // Only count non-exam days for progress tracking
    const studyDaysCount = result.calendar.filter(d => d.type !== 'Exam').length;
    const completedCount = result.calendar.filter((item, idx) => 
      item.type !== 'Exam' && !!completedDays[idx]
    ).length;
    const progress = studyDaysCount > 0 ? Math.round((completedCount / studyDaysCount) * 100) : 0;


    return (
      <div className="study-calendar-wrapper">
        {/* Header */}
        <div className="result-header">
          <div>
            <div className="calendar-title-row">
              <Calendar size={26} color="#4f46e5" />
              <h2>Your AI Study Calendar</h2>
            </div>
            <p className="calendar-subtitle">{result.message}</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setStep(1)} className="regenerate-btn"><Edit3 size={15} /> Edit</button>
            <button onClick={handleSubmit} className="regenerate-btn"><RefreshCw size={15} /> Regenerate</button>
          </div>
        </div>

        {/* Progress */}
        <div className="motivational-msg">
          <Rocket size={22} color="#166534" />
          <div style={{ flex: 1 }}>
            <div style={{ background: '#dcfce7', borderRadius: 4, height: 8, overflow: 'hidden', marginBottom: 4 }}>
              <div style={{ width: `${progress}%`, background: '#16a34a', height: '100%', transition: 'width 0.4s' }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#166534' }}>
              {progress}% Completed · Plan: {result.plan_days} days · {result.days_left} days to exam
            </span>
          </div>
        </div>

        {/* Early-finish smart banner */}
        {result.early_finish && (
          <div style={{
            background: 'linear-gradient(135deg, #eef2ff 0%, #f0f9ff 100%)',
            border: '1px solid #a5b4fc',
            borderRadius: 10,
            padding: '12px 18px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>🧠</span>
            <div>
              <div style={{ fontWeight: 700, color: '#4f46e5', fontSize: 14, marginBottom: 4 }}>
                Smart Plan — Finishes Early!
              </div>
              <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
                Your study plan completes in <strong>{result.plan_days} days</strong>.
                You still have <strong>{result.days_remaining_after_plan} days</strong> left before the exam — use them for
                self-revision, practice tests, or relaxed review. No need to stretch the plan!
              </div>
            </div>
          </div>
        )}

        {/* Phase summary */}
        {result.phases && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            {[
              { label: 'Learning', days: result.phases.learning, color: '#4f46e5', bg: '#eef2ff' },
              { label: 'Revision', days: result.phases.revision, color: '#3b82f6', bg: '#eff6ff' },
              { label: 'Final / Mocks', days: result.phases.final, color: '#f97316', bg: '#fff7ed' },
            ].map(p => (
              <div key={p.label} style={{ background: p.bg, border: `1px solid ${p.color}22`, borderRadius: 8, padding: '8px 16px', flex: 1, minWidth: 120, textAlign: 'center' }}>
                <div style={{ fontWeight: 700, color: p.color, fontSize: 18 }}>{p.days}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{p.label} days</div>
              </div>
            ))}
          </div>
        )}

        {/* Timeline — only shows actual plan days, NOT stretched to exam */}
        <div className="timeline">
          {result.calendar.map((item, idx) => {
            const done = !!completedDays[idx];
            const typeCol = TYPE_COLOR[item.type] || item.color || '#4f46e5';
            return (
              <div key={idx} className="timeline-item" style={{ animationDelay: `${Math.min(idx * 0.05, 1)}s` }}>
                <div className="timeline-dot" style={{ borderColor: typeCol, background: done ? typeCol : '#fff' }} />
                <div className={`timeline-card ${done ? 'done' : ''}`} style={{ borderLeft: `4px solid ${typeCol}` }}>
                  {/* Date & type badge */}
                  <div className="card-header-row">
                    <div className="date-badge"><Clock size={14} /> {item.date}</div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: typeCol + '22', color: typeCol, textTransform: 'uppercase' }}>
                      {item.type}
                    </span>
                  </div>
                  {/* Subject + Chapter */}
                  <div className="chapter-title">
                    <BookOpen size={18} color={typeCol} />
                    <span style={{ color: '#0f172a' }}>
                      <span style={{ fontWeight: 700 }}>{item.subject}</span>
                      {item.chapter && item.chapter !== 'EXAM DAY 🎯' && ` — ${item.chapter}`}
                      {item.chapter === 'EXAM DAY 🎯' && ' 🎯'}
                    </span>
                  </div>
                  {/* Task */}
                  <div className="task-description">
                    <ChevronRight size={16} color="#64748b" style={{ flexShrink: 0 }} />
                    <span>{item.task}</span>
                  </div>
                  {/* Checkbox */}
                  {item.type !== 'Exam' && (
                    <label className="checkbox-wrapper" style={{ marginTop: 10 }}>
                      <input type="checkbox" checked={done} onChange={() => setCompletedDays(p => ({ ...p, [idx]: !p[idx] }))} />
                      Mark as completed
                    </label>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}
