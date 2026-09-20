import React, { useEffect, useState, useCallback } from 'react';
import api from '../../api/axios';
import ParentShell from './ParentShell';
import ChildPills from './ChildPills';
import { DateBadge } from './UpcomingClasses';
import { useParent } from './ParentContext';
import { P, cardStyle } from './theme';

export default function ClassesAttended() {
  const { selectedChild } = useParent();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!selectedChild) { setRows([]); setLoading(false); return; }
    setLoading(true);
    api.get(`/registrations/child/${selectedChild.id}/attended`).then(({ data }) => {
      setRows(data);
      setLoading(false);
    });
  }, [selectedChild]);

  useEffect(() => { load(); }, [load]);

  return (
    <ParentShell>
      <h1 style={{ fontFamily: P.headlineFont, fontSize: 26, color: P.navy, margin: '0 0 4px' }}>Classes Attended</h1>
      <p style={{ color: P.meta, marginBottom: 20 }}>{rows.length} session{rows.length === 1 ? '' : 's'} attended{selectedChild ? ` by ${selectedChild.name}` : ''}</p>
      <ChildPills />

      {loading && <p style={{ color: P.meta }}>Loading...</p>}
      {!loading && rows.length === 0 && <p style={{ color: P.meta }}>No classes attended yet.</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {rows.map((r) => (
          <div key={r.id} style={cardStyle}>
            <div style={{ display: 'flex', gap: 14 }}>
              <DateBadge date={r.timing} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: P.navy, fontFamily: P.headlineFont, fontSize: 16 }}>{r.title}</div>
                <div style={{ fontSize: 12.5, color: P.meta, marginTop: 2 }}>
                  {new Date(r.timing).toLocaleString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })} · Teacher: {r.teacher_name}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ParentShell>
  );
}
