// src/services/proposta.services.ts
import { api } from '@/config/api';

/**
 * Uma linha da proposta: uma instrução vinculada e o valor fechado dela.
 *
 * `quantidade` é sempre 1 e `preco_unitario` carrega o valor — a tabela é a
 * mesma de antes, quando havia uma linha por recurso, e reaproveitá-la evitou
 * uma migração destrutiva num banco compartilhado.
 */
export interface ItemProposta {
  id?: string;
  /** A instrução a que este valor pertence. */
  instrucao_id?: string | null;
  recurso_id?: string | null;
  descricao: string;
  unidade?: string | null;
  quantidade: number;
  /** A soma do catálogo, que foi a sugestão inicial. Régua da variação. */
  preco_unitario_original?: number | null;
  preco_unitario: number;
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
  outros_custos: OutroCusto[];
  /** SEM_REIDI ou COM_REIDI. O REIDI desonera PIS e COFINS. */
  bdi_regime: string;
  bdi_administracao_central: number;
  bdi_seguro_garantia: number;
  bdi_taxa_risco: number;
  bdi_despesas_financeiras: number;
  bdi_lucro: number;
  bdi_pis: number;
  bdi_cofins: number;
  bdi_cprb: number;
  bdi_issqn: number;
  /** O resultado da fórmula, calculado pelo servidor. */
  bdi_percentual: number;
  total_custo: number;
  total_bdi: number;
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

  /**
   * Os componentes do BDI.
   *
   * Sem chamador hoje: o BDI fica no padrão e a tela não o edita mais. O método
   * fica porque as colunas continuam gravadas por solicitação — o que saiu foi
   * a edição, não o registro —, e é por aqui que uma proposta com BDI diferente
   * seria ajustada no dia em que isso voltar a ser pedido.
   */
  async salvarCondicoes(
    solicitacaoId: string,
    dados: Partial<Record<string, number | string>>,
  ): Promise<Proposta> {
    const resposta = await api.put(`${this.base(solicitacaoId)}/condicoes`, dados);
    return this.desembrulhar<Proposta>(resposta);
  }

  /** Refaz os valores a partir do catálogo. Descarta o que foi ajustado. */
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
 * dele. Em vez de esconder a seção — que era o que acontecia, e deixava os
 * valores invisíveis justamente na hora de montar o orçamento — a tela
 * trabalha sobre este rascunho e a página o persiste assim que a solicitação
 * nasce.
 *
 * Os componentes do BDI vêm preenchidos porque o rascunho precisa deles para
 * ter total antes de existir no banco. Gravados, quem manda é o servidor.
 */
export const propostaVazia = (): Proposta => ({
  itens: [],
  outros_custos: [],
  // Tabela GOINFRA sem REIDI: dá BDI de 30,44%.
  bdi_regime: 'SEM_REIDI',
  bdi_administracao_central: 5,
  bdi_seguro_garantia: 0.5,
  bdi_taxa_risco: 0,
  bdi_despesas_financeiras: 0.5,
  bdi_lucro: 5,
  bdi_pis: 0.65,
  bdi_cofins: 3,
  bdi_cprb: 4.5,
  bdi_issqn: 6.5,
  bdi_percentual: 0,
  total_custo: 0,
  total_bdi: 0,
  total_geral: 0,
});

/** Os quatro impostos somados, que é o I da fórmula. */
export const somaImpostos = (p: Proposta) =>
  (p.bdi_pis || 0) + (p.bdi_cofins || 0) + (p.bdi_cprb || 0) + (p.bdi_issqn || 0);

/**
 * O BDI pela fórmula do acórdão 2.622/2013 do TCU:
 *
 *   BDI = [ (1+AC+SG+R) × (1+DF) × (1+L) / (1-I) ] - 1
 */
export function calcularBdi(p: Proposta): number {
  const f = (v: number) => (v || 0) / 100;
  const i = f(somaImpostos(p));
  if (i >= 1) return 0;

  return (
    ((1 + f(p.bdi_administracao_central) + f(p.bdi_seguro_garantia) + f(p.bdi_taxa_risco)) *
      (1 + f(p.bdi_despesas_financeiras)) *
      (1 + f(p.bdi_lucro))) /
      (1 - i) -
    1
  );
}

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

