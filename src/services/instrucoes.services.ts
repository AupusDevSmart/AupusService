// src/services/instrucoes.services.ts
import { api } from '@/config/api';
import type { TarefaApiResponse } from './tarefas.services';
import type { RecursoApiResponse } from '@/services/recursos.services';
import type { MaquinarioApiResponse } from '@/services/maquinarios.services';

// ============================================================================
// ENUMS E TIPOS BASE
// ============================================================================

export type StatusInstrucao = 'ATIVA' | 'INATIVA' | 'EM_REVISAO' | 'ARQUIVADA';
export type FrequenciaTarefa = 'DIARIA' | 'SEMANAL' | 'QUINZENAL' | 'MENSAL' | 'BIMESTRAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL' | 'PERSONALIZADA';
export type TipoAnexo = 'MANUAL' | 'PROCEDIMENTO' | 'MODELO_RELATORIO' | 'OUTROS';

// ============================================================================
// TIPOS DA API PARA INSTRUCOES
// ============================================================================

/** VERIFICACAO = marcar feito; LEITURA = digitar o valor medido (SN-58). No passo é o `registro` (SN-85) */
export type RegistroDoPasso = 'VERIFICACAO' | 'LEITURA';

/** A disciplina do passo, a lista do AupusProject (SN-85) */
export type DisciplinaDoPasso = 'administrativo' | 'civil' | 'eletrico' | 'mecanico';

export const ROTULO_DA_DISCIPLINA: Record<DisciplinaDoPasso, string> = {
  administrativo: 'Administrativo',
  civil: 'Civil',
  eletrico: 'Elétrico',
  mecanico: 'Mecânico',
};

export interface CreateSubInstrucaoApiData {
  descricao: string;
  obrigatoria?: boolean;
  /** A disciplina; vazio = sem disciplina */
  tipo?: DisciplinaDoPasso | null;
  /** Quanto o passo leva, em horas */
  duracao_horas?: number | null;
  ordem?: number;
  registro?: RegistroDoPasso;
  /** SN-59: o item da OS só é marcado com uma foto dele */
  exige_foto?: boolean;
  /** Unidade e faixa só na leitura: a API recusa em verificação */
  unidade?: string | null;
  valor_minimo?: number | null;
  valor_maximo?: number | null;
}

/** A linha de recurso da instrução (a `instrucao_recursos` do AupusProject) */
export interface CreateRecursoInstrucaoApiData {
  recurso_id: string;
  /** Quantos (pessoas, equipamentos, unidades). Vazio = 1 */
  quantidade?: number | null;
  /** Horas de uso de cada um (cobrança por hora ou diária) */
  duracao_horas?: number | null;
  /** Fração: 0,10 = 10% (só material) */
  fator_perda?: number | null;
  /** Faturamento direto: fora do custo */
  fornecido_pelo_cliente?: boolean;
  distancia_km?: number | null;
  /** Vazio = o preço do cadastro */
  preco_proprio?: number | null;
}

export interface CreateMaquinarioInstrucaoApiData {
  maquinario_id: string;
  quantidade?: number | null;
  duracao_horas?: number | null;
  distancia_km?: number | null;
  preco_proprio?: number | null;
}

export interface CreateInstrucaoApiData {
  /** Vazio, o servidor gera INST-NNN */
  codigo?: string | null;
  nome: string;
  descricao?: string | null;
  /** O D+X do cronograma do AupusProject */
  frente?: string | null;
  prazo_inicio_relativo?: number;
  duracao_dias?: number;
  observacoes?: string | null;
  status?: StatusInstrucao;
  ativo?: boolean;
  sub_instrucoes?: CreateSubInstrucaoApiData[];
  recursos?: CreateRecursoInstrucaoApiData[];
  maquinarios?: CreateMaquinarioInstrucaoApiData[];
}

/** A autoria sai do token no servidor (SN-85): o corpo não diz quem criou nem quem alterou */
export type UpdateInstrucaoApiData = Partial<CreateInstrucaoApiData>;

export interface UpdateStatusInstrucaoApiData {
  status: StatusInstrucao;
  ativo?: boolean;
}

export interface AssociarAnomaliaApiData {
  anomalia_id: string;
  observacoes?: string;
}

export interface AssociarSolicitacaoApiData {
  solicitacao_id: string;
  observacoes?: string;
}

// DTOs de resposta

export interface UsuarioResumoDto {
  id: string;
  nome: string;
  email?: string;
}

