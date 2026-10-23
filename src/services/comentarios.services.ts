import { api } from '@/config/api';

/** Onde se comenta (SN-48): a OS e a solicitação, com os mesmos nomes do backend. */
export type AlvoDoComentario = 'ordem_servico' | 'solicitacao_servico';

export interface Comentario {
  id: string;
  comentario: string;
  autor: string;
  autor_id: string | null;
  /** Interno: o cliente não vê. */
  interno: boolean;
  /** ISO em UTC. */
  created_at: string;
  updated_at: string;
  editado: boolean;
  /** Até quando quem está vendo pode editar ou excluir (ISO); null se não pode. */
  editavel_ate: string | null;
  /** Quanto faltava para o prazo quando o servidor respondeu (o relógio do aparelho pode estar errado). */
  editavel_por_ms: number | null;
}

const BASE: Record<AlvoDoComentario, string> = {
  ordem_servico: '/execucao-os',
  solicitacao_servico: '/solicitacoes-servico',
};

const caminho = (alvo: AlvoDoComentario, registroId: string, comentarioId?: string) =>
  `${BASE[alvo]}/${registroId.trim()}/comentarios${comentarioId ? `/${comentarioId.trim()}` : ''}`;

export const comentariosApi = {
  async listar(alvo: AlvoDoComentario, registroId: string): Promise<Comentario[]> {
    const { data } = await api.get<Comentario[]>(caminho(alvo, registroId));
    return data;
  },

  async comentar(alvo: AlvoDoComentario, registroId: string, comentario: string, interno: boolean): Promise<Comentario> {
    const { data } = await api.post<Comentario>(caminho(alvo, registroId), { comentario, interno });
    return data;
  },

  async editar(alvo: AlvoDoComentario, registroId: string, comentarioId: string, comentario: string): Promise<Comentario> {
    const { data } = await api.patch<Comentario>(caminho(alvo, registroId, comentarioId), { comentario });
    return data;
  },

  async excluir(alvo: AlvoDoComentario, registroId: string, comentarioId: string): Promise<void> {
    await api.delete(caminho(alvo, registroId, comentarioId));
  },
};
