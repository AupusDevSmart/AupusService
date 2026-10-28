// src/services/proposta.services.ts
import { isAxiosError } from 'axios';
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
  /**
   * Só na tela (o payload é montado campo a campo): a sugestão contou como zero
   * alguma linha sem preço no cadastro. No rascunho é daqui; salva, da leitura
   */
  sem_preco_no_cadastro?: boolean;
}

export interface OutroCusto {
  id?: string;
  descricao: string;
  valor: number;
  /** O cliente paga o fornecedor direto — fica fora da base do imposto. */
  faturamento_direto: boolean;
  ordem?: number;
}

/** Como o desconto é dado (28/out/2026): um percentual ou um valor em reais */
export type TipoDeDesconto = 'PERCENTUAL' | 'VALOR';

/** Os nove componentes do BDI com o nome da tela, na ordem da fórmula do TCU */
export const COMPONENTES_DO_BDI = [
  { campo: 'bdi_administracao_central', rotulo: 'Administração central' },
  { campo: 'bdi_seguro_garantia', rotulo: 'Seguro e garantia' },
  { campo: 'bdi_taxa_risco', rotulo: 'Risco' },
  { campo: 'bdi_despesas_financeiras', rotulo: 'Despesas financeiras' },
  { campo: 'bdi_lucro', rotulo: 'Lucro' },
  { campo: 'bdi_pis', rotulo: 'PIS' },
  { campo: 'bdi_cofins', rotulo: 'COFINS' },
  { campo: 'bdi_cprb', rotulo: 'CPRB' },
  { campo: 'bdi_issqn', rotulo: 'ISS' },
] as const;

export type CampoDoBdi = (typeof COMPONENTES_DO_BDI)[number]['campo'];
export type ComponentesDoBdi = Record<CampoDoBdi, number>;

/** A tabela GOINFRA sem REIDI (30,44%): o padrão de antes, e o da linha que o SQL cria */
export const BDI_GOINFRA: ComponentesDoBdi = {
  bdi_administracao_central: 5,
  bdi_seguro_garantia: 0.5,
  bdi_taxa_risco: 0,
  bdi_despesas_financeiras: 0.5,
  bdi_lucro: 5,
  bdi_pis: 0.65,
  bdi_cofins: 3,
  bdi_cprb: 4.5,
  bdi_issqn: 6.5,
};

/** Os componentes de uma proposta (ou do padrão), em número */
export const componentesDe = (origem: Partial<Record<CampoDoBdi, number | string | null>>): ComponentesDoBdi =>
  Object.fromEntries(COMPONENTES_DO_BDI.map(({ campo }) => [campo, Number(origem[campo]) || 0])) as ComponentesDoBdi;

/** O BDI padrão da empresa, como a API devolve: os componentes e o percentual que dão */
export type BdiPadrao = ComponentesDoBdi & { bdi_percentual: number };

