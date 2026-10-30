// src/services/proposta.services.ts
import { isAxiosError } from 'axios';
import { api } from '@/config/api';
import { contaDaProposta, totalDaLinha, type TabelaDeLogistica } from '@/services/conta-da-proposta';

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
  /** O custo da linha (o cliente não o recebe na conta nova: vem nulo) */
  preco_unitario: number | null;
  /** O preço de venda da linha (a parte dela no preço dos serviços); nulo na conta do BDI */
  valor_venda?: number | null;
  ordem?: number;
  /**
   * Só na tela (o payload é montado campo a campo): a sugestão contou como zero
   * alguma linha sem preço no cadastro. No rascunho é daqui; salva, da leitura
   */
  sem_preco_no_cadastro?: boolean;
  /** Só na tela: as horas dos passos da instrução, para o rascunho calcular os dias (30/out/2026) */
  horas_dos_passos?: number;
}

export interface OutroCusto {
  id?: string;
  descricao: string;
  /** Nulo para quem não vê o custo (o adicional da Aupus, para o cliente) */
  valor: number | null;
  /** O cliente paga o fornecedor direto: fora do imposto e da margem da Aupus. */
  faturamento_direto: boolean;
  ordem?: number;
}

/** Como o desconto é dado (28/out/2026): um percentual ou um valor em reais */
export type TipoDeDesconto = 'PERCENTUAL' | 'VALOR';

export type { TabelaDeLogistica };

/**
 * Uma linha de frete, deslocamento ou diária (29/out/2026). Cada tabela usa as
 * suas colunas (`totalDaLinha`); o total é do servidor (no rascunho, da cópia).
 */
export interface LinhaDeLogistica {
  id?: string;
  tabela: TabelaDeLogistica;
  ativo: boolean;
  /** O recurso do catálogo de onde o valor veio (copiado) */
  recurso_id?: string | null;
  descricao: string;
  quantidade?: number | null;
  valor_unitario?: number | null;
  dias?: number | null;
  km?: number | null;
  valor_km?: number | null;
  valor_fixo?: number | null;
  total: number | null;
  /** A linha que o planejamento calcula (30/out/2026): KM, CAFE, ALMOCO, JANTAR ou PERNOITE */
  automatica?: 'KM' | 'CAFE' | 'ALMOCO' | 'JANTAR' | 'PERNOITE' | null;
  /** A automática que a pessoa ajustou à mão: deixa de acompanhar o planejamento */
  ajustada?: boolean;
  ordem?: number;
}

/** Os percentuais da proposta: copiados dos padrões ao criar, ajustáveis nela */
export interface PercentuaisDaProposta {
  imposto_percentual: number | null;
  margem_percentual: number | null;
  adm_servicos_percentual: number | null;
  adm_fd_percentual: number | null;
}

/** O planejamento que a conta e a programação usam; vazio vale o calculado (30/out/2026) */
export interface PlanejamentoDaProposta {
  distancia_km: number | null;
  /** O km rodado na obra (total); vazio = o padrão, % da ida e volta */
  deslocamento_interno_km: number | null;
  dias_previstos: number | null;
  pessoas_previstas: number | null;
  noites_fora: number | null;
}

/** O que se calcula do planejamento (30/out/2026): o que vale em cada campo vazio, a viagem e os veículos */
export interface PlanejamentoCalculado {
  /** A soma das horas dos passos das instruções da proposta (a base dos dias) */
  horas_dos_passos: number;
  /** As horas de cada instrução (o detalhe da duração) */
  horas_por_instrucao?: { descricao: string; horas: number }[];
  /** As que valem: as digitadas ou as padrão */
  pessoas: number | null;
  ida_e_volta_km: number | null;
  interno_km: number | null;
  interno_sugerido_km: number | null;
  /** As horas de estrada de um trecho */
  horas_por_trecho: number | null;
  bate_volta: boolean | null;
  dias_sugeridos: number | null;
  dias: number | null;
  noites_sugeridas: number | null;
  noites: number | null;
  veiculos: number | null;
  km_por_veiculo: number | null;
}

