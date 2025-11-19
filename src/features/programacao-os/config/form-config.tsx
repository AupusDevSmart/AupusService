// src/features/programacao-os/config/form-config.tsx - CORRIGIDA COM MAPEAMENTO DE GRUPOS
import type { FormField } from '@/types/base';
import { OrigemOSSelector } from '../components/OrigemOSSelector';
import { OrigemOSCard } from '../components/OrigemOSCard';
import { MateriaisCardManager } from '@/components/common/cards/MateriaisCardManager';
import { FerramentasCardManager } from '@/components/common/cards/FerramentasCardManager';
import { TecnicosCardManager } from '@/components/common/cards/TecnicosCardManager';
import { ReservaViaturaField } from '../components/ReservaViaturaField';
import { ReservaVinculadaCard } from '../components/ReservaVinculadaCard';

export const programacaoOSFormFields: FormField[] = [
  // Informações básicas - GRUPO: identificacao
  {
    key: 'numeroOS',
    label: 'Número da OS',
    type: 'text',
    placeholder: 'Gerado automaticamente',
    disabled: true,
    group: 'identificacao'
  },
  {
    key: 'descricao',
    label: 'Descrição',
    type: 'textarea',
    required: true,
    placeholder: 'Descreva o serviço a ser executado',
    group: 'identificacao',
    computeDisabled: (entity: any) => {
      return entity?.status && !['RASCUNHO', 'PENDENTE'].includes(entity.status);
    }
  },
  // {
  //   key: 'local',
  //   label: 'Local',
  //   type: 'text',
  //   required: true,
  //   placeholder: 'Local onde será executado o serviço',
  //   group: 'identificacao',
  //   computeDisabled: (entity: any) => {
  //     return entity?.status && !['RASCUNHO', 'PENDENTE'].includes(entity.status);
  //   }
  // },
  // {
  //   key: 'ativo',
  //   label: 'Ativo',
  //   type: 'text',
  //   required: true,
  //   placeholder: 'Equipamento ou ativo relacionado',
  //   group: 'identificacao',
  //   computeDisabled: (entity: any) => {
  //     return entity?.status && !['RASCUNHO', 'PENDENTE'].includes(entity.status);
  //   }
  // },

  // Origem da OS - GRUPO: origem
  {
    key: 'origem',
    label: 'Selecione a origem da Ordem de Serviço',
    type: 'custom',
    component: OrigemOSSelector,
    required: true,
    defaultValue: {
      tipo: 'MANUAL',
      anomaliaId: undefined,
      planoId: undefined,
      tarefasSelecionadas: [],
      plantaId: undefined,
      planosSelecionados: [],
      tarefasPorPlano: {}
    },
    group: 'origem',
    showOnlyOnMode: 'create'
  },
  {
    key: 'origemCard',
    label: 'Origem da Ordem de Serviço',
    type: 'custom',
    group: 'origem',
    showOnlyOnMode: ['view', 'edit'],
    render: (props: any) => {
      const { entity } = props;
      return (
        <OrigemOSCard
          origem={entity?.origem?.tipo || entity?.origem || 'MANUAL'}
          dadosOrigem={entity?.origem || entity?.dados_origem}
          anomalia={entity?.anomalia}
          tarefas={entity?.tarefas_programacao}
          planoManutencao={entity?.plano_manutencao}
          planosSelecionados={entity?.planos_selecionados}
          tarefasPorPlano={entity?.tarefas_por_plano}
        />
      );
    }
  },


  // Classificação - GRUPO: classificacao
  {
    key: 'tipo',
    label: 'Tipo de OS',
    type: 'select',
    required: true,
    options: [
      { value: 'PREVENTIVA', label: 'Preventiva' },
      { value: 'PREDITIVA', label: 'Preditiva' },
      { value: 'CORRETIVA', label: 'Corretiva' },
      { value: 'INSPECAO', label: 'Inspeção' },
      { value: 'VISITA_TECNICA', label: 'Visita Técnica' }
    ],
    group: 'classificacao',
    computeDisabled: (entity: any) => {
      return entity?.status && !['RASCUNHO', 'PENDENTE'].includes(entity.status);
    }
  },
  {
    key: 'prioridade',
    label: 'Prioridade',
    type: 'select',
    required: true,
    options: [
      { value: 'BAIXA', label: 'Baixa' },
      { value: 'MEDIA', label: 'Média' },
      { value: 'ALTA', label: 'Alta' },
      { value: 'URGENTE', label: 'Urgente' }
    ],
    group: 'classificacao',
    computeDisabled: (entity: any) => {
      return entity?.status && !['RASCUNHO', 'PENDENTE'].includes(entity.status);
    }
  },
  {
    key: 'condicoes',
    label: 'Condições do Ativo',
    type: 'select',
    required: true,
    options: [
      { value: 'PARADO', label: 'Parado' },
      { value: 'FUNCIONANDO', label: 'Funcionando' }
    ],
    group: 'classificacao',
    computeDisabled: (entity: any) => {
      return entity?.status && !['RASCUNHO', 'PENDENTE'].includes(entity.status);
    }
  },

  // Planejamento - GRUPO: planejamento
  {
    key: 'tempo_estimado',
    label: 'Tempo Estimado (horas)',
    type: 'number',
    required: true,
    placeholder: 'Ex: 4.5',
    group: 'planejamento',
    computeDisabled: (entity: any) => {
      return entity?.status && !['RASCUNHO', 'PENDENTE'].includes(entity.status);
    }
  },
  {
    key: 'duracao_estimada',
    label: 'Duração Estimada (horas)',
    type: 'number',
    required: true,
    placeholder: 'Ex: 6',
    group: 'planejamento',
    computeDisabled: (entity: any) => {
      return entity?.status && !['RASCUNHO', 'PENDENTE'].includes(entity.status);
    }
  },
  {
    key: 'data_previsao_inicio',
    label: 'Data e Hora Prevista Início',
    type: 'datetime-local',
    group: 'planejamento',
    computeDisabled: (entity: any) => {
      return entity?.status && !['RASCUNHO', 'PENDENTE'].includes(entity.status);
    }
  },
  {
    key: 'data_previsao_fim',
    label: 'Data e Hora Prevista Fim',
    type: 'datetime-local',
    group: 'planejamento',
    computeDisabled: (entity: any) => {
      return entity?.status && !['RASCUNHO', 'PENDENTE'].includes(entity.status);
    }
  },
  {
    key: 'orcamento_previsto',
    label: 'Orçamento Previsto (R$)',
    type: 'number',
    placeholder: 'Ex: 1500.00',
    group: 'planejamento',
    computeDisabled: (entity: any) => {
      return entity?.status && !['RASCUNHO', 'PENDENTE'].includes(entity.status);
    }
  },

  // ============================
  // CAMPOS DE PROGRAMAÇÃO - COMENTADOS POR ENQUANTO
  // ============================

  // TODO: Descomentar quando for implementada a programação detalhada
  /*
  // Programação - GRUPO: programacao
  {
    key: 'data_hora_programada',
    label: 'Data e Hora Programada',
    type: 'datetime-local',
    group: 'programacao',
    computeDisabled: (entity: any) => {
      return entity?.status && !['RASCUNHO', 'PENDENTE'].includes(entity.status);
    }
  },
  {
    key: 'responsavel',
    label: 'Responsável',
    type: 'text',
    placeholder: 'Nome do responsável',
    group: 'programacao',
    computeDisabled: (entity: any) => {
      return entity?.status && !['RASCUNHO', 'PENDENTE'].includes(entity.status);
    }
  },
  {
    key: 'responsavel_id',
    label: 'ID do Responsável',
    type: 'text',
    placeholder: 'ID do usuário responsável',
    group: 'programacao',
    computeDisabled: (entity: any) => {
      return entity?.status && !['RASCUNHO', 'PENDENTE'].includes(entity.status);
    }
  },
  {
    key: 'time_equipe',
    label: 'Time/Equipe',
    type: 'text',
    placeholder: 'Ex: Equipe de Manutenção A',
    group: 'programacao',
    computeDisabled: (entity: any) => {
      return entity?.status && !['RASCUNHO', 'PENDENTE'].includes(entity.status);
    }
  },
  */

  // Veículo - GRUPO: veiculo
  {
    key: 'necessita_veiculo',
    label: 'Necessita Veículo',
    type: 'checkbox',
    group: 'veiculo',
    computeDisabled: (entity: any) => {
      return entity?.status && !['RASCUNHO', 'PENDENTE'].includes(entity.status);
    }
  },
  {
    key: 'reserva_veiculo',
    label: 'Reserva de Veículo',
    type: 'custom',
    component: ReservaViaturaField,
    componentProps: (formData: any) => ({
      dataProgramada: formData?.data_hora_programada || formData?.data_previsao_inicio
    }),
    showOnlyWhen: {
      field: 'necessita_veiculo',
      value: true
    },
    showOnlyOnMode: ['create', 'edit'],
    group: 'veiculo',
    computeDisabled: (entity: any) => {
      return entity?.status && !['RASCUNHO', 'PENDENTE'].includes(entity.status);
    }
  },
  {
    key: 'reserva_vinculada',
    label: 'Reserva de Veículo Vinculada',
    type: 'custom',
    showOnlyWhen: {
      field: 'necessita_veiculo',
      value: true
    },
    showOnlyOnMode: 'view',
    group: 'veiculo',
    render: (props: any) => {
      const { entity } = props;
      return (
        <ReservaVinculadaCard
          reserva={entity?.reserva_veiculo}
        />
      );
    }
  },
  {
    key: 'assentos_necessarios',
    label: 'Assentos Necessários',
    type: 'number',
    placeholder: 'Quantidade de assentos',
    showOnlyWhen: {
      field: 'necessita_veiculo',
      value: true
    },
    group: 'veiculo',
    computeDisabled: (entity: any) => {
      return entity?.status && !['RASCUNHO', 'PENDENTE'].includes(entity.status);
    }
  },
  {
    key: 'carga_necessaria',
    label: 'Capacidade de Carga (kg)',
    type: 'number',
    placeholder: 'Peso em kg',
    showOnlyWhen: {
      field: 'necessita_veiculo',
      value: true
    },
    group: 'veiculo',
    computeDisabled: (entity: any) => {
      return entity?.status && !['RASCUNHO', 'PENDENTE'].includes(entity.status);
    }
  },
  {
    key: 'observacoes_veiculo',
    label: 'Observações do Veículo',
    type: 'textarea',
    placeholder: 'Requisitos específicos do veículo',
    showOnlyWhen: {
      field: 'necessita_veiculo',
      value: true
    },
    group: 'veiculo',
    computeDisabled: (entity: any) => {
      return entity?.status && !['RASCUNHO', 'PENDENTE'].includes(entity.status);
    }
  },

  // Recursos - Materiais - GRUPO: recursos
  {
    key: 'materiais',
    label: 'Materiais Necessários',
    type: 'custom',
    component: MateriaisCardManager,
    componentProps: {
      mode: 'planejamento',
      showCustos: true,
      showStatus: true,
      title: 'Materiais Planejados'
    },
    defaultValue: [],
    group: 'recursos',
    computeDisabled: (entity: any) => {
      return entity?.status && !['RASCUNHO', 'PENDENTE'].includes(entity.status);
    }
  },

  // Recursos - Ferramentas - GRUPO: recursos
  {
    key: 'ferramentas',
    label: 'Ferramentas Necessárias',
    type: 'custom',
    component: FerramentasCardManager,
    componentProps: {
      mode: 'planejamento',
      showStatus: true,
      showCalibracao: true,
      title: 'Ferramentas Planejadas'
    },
    defaultValue: [],
    group: 'recursos',
    computeDisabled: (entity: any) => {
      return entity?.status && !['RASCUNHO', 'PENDENTE'].includes(entity.status);
    }
  },

  // Recursos - Técnicos - GRUPO: recursos
  {
    key: 'tecnicos',
    label: 'Técnicos Necessários',
    type: 'custom',
    component: TecnicosCardManager,
    componentProps: {
      mode: 'planejamento',
      showCustos: true,
      showStatus: true,
      title: 'Equipe Planejada'
    },
    defaultValue: [],
    group: 'recursos',
    computeDisabled: (entity: any) => {
      return entity?.status && !['RASCUNHO', 'PENDENTE'].includes(entity.status);
    }
  },

  // Observações - GRUPO: observacoes
  {
    key: 'observacoes',
    label: 'Observações Gerais',
    type: 'textarea',
    placeholder: 'Observações adicionais',
    group: 'observacoes',
    computeDisabled: (entity: any) => {
      return entity?.status && !['RASCUNHO', 'PENDENTE'].includes(entity.status);
    }
  },
  {
    key: 'observacoes_programacao',
    label: 'Observações da Programação',
    type: 'textarea',
    placeholder: 'Observações específicas da programação',
    group: 'observacoes',
    computeDisabled: (entity: any) => {
      return entity?.status && !['RASCUNHO', 'PENDENTE'].includes(entity.status);
    }
  },
  {
    key: 'justificativa',
    label: 'Justificativa',
    type: 'textarea',
    placeholder: 'Justificativa para a execução desta OS',
    group: 'observacoes',
    computeDisabled: (entity: any) => {
      return entity?.status && !['RASCUNHO', 'PENDENTE'].includes(entity.status);
    }
  },

  // ============================
  // CAMPOS DE WORKFLOW ESPECÍFICOS
  // ============================

  // ============================
  // CAMPOS DE VISUALIZAÇÃO POR STATUS
  // ============================

  // Campos para análise - mostrar sempre que foi analisada (tem dados OU status requer)
  {
    key: 'observacoes_analise',
    label: 'Observações da Análise',
    type: 'textarea',
    placeholder: 'Observações da análise',
    disabled: true,
    group: 'workflow',
    condition: (entity: any) => {
      // Mostrar sempre que o status indica que passou pela análise
      return ['EM_ANALISE', 'APROVADA', 'REJEITADA'].includes(entity?.status);
    }
  },

  // Campos de aprovação - mostrar sempre quando aprovada
  {
    key: 'observacoes_aprovacao',
    label: 'Observações da Aprovação',
    type: 'textarea',
    placeholder: 'Observações da aprovação',
    disabled: true,
    group: 'workflow',
    condition: (entity: any) => {
      return entity?.status === 'APROVADA';
    }
  },
  // Campos de rejeição - mostrar apenas se foi rejeitada
  {
    key: 'motivo_rejeicao',
    label: 'Motivo da Rejeição',
    type: 'textarea',
    placeholder: 'Descreva o motivo da rejeição',
    disabled: true,
    group: 'workflow',
    condition: (entity: any) => {
      return entity?.status === 'REJEITADA' && entity?.motivo_rejeicao;
    }
  },
  {
    key: 'sugestoes_melhoria',
    label: 'Sugestões de Melhoria',
    type: 'textarea',
    placeholder: 'Sugestões para melhorar a programação (opcional)',
    disabled: true,
    group: 'workflow',
    condition: (entity: any) => {
      return entity?.status === 'REJEITADA';
    }
  },

  // Campo de cancelamento - mostrar sempre quando cancelada
  {
    key: 'motivo_cancelamento',
    label: 'Motivo do Cancelamento',
    type: 'textarea',
    placeholder: 'Motivo do cancelamento',
    disabled: true,
    group: 'workflow',
    condition: (entity: any) => {
      return entity?.status === 'CANCELADA';
    }
  },


  // Campos de auditoria - GRUPO: auditoria
  {
    key: 'criado_por',
    label: 'Criado Por',
    type: 'text',
    disabled: true,
    showOnlyOnMode: ['view', 'edit'],
    group: 'auditoria'
  },
  {
    key: 'data_criacao',
    label: 'Data de Criação',
    type: 'datetime-local',
    disabled: true,
    showOnlyOnMode: ['view'],
    group: 'auditoria'
  },
  {
    key: 'analisado_por',
    label: 'Analisado Por',
    type: 'text',
    disabled: true,
    showOnlyOnMode: ['view'],
    group: 'auditoria',
    condition: (entity: any) => entity?.data_analise
  },
  {
    key: 'data_analise',
    label: 'Data da Análise',
    type: 'datetime-local',
    disabled: true,
    showOnlyOnMode: ['view'],
    group: 'auditoria',
    condition: (entity: any) => entity?.data_analise
  },
  {
    key: 'aprovado_por',
    label: 'Aprovado Por',
    type: 'text',
    disabled: true,
    showOnlyOnMode: ['view'],
    group: 'auditoria',
    condition: (entity: any) => entity?.data_aprovacao
  },
  {
    key: 'data_aprovacao',
    label: 'Data da Aprovação',
    type: 'datetime-local',
    disabled: true,
    showOnlyOnMode: ['view'],
    group: 'auditoria',
    condition: (entity: any) => entity?.data_aprovacao
  },
  {
    key: 'status',
    label: 'Status Atual',
    type: 'select',
    disabled: true,
    options: [
      { value: 'RASCUNHO', label: '📝 Rascunho' },
      { value: 'PENDENTE', label: '⏳ Pendente' },
      { value: 'EM_ANALISE', label: '🔍 Em Análise' },
      { value: 'APROVADA', label: '✅ Aprovada' },
      { value: 'REJEITADA', label: '❌ Rejeitada' },
      { value: 'CANCELADA', label: '🚫 Cancelada' }
    ],
    group: 'auditoria',
    showOnlyOnMode: ['view', 'edit']
  }
];

