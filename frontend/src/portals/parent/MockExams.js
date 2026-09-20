import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import ParentShell from './ParentShell';
import ChildPills from './ChildPills';
import ScoreRing from './ScoreRing';
import { useParent } from './ParentContext';
import { P, cardStyle } from './theme';
import { parsePercent } from './scoreUtils';

export default function MockExams() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedChild } = useParent();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!selectedChild) { setRows([]); setLoading(false); return; }
    setLoading(true);
    api.get(`/mock-exams/child/${selectedChild.id}`).then(({ data }) => {
      setRows(data.sort((a, b) => new Date(b.exam_date) - new Date(a.exam_date)));
      setLoading(false);
    });
  }, [selectedChild]);

  useEffect(() => { load(); }, [load]);

  const detail = id ? rows.find((r) => String(r.id) === id) : null;

  if (id && detail) {
    const pct = parsePercent(detail.score);
    return (
      <ParentShell>
        <span onClick={() => navigate('/parent/mock-exams')} style={{ fontSize: 13, color: P.meta, cursor: 'pointer' }}>{'‹'} Mock Exams</span>
        <div style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: P.gold, fontWeight: 700, marginTop: 14 }}>
          {detail.exam_date ? new Date(detail.exam_date).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Date TBD'}
        </div>
        <h1 style={{ fontFamily: P.headlineFont, fontSize: 26, color: P.navy, margin: '4px 0' }}>{detail.exam_name}</h1>

        <div style={{ background: P.navy, borderRadius: P.radiusLg, padding: 24, marginTop: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 20 }}>
          {pct !== null ? <ScoreRing percent={pct} size={90} dark /> : (
            <div style={{ fontFamily: P.headlineFont, fontSize: 30, color: '#fff' }}>{detail.score || '—'}</div>
          )}
          <div style={{ color: '#fff' }}>
            <div style={{ fontSize: 13, color: '#C7CEDB' }}>Result</div>
            <div style={{ fontFamily: P.headlineFont, fontSize: 18 }}>{detail.score || 'Not yet scored'}</div>
          </div>
        </div>

        {detail.remarks && (
          <div style={cardStyle}>
            <div style={{ fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase', color: P.meta, fontWeight: 600, marginBottom: 6 }}>Teacher Remarks</div>
            <p style={{ margin: 0, color: P.navy }}>{detail.remarks}</p>
          </div>
        )}
      </ParentShell>
    );
  }

  return (
    <ParentShell>
      <h1 style={{ fontFamily: P.headlineFont, fontSize: 26, color: P.navy, margin: '0 0 4px' }}>Mock Exams</h1>
      <p style={{ color: P.meta, marginBottom: 20 }}>
        {rows.length} paper{rows.length === 1 ? '' : 's'} sat{rows[0]?.score ? ` · latest ${rows[0].score}` : ''}
      </p>
      <ChildPills />

      {loading && <p style={{ color: P.meta }}>Loading...</p>}
      {!loading && rows.length === 0 && <p style={{ color: P.meta }}>No mock exam records yet.</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {rows.map((m) => {
          const pct = parsePercent(m.score);
          return (
            <div key={m.id} onClick={() => navigate(`/parent/mock-exams/${m.id}`)} style={{ ...cardStyle, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 10, background: P.cream, border: `1px solid ${P.line}`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: P.navy, fontFamily: P.headlineFont, lineHeight: 1 }}>{m.exam_date ? new Date(m.exam_date).getDate() : '—'}</div>
                {m.exam_date && <div style={{ fontSize: 9.5, color: P.gold, fontWeight: 700, textTransform: 'uppercase' }}>{new Date(m.exam_date).toLocaleDateString(undefined, { month: 'short' })}</div>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: P.navy, fontFamily: P.headlineFont, fontSize: 16 }}>{m.exam_name}</div>
                <div style={{ fontSize: 12.5, color: P.meta }}>{m.exam_date ? new Date(m.exam_date).toLocaleDateString(undefined, { weekday: 'long' }) : 'Date TBD'}</div>
              </div>
              {pct !== null ? <ScoreRing percent={pct} size={52} stroke={5} /> : m.score && <div style={{ fontWeight: 700, color: P.navy }}>{m.score}</div>}
            </div>
          );
        })}
      </div>
    </ParentShell>
  );
}
