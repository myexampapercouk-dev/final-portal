import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import AdminShell from './AdminShell';
import { A, cardStyle, btn, labelStyle, inputStyle, thStyle, tdStyle } from './theme';

export default function AdminHomework() {
  const [classes, setClasses] = useState([]);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ class_id: '', title: '' });
  const [homeworkFile, setHomeworkFile] = useState(null);
  const [answerFile, setAnswerFile] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [fileKey, setFileKey] = useState(0); // resets the file inputs after saving

  const load = () => api.get('/homework/all').then(({ data }) => setItems(data));
  useEffect(() => {
    load();
    api.get('/classes').then(({ data }) => setClasses(data));
  }, []);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!homeworkFile) { setError('Attach the homework PDF'); return; }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('class_id', form.class_id);
      fd.append('title', form.title);
      fd.append('homework', homeworkFile);
      if (answerFile) fd.append('answer', answerFile);
      await api.post('/homework', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm({ class_id: '', title: '' });
      setHomeworkFile(null);
      setAnswerFile(null);
      setFileKey((k) => k + 1);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not upload homework');
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    if (!window.confirm('Delete this homework?')) return;
    await api.delete(`/homework/${id}`);
    load();
  }

  return (
    <AdminShell>
      <h1 style={{ fontFamily: A.headlineFont, fontSize: 26, color: A.navy, margin: '0 0 4px' }}>Homework</h1>
      <p style={{ color: A.meta, marginBottom: 18 }}>
        Parents see homework for the classes their child is registered in, newest first. PDFs are view-only for parents.
      </p>

      <form onSubmit={submit} style={cardStyle}>
        <label style={labelStyle}>Class</label>
        <select required value={form.class_id} onChange={(e) => setForm((f) => ({ ...f, class_id: e.target.value }))} style={inputStyle}>
          <option value="">Select a class...</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.title} - {new Date(c.timing).toLocaleDateString()}</option>
          ))}
        </select>
        <label style={labelStyle}>Title</label>
        <input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} style={inputStyle} />
        <label style={labelStyle}>Homework PDF</label>
        <input key={`h${fileKey}`} type="file" accept="application/pdf" onChange={(e) => setHomeworkFile(e.target.files[0] || null)} />
        <label style={labelStyle}>Answers PDF (optional)</label>
        <input key={`a${fileKey}`} type="file" accept="application/pdf" onChange={(e) => setAnswerFile(e.target.files[0] || null)} />
        {error && <div style={{ color: A.red, fontSize: 12.5, background: A.redWash, padding: '8px 12px', borderRadius: 8, marginTop: 10 }}>{error}</div>}
        <div style={{ marginTop: 14 }}>
          <button type="submit" disabled={busy} style={btn('gold')}>{busy ? 'Uploading...' : 'Add homework'}</button>
        </div>
      </form>

      <div style={{ background: A.paper, borderRadius: A.radius, boxShadow: A.shadow, border: `1px solid ${A.line}`, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{ width: '100%', minWidth: 560, borderCollapse: 'collapse', fontSize: 13.5 }}>
          <thead>
            <tr style={{ background: A.navy, color: '#fff', textTransform: 'uppercase' }}>
              <th style={thStyle}>Title</th><th style={thStyle}>Class</th><th style={thStyle}>Files</th><th style={thStyle}>Added</th><th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && <tr><td style={{ ...tdStyle, color: A.meta }} colSpan={5}>No homework yet.</td></tr>}
            {items.map((h, i) => (
              <tr key={h.id} style={{ background: i % 2 ? '#FBF9F3' : '#fff', borderBottom: `1px solid ${A.line}` }}>
                <td style={tdStyle}><strong style={{ color: A.navy }}>{h.title}</strong></td>
                <td style={tdStyle}>{h.class_title}</td>
                <td style={tdStyle}>{h.file_name}{h.answer_file_name ? ` + ${h.answer_file_name}` : ''}</td>
                <td style={tdStyle}>{new Date(h.created_at).toLocaleDateString()}</td>
                <td style={tdStyle}><button style={btn('danger')} onClick={() => remove(h.id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
