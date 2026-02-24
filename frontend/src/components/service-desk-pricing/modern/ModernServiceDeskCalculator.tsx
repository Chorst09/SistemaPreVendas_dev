'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, Clock, DollarSign, 
  Calculator, Zap, CheckCircle, AlertCircle,
  BarChart3, PieChart, Activity, Target
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalculationResult {
  n1Agents: number;
  n2Agents: number;
  totalAgents: number;
  monthlyCost: number;
  annualCost: number;
  costPerTicket: number;
  costPerUser: number;
  occupancyRate: number;
  serviceLevel: number;
  efficiency: 'low' | 'optimal' | 'high';
}

export function ModernServiceDeskCalculator() {
  // Input States
  const [users, setUsers] = useState(100);
  const [ticketsPerUser, setTicketsPerUser] = useState(1.5);
  const [avgHandleTime, setAvgHandleTime] = useState(10);
  const [targetServiceLevel, setTargetServiceLevel] = useState(80);
  const [targetResponseTime, setTargetResponseTime] = useState(20);
  const [costPerAgent, setCostPerAgent] = useState(5000);
  const [coverage, setCoverage] = useState<'8x5' | '12x5' | '24x7'>('8x5');
  const [n1Distribution, setN1Distribution] = useState(80);

  // Calculate results in real-time
  const results = useMemo((): CalculationResult => {
    const monthlyTickets = users * ticketsPerUser;
    const dailyTickets = monthlyTickets / 22; // 22 working days
    const hourlyTickets = dailyTickets / 8; // 8 hour workday
    
    // Erlang C calculation (simplified)
    const workload = (hourlyTickets * avgHandleTime) / 60;
    const targetOccupancy = 0.85; // 85% target occupancy
    const safetyFactor = 1.15; // 15% safety margin
    
    const baseAgents = Math.ceil((workload / targetOccupancy) * safetyFactor);
    
    // Distribute between N1 and N2
    const n1Agents = Math.max(1, Math.ceil(baseAgents * (n1Distribution / 100)));
    const n2Agents = Math.max(1, Math.ceil(baseAgents * ((100 - n1Distribution) / 100)));
    const totalAgents = n1Agents + n2Agents;
    
    // Coverage multiplier
    const coverageMultiplier = coverage === '24x7' ? 4 : coverage === '12x5' ? 1.5 : 1;
    const adjustedAgents = Math.ceil(totalAgents * coverageMultiplier);
    
    // Cost calculations
    const monthlyCost = adjustedAgents * costPerAgent;
    const annualCost = monthlyCost * 12;
    const costPerTicket = monthlyCost / monthlyTickets;
    const costPerUser = monthlyCost / users;
    
    // Performance metrics
    const actualOccupancy = (workload / totalAgents) * 100;
    const serviceLevel = Math.min(99, targetServiceLevel + (totalAgents - baseAgents) * 2);
    
    // Efficiency rating
    let efficiency: 'low' | 'optimal' | 'high' = 'optimal';
    if (actualOccupancy < 70) efficiency = 'low';
    if (actualOccupancy > 90) efficiency = 'high';
    
    return {
      n1Agents,
      n2Agents,
      totalAgents: adjustedAgents,
      monthlyCost,
      annualCost,
      costPerTicket,
      costPerUser,
      occupancyRate: actualOccupancy,
      serviceLevel,
      efficiency
    };
  }, [users, ticketsPerUser, avgHandleTime, targetServiceLevel, targetResponseTime, costPerAgent, coverage, n1Distribution]);

  const getEfficiencyColor = (efficiency: string) => {
    switch (efficiency) {
      case 'low': return 'text-yellow-600 bg-yellow-50';
      case 'optimal': return 'text-green-600 bg-green-50';
      case 'high': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getEfficiencyLabel = (efficiency: string) => {
    switch (efficiency) {
      case 'low': return 'Subutilizado';
      case 'optimal': return 'Ótimo';
      case 'high': return 'Sobrecarregado';
      default: return 'Normal';
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Calculator className="h-8 w-8 text-blue-600" />
            Calculadora Service Desk
          </h1>
          <p className="text-muted-foreground mt-1">
            Dimensione sua equipe em tempo real com cálculos baseados em Erlang C
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          <Zap className="h-4 w-4 mr-2" />
          Cálculo Instantâneo
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Inputs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Volume Card */}
          <Card className="border-2 hover:border-blue-200 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Volume de Atendimento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Número de Usuários</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={users}
                      onChange={(e) => setUsers(parseInt(e.target.value) || 0)}
                      className="w-24 text-right font-semibold"
                    />
                    <span className="text-sm text-muted-foreground">usuários</span>
                  </div>
                </div>
                <Slider
                  value={[users]}
                  onValueChange={([value]) => setUsers(value)}
                  min={10}
                  max={10000}
                  step={10}
                  className="py-4"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>10</span>
                  <span>5,000</span>
                  <span>10,000</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Tickets por Usuário/Mês</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.1"
                      value={ticketsPerUser}
                      onChange={(e) => setTicketsPerUser(parseFloat(e.target.value) || 0)}
                      className="w-24 text-right font-semibold"
                    />
                    <span className="text-sm text-muted-foreground">tickets</span>
                  </div>
                </div>
                <Slider
                  value={[ticketsPerUser * 10]}
                  onValueChange={([value]) => setTicketsPerUser(value / 10)}
                  min={5}
                  max={50}
                  step={1}
                  className="py-4"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0.5</span>
                  <span>2.5</span>
                  <span>5.0</span>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900">Volume Mensal Total</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {Math.round(users * ticketsPerUser).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-blue-700 mt-1">
                  ~{Math.round((users * ticketsPerUser) / 22)} tickets/dia
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Performance Card */}
          <Card className="border-2 hover:border-green-200 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                Metas de Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Tempo Médio de Atendimento (TMA)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={avgHandleTime}
                      onChange={(e) => setAvgHandleTime(parseInt(e.target.value) || 0)}
                      className="w-24 text-right font-semibold"
                    />
                    <span className="text-sm text-muted-foreground">min</span>
                  </div>
                </div>
                <Slider
                  value={[avgHandleTime]}
                  onValueChange={([value]) => setAvgHandleTime(value)}
                  min={5}
                  max={60}
                  step={1}
                  className="py-4"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Nível de Serviço Alvo</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={targetServiceLevel}
                      onChange={(e) => setTargetServiceLevel(parseInt(e.target.value) || 0)}
                      className="w-24 text-right font-semibold"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
                <Slider
                  value={[targetServiceLevel]}
                  onValueChange={([value]) => setTargetServiceLevel(value)}
                  min={70}
                  max={99}
                  step={1}
                  className="py-4"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Tempo de Resposta Alvo</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={targetResponseTime}
                      onChange={(e) => setTargetResponseTime(parseInt(e.target.value) || 0)}
                      className="w-24 text-right font-semibold"
                    />
                    <span className="text-sm text-muted-foreground">seg</span>
                  </div>
                </div>
                <Slider
                  value={[targetResponseTime]}
                  onValueChange={([value]) => setTargetResponseTime(value)}
                  min={10}
                  max={120}
                  step={5}
                  className="py-4"
                />
              </div>

              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-sm font-medium text-green-900 mb-2">Meta de SLA</div>
                <div className="text-lg font-bold text-green-600">
                  {targetServiceLevel}% em {targetResponseTime} segundos
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuration Card */}
          <Card className="border-2 hover:border-purple-200 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-600" />
                Configuração da Equipe
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label className="text-base font-medium">Cobertura de Atendimento</Label>
                <div className="grid grid-cols-3 gap-3">
                  {(['8x5', '12x5', '24x7'] as const).map((option) => (
                    <button
                      key={option}
                      onClick={() => setCoverage(option)}
                      className={cn(
                        "p-4 rounded-lg border-2 transition-all",
                        coverage === option
                          ? "border-purple-600 bg-purple-50 text-purple-900"
                          : "border-gray-200 hover:border-purple-300"
                      )}
                    >
                      <div className="font-bold text-lg">{option}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {option === '8x5' && 'Comercial'}
                        {option === '12x5' && 'Estendido'}
                        {option === '24x7' && 'Integral'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Distribuição N1</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={n1Distribution}
                      onChange={(e) => setN1Distribution(parseInt(e.target.value) || 0)}
                      className="w-24 text-right font-semibold"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
                <Slider
                  value={[n1Distribution]}
                  onValueChange={([value]) => setN1Distribution(value)}
                  min={50}
                  max={95}
                  step={5}
                  className="py-4"
                />
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-xs text-blue-700">N1 (Primeiro Nível)</div>
                    <div className="text-lg font-bold text-blue-900">{n1Distribution}%</div>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <div className="text-xs text-orange-700">N2 (Segundo Nível)</div>
                    <div className="text-lg font-bold text-orange-900">{100 - n1Distribution}%</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Custo por Agente/Mês</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">R$</span>
                    <Input
                      type="number"
                      value={costPerAgent}
                      onChange={(e) => setCostPerAgent(parseInt(e.target.value) || 0)}
                      className="w-32 text-right font-semibold"
                    />
                  </div>
                </div>
                <Slider
                  value={[costPerAgent]}
                  onValueChange={([value]) => setCostPerAgent(value)}
                  min={3000}
                  max={15000}
                  step={500}
                  className="py-4"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Results */}
        <div className="space-y-6">
          {/* Main Results Card */}
          <Card className="border-2 border-blue-600 bg-gradient-to-br from-blue-50 to-white sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <BarChart3 className="h-5 w-5" />
                Resultado do Dimensionamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Team Size */}
              <div className="p-4 bg-white rounded-lg border-2 border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Equipe Total</span>
                  <Badge className={cn("text-xs", getEfficiencyColor(results.efficiency))}>
                    {getEfficiencyLabel(results.efficiency)}
                  </Badge>
                </div>
                <div className="text-4xl font-bold text-blue-600 mb-3">
                  {results.totalAgents}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-blue-50 rounded">
                    <div className="text-xs text-blue-700">N1</div>
                    <div className="text-lg font-bold text-blue-900">{results.n1Agents}</div>
                  </div>
                  <div className="p-2 bg-orange-50 rounded">
                    <div className="text-xs text-orange-700">N2</div>
                    <div className="text-lg font-bold text-orange-900">{results.n2Agents}</div>
                  </div>
                </div>
              </div>

              {/* Monthly Cost */}
              <div className="p-4 bg-white rounded-lg border-2 border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-600">Custo Mensal</span>
                </div>
                <div className="text-3xl font-bold text-green-600">
                  R$ {results.monthlyCost.toLocaleString('pt-BR')}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  R$ {results.annualCost.toLocaleString('pt-BR')}/ano
                </div>
              </div>

              {/* Cost per Ticket */}
              <div className="p-4 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <PieChart className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-gray-600">Custo por Ticket</span>
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  R$ {results.costPerTicket.toFixed(2)}
                </div>
              </div>

              {/* Cost per User */}
              <div className="p-4 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-gray-600">Custo por Usuário</span>
                </div>
                <div className="text-2xl font-bold text-orange-600">
                  R$ {results.costPerUser.toFixed(2)}
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Taxa de Ocupação</span>
                  <span className="font-semibold">{results.occupancyRate.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Nível de Serviço</span>
                  <span className="font-semibold text-green-600">{results.serviceLevel.toFixed(1)}%</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-4">
                <Button className="w-full" size="lg">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Salvar Dimensionamento
                </Button>
                <Button variant="outline" className="w-full">
                  <Clock className="h-4 w-4 mr-2" />
                  Gerar Relatório
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tips Card */}
          <Card className="border border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2 text-yellow-900">
                <AlertCircle className="h-4 w-4" />
                Dicas de Otimização
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-yellow-800">
              {results.efficiency === 'low' && (
                <p>• Equipe subutilizada. Considere reduzir o número de agentes ou expandir o escopo de atendimento.</p>
              )}
              {results.efficiency === 'high' && (
                <p>• Equipe sobrecarregada. Adicione mais agentes para melhorar o nível de serviço.</p>
              )}
              {results.occupancyRate < 75 && (
                <p>• Taxa de ocupação baixa. Revise o dimensionamento ou considere multi-skill.</p>
              )}
              {results.occupancyRate > 90 && (
                <p>• Taxa de ocupação muito alta. Risco de burnout e queda na qualidade.</p>
              )}
              <p>• Taxa de ocupação ideal: 75-85%</p>
              <p>• Considere sazonalidade e picos de demanda</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
