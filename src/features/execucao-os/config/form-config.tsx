// src/features/execucao-os/config/form-config.tsx - CORRIGIDA COM MAPEAMENTO DE GRUPOS E COLSPAN
import type { FormField } from '@/types/base';
import { ProgramacaoSelector } from '../components/ProgramacaoSelector';
import { MateriaisCardManager } from '@/components/common/cards/MateriaisCardManager';
import { FerramentasCardManager } from '@/components/common/cards/FerramentasCardManager';
import { TecnicosCardManager } from '@/components/common/cards/TecnicosCardManager';
import { OrcamentoCardManager } from '@/components/common/cards/OrcamentoCardManager';
import { OrigemOSCardWrapper } from '../components/OrigemOSCardWrapper';
import { ReservaVeiculoCard } from '../components/ReservaVeiculoCard';
import { HistoricoOSCard } from '../components/HistoricoOSCard';
import { AvaliacaoEstrelas } from '../components/AvaliacaoEstrelas';

/**
 * Regra de exibição do sheet da execução (docs/SPEC-EXECUCAO-DA-OS.md):
 * o campo aparece a partir do status em que passa a existir E só se tiver
 * valor. Antes, a OS finalizada mostrava opcional vazio com o placeholder
 * ("Descreva problemas…"), e o resultado só aparecia na FINALIZADA — quem
 * auditava (EXECUTADA) não via o que tinha sido feito.
 */
const DEPOIS_DE_INICIAR = ['EM_EXECUCAO', 'PAUSADA', 'EXECUTADA', 'AUDITADA', 'FINALIZADA'];
const DEPOIS_DE_EXECUTAR = ['EXECUTADA', 'AUDITADA', 'FINALIZADA'];
const DEPOIS_DE_AUDITAR = ['AUDITADA', 'FINALIZADA'];

