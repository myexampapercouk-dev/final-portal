import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Nav from '../../components/Nav';
import AddChildModal from './AddChildModal';

export default function ParentDashboard() {
  const [children, setChildren] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadChildren(); }, []);

  async function loadChildren() {
    setLoading(true);
    const { data } = await api.get('/children');
    setChildren(data);
    setLoading(false);
  }

  return (
    <div>
      <Nav links={[{ to: '/parent', label: 'Main Dashboard' }, { to: '/parent/invoices', label: 'Invoices' }]} />
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>My Children</h2>
          <button className="gold" onClick={() => setShowModal(true)}>+ Add Child</button>
        </div>

        {loading && <p>Loading...</p>}
        {!loading && children.length === 0 && <p style={{ color: '#64748b' }}>No children added yet.</p>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {children.map((c) => (
            <Link key={c.id} to={`/parent/child/${c.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="card">
                <h3 style={{ margin: '0 0 6px' }}>{c.name}</h3>
                <span className="badge">{c.category}</span>
                <p style={{ fontSize: 13, color: '#64748b', marginTop: 8 }}>
                  DOB: {c.dob} <br />
                  Target: {c.target_exam || '—'}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {showModal && (
          <AddChildModal
            onClose={() => setShowModal(false)}
            onAdded={(child) => setChildren((prev) => [child, ...prev])}
          />
        )}
      </div>
    </div>
  );
}
