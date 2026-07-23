'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Calculator, Printer, Package, Percent, Info, Server, Save } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useConfigurationStore } from '@/lib/stores/configuration-store';

interface Suprimento {
  id: string;
  printerId: string;
  tipo: 'Toner P&B' | 'Toner Ciano' | 'Toner Magenta' | 'Toner Amarelo' | 'Cilindro' | 'Fusor' | 'Kit Manutenção';
  descricao: string;
  rendimento: number; // páginas
  custo: number; // R$
}

interface ImpressoraManual {
  id: string;
  modelo: string;
  marca: string;
  tipo: 'Laser P&B' | 'Laser Colorida';
  quantidade: number;
  velocidadePPM: number;
  custoAquisicao: number;
  vidaUtil: number; // páginas
  consumoEnergia: number; // kWh/mês
  custoManutencaoMensal: number;
  valorLocacaoMensal: number;
}

interface InfraestruturaItem {
  id: string;
  tipo: 'Servidor' | 'Licença' | 'Implantação' | 'Treinamento' | 'Software' | 'Serviço' | 'Outro';
  descricao: string;
  quantidade: number;
  custo: number;
  recorrencia: 'mensal' | 'unico';
}

interface ManualCalculationModalProps {
  onClose: () => void;
  onSave: (data: any, options?: { salvarEmOrcamentos?: boolean }) => void;
}

