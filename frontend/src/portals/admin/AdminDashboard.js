import React from 'react';
import { Link } from 'react-router-dom';
import AdminShell from './AdminShell';
import { A } from './theme';

const TILES = [
  { to: '/admin/tutors', icon: '\u{1F393}', title: 'Tutors', desc: 'Manage teacher accounts' },
  { to: '/admin/courses', icon: '\u{1F4DA}', title: 'Courses & Classes', desc: 'Create courses, schedule classes' },
  { to: '/admin/parents', icon: '\u{1F46A}', title: 'Parents', desc: 'View parents & their children' },
  { to: '/admin/invoices', icon: '\u{1F4CB}', title: 'Invoices & Billing', desc: 'Generate consolidated invoices' }
];

export default function AdminDashboard() {
  return (
    <AdminShell>
      <h1 style={{ fontFamily: A.headlineFont, fontSize: 26, color: A.navy, margin: '0 0 16px' }}>Admin Dashboard</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
        {TILES.map((tile) => (
          <Link key={tile.to} to={tile.to} style={{ textDecoration: 'none' }}>
            <div style={{ background: A.paper, borderRadius: A.radius, boxShadow: A.shadow, border: `1px solid ${A.line}`, padding: 18 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12, background: A.goldSoft,
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, fontSize: 20
              }}>
                {tile.icon}
              </div>
              <h3 style={{ fontFamily: A.headlineFont, fontSize: 16, margin: '0 0 4px', color: A.navy }}>{tile.title}</h3>
              <p style={{ color: A.meta, fontSize: 12.5, margin: 0 }}>{tile.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </AdminShell>
  );
}
