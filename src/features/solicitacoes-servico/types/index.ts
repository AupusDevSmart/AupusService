// src/features/solicitacoes-servico/types/index.ts
import { BaseEntity, type BaseFilters as BaseFiltersType, ModalMode } from '@/types/base';

// Enums baseados na validação da API (não no schema Prisma)
export type TipoSolicitacaoServico =
  | 'INSTALACAO'
  | 'MANUTENCAO_PREVENTIVA'
  | 'MANUTENCAO_CORRETIVA'
  | 'INSPECAO'
  | 'CALIBRACAO'
  | 'MODIFICACAO'
  | 'REMOCAO'
  | 'CONSULTORIA'
  | 'TREINAMENTO'
  | 'OUTRO';

export type PrioridadeSolicitacao = 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';

export type OrigemSolicitacao =
  | 'PORTAL'
  | 'EMAIL'
  | 'TELEFONE'
  | 'PRESENCIAL'
  | 'SISTEMA'
  | 'APLICATIVO';

export type StatusSolicitacaoServico = 'REGISTRADA' | 'PROGRAMADA' | 'FINALIZADA';

// Interface principal da solicitação
export interface SolicitacaoServico extends BaseEntity {
  numero: string;
  titulo: string;
  descricao: string;
  tipo: TipoSolicitacaoServico;
  prioridade: PrioridadeSolicitacao;
  status: StatusSolicitacaoServico;
  origem: OrigemSolicitacao;

  // Localização
  planta_id?: string;
  unidade_id?: string;
  proprietario_id?: string;
  area?: string;
  local?: string;
  local_especifico?: string;
  equipamento_id?: string;

  // Solicitante
  solicitante_nome: string;
  solicitante_email?: string;
  solicitante_telefone?: string;
  solicitante_departamento?: string;
  solicitante_id?: string;

  // Datas e prazos
  data_solicitacao?: string;
  data_necessidade?: string;
  prazo_esperado?: number;
  data_inicio_previsto?: string;
  data_fim_previsto?: string;
  prazo_execucao?: number;
  data_prevista_inicio?: string;
  data_prevista_fim?: string;

  // Detalhes
  justificativa?: string;
  beneficios_esperados?: string;
  riscos_nao_execucao?: string;
  requisitos_especiais?: string;
  riscos_identificados?: string;
  // observacoes?: string; // Campo removido - backend não aceita

  // Recursos necessários
  tempo_estimado?: number;
  custo_estimado?: number;
  materiais_necessarios?: string;
  ferramentas_necessarias?: string;
  mao_obra_necessaria?: string;

  // Relacionamentos
  programacao_os_id?: string;
  os_id?: string;
  ordem_servico_id?: string;
  departamento?: string;
  contato?: string;

  // Objetos relacionados
  planta?: any;
  unidade?: any;
  proprietario?: any;
  equipamento?: any;
  usuario?: any;
  historico?: HistoricoSolicitacao[];
  comentarios?: ComentarioSolicitacao[];

  // Timestamps
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
}

// Interface para histórico
export interface HistoricoSolicitacao {
  id: string;
  solicitacao_id: string;
  acao: string;
  usuario?: string;
  usuario_nome?: string;
  usuario_id?: string;
  data: string;
  // observacoes?: string; // Campo removido - backend não aceita
  status_anterior?: StatusSolicitacaoServico;
  status_novo?: StatusSolicitacaoServico;
  dados_extras?: any;
}

// Interface para comentários
export interface ComentarioSolicitacao {
  id: string;
  solicitacao_id: string;
  comentario: string;
  autor?: string;
  autor_id?: string;
  usuario_nome?: string;
  usuario_id?: string;
  created_at: string;
  updated_at?: string;
}

// Form data para criação/edição
export interface SolicitacaoServicoFormData {
  titulo: string;
  descricao: string;
  tipo: TipoSolicitacaoServico;
  prioridade?: PrioridadeSolicitacao;
  origem?: OrigemSolicitacao;

  // Localização
  planta_id?: string;
  unidade_id?: string;
  proprietario_id?: string;
  area?: string;
  local?: string;
  local_especifico?: string;
  equipamento_id?: string;

  // Solicitante
  solicitante_nome: string;
  solicitante_email?: string;
  solicitante_telefone?: string;
  solicitante_departamento?: string;

  // Datas e prazos
  data_necessidade?: string;
  prazo_esperado?: number;
  data_inicio_previsto?: string;
  data_fim_previsto?: string;

  // Detalhes
  justificativa: string;
  beneficios_esperados?: string;
  riscos_nao_execucao?: string;
  requisitos_especiais?: string;
  // observacoes?: string; // Campo removido - backend não aceita

  // Recursos
  tempo_estimado?: number;
  custo_estimado?: number;
  materiais_necessarios?: string;
  ferramentas_necessarias?: string;
  mao_obra_necessaria?: string;

  // Anexos
  anexos?: File[];

  // Instrucoes vinculadas
  instrucoes_ids?: string[];
}

// Filtros para a página
export interface SolicitacoesFilters extends BaseFiltersType {
  periodo?: string;
  status?: string;
  tipo?: string;
  prioridade?: string;
  origem?: string;
  planta?: string;
}

// Estado do modal
export interface ModalState {
  isOpen: boolean;
  mode: ModalMode;
  solicitacao: SolicitacaoServico | null;
}

export { type ModalMode };

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export interface AdicionarComentarioDto {
  comentario: string;
  usuario_nome: string;
  usuario_id: string;
}