export function ManualCalculationModal({ onClose, onSave }: ManualCalculationModalProps) {
  const { taxRegimes, outsourcingConfig } = useConfigurationStore();
  const TAXA_FINANCEIRA_MENSAL = outsourcingConfig.taxaFinanceiraMensal / 100;

  const [showModalidadeSelection, setShowModalidadeSelection] = useState(true);
  const [activeTab, setActiveTab] = useState('impressora');
  
  // Dados da impressora
  const [modelo, setModelo] = useState('');
  const [marca, setMarca] = useState('');
  const [tipo, setTipo] = useState<'Laser P&B' | 'Laser Colorida'>('Laser P&B');
  const [velocidadePPM, setVelocidadePPM] = useState(0);
  const [custoAquisicao, setCustoAquisicao] = useState(0);
  const [vidaUtil, setVidaUtil] = useState(100000);
  const [consumoEnergia, setConsumoEnergia] = useState(15);
  const [custoManutencao, setCustoManutencao] = useState(50);
  
  // Suprimentos
  const [suprimentos, setSuprimentos] = useState<Suprimento[]>([]);
  const [novoSuprimento, setNovoSuprimento] = useState<Partial<Suprimento>>({
    tipo: 'Toner P&B',
    descricao: '',
    rendimento: 0,
    custo: 0
  });

  // Volume para cálculo
  const [volumeMensal, setVolumeMensal] = useState(0);
  const [prazoContrato, setPrazoContrato] = useState(36);
  const [custoEnergiaKWh, setCustoEnergiaKWh] = useState(0.85);
  
  // Modalidade de locação
  const [modalidadeLocacao, setModalidadeLocacao] = useState<'franquia' | 'por-pagina'>('por-pagina');
  const [valorLocacaoImpressora, setValorLocacaoImpressora] = useState(0);
  const [franquiaMensal, setFranquiaMensal] = useState(0);
  const [valorFranquia, setValorFranquia] = useState(0);
  const [quantidadeImpressora, setQuantidadeImpressora] = useState(1);
  const [impressoras, setImpressoras] = useState<ImpressoraManual[]>([]);
  const [selectedPrinterIdForSupply, setSelectedPrinterIdForSupply] = useState('');
  const [infraestrutura, setInfraestrutura] = useState<InfraestruturaItem[]>([]);
  const [novoInfraItem, setNovoInfraItem] = useState<Partial<InfraestruturaItem>>({
    tipo: 'Servidor',
    descricao: '',
    quantidade: 1,
    custo: 0,
    recorrencia: 'mensal'
  });
  const [infraestruturaModo, setInfraestruturaModo] = useState<'rateada-locacao' | 'mensal-separado'>('rateada-locacao');

  // Regime Tributário (do store centralizado)
  const [regimeTributarioId, setRegimeTributarioId] = useState<string>(outsourcingConfig.taxRegimeId || '');
  const regimeSelecionado = useMemo(() =>
    taxRegimes.find(r => r.id === regimeTributarioId || (regimeTributarioId === '' && r.active)),
    [taxRegimes, regimeTributarioId]
  );

  const calcularAliquotaImpostos = () => {
    let aliquotaImpostos = 0;
    if (regimeSelecionado) {
      if (regimeSelecionado.type === 'iva') {
        aliquotaImpostos = regimeSelecionado.ivaTotal;
      } else if (regimeSelecionado.type === 'simples') {
        aliquotaImpostos = regimeSelecionado.anexoI;
      } else {
        aliquotaImpostos = (regimeSelecionado.icms || 0) + (regimeSelecionado.pis || 0) + (regimeSelecionado.cofins || 0) + 1.2;
      }
    }

    return aliquotaImpostos / 100;
  };

  const calcularDivisorLocacao = () => {
    const aliquotaImpostosRate = calcularAliquotaImpostos();
    const comissaoRate = outsourcingConfig.comissaoVenda / 100;
    const operacionalRate = outsourcingConfig.custosOperacionais / 100;
    const margemRate = outsourcingConfig.margemPadrao / 100;
    const composicaoComercialRate = comissaoRate + operacionalRate + margemRate;

    return 1 - aliquotaImpostosRate - composicaoComercialRate;
  };

  const mensalizarCustoComMarkup = (custoTotal: number) => {
    if (custoTotal <= 0 || prazoContrato <= 0) return 0;

    // PMT: valor mensal da locação baseado no custo de aquisição
    const pmtBase = TAXA_FINANCEIRA_MENSAL > 0
      ? (custoTotal * TAXA_FINANCEIRA_MENSAL) / (1 - Math.pow(1 + TAXA_FINANCEIRA_MENSAL, -prazoContrato))
      : (custoTotal / prazoContrato);

    // Aplicar mark-up divisor (impostos + comissão + operacional + margem)
    const divisorLocacao = calcularDivisorLocacao();
    return divisorLocacao > 0 ? (pmtBase / divisorLocacao) : pmtBase;
  };

  // Cálculo automático do Valor de Locação da Impressora
  const calcularValorLocacao = () => mensalizarCustoComMarkup(custoAquisicao);

  // Recalcular locação quando parâmetros mudarem
  useEffect(() => {
    if (modalidadeLocacao === 'por-pagina' && custoAquisicao > 0) {
      const valorCalculado = calcularValorLocacao();
      if (valorLocacaoImpressora === 0 || Math.abs(valorLocacaoImpressora - valorCalculado) > 0.01) {
        setValorLocacaoImpressora(Number(valorCalculado.toFixed(2)));
      }
    }
  }, [custoAquisicao, prazoContrato, regimeTributarioId, modalidadeLocacao]);

  const selecionarModalidadeLocacao = (modalidade: 'franquia' | 'por-pagina') => {
    setModalidadeLocacao(modalidade);
    if (modalidade === 'por-pagina') {
      setVolumeMensal(0);
      setFranquiaMensal(0);
      setValorFranquia(0);
    }
  };

  const resetDadosImpressora = () => {
    setModelo('');
    setMarca('');
    setTipo('Laser P&B');
    setQuantidadeImpressora(1);
    setVelocidadePPM(0);
    setCustoAquisicao(0);
    setVidaUtil(100000);
    setConsumoEnergia(15);
    setCustoManutencao(50);
    setValorLocacaoImpressora(0);
  };

  const adicionarImpressora = () => {
    if (!modelo || !marca) {
      alert('Preencha modelo e marca da impressora');
      return;
    }

    if (modalidadeLocacao === 'por-pagina' && valorLocacaoImpressora <= 0) {
      alert('Preencha o valor da locação mensal desta impressora');
      return;
    }

    const novaImpressora: ImpressoraManual = {
      id: Date.now().toString(),
      modelo,
      marca,
      tipo,
      quantidade: Math.max(1, quantidadeImpressora || 1),
      velocidadePPM,
      custoAquisicao,
      vidaUtil,
      consumoEnergia,
      custoManutencaoMensal: custoManutencao,
      valorLocacaoMensal: modalidadeLocacao === 'por-pagina' ? valorLocacaoImpressora : 0
    };

    setImpressoras(prev => [...prev, novaImpressora]);
    setSelectedPrinterIdForSupply(novaImpressora.id);
    resetDadosImpressora();
  };

  const removerImpressora = (id: string) => {
    setImpressoras(prev => prev.filter(printer => printer.id !== id));
    setSuprimentos(prev => prev.filter(sup => sup.printerId !== id));
    if (selectedPrinterIdForSupply === id) {
      setSelectedPrinterIdForSupply('');
    }
  };

  const adicionarSuprimento = () => {
    if (!novoSuprimento.descricao || !novoSuprimento.rendimento || !novoSuprimento.custo) {
      alert('Preencha todos os campos do suprimento');
      return;
    }

    const printerId = selectedPrinterIdForSupply || impressoras[0]?.id;
    if (!printerId) {
      alert('Adicione uma impressora antes de cadastrar suprimentos');
      return;
    }

    const suprimento: Suprimento = {
      id: Date.now().toString(),
      printerId,
      tipo: novoSuprimento.tipo as any,
      descricao: novoSuprimento.descricao,
      rendimento: novoSuprimento.rendimento,
      custo: novoSuprimento.custo
    };

    setSuprimentos([...suprimentos, suprimento]);
    setNovoSuprimento({
      tipo: 'Toner P&B',
      descricao: '',
      rendimento: 0,
      custo: 0
    });
  };

  const removerSuprimento = (id: string) => {
    setSuprimentos(suprimentos.filter(s => s.id !== id));
  };

  const adicionarInfraestrutura = () => {
    if (!novoInfraItem.descricao || !novoInfraItem.custo) {
      alert('Preencha descrição e custo do item de infraestrutura');
      return;
    }

    const item: InfraestruturaItem = {
      id: Date.now().toString(),
      tipo: (novoInfraItem.tipo || 'Outro') as InfraestruturaItem['tipo'],
      descricao: novoInfraItem.descricao,
      quantidade: Math.max(1, Number(novoInfraItem.quantidade || 1)),
      custo: Number(novoInfraItem.custo || 0),
      recorrencia: (novoInfraItem.recorrencia || 'mensal') as InfraestruturaItem['recorrencia']
    };

    setInfraestrutura(prev => [...prev, item]);
    setNovoInfraItem({
      tipo: 'Servidor',
      descricao: '',
      quantidade: 1,
      custo: 0,
      recorrencia: 'mensal'
    });
  };

  const removerInfraestrutura = (id: string) => {
    setInfraestrutura(prev => prev.filter(item => item.id !== id));
  };

  const preencherDadosTeste = (modalidadeTeste: 'franquia' | 'por-pagina' = 'por-pagina') => {
    const temDadosPreenchidos = impressoras.length > 0 || suprimentos.length > 0 || infraestrutura.length > 0 || hasDraftPrinter;
    if (temDadosPreenchidos && !window.confirm('Substituir os dados atuais por um cenário de teste?')) {
      return;
    }

    const idBase = Date.now();
    const monoId = `teste-mono-${idBase}`;
    const colorId = `teste-color-${idBase}`;

    const impressorasTeste: ImpressoraManual[] = [
      {
        id: monoId,
        modelo: 'LaserJet Pro M404dn',
        marca: 'HP',
        tipo: 'Laser P&B',
        quantidade: 6,
        velocidadePPM: 38,
        custoAquisicao: 3400,
        vidaUtil: 100000,
        consumoEnergia: 15,
        custoManutencaoMensal: 50,
        valorLocacaoMensal: 282.55
      },
      {
        id: colorId,
        modelo: 'Color LaserJet M454dw',
        marca: 'HP',
        tipo: 'Laser Colorida',
        quantidade: 2,
        velocidadePPM: 28,
        custoAquisicao: 6200,
        vidaUtil: 90000,
        consumoEnergia: 22,
        custoManutencaoMensal: 85,
        valorLocacaoMensal: 520.90
      }
    ];

    const suprimentosTeste: Suprimento[] = [
      { id: `sup-${idBase}-1`, printerId: monoId, tipo: 'Toner P&B', descricao: 'Toner CF258X', rendimento: 10000, custo: 420 },
      { id: `sup-${idBase}-2`, printerId: monoId, tipo: 'Cilindro', descricao: 'Cilindro CF258A', rendimento: 23000, custo: 310 },
      { id: `sup-${idBase}-3`, printerId: colorId, tipo: 'Toner P&B', descricao: 'Toner W2030X Preto', rendimento: 7500, custo: 520 },
      { id: `sup-${idBase}-4`, printerId: colorId, tipo: 'Toner Ciano', descricao: 'Toner W2031X Ciano', rendimento: 6000, custo: 640 },
      { id: `sup-${idBase}-5`, printerId: colorId, tipo: 'Toner Magenta', descricao: 'Toner W2033X Magenta', rendimento: 6000, custo: 640 },
      { id: `sup-${idBase}-6`, printerId: colorId, tipo: 'Toner Amarelo', descricao: 'Toner W2032X Amarelo', rendimento: 6000, custo: 640 },
      { id: `sup-${idBase}-7`, printerId: colorId, tipo: 'Cilindro', descricao: 'Kit imagem colorido', rendimento: 30000, custo: 980 }
    ];

    const infraestruturaTeste: InfraestruturaItem[] = [
      { id: `infra-${idBase}-1`, tipo: 'Servidor', descricao: 'Servidor de bilhetagem', quantidade: 1, custo: 15000, recorrencia: 'mensal' },
      { id: `infra-${idBase}-2`, tipo: 'Licença', descricao: 'Licenças de bilhetagem e gestão', quantidade: 8, custo: 450, recorrencia: 'mensal' },
      { id: `infra-${idBase}-3`, tipo: 'Implantação', descricao: 'Implantação, configuração e testes', quantidade: 1, custo: 3500, recorrencia: 'unico' },
      { id: `infra-${idBase}-4`, tipo: 'Treinamento', descricao: 'Treinamento dos usuários-chave', quantidade: 1, custo: 1800, recorrencia: 'unico' }
    ];

    setShowModalidadeSelection(false);
    setModalidadeLocacao(modalidadeTeste);
    setPrazoContrato(36);
    setVolumeMensal(modalidadeTeste === 'franquia' ? 12000 : 18000);
    setCustoEnergiaKWh(0.85);
    setFranquiaMensal(modalidadeTeste === 'franquia' ? 12000 : 0);
    setValorFranquia(modalidadeTeste === 'franquia' ? 4900 : 0);
    setInfraestruturaModo('mensal-separado');
    setImpressoras(impressorasTeste);
    setSuprimentos(suprimentosTeste);
    setInfraestrutura(infraestruturaTeste);
    setSelectedPrinterIdForSupply(monoId);
    setNovoSuprimento({ tipo: 'Toner P&B', descricao: '', rendimento: 0, custo: 0 });
    setNovoInfraItem({ tipo: 'Servidor', descricao: '', quantidade: 1, custo: 0, recorrencia: 'mensal' });
    resetDadosImpressora();
    setActiveTab('resultado');
  };

  const calcularCustoPorPagina = () => {
    const totalImpressoras = impressoras.reduce((total, printer) => total + printer.quantidade, 0);
    const impressorasColoridas = impressoras.filter(printer => printer.tipo === 'Laser Colorida');
    const totalImpressorasColoridas = impressorasColoridas.reduce((total, printer) => total + printer.quantidade, 0);
    const isColorida = impressorasColoridas.length > 0;

    // 1. Custo de Suprimentos por página
    let custoSuprimentosMono = 0;
    let custoSuprimentosColor = 0;
    const detalhesSuprimentos: any = {};

    impressoras.forEach(printer => {
      const suprimentosDaImpressora = suprimentos.filter(sup => sup.printerId === printer.id);
      let monoDaImpressora = 0;
      let colorDaImpressora = 0;

      suprimentosDaImpressora.forEach(sup => {
        const custoPorPagina = sup.rendimento > 0 ? sup.custo / sup.rendimento : 0;

        if (sup.tipo === 'Toner P&B' || sup.tipo === 'Cilindro' || sup.tipo === 'Fusor' || sup.tipo === 'Kit Manutenção') {
          monoDaImpressora += custoPorPagina;
        } else {
          colorDaImpressora += custoPorPagina;
        }

        detalhesSuprimentos[sup.id] = {
          impressora: `${printer.marca} ${printer.modelo}`,
          tipo: sup.tipo,
          custo: sup.custo,
          rendimento: sup.rendimento,
          custoPorPagina
        };
      });

      custoSuprimentosMono += monoDaImpressora * printer.quantidade;
      if (printer.tipo === 'Laser Colorida') {
        custoSuprimentosColor += (monoDaImpressora + colorDaImpressora) * printer.quantidade;
      }
    });

    custoSuprimentosMono = totalImpressoras > 0 ? custoSuprimentosMono / totalImpressoras : 0;
    custoSuprimentosColor = totalImpressorasColoridas > 0 ? custoSuprimentosColor / totalImpressorasColoridas : 0;

    const custoInfraTotalInvestimento = infraestrutura.reduce(
      (total, item) => total + (item.custo * item.quantidade),
      0
    );
    const custoInfraMensal = mensalizarCustoComMarkup(custoInfraTotalInvestimento);
    const valorLocacaoTotalImpressoras = impressoras.reduce(
      (total, printer) => total + (printer.valorLocacaoMensal * printer.quantidade),
      0
    );
    const infraestruturaRateadaNaLocacao = infraestruturaModo === 'rateada-locacao' ? custoInfraMensal : 0;
    const infraestruturaMensalSeparada = infraestruturaModo === 'mensal-separado' ? custoInfraMensal : 0;
    const valorLocacaoComRateioInfra = valorLocacaoTotalImpressoras + infraestruturaRateadaNaLocacao;

    // 2. Custo de Depreciação por página (apenas para franquia)
    const custoDepreciacaoMensal = modalidadeLocacao === 'franquia'
      ? impressoras.reduce((total, printer) => {
        const vidaUtil = printer.vidaUtil > 0 ? printer.vidaUtil : 1;
        return total + ((printer.custoAquisicao / vidaUtil) * printer.quantidade);
      }, 0)
      : 0;
    const custoDepreciacaoPorPagina = modalidadeLocacao === 'franquia' ? custoDepreciacaoMensal : 0;

    // 3. Custo de Energia por página (apenas para franquia)
    const custoEnergiaMensal = impressoras.reduce(
      (total, printer) => total + (printer.consumoEnergia * custoEnergiaKWh * printer.quantidade),
      0
    );
    const custoEnergiaPorPagina = modalidadeLocacao === 'franquia' && volumeMensal > 0 
      ? custoEnergiaMensal / volumeMensal 
      : 0;

    // 4. Custo de Manutenção por página (apenas para franquia)
    const custoManutencaoMensal = impressoras.reduce(
      (total, printer) => total + (printer.custoManutencaoMensal * printer.quantidade),
      0
    );
    const custoManutencaoPorPagina = modalidadeLocacao === 'franquia' && volumeMensal > 0
      ? custoManutencaoMensal / volumeMensal
      : 0;

    // 5. Custos fixos por página (infraestrutura não entra no custo por página)
    const custosFixosPorPagina = custoDepreciacaoPorPagina + custoEnergiaPorPagina + custoManutencaoPorPagina;

    // 6. Custo Total por Página
    let custoTotalMono = 0;
    let custoTotalColor = 0;
    let custoTotalPorPagina = 0;

    if (modalidadeLocacao === 'por-pagina') {
      // Modalidade por página: custo por página = suprimentos. Infraestrutura entra no custo fixo mensal.
      if (isColorida) {
        custoTotalMono = custoSuprimentosMono;
        custoTotalColor = custoSuprimentosColor;
        custoTotalPorPagina = custoTotalColor;
      } else {
        custoTotalMono = custoSuprimentosMono;
        custoTotalPorPagina = custoTotalMono;
      }
    } else {
      // Modalidade franquia: custo por página = suprimentos + custos fixos
      if (isColorida) {
        custoTotalMono = custoSuprimentosMono + custosFixosPorPagina;
        custoTotalColor = custoSuprimentosColor + custosFixosPorPagina;
        custoTotalPorPagina = custoTotalColor;
      } else {
        custoTotalMono = custoSuprimentosMono + custosFixosPorPagina;
        custoTotalPorPagina = custoTotalMono;
      }
    }
    const valorPaginaExcedenteMono = modalidadeLocacao === 'franquia' ? custoSuprimentosMono : 0;
    const valorPaginaExcedenteColor = modalidadeLocacao === 'franquia' && isColorida ? custoSuprimentosColor : 0;

    // 7. Custos Mensais e Anuais
    let custoMensal = 0;
    let custoAnual = 0;
    let custoTotalContrato = 0;

    let custoVariavelMensal = 0;

    if (modalidadeLocacao === 'franquia') {
      // Franquia: valor fixo mensal
      custoMensal = valorFranquia;
      custoAnual = custoMensal * 12;
      custoTotalContrato = custoMensal * prazoContrato;
    } else {
      // Por página: locação fixa + custo variável somente quando houver volume informado
      custoVariavelMensal = volumeMensal > 0 ? custoTotalPorPagina * volumeMensal : 0;
      custoMensal = valorLocacaoComRateioInfra + infraestruturaMensalSeparada + custoVariavelMensal;
      custoAnual = custoMensal * 12;
      custoTotalContrato = custoMensal * prazoContrato;
    }

    return {
      total: custoTotalPorPagina,
      totalMono: custoTotalMono,
      totalColor: isColorida ? custoTotalColor : 0,
      isColorida,
      modalidade: modalidadeLocacao,
      valorLocacaoImpressora: valorLocacaoComRateioInfra,
      valorLocacaoBaseImpressoras: valorLocacaoTotalImpressoras,
      franquiaMensal,
      valorFranquia,
      valorPaginaExcedenteMono,
      valorPaginaExcedenteColor,
      totalImpressoras,
      infraestruturaModo,
      infraestruturaMensal: custoInfraMensal,
      infraestruturaRateadaNaLocacao,
      infraestruturaMensalSeparada,
      infraestruturaUnica: custoInfraTotalInvestimento,
      infraestruturaTotalInvestimento: custoInfraTotalInvestimento,
      infraestruturaMensalRecorrente: 0,
      infraestruturaMensalAmortizada: custoInfraMensal,
      detalhes: {
        suprimentosMono: custoSuprimentosMono,
        suprimentosColor: custoSuprimentosColor,
        depreciacao: custoDepreciacaoPorPagina,
        energia: custoEnergiaPorPagina,
        manutencao: custoManutencaoPorPagina,
        infraestrutura: 0,
        detalhesSuprimentos
      },
      custoMensal,
      custoAnual,
      custoTotalContrato,
      custoVariavelMensal
    };
  };

  const handleSalvar = (salvarEmOrcamentos = false) => {
    // Validação básica
    if (impressoras.length === 0) {
      alert('Adicione pelo menos uma impressora');
      return;
    }

    const impressorasSemSuprimento = impressoras.filter(
      printer => !suprimentos.some(sup => sup.printerId === printer.id)
    );
    if (impressorasSemSuprimento.length > 0) {
      alert('Cada impressora adicionada precisa ter pelo menos um suprimento vinculado');
      return;
    }

    // Validação específica para modalidade franquia
    if (modalidadeLocacao === 'franquia') {
      if (volumeMensal === 0) {
        alert('Preencha o volume mensal estimado para calcular os custos da franquia.');
        return;
      }

      if (valorFranquia === 0) {
        alert('Preencha o valor da franquia mensal');
        return;
      }
    }

    // Validação específica para modalidade por página
    if (modalidadeLocacao === 'por-pagina' && impressoras.some(printer => printer.valorLocacaoMensal <= 0)) {
      alert('Preencha o valor da locação de todas as impressoras');
      return;
    }

    const calculo = calcularCustoPorPagina();

    const dados = {
      impressora: impressoras[0],
      impressoras,
      suprimentos,
      infraestrutura,
      infraestruturaModo,
      volumeMensal,
      prazoContrato,
      custoEnergiaKWh,
      calculo,
      isFromCatalog: false,
      isManualCalculation: true,
      // Incluir custos separados para impressoras coloridas
      custoPorPaginaMono: calculo.totalMono,
      custoPorPaginaColor: calculo.isColorida ? calculo.totalColor : 0,
      isColorida: calculo.isColorida,
      // Modalidade de locação
      modalidadeLocacao,
      valorLocacaoImpressora: calculo.valorLocacaoImpressora,
      valorLocacaoBaseImpressoras: calculo.valorLocacaoBaseImpressoras,
      infraestruturaRateadaNaLocacao: calculo.infraestruturaRateadaNaLocacao,
      infraestruturaMensalSeparada: calculo.infraestruturaMensalSeparada,
      franquiaMensal,
      valorFranquia,
      valorPaginaExcedenteMono: calculo.valorPaginaExcedenteMono,
      valorPaginaExcedenteColor: calculo.valorPaginaExcedenteColor,
      // Regime Tributário
      regimeTributarioId,
      regimeTributarioNome: regimeSelecionado?.name || null,
      regimeTributarioAliquota: (() => {
        if (!regimeSelecionado) return 0;
        if (regimeSelecionado.type === 'iva') return regimeSelecionado.ivaTotal;
        if (regimeSelecionado.type === 'simples') return regimeSelecionado.anexoI;
        return regimeSelecionado.icms + regimeSelecionado.pis + regimeSelecionado.cofins + 1.2;
      })(),
      // Parâmetros de cálculo
      comissaoVenda: outsourcingConfig.comissaoVenda,
      custosOperacionais: outsourcingConfig.custosOperacionais,
      margemPadrao: outsourcingConfig.margemPadrao
    };

    onSave(dados, { salvarEmOrcamentos });
  };

  const calculo = calcularCustoPorPagina();
  const formatCurrency = (value: number) =>
    `R$ ${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const hasDraftPrinter = Boolean(modelo || marca || custoAquisicao || valorLocacaoImpressora);
  const canAddPrinter = Boolean(modelo && marca && (modalidadeLocacao !== 'por-pagina' || valorLocacaoImpressora > 0));
  const canSave = impressoras.length > 0 &&
    impressoras.every(printer => suprimentos.some(sup => sup.printerId === printer.id)) &&
    (modalidadeLocacao !== 'por-pagina' || impressoras.every(printer => printer.valorLocacaoMensal > 0)) &&
    (modalidadeLocacao !== 'franquia' || (volumeMensal > 0 && valorFranquia > 0));

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto pb-24">
        <DialogHeader>
          <DialogTitle>Cálculo Manual Detalhado</DialogTitle>
          <DialogDescription>
            {showModalidadeSelection 
              ? 'Selecione a modalidade de locação para começar'
              : 'Adicione a impressora e todos os suprimentos para calcular os valores da proposta'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => preencherDadosTeste('franquia')}>
            <Calculator className="h-4 w-4 mr-2" />
            Teste Franquia
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => preencherDadosTeste('por-pagina')}>
            <Calculator className="h-4 w-4 mr-2" />
            Teste Por Página
          </Button>
        </div>

        {showModalidadeSelection ? (
          /* Tela de Seleção de Modalidade */
          <div className="space-y-6 py-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold mb-2 text-slate-100">Escolha a Modalidade de Locação</h3>
              <p className="text-sm text-slate-300">
                Selecione como deseja montar a proposta de locação
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Modalidade Franquia */}
              <Card
                className="cursor-pointer hover:shadow-lg transition-all border-2 border-slate-700 bg-slate-900/40 hover:border-blue-400"
                onClick={() => {
                  selecionarModalidadeLocacao('franquia');
                  setShowModalidadeSelection(false);
                }}
              >
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-blue-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="h-8 w-8 text-blue-300" />
                  </div>
                  <CardTitle className="text-blue-100">Franquia Mensal</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-slate-300 text-center">
                    Valor fixo mensal incluindo impressora e franquia de páginas
                  </p>
                  <div className="bg-blue-900/30 border border-blue-700/40 p-3 rounded-lg space-y-2">
                    <h4 className="font-semibold text-sm text-blue-100">Inclui:</h4>
                    <ul className="text-xs text-blue-100 space-y-1">
                      <li>✓ Locação do equipamento</li>
                      <li>✓ Franquia de páginas mensais</li>
                      <li>✓ Valor fixo e previsível</li>
                      <li>✓ Ideal para volumes constantes</li>
                    </ul>
                  </div>
                  <div className="text-center pt-2">
                    <Badge variant="secondary" className="bg-blue-900/40 text-blue-100 border border-blue-700/40">
                      Recomendado para volumes estáveis
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Modalidade Por Página */}
              <Card
                className="cursor-pointer hover:shadow-lg transition-all border-2 border-slate-700 bg-slate-900/40 hover:border-green-400"
                onClick={() => {
                  selecionarModalidadeLocacao('por-pagina');
                  setShowModalidadeSelection(false);
                }}
              >
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-green-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calculator className="h-8 w-8 text-green-300" />
                  </div>
                  <CardTitle className="text-green-100">Por Página Impressa</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-slate-300 text-center">
                    Locação da impressora + valor por página impressa
                  </p>
                  <div className="bg-green-900/30 border border-green-700/40 p-3 rounded-lg space-y-2">
                    <h4 className="font-semibold text-sm text-green-100">Inclui:</h4>
                    <ul className="text-xs text-green-100 space-y-1">
                      <li>✓ Locação do equipamento (valor fixo)</li>
                      <li>✓ Valor por página impressa</li>
                      <li>✓ Custos mono e color separados</li>
                      <li>✓ Ideal para volumes variáveis</li>
                    </ul>
                  </div>
                  <div className="text-center pt-2">
                    <Badge variant="secondary" className="bg-green-900/40 text-green-100 border border-green-700/40">
                      Recomendado para volumes variáveis
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-center pt-4">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          /* Formulário Principal */
          <>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="impressora">
              <Printer className="h-4 w-4 mr-2" />
              Impressora
            </TabsTrigger>
            <TabsTrigger value="suprimentos">
              <Package className="h-4 w-4 mr-2" />
              Suprimentos
            </TabsTrigger>
            <TabsTrigger value="infraestrutura">
              <Server className="h-4 w-4 mr-2" />
              Infraestrutura
            </TabsTrigger>
            <TabsTrigger value="volume">
              <Calculator className="h-4 w-4 mr-2" />
              Volume
            </TabsTrigger>
            <TabsTrigger value="resultado">
              Resultado
            </TabsTrigger>
          </TabsList>

          {/* Aba Impressora */}
          <TabsContent value="impressora" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Dados da Impressora</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Modelo *</Label>
                    <Input
                      value={modelo}
                      onChange={(e) => setModelo(e.target.value)}
                      placeholder="Ex: LaserJet Pro M404n"
                    />
                  </div>
                  <div>
                    <Label>Marca *</Label>
                    <Input
                      value={marca}
                      onChange={(e) => setMarca(e.target.value)}
                      placeholder="Ex: HP"
                    />
                  </div>
                  <div>
                    <Label>Tipo</Label>
                    <Select value={tipo} onValueChange={(v: any) => setTipo(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Laser P&B">Laser P&B</SelectItem>
                        <SelectItem value="Laser Colorida">Laser Colorida</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Quantidade</Label>
                    <Input
                      type="number"
                      min="1"
                      value={quantidadeImpressora || ''}
                      onChange={(e) => setQuantidadeImpressora(Number(e.target.value))}
                      placeholder="Ex: 10"
                    />
                  </div>
                  <div>
                    <Label>Velocidade (PPM)</Label>
                    <Input
                      type="number"
                      value={velocidadePPM || ''}
                      onChange={(e) => setVelocidadePPM(Number(e.target.value))}
                      placeholder="Ex: 38"
                    />
                  </div>
                  <div>
                    <Label>Custo de Aquisição (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={custoAquisicao || ''}
                      onChange={(e) => setCustoAquisicao(Number(e.target.value))}
                      placeholder="Ex: 1200.00"
                    />
                  </div>
                  <div>
                    <Label>Vida Útil (páginas)</Label>
                    <Input
                      type="number"
                      value={vidaUtil || ''}
                      onChange={(e) => setVidaUtil(Number(e.target.value))}
                      placeholder="Ex: 100000"
                    />
                  </div>
                  <div>
                    <Label>Consumo de Energia (kWh/mês)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={consumoEnergia || ''}
                      onChange={(e) => setConsumoEnergia(Number(e.target.value))}
                      placeholder="Ex: 15"
                    />
                  </div>
                  <div>
                    <Label>Custo de Manutenção Mensal (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={custoManutencao || ''}
                      onChange={(e) => setCustoManutencao(Number(e.target.value))}
                      placeholder="Ex: 50.00"
                    />
                  </div>
                  {modalidadeLocacao === 'por-pagina' && (
                    <div>
                      <Label>Valor Locação da Impressora (R$/mês) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={valorLocacaoImpressora || ''}
                        onChange={(e) => setValorLocacaoImpressora(Number(e.target.value))}
                        placeholder="Ex: 150.00"
                      />
                    </div>
                  )}
                </div>
                <div className="flex justify-end">
                  <Button onClick={adicionarImpressora} disabled={!canAddPrinter}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Impressora
                  </Button>
                </div>
              </CardContent>
            </Card>

            {impressoras.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Impressoras Adicionadas ({impressoras.reduce((total, printer) => total + printer.quantidade, 0)} equipamentos)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {impressoras.map((printer) => (
                      <div key={printer.id} className="flex items-center justify-between p-3 bg-slate-900/60 border border-slate-700 rounded-lg">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{printer.quantidade}x</Badge>
                            <span className="font-medium">{printer.marca} {printer.modelo}</span>
                            <span className="text-xs text-slate-400">{printer.tipo}</span>
                          </div>
                          <p className="text-xs text-slate-300 mt-1">
                            {printer.velocidadePPM || 0} PPM | Aquisição R$ {printer.custoAquisicao.toFixed(2)}
                            {modalidadeLocacao === 'por-pagina' && ` | Locação/mês R$ ${printer.valorLocacaoMensal.toFixed(2)}`}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removerImpressora(printer.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Aba Suprimentos */}
          <TabsContent value="suprimentos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Adicionar Suprimento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {impressoras.length === 0 && (
                  <div className="p-3 bg-amber-900/25 border border-amber-700/40 rounded-lg text-sm text-amber-100">
                    Adicione pelo menos uma impressora na aba Impressora para vincular suprimentos.
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <Label>Impressora</Label>
                    <Select
                      value={selectedPrinterIdForSupply}
                      onValueChange={setSelectedPrinterIdForSupply}
                      disabled={impressoras.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {impressoras.map(printer => (
                          <SelectItem key={printer.id} value={printer.id}>
                            {printer.quantidade}x {printer.marca} {printer.modelo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Tipo</Label>
                    <Select 
                      value={novoSuprimento.tipo} 
                      onValueChange={(v: any) => setNovoSuprimento({...novoSuprimento, tipo: v})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Toner P&B">Toner P&B</SelectItem>
                        <SelectItem value="Toner Ciano">Toner Ciano</SelectItem>
                        <SelectItem value="Toner Magenta">Toner Magenta</SelectItem>
                        <SelectItem value="Toner Amarelo">Toner Amarelo</SelectItem>
                        <SelectItem value="Cilindro">Cilindro (Fotoconductor)</SelectItem>
                        <SelectItem value="Fusor">Fusor</SelectItem>
                        <SelectItem value="Kit Manutenção">Kit Manutenção</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Descrição</Label>
                    <Input
                      value={novoSuprimento.descricao}
                      onChange={(e) => setNovoSuprimento({...novoSuprimento, descricao: e.target.value})}
                      placeholder="Ex: HP CF410A"
                    />
                  </div>
                  <div>
                    <Label>Rendimento (páginas)</Label>
                    <Input
                      type="number"
                      value={novoSuprimento.rendimento || ''}
                      onChange={(e) => setNovoSuprimento({...novoSuprimento, rendimento: Number(e.target.value)})}
                      placeholder="Ex: 2300"
                    />
                  </div>
                  <div>
                    <Label>Custo (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={novoSuprimento.custo || ''}
                      onChange={(e) => setNovoSuprimento({...novoSuprimento, custo: Number(e.target.value)})}
                      placeholder="Ex: 180.00"
                    />
                  </div>
                </div>
                <Button onClick={adicionarSuprimento} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Suprimento
                </Button>
              </CardContent>
            </Card>

            {/* Lista de Suprimentos */}
            {suprimentos.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Suprimentos Adicionados ({suprimentos.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {impressoras.map((printer) => {
                      const suprimentosDaImpressora = suprimentos.filter(sup => sup.printerId === printer.id);
                      if (suprimentosDaImpressora.length === 0) {
                        return null;
                      }

                      return (
                        <div key={printer.id} className="rounded-lg border border-slate-700 bg-slate-950/40 p-3">
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <Badge variant="secondary" className="bg-blue-900/40 text-blue-100 border border-blue-700/40">
                              {printer.quantidade}x
                            </Badge>
                            <h4 className="font-semibold text-slate-100">{printer.marca} {printer.modelo}</h4>
                            <span className="text-xs text-slate-400">{printer.tipo}</span>
                            <Badge variant="outline">{suprimentosDaImpressora.length} suprimentos</Badge>
                          </div>
                          <div className="space-y-2">
                            {suprimentosDaImpressora.map((sup) => (
                              <div key={sup.id} className="flex items-center justify-between p-3 bg-slate-900/60 border border-slate-700 rounded-lg">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <Badge variant="outline">{sup.tipo}</Badge>
                                    <span className="font-medium">{sup.descricao}</span>
                                  </div>
                                  <div className="text-sm text-slate-300 mt-1">
                                    Rendimento: {sup.rendimento.toLocaleString()} páginas | 
                                    Custo: R$ {sup.custo.toFixed(2)} | 
                                    Custo/página: R$ {(sup.custo / sup.rendimento).toFixed(4)}
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removerSuprimento(sup.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Aba Infraestrutura */}
          <TabsContent value="infraestrutura" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Como Tratar o Custo da Infraestrutura</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      infraestruturaModo === 'rateada-locacao'
                        ? 'border-green-400 bg-green-900/35 shadow-md shadow-green-950/40'
                        : 'border-slate-700 bg-slate-900/40 hover:border-slate-500'
                    }`}
                    onClick={() => setInfraestruturaModo('rateada-locacao')}
                  >
                    <h4 className="font-semibold mb-2 text-slate-100">Infra rateada nas impressoras</h4>
                    <p className="text-sm text-slate-300">
                      Mensaliza o custo total da infraestrutura e soma na locação das impressoras.
                    </p>
                  </div>
                  <div
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      infraestruturaModo === 'mensal-separado'
                        ? 'border-blue-400 bg-blue-900/35 shadow-md shadow-blue-950/40'
                        : 'border-slate-700 bg-slate-900/40 hover:border-slate-500'
                    }`}
                    onClick={() => setInfraestruturaModo('mensal-separado')}
                  >
                    <h4 className="font-semibold mb-2 text-slate-100">Valor Infra Mensal</h4>
                    <p className="text-sm text-slate-300">
                      Mensaliza o custo total da infraestrutura como cobrança separada. Não altera a locação das impressoras.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Badge variant="outline" className="justify-center bg-slate-900/60 text-slate-100 border-slate-700">
                    Locação base: R$ {calculo.valorLocacaoBaseImpressoras.toFixed(2)}
                  </Badge>
                  <Badge variant="outline" className="justify-center bg-slate-900/60 text-slate-100 border-slate-700">
                    Infra mensalizada: R$ {calculo.infraestruturaMensal.toFixed(2)}
                  </Badge>
                  <Badge variant="outline" className="justify-center bg-slate-900/60 text-slate-100 border-slate-700">
                    Locação calculada: R$ {calculo.valorLocacaoImpressora.toFixed(2)}
                  </Badge>
                </div>
                <Button
                  type="button"
                  className="w-full"
                  onClick={() => setActiveTab('resultado')}
                  disabled={impressoras.length === 0}
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Calcular Locação de Impressora
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Adicionar Infraestrutura</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <Label>Tipo</Label>
                    <Select
                      value={novoInfraItem.tipo}
                      onValueChange={(v: any) => setNovoInfraItem({ ...novoInfraItem, tipo: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Servidor">Servidor</SelectItem>
                        <SelectItem value="Licença">Licença</SelectItem>
                        <SelectItem value="Implantação">Implantação</SelectItem>
                        <SelectItem value="Treinamento">Treinamento</SelectItem>
                        <SelectItem value="Software">Software</SelectItem>
                        <SelectItem value="Serviço">Serviço</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Descrição</Label>
                    <Input
                      value={novoInfraItem.descricao || ''}
                      onChange={(e) => setNovoInfraItem({ ...novoInfraItem, descricao: e.target.value })}
                      placeholder="Ex: Servidor de bilhetagem"
                    />
                  </div>
                  <div>
                    <Label>Quantidade</Label>
                    <Input
                      type="number"
                      min="1"
                      value={novoInfraItem.quantidade || ''}
                      onChange={(e) => setNovoInfraItem({ ...novoInfraItem, quantidade: Number(e.target.value) })}
                      placeholder="Ex: 1"
                    />
                  </div>
                  <div>
                    <Label>Custo total (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={novoInfraItem.custo || ''}
                      onChange={(e) => setNovoInfraItem({ ...novoInfraItem, custo: Number(e.target.value) })}
                      placeholder="Ex: 15000.00"
                    />
                  </div>
                  <div>
                    <Label>Tratamento</Label>
                    <Select
                      value={novoInfraItem.recorrencia}
                      onValueChange={(v: any) => setNovoInfraItem({ ...novoInfraItem, recorrencia: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mensal">Mensalizado no contrato</SelectItem>
                        <SelectItem value="unico">Compra/implantação</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="text-xs text-slate-400">
                  Informe o custo total do item. O sistema mensaliza pelo prazo do contrato usando taxa financeira, impostos e composição comercial.
                </p>
                <Button onClick={adicionarInfraestrutura} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Infraestrutura
                </Button>
              </CardContent>
            </Card>

            {infraestrutura.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Infraestrutura Adicionada ({infraestrutura.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {infraestrutura.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-slate-900/60 border border-slate-700 rounded-lg">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{item.tipo}</Badge>
                            <span className="font-medium">{item.descricao}</span>
                          </div>
                          <p className="text-sm text-slate-300 mt-1">
                            Custo total: {item.quantidade}x R$ {item.custo.toFixed(2)} | Mensalizado em {prazoContrato} meses com impostos e composição comercial
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removerInfraestrutura(item.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Aba Volume */}
          <TabsContent value="volume" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Modalidade de Locação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      modalidadeLocacao === 'franquia'
                        ? 'border-blue-400 bg-blue-900/35 shadow-md shadow-blue-950/40'
                        : 'border-slate-700 bg-slate-900/40 hover:border-slate-500'
                    }`}
                    onClick={() => selecionarModalidadeLocacao('franquia')}
                  >
                    <h4 className="font-semibold mb-2 text-slate-100">Franquia Mensal</h4>
                    <p className="text-sm text-slate-300">
                      Valor fixo mensal incluindo impressora e franquia de páginas
                    </p>
                  </div>
                  <div
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      modalidadeLocacao === 'por-pagina'
                        ? 'border-green-400 bg-green-900/35 shadow-md shadow-green-950/40'
                        : 'border-slate-700 bg-slate-900/40 hover:border-slate-500'
                    }`}
                    onClick={() => selecionarModalidadeLocacao('por-pagina')}
                  >
                    <h4 className="font-semibold mb-2 text-slate-100">Por Página Impressa</h4>
                    <p className="text-sm text-slate-300">
                      Locação da impressora + valor por página impressa
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Parâmetros de Cálculo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {modalidadeLocacao === 'franquia' && (
                    <div>
                      <Label>Volume Mensal (páginas) *</Label>
                      <Input
                        type="number"
                        value={volumeMensal || ''}
                        onChange={(e) => setVolumeMensal(Number(e.target.value))}
                        placeholder="Ex: 5000"
                      />
                      <p className="text-xs text-slate-400 mt-1">
                        Volume estimado de impressão por mês
                      </p>
                    </div>
                  )}
                  <div>
                    <Label>Prazo do Contrato (meses)</Label>
                    <Select value={prazoContrato.toString()} onValueChange={(v) => setPrazoContrato(Number(v))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12">12 meses</SelectItem>
                        <SelectItem value="24">24 meses</SelectItem>
                        <SelectItem value="36">36 meses</SelectItem>
                        <SelectItem value="48">48 meses</SelectItem>
                        <SelectItem value="60">60 meses</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {modalidadeLocacao === 'franquia' && (
                    <div>
                      <Label>Custo Energia (R$/kWh)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={custoEnergiaKWh || ''}
                        onChange={(e) => setCustoEnergiaKWh(Number(e.target.value))}
                        placeholder="Ex: 0.85"
                      />
                    </div>
                  )}
                </div>

                {/* Regime Tributário */}
                <div className="p-4 bg-slate-800/60 rounded-lg border border-slate-600 mb-4">
                  <Label className="text-white flex items-center gap-2 mb-2">
                    <Percent className="h-4 w-4 text-blue-300" />
                    Regime Tributário
                  </Label>
                  <select
                    value={regimeTributarioId}
                    onChange={(e) => setRegimeTributarioId(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Selecione um regime...</option>
                    {taxRegimes.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name} {r.active ? '(Ativo)' : ''}
                      </option>
                    ))}
                  </select>
                  {regimeSelecionado && (
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      {regimeSelecionado.type === 'iva' ? (
                        <>
                          <span className="text-blue-200">CBS: {regimeSelecionado.ivaCbs}%</span>
                          <span className="text-blue-200">IBS: {regimeSelecionado.ivaIbs}%</span>
                          <span className="text-blue-200 font-bold">Total IVA: {regimeSelecionado.ivaTotal}%</span>
                        </>
                      ) : regimeSelecionado.type === 'simples' ? (
                        <span className="text-green-200">Alíquota: {regimeSelecionado.anexoI}% (Anexo I)</span>
                      ) : (
                        <>
                          <span className="text-blue-200">ICMS: {regimeSelecionado.icms}%</span>
                          <span className="text-blue-200">PIS: {regimeSelecionado.pis}%</span>
                          <span className="text-blue-200">COFINS: {regimeSelecionado.cofins}%</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {modalidadeLocacao === 'franquia' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-900/60 rounded-lg border border-blue-500/40">
                    <div>
                      <Label>Franquia Mensal (páginas)</Label>
                      <Input
                        type="number"
                        value={franquiaMensal || ''}
                        onChange={(e) => setFranquiaMensal(Number(e.target.value))}
                        placeholder="Ex: 5000"
                      />
                      <p className="text-xs text-blue-200 mt-1">
                        Quantidade de páginas incluídas na franquia
                      </p>
                    </div>
                    <div>
                      <Label>Valor da Franquia (R$/mês) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={valorFranquia || ''}
                        onChange={(e) => setValorFranquia(Number(e.target.value))}
                        placeholder="Ex: 500.00"
                      />
                      <p className="text-xs text-blue-200 mt-1">
                        Valor fixo mensal da franquia
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-900/60 rounded-lg border border-green-500/40">
                    <Label className="flex items-center gap-2 mb-2">
                      <Info className="h-4 w-4 text-green-300" />
                      Locação Mensal da Frota
                    </Label>
                    <p className="text-xs text-green-200 mt-1">
                      A locação é informada por impressora na aba Impressora e somada conforme a quantidade cadastrada.
                      A infraestrutura segue a opção escolhida na aba Infraestrutura e nunca altera o valor por página.
                    </p>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Badge variant="outline" className="justify-center bg-green-900/40 text-green-100 border-green-700/40">
                        Locação base: R$ {calculo.valorLocacaoBaseImpressoras.toFixed(2)}/mês
                      </Badge>
                      <Badge variant="outline" className="justify-center bg-blue-900/40 text-blue-100 border-blue-700/40">
                        Infra mensalizada: R$ {calculo.infraestruturaMensal.toFixed(2)}
                      </Badge>
                      <Badge variant="outline" className="justify-center bg-purple-900/40 text-purple-100 border-purple-700/40">
                        {infraestruturaModo === 'rateada-locacao' ? 'Locação com infra' : 'Locação sem infra'}: R$ {calculo.valorLocacaoImpressora.toFixed(2)}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Resultado */}
          <TabsContent value="resultado" className="space-y-4">
            {canSave ? (
              <>
                {/* Modalidade de Locação */}
                <Card className={modalidadeLocacao === 'franquia' ? 'border-blue-500/40 bg-slate-900/60' : 'border-green-500/40 bg-slate-900/60'}>
                  <CardHeader>
                    <CardTitle className={modalidadeLocacao === 'franquia' ? 'text-blue-100' : 'text-green-100'}>
                      Modalidade: {modalidadeLocacao === 'franquia' ? 'Franquia Mensal' : 'Por Página Impressa'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {modalidadeLocacao === 'franquia' ? (
                      <div className="space-y-3">
                        <div className="text-center">
                          <div className="text-4xl font-bold text-blue-300">
                            R$ {valorFranquia.toFixed(2)}
                          </div>
                          <p className="text-sm text-blue-200 mt-2">
                            Valor fixo mensal da franquia
                          </p>
                        </div>
                        <div className={`grid grid-cols-1 ${calculo.isColorida ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-3`}>
                          <div className="text-center p-3 bg-blue-900/25 border border-blue-700/40 rounded-lg">
                            <p className="text-xs text-blue-200 mb-1">Franquia mensal incluída</p>
                            <p className="text-xl font-bold text-blue-100">{franquiaMensal.toLocaleString()} páginas</p>
                          </div>
                          <div className="text-center p-3 bg-cyan-900/25 border border-cyan-700/40 rounded-lg">
                            <p className="text-xs text-cyan-200 mb-1">Página excedente Mono</p>
                            <p className="text-xl font-bold text-cyan-100">R$ {calculo.valorPaginaExcedenteMono.toFixed(4)}</p>
                          </div>
                          {calculo.isColorida && (
                            <div className="text-center p-3 bg-green-900/25 border border-green-700/40 rounded-lg">
                              <p className="text-xs text-green-200 mb-1">Página excedente Color</p>
                              <p className="text-xl font-bold text-green-100">R$ {calculo.valorPaginaExcedenteColor.toFixed(4)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="text-center p-3 bg-slate-950/70 border border-slate-700 rounded-lg">
                          <div className="text-2xl font-bold text-green-300">
                            R$ {calculo.valorLocacaoImpressora.toFixed(2)}
                          </div>
                          <p className="text-sm text-green-200 mt-1">Locação das Impressoras/mês</p>
                        </div>
                        {calculo.isColorida ? (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="text-center p-3 bg-slate-950/70 border border-slate-700 rounded-lg">
                              <div className="text-xl font-bold text-blue-300">
                                R$ {calculo.totalMono.toFixed(4)}
                              </div>
                              <p className="text-xs text-blue-200 mt-1">por página Mono</p>
                            </div>
                            <div className="text-center p-3 bg-slate-950/70 border border-slate-700 rounded-lg">
                              <div className="text-xl font-bold text-green-300">
                                R$ {calculo.totalColor.toFixed(4)}
                              </div>
                              <p className="text-xs text-green-200 mt-1">por página Color</p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center p-3 bg-slate-950/70 border border-slate-700 rounded-lg">
                            <div className="text-2xl font-bold text-blue-300">
                              R$ {calculo.totalMono.toFixed(4)}
                            </div>
                            <p className="text-sm text-blue-200 mt-1">por página P&B</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Custos por Página (sempre mostrar para referência) */}
                {calculo.isColorida && (
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="border-blue-500/40 bg-slate-900/60">
                      <CardHeader>
                        <CardTitle className="text-sm text-blue-100">
                          {modalidadeLocacao === 'franquia' ? 'Página excedente Mono' : 'Valor por Página Mono'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-300">
                            R$ {(modalidadeLocacao === 'franquia' ? calculo.valorPaginaExcedenteMono : calculo.totalMono).toFixed(4)}
                          </div>
                          <p className="text-xs text-blue-200 mt-1">por página P&B</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-green-500/40 bg-slate-900/60">
                      <CardHeader>
                        <CardTitle className="text-sm text-green-100">
                          {modalidadeLocacao === 'franquia' ? 'Página excedente Color' : 'Valor por Página Color'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-300">
                            R$ {(modalidadeLocacao === 'franquia' ? calculo.valorPaginaExcedenteColor : calculo.totalColor).toFixed(4)}
                          </div>
                          <p className="text-xs text-green-200 mt-1">por página Color</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Detalhamento do Custo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {calculo.isColorida ? (
                        <>
                          <div className="flex justify-between p-2 bg-blue-900/25 border border-blue-700/40 rounded">
                            <span className="text-blue-100">Suprimentos Mono (P&B)</span>
                            <span className="font-bold text-blue-200">
                              R$ {calculo.detalhes.suprimentosMono?.toFixed(4) || '0.0000'}
                            </span>
                          </div>
                          <div className="flex justify-between p-2 bg-cyan-900/25 border border-cyan-700/40 rounded">
                            <span className="text-cyan-100">Suprimentos Color (CMY)</span>
                            <span className="font-bold text-cyan-200">
                              R$ {calculo.detalhes.suprimentosColor?.toFixed(4) || '0.0000'}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between p-2 bg-blue-900/25 border border-blue-700/40 rounded">
                          <span className="text-blue-100">Suprimentos</span>
                          <span className="font-bold text-blue-200">
                            R$ {calculo.detalhes.suprimentosMono?.toFixed(4) || '0.0000'}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between p-2 bg-purple-900/25 border border-purple-700/40 rounded">
                        <span className="text-purple-100">Depreciação</span>
                        <span className="font-bold text-purple-200">
                          R$ {calculo.detalhes.depreciacao?.toFixed(4) || '0.0000'}
                        </span>
                      </div>
                      <div className="flex justify-between p-2 bg-amber-900/25 border border-amber-700/40 rounded">
                        <span className="text-amber-100">Energia</span>
                        <span className="font-bold text-amber-200">
                          R$ {calculo.detalhes.energia?.toFixed(4) || '0.0000'}
                        </span>
                      </div>
                      <div className="flex justify-between p-2 bg-orange-900/25 border border-orange-700/40 rounded">
                        <span className="text-orange-100">Manutenção</span>
                        <span className="font-bold text-orange-200">
                          R$ {calculo.detalhes.manutencao?.toFixed(4) || '0.0000'}
                        </span>
                      </div>
                      <div className="flex justify-between p-2 bg-green-900/25 border border-green-700/40 rounded">
                        <span className="text-green-100">Infraestrutura</span>
                        <span className="font-bold text-green-200">
                          {infraestruturaModo === 'rateada-locacao'
                            ? `R$ ${calculo.infraestruturaRateadaNaLocacao.toFixed(2)}/mês rateado na locação`
                            : `R$ ${calculo.infraestruturaMensalSeparada.toFixed(2)}/mês separado mensalizado`}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {modalidadeLocacao === 'por-pagina' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Composição Mensal da Locação</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        {impressoras.map((printer) => {
                          const subtotalImpressora = printer.valorLocacaoMensal * printer.quantidade;
                          return (
                            <div
                              key={printer.id}
                              className="p-3 bg-slate-900/60 border border-slate-700 rounded-lg"
                            >
                              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant="outline">{printer.tipo}</Badge>
                                    <span className="font-semibold text-slate-100">
                                      {printer.marca} {printer.modelo}
                                    </span>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm md:min-w-[520px]">
                                  <div className="rounded border border-slate-700 bg-slate-950/40 p-2">
                                    <p className="text-xs text-slate-400">Valor individual/mês</p>
                                    <p className="font-bold text-slate-100">{formatCurrency(printer.valorLocacaoMensal)}</p>
                                  </div>
                                  <div className="rounded border border-slate-700 bg-slate-950/40 p-2">
                                    <p className="text-xs text-slate-400">Quantidade</p>
                                    <p className="font-bold text-slate-100">{printer.quantidade}</p>
                                  </div>
                                  <div className="rounded border border-slate-700 bg-slate-950/40 p-2">
                                    <p className="text-xs text-slate-400">Total das quantidades</p>
                                    <p className="font-bold text-green-200">{formatCurrency(subtotalImpressora)}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="space-y-2 border-t border-slate-700 pt-4">
                        <div className="flex flex-col gap-1 rounded border border-blue-700/40 bg-blue-900/20 p-3 sm:flex-row sm:items-center sm:justify-between">
                          <span className="text-blue-100">Subtotal locação das impressoras</span>
                          <span className="font-bold text-blue-100">{formatCurrency(calculo.valorLocacaoBaseImpressoras)}/mês</span>
                        </div>
                        <div className="flex flex-col gap-1 rounded border border-green-700/40 bg-green-900/20 p-3 sm:flex-row sm:items-center sm:justify-between">
                          <span className="text-green-100">
                            Infraestrutura mensalizada ({infraestruturaModo === 'rateada-locacao' ? 'rateada na locação' : 'valor mensal separado'})
                          </span>
                          <span className="font-bold text-green-100">{formatCurrency(calculo.infraestruturaMensal)}/mês</span>
                        </div>
                        {calculo.custoVariavelMensal > 0 && (
                          <div className="flex flex-col gap-1 rounded border border-cyan-700/40 bg-cyan-900/20 p-3 sm:flex-row sm:items-center sm:justify-between">
                            <span className="text-cyan-100">Páginas impressas simuladas</span>
                            <span className="font-bold text-cyan-100">{formatCurrency(calculo.custoVariavelMensal)}/mês</span>
                          </div>
                        )}
                        <div className="flex flex-col gap-1 rounded border border-orange-500/50 bg-orange-900/25 p-3 sm:flex-row sm:items-center sm:justify-between">
                          <span className="text-orange-100 font-semibold">Total geral mensal</span>
                          <span className="font-bold text-orange-100 text-lg">{formatCurrency(calculo.custoMensal)}/mês</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Custos Totais</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {modalidadeLocacao === 'por-pagina' && (
                      <div className="mb-4 p-3 bg-green-900/25 border border-green-700/40 rounded-lg">
                        <p className="text-xs text-green-100">
                          <strong>Nota:</strong> Na modalidade por página, o orçamento guarda a locação fixa
                          e o valor por página impressa. A infraestrutura é mensalizada pelo prazo e fica somente na locação ou como valor mensal separado. {volumeMensal > 0
                            ? 'Os totais abaixo usam o volume informado apenas como simulação.'
                            : 'Como nenhum volume foi informado, os totais abaixo consideram apenas a locação.'}
                        </p>
                      </div>
                    )}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-slate-900/60 border border-slate-700 rounded-lg">
                        <p className="text-xs text-slate-300 mb-1">
                          {modalidadeLocacao === 'por-pagina' ? 'Locação Mensal' : 'Custo Mensal'}
                        </p>
                        <p className="text-xl font-bold text-slate-100">
                          R$ {calculo.custoMensal?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-slate-900/60 border border-slate-700 rounded-lg">
                        <p className="text-xs text-slate-300 mb-1">
                          {modalidadeLocacao === 'por-pagina' ? 'Locação Anual' : 'Custo Anual'}
                        </p>
                        <p className="text-xl font-bold text-slate-100">
                          R$ {calculo.custoAnual?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-slate-900/60 border border-slate-700 rounded-lg">
                        <p className="text-xs text-slate-300 mb-1">
                          {modalidadeLocacao === 'por-pagina' ? 'Locação Total' : 'Custo Total'} ({prazoContrato} meses)
                        </p>
                        <p className="text-xl font-bold text-slate-100">
                          R$ {calculo.custoTotalContrato?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calculator className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-400">
                    {modalidadeLocacao === 'franquia' 
                      ? 'Adicione impressoras, vincule suprimentos a cada uma e defina o volume mensal para ver o resultado'
                      : 'Adicione impressoras e vincule suprimentos a cada uma para ver o resultado'
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <div className="sticky bottom-0 z-20 -mx-6 -mb-6 flex justify-between gap-3 border-t bg-background/95 px-6 py-4 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/85">
          <Button 
            variant="outline" 
            onClick={() => {
              setShowModalidadeSelection(true);
            }}
          >
            ← Voltar
          </Button>
          <div className="flex shrink-0 flex-col gap-2">
            <Button
              onClick={() => handleSalvar(false)}
              disabled={!canSave || hasDraftPrinter}
            >
              <Calculator className="h-4 w-4 mr-2" />
              Adicionar ao Cálculo
            </Button>
            <Button
              onClick={() => handleSalvar(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white"
              disabled={!canSave || hasDraftPrinter}
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar em Orçamentos
            </Button>
          </div>
        </div>
        </>
        )}
      </DialogContent>
    </Dialog>
  );
}
