import React, { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import TeacherShell from './TeacherShell';
import { T, cardStyle, btn } from './theme';

const TABS = ['Upcoming', 'Completed'];

// Teachers only view their 1:1 sessions here - admin schedules and cancels them.
export default function TeacherOneOnOne() {
  const [tab, setTab] = useState('Upcoming');
  const [sessions, setSessions] = useState([]);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await api.get('/one-on-one/mine');
    setSessions(data);
  }

  async function completeSession(id) {
    try {
      await api.post(`/one-on-one/${id}/complete`);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not mark complete');
    }
  }

  const upcoming = useMemo(() => sessions.filter((s) => s.status === 'upcoming'), [sessions]);
  const completed = useMemo(() => sessions.filter((s) => s.status === 'completed'), [sessions]);

  return (
    <TeacherShell>
      <div style={{ maxWidth: 700 }}>
        <h1 style={{ fontFamily: T.headlineFont, fontSize: 24, color: T.navy, margin: '0 0 4px' }}>1:1 Sessions</h1>
        <p style={{ color: T.meta, fontSize: 13, margin: '0 0 16px' }}>Sessions are scheduled by admin. Contact admin to change or cancel one.</p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '8px 18px', borderRadius: 999, fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
                border: `1.5px solid ${tab === t ? T.navy : T.line}`,
                background: tab === t ? T.navy : '#fff',
                color: tab === t ? '#fff' : T.navy
              }}
            >
              {t}
              {t === 'Upcoming' && upcoming.length > 0 ? ` (${upcoming.length})` : ''}
              {t === 'Completed' && completed.length > 0 ? ` (${completed.length})` : ''}
            </button>
          ))}
        </div>

        {tab === 'Upcoming' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {upcoming.length === 0 && <p style={{ color: T.meta }}>No upcoming 1:1 sessions.</p>}
            {upcoming.map((s) => (
              <div key={s.id} style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <strong style={{ color: T.navy }}>{s.child_name}</strong> — {s.topic || 'Session'}
                  <div style={{ fontSize: 12, color: T.meta }}>{new Date(s.timing).toLocaleString()}</div>
                  {s.notes && <div style={{ fontSize: 12.5, color: '#334155', marginTop: 4 }}>{s.notes}</div>}
                </div>
                <button style={btn('secondary')} onClick={() => completeSession(s.id)}>Mark complete</button>
              </div>
            ))}
          </div>
        )}

        {tab === 'Completed' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {completed.length === 0 && <p style={{ color: T.meta }}>No completed 1:1 sessions yet.</p>}
            {completed.map((s) => (
              <div key={s.id} style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <strong style={{ color: T.navy }}>{s.child_name}</strong> — {s.topic || 'Session'}
                  <div style={{ fontSize: 12, color: T.meta }}>{new Date(s.timing).toLocaleString()}</div>
                  {s.notes && <div style={{ fontSize: 12.5, color: '#334155', marginTop: 4 }}>{s.notes}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </TeacherShell>
  );
}
