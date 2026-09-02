import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { FILE_BASE_URL } from '../../api/axios';
import Nav from '../../components/Nav';

const TABS = ['Students & Attendance', 'Feedback', 'Material'];

export default function ClassDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cls, setCls] = useState(null);
  const [registrations, setRegistrations] = useState([]); // full class-category roster, incl. unregistered
  const [attendanceDraft, setAttendanceDraft] = useState({}); // keyed by child_id
  const [tab, setTab] = useState(TABS[0]);
  const [feedbackDraft, setFeedbackDraft] = useState({}); // keyed by registration_id
  const [feedbackList, setFeedbackList] = useState([]);

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  async function load() {
    const [classesRes, regsRes, fbRes] = await Promise.all([
      api.get('/classes'),
      api.get(`/registrations/class/${id}`),
      api.get(`/registrations/class/${id}/feedback`)
    ]);
    const found = classesRes.data.find((c) => String(c.id) === String(id));
    setCls(found);
    setRegistrations(regsRes.data);
    setFeedbackList(fbRes.data);
    const draft = {};
    regsRes.data.forEach((r) => { draft[r.child_id] = r.present === 1; });
    setAttendanceDraft(draft);
  }

  async function saveAttendance() {
    const attendance = registrations.map((r) => ({
      child_id: r.child_id,
      registration_id: r.registration_id,
      present: !!attendanceDraft[r.child_id]
    }));
    await api.post(`/registrations/class/${id}/attendance`, { attendance });
    load();
  }

  async function submitFeedback(registrationId) {
    const content = feedbackDraft[registrationId];
    if (!content) return;
    await api.post(`/registrations/${registrationId}/feedback`, { content });
    setFeedbackDraft((d) => ({ ...d, [registrationId]: '' }));
    load();
  }

  async function completeClass() {
    if (!window.confirm('Mark this class as complete? This will reflect across parent and admin portals.')) return;
    await api.post(`/registrations/class/${id}/complete`);
    navigate('/teacher');
  }

  if (!cls) return <div className="container">Loading...</div>;

  // Only children who are (a) checked present AND (b) actually have a registration
  // (walk-ins get a registration_id once "Save Attendance" auto-registers them)
  const presentStudents = registrations.filter((r) => attendanceDraft[r.child_id] && r.registration_id);

  return (
    <div>
      <Nav links={[{ to: '/teacher', label: 'My Classes' }, { to: '/teacher/one-on-one', label: '1:1 Sessions' }]} />
      <div className="container">
        <h2>{cls.title}</h2>
        <p style={{ color: '#64748b' }}>
          {cls.course_name} · {new Date(cls.timing).toLocaleString()} · Status: {cls.status}
          {' · '}<span className="badge">{cls.registered_count} currently registered</span>
        </p>

        <div className="tabs">
          {TABS.map((t) => (
            <div key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</div>
          ))}
        </div>

        {tab === 'Students & Attendance' && (
          <div>
            <table>
              <thead><tr><th>Child</th><th>Category</th><th>Status</th><th>Present</th></tr></thead>
              <tbody>
                {registrations.map((r) => (
                  <tr key={r.child_id}>
                    <td>{r.child_name}</td>
                    <td>{r.category}</td>
                    <td>
                      {r.registration_id
                        ? r.status
                        : <span style={{ color: '#94a3b8' }}>Not registered</span>}
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        style={{ width: 'auto' }}
                        checked={!!attendanceDraft[r.child_id]}
                        onChange={(e) => setAttendanceDraft((d) => ({ ...d, [r.child_id]: e.target.checked }))}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
              Checking "Present" for a child who isn't registered will register them for this class as a walk-in.
            </p>
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <button className="gold" onClick={saveAttendance}>Save Attendance</button>
              {cls.status !== 'completed' && <button className="secondary" onClick={completeClass}>Complete Class</button>}
            </div>
          </div>
        )}

        {tab === 'Feedback' && (
          <div>
            {presentStudents.length === 0 && (
              <p style={{ color: '#64748b' }}>
                Mark students present and click "Save Attendance" first to give feedback.
              </p>
            )}
            {presentStudents.map((r) => {
              const existing = feedbackList.filter((f) => f.registration_id === r.registration_id);
              return (
                <div key={r.registration_id} className="card">
                  <strong>{r.child_name}</strong>
                  {existing.map((f) => (
                    <p key={f.id} style={{ fontSize: 13, color: '#334155', background: '#f1f5f9', padding: 8, borderRadius: 6 }}>{f.content}</p>
                  ))}
                  <textarea
                    rows={2}
                    placeholder="Add feedback..."
                    value={feedbackDraft[r.registration_id] || ''}
                    onChange={(e) => setFeedbackDraft((d) => ({ ...d, [r.registration_id]: e.target.value }))}
                  />
                  <button style={{ marginTop: 6 }} onClick={() => submitFeedback(r.registration_id)}>Submit Feedback</button>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'Material' && (
          <div className="card">
            {cls.materials && cls.materials.length > 0 ? (
              cls.materials.map((m) => (
                <div key={m.id} style={{ marginBottom: 8 }}>
                  <a href={`${FILE_BASE_URL}${m.file_path}`} target="_blank" rel="noreferrer">{m.file_name}</a>
                </div>
              ))
            ) : (
              <p style={{ color: '#64748b' }}>No material uploaded by admin yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
