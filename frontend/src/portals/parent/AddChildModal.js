import React, { useState } from 'react';
import api from '../../api/axios';
import { T, btnStyle, labelStyle, inputStyle, modalBackdrop, modalCard } from '../../theme';

const CATEGORIES = ['7+', '8+', '9+', '10+', '11+', '13+'];

export default function AddChildModal({ onClose, onAdded }) {
  const [form, setForm] = useState({
    name: '', dob: '', target_exam: '', allergies: '', category: CATEGORIES[0]
  });
  const [error, setError] = useState('');

  function update(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/children', form);
      onAdded(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not add child');
    }
  }

  return (
    <div style={modalBackdrop} onClick={onClose}>
      <div style={{ ...modalCard, maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontFamily: T.headlineFont, marginTop: 0 }}>Add Child</h3>
        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>Name</label>
          <input required value={form.name} onChange={(e) => update('name', e.target.value)} style={inputStyle} />
          <label style={labelStyle}>Date of Birth</label>
          <input required type="date" value={form.dob} onChange={(e) => update('dob', e.target.value)} style={inputStyle} />
          <label style={labelStyle}>Target Exam</label>
          <input value={form.target_exam} onChange={(e) => update('target_exam', e.target.value)} style={inputStyle} />
          <label style={labelStyle}>Allergies</label>
          <input value={form.allergies} onChange={(e) => update('allergies', e.target.value)} style={inputStyle} />
          <label style={labelStyle}>Category</label>
          <select value={form.category} onChange={(e) => update('category', e.target.value)} style={inputStyle}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <p style={{ fontSize: 12, color: T.onSurfaceVariant, marginTop: 8 }}>
            Category determines which classes this child can see and register for.
          </p>
          {error && <div style={{ color: T.error, fontSize: 12.5, background: T.errorContainer, padding: '7px 11px', borderRadius: 8, marginTop: 6 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
            <button type="button" style={btnStyle('secondaryOutline')} onClick={onClose}>Cancel</button>
            <button type="submit" style={btnStyle('primary')}>Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}