/** A memória da conta, para o fechamento da tela (interna: o cliente não a recebe) */
export interface FechamentoDaProposta {
  custo_instrucoes: number;
  custo_logistica: number;
  custo_adicionais: number;
  custo_servicos: number;
  preco_servicos: number;
  administracao: number;
  preco_administracao: number;
  total_aupus_sem_desconto: number;
  total_geral_sem_desconto: number;
  desconto_pedido: number;
}

export interface Proposta extends PercentuaisDaProposta, PlanejamentoDaProposta {
  /** IMPOSTO_MARGEM (29/out/2026) ou BDI: a proposta de antes, só leitura */
  conta_da_proposta: 'IMPOSTO_MARGEM' | 'BDI';
  itens: ItemProposta[];
  outros_custos: OutroCusto[];
  logistica: LinhaDeLogistica[];
  /** As instruções cujo valor sugerido conta como zero alguma linha sem preço no cadastro (SN-86) */
  instrucoes_sem_preco?: string[];
  /** Os dias pelas horas dos passos e a viagem, em jornadas de 8 h, arredondado para cima */
  dias_sugeridos?: number | null;
  /** O dobro da ida (gravado pelo servidor) */
  distancia_ida_volta_km?: number | null;
  /** Nulo para quem não vê o planejamento (o cliente) */
  planejamento_calculado?: PlanejamentoCalculado | null;
  /** As linhas automáticas acompanham o planejamento (a de antes, com a logística digitada, nasce desligada) */
  logistica_automatica?: boolean | null;
  /** "AAAA-MM-DD" */
  validade_proposta: string | null;
  condicoes_comerciais: string | null;
  // Os totais gravados (nulos para quem não os vê)
  total_custo: number | null;
  total_servicos: number | null;
  total_fd: number | null;
  total_administracao: number | null;
  /** O faturamento da Aupus, já com o desconto */
  total_aupus: number | null;
  valor_imposto: number | null;
  margem_efetiva: number | null;
  /** O investimento global do cliente: total Aupus + faturamento direto */
  total_geral: number | null;
  desconto_tipo: TipoDeDesconto | null;
  desconto_valor: number | null;
  /** Os reais descontados, até o faturamento da Aupus */
  total_desconto: number;
  fechamento: FechamentoDaProposta | null;
  /** O preço de venda da logística e dos adicionais (uma linha cada no PDF) */
  venda: { logistica: number; adicionais: number } | null;
  /** A conta de antes (BDI): o percentual e o valor, para a proposta que ficou como documento */
  bdi_percentual?: number | null;
  total_bdi?: number | null;
}

/** O que as condições gravam: percentuais, planejamento, validade, condições comerciais e desconto */
export type CondicoesDaProposta = Partial<PercentuaisDaProposta & PlanejamentoDaProposta> & {
  /** Ligar a logística automática numa proposta de antes */
  logistica_automatica?: boolean;
  validade_proposta?: string | null;
  condicoes_comerciais?: string | null;
  desconto_tipo?: TipoDeDesconto | null;
  desconto_valor?: number | null;
};

/** Os padrões da empresa: os percentuais (29/out/2026, no lugar do BDI padrão) e a logística automática (30/out/2026) */
export interface PadroesDaProposta {
  imposto_percentual: number;
  margem_percentual: number;
  adm_servicos_percentual: number;
  adm_fd_percentual: number;
  /** R$ por km rodado */
  valor_km: number;
  horas_por_100_km: number;
  /** O deslocamento interno quando vazio: % da ida e volta */
  interno_percentual: number;
  /** Por pessoa */
  cafe_valor: number;
  almoco_valor: number;
  jantar_valor: number;
  pernoite_valor: number;
  pessoas_por_veiculo: number;
  /** Até quantas horas de ida a equipe volta no mesmo dia */
  bate_volta_horas: number;
  /** As pessoas quando a proposta não diz (0 = não supor) */
  pessoas_padrao: number;
}