export interface SubInstrucaoApiResponse {
  id: string;
  descricao: string;
  obrigatoria: boolean;
  tipo?: DisciplinaDoPasso | null;
  duracao_horas?: number | null;
  ordem?: number;
  registro?: RegistroDoPasso;
  exige_foto?: boolean;
  unidade?: string | null;
  valor_minimo?: number | null;
  valor_maximo?: number | null;
  created_at: Date;
  updated_at: Date;
}

/** O custo aberto da linha, a conta do servidor (custo-da-instrucao.ts) */
interface CustoDaLinhaApi {
  /** Quantas unidades da cobrança: diárias, metros com a perda, km */
  unidades: number;
  /** O preço de uma unidade que a conta usou (o próprio, se houver) */
  preco_base: number | null;
  preco_cadastro: number | null;
  /** Nulo sem preço (nunca zero); zero no fornecido pelo cliente */
  subtotal: number | null;
}

/**
 * O item como a linha o traz: o resumo e o preço de uma unidade. O cadastro
 * inteiro (investimento, custos anuais) não vem: o detalhe da instrução se lê
 * com `manutencao.view`, e o cadastro pede `recursos.manage`.
 */
export type RecursoDaLinha = Pick<
  RecursoApiResponse,
  'id' | 'nome' | 'categoria' | 'unidade' | 'base_calculo' | 'rubrica' | 'horas_por_diaria' | 'ativo' | 'preco_base' | 'custo_origem'
> & { deleted_at?: string | null };

export type MaquinarioDaLinha = Pick<
  MaquinarioApiResponse,
  'id' | 'nome' | 'tipo' | 'base_calculo' | 'rubrica' | 'horas_por_diaria' | 'ativo' | 'preco_base' | 'custo_origem'
> & { deleted_at?: string | null };

export interface RecursoInstrucaoApiResponse extends CustoDaLinhaApi {
  id: string;
  recurso_id: string;
  recurso: RecursoDaLinha;
  quantidade: number;
  duracao_horas: number;
  fator_perda: number;
  fornecido_pelo_cliente: boolean;
  distancia_km: number | null;
  preco_proprio: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface MaquinarioInstrucaoApiResponse extends CustoDaLinhaApi {
  id: string;
  maquinario_id: string;
  maquinario: MaquinarioDaLinha;
  quantidade: number;
  duracao_horas: number;
  distancia_km: number | null;
  preco_proprio: number | null;
  created_at: Date;
  updated_at: Date;
}

/** Recursos, maquinário e materiais: nulo quando uma linha do grupo não tem preço */
export interface CustoPorGrupo {
  recursos: number | null;
  maquinario: number | null;
  materiais: number | null;
}

export interface AnexoInstrucaoApiResponse {
  id: string;
  nome: string;
  tipo: TipoAnexo;
  url: string;
  tamanho?: number;
  content_type?: string;
  created_at: Date;
  updated_at: Date;
}

export interface InstrucaoApiResponse {
  id: string;
  /** SN-85: era tag */
  codigo: string;
  nome: string;
  descricao: string | null;
  frente: string | null;
  prazo_inicio_relativo: number;
  duracao_dias: number;
  observacoes?: string | null;
  status: StatusInstrucao;
  ativo: boolean;
  created_at: Date;
  updated_at: Date;
  criado_por?: string;
  atualizado_por?: string;

  // Relacionamentos
  usuario_criador?: UsuarioResumoDto;
  usuario_atualizador?: UsuarioResumoDto;

  // Sub-estruturas (só no detalhe)
  sub_instrucoes?: SubInstrucaoApiResponse[];
  recursos?: RecursoInstrucaoApiResponse[];
  maquinarios?: MaquinarioInstrucaoApiResponse[];
  anexos?: AnexoInstrucaoApiResponse[];

  /** O valor da instrução por grupo e o total, do servidor (só no detalhe) */
  custo_por_grupo?: CustoPorGrupo;
  custo?: number | null;
  /** A soma das durações dos passos, em horas */
  horas_dos_passos?: number;

