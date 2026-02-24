'use client';

import React from 'react';
import {
    Calculator,
    Users,
    Clock,
    Receipt,
    TrendingUp,
    DollarSign,
    BarChart3,
    Handshake,
    FileText,
    CheckCircle,
    AlertTriangle,
    Info,
    Lightbulb
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Individual tab guide components
export function DataTabGuide() {
    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-3">
                <Calculator className="text-blue-500" size={24} />
                <h2 className="text-xl font-semibold">Guia da Aba Dados</h2>
            </div>

            <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                    Esta é a primeira aba do sistema. Configure corretamente os dados básicos
                    pois eles serão usados em todos os cálculos posteriores.
                </AlertDescription>
            </Alert>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center space-x-2">
                            <CheckCircle className="text-green-500" size={18} />
                            <span>Campos Obrigatórios</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div>
                            <h4 className="font-medium">Nome do Projeto</h4>
                            <p className="text-sm text-gray-600">
                                Use um nome descritivo e único. Ex: "Service Desk Banco XYZ 2024"
                            </p>
                        </div>
                        <div>
                            <h4 className="font-medium">Cliente</h4>
                            <p className="text-sm text-gray-600">
                                Nome completo da empresa cliente
                            </p>
                        </div>
                        <div>
                            <h4 className="font-medium">Período do Contrato</h4>
                            <p className="text-sm text-gray-600">
                                Data de início e fim. Afeta todos os cálculos de custos
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center space-x-2">
                            <Lightbulb className="text-yellow-500" size={18} />
                            <span>Dicas Importantes</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex items-start space-x-2">
                            <Badge variant="outline" className="text-xs mt-0.5">1</Badge>
                            <p className="text-sm">Verifique se as datas estão corretas</p>
                        </div>
                        <div className="flex items-start space-x-2">
                            <Badge variant="outline" className="text-xs mt-0.5">2</Badge>
                            <p className="text-sm">A localização pode afetar impostos</p>
                        </div>
                        <div className="flex items-start space-x-2">
                            <Badge variant="outline" className="text-xs mt-0.5">3</Badge>
                            <p className="text-sm">Use descrições detalhadas</p>
                        </div>
                        <div className="flex items-start space-x-2">
                            <Badge variant="outline" className="text-xs mt-0.5">4</Badge>
                            <p className="text-sm">O sistema salva automaticamente</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center space-x-2 text-yellow-800 dark:text-yellow-200">
                        <AlertTriangle size={18} />
                        <span>Problemas Comuns</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div>
                        <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Erro: "Dados obrigatórios não preenchidos"</h4>
                        <p className="text-sm text-yellow-700">
                            <strong>Solução:</strong> Verifique se todos os campos com asterisco (*) estão preenchidos.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Erro: "Data inválida"</h4>
                        <p className="text-sm text-yellow-700">
                            <strong>Solução:</strong> Use o formato DD/MM/AAAA ou selecione no calendário.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export function TeamTabGuide() {
    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-3">
                <Users className="text-green-500" size={24} />
                <h2 className="text-xl font-semibold">Guia da Aba Equipe</h2>
            </div>

            <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                    Configure todos os profissionais que farão parte do service desk.
                    Esta aba é crucial para cálculos precisos de custos.
                </AlertDescription>
            </Alert>

            <div className="grid gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Passo a Passo</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ol className="space-y-3">
                            <li className="flex items-start space-x-3">
                                <Badge className="mt-0.5">1</Badge>
                                <div>
                                    <h4 className="font-medium">Adicionar Membro</h4>
                                    <p className="text-sm text-gray-600">Clique em "Adicionar Membro" e preencha os dados básicos</p>
                                </div>
                            </li>
                            <li className="flex items-start space-x-3">
                                <Badge className="mt-0.5">2</Badge>
                                <div>
                                    <h4 className="font-medium">Definir Cargo e Salário</h4>
                                    <p className="text-sm text-gray-600">Escolha o cargo e defina o salário base mensal</p>
                                </div>
                            </li>
                            <li className="flex items-start space-x-3">
                                <Badge className="mt-0.5">3</Badge>
                                <div>
                                    <h4 className="font-medium">Configurar Benefícios</h4>
                                    <p className="text-sm text-gray-600">Adicione vale transporte, alimentação, plano de saúde, etc.</p>
                                </div>
                            </li>
                            <li className="flex items-start space-x-3">
                                <Badge className="mt-0.5">4</Badge>
                                <div>
                                    <h4 className="font-medium">Definir Carga Horária</h4>
                                    <p className="text-sm text-gray-600">Configure horas semanais de trabalho</p>
                                </div>
                            </li>
                        </ol>
                    </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Cargos Típicos e Salários</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="font-medium">Analista N1</span>
                                <Badge variant="outline">R$ 2.500 - 3.500</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-medium">Analista N2</span>
                                <Badge variant="outline">R$ 3.500 - 5.000</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-medium">Analista N3</span>
                                <Badge variant="outline">R$ 5.000 - 7.000</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-medium">Coordenador</span>
                                <Badge variant="outline">R$ 6.000 - 8.000</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-medium">Gerente</span>
                                <Badge variant="outline">R$ 8.000 - 12.000</Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Encargos e Benefícios</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span>FGTS</span>
                                <Badge variant="secondary">8%</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>INSS Patronal</span>
                                <Badge variant="secondary">20%</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Vale Transporte</span>
                                <Badge variant="secondary">R$ 200-400</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Vale Alimentação</span>
                                <Badge variant="secondary">R$ 400-600</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Plano de Saúde</span>
                                <Badge variant="secondary">R$ 300-500</Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export function ScaleTabGuide() {
    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-3">
                <Clock className="text-purple-500" size={24} />
                <h2 className="text-xl font-semibold">Guia da Aba Escala</h2>
            </div>

            <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                    Configure os horários de atendimento e distribuição da equipe.
                    Certifique-se de ter cobertura adequada para todos os períodos.
                </AlertDescription>
            </Alert>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Cobertura 8x5</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-600 mb-3">
                            8 horas por dia, 5 dias por semana
                        </p>
                        <ul className="text-sm space-y-1">
                            <li>• Segunda a Sexta: 8h às 17h</li>
                            <li>• Finais de semana: Sem cobertura</li>
                            <li>• Ideal para: Escritórios corporativos</li>
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Cobertura 12x5</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-600 mb-3">
                            12 horas por dia, 5 dias por semana
                        </p>
                        <ul className="text-sm space-y-1">
                            <li>• Segunda a Sexta: 7h às 19h</li>
                            <li>• Finais de semana: Sem cobertura</li>
                            <li>• Ideal para: Empresas com horário estendido</li>
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Cobertura 24x7</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-600 mb-3">
                            24 horas por dia, 7 dias por semana
                        </p>
                        <ul className="text-sm space-y-1">
                            <li>• Todos os dias: 24 horas</li>
                            <li>• Turnos: Manhã, Tarde, Noite, Madrugada</li>
                            <li>• Ideal para: Operações críticas</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center space-x-2 text-blue-800 dark:text-blue-200">
                        <Lightbulb size={18} />
                        <span>Dicas para Escalas</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex items-start space-x-2">
                        <Badge variant="outline" className="text-xs mt-0.5">💡</Badge>
                        <p className="text-sm text-blue-700">Considere feriados e férias no planejamento</p>
                    </div>
                    <div className="flex items-start space-x-2">
                        <Badge variant="outline" className="text-xs mt-0.5">💡</Badge>
                        <p className="text-sm text-blue-700">Adicione 20% de folga para cobrir ausências</p>
                    </div>
                    <div className="flex items-start space-x-2">
                        <Badge variant="outline" className="text-xs mt-0.5">💡</Badge>
                        <p className="text-sm text-blue-700">Horários noturnos têm adicional de 20%</p>
                    </div>
                    <div className="flex items-start space-x-2">
                        <Badge variant="outline" className="text-xs mt-0.5">💡</Badge>
                        <p className="text-sm text-blue-700">Valide cobertura mínima por turno</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export function TaxesTabGuide() {
    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-3">
                <Receipt className="text-red-500" size={24} />
                <h2 className="text-xl font-semibold">Guia da Aba Impostos</h2>
            </div>

            <Alert className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-700">
                    <strong>Importante:</strong> Sempre consulte um contador para confirmar
                    as alíquotas específicas da sua região e regime tributário.
                </AlertDescription>
            </Alert>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Impostos Federais</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between items-center">
                            <div>
                                <h4 className="font-medium">PIS</h4>
                                <p className="text-xs text-gray-600">Programa de Integração Social</p>
                            </div>
                            <Badge variant="outline">0,65% ou 1,65%</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                            <div>
                                <h4 className="font-medium">COFINS</h4>
                                <p className="text-xs text-gray-600">Contribuição para Financiamento da Seguridade Social</p>
                            </div>
                            <Badge variant="outline">3% ou 7,6%</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                            <div>
                                <h4 className="font-medium">IR</h4>
                                <p className="text-xs text-gray-600">Imposto de Renda</p>
                            </div>
                            <Badge variant="outline">1,2% a 4,8%</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                            <div>
                                <h4 className="font-medium">CSLL</h4>
                                <p className="text-xs text-gray-600">Contribuição Social sobre Lucro Líquido</p>
                            </div>
                            <Badge variant="outline">1,08% a 2,88%</Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Impostos Municipais</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between items-center">
                            <div>
                                <h4 className="font-medium">ISS</h4>
                                <p className="text-xs text-gray-600">Imposto Sobre Serviços</p>
                            </div>
                            <Badge variant="outline">2% a 5%</Badge>
                        </div>
                        <div className="bg-yellow-50 p-3 rounded-md">
                            <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                <strong>Atenção:</strong> A alíquota de ISS varia por município.
                                Consulte a prefeitura local para a alíquota correta.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Regimes Tributários</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="border rounded-lg p-3">
                            <h4 className="font-medium mb-2">Simples Nacional</h4>
                            <p className="text-sm text-gray-600 mb-2">
                                Alíquota única que varia de 6% a 33% conforme faturamento
                            </p>
                            <Badge variant="secondary">Mais simples</Badge>
                        </div>
                        <div className="border rounded-lg p-3">
                            <h4 className="font-medium mb-2">Lucro Presumido</h4>
                            <p className="text-sm text-gray-600 mb-2">
                                Presume lucro de 32% para serviços e aplica impostos sobre este valor
                            </p>
                            <Badge variant="secondary">Intermediário</Badge>
                        </div>
                        <div className="border rounded-lg p-3">
                            <h4 className="font-medium mb-2">Lucro Real</h4>
                            <p className="text-sm text-gray-600 mb-2">
                                Impostos calculados sobre o lucro real da empresa
                            </p>
                            <Badge variant="secondary">Mais complexo</Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export function BudgetTabGuide() {
    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-3">
                <DollarSign className="text-orange-500" size={24} />
                <h2 className="text-xl font-semibold">Guia da Aba Orçamento</h2>
            </div>

            <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                    Aqui você visualiza o orçamento consolidado e pode ajustar margens de lucro.
                    Todos os custos das abas anteriores são automaticamente calculados.
                </AlertDescription>
            </Alert>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Componentes do Orçamento</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span>Custos de Pessoal</span>
                            <Badge variant="outline">40-60%</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>Custos Operacionais</span>
                            <Badge variant="outline">15-25%</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>Impostos</span>
                            <Badge variant="outline">10-20%</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>Margem de Lucro</span>
                            <Badge variant="outline">15-30%</Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Margens Recomendadas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-medium">Conservadora</span>
                                <Badge variant="secondary">15% - 20%</Badge>
                            </div>
                            <p className="text-xs text-gray-600">Para projetos de baixo risco</p>
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-medium">Moderada</span>
                                <Badge variant="secondary">20% - 30%</Badge>
                            </div>
                            <p className="text-xs text-gray-600">Para projetos de risco médio</p>
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-medium">Agressiva</span>
                                <Badge variant="secondary">30% - 40%</Badge>
                            </div>
                            <p className="text-xs text-gray-600">Para projetos de alto valor/risco</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center space-x-2 text-green-800 dark:text-green-200">
                        <CheckCircle size={18} />
                        <span>Checklist de Validação</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm text-green-700">Todos os custos foram incluídos?</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm text-green-700">A margem está adequada ao risco?</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm text-green-700">O preço final é competitivo?</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm text-green-700">Comparou com projetos similares?</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export function ResultTabGuide() {
    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-3">
                <BarChart3 className="text-indigo-500" size={24} />
                <h2 className="text-xl font-semibold">Guia da Aba Resultado</h2>
            </div>

            <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                    Analise a viabilidade financeira do projeto através de indicadores
                    como ROI, payback e margens. Use estes dados para tomar decisões estratégicas.
                </AlertDescription>
            </Alert>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Indicadores Principais</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div>
                            <h4 className="font-medium">ROI (Return on Investment)</h4>
                            <p className="text-sm text-gray-600">
                                Retorno sobre investimento. Indica o percentual de retorno esperado.
                            </p>
                            <Badge variant="outline" className="mt-1">Meta: {'>'} 15%</Badge>
                        </div>
                        <div>
                            <h4 className="font-medium">Payback</h4>
                            <p className="text-sm text-gray-600">
                                Tempo necessário para recuperar o investimento inicial.
                            </p>
                            <Badge variant="outline" className="mt-1">Meta: {'<'} 24 meses</Badge>
                        </div>
                        <div>
                            <h4 className="font-medium">Margem Líquida</h4>
                            <p className="text-sm text-gray-600">
                                Percentual de lucro após todos os custos e impostos.
                            </p>
                            <Badge variant="outline" className="mt-1">Meta: {'>'} 10%</Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Interpretação dos Resultados</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="bg-green-50 p-3 rounded-md">
                            <h5 className="font-medium text-green-800 mb-1">✅ Projeto Viável</h5>
                            <p className="text-sm text-green-700">
                                ROI {'>'} 15% e Payback {'<'} 24 meses
                            </p>
                        </div>
                        <div className="bg-yellow-50 p-3 rounded-md">
                            <h5 className="font-medium text-yellow-800 mb-1">⚠️ Projeto Marginal</h5>
                            <p className="text-sm text-yellow-700">
                                ROI entre 10-15% ou Payback entre 24-36 meses
                            </p>
                        </div>
                        <div className="bg-red-50 p-3 rounded-md">
                            <h5 className="font-medium text-red-800 mb-1">❌ Projeto Inviável</h5>
                            <p className="text-sm text-red-700">
                                ROI {'<'} 10% ou Payback {'>'} 36 meses
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Análise de Cenários</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                        Sempre analise diferentes cenários para entender os riscos:
                    </p>
                    <div className="grid gap-3 md:grid-cols-3">
                        <div className="border rounded-lg p-3">
                            <h4 className="font-medium text-green-700 mb-2">Cenário Otimista</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Custos 10% menores</li>
                                <li>• Receitas 10% maiores</li>
                                <li>• Sem imprevistos</li>
                            </ul>
                        </div>
                        <div className="border rounded-lg p-3">
                            <h4 className="font-medium text-blue-700 mb-2">Cenário Realista</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Custos conforme planejado</li>
                                <li>• Receitas conforme contrato</li>
                                <li>• Alguns imprevistos</li>
                            </ul>
                        </div>
                        <div className="border rounded-lg p-3">
                            <h4 className="font-medium text-red-700 mb-2">Cenário Pessimista</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Custos 15% maiores</li>
                                <li>• Receitas 5% menores</li>
                                <li>• Vários imprevistos</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export function ForecastTabGuide() {
    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-3">
                <TrendingUp className="text-purple-500" size={24} />
                <h2 className="text-xl font-semibold">Guia da Aba Forecast</h2>
            </div>

            <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                    Sistema avançado de projeções financeiras e análise de cenários.
                    Use para planejamento estratégico e gestão de riscos do projeto.
                </AlertDescription>
            </Alert>

            <div className="grid gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center space-x-2">
                            <BarChart3 className="text-blue-500" size={18} />
                            <span>Dashboard Executivo</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h4 className="font-medium mb-2">KPIs Principais</h4>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="flex justify-between">
                                    <span>Receita Total Projetada</span>
                                    <Badge variant="outline">Soma 12-36 meses</Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span>Margem Média</span>
                                    <Badge variant="outline">Meta: {'>'} 20%</Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span>ROI Projetado</span>
                                    <Badge variant="outline">Retorno esperado</Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span>Payback Period</span>
                                    <Badge variant="outline">Tempo recuperação</Badge>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-medium mb-2">Gráficos Interativos</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Barras azuis: Receita projetada mensal</li>
                                <li>• Barras verdes: Lucro esperado mensal</li>
                                <li>• Linha temporal: Evolução de 12-36 meses</li>
                                <li>• Múltiplos cenários: Comparação simultânea</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                        <CardHeader>
                            <CardTitle className="text-lg text-green-800 dark:text-green-200">🚀 Cenário Otimista</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Crescimento:</span>
                                <Badge variant="secondary">20%/ano</Badge>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Inflação:</span>
                                <Badge variant="secondary">5%/ano</Badge>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Eficiência:</span>
                                <Badge variant="secondary">+10%/ano</Badge>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Probabilidade:</span>
                                <Badge variant="outline">25%</Badge>
                            </div>
                            <p className="text-xs text-green-600 mt-2">Mercado favorável, expansão acelerada</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                        <CardHeader>
                            <CardTitle className="text-lg text-blue-800 dark:text-blue-200">📊 Cenário Realista</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Crescimento:</span>
                                <Badge variant="secondary">12%/ano</Badge>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Inflação:</span>
                                <Badge variant="secondary">8%/ano</Badge>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Eficiência:</span>
                                <Badge variant="secondary">+5%/ano</Badge>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Probabilidade:</span>
                                <Badge variant="outline">50%</Badge>
                            </div>
                            <p className="text-xs text-blue-600 mt-2">Cenário mais provável (baseline)</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
                        <CardHeader>
                            <CardTitle className="text-lg text-red-800 dark:text-red-200">⚠️ Cenário Pessimista</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Crescimento:</span>
                                <Badge variant="secondary">5%/ano</Badge>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Inflação:</span>
                                <Badge variant="secondary">12%/ano</Badge>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Eficiência:</span>
                                <Badge variant="secondary">+2%/ano</Badge>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Probabilidade:</span>
                                <Badge variant="outline">25%</Badge>
                            </div>
                            <p className="text-xs text-red-600 mt-2">Cenário conservador, contingência</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center space-x-2">
                            <AlertTriangle className="text-orange-500" size={18} />
                            <span>Gestão de Riscos</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h4 className="font-medium mb-2">Matriz de Riscos</h4>
                            <div className="grid grid-cols-4 gap-1 text-xs text-center mb-3 max-w-md">
                                <div></div>
                                <div className="font-medium">Baixo</div>
                                <div className="font-medium">Médio</div>
                                <div className="font-medium">Alto</div>
                                <div className="font-medium">Alta</div>
                                <div className="bg-yellow-100 p-1 rounded">Médio</div>
                                <div className="bg-red-100 p-1 rounded">Alto</div>
                                <div className="bg-red-200 p-1 rounded">Crítico</div>
                                <div className="font-medium">Média</div>
                                <div className="bg-green-100 p-1 rounded">Baixo</div>
                                <div className="bg-yellow-100 p-1 rounded">Médio</div>
                                <div className="bg-red-100 p-1 rounded">Alto</div>
                                <div className="font-medium">Baixa</div>
                                <div className="bg-green-100 p-1 rounded">Baixo</div>
                                <div className="bg-green-100 p-1 rounded">Baixo</div>
                                <div className="bg-yellow-100 p-1 rounded">Médio</div>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-medium mb-2">Alertas Automáticos</h4>
                            <div className="space-y-2">
                                <div className="flex items-center space-x-3 p-2 border-l-4 border-red-500 bg-red-50 rounded">
                                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                    <div className="text-sm">
                                        <span className="font-medium text-red-800 dark:text-red-200">Margem Crítica:</span>
                                        <span className="text-red-600 ml-1">{'<'} 15% - Risco financeiro alto</span>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3 p-2 border-l-4 border-yellow-500 bg-yellow-50 rounded">
                                    <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                                    <div className="text-sm">
                                        <span className="font-medium text-yellow-800 dark:text-yellow-200">Crescimento de Custos:</span>
                                        <span className="text-yellow-600 ml-1">{'>'} 30% - Risco operacional</span>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3 p-2 border-l-4 border-orange-500 bg-orange-50 rounded">
                                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                                    <div className="text-sm">
                                        <span className="font-medium text-orange-800">Dependência Cliente:</span>
                                        <span className="text-orange-600 ml-1">{'>'} 80% receita - Risco mercado</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-medium mb-2">Análise de Sensibilidade</h4>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                                    <span className="font-medium">Crescimento de Receita</span>
                                    <Badge variant="destructive">Alta Sensibilidade (±15%)</Badge>
                                </div>
                                <div className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                                    <span className="font-medium">Inflação de Custos</span>
                                    <Badge variant="secondary">Média Sensibilidade (±8%)</Badge>
                                </div>
                                <div className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                                    <span className="font-medium">Eficiência Operacional</span>
                                    <Badge variant="outline">Baixa Sensibilidade (±3%)</Badge>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-purple-200 bg-purple-50">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center space-x-2 text-purple-800">
                            <Lightbulb size={18} />
                            <span>Insights e Recomendações</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="border rounded-lg p-3 bg-blue-50">
                            <h5 className="font-medium text-blue-900 mb-1">💰 Oportunidade de Expansão</h5>
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                                <strong>Condição:</strong> Margem {'>'} 25%<br />
                                <strong>Ação:</strong> Expandir equipe em 25% no Q2<br />
                                <strong>Impacto:</strong> +R$ 2.1M receita anual
                            </p>
                        </div>

                        <div className="border rounded-lg p-3 bg-green-50">
                            <h5 className="font-medium text-green-900 mb-1">⚡ Otimização de Custos</h5>
                            <p className="text-sm text-green-800 dark:text-green-200">
                                <strong>Condição:</strong> Margem {'<'} 20%<br />
                                <strong>Ação:</strong> Implementar automação<br />
                                <strong>Impacto:</strong> 8% redução custos operacionais
                            </p>
                        </div>

                        <div className="border rounded-lg p-3 bg-purple-50">
                            <h5 className="font-medium text-purple-900 mb-1">🛡️ Mitigação de Riscos</h5>
                            <p className="text-sm text-purple-800">
                                <strong>Condição:</strong> Dependência alta cliente único<br />
                                <strong>Ação:</strong> Diversificar base clientes<br />
                                <strong>Impacto:</strong> 50% redução risco concentração
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-indigo-200 bg-indigo-50">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center space-x-2 text-indigo-800">
                            <CheckCircle size={18} />
                            <span>Melhores Práticas</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex items-start space-x-2">
                            <Badge variant="outline" className="text-xs mt-0.5">1</Badge>
                            <p className="text-sm text-indigo-700">Compare sempre múltiplos cenários para análise de risco</p>
                        </div>
                        <div className="flex items-start space-x-2">
                            <Badge variant="outline" className="text-xs mt-0.5">2</Badge>
                            <p className="text-sm text-indigo-700">Revise premissas mensalmente com dados reais</p>
                        </div>
                        <div className="flex items-start space-x-2">
                            <Badge variant="outline" className="text-xs mt-0.5">3</Badge>
                            <p className="text-sm text-indigo-700">Configure alertas automáticos para monitoramento</p>
                        </div>
                        <div className="flex items-start space-x-2">
                            <Badge variant="outline" className="text-xs mt-0.5">4</Badge>
                            <p className="text-sm text-indigo-700">Use insights para criar planos de ação específicos</p>
                        </div>
                        <div className="flex items-start space-x-2">
                            <Badge variant="outline" className="text-xs mt-0.5">5</Badge>
                            <p className="text-sm text-indigo-700">Documente justificativas para ajustes de cenários</p>
                        </div>
                        <div className="flex items-start space-x-2">
                            <Badge variant="outline" className="text-xs mt-0.5">6</Badge>
                            <p className="text-sm text-indigo-700">Monitore elasticidade das variáveis para estratégias</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}