/**
 * Até os padrões da empresa chegarem da API, o rascunho fica sem percentual (o
 * preço sai igual ao custo por um instante). Os números não ficam no código: o
 * repositório é público e o cliente baixa este JavaScript.
 */
const SEM_PADROES: PercentuaisDaProposta = { imposto_percentual: null, margem_percentual: null, adm_servicos_percentual: null, adm_fd_percentual: null };

/** O que a programação herda da proposta revisada (29/out/2026) */
export interface HerancaDaProposta {
  valores_das_instrucoes: { instrucao_id: string; valor: number }[];
  itens_orcamento: { descricao: string; valor: number; natureza: string }[];
  necessita_veiculo: boolean;
  /** As linhas de instrução da proposta sem vínculo (ou com a instrução excluída): ficam de fora */
  sem_vinculo?: string[];
  dias_previstos: number | null;
  pessoas_previstas: number | null;
}

/**
 * A proposta comercial de uma solicitação.
 *
 * Todas as escritas devolvem a proposta inteira, já com os totais recalculados
 * pelo servidor. O front não repete a fórmula fora do rascunho: tela, listagem
 * e PDF têm que mostrar o mesmo número.
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
      // Só o que o backend aceita: `id`, `ordem` e `valor_venda` são dele, e reenviá-los
      // esbarraria no forbidNonWhitelisted.
      itens: itens.map((i) => ({
        instrucao_id: i.instrucao_id ?? null,
        recurso_id: i.recurso_id ?? null,
        descricao: i.descricao,
        unidade: i.unidade ?? null,
        quantidade: i.quantidade,
        preco_unitario: i.preco_unitario ?? 0,
        preco_unitario_original: i.preco_unitario_original ?? null,
      })),
    });
    return normalizar(this.desembrulhar<Proposta>(resposta));
  }

  async salvarOutrosCustos(solicitacaoId: string, custos: OutroCusto[]): Promise<Proposta> {
    const resposta = await api.put(`${this.base(solicitacaoId)}/outros-custos`, {
      custos: custos.map((c) => ({
        descricao: c.descricao,
        valor: c.valor ?? 0,
        faturamento_direto: c.faturamento_direto,
      })),
    });
    return normalizar(this.desembrulhar<Proposta>(resposta));
  }

  /** Troca uma tabela de logística inteira; o total de cada linha é do servidor */
  async salvarLogistica(solicitacaoId: string, tabela: TabelaDeLogistica, linhas: LinhaDeLogistica[]): Promise<Proposta> {
    const resposta = await api.put(`${this.base(solicitacaoId)}/logistica/${tabela.toLowerCase()}`, {
      linhas: linhas.map((l) => ({
        ativo: l.ativo,
        recurso_id: l.recurso_id ?? null,
        descricao: l.descricao,
        quantidade: l.quantidade ?? null,
        valor_unitario: l.valor_unitario ?? null,
        dias: l.dias ?? null,
        km: l.km ?? null,
        valor_km: l.valor_km ?? null,
        valor_fixo: l.valor_fixo ?? null,
        automatica: l.automatica ?? null,
        ajustada: Boolean(l.automatica && l.ajustada),
      })),
    });
    return normalizar(this.desembrulhar<Proposta>(resposta));
  }

  /**
   * As condições: os percentuais desta proposta, o planejamento, a validade, as
   * condições comerciais e o desconto. `desconto_tipo: null` tira o desconto.
   */
  async salvarCondicoes(solicitacaoId: string, dados: CondicoesDaProposta): Promise<Proposta> {
    const resposta = await api.put(`${this.base(solicitacaoId)}/condicoes`, dados);
    return normalizar(this.desembrulhar<Proposta>(resposta));
  }

  /** Refaz os valores a partir do catálogo. Descarta o que foi ajustado. */
  async recarregar(solicitacaoId: string): Promise<Proposta> {
    const resposta = await api.post(`${this.base(solicitacaoId)}/recarregar`);
    return normalizar(this.desembrulhar<Proposta>(resposta));
  }

  /** Os percentuais padrão: o que a solicitação nova copia */
  async obterPadroes(): Promise<PadroesDaProposta> {
    const resposta = await api.get('/solicitacoes-servico/padroes-da-proposta');
    return this.desembrulhar<PadroesDaProposta>(resposta);
  }

  /** Troca os padrões: valem para as solicitações novas, as que existem ficam com os seus */
  async salvarPadroes(padroes: PadroesDaProposta): Promise<PadroesDaProposta> {
    const resposta = await api.put('/solicitacoes-servico/padroes-da-proposta', padroes);
    return this.desembrulhar<PadroesDaProposta>(resposta);
  }

  /** REGISTRADA -> PROPOSTA_REVISADA: trava a proposta e libera a programação */
  async revisar(solicitacaoId: string): Promise<void> {
    await api.post(`${this.base(solicitacaoId)}/revisar`);
  }

  /** A revisada ou a não aprovada volta à edição */
  async reabrir(solicitacaoId: string, motivo?: string): Promise<void> {
    await api.post(`${this.base(solicitacaoId)}/reabrir`, { motivo: motivo?.trim() || null });
  }

  /** O cliente não aprovou: com o motivo, que vai para o histórico */
  async naoAprovada(solicitacaoId: string, motivo: string): Promise<void> {
    await api.post(`${this.base(solicitacaoId)}/nao-aprovada`, { motivo });
  }

  /** O que a programação herda da proposta revisada */
  async paraProgramar(solicitacaoId: string): Promise<HerancaDaProposta> {
    const resposta = await api.get(`/solicitacoes-servico/${solicitacaoId.trim()}/para-programar`);
    return this.desembrulhar<HerancaDaProposta>(resposta);
  }
}

