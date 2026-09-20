import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../../api/axios';

const ParentContext = createContext(null);

export function ParentProvider({ children }) {
  const [kids, setKids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(() => localStorage.getItem('parent_selected_child') || null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await api.get('/children');
    setKids(data);
    setLoading(false);
    if (data.length && !data.some((c) => String(c.id) === String(selectedId))) {
      setSelectedId(String(data[0].id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);

  function selectChild(id) {
    setSelectedId(String(id));
    localStorage.setItem('parent_selected_child', String(id));
  }

  const selectedChild = kids.find((c) => String(c.id) === String(selectedId)) || kids[0] || null;

  return (
    <ParentContext.Provider value={{ kids, loading, selectedChild, selectChild, reload: load }}>
      {children}
    </ParentContext.Provider>
  );
}

export function useParent() {
  return useContext(ParentContext);
}