  // O faturamento direto fica FORA da base do BDI: é dinheiro que o cliente
  // paga ao fornecedor, sem passar pela empresa.
  const baseBdi = custoItens + comum;
  const bdi = calcularBdi(p);
  const totalBdi = cent(baseBdi * bdi);

  return {
    ...p,
    bdi_percentual: Math.round(bdi * 100 * 1000) / 1000,
    total_custo: cent(custoItens + comum + fd),
    total_bdi: totalBdi,
    total_geral: cent(baseBdi + totalBdi + fd),
  };
}

/**
 * Uma linha por instrução escolhida, valendo a soma dos recursos dela.
 *
 * Espelha o que o backend faz ao materializar, e existe porque a tela precisa
 * preencher no INSTANTE do vínculo — esperar o salvamento deixaria a proposta
 * em branco justamente enquanto o orçamento está sendo montado.
 *
 * `jaConhecidos` preserva o que já foi ajustado: vincular a quinta instrução
 * não pode redefinir o valor das outras quatro.
 */
export async function montarDeInstrucoes(
  instrucaoIds: string[],
  jaConhecidos: ItemProposta[] = [],
): Promise<ItemProposta[]> {
  if (instrucaoIds.length === 0) return [];

  const { instrucoesApi } = await import('@/services/instrucoes.services');

  // Só conta como "já ajustado" a linha que representa a instrução inteira:
  // aparece uma única vez e não aponta para recurso nenhum.
  //
  // As duas condições descartam o formato antigo, em que cada recurso virava
  // uma linha. Reaproveitar uma delas daria o preço de um parafuso como valor
  // da instrução inteira — e o `recurso_id` é o que denuncia o caso de uma
  // instrução com um recurso só, onde a contagem sozinha não veria nada errado.
  const vezes = new Map<string, number>();
  for (const item of jaConhecidos) {
    const id = String(item.instrucao_id ?? '').trim();
    if (id) vezes.set(id, (vezes.get(id) ?? 0) + 1);
  }

  const porInstrucao = new Map(
    jaConhecidos
      .filter(
        (i) =>
          i.instrucao_id &&
          !i.recurso_id &&
          vezes.get(String(i.instrucao_id).trim()) === 1,
      )
      .map((i) => [String(i.instrucao_id).trim(), i]),
  );

  const detalhes = await Promise.all(
    instrucaoIds.map((id) => instrucoesApi.findOne(id.trim()).catch(() => null)),
  );

  const itens: ItemProposta[] = [];

  for (const instrucao of detalhes) {
    if (!instrucao) continue;

    const id = String(instrucao.id).trim();
    const existente = porInstrucao.get(id);
    if (existente) {
      itens.push(existente);
      continue;
    }

    // `recurso` (o do catalogo, com preco) so existe nas linhas vinculadas;
    // as antigas, digitadas antes do catalogo, vem sem preco.
    const soma = (instrucao.recursos ?? []).reduce((total, recurso) => {
      const doCatalogo = (recurso as { recurso?: { preco_medio?: number | string } }).recurso;
      const preco = Number(doCatalogo?.preco_medio ?? 0) || 0;
      const quantidade = Number(recurso.quantidade ?? 1) || 1;
      return total + preco * quantidade;
    }, 0);

    const valor = Math.round(soma * 100) / 100;

    itens.push({
      instrucao_id: id,
      descricao: rotuloInstrucao(instrucao.tag, instrucao.nome),
      quantidade: 1,
      preco_unitario_original: valor,
      preco_unitario: valor,
    });
  }

  return itens;
}

/** "INST-003 - Troca de rolamento", ou só o nome quando não há tag. */
export function rotuloInstrucao(tag: string | null | undefined, nome: string): string {
  const limpa = tag?.trim();
  return limpa ? `${limpa} - ${nome}` : nome;
}

/** Reais, com os dois centavos sempre visíveis. */
export const moeda = (valor: number) =>
  (Number.isFinite(valor) ? valor : 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