export const propostaApi = new PropostaApiService();

/**
 * Garante que as listas existam.
 *
 * A tela percorre `itens`, `outros_custos` e `logistica` sem checar, e um campo
 * que suma da resposta derruba a seção inteira em vez de mostrá-la vazia. Foi
 * assim que o front anterior quebrou quando o backend parou de mandar
 * `subinstrucoes`: o backend sobe primeiro no deploy, e por alguns minutos as
 * duas versões conversam.
 */
function normalizar(p: Proposta): Proposta {
  return {
    ...p,
    conta_da_proposta: p?.conta_da_proposta === 'BDI' ? 'BDI' : 'IMPOSTO_MARGEM',
    itens: Array.isArray(p?.itens) ? p.itens : [],
    outros_custos: Array.isArray(p?.outros_custos) ? p.outros_custos : [],
    logistica: Array.isArray(p?.logistica) ? p.logistica : [],
    desconto_tipo: p?.desconto_tipo ?? null,
    desconto_valor: p?.desconto_valor ?? null,
    total_desconto: Number(p?.total_desconto) || 0,
    fechamento: p?.fechamento ?? null,
    venda: p?.venda ?? null,
    deslocamento_interno_km: p?.deslocamento_interno_km ?? null,
    planejamento_calculado: p?.planejamento_calculado ?? null,
  };
}

/**
 * Proposta em branco, para o sheet de cadastro.
 *
 * Antes de a solicitação existir não há id, e as rotas da proposta precisam
 * dele. Em vez de esconder a seção, a tela trabalha sobre este rascunho e a
 * página o persiste assim que a solicitação nasce. Os percentuais vêm dos
 * padrões da empresa, que a seção lê da API.
 */
export const propostaVazia = (padroes: PercentuaisDaProposta = SEM_PADROES): Proposta => ({
  conta_da_proposta: 'IMPOSTO_MARGEM',
  itens: [],
  outros_custos: [],
  logistica: [],
  ...padroes,
  distancia_km: null,
  distancia_ida_volta_km: null,
  deslocamento_interno_km: null,
  planejamento_calculado: null,
  dias_previstos: null,
  pessoas_previstas: null,
  noites_fora: null,
  validade_proposta: null,
  condicoes_comerciais: null,
  total_custo: 0,
  total_servicos: 0,
  total_fd: 0,
  total_administracao: 0,
  total_aupus: 0,
  valor_imposto: 0,
  margem_efetiva: null,
  total_geral: 0,
  desconto_tipo: null,
  desconto_valor: null,
  total_desconto: 0,
  fechamento: null,
  venda: null,
});