export interface Proposta {
  itens: ItemProposta[];
  outros_custos: OutroCusto[];
  /** As instruções cujo valor sugerido conta como zero alguma linha sem preço no cadastro (SN-86) */
  instrucoes_sem_preco?: string[];
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
  /** O total da proposta, já com o desconto */
  total_geral: number;
  /** O desconto (28/out/2026), sobre o total inteiro (o faturamento direto junto); null sem desconto */
  desconto_tipo: TipoDeDesconto | null;
  /** O digitado: o percentual ou os reais */
  desconto_valor: number | null;
  /** Os reais descontados, até o total */
  total_desconto: number;
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
    return normalizar(this.desembrulhar<Proposta>(resposta));
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
    return normalizar(this.desembrulhar<Proposta>(resposta));
  }

  async salvarOutrosCustos(solicitacaoId: string, custos: OutroCusto[]): Promise<Proposta> {
    const resposta = await api.put(`${this.base(solicitacaoId)}/outros-custos`, {
      custos: custos.map((c) => ({
        descricao: c.descricao,
        valor: c.valor,
        faturamento_direto: c.faturamento_direto,
      })),
    });
    return normalizar(this.desembrulhar<Proposta>(resposta));
  }

  /**
   * As condições: os componentes do BDI desta solicitação (ajustados no
   * fechamento) e o desconto. `desconto_tipo: null` tira o desconto.
   */
  async salvarCondicoes(
    solicitacaoId: string,
    dados: Partial<ComponentesDoBdi> & { desconto_tipo?: TipoDeDesconto | null; desconto_valor?: number | null },
  ): Promise<Proposta> {
    const resposta = await api.put(`${this.base(solicitacaoId)}/condicoes`, dados);
    return normalizar(this.desembrulhar<Proposta>(resposta));
  }

  /** O BDI padrão da empresa: o que a solicitação nova copia */
  async obterBdiPadrao(): Promise<BdiPadrao> {
    const resposta = await api.get('/solicitacoes-servico/bdi-padrao');
    return this.desembrulhar<BdiPadrao>(resposta);
  }

  /** Troca o BDI padrão: vale para as solicitações novas, as que existem ficam com o seu */
  async salvarBdiPadrao(componentes: ComponentesDoBdi): Promise<BdiPadrao> {
    const resposta = await api.put('/solicitacoes-servico/bdi-padrao', componentesDe(componentes));
    return this.desembrulhar<BdiPadrao>(resposta);
  }

  /** Refaz os valores a partir do catálogo. Descarta o que foi ajustado. */
  async recarregar(solicitacaoId: string): Promise<Proposta> {
    const resposta = await api.post(`${this.base(solicitacaoId)}/recarregar`);
    return normalizar(this.desembrulhar<Proposta>(resposta));
  }
}

export const propostaApi = new PropostaApiService();

/**
 * Garante que as listas existam.
 *
 * A tela percorre `itens` e `outros_custos` sem checar, e um campo que
 * suma da resposta derruba a seção inteira em vez de mostrá-la vazia. Foi
 * assim que o front anterior quebrou quando o backend parou de mandar
 * `subinstrucoes`: o backend sobe primeiro no deploy, e por alguns minutos as
 * duas versões conversam.
 */
function normalizar(p: Proposta): Proposta {
  return {
    ...p,
    itens: Array.isArray(p?.itens) ? p.itens : [],
    outros_custos: Array.isArray(p?.outros_custos) ? p.outros_custos : [],
    // A API de antes do desconto não manda os três: sem desconto
    desconto_tipo: p?.desconto_tipo ?? null,
    desconto_valor: p?.desconto_valor ?? null,
    total_desconto: Number(p?.total_desconto) || 0,
  };
}

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
 * ter total antes de existir no banco: os do padrão da empresa, que a seção lê
 * da API (até lá, o GOINFRA). Gravados, quem manda é o servidor.
 */
export const propostaVazia = (bdi: ComponentesDoBdi = BDI_GOINFRA): Proposta => ({
  itens: [],
  outros_custos: [],
  bdi_regime: 'SEM_REIDI',
  ...bdi,
  bdi_percentual: 0,
  total_custo: 0,
  total_bdi: 0,
  total_geral: 0,
  desconto_tipo: null,
  desconto_valor: null,
  total_desconto: 0,
});

/** Os quatro impostos somados, que é o I da fórmula. */
export const somaImpostos = (p: ComponentesDoBdi) =>
  (p.bdi_pis || 0) + (p.bdi_cofins || 0) + (p.bdi_cprb || 0) + (p.bdi_issqn || 0);

/**
 * O BDI pela fórmula do acórdão 2.622/2013 do TCU:
 *
 *   BDI = [ (1+AC+SG+R) × (1+DF) × (1+L) / (1-I) ] - 1
 */
export function calcularBdi(p: ComponentesDoBdi): number {
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
  const totalSemDesconto = cent(baseBdi + totalBdi + fd);
  const desconto = descontoEmReais(p.desconto_tipo, p.desconto_valor, totalSemDesconto);

  return {
    ...p,
    bdi_percentual: Math.round(bdi * 100 * 1000) / 1000,
    total_custo: cent(custoItens + comum + fd),
    total_bdi: totalBdi,
    total_desconto: desconto,
    total_geral: cent(totalSemDesconto - desconto),
  };
}

