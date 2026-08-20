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

  async salvarSubinstrucoes(
    solicitacaoId: string,
    subinstrucoes: SubinstrucaoProposta[],
  ): Promise<Proposta> {
    const resposta = await api.put(`${this.base(solicitacaoId)}/subinstrucoes`, {
      subinstrucoes: subinstrucoes.map((s) => ({
        descricao: s.descricao,
        tempo_estimado: s.tempo_estimado ?? null,
      })),
    });
    return this.desembrulhar<Proposta>(resposta);
  }

  /** Refaz a cópia a partir das instruções. Descarta edições de preço. */
  async recarregar(solicitacaoId: string): Promise<Proposta> {
    const resposta = await api.post(`${this.base(solicitacaoId)}/recarregar`);
    return this.desembrulhar<Proposta>(resposta);
  }
}

export const propostaApi = new PropostaApiService();

/**
 * Proposta em branco, para o sheet de cadastro.
 *
 * Antes de a solicitação existir não há id, e as rotas da proposta precisam
 * dele. Em vez de esconder a seção — que era o que acontecia, e deixava o
 * lucro, a nota fiscal e os outros custos invisíveis justamente na hora de
 * montar o orçamento — a tela trabalha sobre este rascunho e a página o
 * persiste assim que a solicitação nasce.
 */
export const propostaVazia = (): Proposta => ({
  itens: [],
  subinstrucoes: [],
  outros_custos: [],
  lucro_percentual: 0,
  com_nota_fiscal: false,
  aliquota_percentual: 15,
  total_custo: 0,
  total_imposto: 0,
  total_lucro: 0,
  total_geral: 0,
});

/**
 * Os mesmos totais que o servidor calcula, para o rascunho ter numero antes de
 * existir no banco.
 *
 * É a única duplicação da fórmula, e ela é deliberada: sem id não há a quem
 * perguntar. Assim que a solicitação existe, o número passa a vir do servidor
 * e este cálculo sai de cena — quem manda no que vai para o PDF é ele.
 */
export function calcularRascunho(p: Proposta): Proposta {
  const cent = (v: number) => Math.round(v * 100) / 100;

  const custoItens = p.itens.reduce((s, i) => s + (i.quantidade || 0) * (i.preco_unitario || 0), 0);
  const fd = p.outros_custos.filter((c) => c.faturamento_direto).reduce((s, c) => s + (c.valor || 0), 0);
  const comum = p.outros_custos.filter((c) => !c.faturamento_direto).reduce((s, c) => s + (c.valor || 0), 0);

  const tributavel = custoItens + comum;
  const aliquota = p.com_nota_fiscal ? (p.aliquota_percentual || 0) / 100 : 0;
  const comImposto = aliquota > 0 && aliquota < 1 ? tributavel / (1 - aliquota) : tributavel;
  const base = comImposto + fd;
  const lucro = cent(base * ((p.lucro_percentual || 0) / 100));

  return {
    ...p,
    total_custo: cent(custoItens + comum + fd),
    total_imposto: cent(comImposto - tributavel),
    total_lucro: lucro,
    total_geral: cent(base + lucro),
  };
}

/** Reais, com os dois centavos sempre visíveis. */
export const moeda = (valor: number) =>
  (Number.isFinite(valor) ? valor : 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
