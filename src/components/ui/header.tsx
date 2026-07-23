"use client";

import React from 'react';
import { LogOut, Search, User, Settings, Bell, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChorstLogo } from '@/components/ui/chorst-logo';
import type { SystemUser } from '@/lib/services/user-auth-service';

interface HeaderProps {
    currentTitle: string;
    currentSubtitle?: string;
    logoSrc?: string | null;
    currentUser?: SystemUser | null;
    onNavigateSettings?: () => void;
    onLogout?: () => void;
}

export function Header({
    currentTitle,
    currentSubtitle,
    logoSrc,
    currentUser,
    onNavigateSettings,
    onLogout,
}: HeaderProps) {
    const roleLabel =
        currentUser?.role === 'admin' ? 'Administrador' :
        currentUser?.role === 'manager' ? 'Gerente' : 'Usuário';

    const initials = (currentUser?.name ?? 'U')
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase();

    return (
        <header className="header-modern sticky top-0 z-40 w-full">
            <div className="flex h-14 items-center gap-3 px-4 md:px-5">

                {/* ── Breadcrumb ─────────────────────────────────────── */}
                <nav className="flex min-w-0 flex-1 items-center gap-1.5 text-sm">
                    <span className="hidden shrink-0 text-xs font-semibold text-muted-foreground/60 sm:block">
                        Sistema Pré-Venda TI
                    </span>
                    {currentSubtitle && (
                        <>
                            <ChevronRight className="hidden h-3.5 w-3.5 shrink-0 text-muted-foreground/40 sm:block" />
                            <span className="hidden shrink-0 text-xs text-muted-foreground/60 sm:block">
                                {currentTitle}
                            </span>
                            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                            <span className="truncate font-semibold text-foreground">
                                {currentSubtitle}
                            </span>
                        </>
                    )}
                    {!currentSubtitle && (
                        <>
                            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                            <span className="truncate font-semibold text-foreground">
                                {currentTitle}
                            </span>
                        </>
                    )}
                </nav>

                {/* ── Search ─────────────────────────────────────────── */}
                <div className="hidden lg:flex items-center w-56 xl:w-72">
                    <div className="relative w-full">
                        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
                        <Input
                            type="search"
                            placeholder="Buscar módulos..."
                            className="h-8 w-full rounded-lg border-border/50 bg-muted/40 pl-8 text-xs placeholder:text-muted-foreground/50 focus:bg-background focus:border-primary/40 focus:ring-0"
                        />
                    </div>
                </div>

                {/* ── Actions ────────────────────────────────────────── */}
                <div className="flex shrink-0 items-center gap-1">

                    {/* Status online */}
                    <div className="hidden items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/8 px-2.5 py-1 sm:flex">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                        <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Online</span>
                    </div>

                    {/* Notificações */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="relative h-8 w-8 text-muted-foreground hover:text-foreground"
                        title="Notificações"
                    >
                        <Bell className="h-4 w-4" />
                        <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
                    </Button>

                    {/* Settings */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={onNavigateSettings}
                        title="Configurações"
                    >
                        <Settings className="h-4 w-4" />
                    </Button>

                    {/* Divider */}
                    <div className="mx-1 hidden h-6 w-px bg-border/50 md:block" />

                    {/* User chip */}
                    <div className="hidden items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/60 md:flex cursor-default">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary ring-1 ring-primary/20">
                            {initials}
                        </div>
                        <div className="flex flex-col leading-none">
                            <span className="max-w-[110px] truncate text-[12px] font-semibold text-foreground">
                                {currentUser?.name ?? 'Usuário'}
                            </span>
                            <span className="text-[10px] text-muted-foreground">{roleLabel}</span>
                        </div>
                    </div>

                    {/* Logout */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        onClick={onLogout}
                        title="Sair do sistema"
                    >
                        <LogOut className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </header>
    );
}
