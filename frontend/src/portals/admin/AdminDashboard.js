import React from 'react';
import { Link } from 'react-router-dom';
import Shell from '../../components/Shell';
import { T } from '../../theme';

export const NAV = [
  { key: 'dashboard', to: '/admin', label: 'Dashboard', icon: 'dashboard' },
  { key: 'tutors', to: '/admin/tutors', label: 'Tutors', icon: 'person_search' },
  { key: 'courses', to: '/admin/courses', label: 'Courses & Classes', icon: 'menu_book' },
  { key: 'parents', to: '/admin/parents', label: 'Parents', icon: 'family_restroom' },
  { key: 'invoices', to: '/admin/invoices', label: 'Invoices & Billing', icon: 'receipt_long' }
];

const TILES = [
  { to: '/admin/tutors', icon: 'person_search', title: 'Tutors', desc: 'Manage teacher accounts', bg: T.primaryFixed, fg: T.onPrimaryFixed },
  { to: '/admin/courses', icon: 'menu_book', title: 'Courses & Classes', desc: 'Create courses, schedule classes', bg: T.secondaryFixed, fg: T.onSecondaryFixed },
  { to: '/admin/parents', icon: 'family_restroom', title: 'Parents', desc: 'View parents & their children', bg: T.tertiaryFixed, fg: T.onTertiaryFixed },
  { to: '/admin/invoices', icon: 'receipt_long', title: 'Invoices', desc: 'Generate consolidated invoices', bg: T.surfaceContainerHighest, fg: T.onSurface }
];

export default function AdminDashboard() {
  return (
    <Shell active="dashboard" navItems={NAV} roleLabel="Admin">
      <h1 style={{ fontFamily: T.headlineFont, fontSize: 24, fontWeight: 700, color: T.onSurface, margin: '0 0 16px' }}>
        Admin Dashboard
      </h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
        {TILES.map((tile) => (
          <Link key={tile.to} to={tile.to} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ background: T.surfaceContainerLowest, borderRadius: T.radius.lg, boxShadow: T.shadow, padding: 18 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: tile.bg, color: tile.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{tile.icon}</span>
              </div>
              <h3 style={{ fontFamily: T.headlineFont, fontSize: 16, fontWeight: 700, margin: '0 0 4px', color: T.onSurface }}>{tile.title}</h3>
              <p style={{ color: T.onSurfaceVariant, fontSize: 12.5, margin: 0 }}>{tile.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </Shell>
  );
}