// Configuração dos grupos para o modal - ATUALIZADA COM WORKFLOW
export const programacaoOSFormGroups = [
  {
    key: 'identificacao',
    title: 'Identificação da OS',
    fields: ['numeroOS', 'descricao', 'local', 'ativo']
  },
  {
    key: 'origem',
    title: 'Origem da Ordem de Serviço',
    fields: ['origem', 'origemCard', 'planosManutencaoDetalhes']
  },
  {
    key: 'classificacao',
    title: 'Classificação',
    fields: ['tipo', 'prioridade', 'condicoes']
  },
  {
    key: 'planejamento',
    title: 'Planejamento',
    fields: ['tempo_estimado', 'duracao_estimada', 'data_previsao_inicio', 'data_previsao_fim', 'orcamento_previsto']
  },
  // TODO: Descomentar quando implementar programação detalhada
  /*
  {
    key: 'programacao',
    title: 'Programação',
    fields: ['data_hora_programada', 'responsavel', 'responsavel_id', 'time_equipe']
  },
  */
  {
    key: 'veiculo',
    title: 'Requisitos de Veículo',
    fields: ['necessita_veiculo', 'reserva_veiculo', 'reserva_vinculada', 'assentos_necessarios', 'carga_necessaria', 'observacoes_veiculo']
  },
  {
    key: 'recursos',
    title: 'Recursos Necessários',
    fields: ['materiais', 'ferramentas', 'tecnicos']
  },
  {
    key: 'observacoes',
    title: 'Observações e Justificativas',
    fields: ['observacoes', 'observacoes_programacao', 'justificativa']
  },
  {
    key: 'workflow',
    title: 'Histórico de Ações',
    fields: [
      'observacoes_aprovacao',
      'motivo_rejeicao', 'sugestoes_melhoria', 'motivo_cancelamento',
      'observacoes_analise'
    ],
    conditional: {
      field: 'status',
      value: function(entity: any) {
        // Mostrar grupo sempre que o status indica que passou por alguma ação de workflow
        return entity?.status && !['RASCUNHO', 'PENDENTE'].includes(entity.status);
      }
    }
  },
  {
    key: 'auditoria',
    title: 'Informações de Auditoria',
    fields: [
      'status', 'criado_por', 'data_criacao', 'analisado_por', 'data_analise',
      'aprovado_por', 'data_aprovacao'
    ],
    conditional: {
      field: 'mode',
      value: function(_entity: any) {
        // Mostrar auditoria sempre que aplicável
        return true;
      }
    }
  }
];