// src/features/execucao-os/utils/transform-api-data.ts

import { ExecucaoOS } from '../types';
import type { OrdemServicoDaApi } from '@/services/execucao-os.service';
import { duracaoLegivel } from '@/utils/horas';
import { descreverCustoReal, descreverHorasHomem } from './horas-da-equipe';
import { codigoAgrupado } from './documento-da-os';

/**
 * Transforma a resposta da API para o formato esperado pelo frontend
 */
export function transformApiResponseToExecucaoOS(apiData: OrdemServicoDaApi): ExecucaoOS {

  // Separar data e hora de uma string ISO
  const separarDataHora = (isoString?: string): { data: string; hora: string } => {
    if (!isoString) return { data: '', hora: '' };

    const date = new Date(isoString);
    const pad = (n: number) => String(n).padStart(2, '0');
    // Data e hora no MESMO fuso (local). A data saia de toISOString (UTC) e a
    // hora de toTimeString (local): OS programada para 22h aparecia no dia
    // seguinte, com a hora certa.
    return {
      data: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
      hora: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
    };
  };

  const dataProgramada = separarDataHora(apiData.data_hora_programada);
  const dataInicioReal = separarDataHora(apiData.data_hora_inicio_real);
  const dataFimReal = separarDataHora(apiData.data_hora_fim_real);

  // Formatar para datetime-local (YYYY-MM-DDTHH:mm)
  const toDatetimeLocal = (isoString?: string): string => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  // Transformar checklist_atividades para camelCase (formato antigo: a API
  // manda o checklist em `checklist`, e ninguem le este campo)
  const checklistAtividades = (apiData.checklist_atividades || []).map((item) => ({
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
  const transformed = {
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
    // Vazio no lugar de ausente: o BaseModal trata os dois igual
    numero_os: apiData.numero_os || apiData.codigo || '',
    numeroOS: apiData.numero_os || apiData.codigo,
    descricao: apiData.descricao,
    descricaoOS: apiData.descricao,
    local: apiData.local,
    localAtivo: [apiData.local, apiData.ativo].filter(Boolean).join(' - '),
    ativo: apiData.ativo,

    // Este transform e uma lista de permissao: campo que nao aparece aqui e
    // descartado em silencio, por mais que a API o mande. A instalacao entra
    // como veio — vazia significa "a origem nao tem", e trocar por `[]` a mais
    // ou a menos apagaria a distincao que a celula usa.
    instalacoes: apiData.instalacoes,

    // Classificação
    condicoes: apiData.condicoes,
    status: apiData.status,
    statusExecucao: apiData.status,
    tipo: apiData.tipo,
    tipoOS: apiData.tipo,
    prioridade: apiData.prioridade,
    prioridadeOS: apiData.prioridade,
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
    dataHoraInicioReal: toDatetimeLocal(apiData.data_hora_inicio_real),
    data_hora_fim_real: apiData.data_hora_fim_real,
    dataFimReal: dataFimReal.data,
    horaFimReal: dataFimReal.hora,
    dataHoraFimReal: toDatetimeLocal(apiData.data_hora_fim_real),

    // Equipe presente
    equipe_presente: apiData.equipe_presente || [],
    equipePresente: apiData.equipe_presente || [],

    // Custos
    orcamento_previsto: apiData.orcamento_previsto,
    custo_real: apiData.custo_real,
    itens_orcamento: apiData.itens_orcamento || [],

    // Observações
    observacoes: apiData.observacoes,
    observacoes_programacao: apiData.observacoes_programacao,
    observacoes_execucao: apiData.observacoes_execucao,
    observacoesExecucao: apiData.observacoes_execucao,
    observacoesInicio: apiData.observacoes_inicio,
    observacoesFinalizacao: apiData.observacoes_finalizacao,
    motivo_cancelamento: apiData.motivo_cancelamento,
    motivoCancelamento: apiData.motivo_cancelamento,
    motivoPausas: apiData.motivo_pausa,

    // Resultados da execução
    resultado_servico: apiData.resultado_servico,
    resultadoServico: apiData.resultado_servico,
    problemas_encontrados: apiData.problemas_encontrados,
    problemasEncontrados: apiData.problemas_encontrados,
    // O painel do Executar lê o que já está na OS (reexecutar depois de reabrir)
    incidentes_seguranca: apiData.incidentes_seguranca,
    recomendacoes: apiData.recomendacoes,
    proxima_manutencao: apiData.proxima_manutencao,
    proximaManutencao: toDatetimeLocal(apiData.proxima_manutencao),

    // SN-60: dados de falha. O ISO vai para o painel do Executar (que preenche
    // com o que já está na OS); o local, para a leitura
    parada_inicio: apiData.parada_inicio,
    parada_fim: apiData.parada_fim,
    paradaInicio: toDatetimeLocal(apiData.parada_inicio ?? undefined),
    paradaFim: toDatetimeLocal(apiData.parada_fim ?? undefined),
    // Legível: 4320 min não diz nada; "3 d" diz
    tempoParado: duracaoLegivel(apiData.minutos_parado) || undefined,
    falha_sintoma: apiData.falha_sintoma,
    falha_causa: apiData.falha_causa,
    falha_acao: apiData.falha_acao,
    falhaSintoma: apiData.falha_sintoma,
    falhaCausa: apiData.falha_causa,
    falhaAcao: apiData.falha_acao,

    // SN-61: horas-homem e tempo sem as pausas. Crus para o painel do Executar
    // (que começa as horas no tempo efetivo); legíveis para a leitura
    hh_real: apiData.hh_real,
    hh_estimado: apiData.hh_estimado,
    tempo_efetivo_minutos: apiData.tempo_efetivo_minutos,
    // Em execução, o tempo continua correndo depois da leitura: o painel do
    // Executar soma o que passou (aberto às 8h05, executado ao meio-dia)
    tempo_efetivo_lido_em: Date.now(),
    hhReal: descreverHorasHomem(apiData.hh_real, apiData.hh_estimado),
    tempoEfetivo: duracaoLegivel(apiData.tempo_efetivo_minutos) || undefined,
    custoReal: descreverCustoReal(apiData.custo_real, apiData.hh_real, apiData.tecnicos),

    // Qualidade
    avaliacao_qualidade: apiData.avaliacao_qualidade,
    avaliacaoQualidade: apiData.avaliacao_qualidade,
    observacoes_qualidade: apiData.observacoes_qualidade,
    observacoesQualidade: apiData.observacoes_qualidade,

    // Auditoria
    criado_por: apiData.criado_por,
    criado_por_id: apiData.criado_por_id,
    programado_por: apiData.programado_por,
    programado_por_id: apiData.programado_por_id,
    finalizado_por: apiData.finalizado_por,
    finalizado_por_id: apiData.finalizado_por_id,
    finalizadoPor: apiData.finalizado_por,
    // A data da finalização (SN-62); antes a tela mostrava o fim da execução no lugar
    dataFinalizacao: toDatetimeLocal(apiData.finalizada_em ?? undefined),
    finalizada_em: apiData.finalizada_em,
    codigo_verificacao: apiData.codigo_verificacao,
    codigoVerificacao: codigoAgrupado(apiData.codigo_verificacao) || undefined,
    aprovado_por: apiData.aprovado_por,
    aprovado_por_id: apiData.aprovado_por_id,
    aprovadoPor: apiData.aprovado_por,
    data_aprovacao: apiData.data_aprovacao,
    dataAprovacao: toDatetimeLocal(apiData.data_aprovacao),

    // Relacionamentos (arrays)
    materiais: apiData.materiais || [],
    materiaisConsumidos: apiData.materiais || [],
    ferramentas: apiData.ferramentas || [],
    ferramentasUtilizadas: apiData.ferramentas || [],
    tecnicos: apiData.tecnicos || [],
    tecnicosPresentes: apiData.tecnicos || [],
    historico: apiData.historico || [],
    checklist_atividades: apiData.checklist_atividades || [],
    // A API manda o checklist em `checklist` (com tarefa_os_id). Ler só
    // `checklist_atividades` deixava a tela sempre sem checklist.
    checklist: apiData.checklist || apiData.checklist_atividades || [],
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
    // km registrados no Iniciar/Executar (os campos de leitura do sheet liam
    // estas chaves, que nunca eram preenchidas)
    kmInicialReserva: apiData.reserva_veiculo?.km_inicial ?? undefined,
    kmFinalReserva: apiData.reserva_veiculo?.km_final ?? undefined,

    // ✅ Dados transformados para o ReservaVeiculoCard
    reservaCard: apiData.reserva_veiculo ? {
      veiculo: apiData.reserva_veiculo.veiculo?.placa || apiData.reserva_veiculo.veiculo?.modelo || '',
      kmInicial: apiData.reserva_veiculo.km_inicial,
      kmFinal: apiData.reserva_veiculo.km_final,
      status: apiData.reserva_veiculo.status,
      dataInicioReserva: apiData.reserva_veiculo.data_inicio,
      horaInicioReserva: apiData.reserva_veiculo.hora_inicio,
      dataFimReserva: apiData.reserva_veiculo.data_fim,
      horaFimReserva: apiData.reserva_veiculo.hora_fim,
      finalidadeReserva: apiData.reserva_veiculo.finalidade,
    } : undefined,

    // ✅ Dados transformados para o OrigemOSCard
    origemCard: {
      programacao_id: apiData.programacao_id,
      anomalia: apiData.anomalia,
      plano_manutencao: apiData.plano_manutencao,
      origem: apiData.origem,
      dados_origem: apiData.dados_origem,
    },

    // Detalhes da execucao (aliases camelCase para form-config)
    atividadesRealizadas: apiData.atividades_realizadas,
    checklistConcluido: apiData.checklist_concluido,
    procedimentosSeguidos: apiData.procedimentos_seguidos,
    equipamentosSeguranca: apiData.equipamentos_seguranca,
    incidentesSeguranca: apiData.incidentes_seguranca,
    medidasSegurancaAdicionais: apiData.medidas_seguranca_adicionais,
    custosAdicionais: apiData.custos_adicionais,

    // Campos computados
    // O tempo efetivo da API (sem as pausas, SN-61); a conta local é para resposta sem ele
    // O tempo efetivo da API (sem as pausas, SN-61). A conta local que havia aqui
    // (fim - início, ou até agora) contava as pausas e, na OS cancelada depois de
    // iniciada, crescia todo dia — a API manda null de propósito
    tempoTotalExecucao: apiData.tempo_efetivo_minutos ?? undefined,
    tempo_execucao_minutos: apiData.tempo_efetivo_minutos ?? undefined,

    // Objeto "os" aninhado para compatibilidade com componentes antigos
    os: {
      id: apiData.id,
      numeroOS: apiData.numero_os || apiData.codigo || '',
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
        modelo: apiData.reserva_veiculo.veiculo?.modelo || '',
        placa: apiData.reserva_veiculo.veiculo?.placa || '',
      } : undefined,
    },
  };

  return transformed;
}

/**
 * Transforma um array de respostas da API
 */
export function transformApiArrayToExecucaoOS(apiDataArray: OrdemServicoDaApi[]): ExecucaoOS[] {
  return apiDataArray.map(transformApiResponseToExecucaoOS);
}
