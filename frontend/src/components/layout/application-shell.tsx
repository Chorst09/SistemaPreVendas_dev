'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { BriefcaseBusiness, ChevronDown, ChevronsLeft, ChevronsRight, LogOut, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { ApplicationHeader } from './application-header';
import { Nav3DIcon } from './Nav3DIcon';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useQuotes } from '@/contexts/QuoteContext';
import { attentionItems } from '@/lib/dashboard';
import type { NavItem, Proposal, RO, Edital } from '@/lib/types';
import { cn } from '@/lib/utils';

export interface ShellUser { name: string; role?: string }
const GROUPS = [
  { label: 'Visão geral', ids: ['dashboard'] },
  { label: 'Comercial', ids: ['quotes', 'proposals', 'generated-proposals', 'distributors', 'suppliers'] },
  { label: 'Precificação', ids: ['pricing'] },
  { label: 'Licitações', ids: ['bids', 'price-records'] },
  { label: 'Soluções e entrega', ids: ['it-assessment', 'poc', 'rfp', 'projects'] },
  { label: 'Administração', ids: ['settings'] },
];

export function ApplicationShell({ children, items, activeTab, onNavigate, user, logoSrc, onLogout, proposals = [], ros = [], editais = [] }: {
  children: ReactNode; items: NavItem[]; activeTab: string; onNavigate: (id: string, recordId?: string) => void;
  user?: ShellUser | null; logoSrc?: string | null; onLogout?: () => void;
  proposals?: Proposal[]; ros?: RO[]; editais?: Edital[];
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [expanded, setExpanded] = useState<string[]>([]);
  const { resolvedTheme, setTheme } = useTheme();
  const { quotes } = useQuotes();
  const destinations = items.flatMap(item => item.subItems ? item.subItems.map(sub => ({ ...sub, group: item.label })) : [{ ...item, group: '' }]);
  const current = destinations.find(item => item.id === activeTab);
  const notifications = useMemo(() => {
    const allowed = new Set(destinations.map(item => item.id));
    return attentionItems({ quotes, proposals, ros, editais }).filter(item => allowed.has(item.module));
  }, [quotes, proposals, ros, editais, items]);
  useEffect(() => {
    try { setCollapsed(localStorage.getItem('pv-sidebar-collapsed') === 'true'); } catch { /* optional preference */ }
  }, []);
  useEffect(() => { setMobileOpen(false); }, [activeTab]);
  useEffect(() => {
    const parent = items.find(item => item.subItems?.some(sub => sub.id === activeTab));
    if (parent) setExpanded(previous => previous.includes(parent.id) ? previous : [...previous, parent.id]);
    if (!destinations.some(item => item.id === activeTab) && activeTab !== 'home' && destinations[0]) onNavigate(destinations[0].id);
  }, [activeTab, items]);
  const navigate = (id: string, recordId?: string) => { onNavigate(id, recordId); setMobileOpen(false); };
  const toggleCollapse = () => setCollapsed(value => { localStorage.setItem('pv-sidebar-collapsed', String(!value)); return !value; });
  const navigation = (compact = false, surface = 'desktop') => <>
    <div className="app-brand">
      <div className="app-brand-mark">{logoSrc ? <img src={logoSrc} alt="" /> : <BriefcaseBusiness className="h-5 w-5" />}</div>
      {!compact && <div><strong>Pré-Venda TI</strong><span>Chorst Consultoria</span></div>}
    </div>
    <nav className="app-navigation" aria-label="Navegação principal">
      {GROUPS.map(group => {
        const groupItems = group.ids.map(id => items.find(item => item.id === id)).filter((item): item is NavItem => !!item);
        if (!groupItems.length) return null;
        return <div className="app-nav-group" key={group.label}>
          {!compact && <p className="app-nav-label">{group.label}</p>}
          {groupItems.map(item => {
            const selected = item.id === activeTab || !!item.subItems?.some(sub => sub.id === activeTab);
            const open = expanded.includes(item.id);
            if (!item.subItems) return (
              <button
                type="button"
                key={item.id}
                className={cn('app-nav-item group', selected && 'is-active', compact && 'is-compact')}
                aria-current={selected ? 'page' : undefined}
                title={compact ? item.label : undefined}
                aria-label={compact ? item.label : undefined}
                onClick={() => navigate(item.id)}
              >
                <Nav3DIcon id={item.id} size={compact ? 24 : 22} />
                {!compact && <span>{item.label === 'Dashboard' ? 'Visão geral' : item.label}</span>}
              </button>
            );
            return (
              <div key={item.id}>
                <button
                  type="button"
                  title={compact ? item.label : undefined}
                  aria-label={compact ? item.label : undefined}
                  className={cn('app-nav-item group', selected && 'is-parent-active', compact && 'is-compact')}
                  aria-expanded={!compact && open}
                  aria-controls={!compact && open ? `nav-${surface}-${item.id}` : undefined}
                  onClick={() => {
                    if (compact) { setCollapsed(false); setExpanded(prev => [...prev, item.id]); }
                    else setExpanded(prev => prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]);
                  }}
                >
                  <Nav3DIcon id={item.id} size={compact ? 24 : 22} />
                  {!compact && (
                    <>
                      <span>{item.label}</span>
                      <ChevronDown className={cn('app-nav-chevron ml-auto', open && 'rotate-180')} />
                    </>
                  )}
                </button>
                {!compact && open && (
                  <div className="app-subnav" id={`nav-${surface}-${item.id}`}>
                    {item.subItems.map(sub => (
                      <button
                        type="button"
                        key={sub.id}
                        className={cn('app-nav-item group', activeTab === sub.id && 'is-active')}
                        aria-current={activeTab === sub.id ? 'page' : undefined}
                        onClick={() => navigate(sub.id)}
                      >
                        <Nav3DIcon id={sub.id} size={18} />
                        <span>{sub.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>;
      })}
    </nav>
    <div className="app-sidebar-footer">
      {!compact && user && <div className="app-account"><span className="app-avatar">{user.name.split(' ').slice(0, 2).map(n => n[0]).join('')}</span><div><strong>{user.name}</strong><small>{user.role === 'admin' ? 'Administrador' : 'Minha conta'}</small></div></div>}
      <Button variant="ghost" className={cn('w-full', !compact && 'justify-start')} onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')} aria-label={resolvedTheme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}>{resolvedTheme === 'dark' ? <Sun /> : <Moon />}{!compact && <span>{resolvedTheme === 'dark' ? 'Tema claro' : 'Tema escuro'}</span>}</Button>
      {onLogout && !compact && <Button variant="ghost" className="w-full justify-start md:hidden" onClick={onLogout}><LogOut />Sair do sistema</Button>}
    </div>
  </>;
  return <div className={cn('application-shell', collapsed && 'sidebar-collapsed')}>
    <a href="#main-content" className="skip-to-content">Ir para o conteúdo</a>
    <aside className="app-sidebar" aria-label="Menu lateral">{navigation(collapsed)}<button type="button" className="sidebar-collapse" onClick={toggleCollapse} aria-label={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}>{collapsed ? <ChevronsRight /> : <ChevronsLeft />}{!collapsed && <span>Recolher menu</span>}</button></aside>
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}><SheetContent side="left" className="mobile-app-sidebar"><SheetTitle className="sr-only">Menu principal</SheetTitle><SheetDescription className="sr-only">Escolha um módulo ou altere o tema.</SheetDescription>{navigation(false, 'mobile')}</SheetContent></Sheet>
    <div className="app-workspace">
      <ApplicationHeader currentTitle={current?.group || current?.label || 'Visão geral'} currentSubtitle={current?.group ? current.label : undefined} currentUser={user} onLogout={onLogout} onNavigateSettings={items.some(item => item.id === 'settings') ? () => navigate('settings') : undefined} onOpenMenu={() => setMobileOpen(true)} destinations={destinations} onNavigate={navigate} notifications={notifications} />
      <main id="main-content" className={cn('app-content', activeTab === 'projects' && 'app-content-projects')} key={activeTab} tabIndex={-1}>{children}</main>
    </div>
  </div>;
}
