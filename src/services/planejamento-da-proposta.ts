// src/services/planejamento-da-proposta.ts
import { totalDaLinha } from '@/services/conta-da-proposta';
import type { LinhaDeLogistica, PadroesDaProposta, PlanejamentoCalculado, Proposta } from '@/services/proposta.services';

/**
 * Cópia de `aupus-service-api/src/modules/solicitacoes-servico/planejamento-da-proposta.ts`
 * (30/out/2026): o rascunho da solicitação que ainda não existe calcula aqui as
 * linhas automáticas da logística, como a API faz ao gravar. Mexeu lá, mexe aqui
 * (`planejamento-da-proposta.test.ts` confere os mesmos números).
 *
 * Decisões do usuário: a ida e volta é o dobro da ida; o interno vazio é uma parte
 * da ida e volta; a viagem entra nos dias; a ida acima do bate-volta sugere
 * pernoite (as noites digitadas mandam); veículos pelas pessoas; pessoas padrão
 * quando vazio; almoço todo dia; café, jantar e pernoite nas noites fora. Campo
 * vazio vale o calculado. Os números são os do botão "Padrões" (nada fica aqui:
 * o repositório é público).
 */

export interface PadroesDaLogistica {
  valorKm: number;
  horasPor100Km: number;
  internoPercentual: number;
  cafe: number;
  almoco: number;
  jantar: number;
  pernoite: number;
  pessoasPorVeiculo: number;
  bateVoltaHoras: number;
  pessoasPadrao: number;
}

/** Os padrões da logística como a API os manda (as colunas de `padroes_da_proposta`) */
export const padroesDaLogistica = (p: PadroesDaProposta): PadroesDaLogistica => ({
  valorKm: p.valor_km,
  horasPor100Km: p.horas_por_100_km,
  internoPercentual: p.interno_percentual,
  cafe: p.cafe_valor,
  almoco: p.almoco_valor,
  jantar: p.jantar_valor,
  pernoite: p.pernoite_valor,
  pessoasPorVeiculo: p.pessoas_por_veiculo,
  bateVoltaHoras: p.bate_volta_horas,
  pessoasPadrao: p.pessoas_padrao,
});

export const HORAS_POR_DIA = 8;

export interface PlanejamentoDigitado {
  idaKm: number | null;
  internoKm: number | null;
  dias: number | null;
  pessoas: number | null;
  noites: number | null;
  horasDosPassos: number;
}

const centavos = (valor: number) => Math.round(valor * 100) / 100;
const paraCima = (valor: number) => Math.ceil(Math.round(valor * 1000) / 1000);
const positivo = (valor: number | null) => (valor !== null && valor > 0 ? valor : null);

function diasPelasHoras(horasDosPassos: number, horasPorTrecho: number | null, bateVolta: boolean | null): number | null {
  if (horasDosPassos <= 0) return null;
  if (horasPorTrecho === null) return paraCima(horasDosPassos / HORAS_POR_DIA);
  const trabalhoNoBateVolta = HORAS_POR_DIA - 2 * horasPorTrecho;
  if (bateVolta && trabalhoNoBateVolta > 0) return paraCima(horasDosPassos / trabalhoNoBateVolta);
  return paraCima((horasDosPassos + 2 * horasPorTrecho) / HORAS_POR_DIA);
}

export function planejamentoCalculado(d: PlanejamentoDigitado, p: PadroesDaLogistica): PlanejamentoCalculado {
  const ida = positivo(d.idaKm);
  const idaEVoltaKm = ida === null ? null : centavos(2 * ida);
  const internoSugeridoKm = idaEVoltaKm === null ? null : centavos((idaEVoltaKm * p.internoPercentual) / 100);
  const internoKm = d.internoKm ?? internoSugeridoKm;
  const horasPorTrecho = ida === null ? null : Math.round((ida / 100) * p.horasPor100Km * 100) / 100;
  // As noites digitadas mandam: com noites, a equipe dorme no local; com zero, volta todo dia
  const bateVolta = horasPorTrecho === null ? null : d.noites !== null ? d.noites === 0 : horasPorTrecho <= p.bateVoltaHoras;
  const diasSugeridos = diasPelasHoras(d.horasDosPassos, horasPorTrecho, bateVolta);
  const dias = d.dias ?? diasSugeridos;
  const noitesSugeridas = bateVolta === null || dias === null ? null : bateVolta ? 0 : Math.max(paraCima(dias) - 1, 0);
  const noites = d.noites ?? noitesSugeridas;
  const pessoas = positivo(d.pessoas) ?? positivo(p.pessoasPadrao);
  const veiculos = pessoas === null ? null : Math.ceil(pessoas / Math.max(p.pessoasPorVeiculo, 1));
  const viagens = bateVolta && dias !== null ? Math.max(paraCima(dias), 1) : 1;
  const estrada = idaEVoltaKm === null ? null : idaEVoltaKm * viagens;
  const kmPorVeiculo = estrada === null && internoKm === null ? null : centavos((estrada ?? 0) + (internoKm ?? 0));
  return {
    horas_dos_passos: d.horasDosPassos,
    pessoas,
    ida_e_volta_km: idaEVoltaKm,
    interno_km: internoKm,
    interno_sugerido_km: internoSugeridoKm,
    horas_por_trecho: horasPorTrecho,
    bate_volta: bateVolta,
    dias_sugeridos: diasSugeridos,
    dias,
    noites_sugeridas: noitesSugeridas,
    noites,
    veiculos,
    km_por_veiculo: kmPorVeiculo,
  };
}

