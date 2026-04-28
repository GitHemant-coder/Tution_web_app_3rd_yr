import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { get, put } from '../api/api';
import { showError, showSuccess } from '../utils/toast';
import '../App.css';

/* ─── Small helpers ─── */
const InfoRow = ({ label, value }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
      {label}
    </div>
    <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#1e293b' }}>
      {value || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Not provided</span>}
    </div>
  </div>
);

const EditField = ({ label, value, onChange, type = 'text', readOnly }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
      {label}
    </label>
    <input
      className="input-modern"
      style={{ margin: 0 }}
      type={type}
      value={value || ''}
      onChange={onChange}
      readOnly={readOnly}
    />
  </div>
);

const roleColor = { student: '#4f46e5', teacher: '#16a34a', parent: '#ca8a04', admin: '#dc2626' };

export default function Profile() {
  const navigate    = useNavigate();
  const [user, setUser]         = useState(null);
  const [profile, setProfile]   = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);

  /* editable form state mirrors user + profile */
  const [form, setForm] = useState({ name: '', profile: {} });

  const sf = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  const sp = (field) => (e) => setForm((prev) => ({ ...prev, profile: { ...prev.profile, [field]: e.target.value } }));

  /* ── Fetch profile ── */
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    (async () => {
      try {
        const data = await get('/auth/profile/me/', true);
        setUser({ name: data.name, email: data.email, role: data.role });
        setProfile(data.profile || {});
        setForm({ name: data.name, profile: data.profile || {} });
      } catch {
        showError('Failed to load profile. Please log in again.');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  /* ── Save profile ── */
  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await put('/auth/profile/me/', { name: form.name, profile: form.profile }, true);
      setUser((prev) => ({ ...prev, name: res.user?.name || form.name }));
      setProfile(form.profile);
      localStorage.setItem('user', JSON.stringify({ ...JSON.parse(localStorage.getItem('user') || '{}'), name: form.name }));
      setIsEditing(false);
      showSuccess('Profile updated successfully!');
    } catch {
      showError('Update failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  /* ── Role-specific view ── */
  const renderInfoBlocks = () => {
    if (!user) return null;
    const role = user.role;

    if (role === 'student') return (
      <>
        <Section label="Academic Info">
          <InfoRow label="Class / Standard"   value={profile.standard} />
          <InfoRow label="Division / Section" value={profile.division} />
          <InfoRow label="Subject / Stream"   value={profile.subject} />
          <InfoRow label="Roll Number"        value={profile.roll_number} />
          <InfoRow label="Admission Date"     value={profile.admission_date} />
        </Section>
        <Section label="Personal Info">
          <InfoRow label="Gender"         value={profile.gender} />
          <InfoRow label="Date of Birth"  value={profile.dob} />
          <InfoRow label="Contact"        value={profile.contact_number} />
          <InfoRow label="Parent Contact" value={profile.parent_contact_number} />
          <InfoRow label="Address"        value={profile.address} />
        </Section>
      </>
    );

    if (role === 'teacher') return (
      <>
        <Section label="Professional Info">
          <InfoRow label="Specialization"    value={profile.specialization} />
          <InfoRow label="Class Handled"     value={profile.standard_handled} />
          <InfoRow label="Qualification"     value={profile.qualification} />
          <InfoRow label="Experience"        value={profile.experience ? `${profile.experience} years` : ''} />
          <InfoRow label="Employee ID"       value={profile.employee_id} />
          <InfoRow label="Joining Date"      value={profile.joining_date} />
        </Section>
        <Section label="Personal Info">
          <InfoRow label="Gender"        value={profile.gender} />
          <InfoRow label="Date of Birth" value={profile.dob} />
          <InfoRow label="Contact"       value={profile.contact_number} />
          <InfoRow label="Address"       value={profile.address} />
        </Section>
      </>
    );

    if (role === 'parent') return (
      <>
        <Section label="Parent Info">
          <InfoRow label="Contact"    value={profile.contact_number} />
          <InfoRow label="Occupation" value={profile.occupation} />
          <InfoRow label="Address"    value={profile.address} />
        </Section>
        {profile.linked_children?.length > 0 && (
          <Section label="Linked Children">
            {profile.linked_children.map((c) => (
              <InfoRow key={c.id} label={`Child`} value={`${c.name} (${c.email})`} />
            ))}
          </Section>
        )}
      </>
    );

    return null;
  };

  /* ── Role-specific edit fields ── */
  const renderEditFields = () => {
    if (!user) return null;
    const role = user.role;

    if (role === 'student') return (
      <>
        <EditField label="Class / Standard" value={form.profile.standard}              onChange={sp('standard')} />
        <EditField label="Division"         value={form.profile.division}              onChange={sp('division')} />
        <EditField label="Subject / Stream" value={form.profile.subject}               onChange={sp('subject')} />
        <EditField label="Roll Number"      value={form.profile.roll_number}           onChange={sp('roll_number')} />
        <EditField label="Gender"           value={form.profile.gender}                onChange={sp('gender')} />
        <EditField label="Date of Birth"    value={form.profile.dob}                   onChange={sp('dob')} type="date" />
        <EditField label="Contact Number"   value={form.profile.contact_number}        onChange={sp('contact_number')} />
        <EditField label="Parent Contact"   value={form.profile.parent_contact_number} onChange={sp('parent_contact_number')} />
        <EditField label="Address"          value={form.profile.address}               onChange={sp('address')} />
      </>
    );

    if (role === 'teacher') return (
      <>
        <EditField label="Specialization" value={form.profile.specialization}    onChange={sp('specialization')} />
        <EditField label="Class Handled"  value={form.profile.standard_handled}  onChange={sp('standard_handled')} />
        <EditField label="Qualification"  value={form.profile.qualification}     onChange={sp('qualification')} />
        <EditField label="Experience (yrs)" value={form.profile.experience}      onChange={sp('experience')} />
        <EditField label="Employee ID"    value={form.profile.employee_id}       onChange={sp('employee_id')} />
        <EditField label="Gender"         value={form.profile.gender}            onChange={sp('gender')} />
        <EditField label="Date of Birth"  value={form.profile.dob}               onChange={sp('dob')} type="date" />
        <EditField label="Contact Number" value={form.profile.contact_number}    onChange={sp('contact_number')} />
        <EditField label="Address"        value={form.profile.address}           onChange={sp('address')} />
      </>
    );

    if (role === 'parent') return (
      <>
        <EditField label="Contact Number" value={form.profile.contact_number} onChange={sp('contact_number')} />
        <EditField label="Occupation"     value={form.profile.occupation}     onChange={sp('occupation')} />
        <EditField label="Address"        value={form.profile.address}        onChange={sp('address')} />
      </>
    );

    return null;
  };

  if (loading) return (
    <div className="app-container page-enter-active">
      <div className="card card-modern" style={{ textAlign: 'center', padding: '80px' }}>Loading profile…</div>
    </div>
  );

  if (!user) return null;

  const accentColor = roleColor[user.role] || '#4f46e5';
  const initials    = (user.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="app-container page-enter-active">
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* ── HEADER CARD ── */}
        <div className="card card-modern" style={{ overflow: 'hidden', padding: 0, marginBottom: '24px' }}>
          <div style={{ background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}cc 100%)`, padding: '40px 28px', textAlign: 'center', position: 'relative' }}>
            <div style={{
              width: '90px', height: '90px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)', border: '3px solid rgba(255,255,255,0.4)',
              margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2.2rem', fontWeight: 800, color: 'white', backdropFilter: 'blur(6px)'
            }}>
              {initials}
            </div>
            <h1 style={{ color: 'white', margin: '0 0 6px', fontSize: '1.8rem', fontWeight: 800 }}>{user.name}</h1>
            <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.88rem' }}>{user.email}</div>
            <span style={{
              display: 'inline-block', marginTop: '10px',
              background: 'rgba(255,255,255,0.2)', color: 'white',
              padding: '3px 14px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800,
              textTransform: 'uppercase', letterSpacing: '1.5px', backdropFilter: 'blur(4px)'
            }}>
              {user.role} Account
            </span>
          </div>

          <div style={{ padding: '20px 28px', display: 'flex', justifyContent: 'flex-end' }}>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="btn btn-modern btn-gradient"
                style={{ padding: '9px 24px' }}
              >
                Edit My Profile
              </button>
            ) : (
              <button
                onClick={() => { setIsEditing(false); setForm({ name: user.name, profile }); }}
                className="btn btn-modern btn-outline-modern"
                style={{ padding: '9px 24px' }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* ── VIEW MODE ── */}
        {!isEditing && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="card card-modern" style={{ padding: '24px 28px' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Account Details</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <InfoRow label="Full Name" value={user.name} />
                <InfoRow label="Email"     value={user.email} />
                <InfoRow label="Role"      value={user.role.charAt(0).toUpperCase() + user.role.slice(1)} />
              </div>
            </div>
            {renderInfoBlocks()}
          </div>
        )}

        {/* ── EDIT MODE ── */}
        {isEditing && (
          <form onSubmit={handleUpdate}>
            <div className="card card-modern" style={{ padding: '24px 28px', marginBottom: '20px' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Account Details</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                <EditField label="Full Name" value={form.name} onChange={sf('name')} />
                <EditField label="Email (read-only)" value={user.email} readOnly />
              </div>
            </div>

            {(user.role !== 'admin') && (
              <div className="card card-modern" style={{ padding: '24px 28px', marginBottom: '20px' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)} Profile
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                  {renderEditFields()}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => { setIsEditing(false); setForm({ name: user.name, profile }); }} className="btn btn-modern btn-outline-modern" style={{ padding: '10px 24px' }}>
                Discard
              </button>
              <button type="submit" className="btn btn-modern btn-gradient" style={{ padding: '10px 28px' }} disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/* ─── Section Wrapper ─── */
function Section({ label, children }) {
  return (
    <div className="card card-modern" style={{ padding: '24px 28px' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
        {label}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
        {children}
      </div>
    </div>
  );
}
