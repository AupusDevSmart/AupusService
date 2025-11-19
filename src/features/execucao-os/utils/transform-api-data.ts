// src/features/execucao-os/utils/transform-api-data.ts

import { ExecucaoOS, ChecklistAtividade } from '../types';
import { ExecucaoOSApiResponse } from '@/services/execucao-os.service';

/**
 * Transforma a resposta da API para o formato esperado pelo frontend
 */
export function transformApiResponseToExecucaoOS(apiData: any): ExecucaoOS {
  // Calcular tempo total de execução em minutos
  const calcularTempoExecucao = (): number | undefined => {
    if (!apiData.data_hora_inicio_real) return undefined;

    const inicio = new Date(apiData.data_hora_inicio_real).getTime();
    const fim = apiData.data_hora_fim_real
      ? new Date(apiData.data_hora_fim_real).getTime()
      : new Date().getTime();

    const diffMs = fim - inicio;
    return Math.round(diffMs / 60000); // Converter para minutos
  };

  // Separar data e hora de uma string ISO
  const separarDataHora = (isoString?: string): { data: string; hora: string } => {
    if (!isoString) return { data: '', hora: '' };

    const date = new Date(isoString);
    return {
      data: date.toISOString().split('T')[0],
      hora: date.toTimeString().split(' ')[0].substring(0, 5) // HH:mm
    };
  };

  const dataProgramada = separarDataHora(apiData.data_hora_programada);
  const dataInicioReal = separarDataHora(apiData.data_hora_inicio_real);
  const dataFimReal = separarDataHora(apiData.data_hora_fim_real);

  // Transformar checklist_atividades para camelCase
  const checklistAtividades: ChecklistAtividade[] = (apiData.checklist_atividades || []).map((item: any) => ({
    id: item.id,
    descricao: item.descricao,
    obrigatoria: item.obrigatoria,
    concluida: item.concluida,
    dataHoraConclusao: item.data_hora_conclusao,
    observacoes: item.observacoes,
    concluidoPor: item.concluido_por,
    ordem: item.ordem,
  }));

  // Construir o objeto transformado com TODOS os campos
  const transformed: ExecucaoOS = {
    // Campos base (BaseEntity)
    id: apiData.id,
    criado_em: apiData.criado_em,
    atualizado_em: apiData.atualizado_em,
    deletado_em: apiData.deletado_em,
    criadoEm: apiData.criado_em,
    atualizadoEm: apiData.atualizado_em,

    // Relacionamento
    programacao_id: apiData.programacao_id,

    // Identificação
    numero_os: apiData.numero_os || apiData.codigo,
    numeroOS: apiData.numero_os || apiData.codigo,
    descricao: apiData.descricao,
    local: apiData.local,
    ativo: apiData.ativo,

    // Classificação
    condicoes: apiData.condicoes,
    status: apiData.status,
    statusExecucao: apiData.status,
    tipo: apiData.tipo,
    prioridade: apiData.prioridade,
    origem: apiData.origem,

    // Relacionamentos de origem
    planta_id: apiData.planta_id,
    equipamento_id: apiData.equipamento_id,
    anomalia_id: apiData.anomalia_id,
    plano_manutencao_id: apiData.plano_manutencao_id,
    reserva_id: apiData.reserva_id,
    dados_origem: apiData.dados_origem,

    // Planejamento
    tempo_estimado: apiData.tempo_estimado,
    duracao_estimada: apiData.duracao_estimada,

    // Programação
    data_hora_programada: apiData.data_hora_programada,
    responsavel: apiData.responsavel || 'Não atribuído',
    responsavelExecucao: apiData.responsavel || 'Não atribuído',
    responsavel_id: apiData.responsavel_id,
    time_equipe: apiData.time_equipe,

    // Execução Real
    data_hora_inicio_real: apiData.data_hora_inicio_real,
    dataInicioReal: dataInicioReal.data,
    horaInicioReal: dataInicioReal.hora,
    data_hora_fim_real: apiData.data_hora_fim_real,
    dataFimReal: dataFimReal.data,
    horaFimReal: dataFimReal.hora,

    // Equipe presente
    equipe_presente: apiData.equipe_presente || [],
    equipePresente: apiData.equipe_presente || [],

    // Custos
    orcamento_previsto: apiData.orcamento_previsto,
    custo_real: apiData.custo_real,

    // Observações
    observacoes: apiData.observacoes,
    observacoes_programacao: apiData.observacoes_programacao,
    observacoes_execucao: apiData.observacoes_execucao,
    observacoesExecucao: apiData.observacoes_execucao,
    observacoesInicio: apiData.observacoes_inicio,
    observacoesFinalizacao: apiData.observacoes_finalizacao,
    motivo_cancelamento: apiData.motivo_cancelamento,

    // Resultados da execução
    resultado_servico: apiData.resultado_servico,
    resultadoServico: apiData.resultado_servico,
    problemas_encontrados: apiData.problemas_encontrados,
    problemasEncontrados: apiData.problemas_encontrados,
    recomendacoes: apiData.recomendacoes,
    proxima_manutencao: apiData.proxima_manutencao,

    // Qualidade
    avaliacao_qualidade: apiData.avaliacao_qualidade,
    avaliacaoQualidade: apiData.avaliacao_qualidade,
    observacoes_qualidade: apiData.observacoes_qualidade,

    // Auditoria
    criado_por: apiData.criado_por,
    criado_por_id: apiData.criado_por_id,
    programado_por: apiData.programado_por,
    programado_por_id: apiData.programado_por_id,
    finalizado_por: apiData.finalizado_por,
    finalizado_por_id: apiData.finalizado_por_id,
    aprovado_por: apiData.aprovado_por,
    aprovado_por_id: apiData.aprovado_por_id,
    data_aprovacao: apiData.data_aprovacao,

    // Relacionamentos (arrays)
    materiais: apiData.materiais || [],
    materiaisConsumidos: apiData.materiais || [],
    ferramentas: apiData.ferramentas || [],
    ferramentasUtilizadas: apiData.ferramentas || [],
    tecnicos: apiData.tecnicos || [],
    tecnicosPresentes: apiData.tecnicos || [],
    historico: apiData.historico || [],
    checklist_atividades: apiData.checklist_atividades || [],
    checklistAtividades: checklistAtividades,
    anexos: apiData.anexos || [],
    registros_tempo: apiData.registros_tempo || [],
    tarefas_os: apiData.tarefas_os || [],

    // Relacionamentos expandidos
    programacao: apiData.programacao,
    planta: apiData.planta,
    equipamento: apiData.equipamento,
    anomalia: apiData.anomalia,
    plano_manutencao: apiData.plano_manutencao,
    reserva_veiculo: apiData.reserva_veiculo,

    // Campos computados
    tempoTotalExecucao: calcularTempoExecucao(),
    tempo_execucao_minutos: calcularTempoExecucao(),

    // Objeto "os" aninhado para compatibilidade com componentes antigos
    os: {
      id: apiData.id,
      numeroOS: apiData.numero_os || apiData.codigo,
      descricao: apiData.descricao,
      local: apiData.local,
      ativo: apiData.ativo,
      tipo: apiData.tipo,
      prioridade: apiData.prioridade,
      dataProgramada: dataProgramada.data,
      horaProgramada: dataProgramada.hora,
      duracaoEstimada: apiData.duracao_estimada,
      tempoEstimado: apiData.tempo_estimado,
      viatura: apiData.reserva_veiculo ? {
        veiculoId: apiData.reserva_veiculo.veiculo_id,
        modelo: apiData.reserva_veiculo.modelo || '',
        placa: apiData.reserva_veiculo.placa || '',
      } : undefined,
    },
  };

  return transformed;
}

/**
 * Transforma um array de respostas da API
 */
export function transformApiArrayToExecucaoOS(apiDataArray: any[]): ExecucaoOS[] {
  return apiDataArray.map(transformApiResponseToExecucaoOS);
}
