// src/services/conta-da-proposta.ts
/**
 * A conta da proposta por imposto e margem (29/out/2026), a mesma do servidor
 * (`aupus-service-api/src/modules/solicitacoes-servico/conta-da-proposta.ts`).
 *
 * É a única duplicação da conta, e ela é deliberada: o rascunho do cadastro
 * precisa de total antes de a solicitação existir. Gravada, quem manda é o
 * servidor. Os testes prendem os mesmos números dos dois lados.
 *
 *   preço dos serviços  = custo dos serviços ÷ (1 − (imposto + margem))
 *   preço da adm        = (adm% × custo dos serviços + adm FD% × FD) ÷ (1 − imposto)
 *   desconto            = % ou R$ sobre o total inteiro (Aupus + FD), abatido do
 *                         faturamento da Aupus, até ele
 *   total Aupus         = preço dos serviços + preço da adm − desconto
 *   imposto             = imposto% × total Aupus
 *   investimento global = total Aupus + FD
 */

export type TabelaDeLogistica = 'FRETE' | 'DESLOCAMENTO' | 'DIARIA';

export interface ColunasDaLogistica {
  tabela: TabelaDeLogistica;
  ativo?: boolean;
  quantidade?: number | null;
  valor_unitario?: number | null;
  dias?: number | null;
  km?: number | null;
  valor_km?: number | null;
  valor_fixo?: number | null;
}

export interface PercentuaisDaConta {
  imposto: number;
  margem: number;
  admServicos: number;
  admFd: number;
}

export interface EntradaDaConta {
  instrucoes: number[];
  logistica: ColunasDaLogistica[];
  adicionais: { valor: number; faturamento_direto: boolean }[];
  percentuais: PercentuaisDaConta;
  desconto: { tipo: 'PERCENTUAL' | 'VALOR' | null; valor: number | null };
}

export interface ContaDaProposta {
  custoInstrucoes: number;
  custoLogistica: number;
  custoAdicionais: number;
  custoServicos: number;
  fd: number;
  precoServicos: number;
  administracao: number;
  precoAdministracao: number;
  totalAupusSemDesconto: number;
  totalGeralSemDesconto: number;
  desconto: { pedido: number; aplicado: number };
  totalAupus: number;
  imposto: number;
  margemEfetiva: number | null;
  totalGeral: number;
  venda: { instrucoes: number[]; logistica: number; adicionais: number };
}

const centavos = (valor: number) => Math.round(valor * 100) / 100;
const n = (valor: number | null | undefined) => (typeof valor === 'number' && Number.isFinite(valor) ? valor : 0);

/**
 * O total de uma linha, pela tabela dela (campo vazio é zero):
 *   FRETE:        km por viagem × viagens (quantidade) × R$/km + valor fixo
 *   DESLOCAMENTO: veículos (quantidade; vazio é 1) × (dias × diária do veículo + km × R$/km)
 *   DIARIA:       quantidade × valor
 */
export function totalDaLinha(linha: ColunasDaLogistica): number {
  if (linha.tabela === 'FRETE') return centavos(n(linha.km) * n(linha.quantidade) * n(linha.valor_km) + n(linha.valor_fixo));
  if (linha.tabela === 'DESLOCAMENTO') {
    // Os veículos (30/out/2026): a linha de antes não tinha a quantidade, e vazio é um veículo
    const veiculos = linha.quantidade === null || linha.quantidade === undefined ? 1 : n(linha.quantidade);
    return centavos(veiculos * (n(linha.dias) * n(linha.valor_unitario) + n(linha.km) * n(linha.valor_km)));
  }
  return centavos(n(linha.quantidade) * n(linha.valor_unitario));
}

