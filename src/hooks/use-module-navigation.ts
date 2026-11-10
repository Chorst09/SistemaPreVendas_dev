'use client';

import { useCallback, useEffect, useState } from 'react';

export function useModuleNavigation(initial = 'dashboard') {
  const [active, setActive] = useState(initial);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const restore = () => {
      const params = new URL(window.location.href).searchParams;
      const requested = params.get('module') || params.get('tab');
      setActive(requested || initial);
    };
    restore(); setReady(true);
    window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, [initial]);
  const navigate = useCallback((module: string, recordId?: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('module', module);
    if (recordId) url.searchParams.set('record', recordId);
    else url.searchParams.delete('record');
    if (url.href !== window.location.href) window.history.pushState({}, '', url);
    setActive(module);
    window.localStorage.setItem('sistema-pre-active-tab', module);
    window.dispatchEvent(new Event('module-navigate'));
  }, []);
  return [active, navigate, ready] as const;
}
