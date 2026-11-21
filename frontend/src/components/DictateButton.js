import React, { useEffect, useRef, useState } from 'react';

// "Speak" button for a text box: the teacher dictates and the words are typed into the box.
// Uses the browser's built-in speech recognition (Chrome, Edge, Safari), British English.
// The browser asks for microphone permission the first time. Where speech recognition is not
// available (e.g. Firefox) a short note is shown instead and typing works as normal.
const Recognition = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;

export default function DictateButton({ value, onChange }) {
  const [listening, setListening] = useState(false);
  const [note, setNote] = useState('');
  const rec = useRef(null);
  const base = useRef('');      // what was in the box when dictation started (plus finished phrases)
  const latest = useRef(value); // always the current text, so typing while dictating is not lost
  latest.current = value;

  useEffect(() => () => { if (rec.current) { rec.current.onend = null; rec.current.stop(); } }, []);

  if (!Recognition) {
    return <span style={{ fontSize: 12, color: '#66707F' }}>Dictation is not supported in this browser - use Chrome or Edge to speak your remark.</span>;
  }

  const join = (a, b) => (a && b && !/\s$/.test(a) ? `${a} ${b}` : `${a}${b}`);

  function start() {
    setNote('');
    const r = new Recognition();
    r.lang = 'en-GB';
    r.continuous = true;
    r.interimResults = true;
    base.current = latest.current || '';
    r.onresult = (e) => {
      let finals = '';
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i += 1) {
        const text = e.results[i][0].transcript;
        if (e.results[i].isFinal) finals += text; else interim += text;
      }
      if (finals) base.current = join(base.current, finals.trim());
      onChange(join(base.current, interim.trim()));
    };
    r.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') setNote('Microphone access is blocked. Allow the microphone for this site in your browser and try again.');
      else if (e.error === 'no-speech') setNote('No speech heard - try again.');
      else if (e.error !== 'aborted') setNote('Dictation stopped. Please try again.');
    };
    r.onend = () => { setListening(false); onChange(base.current); };
    rec.current = r;
    try { r.start(); setListening(true); } catch (err) { setNote('Could not start the microphone.'); }
  }

  function stop() {
    if (rec.current) rec.current.stop();
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <button
        type="button"
        onClick={listening ? stop : start}
        aria-pressed={listening}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 999, cursor: 'pointer',
          fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
          border: `1.5px solid ${listening ? '#B4433A' : '#C9A227'}`,
          background: listening ? '#B4433A' : '#FFF8E1', color: listening ? '#fff' : '#16243D'
        }}
      >
        <span aria-hidden="true">{listening ? '⏹' : '\u{1F3A4}'}</span>
        {listening ? 'Stop dictating' : 'Dictate'}
      </button>
      {listening && <span style={{ fontSize: 12.5, color: '#B4433A', fontWeight: 600 }}>● Listening - speak now</span>}
      {note && <span style={{ fontSize: 12.5, color: '#B4433A' }}>{note}</span>}
    </span>
  );
}
