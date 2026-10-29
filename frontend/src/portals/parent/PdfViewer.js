import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import 'pdfjs-dist/legacy/build/pdf.worker.entry';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { P } from './theme';

// View-only PDF page, opened in a new tab. The file is fetched through the
// authenticated API and drawn to <canvas> - there is no embedded PDF toolbar,
// no download/print button, and each page carries a faint watermark with the
// viewer's name so a shared screenshot can be traced. (A website can't fully
// stop a device screenshot; this makes casual saving and sharing impractical.)
export default function PdfViewer() {
  const { id, kind } = useParams();
  const { user } = useAuth();
  const containerRef = useRef(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [hidden, setHidden] = useState(false);
  const title = kind === 'answer' ? 'Answers' : 'Homework';

  useEffect(() => {
    let cancelled = false;
    async function render() {
      try {
        const { data } = await api.get(`/homework/${id}/file/${kind}`, { responseType: 'arraybuffer' });
        const pdf = await pdfjsLib.getDocument({ data }).promise;
        if (cancelled) return;
        const container = containerRef.current;
        container.innerHTML = '';
        const width = Math.min(container.clientWidth - 20, 900);
        const ratio = window.devicePixelRatio || 1;

        for (let n = 1; n <= pdf.numPages; n++) {
          const page = await pdf.getPage(n);
          const base = page.getViewport({ scale: 1 });
          const scale = width / base.width;
          const viewport = page.getViewport({ scale: scale * ratio });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.width = `${width}px`;
          canvas.style.height = `${viewport.height / ratio}px`;
          canvas.style.display = 'block';
          canvas.style.margin = '0 auto 14px';
          canvas.style.background = '#fff';
          canvas.style.boxShadow = '0 2px 12px rgba(22,36,61,.12)';
          container.appendChild(canvas);
          const ctx = canvas.getContext('2d');
          await page.render({ canvasContext: ctx, viewport }).promise;

          // Watermark baked into the pixels
          const label = `${user?.name || ''} · ${user?.email || ''}`;
          ctx.save();
          ctx.globalAlpha = 0.09;
          ctx.fillStyle = '#16243D';
          ctx.font = `${22 * ratio}px sans-serif`;
          ctx.rotate(-Math.PI / 6);
          for (let y = -viewport.width; y < viewport.height + viewport.width; y += 170 * ratio) {
            for (let x = -viewport.width; x < viewport.width * 1.5; x += 520 * ratio) {
              ctx.fillText(label, x, y);
            }
          }
          ctx.restore();
        }
        if (!cancelled) setStatus('ready');
      } catch (err) {
        if (!cancelled) setStatus('error');
      }
    }
    render();
    return () => { cancelled = true; };
  }, [id, kind, user]);

  useEffect(() => {
    document.title = title;
    const block = (e) => {
      const key = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && ['s', 'p', 'c', 'a', 'u'].includes(key)) e.preventDefault();
      if (key === 'printscreen') {
        e.preventDefault();
        setHidden(true);
        setTimeout(() => setHidden(false), 1500);
      }
    };
    // Blank the pages whenever the tab loses focus (screen-capture tools and
    // app switchers usually take focus first)
    const hide = () => setHidden(true);
    const show = () => setHidden(false);
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener('keydown', block);
    window.addEventListener('blur', hide);
    window.addEventListener('focus', show);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('keydown', block);
      window.removeEventListener('blur', hide);
      window.removeEventListener('focus', show);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [title]);

  return (
    <div style={{ minHeight: '100vh', overflowX: 'hidden', background: P.canvas, fontFamily: P.bodyFont, userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}>
      <style>{'@media print { body { display: none !important; } }'}</style>
      <div style={{ background: P.navy, color: '#fff', padding: '12px 18px', fontFamily: P.headlineFont, fontWeight: 700 }}>
        {kind === 'answer' ? 'Answers' : 'Homework'} <span style={{ fontFamily: P.bodyFont, fontWeight: 400, fontSize: 12, color: '#C7CEDB' }}>· view only</span>
      </div>
      <div style={{ padding: '18px 12px 40px', filter: hidden ? 'blur(24px)' : 'none', transition: 'filter .1s' }}>
        {status === 'loading' && <p style={{ textAlign: 'center', color: P.meta }}>Loading document...</p>}
        {status === 'error' && <p style={{ textAlign: 'center', color: P.red }}>This document could not be opened.</p>}
        <div ref={containerRef} />
      </div>
    </div>
  );
}
