'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Headset, FileText, Users, Zap, BarChart3, Award } from 'lucide-react';

interface ServiceDeskLandingPageProps {
  onNewProposal: () => void;
  onModernCalculator: () => void;
  onAdminPanel: () => void;
}

export function ServiceDeskLandingPage({ onNewProposal, onModernCalculator, onAdminPanel }: ServiceDeskLandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
      <div className="max-w-6xl w-full">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="p-4 bg-purple-500/20 rounded-full backdrop-blur-sm border border-purple-400/30">
              <Headset className="h-16 w-16 text-purple-400" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Potencialize Seu Negócio
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              com Precificação Inteligente
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Nossa solução inovadora de precificação Service Desk foi projetada para profissionais de TI que
            exigem precisão e flexibilidade. Personalize sua estratégia de preços sem esforço e
            eleve o potencial do seu negócio.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 backdrop-blur-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
            <CardContent className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <Users className="h-8 w-8 text-purple-400" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Gestão de Equipe</h3>
              <p className="text-gray-400 text-sm">
                Dimensione sua equipe com base em volume de chamados e SLA
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 backdrop-blur-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
            <CardContent className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-pink-500/20 rounded-lg">
                  <Zap className="h-8 w-8 text-pink-400" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Atendimento Ágil</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Otimize processos e reduza tempo de resposta aos chamados
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 backdrop-blur-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
            <CardContent className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-cyan-500/20 rounded-lg">
                  <BarChart3 className="h-8 w-8 text-cyan-400" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Métricas Detalhadas</h3>
              <p className="text-gray-400 text-sm">
                Acompanhe KPIs e tome decisões baseadas em dados reais
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <Button
            onClick={onModernCalculator}
            size="lg"
            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-12 py-6 text-lg font-semibold rounded-xl shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all transform hover:scale-105"
          >
            <Zap className="h-6 w-6 mr-3" />
            Calculadora Moderna
          </Button>

          <Button
            onClick={onNewProposal}
            size="lg"
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-12 py-6 text-lg font-semibold rounded-xl shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/50 transition-all transform hover:scale-105"
          >
            <FileText className="h-6 w-6 mr-3" />
            Proposta Completa
          </Button>

          <Button
            onClick={onAdminPanel}
            size="lg"
            variant="outline"
            className="border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white px-12 py-6 text-lg font-semibold rounded-xl backdrop-blur-sm transition-all"
          >
            <Award className="h-6 w-6 mr-3" />
            Painel Admin
          </Button>
        </div>

        {/* Stats Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Chamados/Mês', value: '10K+' },
            { label: 'Tempo Médio Resposta', value: '< 15min' },
            { label: 'Satisfação Cliente', value: '98%' },
            { label: 'Resolução 1º Nível', value: '85%' }
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
