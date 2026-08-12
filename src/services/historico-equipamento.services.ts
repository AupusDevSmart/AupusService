// src/services/historico-equipamento.services.ts
import { api } from '@/config/api';

export interface TarefaDoHistorico {
  id: string;
  nome: string;
  status: string;
  data_conclusao: string | null;
  concluida_por: string | null;
}

export interface ItemHistoricoOS {
  tipo: 'OS' | 'PROGRAMACAO';
  id: string;
  numero: string;
  descricao: string;
  status: string;
  /** ANOMALIA, TAREFA, PLANO_MANUTENCAO, SOLICITACAO_SERVICO ou MANUAL. */
  origem: string;
  data: string | null;
  tarefas_total: number;
  tarefas_concluidas: number;
  tarefas: TarefaDoHistorico[];
}

export interface SituacaoDaTarefa {
  id: string;
  nome: string;
  frequencia: string | null;
  ultima_execucao: string | null;
  numero_execucoes: number;
  proxima_execucao: string | null;
  /** Negativo quer dizer atrasada. Null quando a tarefa não tem periodicidade. */
  dias_ate_proxima: number | null;
}

export interface HistoricoDoEquipamento {
  tarefas: SituacaoDaTarefa[];
  ordens: ItemHistoricoOS[];
}

/**
 * Histórico de manutenção de um equipamento.
 *
 * O endpoint vive no AupusService (módulo tarefas), não no api-shared: OS só
 * existe neste produto.
 *
 * A situação das tarefas vem calculada de lá de propósito — a conta da próxima
 * execução é a mesma que o agendador usa, e refazê-la aqui já tinha feito a
 * tela discordar do cron depois de uma OS cancelada.
 */
export class HistoricoEquipamentoApiService {
  async obter(equipamentoId: string): Promise<HistoricoDoEquipamento> {
    const resposta = await api.get(`/equipamentos/${equipamentoId.trim()}/historico-os`);
    const dados = resposta.data?.data ?? resposta.data ?? {};

    return {
      tarefas: Array.isArray(dados.tarefas) ? dados.tarefas : [],
      ordens: Array.isArray(dados.ordens) ? dados.ordens : [],
    };
  }
}

export const historicoEquipamentoApi = new HistoricoEquipamentoApiService();