  // Contadores
  total_sub_instrucoes?: number;
  total_recursos?: number;
  total_maquinarios?: number;
  total_anexos?: number;
  total_tarefas_derivadas?: number;
}

export interface DashboardInstrucoesDto {
  total_instrucoes: number;
  instrucoes_ativas: number;
  instrucoes_inativas: number;
  instrucoes_em_revisao: number;
  instrucoes_arquivadas: number;
  total_sub_instrucoes: number;
  total_recursos: number;
  total_maquinarios: number;
  total_tarefas_derivadas: number;
}

export interface QueryInstrucoesApiParams {
  search?: string;
  status?: StatusInstrucao;
  ativo?: boolean;
  /** A frente de trabalho, exata */
  frente?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface InstrucoesListApiResponse {
  data: InstrucaoApiResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/** Opção de combobox a partir de uma instrução. */
export interface OpcaoDeInstrucao {
  value: string;
  label: string;
}

/**
 * A forma única de virar opção de combobox.
 *
 * O `.trim()` no id não é decorativo: o banco convive com ids de 25 chars (os
 * antigos, de `cuid()`) e de 26, e o `Combobox` casa opção com valor por
 * igualdade exata — um lado aparado e o outro não deixa a caixa em branco com
 * a instrução salva. Havia três cópias desta mesma linha, uma delas sem o
 * trim.
 */
export const opcaoDaInstrucao = (
  instrucao: Pick<InstrucaoApiResponse, 'id' | 'nome'> & { codigo?: string | null },
): OpcaoDeInstrucao => ({
  value: (instrucao.id || '').trim(),
  label: `${instrucao.codigo ? instrucao.codigo + ' - ' : ''}${instrucao.nome}`,
});

export interface AnomaliaAssociadaResponse {
  id: string;
  anomalia_id: string;
  instrucao_id: string;
  observacoes?: string;
  created_at: Date;
  anomalia: {
    id: string;
    descricao: string;
    status: string;
    prioridade: string;
  };
}

export interface SolicitacaoAssociadaResponse {
  id: string;
  solicitacao_id: string;
  instrucao_id: string;
  observacoes?: string;
  created_at: Date;
  solicitacao: {
    id: string;
    titulo: string;
    status: string;
    prioridade: string;
  };
}

/** O vínculo recém-criado (POST /instrucoes/:id/anomalias): a linha, sem a anomalia embutida. */
export type AssociacaoDeAnomaliaApiResponse = Omit<AnomaliaAssociadaResponse, 'anomalia'> & { created_by?: string | null };

/** O vínculo recém-criado (POST /instrucoes/:id/solicitacoes): a linha, sem a solicitação embutida. */
export type AssociacaoDeSolicitacaoApiResponse = Omit<SolicitacaoAssociadaResponse, 'solicitacao'> & { created_by?: string | null };

/** Tarefa que nasceu desta instrução (GET /instrucoes/:id/tarefas), com o plano e o equipamento resumidos. */
export type TarefaDerivadaApiResponse = Omit<TarefaApiResponse, 'plano_manutencao' | 'equipamento'> & {
  plano_manutencao?: { id: string; nome: string; versao: string } | null;
  equipamento?: { id: string; nome: string; tipo_equipamento?: string | null; classificacao: string } | null;
};

// ============================================================================
// O PAYLOAD: LISTA BRANCA
// ============================================================================

/** Os campos que o DTO da instrução aceita. O resto do formulário fica de fora. */
const CAMPOS_DA_INSTRUCAO = [
  'codigo', 'nome', 'descricao', 'frente', 'prazo_inicio_relativo', 'duracao_dias',
  'observacoes', 'status', 'ativo',
] as const;

const numeroOuNulo = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

const idAparado = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

/**
 * O que vai para a API, por lista BRANCA. O BaseModal semeia o formulário com a
 * instrução inteira, e o `forbidNonWhitelisted` do backend recusa com 400 o
 * campo que o DTO não tem. Antes cada tela tirava por lista negra (três cópias):
 * campo novo na resposta (o custo, o total de maquinários) voltava no PUT e o
 * salvar quebrava. Aqui só entra o que o DTO aceita, também nas listas, que o
 * backend troca inteiras (os ids, created_at e o recurso embutido ficam fora).
 */
export function paraApi(dados: CreateInstrucaoApiData | UpdateInstrucaoApiData | Record<string, unknown>): UpdateInstrucaoApiData {
  const origem = dados as Record<string, unknown>;
  const payload: Record<string, unknown> = {};
  for (const campo of CAMPOS_DA_INSTRUCAO) if (origem[campo] !== undefined) payload[campo] = origem[campo];
  // O campo numérico do formulário guarda texto. Apagado é o padrão (D+0, 1 dia), não "mantém": quem
  // apagou o 5 do D+X e salvou quer D+0, e o campo mostra 0 de dica
  const PADRAO = { prazo_inicio_relativo: 0, duracao_dias: 1 } as const;
  for (const campo of ['prazo_inicio_relativo', 'duracao_dias'] as const) {
    if (campo in payload) payload[campo] = numeroOuNulo(payload[campo]) ?? PADRAO[campo];
  }

  const passos = origem.sub_instrucoes as CreateSubInstrucaoApiData[] | undefined;
  if (Array.isArray(passos)) {
    // A ordem é a posição na lista: arrastar reordena o array, e o `ordem` antigo desfaria a ordem nova (SN-12)
    payload.sub_instrucoes = passos.map((passo, indice) => ({
      descricao: passo.descricao,
      obrigatoria: Boolean(passo.obrigatoria),
      tipo: passo.tipo || null,
      duracao_horas: numeroOuNulo(passo.duracao_horas),
      ordem: indice + 1,
      registro: passo.registro ?? 'VERIFICACAO',
      exige_foto: Boolean(passo.exige_foto),
      // A API recusa unidade e faixa no passo de verificação: o passo que
      // deixou de ser leitura não leva o que sobrou dos campos escondidos
      ...(passo.registro === 'LEITURA' && {
        unidade: passo.unidade?.trim() || null,
        valor_minimo: passo.valor_minimo ?? null,
        valor_maximo: passo.valor_maximo ?? null,
      }),
    }));
  }

  const recursos = origem.recursos as CreateRecursoInstrucaoApiData[] | undefined;
  if (Array.isArray(recursos)) {
    payload.recursos = recursos.map((linha) => ({
      recurso_id: idAparado(linha.recurso_id),
      quantidade: numeroOuNulo(linha.quantidade),
      duracao_horas: numeroOuNulo(linha.duracao_horas),
      fator_perda: numeroOuNulo(linha.fator_perda),
      fornecido_pelo_cliente: Boolean(linha.fornecido_pelo_cliente),
      distancia_km: numeroOuNulo(linha.distancia_km),
      preco_proprio: numeroOuNulo(linha.preco_proprio),
    }));
  }

  const maquinarios = origem.maquinarios as CreateMaquinarioInstrucaoApiData[] | undefined;
  if (Array.isArray(maquinarios)) {
    payload.maquinarios = maquinarios.map((linha) => ({
      maquinario_id: idAparado(linha.maquinario_id),
      quantidade: numeroOuNulo(linha.quantidade),
      duracao_horas: numeroOuNulo(linha.duracao_horas),
      distancia_km: numeroOuNulo(linha.distancia_km),
      preco_proprio: numeroOuNulo(linha.preco_proprio),
    }));
  }

  return payload as UpdateInstrucaoApiData;
}

// ============================================================================
// SERVICO DE API PARA INSTRUCOES
// ============================================================================

export class InstrucoesApiService {
  private readonly baseEndpoint = '/instrucoes';

  // CRUD

  async create(data: CreateInstrucaoApiData | Record<string, unknown>): Promise<InstrucaoApiResponse> {
    const response = await api.post<InstrucaoApiResponse>(this.baseEndpoint, paraApi(data));
    return response.data;
  }

  async findAll(params?: QueryInstrucoesApiParams): Promise<InstrucoesListApiResponse> {
    const cleanParams: Record<string, unknown> = {
      page: params?.page || 1,
      limit: params?.limit || 10
    };

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (key === 'page' || key === 'limit') return;
        if (value !== undefined && value !== null) {
          if (typeof value === 'boolean') {
            if (value === true) cleanParams[key] = value;
          } else if (value !== '') {
            cleanParams[key] = value;
          }
        }
      });
    }

