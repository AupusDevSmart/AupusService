// src/services/solicitacoes-servico.service.ts
import { api } from '@/config/api';
import {
  SolicitacaoServico,
  SolicitacaoServicoFormData,
  SolicitacoesFilters,
  EnviarSolicitacaoDto,
  AnalisarSolicitacaoDto,
  AprovarSolicitacaoDto,
  RejeitarSolicitacaoDto,
  CancelarSolicitacaoDto,
  ConcluirSolicitacaoDto,
  AdicionarComentarioDto,
  ComentarioSolicitacao,
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
  rascunhos: number;
  aguardando: number;
  emAnalise: number;
  aprovadas: number;
  rejeitadas: number;
  emExecucao: number;
  concluidas: number;
  canceladas: number;
  urgentes: number;
  porTipo: Record<string, number>;
  porPrioridade: Record<string, number>;
  taxaAprovacao: number;
}

export interface CreateSolicitacaoDto {
  titulo: string;
  descricao: string;
  tipo: string;
  prioridade?: string;
  origem?: string;
  planta_id?: string;
  area?: string;
  local?: string;
  local_especifico?: string;
  equipamento_id?: string;
  solicitante_nome: string;
  solicitante_email?: string;
  solicitante_telefone?: string;
  solicitante_departamento?: string;
  justificativa: string;
  beneficios_esperados?: string;
  riscos_nao_execucao?: string;
  requisitos_especiais?: string;
  observacoes?: string;
  data_necessidade?: string;
  prazo_esperado?: number;
  tempo_estimado?: number;
  custo_estimado?: number;
  materiais_necessarios?: string;
  ferramentas_necessarias?: string;
  mao_obra_necessaria?: string;
}

export interface UpdateSolicitacaoDto extends Partial<CreateSolicitacaoDto> {}

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
    if (filters.planta && filters.planta !== 'all') params.append('planta', filters.planta);

    const url = `${this.baseUrl}?${params}`;
    const response = await api.get(url);

    return response.data;
  }

  async findOne(id: string): Promise<SolicitacaoServico> {
    const response = await api.get(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async create(data: SolicitacaoServicoFormData): Promise<SolicitacaoServico> {
    const createDto: CreateSolicitacaoDto = {
      titulo: data.titulo,
      descricao: data.descricao,
      tipo: data.tipo,
      prioridade: data.prioridade,
      origem: data.origem,
      planta_id: data.planta_id,
      area: data.area,
      local: data.local,
      local_especifico: data.local_especifico,
      equipamento_id: data.equipamento_id,
      solicitante_nome: data.solicitante_nome,
      solicitante_email: data.solicitante_email,
      solicitante_telefone: data.solicitante_telefone,
      solicitante_departamento: data.solicitante_departamento,
      justificativa: data.justificativa,
      beneficios_esperados: data.beneficios_esperados,
      riscos_nao_execucao: data.riscos_nao_execucao,
      requisitos_especiais: data.requisitos_especiais,
      observacoes: data.observacoes,
      data_necessidade: data.data_necessidade,
      prazo_esperado: data.prazo_esperado,
      tempo_estimado: data.tempo_estimado,
      custo_estimado: data.custo_estimado,
      materiais_necessarios: data.materiais_necessarios,
      ferramentas_necessarias: data.ferramentas_necessarias,
      mao_obra_necessaria: data.mao_obra_necessaria,
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
      justificativa: data.justificativa,
      beneficios_esperados: data.beneficios_esperados,
      riscos_nao_execucao: data.riscos_nao_execucao,
      requisitos_especiais: data.requisitos_especiais,
      observacoes: data.observacoes,
      tempo_estimado: data.tempo_estimado,
      custo_estimado: data.custo_estimado,
      materiais_necessarios: data.materiais_necessarios,
      ferramentas_necessarias: data.ferramentas_necessarias,
      mao_obra_necessaria: data.mao_obra_necessaria,
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
  // 🔄 3. AÇÕES DE WORKFLOW
  // ==========================================

  async enviar(id: string, dto?: EnviarSolicitacaoDto): Promise<SolicitacaoServico> {
    const response = await api.patch(`${this.baseUrl}/${id}/enviar`, dto || {});
    return response.data;
  }

  async analisar(id: string, dto: AnalisarSolicitacaoDto): Promise<SolicitacaoServico> {
    const response = await api.patch(`${this.baseUrl}/${id}/analisar`, dto);
    return response.data;
  }

  async aprovar(id: string, dto?: AprovarSolicitacaoDto): Promise<SolicitacaoServico> {
    const response = await api.patch(`${this.baseUrl}/${id}/aprovar`, dto || {});
    return response.data;
  }

  async rejeitar(id: string, dto: RejeitarSolicitacaoDto): Promise<SolicitacaoServico> {
    const response = await api.patch(`${this.baseUrl}/${id}/rejeitar`, dto);
    return response.data;
  }

  async cancelar(id: string, dto: CancelarSolicitacaoDto): Promise<SolicitacaoServico> {
    const response = await api.patch(`${this.baseUrl}/${id}/cancelar`, dto);
    return response.data;
  }

  async concluir(id: string, dto?: ConcluirSolicitacaoDto): Promise<SolicitacaoServico> {
    const response = await api.patch(`${this.baseUrl}/${id}/concluir`, dto || {});
    return response.data;
  }

  // ==========================================
  // 💬 4. COMENTÁRIOS
  // ==========================================

  async getComentarios(id: string): Promise<ComentarioSolicitacao[]> {
    const response = await api.get(`${this.baseUrl}/${id}/comentarios`);
    return response.data;
  }

  async adicionarComentario(
    id: string,
    dto: AdicionarComentarioDto
  ): Promise<ComentarioSolicitacao> {
    const response = await api.post(`${this.baseUrl}/${id}/comentarios`, dto);
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
