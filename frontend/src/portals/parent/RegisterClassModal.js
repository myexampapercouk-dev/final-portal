import React, { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function RegisterClassModal({ childId, onClose, onRegistered }) {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadAvailable(); }, []);

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
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ width: 520 }} onClick={(e) => e.stopPropagation()}>
        <h3>Register for a Class</h3>
        {loading && <p>Loading available classes...</p>}
        {error && <div className="error">{error}</div>}
        {!loading && classes.length === 0 && (
          <p style={{ color: '#64748b' }}>No new classes available for this child's category right now.</p>
        )}
        <div style={{ maxHeight: 320, overflowY: 'auto' }}>
          {classes.map((c) => (
            <div key={c.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{c.title}</strong>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  {c.course_name} · {new Date(c.timing).toLocaleString()} · Teacher: {c.teacher_name}
                </div>
                <div style={{ marginTop: 4 }}>
                  {c.categories.map((cat) => <span key={cat} className="badge" style={{ marginRight: 4 }}>{cat}</span>)}
                  <span className="badge" style={{ background: '#f1f5f9', color: '#334155' }}>{c.registered_count} registered</span>
                </div>
              </div>
              <button className="gold" onClick={() => register(c.id)}>Register</button>
            </div>
          ))}
        </div>
        <button className="secondary" style={{ marginTop: 12 }} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