/**
 * Os reais do desconto, sobre o total inteiro (o faturamento direto junto),
 * até o total: a mesma conta do servidor (`desconto-da-proposta.ts`), para o
 * rascunho ter número antes de existir.
 */
export function descontoEmReais(tipo: TipoDeDesconto | null, valor: number | null, total: number): number {
  if (!tipo || !valor || valor <= 0) return 0;
  const base = Math.max(total, 0);
  const pedido = tipo === 'PERCENTUAL' ? Math.round(base * valor) / 100 : Math.round(valor * 100) / 100;
  return Math.min(pedido, base);
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

  // A já conhecida não precisa do cadastro: a falha de rede na leitura dela não pode
  // tirá-la da proposta (antes, o `catch` virava "sem linha" e a lista gravada a perdia)
  // A nova que não existe mais (404) fica de fora (quem chama avisa); a que não se leu
  // por outra falha é erro (quem chama avisa e não grava), e não uma linha a menos
  const ids = instrucaoIds.map((id) => id.trim());
  const detalhes = await Promise.all(
    ids.map((id) =>
      porInstrucao.has(id)
        ? Promise.resolve(null)
        : instrucoesApi.findOne(id).catch((erro: unknown) => {
            if (isAxiosError(erro) && erro.response?.status === 404) return null;
            throw erro;
          }),
    ),
  );

  return ids.flatMap((id, i) => {
    const existente = porInstrucao.get(id);
    if (existente) return [existente];
    const instrucao = detalhes[i];
    return instrucao ? [linhaDaInstrucao(instrucao)] : [];
  });
}

/** O que a linha da proposta lê da instrução (o `findOne` de `instrucoes.services`) */
export interface InstrucaoParaAProposta {
  id: string;
  codigo?: string | null;
  nome: string;
  recursos?: Array<{ subtotal?: number | string | null }> | null;
  maquinarios?: Array<{ subtotal?: number | string | null }> | null;
}

/**
 * A linha da proposta de uma instrução, valendo a soma dos recursos dela.
 *
 * O custo de cada linha vem pronto do servidor (`subtotal`, a conta do
 * AupusProject, SN-85): a mesma da proposta do backend, recursos e maquinário.
 * A linha sem preço entra como zero: é sugestão, e a pessoa ajusta.
 *
 * Também refaz a linha de uma instrução editada de dentro da solicitação: o
 * valor da proposta é cópia, e sem isso o card seguia com o valor de antes.
 */
export function linhaDaInstrucao(instrucao: InstrucaoParaAProposta): ItemProposta {
  const linhas = [...(instrucao.recursos ?? []), ...(instrucao.maquinarios ?? [])];
  const soma = linhas.reduce((total, linha) => total + (Number(linha.subtotal ?? 0) || 0), 0);
  const valor = Math.round(soma * 100) / 100;

  return {
    instrucao_id: String(instrucao.id).trim(),
    descricao: rotuloInstrucao(instrucao.codigo, instrucao.nome),
    quantidade: 1,
    preco_unitario_original: valor,
    preco_unitario: valor,
    // A linha sem preço entrou como zero: a tela avisa, senão o valor parece completo
    ...(linhas.some((linha) => linha.subtotal == null) && { sem_preco_no_cadastro: true }),
  };
}

/** "INST-003 - Troca de rolamento", ou só o nome quando não há código. */
export function rotuloInstrucao(codigo: string | null | undefined, nome: string): string {
  const limpa = codigo?.trim();
  return limpa ? `${limpa} - ${nome}` : nome;
}

/** "30,44": o percentual com as duas casas da planilha de referência (o banco guarda três) */
export const percentualNaTela = (valor: number) =>
  (Number.isFinite(valor) ? valor : 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Reais, com os dois centavos sempre visíveis. */
export const moeda = (valor: number) =>
  (Number.isFinite(valor) ? valor : 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
