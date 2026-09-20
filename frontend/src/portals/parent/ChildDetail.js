import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/axios';
import Shell from '../../components/Shell';
import RegisterClassModal from './RegisterClassModal';
import { T, cardStyle, btnStyle, badgeStyle } from '../../theme';

const NAV = [
  { key: 'dashboard', to: '/parent', label: 'Main Dashboard', icon: 'family_restroom' },
  { key: 'invoices', to: '/parent/invoices', label: 'Invoices', icon: 'receipt_long' }
];
const TABS = [
  { key: 'Upcoming Classes', icon: 'event_upcoming' },
  { key: 'Classes Attended', icon: 'task_alt' },
  { key: '1:1 Classes', icon: 'person_search' },
  { key: 'Mock Exams', icon: 'assignment' }
];
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export default function ChildDetail() {
  const { id } = useParams();
  const [child, setChild] = useState(null);
  const [tab, setTab] = useState(TABS[0].key);
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
    <Shell active="dashboard" navItems={NAV} roleLabel="Parent">
      {child && (
        <div style={{ marginBottom: 16 }}>
          <h1 style={{ fontFamily: T.headlineFont, fontSize: 22, fontWeight: 700, color: T.onSurface, margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 10 }}>
            {child.name}
            <span style={badgeStyle(T.secondaryFixed, T.onSecondaryFixed)}>{child.category}</span>
          </h1>
          <p style={{ color: T.onSurfaceVariant, fontSize: 13.5 }}>
            DOB: {child.dob} · Target Exam: {child.target_exam || '—'} · Allergies: {child.allergies || 'None'}
          </p>
        </div>
      )}

      <div style={{ display: 'inline-flex', padding: 6, borderRadius: 14, background: T.surfaceContainerHigh, gap: 4, marginBottom: 18, flexWrap: 'wrap' }}>
        {TABS.map((t) => {
          const isActive = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 10, border: 'none',
                cursor: 'pointer', fontSize: 13.5, fontWeight: 600,
                background: isActive ? T.surfaceContainerLowest : 'transparent',
                color: isActive ? T.onSurface : T.onSurfaceVariant,
                boxShadow: isActive ? T.shadow : 'none'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{t.icon}</span>
              {t.key}
            </button>
          );
        })}
      </div>

      {tab === 'Upcoming Classes' && (
        <div>
          <button style={{ ...btnStyle('primary'), marginBottom: 14 }} onClick={() => setShowRegisterModal(true)}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span> Register for more classes
          </button>
          {upcoming.length === 0 && <p style={{ color: T.onSurfaceVariant }}>No upcoming classes.</p>}
          {upcoming.map((r) => (
            <div key={r.id} style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <strong>{r.title}</strong>
                <div style={{ fontSize: 12, color: T.onSurfaceVariant }}>
                  {new Date(r.timing).toLocaleString()} · Teacher: {r.teacher_name}
                </div>
              </div>
              <button
                style={btnStyle('danger')}
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
          {attended.length === 0 && <p style={{ color: T.onSurfaceVariant }}>No classes attended yet.</p>}
          {attended.map((r) => (
            <div key={r.id} style={cardStyle}>
              <strong>{r.title}</strong>
              <div style={{ fontSize: 12, color: T.onSurfaceVariant }}>
                {new Date(r.timing).toLocaleString()} · Teacher: {r.teacher_name}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === '1:1 Classes' && (
        <div>
          {oneOnOne.length === 0 && <p style={{ color: T.onSurfaceVariant }}>No 1:1 classes scheduled.</p>}
          {oneOnOne.map((o) => (
            <div key={o.id} style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <strong>{o.topic || '1:1 Session'}</strong>
                <div style={{ fontSize: 12, color: T.onSurfaceVariant }}>
                  {new Date(o.timing).toLocaleString()} · Teacher: {o.teacher_name} · Status: {o.status}
                </div>
              </div>
              {o.status === 'upcoming' && (
                <button
                  style={btnStyle('danger')}
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
          {mockExams.length === 0 && <p style={{ color: T.onSurfaceVariant }}>No mock exam records yet.</p>}
          {mockExams.map((m) => (
            <div key={m.id} style={cardStyle}>
              <strong>{m.exam_name}</strong>
              <div style={{ fontSize: 12, color: T.onSurfaceVariant }}>
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
    </Shell>
  );
}
