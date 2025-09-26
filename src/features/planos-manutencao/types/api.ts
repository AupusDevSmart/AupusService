 // src/features/planos-manutencao/types/api.ts
// API-specific types that map directly to the backend API

export type StatusPlano = 'ATIVO' | 'INATIVO' | 'EM_REVISAO' | 'ARQUIVADO';

export interface CreatePlanoManutencaoData {
  equipamento_id: string;           // Obrigatório - ID do equipamento
  nome: string;                     // Obrigatório - Nome do plano (máx 200 chars)
  descricao?: string;               // Opcional - Descrição do plano
  versao?: string;                  // Opcional - Versão (máx 20 chars, padrão: "1.0")
  status?: StatusPlano;             // Opcional - Status do plano (padrão: ATIVO)
  ativo?: boolean;                  // Opcional - Flag ativo (padrão: true)
  data_vigencia_inicio?: string;    // Opcional - Data de início (ISO string)
  data_vigencia_fim?: string;       // Opcional - Data de fim (ISO string)
  observacoes?: string;             // Opcional - Observações
  criado_por?: string;              // Opcional - ID do usuário criador
}

export interface UpdatePlanoManutencaoData extends Partial<CreatePlanoManutencaoData> {}

export interface UpdateStatusPlanoData {
  status: StatusPlano;
  // NOTA: Campo 'ativo' removido pois a API não aceita mais este campo
  // O status do campo 'ativo' é inferido automaticamente pelo backend baseado no 'status'
  atualizado_por?: string;
}

export interface DuplicarPlanoData {
  equipamento_destino_id: string;   // Obrigatório - ID do equipamento destino
  novo_nome?: string;               // Opcional - Novo nome do plano (máx 200 chars)
  novo_prefixo_tag?: string;        // Opcional - Novo prefixo de tag para tarefas
  criado_por?: string;              // Opcional - ID do usuário criador
}

export interface PlanoManutencaoResponse {
  id: string;
  equipamento_id: string;
  nome: string;
  descricao?: string;
  versao: string;
  status: StatusPlano;
  ativo: boolean;
  data_vigencia_inicio?: Date;
  data_vigencia_fim?: Date;
  observacoes?: string;
  criado_por?: string;
  atualizado_por?: string;
  created_at: Date;
  updated_at: Date;
  
  // Relacionamentos
  equipamento?: EquipamentoResumo;
  usuario_criador?: UsuarioResumo;
  usuario_atualizador?: UsuarioResumo;
  
  // Tarefas (opcional baseado na consulta)
  tarefas?: TarefaResumo[];
  
  // Estatísticas calculadas
  total_tarefas?: number;
  tarefas_ativas?: number;
  tempo_total_estimado?: number;
  criticidade_media?: number;
}

export interface EquipamentoResumo {
  id: string;
  nome: string;
  fabricante?: string;
  modelo?: string;
  criticidade?: string;
  planta?: {
    id: string;
    nome: string;
  };
}

export interface UsuarioResumo {
  id: string;
  nome: string;
  email?: string;
}

export interface TarefaResumo {
  id: string;
  tag: string;
  nome: string;
  categoria: string;
  tipo_manutencao: string;
  status: string;
  ativo: boolean;
  ordem: number;
  criticidade: number;
  tempo_estimado: number;
}

export interface PlanoResumo {
  id: string;
  nome: string;
  versao: string;
  status: StatusPlano;
  ativo: boolean;
  total_tarefas: number;
  tarefas_ativas: number;
  tarefas_inativas: number;
  tempo_total_estimado: number;
  criticidade_media: number;
  
  // Distribuição por tipo
  distribuicao_tipos: {
    preventiva: number;
    preditiva: number;
    corretiva: number;
    inspecao: number;
    visita_tecnica: number;
  };
  
  // Distribuição por categoria
  distribuicao_categorias: {
    mecanica: number;
    eletrica: number;
    instrumentacao: number;
    lubrificacao: number;
    limpeza: number;
    inspecao: number;
    calibracao: number;
    outros: number;
  };
}

export interface DashboardPlanos {
  total_planos: number;
  planos_ativos: number;
  planos_inativos: number;
  planos_em_revisao: number;
  planos_arquivados: number;
  equipamentos_com_plano: number;
  
  // Estatísticas gerais
  total_tarefas_todos_planos: number;
  media_tarefas_por_plano: number;
  tempo_total_estimado_geral: number;
  
  // Distribuição por tipo de manutenção
  distribuicao_tipos: {
    preventiva: number;
    preditiva: number;
    corretiva: number;
    inspecao: number;
    visita_tecnica: number;
  };
}

export interface QueryPlanosParams {
  search?: string;                  // Busca em nome, descrição, nome do equipamento
  equipamento_id?: string;          // Filtrar por ID do equipamento
  status?: StatusPlano;             // Filtrar por status
  ativo?: boolean;                  // Filtrar por flag ativo
  criado_por?: string;              // Filtrar por usuário criador
  data_vigencia_inicio?: string;    // Filtrar por data de vigência início
  data_vigencia_fim?: string;       // Filtrar por data de vigência fim
  page?: number;                    // Página (padrão: 1)
  limit?: number;                   // Itens por página (1-100, padrão: 10)
  sort_by?: string;                 // Campo de ordenação (padrão: 'created_at')
  sort_order?: 'asc' | 'desc';      // Direção da ordenação (padrão: 'desc')
  incluir_tarefas?: boolean;        // Incluir tarefas na resposta
}

export interface PlanosListResponse {
  data: PlanoManutencaoResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}