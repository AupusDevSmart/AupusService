import type { ResumoDoCusto } from '../types/custos';
import type { LinhaDeHoras, TecnicoDaOS } from './horas-da-equipe';
import type { LinhaDeOutroCusto } from './outros-custos';

/**
 * O custo da OS em andamento, ao vivo, na tela (06/nov/2026): o que a pessoa
 * registra muda o quadro de custos sem confirmar a execução e sem reler a OS.
 *
 * A base é a conta da API (`resumo-do-custo.ts`): antes do Executar ela soma a
 * mão de obra pelas horas previstas, o material pelo consumo registrado e os
 * outros custos pelo previsto (ou o conferido). A tela troca, por natureza, o
 * que já sabe melhor que a OS lida:
 *   - Material: o consumo registrado agora na seção "usados";
 *   - Mão de obra: as horas digitadas no painel de concluir × o valor da hora;
 *   - Outros custos: o valor conferido no painel de concluir.
 * O total é a soma das naturezas, a mesma do custo real da API. Nada disso
 * grava: o real gravado sai do Executar.
 */
export interface CustoAoVivo {
  /** Consumido × custo unitário do material registrado na tela */
  material: number;
  /** Com o painel de concluir aberto: as horas digitadas × o valor da hora */
  maoDeObra?: number | null;
  /** Com o painel de concluir aberto: o conferido de cada natureza (o não previsto em NAO_PREVISTO) */
  outros?: Record<string, number> | null;
}

type Natureza = ResumoDoCusto['naturezas'][number];

const centavos = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;

const ROTULO_DO_NAO_PREVISTO = 'Não previstos';

/** As naturezas com o real da tela por cima do da API, e as que só a tela tem (o não previsto lançado agora) */
export function naturezasAteAgora(naturezas: Natureza[], vivo: CustoAoVivo): Natureza[] {
  const trocas: Record<string, number> = { MATERIAL: vivo.material };
  if (vivo.maoDeObra !== null && vivo.maoDeObra !== undefined) trocas.MAO_DE_OBRA = vivo.maoDeObra;
  if (vivo.outros) {
    // As naturezas de outros custos que a OS tinha e saíram do painel ficam em zero
    for (const n of naturezas) if (!['MAO_DE_OBRA', 'MATERIAL', 'ADICIONAIS'].includes(n.natureza)) trocas[n.natureza] = 0;
    Object.assign(trocas, vivo.outros);
  }
  const comTroca = naturezas.map((n) => (n.natureza in trocas && n.real !== null ? { ...n, real: centavos(trocas[n.natureza]) } : n));
  const novas = Object.entries(trocas)
    .filter(([natureza, valor]) => valor > 0 && !naturezas.some((n) => n.natureza === natureza))
    .map(([natureza, valor]) => ({
      natureza: natureza as Natureza['natureza'],
      rotulo: natureza === 'NAO_PREVISTO' ? ROTULO_DO_NAO_PREVISTO : natureza === 'MATERIAL' ? 'Material' : natureza,
      previsto: 0,
      real: centavos(valor),
    }));
  return [...comTroca, ...novas];
}

/** O total até agora: a soma das naturezas (a natureza fora do total não entra) */
export const totalAteAgora = (naturezas: Natureza[]) => centavos(naturezas.reduce((s, n) => s + (n.real ?? 0), 0));

/**
 * As horas digitadas × o valor da hora: o da linha da equipe, ou o informado
 * para quem entrou na hora. Quem entrou sem valor fica de fora (a API usa o da
 * mesma especialidade, que a tela não sabe).
 */
export function maoDeObraDasHoras(linhas: LinhaDeHoras[], tecnicos: TecnicoDaOS[] = []): number {
  const valorDa = new Map(tecnicos.filter((t) => t.id?.trim()).map((t) => [t.id!.trim(), Number(t.custo_hora) || 0]));
  return centavos(
    linhas.reduce((s, l) => s + (l.horas ?? 0) * (l.extra ? Number(l.custoHora) || 0 : valorDa.get(l.id ?? '') ?? 0), 0),
  );
}

/** O conferido de cada natureza no painel: o valor digitado, ou o previsto enquanto o campo está vazio */
export function outrosDoPainel(linhas: LinhaDeOutroCusto[]): Record<string, number> {
  const porNatureza: Record<string, number> = {};
  for (const l of linhas) {
    const chave = l.naoPrevisto ? 'NAO_PREVISTO' : l.natureza;
    porNatureza[chave] = (porNatureza[chave] ?? 0) + (l.valor ?? l.previsto ?? 0);
  }
  return porNatureza;
}
