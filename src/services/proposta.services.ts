// src/services/proposta.services.ts
import { api } from '@/config/api';

export interface ItemProposta {
  id?: string;
  /** Procedência: nulo quando a linha foi adicionada à mão na proposta. */
  instrucao_id?: string | null;
  recurso_id?: string | null;
  descricao: string;
  unidade?: string | null;
  quantidade: number;
  /** O preço que veio do catálogo. É a régua da variação mostrada na tela. */
  preco_unitario_original?: number | null;
  preco_unitario: number;
  ordem?: number;
}

export interface SubinstrucaoProposta {
  id?: string;
  descricao: string;
  tempo_estimado?: number | null;
  ordem?: number;
}

export interface OutroCusto {
  id?: string;
  descricao: string;
  valor: number;
  /** O cliente paga o fornecedor direto — fica fora da base do imposto. */
  faturamento_direto: boolean;
  ordem?: number;
}

export interface Proposta {
  itens: ItemProposta[];
  subinstrucoes: SubinstrucaoProposta[];
  outros_custos: OutroCusto[];
  lucro_percentual: number;
  com_nota_fiscal: boolean;
  aliquota_percentual: number;
  total_custo: number;
  total_imposto: number;
  total_lucro: number;
  total_geral: number;
}

/**
 * A proposta comercial de uma solicitação.
 *
 * Todas as escritas devolvem a proposta inteira, já com os totais recalculados
 * pelo servidor. O front não repete a fórmula: tela, listagem e PDF têm que
 * mostrar o mesmo número, e três implementações da mesma conta é como elas
 * começam a divergir.
 */
class PropostaApiService {
  private base(solicitacaoId: string) {
    return `/solicitacoes-servico/${solicitacaoId.trim()}/proposta`;
  }

  private desembrulhar<T>(resposta: { data: T | { data: T } }): T {
    const corpo = resposta.data as T & { data?: T };
    return corpo && typeof corpo === 'object' && 'data' in corpo && corpo.data
      ? (corpo.data as T)
      : (corpo as T);
  }

  async obter(solicitacaoId: string): Promise<Proposta> {
    const resposta = await api.get(this.base(solicitacaoId));
    return this.desembrulhar<Proposta>(resposta);
  }

  async salvarItens(solicitacaoId: string, itens: ItemProposta[]): Promise<Proposta> {
    const resposta = await api.put(`${this.base(solicitacaoId)}/itens`, {
      // Só o que o backend aceita: `id` e `ordem` são dele, e reenviá-los
      // esbarraria no forbidNonWhitelisted.
      itens: itens.map((i) => ({
        instrucao_id: i.instrucao_id ?? null,
        recurso_id: i.recurso_id ?? null,
        descricao: i.descricao,
        unidade: i.unidade ?? null,
        quantidade: i.quantidade,
        preco_unitario: i.preco_unitario,
        preco_unitario_original: i.preco_unitario_original ?? null,
      })),
    });
    return this.desembrulhar<Proposta>(resposta);
  }

  async salvarOutrosCustos(solicitacaoId: string, custos: OutroCusto[]): Promise<Proposta> {
    const resposta = await api.put(`${this.base(solicitacaoId)}/outros-custos`, {
      custos: custos.map((c) => ({
        descricao: c.descricao,
        valor: c.valor,
        faturamento_direto: c.faturamento_direto,
      })),
    });
    return this.desembrulhar<Proposta>(resposta);
  }

  async salvarCondicoes(
    solicitacaoId: string,
    dados: { lucro_percentual?: number; com_nota_fiscal?: boolean; aliquota_percentual?: number },
  ): Promise<Proposta> {
    const resposta = await api.put(`${this.base(solicitacaoId)}/condicoes`, dados);
    return this.desembrulhar<Proposta>(resposta);
  }

  /** Refaz a cópia a partir das instruções. Descarta edições de preço. */
  async recarregar(solicitacaoId: string): Promise<Proposta> {
    const resposta = await api.post(`${this.base(solicitacaoId)}/recarregar`);
    return this.desembrulhar<Proposta>(resposta);
  }
}

export const propostaApi = new PropostaApiService();

/** Reais, com os dois centavos sempre visíveis. */
export const moeda = (valor: number) =>
  (Number.isFinite(valor) ? valor : 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
