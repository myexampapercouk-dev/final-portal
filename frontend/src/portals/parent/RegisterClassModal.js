import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { T, btnStyle, badgeStyle, modalBackdrop, modalCard } from '../../theme';

export default function RegisterClassModal({ childId, onClose, onRegistered }) {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadAvailable(); /* eslint-disable-next-line */ }, []);

  async function loadAvailable() {
    setLoading(true);
    const { data } = await api.get('/classes/available', { params: { child_id: childId } });
    setClasses(data);
    setLoading(false);
  }

  async function register(classId) {
    setError('');
    try {
      await api.post('/registrations', { class_id: classId, child_id: childId });
      onRegistered();
      setClasses((prev) => prev.filter((c) => c.id !== classId));
    } catch (err) {
      setError(err.response?.data?.error || 'Could not register');
    }
  }

  return (
    <div style={modalBackdrop} onClick={onClose}>
      <div style={{ ...modalCard, maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontFamily: T.headlineFont, marginTop: 0 }}>Register for a Class</h3>
        {loading && <p style={{ color: T.onSurfaceVariant }}>Loading available classes...</p>}
        {error && <div style={{ color: T.error, fontSize: 12.5, background: T.errorContainer, padding: '7px 11px', borderRadius: 8, marginBottom: 8 }}>{error}</div>}
        {!loading && classes.length === 0 && (
          <p style={{ color: T.onSurfaceVariant }}>No new classes available for this child's category right now.</p>
        )}
        <div style={{ maxHeight: 340, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {classes.map((c) => (
            <div key={c.id} style={{ background: T.surfaceContainerLow, borderRadius: 12, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div>
                <strong>{c.title}</strong>
                <div style={{ fontSize: 12, color: T.onSurfaceVariant }}>
                  {c.course_name} · {new Date(c.timing).toLocaleString()} · Teacher: {c.teacher_name}
                </div>
                <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {c.categories.map((cat) => <span key={cat} style={badgeStyle(T.secondaryFixed, T.onSecondaryFixed)}>{cat}</span>)}
                  <span style={badgeStyle(T.surfaceContainerHigh, T.onSurfaceVariant)}>{c.registered_count} registered</span>
                </div>
              </div>
              <button style={btnStyle('primary')} onClick={() => register(c.id)}>Register</button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
          <button style={btnStyle('secondaryOutline')} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
