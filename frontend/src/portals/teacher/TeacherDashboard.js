import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import TeacherShell from './TeacherShell';
import { T } from './theme';

const STATUS_STYLE = {
  completed: { bg: T.tertiaryFixed, fg: T.onTertiaryFixed, label: 'Completed' },
  cancelled: { bg: T.errorContainer, fg: T.onErrorContainer, label: 'Cancelled' },
  scheduled: { bg: T.secondaryFixed, fg: T.onSecondaryFixed, label: 'Scheduled' }
};

export default function TeacherDashboard() {
  const [classes, setClasses] = useState([]);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await api.get('/classes');
    setClasses(data);
  }

  const initials = (name) => name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <TeacherShell active="classes">
      <h1 style={{ fontFamily: T.headlineFont, fontSize: 24, fontWeight: 700, color: T.onSurface, margin: '0 0 16px' }}>
        My Assigned Classes
      </h1>
      {classes.length === 0 && <p style={{ color: T.onSurfaceVariant }}>No classes assigned yet.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {classes.map((c) => {
          const status = STATUS_STYLE[c.status] || STATUS_STYLE.scheduled;
          return (
            <Link key={c.id} to={`/teacher/class/${c.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
              <div style={{
                background: T.surfaceContainerLowest, borderRadius: T.radius.lg, boxShadow: T.shadow,
                padding: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, background: T.primaryFixed, color: T.onPrimaryFixed,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontFamily: T.headlineFont, flexShrink: 0
                  }}>
                    {initials(c.title)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: T.onSurface }}>{c.title}</div>
                    <div style={{ fontSize: 12.5, color: T.onSurfaceVariant, marginTop: 2 }}>
                      {c.course_name} · {new Date(c.timing).toLocaleString()}
                    </div>
                    <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {c.categories?.map((cat) => (
                        <span key={cat} style={{ background: T.secondaryFixed, color: T.onSecondaryFixed, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999 }}>{cat}</span>
                      ))}
                      <span style={{ background: T.surfaceContainerHigh, color: T.onSurfaceVariant, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999 }}>
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
