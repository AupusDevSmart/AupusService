// src/features/execucao-os/config/form-config.tsx - CORRIGIDA COM MAPEAMENTO DE GRUPOS
import type { FormField } from '@/types/base';
import { ProgramacaoSelector } from '../components/ProgramacaoSelector';
import { MateriaisCardManager } from '@/components/common/cards/MateriaisCardManager';
import { FerramentasCardManager } from '@/components/common/cards/FerramentasCardManager';
import { TecnicosCardManager } from '@/components/common/cards/TecnicosCardManager';

export const execucaoOSFormFields: FormField[] = [
  // Seleção da Programação - GRUPO: selecao
  {
    key: 'programacao',
    label: 'Programação de OS',
    type: 'custom',
    component: ProgramacaoSelector,
    required: true,
    showOnlyOnMode: ['create'],
    group: 'selecao'
  },

  // Informações da OS - GRUPO: identificacao
  {
    key: 'numeroOS',
    label: 'Número da OS',
    type: 'text',
    disabled: true,
    group: 'identificacao'
  },
  {
    key: 'descricaoOS',
    label: 'Descrição da OS',
    type: 'textarea',
    disabled: true,
    group: 'identificacao'
  },
  {
    key: 'localAtivo',
    label: 'Local/Ativo',
    type: 'text',
    disabled: true,
    group: 'identificacao'
  },
  {
    key: 'tipoOS',
    label: 'Tipo da OS',
    type: 'text',
    disabled: true,
    group: 'identificacao'
  },
  {
    key: 'prioridadeOS',
    label: 'Prioridade',
    type: 'text',
    disabled: true,
    group: 'identificacao'
  },

  // Controle de Execução - GRUPO: controle
  {
    key: 'statusExecucao',
    label: 'Status da Execução',
    type: 'select',
    required: true,
    options: [
      { value: 'PROGRAMADA', label: 'Programada' },
      { value: 'EM_EXECUCAO', label: 'Em Execução' },
      { value: 'PAUSADA', label: 'Pausada' },
      { value: 'FINALIZADA', label: 'Finalizada' },
      { value: 'CANCELADA', label: 'Cancelada' }
    ],
    group: 'controle'
  },
  {
    key: 'dataHoraInicioReal',
    label: 'Data e Hora Início Real',
    type: 'datetime-local',
    group: 'controle'
  },
  {
    key: 'dataHoraFimReal',
    label: 'Data e Hora Fim Real',
    type: 'datetime-local',
    showOnlyOnMode: ['edit', 'finalizar'],
    group: 'controle'
  },
  {
    key: 'tempoTotalExecucao',
    label: 'Tempo Total de Execução (min)',
    type: 'number',
    disabled: true,
    group: 'controle'
  },

  // Equipe e Responsável - GRUPO: equipe
  {
    key: 'responsavelExecucao',
    label: 'Responsável pela Execução',
    type: 'text',
    required: true,
    placeholder: 'Nome do responsável',
    group: 'equipe'
  },
  {
    key: 'funcaoResponsavel',
    label: 'Função do Responsável',
    type: 'text',
    placeholder: 'Ex: Técnico Mecânico',
    group: 'equipe'
  },

  // Técnicos da Execução - GRUPO: equipe
  {
    key: 'tecnicos',
    label: 'Equipe de Execução',
    type: 'custom',
    component: TecnicosCardManager,
    componentProps: {
      mode: 'execucao',
      showCustos: true,
      showStatus: true,
      showHorasReais: true,
      title: 'Equipe Presente'
    },
    defaultValue: [],
    group: 'equipe'
  },

  // Atividades e Checklist - GRUPO: atividades
  {
    key: 'atividadesRealizadas',
    label: 'Atividades Realizadas',
    type: 'textarea',
    placeholder: 'Descreva as atividades executadas',
    group: 'atividades'
  },
  {
    key: 'checklistConcluido',
    label: 'Checklist Concluído (%)',
    type: 'number',
    min: 0,
    max: 100,
    placeholder: '0-100',
    group: 'atividades'
  },
  {
    key: 'procedimentosSeguidos',
    label: 'Procedimentos Seguidos',
    type: 'textarea',
    placeholder: 'Liste os procedimentos seguidos',
    group: 'atividades'
  },

  // Recursos Consumidos - Materiais - GRUPO: recursos
  {
    key: 'materiaisConsumidos',
    label: 'Materiais Consumidos',
    type: 'custom',
    component: MateriaisCardManager,
    componentProps: {
      mode: 'execucao',
      showCustos: true,
      showStatus: true,
      title: 'Materiais Efetivamente Utilizados'
    },
    defaultValue: [],
    group: 'recursos'
  },

  // Recursos Utilizados - Ferramentas - GRUPO: recursos
  {
    key: 'ferramentasUtilizadas',
    label: 'Ferramentas Utilizadas',
    type: 'custom',
    component: FerramentasCardManager,
    componentProps: {
      mode: 'execucao',
      showStatus: true,
      showCondicao: true,
      showCalibracao: true,
      title: 'Ferramentas Efetivamente Utilizadas'
    },
    defaultValue: [],
    group: 'recursos'
  },

  {
    key: 'custosAdicionais',
    label: 'Custos Adicionais (R$)',
    type: 'number',
    placeholder: 'Custos não planejados',
    group: 'recursos'
  },

  // Condições de Segurança - GRUPO: seguranca
  {
    key: 'equipamentosSeguranca',
    label: 'EPIs e Equipamentos de Segurança',
    type: 'textarea',
    placeholder: 'Liste os EPIs utilizados',
    group: 'seguranca'
  },
  {
    key: 'incidentesSeguranca',
    label: 'Incidentes de Segurança',
    type: 'textarea',
    placeholder: 'Relate qualquer incidente ou quase acidente',
    group: 'seguranca'
  },
  {
    key: 'medidasSegurancaAdicionais',
    label: 'Medidas de Segurança Adicionais',
    type: 'textarea',
    placeholder: 'Medidas extras de segurança adotadas',
    group: 'seguranca'
  },

  // Resultados e Qualidade - GRUPO: resultados
  {
    key: 'resultadoServico',
    label: 'Resultado do Serviço',
    type: 'textarea',
    placeholder: 'Descreva o resultado obtido',
    required: true,
    showOnlyOnMode: ['edit', 'finalizar'],
    group: 'resultados'
  },
  {
    key: 'problemasEncontrados',
    label: 'Problemas Encontrados',
    type: 'textarea',
    placeholder: 'Descreva problemas identificados durante a execução',
    showOnlyOnMode: ['edit', 'finalizar'],
    group: 'resultados'
  },
  {
    key: 'recomendacoes',
    label: 'Recomendações',
    type: 'textarea',
    placeholder: 'Recomendações para futuras manutenções',
    showOnlyOnMode: ['edit', 'finalizar'],
    group: 'resultados'
  },
  {
    key: 'proximaManutencao',
    label: 'Próxima Manutenção',
    type: 'datetime-local',
    showOnlyOnMode: ['edit', 'finalizar'],
    group: 'resultados'
  },

  // Avaliação de Qualidade - GRUPO: qualidade
  {
    key: 'avaliacaoQualidade',
    label: 'Avaliação da Qualidade (1-5)',
    type: 'number',
    min: 1,
    max: 5,
    placeholder: '1 a 5 estrelas',
    required: true,
    showOnlyOnMode: ['edit', 'finalizar'],
    group: 'qualidade'
  },
  {
    key: 'observacoesQualidade',
    label: 'Observações da Qualidade',
    type: 'textarea',
    placeholder: 'Comentários sobre a qualidade do serviço',
    showOnlyOnMode: ['edit', 'finalizar'],
    group: 'qualidade'
  },

  // Observações e Paradas - GRUPO: observacoes
  {
    key: 'observacoesExecucao',
    label: 'Observações da Execução',
    type: 'textarea',
    placeholder: 'Observações gerais sobre a execução',
    group: 'observacoes'
  },
  {
    key: 'motivoPausas',
    label: 'Motivo das Pausas',
    type: 'textarea',
    placeholder: 'Descreva os motivos das pausas durante a execução',
    condition: (entity, formData) => {
      return formData?.statusExecucao === 'PAUSADA' || 
             (entity && entity.statusExecucao === 'PAUSADA');
    },
    group: 'observacoes'
  },
  {
    key: 'motivoCancelamento',
    label: 'Motivo do Cancelamento',
    type: 'textarea',
    placeholder: 'Descreva o motivo do cancelamento',
    required: true,
    condition: (entity, formData) => {
      return formData?.statusExecucao === 'CANCELADA' || 
             (entity && entity.statusExecucao === 'CANCELADA');
    },
    group: 'observacoes'
  },

  // Campos de auditoria - GRUPO: auditoria
  {
    key: 'finalizadoPor',
    label: 'Finalizado Por',
    type: 'text',
    disabled: true,
    showOnlyOnMode: ['view'],
    group: 'auditoria'
  },
  {
    key: 'dataFinalizacao',
    label: 'Data da Finalização',
    type: 'datetime-local',
    disabled: true,
    showOnlyOnMode: ['view'],
    group: 'auditoria'
  },
  {
    key: 'aprovadoPor',
    label: 'Aprovado Por',
    type: 'text',
    disabled: true,
    showOnlyOnMode: ['view'],
    group: 'auditoria'
  },
  {
    key: 'dataAprovacao',
    label: 'Data da Aprovação',
    type: 'datetime-local',
    disabled: true,
    showOnlyOnMode: ['view'],
    group: 'auditoria'
  }
];

