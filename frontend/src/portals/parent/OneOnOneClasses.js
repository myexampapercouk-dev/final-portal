import React, { useEffect, useState, useCallback } from 'react';
import api from '../../api/axios';
import ParentShell from './ParentShell';
import ChildPills from './ChildPills';
import { DateBadge } from './UpcomingClasses';
import { useParent } from './ParentContext';
import { P, cardStyle, btn, STATUS } from './theme';

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export default function OneOnOneClasses() {
  const { selectedChild } = useParent();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!selectedChild) { setRows([]); setLoading(false); return; }
    setLoading(true);
    api.get(`/one-on-one/child/${selectedChild.id}`).then(({ data }) => {
      setRows(data);
      setLoading(false);
    });
  }, [selectedChild]);

  useEffect(() => { load(); }, [load]);

  function canCancel(timing) {
    return new Date(timing).getTime() - Date.now() >= TWENTY_FOUR_HOURS_MS;
  }

  async function cancel(id) {
    if (!window.confirm('Cancel this 1:1 session?')) return;
    try {
      await api.post(`/one-on-one/${id}/cancel`);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not cancel');
    }
  }

  return (
    <ParentShell>
      <h1 style={{ fontFamily: P.headlineFont, fontSize: 26, color: P.navy, margin: '0 0 4px' }}>1:1 Classes</h1>
      <p style={{ color: P.meta, marginBottom: 20 }}>Private tuition{selectedChild ? ` for ${selectedChild.name}` : ''}</p>
      <ChildPills />

      {loading && <p style={{ color: P.meta }}>Loading...</p>}
      {!loading && rows.length === 0 && <p style={{ color: P.meta }}>No 1:1 classes scheduled.</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {rows.map((o) => {
          const status = STATUS[o.status] || STATUS.scheduled;
          return (
            <div key={o.id} style={cardStyle}>
              <div style={{ display: 'flex', gap: 14 }}>
                <DateBadge date={o.timing} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ fontWeight: 600, color: P.navy, fontFamily: P.headlineFont, fontSize: 16 }}>{o.topic || '1:1 Session'}</div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 11px', borderRadius: 999, height: 'fit-content', background: status.bg, color: status.fg, whiteSpace: 'nowrap' }}>{status.label}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: P.meta, marginTop: 2 }}>
                    {new Date(o.timing).toLocaleString(undefined, { weekday: 'long', hour: '2-digit', minute: '2-digit' })} · Teacher: {o.teacher_name}
                  </div>
                  {o.notes && <div style={{ fontSize: 12.5, color: P.navy, marginTop: 6 }}>{o.notes}</div>}
                  {o.status === 'upcoming' && (
                    <div style={{ marginTop: 12 }}>
                      <button
                        style={btn('danger')}
                        disabled={!canCancel(o.timing)}
                        title={!canCancel(o.timing) ? 'Cancellation window (24h) has passed' : ''}
                        onClick={() => cancel(o.id)}
                      >
                        Cancel session
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ParentShell>
  );
}