const temValor = (v: unknown) =>
  v !== undefined && v !== null && String(v).trim() !== '' && !(typeof v === 'number' && Number.isNaN(v));

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- entidade/formData do BaseForm
const exibirSe = (statuses: string[], chave: string, extra?: (entity: any) => boolean) => (entity: any, formData: any) => {
  const status = formData?.statusExecucao || entity?.statusExecucao;
  const valor = formData?.[chave] ?? entity?.[chave];
  return statuses.includes(status) && temValor(valor) && (!extra || extra(entity));
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const temReservaNa = (entity: any) => Boolean(entity?.reserva_veiculo || entity?.reservaVeiculo || entity?.reserva_id);

/**
 * Listas (técnicos, materiais, ferramentas, orçamento): enquanto a OS não foi
 * executada, o card aparece mesmo vazio, porque é ali que se registra. Depois,
 * vazio vira ruído ("Nenhum material cadastrado" no relatório): só aparece
 * se alguma das listas tiver item.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- entidade/formData do BaseForm
const exibirListaSe = (...chaves: string[]) => (entity: any, formData: any) => {
  const status = formData?.statusExecucao || entity?.statusExecucao;
  if (!DEPOIS_DE_EXECUTAR.includes(status)) return true;
  return chaves.some((chave) => {
    const lista = formData?.[chave] ?? entity?.[chave];
    return Array.isArray(lista) && lista.length > 0;
  });
};

const TODOS_OS_STATUS = ['PENDENTE', ...DEPOIS_DE_INICIAR];

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
    width: 'half',
    showOnlyOnMode: ['view', 'edit'],
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
    colSpan: 2,
    startNewRow: true
  },
  // {
  //   key: 'localAtivo',
  //   label: 'Local/Ativo',
  //   type: 'text',
  //   disabled: true,
  //   group: 'identificacao',
  //   width: 'two-thirds'
  // },
  {
    key: 'prioridadeOS',
    label: 'Prioridade',
    type: 'text',
    disabled: true,
    group: 'identificacao',
    width: 'half'
  },

  // Origem da OS - GRUPO: origem
  {
    key: 'origemCard',
    label: '', // Remover label duplicada - o card já tem título interno
    type: 'custom',
    group: 'origem',
    colSpan: 2, // ✅ Ocupa 2 colunas (largura total)
    render: (props: any) => (
      <OrigemOSCardWrapper
        value={props.value}
        entity={props.entity}
        formData={props.formData}
      />
    )
  },

  // Reserva de Veículo - GRUPO: reserva
  {
    key: 'reservaCard',
    label: '', // Remover label duplicada - o card já tem título interno
    type: 'custom',
    component: ReservaVeiculoCard,
    group: 'reserva',
    colSpan: 2, // ✅ Ocupa 2 colunas (largura total)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    condition: (entity: any) => temReservaNa(entity)
  },

  // Dados de Execução da Reserva - GRUPO: reserva
  {
    key: 'kmInicialReserva',
    disabled: true, // D1: vem dos paineis das transicoes; o editar nao grava
    label: 'KM Inicial (Saída)',
    type: 'number',
    placeholder: 'KM do veículo ao sair',
    group: 'reserva',
    width: 'half',
    startNewRow: true,
    condition: exibirSe(DEPOIS_DE_INICIAR, 'kmInicialReserva', temReservaNa)
  },
  {
    key: 'kmFinalReserva',
    disabled: true, // D1: vem dos paineis das transicoes; o editar nao grava
    label: 'KM Final (Retorno)',
    type: 'number',
    placeholder: 'KM do veículo ao retornar',
    group: 'reserva',
    width: 'half',
    required: true,
    condition: exibirSe(DEPOIS_DE_EXECUTAR, 'kmFinalReserva', temReservaNa)
  },
  {
    key: 'observacoesFinalizacaoReserva',
    disabled: true, // D1: vem dos paineis das transicoes; o editar nao grava
    label: 'Observações sobre o Uso do Veículo',
    type: 'textarea',
    placeholder: 'Condições do veículo, problemas encontrados, etc.',
    group: 'reserva',
    colSpan: 2,
    startNewRow: true,
    condition: exibirSe(DEPOIS_DE_EXECUTAR, 'observacoesFinalizacaoReserva', temReservaNa)
  },

  // Controle de Execução - GRUPO: controle
  {
    key: 'statusExecucao',
    label: 'Status da Execução',
    type: 'select',
    required: true,
    disabled: true, // ✅ Status não pode ser mudado manualmente - usar botões de ação
    options: [
      { value: 'PENDENTE', label: 'Pendente' },
      { value: 'EM_EXECUCAO', label: 'Em Execução' },
      { value: 'PAUSADA', label: 'Pausada' },
      { value: 'EXECUTADA', label: 'Executada' },
      { value: 'AUDITADA', label: 'Auditada' },
      { value: 'FINALIZADA', label: 'Finalizada' },
      { value: 'CANCELADA', label: 'Cancelada' }
    ],
    group: 'controle',
    width: 'half'
  },
  {
    key: 'dataHoraInicioReal',
    disabled: true, // D1: vem dos paineis das transicoes; o editar nao grava
    label: 'Data e Hora Início Real',
    type: 'datetime-local',
    group: 'controle',
    width: 'half',
    startNewRow: true,
    required: true,
    condition: exibirSe(DEPOIS_DE_INICIAR, 'dataHoraInicioReal')
  },
  {
    key: 'dataHoraFimReal',
    disabled: true, // D1: vem dos paineis das transicoes; o editar nao grava
    label: 'Data e Hora Fim Real',
    type: 'datetime-local',
    group: 'controle',
    width: 'half',
    condition: exibirSe(DEPOIS_DE_EXECUTAR, 'dataHoraFimReal')
  },
  {
    // Depois das datas: e um valor derivado delas, nao um dado de entrada.
    key: 'tempoTotalExecucao',
    label: 'Tempo Total de Execução (min)',
    type: 'number',
    disabled: true,
    group: 'controle',
    width: 'half',
    startNewRow: true,
    condition: exibirSe(DEPOIS_DE_INICIAR, 'tempoTotalExecucao')
  },

  // Equipe e Responsável - GRUPO: equipe
  {
    key: 'responsavelExecucao',
    disabled: true, // D1: vem dos paineis das transicoes; o editar nao grava
    label: 'Responsável pela Execução',
    type: 'text',
    required: true,
    placeholder: 'Nome do responsável',
    group: 'equipe',
    // Sozinho na linha: ocupa a largura toda. "Função do Responsável" saiu —
    // nada a preenchia (nem a API nem o transform), e na leitura era caixa vazia.
    colSpan: 2,
    condition: exibirSe(TODOS_OS_STATUS, 'responsavelExecucao')
  },


  // Técnicos da Execução - GRUPO: equipe
  {
    key: 'tecnicos',
    disabled: true, // D1: vem dos paineis das transicoes; o editar nao grava
    label: '', // Remover label duplicada - o card já tem título interno
    type: 'custom',
    component: TecnicosCardManager,
    componentProps: {
      mode: 'execucao',
      showCustos: true,
      showStatus: true,
      showHorasReais: true,
      title: 'Equipe de Execução'
    },
    defaultValue: [],
    group: 'equipe',
    colSpan: 2, // ✅ Ocupa 2 colunas (largura total)
    condition: exibirListaSe('tecnicos')
  },

  // Atividades e Checklist - GRUPO: atividades
  // ⚠️ MOVIDO PARA FinalizarExecucaoModal - Só mostra em visualização de execuções finalizadas
  {
    key: 'atividadesRealizadas',
    label: 'Atividades Realizadas',
    type: 'textarea',
    placeholder: 'Descreva as atividades executadas',
    group: 'atividades',
    colSpan: 2,
    disabled: true,
    condition: exibirSe(DEPOIS_DE_EXECUTAR, 'atividadesRealizadas')
  },
  {
    key: 'checklistConcluido',
    label: 'Checklist Concluído (%)',
    type: 'number',
    min: 0,
    max: 100,
    placeholder: '0-100',
    group: 'atividades',
    width: 'third',
    disabled: true,
    startNewRow: true,
    condition: () => false
  },
  {
    key: 'procedimentosSeguidos',
    label: 'Procedimentos Seguidos',
    type: 'textarea',
    placeholder: 'Liste os procedimentos seguidos',
    group: 'atividades',
    colSpan: 2,
    disabled: true,
    condition: exibirSe(DEPOIS_DE_EXECUTAR, 'procedimentosSeguidos')
  },

  // Recursos Consumidos - Materiais - GRUPO: recursos
  {
    key: 'materiaisConsumidos',
    label: '', // Remover label duplicada - o card já tem título interno
    type: 'custom',
    component: MateriaisCardManager,
    componentProps: {
      mode: 'execucao',
      showCustos: true,
      showStatus: true,
      title: 'Materiais Consumidos'
    },
    defaultValue: [],
    group: 'recursos',
    colSpan: 2, // ✅ Ocupa 2 colunas (largura total)
    condition: exibirListaSe('materiaisConsumidos')
  },

  // Recursos Utilizados - Ferramentas - GRUPO: recursos
  {
    key: 'ferramentasUtilizadas',
    label: '', // Remover label duplicada - o card já tem título interno
    type: 'custom',
    component: FerramentasCardManager,
    componentProps: {
      mode: 'execucao',
      showStatus: true,
      showCondicao: true,
      showCalibracao: true,
      title: 'Ferramentas Utilizadas'
    },
    defaultValue: [],
    group: 'recursos',
    colSpan: 2, // ✅ Ocupa 2 colunas (largura total) - linha separada
    condition: exibirListaSe('ferramentasUtilizadas')
  },

  // ⚠️ MOVIDO PARA FinalizarExecucaoModal - Só mostra em visualização
  {
    key: 'custosAdicionais',
    colSpan: 2,
    label: 'Custos Adicionais (R$)',
    type: 'number',
    placeholder: 'Custos não planejados',
    group: 'recursos',
    width: 'half',
    disabled: true,
    startNewRow: true,
    condition: exibirSe(DEPOIS_DE_EXECUTAR, 'custosAdicionais')
  },

  // Orçamento - GRUPO: orcamento
  {
    key: 'itens_orcamento',
    label: '', // duplicava o titulo do grupo
    type: 'custom',
    component: OrcamentoCardManager,
    componentProps: (formData: any) => {
      const materiais = formData?.materiaisConsumidos || formData?.materiais || [];
      const tecnicos = formData?.tecnicos || formData?.tecnicosPresentes || [];
      const custoMateriais = materiais.reduce((acc: number, m: any) => {
        return acc + ((Number(m.custo_unitario) || 0) * (Number(m.quantidade_planejada) || Number(m.quantidade_consumida) || 0));
      }, 0);
      const custoEquipe = tecnicos.reduce((acc: number, t: any) => {
        return acc + ((Number(t.custo_hora) || 0) * (Number(t.horas_estimadas) || Number(t.horas_trabalhadas) || 0));
      }, 0);
      return {
        title: 'Outros Custos',
        custoMateriais,
        custoEquipe,
        disabled: true
      };
    },
    defaultValue: [],
    group: 'orcamento',
    colSpan: 2,
    condition: exibirListaSe('itens_orcamento', 'materiaisConsumidos', 'tecnicos'),
  },

  // Condições de Segurança - GRUPO: seguranca
  // ⚠️ MOVIDO PARA FinalizarExecucaoModal - Só mostra em visualização de execuções finalizadas
  {
    key: 'equipamentosSeguranca',
    label: 'EPIs e Equipamentos de Segurança',
    type: 'textarea',
    placeholder: 'Liste os EPIs utilizados',
    group: 'seguranca',
    colSpan: 2,
    disabled: true,
    condition: exibirSe(DEPOIS_DE_EXECUTAR, 'equipamentosSeguranca')
  },
  {
    key: 'incidentesSeguranca',
    label: 'Incidentes de Segurança',
    type: 'textarea',
    placeholder: 'Relate qualquer incidente ou quase acidente',
    group: 'seguranca',
    colSpan: 2,
    disabled: true,
    startNewRow: true,
    condition: exibirSe(DEPOIS_DE_EXECUTAR, 'incidentesSeguranca')
  },

  // Resultados e Qualidade - GRUPO: resultados
  {
    key: 'resultadoServico',
    disabled: true, // D1: vem dos paineis das transicoes; o editar nao grava
    label: 'Resultado do Serviço',
    type: 'textarea',
    colSpan: 2,
    placeholder: 'Descreva o resultado obtido',
    required: true,
    group: 'resultados',
    condition: exibirSe(DEPOIS_DE_EXECUTAR, 'resultadoServico')
  },
  {
    key: 'problemasEncontrados',
    disabled: true, // D1: vem dos paineis das transicoes; o editar nao grava
    label: 'Problemas Encontrados',
    type: 'textarea',
    colSpan: 2,
    placeholder: 'Descreva problemas identificados durante a execução',
    group: 'resultados',
    condition: exibirSe(DEPOIS_DE_EXECUTAR, 'problemasEncontrados')
  },
  {
    key: 'recomendacoes',
    disabled: true, // D1: vem dos paineis das transicoes; o editar nao grava
    label: 'Recomendações',
    type: 'textarea',
    colSpan: 2,
    placeholder: 'Recomendações para futuras manutenções',
    group: 'resultados',
    condition: exibirSe(DEPOIS_DE_EXECUTAR, 'recomendacoes')
  },
  {
    key: 'proximaManutencao',
    colSpan: 2,
    disabled: true, // D1: vem dos paineis das transicoes; o editar nao grava
    label: 'Próxima Manutenção',
    type: 'datetime-local',
    group: 'resultados',
    condition: exibirSe(DEPOIS_DE_EXECUTAR, 'proximaManutencao')
  },

  // Avaliação de Qualidade - GRUPO: qualidade
  {
    key: 'avaliacaoQualidade',
    colSpan: 2,
    disabled: true, // D1: vem dos paineis das transicoes; o editar nao grava
    label: 'Avaliação da qualidade',
    type: 'custom',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render: ({ entity, formData }: any) => (
      <AvaliacaoEstrelas valor={Number(formData?.avaliacaoQualidade ?? entity?.avaliacaoQualidade)} somenteLeitura />
    ),
    group: 'qualidade',
    // Desde AUDITADA: a nota e dada no painel de auditar, entao o auditor
    // precisa conseguir reabrir a OS e conferir o que registrou.
    condition: exibirSe(DEPOIS_DE_AUDITAR, 'avaliacaoQualidade')
  },
  {
    key: 'observacoesQualidade',
    disabled: true, // D1: vem dos paineis das transicoes; o editar nao grava
    label: 'Observações da Qualidade',
    type: 'textarea',
    placeholder: 'Comentários sobre a qualidade do serviço',
    group: 'qualidade',
    colSpan: 2,
    condition: exibirSe(DEPOIS_DE_AUDITAR, 'observacoesQualidade')
  },

  // Observações e Paradas - GRUPO: observacoes
  {
    key: 'observacoesExecucao',
    disabled: true, // D1: vem dos paineis das transicoes; o editar nao grava
    label: 'Observações da Execução',
    type: 'textarea',
    colSpan: 2,
    placeholder: 'Observações gerais sobre a execução',
    group: 'observacoes',
    condition: exibirSe(DEPOIS_DE_INICIAR, 'observacoesExecucao')
  },
  {
    key: 'motivoCancelamento',
    disabled: true, // D1: vem dos paineis das transicoes; o editar nao grava
    label: 'Motivo do Cancelamento',
    type: 'textarea',
    colSpan: 2,
    placeholder: 'Descreva o motivo do cancelamento',
    required: true,
    condition: (entity, formData) => {
      return formData?.statusExecucao === 'CANCELADA' ||
             (entity && entity.statusExecucao === 'CANCELADA');
    },
    group: 'observacoes'
  },

  // Historico - GRUPO: historico
  {
    key: 'historicoOS',
    label: '',
    type: 'custom',
    group: 'historico',
    colSpan: 2,
    showOnlyOnMode: ['view', 'edit'],
    render: (props: any) => (
      <HistoricoOSCard historico={props.entity?.historico} />
    )
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
    // Mostra data_hora_fim_real: nao existe coluna de "finalizado em". Sao
    // momentos diferentes do fluxo (EXECUTADA -> AUDITADA -> FINALIZADA).
    label: 'Data de Conclusão da Execução',
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
  // A ordem segue a vida da OS: o que e e em que pe esta, de onde veio,
  // quando e quem executa, como vai ate la, o que foi feito e gasto, e por fim
  // o resultado e a avaliacao. O status ficava escondido no meio do sheet, e a
  // reserva de veiculo aparecia antes de se saber quem ia executar.
  {
    key: 'identificacao',
    title: 'Identificação da OS',
    // Numero e status lado a lado; tipo e prioridade na linha de baixo; a
    // descricao em largura total.
    fields: ['numeroOS', 'statusExecucao', 'tipoOS', 'prioridadeOS', 'descricaoOS']
  },
  {
    key: 'origem',
    title: 'Origem da OS',
    fields: ['origemCard']
  },
  {
    key: 'controle',
    title: 'Execução',
    columns: 3,
    fields: ['dataHoraInicioReal', 'dataHoraFimReal', 'tempoTotalExecucao']
  },
  {
    key: 'equipe',
    title: 'Equipe de Execução',
    fields: ['responsavelExecucao', 'tecnicos'] // ✅ ADICIONADO: mapping explícito
  },
  {
    key: 'reserva',
    title: 'Reserva de Veículo',
    fields: ['reservaCard', 'kmInicialReserva', 'kmFinalReserva', 'observacoesFinalizacaoReserva']
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
    key: 'orcamento',
    title: 'Orçamento',
    fields: ['itens_orcamento']
  },
  {
    key: 'seguranca',
    title: 'Segurança e EPIs',
    fields: ['equipamentosSeguranca', 'incidentesSeguranca']
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
    fields: ['observacoesExecucao', 'motivoCancelamento']
  },
  {
    key: 'historico',
    title: 'Histórico da OS',
    fields: ['historicoOS']
  },
  {
    key: 'auditoria',
    title: 'Informações de Auditoria',
    fields: ['finalizadoPor', 'dataFinalizacao', 'aprovadoPor', 'dataAprovacao'] // ✅ Campos controlados por condition individual baseada em status
    // Removido conditional do grupo - deixar os campos controlarem sua própria visibilidade
  }
];
