import React, { useState } from 'react';
import api from '../../api/axios';
import { P, btn, inputStyle, labelStyle } from './theme';

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
    } catch (err) {
      setError(err.response?.data?.error || 'Could not add child');
    }
  }

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontFamily: P.headlineFont, color: P.navy, marginTop: 0 }}>Add Child</h3>
        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>Name</label>
          <input required value={form.name} onChange={(e) => update('name', e.target.value)} style={inputStyle} />
          <label style={{ ...labelStyle, marginTop: 12 }}>Date of Birth</label>
          <input required type="date" value={form.dob} onChange={(e) => update('dob', e.target.value)} style={inputStyle} />
          <label style={{ ...labelStyle, marginTop: 12 }}>Target Exam (optional)</label>
          <input value={form.target_exam} onChange={(e) => update('target_exam', e.target.value)} style={inputStyle} />
          <label style={{ ...labelStyle, marginTop: 12 }}>Allergies (optional)</label>
          <input value={form.allergies} onChange={(e) => update('allergies', e.target.value)} style={inputStyle} />
          <label style={{ ...labelStyle, marginTop: 12 }}>Category</label>
          <select value={form.category} onChange={(e) => update('category', e.target.value)} style={inputStyle}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <p style={{ fontSize: 12, color: P.meta, marginTop: 8 }}>
            Category determines which classes this child can see and register for.
          </p>
          {error && <div style={{ color: P.red, fontSize: 12.5, background: P.redWash, padding: '8px 12px', borderRadius: 8, marginTop: 8 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={btn('secondary')}>Cancel</button>
            <button type="submit" style={btn('gold')}>Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: 'fixed', inset: 0, background: 'rgba(22,36,61,.55)', display: 'flex',
    alignItems: 'flex-start', justifyContent: 'center', padding: '40px 14px', overflow: 'auto', zIndex: 200
  },
  modal: { background: '#fff', padding: 26, borderRadius: 16, width: 420, maxWidth: '100%', boxShadow: '0 20px 60px rgba(0,0,0,.3)' }
};
