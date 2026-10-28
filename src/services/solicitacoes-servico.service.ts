// src/services/solicitacoes-servico.service.ts
import { api } from '@/config/api';
import { instanteParaApi } from '@/utils/instante';
import {
  SolicitacaoServico,
  SolicitacaoServicoFormData,
  SolicitacoesFilters,
  HistoricoSolicitacao,
} from '@/features/solicitacoes-servico/types';

export interface SolicitacoesResponse {
  data: SolicitacaoServico[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SolicitacoesStats {
  total: number;
  registradas: number;
  programadas: number;
  finalizadas: number;
  porTipo: Record<string, number>;
  porPrioridade: Record<string, number>;
}

/**
 * O corpo do cadastro: só o que o DTO da API aceita (`forbidNonWhitelisted`).
 * Ia também `local_especifico`, `solicitante_*`, `requisitos_especiais` e
 * `prazo_esperado`, que a API recusaria com 400 no dia em que viessem preenchidos.
 */
export interface CreateSolicitacaoDto {
  titulo: string;
  descricao: string;
  tipo: string;
  prioridade?: string;
  origem?: string;
  /** Planta e instalação são opcionais: sem elas, quem pediu vai em `cliente_nome` */
  proprietario_id?: string;
  planta_id?: string;
  unidade_id?: string;
  cliente_nome?: string;
  area?: string;
  local?: string;
  equipamento_id?: string;
  justificativa: string;
  beneficios_esperados?: string;
  riscos_nao_execucao?: string;
  data_necessidade?: string;
  tempo_estimado?: number;
  custo_estimado?: number;
  materiais_necessarios?: string;
  ferramentas_necessarias?: string;
  mao_obra_necessaria?: string;
  instrucoes_ids?: string[];
}

/** null limpa o gravado (o prazo, a planta, a instalação, o cliente) */
export interface UpdateSolicitacaoDto
  extends Partial<Omit<CreateSolicitacaoDto, 'data_necessidade' | 'planta_id' | 'unidade_id' | 'proprietario_id' | 'cliente_nome'>> {
  data_necessidade?: string | null;
  planta_id?: string | null;
  unidade_id?: string | null;
  proprietario_id?: string | null;
  cliente_nome?: string | null;
}

/**
 * Os ids das instruções como lista. O BaseModal semeia o campo custom com '' no
 * cadastro, e o `""` ia para a API, que recusava (400): a solicitação sem
 * instrução não se cadastrava. Undefined quando o campo nem veio.
 */
function idsDasInstrucoes(valor: unknown, { semListaEhVazia = false } = {}): string[] | undefined {
  if (!Array.isArray(valor)) return semListaEhVazia ? [] : undefined;
  return valor.map((id) => String(id).trim()).filter(Boolean);
}

/** Na edição: o campo que veio vazio limpa (null); o que nem veio fica de fora. */
function idOuNulo(valor: string | null | undefined): string | null | undefined {
  if (valor === undefined) return undefined;
  return valor?.trim() || null;
}

class SolicitacoesServicoApiService {
  private baseUrl = '/solicitacoes-servico';

  // ==========================================
  // 🔵 1. OPERAÇÕES CRUD BÁSICAS
  // ==========================================

  async findAll(filters: SolicitacoesFilters): Promise<SolicitacoesResponse> {
    const params = new URLSearchParams();

    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.periodo && filters.periodo !== 'all') params.append('periodo', filters.periodo);
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.tipo && filters.tipo !== 'all') params.append('tipo', filters.tipo);
    if (filters.prioridade && filters.prioridade !== 'all')
      params.append('prioridade', filters.prioridade);
    if (filters.origem && filters.origem !== 'all') params.append('origem', filters.origem);
    if (filters.planta && filters.planta !== 'all') params.append('planta_id', filters.planta);

    const url = `${this.baseUrl}?${params}`;
    console.log('[SERVICE] Parâmetros enviados para API:', params.toString());
    const response = await api.get(url);

    // Debug: verificar o que está vindo do backend
    if (response.data?.length > 0) {
      console.log('[SERVICE] Primeira solicitação recebida do backend:', response.data.data[0]);
      console.log('[SERVICE] unidade_id:', response.data.data[0].unidade_id);
      console.log('[SERVICE] unidade:', response.data.data[0].unidade);
    }

    return response.data;
  }

  /** `semAvisoGlobal`: quem chama trata a falha (a origem excluída da OS é contexto, não erro) */
  async findOne(id: string, opcoes: { semAvisoGlobal?: boolean } = {}): Promise<SolicitacaoServico> {
    const response = await api.get(`${this.baseUrl}/${id}`, { semAvisoGlobal: opcoes.semAvisoGlobal });
    return response.data;
  }

