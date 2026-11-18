import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import ParentShell from './ParentShell';
import ChildPills from './ChildPills';
import HomeworkFeedbackModal from './HomeworkFeedbackModal';
import downloadHomework from '../../utils/downloadHomework';
import { useParent } from './ParentContext';
import { P, cardStyle, btn } from './theme';

// Homework and answer PDFs open in a new tab, view-only (see PdfViewer.js).
export default function Homework() {
  const { selectedChild } = useParent();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedbackFor, setFeedbackFor] = useState(null); // homework the popup is open for

  useEffect(() => {
    if (!selectedChild) { setItems([]); setLoading(false); return; }
    setLoading(true);
    api.get('/homework', { params: { child_id: selectedChild.id } }).then(({ data }) => {
      setItems(data);
      setLoading(false);
    });
  }, [selectedChild]);

  return (
    <ParentShell>
      <h1 style={{ fontFamily: P.headlineFont, fontSize: 26, color: P.navy, margin: '0 0 4px' }}>Homework</h1>
      <p style={{ color: P.meta, marginBottom: 20 }}>
        Newest first{selectedChild ? ` · ${selectedChild.name}` : ''}. Download the homework and answers as PDFs.
      </p>
      <ChildPills />

      {loading && <p style={{ color: P.meta }}>Loading...</p>}
      {!loading && items.length === 0 && <p style={{ color: P.meta }}>No homework has been set yet.</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((h) => (
          <div key={h.id} style={cardStyle}>
            <div style={{ fontWeight: 600, color: P.navy, fontFamily: P.headlineFont, fontSize: 16 }}>{h.title}</div>
            <div style={{ fontSize: 12.5, color: P.meta, marginTop: 2 }}>
              {h.class_title} · set {new Date(h.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
              {h.total_questions ? ` · ${h.total_questions} question${h.total_questions === 1 ? '' : 's'}` : ''}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
              <button type="button" onClick={() => downloadHomework(h.id, 'homework', h.title).catch(() => alert('Could not download this file'))} style={btn('navy')}>Download homework</button>
              {h.has_answer && (
                <button type="button" onClick={() => downloadHomework(h.id, 'answer', h.title).catch(() => alert('Could not download this file'))} style={btn('secondary')}>Download answers</button>
              )}
              {h.total_questions > 0 && (
                <button type="button" onClick={() => setFeedbackFor(h)} style={btn('gold')}>Give feedback</button>
              )}
            </div>
          </div>
        ))}
      </div>
      {feedbackFor && selectedChild && (
        <HomeworkFeedbackModal homework={feedbackFor} child={selectedChild} onClose={() => setFeedbackFor(null)} />
      )}
    </ParentShell>
  );
}