export const CHAVES_AUTOMATICAS = ['KM', 'CAFE', 'ALMOCO', 'JANTAR', 'PERNOITE'] as const;
export type ChaveAutomatica = (typeof CHAVES_AUTOMATICAS)[number];

/** A linha que o planejamento pede agora */
export function linhasAutomaticas(c: PlanejamentoCalculado, p: PadroesDaLogistica): LinhaDeLogistica[] {
  const linhas: LinhaDeLogistica[] = [];
  const nova = (dados: Omit<LinhaDeLogistica, 'ativo' | 'total' | 'ajustada'>): LinhaDeLogistica => ({ ...dados, ativo: true, ajustada: false, total: totalDaLinha({ ...dados }) });
  if (c.km_por_veiculo !== null && c.km_por_veiculo > 0) {
    linhas.push(nova({ automatica: 'KM', tabela: 'DESLOCAMENTO', descricao: 'Veículo da equipe', quantidade: c.veiculos ?? 1, km: c.km_por_veiculo, valor_unitario: null, valor_km: p.valorKm }));
  }
  const pessoas = positivo(c.pessoas);
  const diaria = (chave: Exclude<ChaveAutomatica, 'KM'>, descricao: string, vezes: number | null, valor: number) => {
    const quantidade = pessoas !== null && vezes !== null ? pessoas * vezes : 0;
    if (quantidade > 0) linhas.push(nova({ automatica: chave, tabela: 'DIARIA', descricao, quantidade, km: null, valor_unitario: valor, valor_km: null }));
  };
  const noites = c.noites !== null && c.noites > 0 ? c.noites : null;
  diaria('CAFE', 'Café da manhã', noites, p.cafe);
  diaria('ALMOCO', 'Almoço', c.dias !== null ? paraCima(c.dias) : null, p.almoco);
  diaria('JANTAR', 'Jantar', noites, p.jantar);
  diaria('PERNOITE', 'Pernoite', noites, p.pernoite);
  return linhas;
}

/**
 * As linhas da tabela depois de seguirem o planejamento (as regras de
 * `planoDaSincronizacao` da API): a ajustada fica; a que acompanha recebe as
 * quantidades (o preço fica); a que falta entra no fim; a que o planejamento
 * não pede mais fica com quantidade zero (o preço e o nome acertados voltam com ela).
 */
export function comAsAutomaticas(linhas: LinhaDeLogistica[], pedidas: LinhaDeLogistica[]): LinhaDeLogistica[] {
  const resultado: LinhaDeLogistica[] = [];
  for (const linha of linhas) {
    if (!linha.automatica || linha.ajustada) {
      resultado.push(linha);
      continue;
    }
    const pedida = pedidas.find((p) => p.automatica === linha.automatica);
    if (!pedida) {
      resultado.push({ ...linha, quantidade: 0, total: 0 });
      continue;
    }
    const acertada = { ...linha, quantidade: pedida.quantidade, km: pedida.km };
    resultado.push({ ...acertada, total: totalDaLinha(acertada) });
  }
  for (const pedida of pedidas) {
    if (!linhas.some((l) => l.automatica === pedida.automatica)) resultado.push(pedida);
  }
  return resultado;
}

/**
 * O rascunho com a logística automática e o planejamento calculado. As horas
 * dos passos são as das instruções que o rascunho leu (`horas_dos_passos` de
 * cada item). Sem os padrões (ainda lendo), o rascunho fica como está.
 */
export function comLogisticaAutomatica(p: Proposta, padroes: PadroesDaLogistica | null): Proposta {
  if (!padroes || p.logistica_automatica === false) return p;
  const horas = p.itens.reduce((soma, item) => soma + (item.horas_dos_passos ?? 0), 0);
  const calculado = planejamentoCalculado(
    { idaKm: p.distancia_km, internoKm: p.deslocamento_interno_km, dias: p.dias_previstos, pessoas: p.pessoas_previstas, noites: p.noites_fora, horasDosPassos: horas },
    padroes,
  );
  const horasPorInstrucao = p.itens
    .filter((item) => item.instrucao_id && (item.horas_dos_passos ?? 0) > 0)
    .map((item) => ({ descricao: item.descricao, horas: item.horas_dos_passos ?? 0 }));
  return {
    ...p,
    distancia_ida_volta_km: calculado.ida_e_volta_km,
    dias_sugeridos: calculado.dias_sugeridos,
    planejamento_calculado: { ...calculado, horas_por_instrucao: horasPorInstrucao },
    logistica: comAsAutomaticas(p.logistica, linhasAutomaticas(calculado, padroes)),
  };
}
