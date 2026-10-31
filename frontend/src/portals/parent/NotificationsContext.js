import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../api/axios';

// One copy of the parent's open notifications, shared by the bell and the
// sidebar badges. Opening the page a notification is about clears it.
const Ctx = createContext({ items: [], toast: null, setToast: () => {}, resolve: async () => {} });
export const useParentNotifications = () => useContext(Ctx);

const PAGE_TYPES = ['parent_invoice', 'parent_homework'];

export function ParentNotificationsProvider({ children }) {
  const location = useLocation();
  const [items, setItems] = useState([]);
  const [toast, setToast] = useState(null);
  const seen = useRef(null); // ids already known, so only genuinely new ones toast

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications');
      setItems(data);
      if (seen.current === null) {
        seen.current = new Set(data.map((n) => n.id));
        if (data.length) setToast({ title: `You have ${data.length} new notification${data.length === 1 ? '' : 's'}`, link: null });
      } else {
        const fresh = data.filter((n) => !seen.current.has(n.id));
        fresh.forEach((n) => seen.current.add(n.id));
        if (fresh.length) setToast({ title: fresh[0].title, body: fresh[0].body, link: fresh[0].link });
      }
    } catch (e) {
      // keep whatever is showing
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 9000);
    return () => clearTimeout(t);
  }, [toast]);

  const resolve = useCallback(async (n) => {
    setItems((list) => list.filter((x) => x.id !== n.id));
    try { await api.post(`/notifications/${n.id}/done`); } catch (e) { /* will reappear on next refresh */ }
  }, []);

  // Visiting the page a notification points to counts as seeing it
  useEffect(() => {
    items.filter((n) => n.link === location.pathname && PAGE_TYPES.includes(n.type)).forEach(resolve);
  }, [location.pathname, items, resolve]);

  return <Ctx.Provider value={{ items, toast, setToast, resolve }}>{children}</Ctx.Provider>;
}
