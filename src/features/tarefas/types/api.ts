// src/features/tarefas/types/api.ts
// API-specific types that map directly to the backend API

export type StatusTarefa = 'ATIVA' | 'INATIVA' | 'EM_REVISAO' | 'ARQUIVADA';
export type CategoriaTarefa = 'MECANICA' | 'ELETRICA' | 'INSTRUMENTACAO' | 'LUBRIFICACAO' | 'LIMPEZA' | 'INSPECAO' | 'CALIBRACAO' | 'OUTROS';
export type TipoManutencao = 'PREVENTIVA' | 'PREDITIVA' | 'CORRETIVA' | 'INSPECAO' | 'VISITA_TECNICA';
export type FrequenciaTarefa = 'DIARIA' | 'SEMANAL' | 'QUINZENAL' | 'MENSAL' | 'BIMESTRAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL' | 'PERSONALIZADA';
export type CondicaoAtivo = 'PARADO' | 'FUNCIONANDO' | 'QUALQUER';
export type TipoAnexo = 'MANUAL' | 'PROCEDIMENTO' | 'MODELO_RELATORIO' | 'OUTROS';

export interface CreateSubTarefaData {
  descricao: string;
  obrigatoria?: boolean;
  tempo_estimado?: number;
  ordem: number;
}

export interface CreateRecursoTarefaData {
  tipo: 'PECA' | 'MATERIAL' | 'FERRAMENTA' | 'TECNICO' | 'VIATURA';
  descricao: string;
  quantidade?: number;
  unidade?: string;
  obrigatorio?: boolean;
}

export interface CreateTarefaData {
  plano_manutencao_id: string;        // Obrigatório: ID do plano de manutenção
  tag?: string;                       // Opcional: Auto-gerado se não fornecido
  nome: string;                       // Obrigatório: Nome da tarefa (máx 200 chars)
  descricao: string;                  // Obrigatório: Descrição da tarefa
  categoria: CategoriaTarefa;         // Obrigatório: Categoria da tarefa
  tipo_manutencao: TipoManutencao;    // Obrigatório: Tipo de manutenção
  frequencia: FrequenciaTarefa;       // Obrigatório: Frequência
  frequencia_personalizada?: number;  // Opcional: Frequência customizada em dias
  condicao_ativo: CondicaoAtivo;      // Obrigatório: Condição do ativo
  criticidade: number;                // Obrigatório: Criticidade (1-5)
  duracao_estimada: number;           // Obrigatório: Duração estimada
  tempo_estimado: number;             // Obrigatório: Tempo estimado em minutos
  ordem: number;                      // Obrigatório: Ordem da tarefa no plano
  planejador?: string;                // Opcional: Nome do planejador
  responsavel?: string;               // Opcional: Pessoa responsável
  observacoes?: string;               // Opcional: Observações
  status?: StatusTarefa;              // Opcional: Status (padrão: ATIVA)
  ativo?: boolean;                    // Opcional: Flag ativo (padrão: true)
  criado_por?: string;                // Opcional: ID do usuário criador
  equipamento_id?: string;            // Opcional: ID do equipamento
  planta_id?: string;                 // Opcional: ID da planta
  data_ultima_execucao: Date;         // Obrigatório: Data da última execução
  numero_execucoes?: number;          // Opcional: Número de execuções (padrão: 0)
  sub_tarefas?: CreateSubTarefaData[]; // Opcional: Array de sub-tarefas
  recursos?: CreateRecursoTarefaData[]; // Opcional: Array de recursos
}

export interface UpdateTarefaData extends Partial<CreateTarefaData> {}

export interface UpdateStatusTarefaData {
  status: StatusTarefa;
  ativo?: boolean;
  atualizado_por?: string;
}

export interface ReordenarTarefaData {
  nova_ordem: number;
  atualizado_por?: string;
}

