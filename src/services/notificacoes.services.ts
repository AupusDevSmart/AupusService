import { api } from '@/config/api';

/** Uma notificação de quem está logado (SN-47). `acao` pede que a pessoa faça algo; `info` só avisa. */
export interface Notificacao {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: 'acao' | 'info' | string;
  /** Caminho na tela que abre o registro (`/execucao-os?execucaoId=...`). */
  link: string | null;
  lida: boolean;
  evento: string | null;
  /** ISO em UTC. */
  created_at: string;
}

export interface PaginaDeNotificacoes {
  data: Notificacao[];
  pagination: { page: number; limit: number; total: number };
  naoLidas: number;
}

/** O que a pessoa recebe por e-mail, evento a evento. O sininho recebe tudo. */
export interface PreferenciaDeNotificacao {
  evento: string;
  grupo: string;
  nome: string;
  /** O evento pede ação: o e-mail vem ligado por padrão. */
  acao: boolean;
  email: boolean;
}

const BASE = '/notificacoes';

export const notificacoesApi = {
  async listar(filtro: { somenteNaoLidas?: boolean; page?: number; limit?: number }): Promise<PaginaDeNotificacoes> {
    const { data } = await api.get<PaginaDeNotificacoes>(BASE, {
      params: { somenteNaoLidas: filtro.somenteNaoLidas ? 'true' : undefined, page: filtro.page, limit: filtro.limit },
    });
    return data;
  },

  /** Roda a cada minuto: a falha aparece no próprio sino, não num toast por rodada. */
  async contarNaoLidas(): Promise<number> {
    const { data } = await api.get<{ total: number }>(`${BASE}/nao-lidas/contagem`, { semAvisoGlobal: true });
    return data.total;
  },

  async marcarLida(id: string): Promise<void> {
    await api.patch(`${BASE}/${id.trim()}/lida`);
  },

  async marcarTodasLidas(): Promise<number> {
    const { data } = await api.patch<{ marcadas: number }>(`${BASE}/lidas`);
    return data.marcadas;
  },

  async preferencias(): Promise<PreferenciaDeNotificacao[]> {
    const { data } = await api.get<PreferenciaDeNotificacao[]>(`${BASE}/preferencias`);
    return data;
  },

  async salvarPreferencias(preferencias: { evento: string; email: boolean }[]): Promise<PreferenciaDeNotificacao[]> {
    const { data } = await api.put<PreferenciaDeNotificacao[]>(`${BASE}/preferencias`, { preferencias });
    return data;
  },
};
