import React, { useState } from 'react';
import api from '../../api/axios';

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
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Add Child</h3>
        <form onSubmit={handleSubmit}>
          <label>Name</label>
          <input required value={form.name} onChange={(e) => update('name', e.target.value)} />
          <label>Date of Birth</label>
          <input required type="date" value={form.dob} onChange={(e) => update('dob', e.target.value)} />
          <label>Target Exam</label>
          <input value={form.target_exam} onChange={(e) => update('target_exam', e.target.value)} />
          <label>Allergies</label>
          <input value={form.allergies} onChange={(e) => update('allergies', e.target.value)} />
          <label>Category</label>
          <select value={form.category} onChange={(e) => update('category', e.target.value)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>
            Category determines which classes this child can see and register for.
          </p>
          {error && <div className="error">{error}</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="gold" type="submit">Save</button>
            <button type="button" className="secondary" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
