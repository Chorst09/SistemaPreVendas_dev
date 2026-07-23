'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Server, FileText, TrendingUp, Shield, Database, Users } from 'lucide-react';
import { NOCServiceScope } from '@/lib/types/noc-pricing';

interface NOCLandingPageProps {
  onNewProposal: (mode: NOCServiceScope) => void;
  onAdminPanel: () => void;
}

export function NOCLandingPage({ onNewProposal, onAdminPanel }: NOCLandingPageProps) {
  return (
    <div className="noc-theme min-h-screen flex items-center justify-center p-6">
      <div className="max-w-6xl w-full">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="p-4 bg-blue-500/20 rounded-full backdrop-blur-sm border border-blue-400/30">
              <Server className="h-16 w-16 text-blue-400" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
            Potencialize Seu Negócio
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              com Precificação Inteligente
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Precifique NOC, SOC e SIEM em um único fluxo, com cálculo por dispositivos, ativos,
            ingestão de logs, retenção, SLA, equipe, impostos e benchmark de mercado.
          </p>
        </div>

        {/* Service Choice */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            {
              id: 'noc' as NOCServiceScope,
              title: 'NOC',
              icon: Server,
              description: 'Monitoramento de rede, infraestrutura, disponibilidade, métricas, alertas e operação 24x7.'
            },
            {
              id: 'soc' as NOCServiceScope,
              title: 'SOC',
              icon: Shield,
              description: 'Operação de segurança por ativo, MDR, triagem, threat hunting e resposta a incidentes.'
            },
            {
              id: 'siem' as NOCServiceScope,
              title: 'SIEM',
              icon: Database,
              description: 'Ingestão de logs em GB/dia, correlação, retenção, fontes, parsers e regras gerenciadas.'
            }
          ].map(option => {
            const Icon = option.icon;
            return (
              <Card key={option.id} className="card-surface border-border/60 backdrop-blur-sm hover:bg-card/95 transition-all">
                <CardContent className="p-6 text-center space-y-5">
                  <div className="flex justify-center">
                    <div className="p-3 bg-blue-500/20 rounded-lg">
                      <Icon className="h-8 w-8 text-blue-400" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">{option.title}</h3>
                    <p className="text-muted-foreground text-sm min-h-[72px]">{option.description}</p>
                  </div>
                  <Button onClick={() => onNewProposal(option.id)} className="w-full">
                    <FileText className="h-4 w-4 mr-2" />
                    Precificar {option.title}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="card-surface border-border/60 backdrop-blur-sm hover:bg-card/95 transition-all">
            <CardContent className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <TrendingUp className="h-8 w-8 text-blue-400" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Precificação Inteligente</h3>
              <p className="text-muted-foreground text-sm">
                Algoritmos avançados para calcular preços competitivos e lucrativos
              </p>
            </CardContent>
          </Card>

          <Card className="card-surface border-border/60 backdrop-blur-sm hover:bg-card/95 transition-all">
            <CardContent className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-cyan-500/20 rounded-lg">
                  <Shield className="h-8 w-8 text-cyan-400" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">SOC e SIEM Gerenciado</h3>
              <p className="text-muted-foreground text-sm">
                Modelo por ativo, GB/dia, retenção, MDR, hunting e resposta a incidentes
              </p>
            </CardContent>
          </Card>

          <Card className="card-surface border-border/60 backdrop-blur-sm hover:bg-card/95 transition-all">
            <CardContent className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <Database className="h-8 w-8 text-blue-300" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Cobertura 24x7</h3>
              <p className="text-muted-foreground text-sm">
                Suporte para diferentes modelos de atendimento e escalas
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <Button
            onClick={onAdminPanel}
            size="lg"
            variant="outline"
            className="border-2 border-border bg-card/75 hover:bg-card text-foreground px-12 py-6 text-lg font-semibold rounded-xl backdrop-blur-sm transition-all"
          >
            <Users className="h-6 w-6 mr-3" />
            Painel Administrativo
          </Button>
        </div>

        {/* Stats Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Ativos Monitorados', value: '1000+' },
            { label: 'Eventos e Métricas', value: '50K+' },
            { label: 'Uptime Garantido', value: '99.9%' },
            { label: 'Clientes Satisfeitos', value: '200+' }
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
