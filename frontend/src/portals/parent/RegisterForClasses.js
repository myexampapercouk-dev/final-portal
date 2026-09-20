import React, { useEffect, useState, useCallback } from 'react';
import api from '../../api/axios';
import ParentShell from './ParentShell';
import ChildPills from './ChildPills';
import { useParent } from './ParentContext';
import { P, cardStyle, btn, inputStyle, labelStyle } from './theme';

export default function RegisterForClasses() {
  const { selectedChild } = useParent();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [registeredIds, setRegisteredIds] = useState([]);

  const load = useCallback(() => {
    if (!selectedChild) { setClasses([]); setLoading(false); return; }
    setLoading(true);
    api.get('/classes/available', { params: { child_id: selectedChild.id } }).then(({ data }) => {
      setClasses(data);
      setLoading(false);
    });
  }, [selectedChild]);

  useEffect(() => { load(); setRegisteredIds([]); }, [load]);

  async function register(classId) {
    setError('');
    try {
      await api.post('/registrations', { class_id: classId, child_id: selectedChild.id });
      setRegisteredIds((ids) => [...ids, classId]);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not register');
    }
  }

  const filtered = classes.filter((c) => {
    if (registeredIds.includes(c.id)) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return c.title.toLowerCase().includes(q) || c.course_name.toLowerCase().includes(q) || c.categories.some((cat) => cat.toLowerCase().includes(q));
  });

  return (
    <ParentShell>
      <h1 style={{ fontFamily: P.headlineFont, fontSize: 26, color: P.navy, margin: '0 0 4px' }}>Register for Classes</h1>
      <p style={{ color: P.meta, marginBottom: 20 }}>{filtered.length} session{filtered.length === 1 ? '' : 's'} open for booking</p>
      <ChildPills />

      {selectedChild && (
        <div style={{ marginBottom: 18, maxWidth: 320 }}>
          <label style={labelStyle}>Search</label>
          <input
            placeholder="Search by title, course or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={inputStyle}
          />
        </div>
      )}

      {error && <div style={{ color: P.red, fontSize: 12.5, background: P.redWash, padding: '8px 12px', borderRadius: 8, marginBottom: 12 }}>{error}</div>}
      {loading && <p style={{ color: P.meta }}>Loading available classes...</p>}
      {!loading && !selectedChild && <p style={{ color: P.meta }}>Add a child first to see classes available for their category.</p>}
      {!loading && selectedChild && filtered.length === 0 && <p style={{ color: P.meta }}>No new classes available right now.</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map((c) => (
          <div key={c.id} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 600, color: P.navy, fontFamily: P.headlineFont, fontSize: 16 }}>{c.title}</div>
                <div style={{ fontSize: 12.5, color: P.meta, marginTop: 2 }}>{c.course_name}</div>
                <div style={{ fontSize: 12.5, color: P.meta, marginTop: 6 }}>
                  {new Date(c.timing).toLocaleString(undefined, { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} · Teacher: {c.teacher_name}
                </div>
                <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {c.categories.map((cat) => (
                    <span key={cat} style={{ fontSize: 11, fontWeight: 700, background: P.goldSoft, color: '#7A5B00', padding: '3px 10px', borderRadius: 999 }}>{cat}</span>
                  ))}
                  <span style={{ fontSize: 11, fontWeight: 600, background: P.cream, color: P.meta, padding: '3px 10px', borderRadius: 999 }}>{c.registered_count} registered</span>
                </div>
              </div>
              <button style={{ ...btn('gold'), alignSelf: 'center', flexShrink: 0 }} onClick={() => register(c.id)}>Register</button>
            </div>
          </div>
        ))}
      </div>
    </ParentShell>
  );
}