    const response = await api.get<InstrucoesListApiResponse>(this.baseEndpoint, {
      params: cleanParams
    });
    return response.data;
  }

  /**
   * Todas as instruções ativas, para alimentar combobox.
   *
   * Pagina até a lista acabar em vez de pedir `limit: 100` e parar: o DTO do
   * backend limita `limit` a 100, então quem pedia uma página só via o
   * catálogo truncado a partir da 101ª instrução — e sem erro nenhum, o que
   * aparecia como "essa instrução sumiu do combobox".
   *
   * O teto de páginas é só um freio contra laço infinito se a paginação vier
   * quebrada; 20 × 100 cobre um catálogo de manutenção com folga.
   */
  async listarTodasAtivas(): Promise<InstrucaoApiResponse[]> {
    const LIMITE_POR_PAGINA = 100;
    const MAX_PAGINAS = 20;

    const todas: InstrucaoApiResponse[] = [];

    for (let page = 1; page <= MAX_PAGINAS; page++) {
      const resposta = await this.findAll({
        page,
        limit: LIMITE_POR_PAGINA,
        status: 'ATIVA' as StatusInstrucao,
      });

      const lote = resposta?.data || [];
      todas.push(...lote);

      const totalDePaginas = resposta?.pagination?.pages ?? 1;
      if (lote.length < LIMITE_POR_PAGINA || page >= totalDePaginas) break;
    }

    return todas;
  }

