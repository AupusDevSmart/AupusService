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
    group: 'identificacao',
    colSpan: 2,
  },
  {
    key: 'status',
    label: 'Status Atual',
    type: 'select',
    disabled: true,
    options: [
      { value: 'PENDENTE', label: 'Pendente' },
      { value: 'APROVADA', label: 'Aprovada' },
      { value: 'FINALIZADA', label: 'Finalizada' },
      { value: 'CANCELADA', label: 'Cancelada' }
    ],
    group: 'identificacao',
    showOnlyOnMode: ['view', 'edit'],
    width: 'half'
  },
  {
    key: 'descricao',
    label: 'Descrição',
    type: 'textarea',
    required: true,
    placeholder: 'Descreva o serviço a ser executado',
    group: 'identificacao',
    colSpan:2,
    computeDisabled: (entity: any) => {
      return entity?.status && entity.status !== 'PENDENTE';
    }
  },
  // Origem da OS - GRUPO: origem
  {
    key: 'origem',
    label: 'Selecione a origem da Ordem de Serviço',
    type: 'custom',
    component: OrigemOSSelector,
    required: true,
    defaultValue: {
      tipo: 'ANOMALIA',
      anomaliaId: undefined,
      planoId: undefined,
      tarefasSelecionadas: [],
      plantaId: undefined,
      planosSelecionados: [],
      tarefasPorPlano: {}
    },
    group: 'origem',
    showOnlyOnMode: 'create',
    colSpan: 2 // Ocupar largura total no sheet
  },
  {
    key: 'origemCard',
    label: 'Origem da Ordem de Serviço',
    type: 'custom',
    group: 'origem',
    showOnlyOnMode: ['view', 'edit'],
    colSpan: 2, // Ocupar largura total no sheet
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
          solicitacaoServico={entity?.solicitacao_servico}
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
    width: 'third', // 33.33% em desktop (3 campos na linha)
    computeDisabled: (entity: any) => {
      return entity?.status && entity.status !== 'PENDENTE';
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
    width: 'third', // 33.33% em desktop (3 campos na linha)
    computeDisabled: (entity: any) => {
      return entity?.status && entity.status !== 'PENDENTE';
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
    width: 'third', // 33.33% em desktop (3 campos na linha)
    computeDisabled: (entity: any) => {
      return entity?.status && entity.status !== 'PENDENTE';
    }
  },

  // Planejamento - GRUPO: planejamento
  {
    key: 'duracao_estimada',
    label: 'Duração Estimada (horas)',
    type: 'number',
    required: true,
    placeholder: 'Ex: 6',
    group: 'planejamento',
    width: 'half', // 50% em desktop
    computeDisabled: (entity: any) => {
      return entity?.status && entity.status !== 'PENDENTE';
    }
  },
  {
    key: 'orcamento_previsto',
    label: 'Orçamento Previsto (R$)',
    type: 'number',
    placeholder: 'Ex: 1500.00',
    group: 'planejamento',
    width: 'half', // 50% em desktop
    computeDisabled: (entity: any) => {
      return entity?.status && entity.status !== 'PENDENTE';
    }
  },
  {
    key: 'data_previsao_inicio',
    label: 'Data e Hora Prevista Início',
    type: 'datetime-local',
    group: 'planejamento',
    width: 'half', // 50% em desktop
    computeDisabled: (entity: any) => {
      return entity?.status && entity.status !== 'PENDENTE';
    }
  },
  {
    key: 'data_previsao_fim',
    label: 'Data e Hora Prevista Fim',
    type: 'datetime-local',
    group: 'planejamento',
    width: 'half', // 50% em desktop
    computeDisabled: (entity: any) => {
      return entity?.status && entity.status !== 'PENDENTE';
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
      return entity?.status && entity.status !== 'PENDENTE';
    }
  },
  {
    key: 'responsavel',
    label: 'Responsável',
    type: 'text',
    placeholder: 'Nome do responsável',
    group: 'programacao',
    computeDisabled: (entity: any) => {
      return entity?.status && entity.status !== 'PENDENTE';
    }
  },
  {
    key: 'responsavel_id',
    label: 'ID do Responsável',
    type: 'text',
    placeholder: 'ID do usuário responsável',
    group: 'programacao',
    computeDisabled: (entity: any) => {
      return entity?.status && entity.status !== 'PENDENTE';
    }
  },
  {
    key: 'time_equipe',
    label: 'Time/Equipe',
    type: 'text',
    placeholder: 'Ex: Equipe de Manutenção A',
    group: 'programacao',
    computeDisabled: (entity: any) => {
      return entity?.status && entity.status !== 'PENDENTE';
    }
  },
  */

  // Veículo - GRUPO: veiculo
  {
    key: 'necessita_veiculo',
    label: 'Necessita Veículo',
    type: 'checkbox',
    defaultValue: false, // ✅ Sempre iniciar com false para evitar uncontrolled
    group: 'veiculo',
    computeDisabled: (entity: any) => {
      return entity?.status && entity.status !== 'PENDENTE';
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
    colSpan: 2, // Ocupar largura total no sheet
    computeDisabled: (entity: any) => {
      return entity?.status && entity.status !== 'PENDENTE';
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
    colSpan: 2, // Ocupar largura total no sheet
    render: (props: any) => {
      const { entity } = props;
      return (
        <ReservaVinculadaCard
          reserva={entity?.reserva_veiculo}
        />
      );
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
    colSpan: 2, // Ocupar largura total no sheet
    computeDisabled: (entity: any) => {
      return entity?.status && entity.status !== 'PENDENTE';
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
    colSpan: 2, // Ocupar largura total no sheet
    computeDisabled: (entity: any) => {
      return entity?.status && entity.status !== 'PENDENTE';
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
    colSpan: 2, // Ocupar largura total no sheet
    computeDisabled: (entity: any) => {
      return entity?.status && entity.status !== 'PENDENTE';
    }
  },

  // Observações - GRUPO: observacoes
  {
    key: 'observacoes',
    label: 'Observações',
    type: 'textarea',
    placeholder: 'Observações adicionais sobre a programação',
    group: 'observacoes',
    width: 'full', // 100% - campo de texto longo
    computeDisabled: (entity: any) => {
      return entity?.status && entity.status !== 'PENDENTE';
    }
  },
  {
    key: 'justificativa',
    label: 'Justificativa',
    type: 'textarea',
    placeholder: 'Justificativa para a execução desta OS',
    group: 'observacoes',
    width: 'full', // 100% - campo de texto longo
    condition: (entity: any) => {
      // Mostrar justificativa apenas em modo view quando já foi preenchida
      // ou em modo create/edit quando ainda está em rascunho/pendente
      return entity?.justificativa || ['PENDENTE', undefined].includes(entity?.status);
    },
    computeDisabled: (entity: any) => {
      return entity?.status && entity.status !== 'PENDENTE';
    }
  },

  // ============================
  // CAMPOS DE WORKFLOW ESPECÍFICOS
  // ============================

  // ============================
  // CAMPOS DE VISUALIZAÇÃO POR STATUS
  // ============================

  // Campos de aprovacao - mostrar quando aprovada ou finalizada
  {
    key: 'observacoes_aprovacao',
    label: 'Observacoes da Aprovacao',
    type: 'textarea',
    placeholder: 'Observacoes da aprovacao',
    disabled: true,
    group: 'workflow',
    colSpan: 2,
    condition: (entity: any, data: any) => {
      const status = data?.status || entity?.status;
      return ['APROVADA', 'FINALIZADA'].includes(status) && (data?.observacoes_aprovacao || entity?.observacoes_aprovacao);
    }
  },

  // Campos de finalizacao - mostrar quando finalizada
  {
    key: 'observacoes_finalizacao',
    label: 'Observacoes da Finalizacao',
    type: 'textarea',
    placeholder: 'Sem observacoes',
    disabled: true,
    group: 'workflow',
    colSpan: 2,
    showOnlyOnMode: ['view'],
    condition: (entity: any, data: any) => {
      const status = data?.status || entity?.status;
      return status === 'FINALIZADA';
    }
  },
  {
    key: 'finalizado_por',
    label: 'Finalizado Por',
    type: 'text',
    disabled: true,
    group: 'workflow',
    colSpan: 1,
    showOnlyOnMode: ['view'],
    condition: (entity: any, data: any) => {
      const status = data?.status || entity?.status;
      return status === 'FINALIZADA';
    }
  },
  {
    key: 'data_finalizacao',
    label: 'Data da Finalizacao',
    type: 'datetime-local',
    disabled: true,
    group: 'workflow',
    colSpan: 1,
    showOnlyOnMode: ['view'],
    condition: (entity: any, data: any) => {
      const status = data?.status || entity?.status;
      return status === 'FINALIZADA';
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
    colSpan: 2,
    condition: (entity: any, data: any) => {
      const status = data?.status || entity?.status;
      return status === 'CANCELADA';
    }
  },


  // Campos de auditoria - GRUPO: auditoria
  {
    key: 'criado_por',
    label: 'Criado Por',
    type: 'text',
    disabled: true,
    showOnlyOnMode: ['view', 'edit'],
    group: 'auditoria',
    width: 'half' // 50% em desktop
  },
  {
    key: 'data_criacao',
    label: 'Data de Criação',
    type: 'datetime-local',
    disabled: true,
    showOnlyOnMode: ['view'],
    group: 'auditoria',
    width: 'half' // 50% em desktop
  },
  {
    key: 'analisado_por',
    label: 'Analisado Por',
    type: 'text',
    disabled: true,
    showOnlyOnMode: ['view'],
    group: 'auditoria',
    width: 'half', // 50% em desktop
    condition: (entity: any) => entity?.data_analise
  },
  {
    key: 'data_analise',
    label: 'Data da Análise',
    type: 'datetime-local',
    disabled: true,
    showOnlyOnMode: ['view'],
    group: 'auditoria',
    width: 'half', // 50% em desktop
    condition: (entity: any) => entity?.data_analise
  },
  {
    key: 'aprovado_por',
    label: 'Aprovado Por',
    type: 'text',
    disabled: true,
    showOnlyOnMode: ['view'],
    group: 'auditoria',
    width: 'half', // 50% em desktop
    condition: (entity: any) => entity?.data_aprovacao
  },
  {
    key: 'data_aprovacao',
    label: 'Data da Aprovação',
    type: 'datetime-local',
    disabled: true,
    showOnlyOnMode: ['view'],
    group: 'auditoria',
    width: 'half', // 50% em desktop
    condition: (entity: any) => entity?.data_aprovacao
  }
];

// Configuração dos grupos para o modal - ATUALIZADA COM WORKFLOW
export const programacaoOSFormGroups = [
  {
    key: 'identificacao',
    title: 'Identificação da OS',
    fields: ['numeroOS', 'status', 'descricao']
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
    fields: ['duracao_estimada', 'data_previsao_inicio', 'data_previsao_fim', 'orcamento_previsto']
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
    fields: ['necessita_veiculo', 'reserva_veiculo', 'reserva_vinculada']
  },
  {
    key: 'recursos',
    title: 'Recursos Necessários',
    fields: ['materiais', 'ferramentas', 'tecnicos']
  },
  {
    key: 'observacoes',
    title: 'Observações e Justificativas',
    fields: ['observacoes', 'justificativa']
  },
  {
    key: 'workflow',
    title: 'Histórico de Ações',
    fields: [
      'observacoes_aprovacao',
      'observacoes_finalizacao', 'finalizado_por', 'data_finalizacao',
      'motivo_cancelamento'
    ],
    conditional: {
      field: 'status',
      value: function(entity: any) {
        // Mostrar grupo sempre que o status indica que passou por alguma ação de workflow
        return entity?.status && entity.status !== 'PENDENTE';
      }
    }
  },
  {
    key: 'auditoria',
    title: 'Informações de Auditoria',
    fields: [
      'criado_por', 'data_criacao', 'analisado_por', 'data_analise',
      'aprovado_por', 'data_aprovacao'
    ],
    conditional: {
      field: 'status',
      value: function() {
        return true;
      }
    }
  }
];