import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import TeacherShell from './TeacherShell';
import { T, cardStyle, initials } from './theme';

const STATUS_STYLE = {
  completed: { bg: T.greenWash, fg: T.green, label: 'Completed' },
  cancelled: { bg: T.redWash, fg: T.red, label: 'Cancelled' },
  scheduled: { bg: T.goldSoft, fg: '#7A5B00', label: 'Scheduled' }
};

const FILTERS = ['Active', 'Upcoming', 'Completed'];

function matchesFilter(c, filter) {
  const isPast = new Date(c.timing).getTime() <= Date.now();
  if (filter === 'Completed') return c.status === 'completed';
  if (filter === 'Active') return c.status === 'scheduled' && isPast;
  return c.status === 'scheduled' && !isPast; // Upcoming
}

export default function TeacherDashboard() {
  const [classes, setClasses] = useState([]);
  const [filter, setFilter] = useState('Upcoming');

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await api.get('/classes');
    setClasses(data);
  }

  const filtered = useMemo(() => classes.filter((c) => matchesFilter(c, filter)), [classes, filter]);

  return (
    <TeacherShell>
      <h1 style={{ fontFamily: T.headlineFont, fontSize: 26, color: T.navy, margin: '0 0 16px' }}>My Assigned Classes</h1>
        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '8px 18px', borderRadius: 999, fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
                border: `1.5px solid ${filter === f ? T.navy : T.line}`,
                background: filter === f ? T.navy : '#fff',
                color: filter === f ? '#fff' : T.navy
              }}
            >
              {f}
            </button>
          ))}
        </div>
        {filtered.length === 0 && <p style={{ color: T.meta }}>No {filter.toLowerCase()} classes.</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((c) => {
            const status = STATUS_STYLE[c.status] || STATUS_STYLE.scheduled;
            return (
              <Link key={c.id} to={`/teacher/class/${c.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, background: T.goldSoft, color: '#7A5B00',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontFamily: T.headlineFont, flexShrink: 0
                    }}>
                      {initials(c.title)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15, color: T.navy }}>{c.title}</div>
                      <div style={{ fontSize: 12.5, color: T.meta, marginTop: 2 }}>
                        {c.course_name} · {new Date(c.timing).toLocaleString()}
                      </div>
                      <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {c.categories?.map((cat) => (
                          <span key={cat} style={{ background: '#E8ECF3', color: T.navy, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999 }}>{cat}</span>
                        ))}
                        <span style={{ background: T.cream, color: T.meta, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999 }}>
                          {c.registered_count} registered
                        </span>
                      </div>
                    </div>
                  </div>
                  <span style={{ background: status.bg, color: status.fg, fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 999, flexShrink: 0 }}>
                    {status.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
    </TeacherShell>
  );
}