  async findOne(id: string): Promise<InstrucaoApiResponse> {
    const response = await api.get<InstrucaoApiResponse>(`${this.baseEndpoint}/${id}`);
    return response.data;
  }

  async update(id: string, data: UpdateInstrucaoApiData | Record<string, unknown>): Promise<InstrucaoApiResponse> {
    const response = await api.put<InstrucaoApiResponse>(`${this.baseEndpoint}/${id}`, paraApi(data));
    return response.data;
  }

  /** As frentes já usadas, para o formulário sugerir */
  async frentes(): Promise<string[]> {
    const response = await api.get<string[]>(`${this.baseEndpoint}/frentes`);
    return response.data;
  }

  async remove(id: string): Promise<void> {
    await api.delete(`${this.baseEndpoint}/${id}`);
  }

  // Operacoes especificas

  async updateStatus(id: string, data: UpdateStatusInstrucaoApiData): Promise<InstrucaoApiResponse> {
    const response = await api.put<InstrucaoApiResponse>(`${this.baseEndpoint}/${id}/status`, data);
    return response.data;
  }

  async getDashboard(): Promise<DashboardInstrucoesDto> {
    const response = await api.get<DashboardInstrucoesDto>(`${this.baseEndpoint}/dashboard`);
    return response.data;
  }

  async listarTarefasDerivadas(id: string): Promise<TarefaDerivadaApiResponse[]> {
    const response = await api.get<TarefaDerivadaApiResponse[]>(`${this.baseEndpoint}/${id}/tarefas`);
    return response.data;
  }

  // Anomalias

  async associarAnomalia(id: string, data: AssociarAnomaliaApiData): Promise<AssociacaoDeAnomaliaApiResponse> {
    const response = await api.post<AssociacaoDeAnomaliaApiResponse>(`${this.baseEndpoint}/${id}/anomalias`, data);
    return response.data;
  }

  async listarAnomalias(id: string): Promise<AnomaliaAssociadaResponse[]> {
    const response = await api.get<AnomaliaAssociadaResponse[]>(`${this.baseEndpoint}/${id}/anomalias`);
    return response.data;
  }

  async desassociarAnomalia(id: string, anomaliaId: string): Promise<void> {
    await api.delete(`${this.baseEndpoint}/${id}/anomalias/${anomaliaId}`);
  }

  // Solicitacoes

  async associarSolicitacao(id: string, data: AssociarSolicitacaoApiData): Promise<AssociacaoDeSolicitacaoApiResponse> {
    const response = await api.post<AssociacaoDeSolicitacaoApiResponse>(`${this.baseEndpoint}/${id}/solicitacoes`, data);
    return response.data;
  }

  async listarSolicitacoes(id: string): Promise<SolicitacaoAssociadaResponse[]> {
    const response = await api.get<SolicitacaoAssociadaResponse[]>(`${this.baseEndpoint}/${id}/solicitacoes`);
    return response.data;
  }

  async desassociarSolicitacao(id: string, solicitacaoId: string): Promise<void> {
    await api.delete(`${this.baseEndpoint}/${id}/solicitacoes/${solicitacaoId}`);
  }

  // Anexos

  async getAnexos(instrucaoId: string): Promise<AnexoInstrucaoApiResponse[]> {
    const response = await api.get<AnexoInstrucaoApiResponse[]>(
      `${this.baseEndpoint}/${instrucaoId}/anexos`
    );
    return response.data;
  }

  async uploadAnexo(
    instrucaoId: string,
    file: File,
    descricao?: string,
    usuarioId?: string
  ): Promise<AnexoInstrucaoApiResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (descricao) formData.append('descricao', descricao);
    if (usuarioId) formData.append('usuario_id', usuarioId);

    const response = await api.post<AnexoInstrucaoApiResponse>(
      `${this.baseEndpoint}/${instrucaoId}/anexos/upload`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    );
    return response.data;
  }

  async downloadAnexo(instrucaoId: string, anexoId: string): Promise<Blob> {
    const response = await api.get(
      `${this.baseEndpoint}/${instrucaoId}/anexos/${anexoId}/download`,
      { responseType: 'blob' }
    );
    return response.data;
  }

  async deleteAnexo(instrucaoId: string, anexoId: string): Promise<void> {
    await api.delete(`${this.baseEndpoint}/${instrucaoId}/anexos/${anexoId}`);
  }
}

// ============================================================================
// INSTANCIA SINGLETON
// ============================================================================

export const instrucoesApi = new InstrucoesApiService();
