'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Server, FileText, TrendingUp, Shield, Clock, Users } from 'lucide-react';

interface NOCLandingPageProps {
  onNewProposal: () => void;
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
            Nossa solução inovadora de precificação NOC foi projetada para profissionais de TI que
            exigem precisão e flexibilidade. Personalize sua estratégia de preços sem esforço e
            eleve o potencial do seu negócio.
          </p>
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
              <h3 className="text-lg font-semibold text-foreground mb-2">SLA Personalizável</h3>
              <p className="text-muted-foreground text-sm">
                Configure níveis de serviço adaptados às necessidades do cliente
              </p>
            </CardContent>
          </Card>

          <Card className="card-surface border-border/60 backdrop-blur-sm hover:bg-card/95 transition-all">
            <CardContent className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <Clock className="h-8 w-8 text-blue-300" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Cobertura 24x7</h3>
              <p className="text-muted-foreground text-sm">
                Suporte para diferentes modelos de atendimento e escalas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <Button
            onClick={onNewProposal}
            size="lg"
            className="bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-600 hover:to-cyan-500 text-white px-12 py-6 text-lg font-semibold rounded-xl shadow-2xl shadow-blue-500/25 hover:shadow-blue-400/40 transition-all transform hover:scale-105"
          >
            <FileText className="h-6 w-6 mr-3" />
            Nova Proposta
          </Button>

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
            { label: 'Dispositivos Monitorados', value: '1000+' },
            { label: 'Métricas Coletadas', value: '50K+' },
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
