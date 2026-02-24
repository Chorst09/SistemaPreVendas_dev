"use client";

import React from 'react';
import { Search, User, Menu, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChorstLogo } from '@/components/ui/chorst-logo';

interface HeaderProps {
    currentTitle: string;
    currentSubtitle?: string;
    logoSrc?: string | null;
}

export function Header({ currentTitle, currentSubtitle, logoSrc }: HeaderProps) {
    return (
        <header className="bg-gradient-to-r from-blue-50 via-blue-100 to-blue-50 dark:from-gray-900 dark:via-blue-900 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-lg relative overflow-hidden">
            {/* Efeito de brilho sutil com animação melhorada */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-200/20 dark:via-white/5 to-transparent animate-pulse"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-400/10 dark:via-blue-400/5 to-blue-500/0 animate-in fade-in duration-1000"></div>

            {/* Logo e Título Principal */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 relative z-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 md:space-x-4">
                        {/* Logo da Chorst Consultoria */}
                        <div className="flex-shrink-0">
                            <ChorstLogo size="lg" logoSrc={logoSrc || undefined} />
                        </div>

                        {/* Separador - oculto em mobile */}
                        <div className="hidden md:block h-12 w-px bg-gradient-to-b from-transparent via-gray-400 dark:via-gray-500 to-transparent"></div>

                        {/* Nome do Sistema */}
                        <div className="flex flex-col min-w-0">
                            <h1 className="text-2xl md:text-4xl lg:text-5xl font-black bg-gradient-to-r from-blue-700 via-blue-600 to-blue-800 dark:from-white dark:via-blue-100 dark:to-blue-300 bg-clip-text text-transparent animate-slide-in-left tracking-tight leading-tight">
                                Sistema Pré-Venda TI
                            </h1>
                            <p className="text-sm md:text-base lg:text-lg text-gray-700 dark:text-gray-200 font-semibold mt-2 animate-slide-in-left-delay">
                                Gestão Completa de Precificações, Oportunidades e Propostas
                            </p>
                        </div>
                    </div>

                    {/* Controles do Header */}
                    <div className="flex items-center space-x-3">
                        {/* Barra de busca - Desktop */}
                        <div className="relative hidden lg:block">
                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 w-3 h-3" />
                            <Input
                                type="search"
                                placeholder="Buscar..."
                                className="pl-8 w-48 h-8 text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
                            />
                        </div>

                        {/* Botões de ação */}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="lg:hidden h-8 w-8 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                            <Search className="h-4 w-4" />
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                            <Settings className="h-4 w-4" />
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            className="relative h-8 w-8 rounded-full text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                            <User className="h-4 w-4" />
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            className="md:hidden h-8 w-8 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                            <Menu className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Breadcrumb/Navegação Atual */}
            <div className="px-4 py-2 bg-blue-100/50 dark:bg-gray-800/50 relative z-10">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                            {currentTitle}
                        </h2>
                        {currentSubtitle && (
                            <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                                {currentSubtitle}
                            </p>
                        )}
                    </div>

                    {/* Indicadores de status ou informações adicionais */}
                    <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-xs text-gray-600 dark:text-gray-300">Online</span>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}