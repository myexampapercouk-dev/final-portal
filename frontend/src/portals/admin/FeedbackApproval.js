import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../api/axios';
import AdminShell from './AdminShell';
import { A, cardStyle, btn, badge, inputStyle } from './theme';

const STATUS = {
  none: { label: 'Not completed by teacher', bg: A.cream, fg: A.meta },
  pending: { label: 'Awaiting approval', bg: A.goldSoft, fg: '#7A5B00' },
  approved: { label: 'Approved - live for parents', bg: A.greenWash, fg: A.green }
};

export default function FeedbackApproval() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [editing, setEditing] = useState(null); // { id, content }
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => api.get(`/admin/classes/${id}/feedback-review`).then(({ data: d }) => setData(d));
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  async function saveEdit() {
    await api.put(`/admin/feedback/${editing.id}`, { content: editing.content });
    setEditing(null);
    load();
  }

  async function approve() {
    setBusy(true);
    setMsg('');
    try {
      const { data: res } = await api.post(`/admin/classes/${id}/approve-feedback`);
      setMsg(`Approved - ${res.notified} parent email${res.notified === 1 ? '' : 's'} sent.`);
      load();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Could not approve');
    } finally {
      setBusy(false);
    }
  }

  if (!data) return <AdminShell><p style={{ color: A.meta }}>Loading...</p></AdminShell>;
  const status = STATUS[data.feedback_status] || STATUS.none;

  return (
    <AdminShell>
      <Link to="/admin/courses" style={{ fontSize: 13, color: A.meta, textDecoration: 'none' }}>&larr; Back to Courses &amp; Classes</Link>
      <h1 style={{ fontFamily: A.headlineFont, fontSize: 26, color: A.navy, margin: '8px 0 4px' }}>Feedback review</h1>
      <p style={{ color: A.meta, margin: '0 0 10px' }}>
        {data.title} · {data.course_name} · {new Date(data.timing).toLocaleDateString()} · Teacher: {data.teacher_name}
      </p>
      <span style={badge(status.bg, status.fg)}>{status.label}</span>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14, marginTop: 18 }}>
        {data.students.length === 0 && <p style={{ color: A.meta }}>No students were marked present.</p>}
        {data.students.map((s) => (
          <div key={s.registration_id} style={{ ...cardStyle, marginBottom: 0 }}>
            <strong style={{ color: A.navy }}>{s.child_name}</strong>
            <div style={{ fontSize: 12, color: A.meta }}>{s.category}{s.parent_name ? ` · Parent: ${s.parent_name}` : ' · no parent linked (no email will be sent)'}</div>
            {s.feedback.length === 0 && <p style={{ color: A.red, fontSize: 13 }}>No remarks.</p>}
            {s.feedback.map((f) => (
              <div key={f.id} style={{ marginTop: 10, paddingLeft: 10, borderLeft: `3px solid ${A.gold}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: A.meta }}>{f.subject || 'General'}</div>
                {editing && editing.id === f.id ? (
                  <>
                    <textarea rows={3} value={editing.content} onChange={(e) => setEditing({ ...editing, content: e.target.value })} style={{ ...inputStyle, marginTop: 4 }} />
                    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                      <button style={btn('gold')} onClick={saveEdit}>Save</button>
                      <button style={btn('secondary')} onClick={() => setEditing(null)}>Cancel</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 13, color: '#334155', marginTop: 2 }}>{f.content}</div>
                    <button style={{ ...btn('secondary'), padding: '4px 10px', fontSize: 12, marginTop: 6 }} onClick={() => setEditing({ id: f.id, content: f.content })}>Edit</button>
                  </>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {msg && <div style={{ marginTop: 14, fontSize: 13, padding: '10px 14px', borderRadius: 8, background: msg.startsWith('Approved') ? A.greenWash : A.redWash, color: msg.startsWith('Approved') ? A.green : A.red }}>{msg}</div>}

      {data.feedback_status === 'pending' && (
        <div style={{ marginTop: 20 }}>
          <button style={btn('gold')} disabled={busy} onClick={approve}>{busy ? 'Approving...' : 'Approve & notify parents'}</button>
        </div>
      )}
    </AdminShell>
  );
}
