import React, { useEffect, useState, useCallback } from 'react';
import api from '../../api/axios';
import ParentShell from './ParentShell';
import ChildPills from './ChildPills';
import { useParent } from './ParentContext';
import { P, cardStyle, btn, STATUS } from './theme';

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export default function UpcomingClasses() {
  const { selectedChild } = useParent();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!selectedChild) { setRows([]); setLoading(false); return; }
    setLoading(true);
    api.get(`/registrations/child/${selectedChild.id}/upcoming`).then(({ data }) => {
      setRows(data);
      setLoading(false);
    });
  }, [selectedChild]);

  useEffect(() => { load(); }, [load]);

  function canCancel(timing) {
    return new Date(timing).getTime() - Date.now() >= TWENTY_FOUR_HOURS_MS;
  }

  async function cancel(regId) {
    if (!window.confirm('Cancel this class registration?')) return;
    try {
      await api.post(`/registrations/${regId}/cancel`);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not cancel');
    }
  }

  return (
    <ParentShell>
      <h1 style={{ fontFamily: P.headlineFont, fontSize: 26, color: P.navy, margin: '0 0 4px' }}>Upcoming Classes</h1>
      <p style={{ color: P.meta, marginBottom: 20 }}>{rows.length} booked{selectedChild ? ` for ${selectedChild.name}` : ''}</p>
      <ChildPills />

      {loading && <p style={{ color: P.meta }}>Loading...</p>}
      {!loading && rows.length === 0 && <p style={{ color: P.meta }}>No upcoming classes.</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {rows.map((r) => (
          <div key={r.id} style={cardStyle}>
            <div style={{ display: 'flex', gap: 14 }}>
              <DateBadge date={r.timing} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ fontWeight: 600, color: P.navy, fontFamily: P.headlineFont, fontSize: 16 }}>{r.title}</div>
                  <span style={STATUS.upcoming ? { ...badgeStyle, background: STATUS.upcoming.bg, color: STATUS.upcoming.fg } : {}}>{STATUS.upcoming.label}</span>
                </div>
                <div style={{ fontSize: 12.5, color: P.meta, marginTop: 2 }}>
                  {new Date(r.timing).toLocaleString(undefined, { weekday: 'long', hour: '2-digit', minute: '2-digit' })} · Teacher: {r.teacher_name}
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                  <button
                    style={btn('danger')}
                    disabled={!canCancel(r.timing)}
                    title={!canCancel(r.timing) ? 'Cancellation window (24h) has passed' : ''}
                    onClick={() => cancel(r.id)}
                  >
                    Cancel booking
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ParentShell>
  );
}

export function DateBadge({ date }) {
  const d = new Date(date);
  return (
    <div style={{
      width: 48, height: 48, borderRadius: 10, background: P.cream, border: `1px solid ${P.line}`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0
    }}>
      <div style={{ fontWeight: 700, fontSize: 16, color: P.navy, fontFamily: P.headlineFont, lineHeight: 1 }}>{d.getDate()}</div>
      <div style={{ fontSize: 9.5, color: P.gold, fontWeight: 700, textTransform: 'uppercase' }}>{d.toLocaleDateString(undefined, { month: 'short' })}</div>
    </div>
  );
}

const badgeStyle = { fontSize: 11, fontWeight: 700, padding: '3px 11px', borderRadius: 999, height: 'fit-content', whiteSpace: 'nowrap' };
