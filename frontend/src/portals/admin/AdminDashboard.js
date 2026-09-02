import React from 'react';
import { Link } from 'react-router-dom';
import Nav from '../../components/Nav';

const NAV_LINKS = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/tutors', label: 'Tutors' },
  { to: '/admin/courses', label: 'Courses & Classes' },
  { to: '/admin/parents', label: 'Parents' },
  { to: '/admin/invoices', label: 'Invoices' }
];

export default function AdminDashboard() {
  return (
    <div>
      <Nav links={NAV_LINKS} />
      <div className="container">
        <h2>Admin Dashboard</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          <Link to="/admin/tutors" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card"><h3>Tutors</h3><p style={{ color: '#64748b' }}>Manage teacher accounts</p></div>
          </Link>
          <Link to="/admin/courses" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card"><h3>Courses & Classes</h3><p style={{ color: '#64748b' }}>Create courses, schedule classes</p></div>
          </Link>
          <Link to="/admin/parents" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card"><h3>Parents</h3><p style={{ color: '#64748b' }}>View parents & their children</p></div>
          </Link>
          <Link to="/admin/invoices" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card"><h3>Invoices</h3><p style={{ color: '#64748b' }}>Generate consolidated invoices</p></div>
          </Link>
        </div>
      </div>
    </div>
  );
}

export { NAV_LINKS };
