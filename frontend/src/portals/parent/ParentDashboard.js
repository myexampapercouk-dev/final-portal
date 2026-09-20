import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import ParentShell from './ParentShell';
import ChildPills from './ChildPills';
import ScoreRing from './ScoreRing';
import AddChildModal from './AddChildModal';
import { useParent } from './ParentContext';
import { P, cardStyle } from './theme';
import { parsePercent } from './scoreUtils';

const QUICK_ACTIONS = [
  { to: '/parent/register', icon: '\u{1F4DD}', title: 'Register for Classes', desc: 'Find and book new sessions' },
  { to: '/parent/upcoming', icon: '\u{1F4C5}', title: 'Upcoming Classes', desc: 'View upcoming lessons' },
  { to: '/parent/one-on-one', icon: '\u{1F464}', title: '1:1 Classes', desc: 'Private tuition sessions' },
  { to: '/parent/mock-exams', icon: '\u{1F4C4}', title: 'Mock Exams', desc: 'Scores, feedback and papers' }
];

export default function ParentDashboard() {
  const { user } = useAuth();
  const { selectedChild, loading: childrenLoading, reload: reloadChildren } = useParent();
  const [upcoming, setUpcoming] = useState([]);
  const [oneOnOne, setOneOnOne] = useState([]);
  const [attended, setAttended] = useState([]);
  const [mockExams, setMockExams] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [showAddChild, setShowAddChild] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/invoices').then(({ data }) => setInvoices(data));
  }, []);

  useEffect(() => {
    if (!selectedChild) { setLoading(false); return; }
    setLoading(true);
    Promise.all([
      api.get(`/registrations/child/${selectedChild.id}/upcoming`),
      api.get(`/one-on-one/child/${selectedChild.id}`),
      api.get(`/registrations/child/${selectedChild.id}/attended`),
      api.get(`/mock-exams/child/${selectedChild.id}`)
    ]).then(([u, o, a, m]) => {
      setUpcoming(u.data);
      setOneOnOne(o.data);
      setAttended(a.data);
      setMockExams(m.data);
      setLoading(false);
    });
  }, [selectedChild]);

  const outstanding = invoices.filter((i) => i.status === 'unpaid').reduce((s, i) => s + Number(i.total_amount), 0);

  const nextOneOnOne = oneOnOne.filter((o) => o.status === 'upcoming').sort((a, b) => new Date(a.timing) - new Date(b.timing))[0];
  const nextClass = [...upcoming.map((r) => ({ ...r, kind: 'class' })), ...(nextOneOnOne ? [{ ...nextOneOnOne, kind: '1:1' }] : [])]
    .sort((a, b) => new Date(a.timing) - new Date(b.timing))[0];

  const activity = [
    ...attended.map((r) => ({ date: r.timing, title: r.title, sub: `Class attended · Teacher: ${r.teacher_name}` })),
    ...oneOnOne.filter((o) => o.status === 'completed').map((o) => ({ date: o.timing, title: o.topic || '1:1 Session', sub: `Completed · Teacher: ${o.teacher_name}` })),
    ...mockExams.map((m) => ({ date: m.exam_date, title: m.exam_name, sub: m.score ? `Score: ${m.score}` : 'Mock exam recorded' }))
  ].filter((a) => a.date).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  const latestMockExam = [...mockExams].sort((a, b) => new Date(b.exam_date) - new Date(a.exam_date))[0];
  const latestPercent = latestMockExam ? parsePercent(latestMockExam.score) : null;

  return (
    <ParentShell>
      <div style={{ marginBottom: 4, fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: P.gold, fontWeight: 700 }}>Parent Portal</div>
      <h1 style={{ fontFamily: P.headlineFont, fontSize: 28, color: P.navy, margin: '0 0 6px' }}>
        Hello, {user?.name?.split(' ')[0] || 'there'}
      </h1>
      <p style={{ color: P.meta, marginBottom: 24 }}>
        {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
        {selectedChild && ` · ${upcoming.length} class${upcoming.length === 1 ? '' : 'es'} booked for ${selectedChild.name}`}
      </p>

      <div style={{ fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase', color: P.meta, fontWeight: 600, marginBottom: 8 }}>Your Children</div>
      <ChildPills onAddChild={() => setShowAddChild(true)} />

      {!childrenLoading && !selectedChild && (
        <div style={{ ...cardStyle, textAlign: 'center', color: P.meta }}>
          No children added yet. Use "+ Add a child" above to get started.
        </div>
      )}

      {selectedChild && (
        <>
          <Link to="/parent/invoices" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: P.goldSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                {'\u{1F4CB}'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: P.navy }}>Invoices</div>
                <div style={{ fontSize: 12.5, color: P.meta }}>View invoices, payments and outstanding balances</div>
                {outstanding > 0 && (
                  <span style={{ display: 'inline-block', marginTop: 6, fontSize: 11, fontWeight: 700, color: '#7A5B00', background: P.goldSoft, padding: '3px 10px', borderRadius: 999 }}>
                    £{outstanding.toFixed(2)} outstanding
                  </span>
                )}
              </div>
              <span style={{ color: P.meta }}>{'›'}</span>
            </div>
          </Link>

          <div style={{ fontFamily: P.headlineFont, fontSize: 18, color: P.navy, marginBottom: 12 }}>Quick actions</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginBottom: 24 }}>
            {QUICK_ACTIONS.map((qa) => (
              <Link key={qa.to} to={qa.to} style={{ textDecoration: 'none' }}>
                <div style={cardStyle}>
                  <div style={{ fontSize: 20, marginBottom: 8 }}>{qa.icon}</div>
                  <div style={{ fontWeight: 600, color: P.navy, marginBottom: 3 }}>{qa.title}</div>
                  <div style={{ fontSize: 12.5, color: P.meta }}>{qa.desc}</div>
                </div>
              </Link>
            ))}
          </div>

          {!loading && nextClass && (
            <>
              <div style={{ fontFamily: P.headlineFont, fontSize: 18, color: P.navy, marginBottom: 12 }}>Next Class</div>
              <div style={{ background: P.navy, borderRadius: P.radiusLg, padding: 20, marginBottom: 24, color: '#fff' }}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{nextClass.title || nextClass.topic || (nextClass.kind === '1:1' ? '1:1 Session' : 'Class')}</div>
                <div style={{ fontSize: 13, color: '#C7CEDB' }}>{new Date(nextClass.timing).toLocaleString(undefined, { weekday: 'long', hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</div>
                <div style={{ fontSize: 13, color: '#C7CEDB', marginTop: 2 }}>Teacher: {nextClass.teacher_name}</div>
              </div>
            </>
          )}

          {!loading && activity.length > 0 && (
            <>
              <div style={{ fontFamily: P.headlineFont, fontSize: 18, color: P.navy, marginBottom: 12 }}>Recent Activity</div>
              <div style={{ ...cardStyle, padding: 0, marginBottom: 24 }}>
                {activity.map((a, i) => (
                  <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 18px', borderBottom: i < activity.length - 1 ? `1px solid ${P.line}` : 'none' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: P.gold, width: 60, flexShrink: 0 }}>
                      {new Date(a.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' }).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13.5, color: P.navy }}>{a.title}</div>
                      <div style={{ fontSize: 12, color: P.meta }}>{a.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {!loading && latestMockExam && (
            <>
              <div style={{ fontFamily: P.headlineFont, fontSize: 18, color: P.navy, marginBottom: 12 }}>Latest Mock Exam</div>
              <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 16 }}>
                {latestPercent !== null && <ScoreRing percent={latestPercent} />}
                <div>
                  <div style={{ fontWeight: 700, color: P.navy, fontFamily: P.headlineFont, fontSize: 16 }}>{latestMockExam.exam_name}</div>
                  <div style={{ fontSize: 12.5, color: P.meta }}>
                    {latestMockExam.exam_date ? new Date(latestMockExam.exam_date).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }) : 'Date TBD'}
                  </div>
                  {latestPercent === null && latestMockExam.score && <div style={{ fontSize: 13, color: P.navy, marginTop: 4 }}>Score: {latestMockExam.score}</div>}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {showAddChild && <AddChildModal onClose={() => setShowAddChild(false)} onAdded={() => { setShowAddChild(false); reloadChildren(); }} />}
    </ParentShell>
  );
}
