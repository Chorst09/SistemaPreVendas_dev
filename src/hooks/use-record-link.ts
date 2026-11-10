'use client';
import { useEffect, useRef } from 'react';

/** Open a record after navigation, including when its list is already mounted. */
export function useRecordLink<T extends { id: string | number }>(module: string, records: T[], onSelect: (record: T) => void, onCreate?: () => void) {
  const latest = useRef({ records, onSelect, onCreate });
  latest.current = { records, onSelect, onCreate };
  const consumed = useRef<string | null>(null);
  const apply = () => {
    const params = new URL(window.location.href).searchParams;
    if (params.get('module') !== module) return;
    const id = params.get('record');
    if (!id || consumed.current === id) return;
    if (id === 'new' && latest.current.onCreate) { consumed.current = id; latest.current.onCreate(); return; }
    const record = latest.current.records.find(item => String(item.id) === id);
    if (record) { consumed.current = id; latest.current.onSelect(record); }
  };
  useEffect(() => { apply(); }, [module, records]);
  useEffect(() => {
    const navigate = () => { consumed.current = null; apply(); };
    window.addEventListener('module-navigate', navigate);
    window.addEventListener('popstate', navigate);
    return () => { window.removeEventListener('module-navigate', navigate); window.removeEventListener('popstate', navigate); };
  }, [module]);
}
