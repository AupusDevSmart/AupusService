// src/features/solicitacoes-servico/utils/duracao-da-proposta.ts
import type { Proposta } from '@/services/proposta.services';

/** As horas de uma jornada: os dias são as horas ÷ 8 */
const HORAS_POR_DIA = 8;

export const numeroNaTela = (valor: number) => valor.toLocaleString('pt-BR', { maximumFractionDigits: 2 });

/** "4h30", "8h", "45 min" */
export const horasNaTela = (horas: number) => {
  const minutos = Math.round(horas * 60);
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
};

const dias = (n: number) => `${numeroNaTela(n)} ${n === 1 ? 'dia' : 'dias'}`;

/**
 * De onde saem os dias, escrito (pedido do usuário, 30/out/2026: "o total de horas
 * das instruções na tela, para o usuário ter noção"): as horas dos passos das
 * instruções, a estrada, a jornada de 8 h e o resultado, arredondado para cima.
 * As três contas são as de `planejamento-da-proposta.ts`:
 *   sem a distância: serviço ÷ 8 h
 *   dormindo no local: (serviço + estrada de ida e volta) ÷ 8 h
 *   bate-volta: serviço ÷ (8 h − estrada de ida e volta)
 */
export function contaDosDias(proposta: Proposta): string | null {
  const c = proposta.planejamento_calculado;
  if (!c) return null;
  const horas = c.horas_dos_passos;
  if (!(horas > 0)) return proposta.itens.some((i) => i.instrucao_id) ? 'As instruções não têm horas nos passos: digite os dias.' : null;
  const sugeridos = c.dias_sugeridos;
  const resultado = sugeridos ? ` → ${dias(sugeridos)}` : '';
  const trecho = c.horas_por_trecho;
  let conta: string;
  if (trecho === null) {
    conta = `${horasNaTela(horas)} de serviço (os passos das instruções) ÷ ${HORAS_POR_DIA}h por dia${resultado}`;
  } else if (c.bate_volta && HORAS_POR_DIA - 2 * trecho > 0) {
    conta = `${horasNaTela(horas)} de serviço ÷ ${horasNaTela(HORAS_POR_DIA - 2 * trecho)} de trabalho por dia (${HORAS_POR_DIA}h menos ${horasNaTela(2 * trecho)} de estrada, ida e volta)${resultado}`;
  } else {
    conta = `${horasNaTela(horas)} de serviço + ${horasNaTela(2 * trecho)} de estrada (ida e volta) = ${horasNaTela(horas + 2 * trecho)} ÷ ${HORAS_POR_DIA}h por dia${resultado}`;
  }
  const digitados = proposta.dias_previstos;
  const aviso = digitados !== null && sugeridos !== null && digitados !== sugeridos ? `. Valem os ${dias(digitados)} digitados` : '';
  return `${conta} (para cima)${aviso}.`;
}
