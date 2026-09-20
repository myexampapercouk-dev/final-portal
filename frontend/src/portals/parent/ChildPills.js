import React from 'react';
import { useParent } from './ParentContext';
import { P } from './theme';

export default function ChildPills({ onAddChild }) {
  const { kids, selectedChild, selectChild } = useParent();

  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
      {kids.map((c) => {
        const active = selectedChild && String(selectedChild.id) === String(c.id);
        return (
          <button
            key={c.id}
            onClick={() => selectChild(c.id)}
            style={{
              textAlign: 'left', padding: '10px 16px', borderRadius: 12, cursor: 'pointer',
              border: `1.5px solid ${active ? P.navy : P.line}`,
              background: active ? P.navy : '#fff',
              color: active ? '#fff' : P.navy,
              fontFamily: P.bodyFont, minWidth: 110
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 13.5 }}>{c.name}</div>
            <div style={{ fontSize: 11.5, opacity: .8 }}>{c.category}</div>
          </button>
        );
      })}
      {onAddChild && (
        <button
          onClick={onAddChild}
          style={{
            textAlign: 'left', padding: '10px 16px', borderRadius: 12, cursor: 'pointer',
            border: `1.5px dashed ${P.line}`, background: 'transparent', color: P.meta, fontFamily: P.bodyFont, minWidth: 110
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 13.5 }}>+ Add a child</div>
        </button>
      )}
    </div>
  );
}
