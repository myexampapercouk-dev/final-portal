import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/axios';
import Nav from '../../components/Nav';
import RegisterClassModal from './RegisterClassModal';

const TABS = ['Upcoming Classes', 'Classes Attended', '1:1 Classes', 'Mock Exams'];
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export default function ChildDetail() {
  const { id } = useParams();
  const [child, setChild] = useState(null);
  const [tab, setTab] = useState(TABS[0]);
  const [upcoming, setUpcoming] = useState([]);
  const [attended, setAttended] = useState([]);
  const [oneOnOne, setOneOnOne] = useState([]);
  const [mockExams, setMockExams] = useState([]);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  useEffect(() => { loadChild(); loadAll(); /* eslint-disable-next-line */ }, [id]);

  async function loadChild() {
    const { data } = await api.get(`/children/${id}`);
    setChild(data);
  }

  async function loadAll() {
    const [u, a, o, m] = await Promise.all([
      api.get(`/registrations/child/${id}/upcoming`),
      api.get(`/registrations/child/${id}/attended`),
      api.get(`/one-on-one/child/${id}`),
      api.get(`/mock-exams/child/${id}`)
    ]);
    setUpcoming(u.data);
    setAttended(a.data);
    setOneOnOne(o.data);
    setMockExams(m.data);
  }

  async function cancelRegistration(regId) {
    try {
      await api.post(`/registrations/${regId}/cancel`);
      loadAll();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not cancel');
    }
  }

  async function cancelOneOnOne(oId) {
    try {
      await api.post(`/one-on-one/${oId}/cancel`);
      loadAll();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not cancel');
    }
  }

  function canCancel(timing) {
    return new Date(timing).getTime() - Date.now() >= TWENTY_FOUR_HOURS_MS;
  }

  return (
    <div>
      <Nav links={[{ to: '/parent', label: 'Main Dashboard' }, { to: '/parent/invoices', label: 'Invoices' }]} />
      <div className="container">
        {child && (
          <div style={{ marginBottom: 12 }}>
            <h2 style={{ marginBottom: 4 }}>{child.name} <span className="badge">{child.category}</span></h2>
            <p style={{ color: '#64748b', fontSize: 14 }}>
              DOB: {child.dob} · Target Exam: {child.target_exam || '—'} · Allergies: {child.allergies || 'None'}
            </p>
          </div>
        )}

        <div className="tabs">
          {TABS.map((t) => (
            <div key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</div>
          ))}
        </div>

        {tab === 'Upcoming Classes' && (
          <div>
            <button className="gold" onClick={() => setShowRegisterModal(true)} style={{ marginBottom: 12 }}>
              + Register for more classes
            </button>
            {upcoming.length === 0 && <p style={{ color: '#64748b' }}>No upcoming classes.</p>}
            {upcoming.map((r) => (
              <div key={r.id} className="card" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <strong>{r.title}</strong>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    {new Date(r.timing).toLocaleString()} · Teacher: {r.teacher_name}
                  </div>
                </div>
                <button
                  className="danger"
                  disabled={!canCancel(r.timing)}
                  title={!canCancel(r.timing) ? 'Cancellation window (24h) has passed' : ''}
                  onClick={() => cancelRegistration(r.id)}
                >
                  Cancel
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === 'Classes Attended' && (
          <div>
            {attended.length === 0 && <p style={{ color: '#64748b' }}>No classes attended yet.</p>}
            {attended.map((r) => (
              <div key={r.id} className="card">
                <strong>{r.title}</strong>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  {new Date(r.timing).toLocaleString()} · Teacher: {r.teacher_name}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === '1:1 Classes' && (
          <div>
            {oneOnOne.length === 0 && <p style={{ color: '#64748b' }}>No 1:1 classes scheduled.</p>}
            {oneOnOne.map((o) => (
              <div key={o.id} className="card" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <strong>{o.topic || '1:1 Session'}</strong>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    {new Date(o.timing).toLocaleString()} · Teacher: {o.teacher_name} · Status: {o.status}
                  </div>
                </div>
                {o.status === 'upcoming' && (
                  <button
                    className="danger"
                    disabled={!canCancel(o.timing)}
                    title={!canCancel(o.timing) ? 'Cancellation window (24h) has passed' : ''}
                    onClick={() => cancelOneOnOne(o.id)}
                  >
                    Cancel
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'Mock Exams' && (
          <div>
            {mockExams.length === 0 && <p style={{ color: '#64748b' }}>No mock exam records yet.</p>}
            {mockExams.map((m) => (
              <div key={m.id} className="card">
                <strong>{m.exam_name}</strong>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  {m.exam_date || 'Date TBD'} · Score: {m.score || '—'}
                </div>
                {m.remarks && <p style={{ fontSize: 13, marginTop: 4 }}>{m.remarks}</p>}
              </div>
            ))}
          </div>
        )}

        {showRegisterModal && (
          <RegisterClassModal
            childId={id}
            onClose={() => setShowRegisterModal(false)}
            onRegistered={loadAll}
          />
        )}
      </div>
    </div>
  );
}
