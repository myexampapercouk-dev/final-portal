import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import AdminShell from './AdminShell';
import { A, cardStyle, btn, badge, labelStyle, inputStyle, thStyle, tdStyle } from './theme';

const CATEGORIES = ['7+', '8+', '9+', '10+', '11+', '13+'];

function LinkParentModal({ student, onClose, onDone }) {
  const [mode, setMode] = useState('pick'); // pick | create
  const [parents, setParents] = useState([]);
  const [parentId, setParentId] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.get('/admin/parents').then(({ data }) => setParents(data)); }, []);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'pick') {
        if (!parentId) { setError('Choose a parent'); setBusy(false); return; }
        await api.put(`/admin/students/${student.id}/parent`, { parent_id: parentId });
      } else {
        await api.post(`/admin/students/${student.id}/create-parent`, form);
      }
      onDone();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not link parent');
      setBusy(false);
    }
  }

  const tab = (key, label) => (
    <button type="button" onClick={() => setMode(key)} style={{
      flex: 1, padding: '9px 0', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13,
      border: `1.5px solid ${mode === key ? A.navy : A.line}`, background: mode === key ? A.navy : '#fff', color: mode === key ? '#fff' : A.navy
    }}>{label}</button>
  );

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <form style={styles.modal} onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h3 style={{ fontFamily: A.headlineFont, color: A.navy, marginTop: 0 }}>Link a parent to {student.name}</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {tab('pick', 'Pick existing parent')}
          {tab('create', 'Create new parent')}
        </div>

        {mode === 'pick' ? (
          <>
            <label style={labelStyle}>Parent</label>
            <select value={parentId} onChange={(e) => setParentId(e.target.value)} style={inputStyle}>
              <option value="">Select a parent...</option>
              {parents.map((p) => <option key={p.id} value={p.id}>{p.name} - {p.email}</option>)}
            </select>
          </>
        ) : (
          <>
            <label style={labelStyle}>Full name</label>
            <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} style={inputStyle} />
            <label style={labelStyle}>Email (their login)</label>
            <input required type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} style={inputStyle} />
            <label style={labelStyle}>Phone (optional)</label>
            <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} style={inputStyle} />
            <label style={labelStyle}>Temporary password</label>
            <input required type="text" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} style={inputStyle} />
          </>
        )}

        {error && <div style={{ color: A.red, fontSize: 12.5, background: A.redWash, padding: '8px 12px', borderRadius: 8, marginTop: 10 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
          <button type="button" style={btn('secondary')} onClick={onClose}>Cancel</button>
          <button type="submit" style={btn('gold')} disabled={busy}>{mode === 'pick' ? 'Link parent' : 'Create and link'}</button>
        </div>
      </form>
    </div>
  );
}

export default function Students() {
  const [params, setParams] = useSearchParams();
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [linking, setLinking] = useState(null);
  const filter = params.get('filter') === 'new' ? 'new' : 'all';

  const load = () => api.get('/admin/students').then(({ data }) => setStudents(data));
  useEffect(() => { load(); }, []);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      if (filter === 'new' && s.parent_id) return false;
      if (category && s.category !== category) return false;
      if (q && !s.name.toLowerCase().includes(q) && !(s.parent_name || '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [students, filter, category, search]);

  const newCount = students.filter((s) => !s.parent_id).length;

  return (
    <AdminShell>
      <h1 style={{ fontFamily: A.headlineFont, fontSize: 26, color: A.navy, margin: '0 0 4px' }}>Students</h1>
      <p style={{ color: A.meta, marginBottom: 18 }}>
        {shown.length} of {students.length} student{students.length === 1 ? '' : 's'}
        {newCount > 0 && <span style={{ color: A.red, fontWeight: 600 }}> · {newCount} with no parent linked</span>}
      </p>

      <div style={{ ...cardStyle, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 220px' }}>
          <label style={labelStyle}>Search</label>
          <input placeholder="Student or parent name..." value={search} onChange={(e) => setSearch(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ flex: '0 1 180px' }}>
          <label style={labelStyle}>Show</label>
          <select value={filter} onChange={(e) => setParams(e.target.value === 'new' ? { filter: 'new' } : {})} style={inputStyle}>
            <option value="all">All students</option>
            <option value="new">New (no parent yet)</option>
          </select>
        </div>
        <div style={{ flex: '0 1 150px' }}>
          <label style={labelStyle}>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
            <option value="">All</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div style={{ background: A.paper, borderRadius: A.radius, boxShadow: A.shadow, border: `1px solid ${A.line}`, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{ width: '100%', minWidth: 640, borderCollapse: 'collapse', fontSize: 13.5 }}>
          <thead>
            <tr style={{ background: A.navy, color: '#fff', textTransform: 'uppercase' }}>
              <th style={thStyle}>Student</th><th style={thStyle}>Category</th><th style={thStyle}>Parent</th><th style={thStyle}>Added by</th><th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && <tr><td style={{ ...tdStyle, color: A.meta }} colSpan={5}>No students match.</td></tr>}
            {shown.map((s, i) => (
              <tr key={s.id} style={{ background: i % 2 ? '#FBF9F3' : '#fff', borderBottom: `1px solid ${A.line}` }}>
                <td style={tdStyle}><strong style={{ color: A.navy }}>{s.name}</strong></td>
                <td style={tdStyle}>{s.category}</td>
                <td style={tdStyle}>
                  {s.parent_id ? (
                    <>{s.parent_name}<div style={{ fontSize: 12, color: A.meta }}>{s.parent_email}</div></>
                  ) : (
                    <span style={badge(A.redWash, A.red)}>New · no parent</span>
                  )}
                </td>
                <td style={tdStyle}>{s.added_by_teacher || '-'}</td>
                <td style={tdStyle}>
                  <button style={btn(s.parent_id ? 'secondary' : 'gold')} onClick={() => setLinking(s)}>
                    {s.parent_id ? 'Change parent' : 'Link parent'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {linking && <LinkParentModal student={linking} onClose={() => setLinking(null)} onDone={() => { setLinking(null); load(); }} />}
    </AdminShell>
  );
}

const styles = {
  backdrop: {
    position: 'fixed', inset: 0, background: 'rgba(22,36,61,.55)', display: 'flex',
    alignItems: 'flex-start', justifyContent: 'center', padding: '40px 14px', overflow: 'auto', zIndex: 200
  },
  modal: { background: '#fff', padding: 26, borderRadius: 16, width: 440, maxWidth: '100%', boxShadow: '0 20px 60px rgba(0,0,0,.3)' }
};
