// src/features/execucao-os/config/form-config.tsx - CORRIGIDA COM MAPEAMENTO DE GRUPOS
import type { FormField } from '@/types/base';
import { ProgramacaoSelector } from '../components/ProgramacaoSelector';
import { MateriaisCardManager } from '@/components/common/cards/MateriaisCardManager';
import { FerramentasCardManager } from '@/components/common/cards/FerramentasCardManager';
import { TecnicosCardManager } from '@/components/common/cards/TecnicosCardManager';
import { OrigemOSCard } from '../components/OrigemOSCard';
import { ReservaVeiculoCard } from '../components/ReservaVeiculoCard';

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
    group: 'identificacao',
    width: 'half'
  },
  {
    key: 'tipoOS',
    label: 'Tipo da OS',
    type: 'text',
    disabled: true,
    group: 'identificacao',
    width: 'half'
  },
  {
    key: 'descricaoOS',
    label: 'Descrição da OS',
    type: 'textarea',
    disabled: true,
    group: 'identificacao',
    width: 'full',
    startNewRow: true
  },
  {
    key: 'localAtivo',
    label: 'Local/Ativo',
    type: 'text',
    disabled: true,
    group: 'identificacao',
    width: 'two-thirds'
  },
  {
    key: 'prioridadeOS',
    label: 'Prioridade',
    type: 'text',
    disabled: true,
    group: 'identificacao',
    width: 'third'
  },

  // Origem da OS - GRUPO: origem
  {
    key: 'origemCard',
    label: 'Origem da OS',
    type: 'custom',
    component: OrigemOSCard,
    group: 'origem',
    width: 'full'
  },

  // Reserva de Veículo - GRUPO: reserva
  {
    key: 'reservaCard',
    label: 'Reserva de Veículo',
    type: 'custom',
    component: ReservaVeiculoCard,
    group: 'reserva',
    width: 'full'
  },

  // Dados de Execução da Reserva - GRUPO: reserva
  {
    key: 'kmInicialReserva',
    label: 'KM Inicial (Saída)',
    type: 'number',
    placeholder: 'KM do veículo ao sair',
    group: 'reserva',
    width: 'half',
    startNewRow: true,
    condition: (entity, formData) => {
      const status = formData?.statusExecucao || entity?.statusExecucao;
      // Mostrar se tem reserva E está em execução/pausada/finalizada
      const temReserva = entity?.reservaCard || formData?.reservaCard;
      return temReserva && (status === 'EM_EXECUCAO' || status === 'PAUSADA' || status === 'FINALIZADA');
    }
  },
  {
    key: 'kmFinalReserva',
    label: 'KM Final (Retorno)',
    type: 'number',
    placeholder: 'KM do veículo ao retornar',
    group: 'reserva',
    width: 'half',
    required: true,
    condition: (entity, formData) => {
      const status = formData?.statusExecucao || entity?.statusExecucao;
      // Mostrar apenas ao finalizar se tem reserva
      const temReserva = entity?.reservaCard || formData?.reservaCard;
      return temReserva && status === 'FINALIZADA';
    }
  },
  {
    key: 'observacoesFinalizacaoReserva',
    label: 'Observações sobre o Uso do Veículo',
    type: 'textarea',
    placeholder: 'Condições do veículo, problemas encontrados, etc.',
    group: 'reserva',
    width: 'full',
    startNewRow: true,
    condition: (entity, formData) => {
      const status = formData?.statusExecucao || entity?.statusExecucao;
      const temReserva = entity?.reservaCard || formData?.reservaCard;
      return temReserva && status === 'FINALIZADA';
    }
  },

  // Controle de Execução - GRUPO: controle
  {
    key: 'statusExecucao',
    label: 'Status da Execução',
    type: 'select',
    required: true,
    disabled: true, // ✅ Status não pode ser mudado manualmente - usar botões de ação
    options: [
      { value: 'PLANEJADA', label: 'Planejada' },
      { value: 'PROGRAMADA', label: 'Programada' },
      { value: 'EM_EXECUCAO', label: 'Em Execução' },
      { value: 'PAUSADA', label: 'Pausada' },
      { value: 'FINALIZADA', label: 'Finalizada' },
      { value: 'CANCELADA', label: 'Cancelada' }
    ],
    group: 'controle',
    width: 'half'
  },
  {
    key: 'tempoTotalExecucao',
    label: 'Tempo Total de Execução (min)',
    type: 'number',
    disabled: true,
    group: 'controle',
    width: 'half',
    condition: (entity, formData) => {
      const status = formData?.statusExecucao || entity?.statusExecucao;
      return status === 'EM_EXECUCAO' || status === 'PAUSADA' || status === 'FINALIZADA';
    }
  },
  {
    key: 'dataHoraInicioReal',
    label: 'Data e Hora Início Real',
    type: 'datetime-local',
    group: 'controle',
    width: 'half',
    startNewRow: true,
    required: true,
    condition: (entity, formData) => {
      const status = formData?.statusExecucao || entity?.statusExecucao;
      return status === 'EM_EXECUCAO' || status === 'PAUSADA' || status === 'FINALIZADA';
    }
  },
  {
    key: 'dataHoraFimReal',
    label: 'Data e Hora Fim Real',
    type: 'datetime-local',
    group: 'controle',
    width: 'half',
    condition: (entity, formData) => {
      const status = formData?.statusExecucao || entity?.statusExecucao;
      return status === 'FINALIZADA';
    }
  },

  // Equipe e Responsável - GRUPO: equipe
  {
    key: 'responsavelExecucao',
    label: 'Responsável pela Execução',
    type: 'text',
    required: true,
    placeholder: 'Nome do responsável',
    group: 'equipe',
    width: 'two-thirds',
    condition: (entity, formData) => {
      const status = formData?.statusExecucao || entity?.statusExecucao;
      return status === 'PROGRAMADA' || status === 'EM_EXECUCAO' || status === 'PAUSADA' || status === 'FINALIZADA';
    }
  },
  {
    key: 'funcaoResponsavel',
    label: 'Função do Responsável',
    type: 'text',
    placeholder: 'Ex: Técnico Mecânico',
    group: 'equipe',
    width: 'third',
    condition: (entity, formData) => {
      const status = formData?.statusExecucao || entity?.statusExecucao;
      return status === 'PROGRAMADA' || status === 'EM_EXECUCAO' || status === 'PAUSADA' || status === 'FINALIZADA';
    }
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
    group: 'equipe',
    width: 'full',
    startNewRow: true,
    condition: () => true // ✅ Sempre mostrar
  },

  // Atividades e Checklist - GRUPO: atividades
  {
    key: 'atividadesRealizadas',
    label: 'Atividades Realizadas',
    type: 'textarea',
    placeholder: 'Descreva as atividades executadas',
    group: 'atividades',
    width: 'full',
    required: true,
    condition: (entity, formData) => {
      const status = formData?.statusExecucao || entity?.statusExecucao;
      return status === 'EM_EXECUCAO' || status === 'PAUSADA' || status === 'FINALIZADA';
    }
  },
  {
    key: 'checklistConcluido',
    label: 'Checklist Concluído (%)',
    type: 'number',
    min: 0,
    max: 100,
    placeholder: '0-100',
    group: 'atividades',
    width: 'quarter',
    startNewRow: true,
    condition: (entity, formData) => {
      const status = formData?.statusExecucao || entity?.statusExecucao;
      return status === 'EM_EXECUCAO' || status === 'PAUSADA' || status === 'FINALIZADA';
    }
  },
  {
    key: 'procedimentosSeguidos',
    label: 'Procedimentos Seguidos',
    type: 'textarea',
    placeholder: 'Liste os procedimentos seguidos',
    group: 'atividades',
    width: 'three-quarters',
    condition: (entity, formData) => {
      const status = formData?.statusExecucao || entity?.statusExecucao;
      return status === 'EM_EXECUCAO' || status === 'PAUSADA' || status === 'FINALIZADA';
    }
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
    group: 'recursos',
    width: 'full',
    condition: () => true // ✅ Sempre mostrar
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
    group: 'recursos',
    width: 'full',
    startNewRow: true,
    condition: () => true // ✅ Sempre mostrar
  },

  {
    key: 'custosAdicionais',
    label: 'Custos Adicionais (R$)',
    type: 'number',
    placeholder: 'Custos não planejados',
    group: 'recursos',
    width: 'third',
    startNewRow: true,
    condition: (entity, formData) => {
      const status = formData?.statusExecucao || entity?.statusExecucao;
      return status === 'EM_EXECUCAO' || status === 'PAUSADA' || status === 'FINALIZADA';
    }
  },

  // Condições de Segurança - GRUPO: seguranca
  {
    key: 'equipamentosSeguranca',
    label: 'EPIs e Equipamentos de Segurança',
    type: 'textarea',
    placeholder: 'Liste os EPIs utilizados',
    group: 'seguranca',
    condition: (entity, formData) => {
      const status = formData?.statusExecucao || entity?.statusExecucao;
      return status === 'EM_EXECUCAO' || status === 'PAUSADA' || status === 'FINALIZADA';
    }
  },
  {
    key: 'incidentesSeguranca',
    label: 'Incidentes de Segurança',
    type: 'textarea',
    placeholder: 'Relate qualquer incidente ou quase acidente',
    group: 'seguranca',
    condition: (entity, formData) => {
      const status = formData?.statusExecucao || entity?.statusExecucao;
      return status === 'EM_EXECUCAO' || status === 'PAUSADA' || status === 'FINALIZADA';
    }
  },
  {
    key: 'medidasSegurancaAdicionais',
    label: 'Medidas de Segurança Adicionais',
    type: 'textarea',
    placeholder: 'Medidas extras de segurança adotadas',
    group: 'seguranca',
    condition: (entity, formData) => {
      const status = formData?.statusExecucao || entity?.statusExecucao;
      return status === 'EM_EXECUCAO' || status === 'PAUSADA' || status === 'FINALIZADA';
    }
  },

  // Resultados e Qualidade - GRUPO: resultados
  {
    key: 'resultadoServico',
    label: 'Resultado do Serviço',
    type: 'textarea',
    placeholder: 'Descreva o resultado obtido',
    required: true,
    group: 'resultados',
    condition: (entity, formData) => {
      const status = formData?.statusExecucao || entity?.statusExecucao;
      return status === 'FINALIZADA';
    }
  },
  {
    key: 'problemasEncontrados',
    label: 'Problemas Encontrados',
    type: 'textarea',
    placeholder: 'Descreva problemas identificados durante a execução',
    group: 'resultados',
    condition: (entity, formData) => {
      const status = formData?.statusExecucao || entity?.statusExecucao;
      return status === 'FINALIZADA';
    }
  },
  {
    key: 'recomendacoes',
    label: 'Recomendações',
    type: 'textarea',
    placeholder: 'Recomendações para futuras manutenções',
    group: 'resultados',
    condition: (entity, formData) => {
      const status = formData?.statusExecucao || entity?.statusExecucao;
      return status === 'FINALIZADA';
    }
  },
  {
    key: 'proximaManutencao',
    label: 'Próxima Manutenção',
    type: 'datetime-local',
    group: 'resultados',
    condition: (entity, formData) => {
      const status = formData?.statusExecucao || entity?.statusExecucao;
      return status === 'FINALIZADA';
    }
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
    group: 'qualidade',
    width: 'quarter',
    condition: (entity, formData) => {
      const status = formData?.statusExecucao || entity?.statusExecucao;
      return status === 'FINALIZADA';
    }
  },
  {
    key: 'observacoesQualidade',
    label: 'Observações da Qualidade',
    type: 'textarea',
    placeholder: 'Comentários sobre a qualidade do serviço',
    group: 'qualidade',
    width: 'three-quarters',
    condition: (entity, formData) => {
      const status = formData?.statusExecucao || entity?.statusExecucao;
      return status === 'FINALIZADA';
    }
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
      const status = formData?.statusExecucao || entity?.statusExecucao;
      // Mostrar se está pausada OU se já passou pela pausa e tem conteúdo
      return status === 'PAUSADA' ||
             (status === 'EM_EXECUCAO' && entity?.motivoPausas) ||
             (status === 'FINALIZADA' && entity?.motivoPausas);
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
    group: 'auditoria',
    width: 'half',
    condition: (entity, formData) => {
      const status = formData?.statusExecucao || entity?.statusExecucao;
      return status === 'FINALIZADA' || status === 'CANCELADA';
    }
  },
  {
    key: 'dataFinalizacao',
    label: 'Data da Finalização',
    type: 'datetime-local',
    disabled: true,
    group: 'auditoria',
    width: 'half',
    condition: (entity, formData) => {
      const status = formData?.statusExecucao || entity?.statusExecucao;
      return status === 'FINALIZADA' || status === 'CANCELADA';
    }
  },
  {
    key: 'aprovadoPor',
    label: 'Aprovado Por',
    type: 'text',
    disabled: true,
    group: 'auditoria',
    width: 'half',
    startNewRow: true,
    condition: (entity, formData) => {
      const status = formData?.statusExecucao || entity?.statusExecucao;
      return status === 'FINALIZADA';
    }
  },
  {
    key: 'dataAprovacao',
    label: 'Data da Aprovação',
    type: 'datetime-local',
    disabled: true,
    group: 'auditoria',
    width: 'half',
    condition: (entity, formData) => {
      const status = formData?.statusExecucao || entity?.statusExecucao;
      return status === 'FINALIZADA';
    }
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
    key: 'origem',
    title: 'Origem da OS',
    fields: ['origemCard']
  },
  {
    key: 'reserva',
    title: 'Reserva de Veículo',
    fields: ['reservaCard', 'kmInicialReserva', 'kmFinalReserva', 'observacoesFinalizacaoReserva']
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
    fields: ['resultadoServico', 'problemasEncontrados', 'recomendacoes', 'proximaManutencao'] // ✅ Campos controlados por condition individual baseada em status
    // Removido conditional do grupo - deixar os campos controlarem sua própria visibilidade
  },
  {
    key: 'qualidade',
    title: 'Avaliação de Qualidade',
    fields: ['avaliacaoQualidade', 'observacoesQualidade'] // ✅ Campos controlados por condition individual baseada em status
    // Removido conditional do grupo - deixar os campos controlarem sua própria visibilidade
  },
  {
    key: 'observacoes',
    title: 'Observações Gerais',
    fields: ['observacoesExecucao', 'motivoPausas', 'motivoCancelamento'] // ✅ ADICIONADO: mapping explícito
  },
  {
    key: 'auditoria',
    title: 'Informações de Auditoria',
    fields: ['finalizadoPor', 'dataFinalizacao', 'aprovadoPor', 'dataAprovacao'] // ✅ Campos controlados por condition individual baseada em status
    // Removido conditional do grupo - deixar os campos controlarem sua própria visibilidade
  }
];