export interface SubTarefaResponse {
  id: string;
  descricao: string;
  obrigatoria: boolean;
  tempo_estimado?: number;
  ordem: number;
  tarefa_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface RecursoTarefaResponse {
  id: string;
  tipo: 'PECA' | 'MATERIAL' | 'FERRAMENTA' | 'TECNICO' | 'VIATURA';
  descricao: string;
  quantidade?: number;
  unidade?: string;
  obrigatorio: boolean;
  tarefa_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface AnexoTarefaResponse {
  id: string;
  nome: string;
  tipo: TipoAnexo;
  url: string;
  tamanho?: number;
  content_type?: string;
  tarefa_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface TarefaResponse {
  id: string;
  plano_manutencao_id: string;
  tag: string;                        // TAG única da tarefa
  nome: string;
  descricao: string;
  categoria: CategoriaTarefa;
  tipo_manutencao: TipoManutencao;
  frequencia: FrequenciaTarefa;
  frequencia_personalizada?: number;
  condicao_ativo: CondicaoAtivo;
  criticidade: number;
  duracao_estimada: number;
  tempo_estimado: number;
  ordem: number;
  planta_id?: string;
  equipamento_id?: string;
  planejador?: string;
  responsavel?: string;
  observacoes?: string;
  status: StatusTarefa;
  ativo: boolean;
  created_at: Date;
  updated_at: Date;
  criado_por?: string;
  atualizado_por?: string;
  data_ultima_execucao: Date;         // Data da última execução
  numero_execucoes: number;           // Número de execuções
  
  // Relacionamentos
  plano_manutencao?: PlanoResumo;
  planta?: PlantaResumo;
  equipamento?: EquipamentoResumo;
  usuario_criador?: UsuarioResumo;
  usuario_atualizador?: UsuarioResumo;
  
  // Sub-estruturas
  sub_tarefas?: SubTarefaResponse[];
  recursos?: RecursoTarefaResponse[];
  anexos?: AnexoTarefaResponse[];
  
  // Contadores
  total_sub_tarefas?: number;
  total_recursos?: number;
  total_anexos?: number;
}

export interface PlanoResumo {
  id: string;
  nome: string;
  versao: string;
  status: string;
}

export interface PlantaResumo {
  id: string;
  nome: string;
  localizacao?: string;
}

export interface EquipamentoResumo {
  id: string;
  nome: string;
  fabricante?: string;
  modelo?: string;
  tipo?: string;
}

export interface UsuarioResumo {
  id: string;
  nome: string;
  email?: string;
}

export interface DashboardTarefas {
  total_tarefas: number;
  tarefas_ativas: number;
  tarefas_inativas: number;
  tarefas_em_revisao: number;
  tarefas_arquivadas: number;
  
  // Por criticidade
  criticidade_muito_alta: number;  // Nível 5
  criticidade_alta: number;        // Nível 4
  criticidade_media: number;       // Nível 3
  criticidade_baixa: number;       // Nível 2
  criticidade_muito_baixa: number; // Nível 1
  
  // Por tipo de manutenção
  distribuicao_tipos: {
    preventiva: number;
    preditiva: number;
    corretiva: number;
    inspecao: number;
    visita_tecnica: number;
  };
  
  // Por categoria
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
  
  // Estatísticas gerais
  tempo_total_estimado: number;
  media_tempo_por_tarefa: number;
  media_criticidade: number;
  total_sub_tarefas: number;
  total_recursos: number;
}

export interface QueryTarefasParams {
  search?: string;                  // Busca em tag, nome, descrição, responsável, planejador
  plano_id?: string;                // Filtrar por ID do plano de manutenção
  equipamento_id?: string;          // Filtrar por ID do equipamento
  planta_id?: string;               // Filtrar por ID da planta
  status?: StatusTarefa;            // Filtrar por status da tarefa
  ativo?: boolean;                  // Filtrar por status ativo
  categoria?: CategoriaTarefa;      // Filtrar por categoria da tarefa
  tipo_manutencao?: TipoManutencao; // Filtrar por tipo de manutenção
  frequencia?: FrequenciaTarefa;    // Filtrar por frequência
  criticidade?: number;             // Filtrar por nível de criticidade (1-5)
  page?: number;                    // Número da página (padrão: 1)
  limit?: number;                   // Itens por página (1-100, padrão: 10)
  sort_by?: string;                 // Campo de ordenação (padrão: 'created_at')
  sort_order?: 'asc' | 'desc';      // Direção da ordenação (padrão: 'desc')
}

export interface TarefasListResponse {
  data: TarefaResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AnexoTarefaDetalhes extends AnexoTarefaResponse {
  // Extending base response with additional details if needed
}