// Configuração dos grupos para o modal - CORRIGIDA COM FIELDS MAPEADOS
export const execucaoOSFormGroups = [
  {
    key: 'selecao',
    title: 'Seleção da Programação',
    fields: ['programacao'], // ✅ ADICIONADO: mapping explícito
    conditional: {
      field: 'mode',
      value: 'create'
    }
  },
  {
    key: 'identificacao',
    title: 'Identificação da OS',
    fields: ['numeroOS', 'descricaoOS', 'localAtivo', 'tipoOS', 'prioridadeOS'] // ✅ ADICIONADO: mapping explícito
  },
  {
    key: 'controle',
    title: 'Controle de Execução',
    fields: ['statusExecucao', 'dataHoraInicioReal', 'dataHoraFimReal', 'tempoTotalExecucao'] // ✅ ADICIONADO: mapping explícito
  },
  {
    key: 'equipe',
    title: 'Equipe de Execução',
    fields: ['responsavelExecucao', 'funcaoResponsavel', 'tecnicos'] // ✅ ADICIONADO: mapping explícito
  },
  {
    key: 'atividades',
    title: 'Atividades e Procedimentos',
    fields: ['atividadesRealizadas', 'checklistConcluido', 'procedimentosSeguidos'] // ✅ ADICIONADO: mapping explícito
  },
  {
    key: 'recursos',
    title: 'Recursos Consumidos',
    fields: ['materiaisConsumidos', 'ferramentasUtilizadas', 'custosAdicionais'] // ✅ ADICIONADO: mapping explícito
  },
  {
    key: 'seguranca',
    title: 'Segurança e EPIs',
    fields: ['equipamentosSeguranca', 'incidentesSeguranca', 'medidasSegurancaAdicionais'] // ✅ ADICIONADO: mapping explícito
  },
  {
    key: 'resultados',
    title: 'Resultados da Execução',
    fields: ['resultadoServico', 'problemasEncontrados', 'recomendacoes', 'proximaManutencao'], // ✅ ADICIONADO: mapping explícito
    conditional: {
      field: 'mode',
      value: 'finalizar'
    }
  },
  {
    key: 'qualidade',
    title: 'Avaliação de Qualidade',
    fields: ['avaliacaoQualidade', 'observacoesQualidade'], // ✅ ADICIONADO: mapping explícito
    conditional: {
      field: 'mode',
      value: 'finalizar'
    }
  },
  {
    key: 'observacoes',
    title: 'Observações Gerais',
    fields: ['observacoesExecucao', 'motivoPausas', 'motivoCancelamento'] // ✅ ADICIONADO: mapping explícito
  },
  {
    key: 'auditoria',
    title: 'Informações de Auditoria',
    fields: ['finalizadoPor', 'dataFinalizacao', 'aprovadoPor', 'dataAprovacao'], // ✅ ADICIONADO: mapping explícito
    conditional: {
      field: 'mode',
      value: 'view'
    }
  }
];