import React, { useState } from 'react';
import api from '../../api/axios';
import ParentShell from './ParentShell';
import AddChildModal from './AddChildModal';
import { useParent } from './ParentContext';
import { P, cardStyle, btn, inputStyle, labelStyle } from './theme';

const CATEGORIES = ['7+', '8+', '9+', '10+', '11+', '13+'];
const toDateInput = (d) => (d ? String(d).slice(0, 10) : '');

function ChildCard({ child, onSaved }) {
  const [form, setForm] = useState({
    name: child.name, dob: toDateInput(child.dob), target_exam: child.target_exam || '',
    allergies: child.allergies || '', category: child.category
  });
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const update = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setMsg(''); };

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/children/${child.id}`, form);
      setMsg('Saved');
      onSaved();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Could not save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} style={cardStyle}>
      <div style={{ fontFamily: P.headlineFont, fontWeight: 700, color: P.navy, fontSize: 17, marginBottom: 10 }}>{child.name}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div>
          <label style={labelStyle}>Name</label>
          <input required value={form.name} onChange={(e) => update('name', e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Date of birth</label>
          <input type="date" value={form.dob} onChange={(e) => update('dob', e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Category</label>
          <select value={form.category} onChange={(e) => update('category', e.target.value)} style={inputStyle}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Target exam</label>
          <input value={form.target_exam} onChange={(e) => update('target_exam', e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Allergies / medical notes</label>
          <input value={form.allergies} onChange={(e) => update('allergies', e.target.value)} style={inputStyle} />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14 }}>
        <button type="submit" disabled={saving} style={btn('gold')}>{saving ? 'Saving...' : 'Save changes'}</button>
        {msg && <span style={{ fontSize: 12.5, color: msg === 'Saved' ? P.green : P.red }}>{msg}</span>}
      </div>
    </form>
  );
}

export default function MyChildren() {
  const { kids, loading, reload } = useParent();
  const [adding, setAdding] = useState(false);

  return (
    <ParentShell>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
        <h1 style={{ fontFamily: P.headlineFont, fontSize: 26, color: P.navy, margin: 0 }}>My Children</h1>
        <button style={btn('gold')} onClick={() => setAdding(true)}>+ Add a child</button>
      </div>
      <p style={{ color: P.meta, marginBottom: 20 }}>
        Keep your child's details up to date. The category decides which classes they can see and book.
      </p>

      {!loading && kids.length === 0 && <p style={{ color: P.meta }}>No children added yet.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {kids.map((c) => <ChildCard key={c.id} child={c} onSaved={reload} />)}
      </div>

      {adding && <AddChildModal onClose={() => setAdding(false)} onAdded={() => { setAdding(false); reload(); }} />}
    </ParentShell>
  );
}