  async create(data: SolicitacaoServicoFormData): Promise<SolicitacaoServico> {
    // A planta não é mais exigida aqui: a equipe cadastra sem ela (o cliente em
    // texto) e quem tem escopo por planta é barrado pela API, com a mensagem dela
    const createDto: CreateSolicitacaoDto = {
      titulo: data.titulo,
      descricao: data.descricao,
      tipo: data.tipo,
      prioridade: data.prioridade || 'MEDIA',
      origem: data.origem || 'PORTAL', // Valor padrão: PORTAL (conforme validação da API)
      proprietario_id: data.proprietario_id || undefined,
      planta_id: data.planta_id || undefined,
      unidade_id: data.unidade_id || undefined,
      cliente_nome: data.cliente_nome?.trim() || undefined,
      area: data.area,
      local: data.local,
      equipamento_id: data.equipamento_id,
      justificativa: data.justificativa ?? '',
      beneficios_esperados: data.beneficios_esperados,
      riscos_nao_execucao: data.riscos_nao_execucao,
      data_necessidade: instanteParaApi(data.data_necessidade) ?? undefined,
      tempo_estimado: data.tempo_estimado,
      custo_estimado: data.custo_estimado,
      materiais_necessarios: data.materiais_necessarios,
      ferramentas_necessarias: data.ferramentas_necessarias,
      mao_obra_necessaria: data.mao_obra_necessaria,
      instrucoes_ids: idsDasInstrucoes(data.instrucoes_ids, { semListaEhVazia: true }),
    };

    const response = await api.post(this.baseUrl, createDto);
    return response.data;
  }

  async update(id: string, data: Partial<SolicitacaoServicoFormData>): Promise<SolicitacaoServico> {
    const updateDto: UpdateSolicitacaoDto = {
      titulo: data.titulo,
      descricao: data.descricao,
      tipo: data.tipo,
      prioridade: data.prioridade,
      // O lugar não ia: trocar a planta, a instalação ou o local e salvar não
      // gravava nada. A API confere a coerência e o escopo, como no cadastro
      planta_id: idOuNulo(data.planta_id),
      unidade_id: idOuNulo(data.unidade_id),
      proprietario_id: idOuNulo(data.proprietario_id),
      cliente_nome: idOuNulo(data.cliente_nome),
      local: data.local === undefined ? undefined : (data.local ?? '').trim(),
      justificativa: data.justificativa,
      beneficios_esperados: data.beneficios_esperados,
      riscos_nao_execucao: data.riscos_nao_execucao,
      // O prazo tem que viajar no update tambem: sem ele, editar qualquer
      // outro campo apagaria a data que ja estava gravada. Vazio vai como
      // null, que e como se limpa o campo.
      data_necessidade: instanteParaApi(data.data_necessidade),
      tempo_estimado: data.tempo_estimado,
      custo_estimado: data.custo_estimado,
      materiais_necessarios: data.materiais_necessarios,
      ferramentas_necessarias: data.ferramentas_necessarias,
      mao_obra_necessaria: data.mao_obra_necessaria,
      // Na edição, o que não é lista não mexe nos vínculos (vazio aqui apagaria todos)
      instrucoes_ids: idsDasInstrucoes(data.instrucoes_ids),
    };

    const response = await api.patch(`${this.baseUrl}/${id}`, updateDto);
    return response.data;
  }

  async remove(id: string): Promise<{ message: string }> {
    const response = await api.delete(`${this.baseUrl}/${id}`);
    return response.data;
  }

  // ==========================================
  // 📊 2. ESTATÍSTICAS
  // ==========================================

  async getStats(periodo?: string): Promise<SolicitacoesStats> {
    const params = new URLSearchParams();
    if (periodo && periodo !== 'all') {
      params.append('periodo', periodo);
    }

    const url = `${this.baseUrl}/stats${params.toString() ? `?${params}` : ''}`;
    const response = await api.get(url);

    return response.data;
  }

  // ==========================================
  // 📜 5. HISTÓRICO
  // ==========================================

  async getHistorico(id: string): Promise<HistoricoSolicitacao[]> {
    const response = await api.get(`${this.baseUrl}/${id}/historico`);
    return response.data;
  }

  // ==========================================
  // 🔧 6. UTILITÁRIOS
  // ==========================================

  async testConnection(): Promise<boolean> {
    try {
      await api.get(`${this.baseUrl}/stats`);
      return true;
    } catch (error) {
      console.error('❌ [SolicitacoesServicoService] Erro na conexão:', error);
      return false;
    }
  }
}

// Instância singleton
export const solicitacoesServicoService = new SolicitacoesServicoApiService();
export default solicitacoesServicoService;
