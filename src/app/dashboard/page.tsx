'use client';

import React from 'react';
import { SystemDashboard } from '@/components/service-desk-pricing/dashboard/SystemDashboard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { AuthGate } from '@/components/auth/AuthGate';

export default function DashboardPage() {
  // TODO: Get userId from authentication
  const userId = 'temp-user-id';

  return (
    <AuthGate>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 md:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/projects">
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Projetos</span>
                  </Button>
                </Link>
                
                <div className="h-6 w-px bg-border/60 hidden sm:block" />
                
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <LayoutDashboard className="h-5 w-5" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
                    <p className="text-sm text-muted-foreground">
                      Visão geral do sistema Service Desk Pricing
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Link href="/projects">
                  <Button variant="outline" size="sm">
                    Ver Projetos
                  </Button>
                </Link>
                <Link href="/projects">
                  <Button size="sm">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline ml-2">Novo Projeto</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 md:px-6 py-6">
          <SystemDashboard userId={userId} />
        </div>
      </div>
    </AuthGate>
  );
}
