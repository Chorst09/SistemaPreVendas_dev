import { NextRequest, NextResponse } from 'next/server';

const PNCP_BASE = 'https://pncp.gov.br/api/consulta/v1';

const today = () => new Date().toISOString().slice(0, 10).replaceAll('-', '');

const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10).replaceAll('-', '');
};

const toApiDate = (value: string | null) => (value ? value.replaceAll('-', '').slice(0, 8) : '');

const toIsoDate = (value: unknown) => {
  if (!value) return null;
  const text = String(value).replaceAll('-', '').slice(0, 8);
  if (text.length < 8) return String(value);
  return `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}`;
};

const normalizeText = (value: unknown) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const matchObject = (text: unknown, query: string) => {
  const terms = normalizeText(query)
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length > 2);
  if (terms.length === 0) return true;
  const haystack = normalizeText(text);
  return terms.some((term) => haystack.includes(term));
};

const normalizePNCP = (item: any, statusFallback = 'Publicado') => ({
  id: item.numeroControlePNCP || `pncp-${item.anoCompra || ''}-${item.numeroCompra || ''}-${item.orgaoEntidade?.cnpj || ''}`,
  numeroControlePNCP: item.numeroControlePNCP || '',
  fonte: 'PNCP',
  fonteLogo: '🏛️',
  titulo: item.objetoCompra || item.informacaoComplementar || 'Sem descrição',
  orgao: item.orgaoEntidade?.razaoSocial || item.unidadeOrgao?.nomeUnidade || '',
  modalidade: item.modalidadeNome || '',
  uf: item.unidadeOrgao?.ufSigla || '',
  municipio: item.unidadeOrgao?.municipioNome || '',
  valor: item.valorTotalEstimado ? Number(item.valorTotalEstimado) : null,
  dataPublicacao: toIsoDate(item.dataPublicacaoPncp) || item.dataPublicacaoPncp || null,
  dataAbertura: item.dataAberturaProposta || null,
  dataEncerramento: item.dataEncerramentoProposta || null,
  numero: item.numeroCompra || '',
  ano: item.anoCompra || '',
  link: item.linkSistemaOrigem || `https://pncp.gov.br/app/editais/${item.orgaoEntidade?.cnpj}/${item.anoCompra}/${item.sequencialCompra}`,
  status: item.situacaoCompraNome || statusFallback,
  situacaoCodigo: item.codigoSituacaoCompra
});

const fetchPNCP = async (path: string, params: URLSearchParams, objeto: string) => {
  const url = new URL(`${PNCP_BASE}${path}`);
  params.forEach((value, key) => {
    if (value) url.searchParams.set(key, value);
  });

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'pt-BR,pt;q=0.9',
      'User-Agent': 'SistemaPre/PortalBusca'
    },
    next: { revalidate: 300 },
    signal: AbortSignal.timeout(20000)
  });

  if (!response.ok) {
    throw new Error(`PNCP HTTP ${response.status}`);
  }

  const payload = await response.json().catch(() => null);
  const rows = Array.isArray(payload?.data) ? payload.data : [];
  return rows
    .filter((item) => matchObject(`${item.objetoCompra || ''} ${item.informacaoComplementar || ''}`, objeto))
    .map((item) => normalizePNCP(item, path.includes('proposta') ? 'Em proposta' : 'Publicado'));
};

const dedupe = (items: any[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = String(item.numeroControlePNCP || item.id || item.link || `${item.fonte}-${item.orgao}-${item.titulo}-${item.dataAbertura}`);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const sortItems = (items: any[], ordem: string) => [...items].sort((a, b) => {
  switch (ordem) {
    case 'data_asc':
      return new Date(a.dataPublicacao || 0).getTime() - new Date(b.dataPublicacao || 0).getTime();
    case 'valor_desc':
      return (b.valor || 0) - (a.valor || 0);
    case 'valor_asc':
      return (a.valor || 0) - (b.valor || 0);
    case 'abertura_asc':
      return new Date(a.dataAbertura || '9999-12-31').getTime() - new Date(b.dataAbertura || '9999-12-31').getTime();
    default:
      return new Date(b.dataPublicacao || 0).getTime() - new Date(a.dataPublicacao || 0).getTime();
  }
});

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const objeto = searchParams.get('objeto') || '';
  const uf = searchParams.get('uf') || '';
  const fontes = (searchParams.get('fontes') || 'pncp').toLowerCase().split(',').map((item) => item.trim());
  const incluirPropostas = searchParams.get('incluirPropostas') !== 'false';
  const ordem = searchParams.get('ordem') || 'data_desc';
  const tamanhoPagina = Math.max(10, Math.min(Number(searchParams.get('tamanhoPagina') || 50), 50));
  const dataInicial = toApiDate(searchParams.get('dataInicio')) || daysAgo(30);
  const dataFinal = toApiDate(searchParams.get('dataFim')) || today();

  const results: any[] = [];
  const errors: string[] = [];

  if (fontes.includes('pncp')) {
    const modalidades = ['3', '4', '5', '6', '8', '9'];

    const modalidadeResults = await Promise.allSettled(modalidades.map(async (modalidade) => {
      const baseParams = new URLSearchParams({
        dataInicial,
        dataFinal,
        pagina: '1',
        tamanhoPagina: String(tamanhoPagina),
        codigoModalidadeContratacao: modalidade
      });
      if (uf) baseParams.set('uf', uf);

      return {
        modalidade,
        data: await fetchPNCP('/contratacoes/publicacao', baseParams, objeto)
      };
    }));

    for (const result of modalidadeResults) {
      if (result.status === 'fulfilled') {
        results.push(...result.value.data);
      } else {
        errors.push(`PNCP modalidade: ${result.reason?.message || 'falha na consulta'}`);
      }
    }

    if (incluirPropostas) {
      const propostaParams = new URLSearchParams({
        dataInicial,
        dataFinal,
        pagina: '1',
        tamanhoPagina: String(tamanhoPagina)
      });
      if (uf) propostaParams.set('uf', uf);

      try {
        results.push(...await fetchPNCP('/contratacoes/proposta', propostaParams, objeto));
      } catch (error: any) {
        errors.push(`PNCP propostas: ${error?.message || 'falha na consulta'}`);
      }
    }
  }

  const data = sortItems(dedupe(results), ordem);
  const porFonte = data.reduce<Record<string, number>>((acc, item) => {
    acc[item.fonte] = (acc[item.fonte] || 0) + 1;
    return acc;
  }, {});

  return NextResponse.json({
    data,
    total: data.length,
    pagina: Number(searchParams.get('pagina') || 1),
    fontes: porFonte,
    erros: errors.length ? errors : undefined,
    timestamp: new Date().toISOString()
  });
}
