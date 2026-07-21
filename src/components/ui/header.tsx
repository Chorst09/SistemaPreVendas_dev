"use client";

import React from 'react';
import { LogOut, Search, User, Menu, Settings, Bell, ChevronDown } from 'lucide-react';
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

export function Header({ currentTitle, currentSubtitle, logoSrc, currentUser, onNavigateSettings, onLogout }: HeaderProps) {
    return (
        <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
            {/* Main Header Bar */}
            <div className="flex h-16 items-center justify-between px-4 md:px-6">
                {/* Left - Logo & Title */}
                <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                        <ChorstLogo size="md" logoSrc={logoSrc || undefined} />
                    </div>
                    
                    <div className="hidden md:block h-8 w-px bg-border/60" />
                    
                    <div className="hidden md:flex flex-col min-w-0">
                        <h1 className="text-lg font-bold text-foreground truncate">
                            Sistema Pré-Venda TI
                        </h1>
                        <p className="text-xs text-muted-foreground truncate">
                            {currentSubtitle || 'Gestão Completa de Precificações e Propostas'}
                        </p>
                    </div>
                </div>

                {/* Center - Search (Desktop) */}
                <div className="hidden lg:flex items-center flex-1 max-w-md mx-8">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                            type="search"
                            placeholder="Buscar módulos, funcionalidades..."
                            className="pl-10 h-10 bg-muted/50 border-transparent focus:bg-background focus:border-primary/50"
                        />
                    </div>
                </div>

                {/* Right - Actions */}
                <div className="flex items-center gap-2">
                    {/* Notifications */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="relative h-10 w-10 text-muted-foreground hover:text-foreground"
                    >
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-accent animate-pulse" />
                    </Button>

                    {/* Settings */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-muted-foreground hover:text-foreground"
                        onClick={onNavigateSettings}
                        title="Configurações"
                    >
                        <Settings className="h-5 w-5" />
                    </Button>

                    {/* Separator */}
                    <div className="hidden md:block h-8 w-px bg-border/60 mx-1" />

                    {/* User Menu */}
                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <User className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold text-foreground truncate max-w-[120px]">
                                {currentUser?.name || 'Usuário'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {currentUser?.role === 'admin' ? 'Administrador' : 'Usuário'}
                            </span>
                        </div>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </div>

                    {/* Logout */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-muted-foreground hover:text-destructive"
                        onClick={onLogout}
                        title="Sair"
                    >
                        <LogOut className="h-5 w-5" />
                    </Button>

                    {/* Mobile Menu */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden h-10 w-10 text-muted-foreground"
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Sub Header - Breadcrumb/Current Page */}
            <div className="border-t border-border/40 bg-muted/30 px-4 md:px-6 py-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-foreground capitalize">
                            {currentTitle}
                        </h2>
                        {currentSubtitle && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {currentSubtitle}
                            </p>
                        )}
                    </div>

                    {/* Status Indicator */}
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-accent-green/10 border border-accent-green/20">
                        <div className="h-2 w-2 rounded-full bg-accent-green animate-pulse" />
                        <span className="text-xs font-medium text-accent-green">Online</span>
                    </div>
                </div>
            </div>
        </header>
    );
}
