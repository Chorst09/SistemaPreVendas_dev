'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Bell, ChevronRight, LogOut, Menu, Search, Settings, WifiOff, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { dueLabel, type AttentionItem } from '@/lib/dashboard';
import type { ShellUser } from './application-shell';

interface HeaderProps {
  currentTitle: string; currentSubtitle?: string;
  currentUser?: ShellUser | null; onNavigateSettings?: () => void; onLogout?: () => void;
  onOpenMenu?: () => void; destinations?: { id: string; label: string; group?: string; icon?: ReactNode }[];
  onNavigate: (module: string, recordId?: string) => void; notifications: AttentionItem[];
}
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export function ApplicationHeader({ currentTitle, currentSubtitle, currentUser, onNavigateSettings, onLogout, onOpenMenu, destinations = [], onNavigate, notifications }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [offline, setOffline] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setSearchOpen(value => !value); }
    };
    const connection = () => setOffline(!navigator.onLine);
    connection(); window.addEventListener('keydown', shortcut); window.addEventListener('online', connection); window.addEventListener('offline', connection);
    return () => { window.removeEventListener('keydown', shortcut); window.removeEventListener('online', connection); window.removeEventListener('offline', connection); };
  }, []);
  const results = destinations.filter(item => normalize(`${item.label} ${item.group || ''}`).includes(normalize(query)));
  const select = (id: string, record?: string) => { onNavigate(id, record); setSearchOpen(false); setNotificationOpen(false); setQuery(''); };
  return <header className="app-header">
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <Button variant="ghost" size="icon" className="shrink-0 md:hidden" onClick={onOpenMenu} aria-label="Abrir menu principal"><Menu /></Button>
      <nav className="app-breadcrumb" aria-label="Localização"><span className="hidden lg:inline">Área de trabalho</span><ChevronRight className="hidden lg:inline" /><span className={currentSubtitle ? 'hidden sm:inline' : 'truncate font-semibold text-foreground'}>{currentTitle === 'Dashboard' ? 'Visão geral' : currentTitle}</span>{currentSubtitle && <><ChevronRight className="hidden sm:inline" /><strong className="truncate">{currentSubtitle}</strong></>}</nav>
    </div>
    <div className="flex shrink-0 items-center gap-1 sm:gap-2">
      <Button variant="outline" className="app-search-trigger" onClick={() => setSearchOpen(true)} aria-label="Buscar módulos"><Search /><span className="hidden xl:inline">Buscar módulos...</span><kbd className="hidden xl:inline">⌘ K</kbd></Button>
      {offline && <span className="hidden items-center gap-1 text-xs text-destructive sm:flex"><WifiOff className="h-4 w-4" />Sem conexão</span>}
      <Popover open={notificationOpen} onOpenChange={setNotificationOpen}><PopoverTrigger asChild><Button variant="ghost" size="icon" className="relative" aria-label={`Pendências${notifications.length ? `: ${notifications.length}` : ''}`}><Bell />{notifications.length > 0 && <span className="notification-dot" />}</Button></PopoverTrigger><PopoverContent align="end" className="w-[min(380px,calc(100vw-2rem))] p-0"><div className="border-b p-4"><h2 className="font-semibold">Central de pendências</h2><p className="mt-1 text-xs text-muted-foreground">Prazos e itens que precisam de andamento.</p></div><div className="max-h-[60dvh] overflow-y-auto p-2">{notifications.length ? notifications.slice(0, 12).map(item => <button type="button" key={item.id} className="notification-item" onClick={() => select(item.module, item.recordId)}><span className="text-xs text-muted-foreground">{item.kind} · {dueLabel(item)}</span><strong>{item.title}</strong><span>{item.description}</span></button>) : <div className="p-6 text-center text-sm text-muted-foreground">Nenhuma pendência encontrada.</div>}</div></PopoverContent></Popover>
      {onNavigateSettings && <Button variant="ghost" size="icon" className="hidden sm:inline-flex" onClick={onNavigateSettings} aria-label="Configurações"><Settings /></Button>}
      {currentUser && <div className="hidden items-center gap-2 border-l pl-3 md:flex"><span className="app-avatar">{currentUser.name.split(' ').slice(0, 2).map(n => n[0]).join('')}</span><span className="max-w-28 truncate text-xs font-medium">{currentUser.name}</span></div>}
      {onLogout && <Button variant="ghost" size="icon" onClick={onLogout} aria-label="Sair do sistema"><LogOut /></Button>}
    </div>
    <Dialog open={searchOpen} onOpenChange={open => { setSearchOpen(open); if (!open) setQuery(''); }}><DialogContent className="max-w-xl p-0"><DialogHeader className="px-5 pb-0 pt-5 text-left"><DialogTitle>Ir para um módulo</DialogTitle><DialogDescription>Encontre ferramentas e áreas de trabalho.</DialogDescription></DialogHeader><div className="relative mx-5"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input autoFocus aria-label="Buscar módulos" placeholder="Buscar módulos..." className="pl-10" value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => { if (event.key === 'ArrowDown') { event.preventDefault(); resultsRef.current?.querySelector('button')?.focus(); } if (event.key === 'Enter' && results[0]) select(results[0].id); }} /></div><div ref={resultsRef} className="max-h-[min(50dvh,400px)] overflow-y-auto px-3 pb-3" onKeyDown={event => { const buttons = Array.from(resultsRef.current?.querySelectorAll('button') || []); const index = buttons.indexOf(document.activeElement as HTMLButtonElement); if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); buttons[(index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length]?.focus(); } }}>{results.length ? results.map(item => <button type="button" className="module-search-result" key={item.id} onClick={() => select(item.id)}><span className="text-muted-foreground [&_svg]:h-4 [&_svg]:w-4">{item.icon}</span><span className="min-w-0 flex-1"><strong>{item.label}</strong>{item.group && <small>{item.group}</small>}</span><ArrowUpRight className="h-4 w-4 text-muted-foreground" /></button>) : <p className="p-6 text-center text-sm text-muted-foreground">Nenhum módulo encontrado para “{query}”.</p>}</div></DialogContent></Dialog>
  </header>;
}
