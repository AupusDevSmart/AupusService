import { api } from '@/config/api';

/**
 * O que o calendário pinta (SN-52): `previsto` (o gerador ainda vai criar),
 * `atrasado` (venceu e não foi feito), `programado` (programação ou OS a
 * fazer), `em_execucao`, `feito` e `nao_sai` (o gerador não consegue
 * programar; o motivo vem junto).
 */
export type SituacaoDoEvento = 'previsto' | 'atrasado' | 'programado' | 'em_execucao' | 'feito' | 'nao_sai';

export type TipoDaOS = 'PREVENTIVA' | 'PREDITIVA' | 'CORRETIVA' | 'INSPECAO' | 'VISITA_TECNICA';

export interface PrevisaoDoEvento {
  tarefa_tag: string;
  tarefa_nome: string;
  frequencia: string | null;
  equipamento_nome: string;
  /** O dia em que o ciclo vence (ISO); a `data` do evento é para quando sai. */
  ciclo: string;
  /** A rodada do gerador (3h de Brasília) que cria a programação, em ISO; null se não sai. */
  programacao_a_partir_de: string | null;
  /** A data é estimada: o gerador agrupa por instalação e a pessoa pode remarcar. */
  data_estimada: boolean;
}

export interface EventoDaAgenda {
  /** Único no calendário: `os:<id>`, `programacao:<id>`, `previsao:<tarefa>:<ciclo>`. */
  id: string;
  origem: 'os' | 'programacao' | 'previsao';
  /** ISO em UTC. */
  data: string;
  titulo: string;
  descricao: string | null;
  situacao: SituacaoDoEvento;
  motivo: string | null;
  status: string;
  tipo: string;
  prioridade: string | null;
  planta_id: string | null;
  planta_nome: string | null;
  instalacoes: string[];
  /** Caminho na tela que abre o registro; a previsão não tem página. */
  link: string | null;
  previsao: PrevisaoDoEvento | null;
}

export interface CalendarioDaAgenda {
  eventos: EventoDaAgenda[];
  /** O que venceu antes do período e continua por fazer. */
  atrasados_antes: number;
  /** Programações a aprovar e OS abertas sem data nenhuma: não cabem num dia. */
  sem_data: number;
  opcoes: { plantas: { id: string; nome: string }[] };
}

export interface FiltroDoCalendario {
  /** AAAA-MM-DD, inclusive. */
  inicio: string;
  fim: string;
  planta_id?: string;
  /** O equipamento e os componentes dele. */
  equipamento_id?: string;
  tipo?: TipoDaOS;
}

export const eventosDaAgendaApi = {
  async listar(filtro: FiltroDoCalendario): Promise<CalendarioDaAgenda> {
    const { data } = await api.get<CalendarioDaAgenda>('/agenda/eventos', { params: filtro });
    return data;
  },
};