/** Reparte um total pelos pesos em centavos; o resto vai para as linhas de maior resto (a soma fecha) */
function repartir(total: number, pesos: number[]): number[] {
  const soma = pesos.reduce((s, p) => s + p, 0);
  if (soma <= 0) return pesos.map(() => 0);
  const emCentavos = Math.round(total * 100);
  const brutos = pesos.map((p) => (emCentavos * p) / soma);
  const base = brutos.map(Math.floor);
  let falta = emCentavos - base.reduce((s, v) => s + v, 0);
  const porResto = brutos.map((b, i) => ({ i, resto: b - Math.floor(b) })).sort((a, b) => b.resto - a.resto);
  for (const { i } of porResto) {
    if (falta <= 0) break;
    base[i] += 1;
    falta -= 1;
  }
  return base.map((c) => c / 100);
}

/** Imposto e margem com 100% ou mais não fecham a conta (a tela avisa; o servidor recusa) */
export const contaFecha = (p: Pick<PercentuaisDaConta, 'imposto' | 'margem'>) => n(p.imposto) + n(p.margem) < 100;

export function contaDaProposta(entrada: EntradaDaConta): ContaDaProposta {
  const { imposto, margem, admServicos, admFd } = entrada.percentuais;
  const fecha = contaFecha(entrada.percentuais);

  const custoInstrucoes = centavos(entrada.instrucoes.reduce((s, v) => s + n(v), 0));
  const custoLogistica = centavos(entrada.logistica.filter((l) => l.ativo !== false).reduce((s, l) => s + totalDaLinha(l), 0));
  const custoAdicionais = centavos(entrada.adicionais.filter((a) => !a.faturamento_direto).reduce((s, a) => s + n(a.valor), 0));
  const fd = centavos(entrada.adicionais.filter((a) => a.faturamento_direto).reduce((s, a) => s + n(a.valor), 0));
  const custoServicos = centavos(custoInstrucoes + custoLogistica + custoAdicionais);

  // A conta que não fecha mostra o custo como preço até a pessoa corrigir (o servidor recusa gravar)
  const precoServicos = fecha ? centavos(custoServicos / (1 - (n(imposto) + n(margem)) / 100)) : custoServicos;
  const administracao = centavos((n(admServicos) / 100) * custoServicos + (n(admFd) / 100) * fd);
  const precoAdministracao = fecha ? centavos(administracao / (1 - n(imposto) / 100)) : administracao;
  const totalAupusSemDesconto = centavos(precoServicos + precoAdministracao);
  const totalGeralSemDesconto = centavos(totalAupusSemDesconto + fd);

  const { tipo, valor } = entrada.desconto;
  const pedido = !tipo || !valor || valor <= 0 ? 0 : tipo === 'PERCENTUAL' ? centavos((totalGeralSemDesconto * valor) / 100) : centavos(valor);
  const aplicado = Math.min(pedido, totalAupusSemDesconto);

  const totalAupus = centavos(totalAupusSemDesconto - aplicado);
  const valorImposto = centavos((n(imposto) / 100) * totalAupus);
  const margemEfetiva = totalAupus > 0 ? Math.round(((totalAupus - valorImposto - custoServicos) / totalAupus) * 100 * 1000) / 1000 : null;

  const partes = repartir(precoServicos, [...entrada.instrucoes.map(n), custoLogistica, custoAdicionais]);
  const instrucoesVenda = partes.slice(0, entrada.instrucoes.length);
  const [logisticaVenda, adicionaisVenda] = partes.slice(entrada.instrucoes.length);

  return {
    custoInstrucoes,
    custoLogistica,
    custoAdicionais,
    custoServicos,
    fd,
    precoServicos,
    administracao,
    precoAdministracao,
    totalAupusSemDesconto,
    totalGeralSemDesconto,
    desconto: { pedido, aplicado },
    totalAupus,
    imposto: valorImposto,
    margemEfetiva,
    totalGeral: centavos(totalAupus + fd),
    venda: { instrucoes: instrucoesVenda, logistica: logisticaVenda, adicionais: adicionaisVenda },
  };
}