/** Os percentuais da proposta como a conta os lê */
export const percentuaisDaConta = (p: PercentuaisDaProposta) => ({
  imposto: p.imposto_percentual ?? 0,
  margem: p.margem_percentual ?? 0,
  admServicos: p.adm_servicos_percentual ?? 0,
  admFd: p.adm_fd_percentual ?? 0,
});

/**
 * Os totais do rascunho, pela cópia da conta do servidor (`conta-da-proposta.ts`).
 * Assim que a solicitação existe, o número passa a vir do servidor.
 */
export function calcularRascunho(p: Proposta): Proposta {
  // A linha sem nome não se grava (a API a recusaria): fora da conta, a tela mostra o que vai ser gravado
  const comNome = <T extends { descricao: string }>(linhas: T[]) => linhas.filter((l) => l.descricao.trim());
  const conta = contaDaProposta({
    instrucoes: p.itens.map((i) => (i.quantidade || 0) * (i.preco_unitario || 0)),
    logistica: comNome(p.logistica),
    adicionais: comNome(p.outros_custos).map((c) => ({ valor: c.valor ?? 0, faturamento_direto: c.faturamento_direto })),
    percentuais: percentuaisDaConta(p),
    desconto: { tipo: p.desconto_tipo, valor: p.desconto_valor },
  });
  return {
    ...p,
    itens: p.itens.map((item, i) => ({ ...item, valor_venda: conta.venda.instrucoes[i] ?? 0 })),
    logistica: p.logistica.map((l) => ({ ...l, total: totalDaLinha(l) })),
    total_custo: Math.round((conta.custoServicos + conta.fd) * 100) / 100,
    total_servicos: conta.custoServicos,
    total_fd: conta.fd,
    total_administracao: conta.precoAdministracao,
    total_aupus: conta.totalAupus,
    valor_imposto: conta.imposto,
    margem_efetiva: conta.margemEfetiva,
    total_geral: conta.totalGeral,
    total_desconto: p.desconto_tipo ? conta.desconto.aplicado : 0,
    fechamento: {
      custo_instrucoes: conta.custoInstrucoes,
      custo_logistica: conta.custoLogistica,
      custo_adicionais: conta.custoAdicionais,
      custo_servicos: conta.custoServicos,
      preco_servicos: conta.precoServicos,
      administracao: conta.administracao,
      preco_administracao: conta.precoAdministracao,
      total_aupus_sem_desconto: conta.totalAupusSemDesconto,
      total_geral_sem_desconto: conta.totalGeralSemDesconto,
      desconto_pedido: conta.desconto.pedido,
    },
    venda: { logistica: conta.venda.logistica, adicionais: conta.venda.adicionais },
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
  sub_instrucoes?: Array<{ duracao_horas?: number | string | null }> | null;
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
    // Os dias do rascunho saem das horas dos passos (o servidor soma as mesmas ao gravar)
    horas_dos_passos: (instrucao.sub_instrucoes ?? []).reduce((soma, passo) => soma + (Number(passo.duracao_horas ?? 0) || 0), 0),
  };
}

/** "INST-003 - Troca de rolamento", ou só o nome quando não há código. */
export function rotuloInstrucao(codigo: string | null | undefined, nome: string): string {
  const limpa = codigo?.trim();
  return limpa ? `${limpa} - ${nome}` : nome;
}

/** "15,00": o percentual com duas casas na tela (o banco guarda três) */
export const percentualNaTela = (valor: number) =>
  (Number.isFinite(valor) ? valor : 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Reais, com os dois centavos sempre visíveis. */
export const moeda = (valor: number) =>
  (Number.isFinite(valor) ? valor : 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
