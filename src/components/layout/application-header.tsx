'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Bell, ChevronRight, LogOut, Menu, Search, Settings, WifiOff, ArrowUpRight, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
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
  const { resolvedTheme, setTheme } = useTheme();
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
    <div className="flex shrink-0 items-center gap-1 sm:gap-2.5">
      <Button 
        size="sm" 
        onClick={() => onNavigate('quotes', 'new')} 
        className="hidden md:inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold text-xs h-8 px-3.5 rounded-full shadow-[0_2px_10px_rgba(37,99,235,0.4)] transition-all hover:scale-105"
      >
        <span>+ Novo Orçamento</span>
      </Button>
      <Button variant="outline" className="app-search-trigger" onClick={() => setSearchOpen(true)} aria-label="Buscar módulos"><Search /><span className="hidden xl:inline">Buscar módulos...</span><kbd className="hidden xl:inline">⌘ K</kbd></Button>
      {offline && <span className="hidden items-center gap-1 text-xs text-destructive sm:flex"><WifiOff className="h-4 w-4" />Sem conexão</span>}
      <Popover open={notificationOpen} onOpenChange={setNotificationOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-xl border border-cyan-500/20 hover:border-cyan-400/40 hover:bg-cyan-500/10" aria-label={`Pendências${notifications.length ? `: ${notifications.length}` : ''}`}>
            <Bell className="h-4 w-4" />
            {notifications.length > 0 && <span className="notification-dot" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[min(380px,calc(100vw-2rem))] p-0"><div className="border-b p-4"><h2 className="font-semibold">Central de pendências</h2><p className="mt-1 text-xs text-muted-foreground">Prazos e itens que precisam de andamento.</p></div><div className="max-h-[60dvh] overflow-y-auto p-2">{notifications.length ? notifications.slice(0, 12).map(item => <button type="button" key={item.id} className="notification-item" onClick={() => select(item.module, item.recordId)}><span className="text-xs text-muted-foreground">{item.kind} · {dueLabel(item)}</span><strong>{item.title}</strong><span>{item.description}</span></button>) : <div className="p-6 text-center text-sm text-muted-foreground">Nenhuma pendência encontrada.</div>}</div></PopoverContent>
      </Popover>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        className="h-9 w-9 rounded-xl border border-cyan-500/30 bg-[#0c1a26]/80 text-foreground hover:bg-cyan-500/10 hover:border-cyan-400/50 shadow-[0_2px_10px_rgba(6,182,212,0.15)] transition-all"
        aria-label={resolvedTheme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
      >
        {resolvedTheme === 'dark' ? <Moon className="h-4 w-4 text-slate-100" /> : <Sun className="h-4 w-4 text-amber-500" />}
      </Button>
      {onNavigateSettings && <Button variant="ghost" size="icon" className="hidden sm:inline-flex h-9 w-9 rounded-xl border border-cyan-500/20 hover:border-cyan-400/40 hover:bg-cyan-500/10" onClick={onNavigateSettings} aria-label="Configurações"><Settings className="h-4 w-4" /></Button>}
      {currentUser && (
        <div className="hidden items-center gap-2.5 border-l border-cyan-500/20 pl-3 md:flex">
          <div className="text-right leading-tight">
            <span className="block text-xs font-bold text-foreground tracking-tight">{currentUser.name || 'Carlos Horst'}</span>
            <span className="block text-[9.5px] font-extrabold tracking-widest text-cyan-400 uppercase">{currentUser.role === 'admin' ? 'MASTER' : (currentUser.role || 'MASTER')}</span>
          </div>
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#0c2436] to-[#071520] border border-cyan-400/40 text-cyan-300 font-bold text-xs flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.25)]">
            {currentUser.name ? currentUser.name.split(' ').slice(0, 2).map(n => n[0]).join('') : 'CH'}
          </div>
        </div>
      )}
      {onLogout && <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onLogout} aria-label="Sair do sistema"><LogOut className="h-4 w-4" /></Button>}
    </div>
    <Dialog open={searchOpen} onOpenChange={open => { setSearchOpen(open); if (!open) setQuery(''); }}><DialogContent className="max-w-xl p-0"><DialogHeader className="px-5 pb-0 pt-5 text-left"><DialogTitle>Ir para um módulo</DialogTitle><DialogDescription>Encontre ferramentas e áreas de trabalho.</DialogDescription></DialogHeader><div className="relative mx-5"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input autoFocus aria-label="Buscar módulos" placeholder="Buscar módulos..." className="pl-10" value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => { if (event.key === 'ArrowDown') { event.preventDefault(); resultsRef.current?.querySelector('button')?.focus(); } if (event.key === 'Enter' && results[0]) select(results[0].id); }} /></div><div ref={resultsRef} className="max-h-[min(50dvh,400px)] overflow-y-auto px-3 pb-3" onKeyDown={event => { const buttons = Array.from(resultsRef.current?.querySelectorAll('button') || []); const index = buttons.indexOf(document.activeElement as HTMLButtonElement); if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); buttons[(index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length]?.focus(); } }}>{results.length ? results.map(item => <button type="button" className="module-search-result" key={item.id} onClick={() => select(item.id)}><span className="text-muted-foreground [&_svg]:h-4 [&_svg]:w-4">{item.icon}</span><span className="min-w-0 flex-1"><strong>{item.label}</strong>{item.group && <small>{item.group}</small>}</span><ArrowUpRight className="h-4 w-4 text-muted-foreground" /></button>) : <p className="p-6 text-center text-sm text-muted-foreground">Nenhum módulo encontrado para “{query}”.</p>}</div></DialogContent></Dialog>
  </header>;
}
