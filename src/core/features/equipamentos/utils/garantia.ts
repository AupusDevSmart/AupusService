import { hojeEmBrasilia } from '@/utils/brasilia';
import { formatarDiaDeCalendario } from '@/utils/dia-de-calendario';

/** A partir de quantos dias para o fim a garantia aparece como "vencendo" */
export const AVISO_DE_GARANTIA_EM_DIAS = 60;

export type SituacaoDaGarantia =
  | { tipo: 'vencida'; dias: number; texto: string }
  | { tipo: 'vencendo'; dias: number; texto: string }
  | { tipo: 'vigente'; dias: number; texto: string };

const diaUtc = (dia: string) => Date.parse(`${dia.slice(0, 10)}T00:00:00Z`);

/**
 * A garantia na leitura do equipamento (SN-66). Dias de calendário, contados no
 * fuso de Brasília: a data é "até o fim do dia" — vence no dia seguinte. Sem
 * data (ou data inválida), nada a dizer.
 */
export function situacaoDaGarantia(garantiaAte?: string | null, hoje: string = hojeEmBrasilia()): SituacaoDaGarantia | null {
  if (!garantiaAte) return null;
  const fim = diaUtc(garantiaAte);
  const agora = diaUtc(hoje);
  if (Number.isNaN(fim) || Number.isNaN(agora)) return null;

  const dias = Math.round((fim - agora) / 86_400_000);
  const ate = formatarDiaDeCalendario(garantiaAte.slice(0, 10));
  if (dias < 0) return { tipo: 'vencida', dias, texto: `Garantia vencida em ${ate}` };
  if (dias === 0) return { tipo: 'vencendo', dias, texto: 'A garantia termina hoje' };
  if (dias <= AVISO_DE_GARANTIA_EM_DIAS) {
    return { tipo: 'vencendo', dias, texto: `A garantia termina em ${dias} ${dias === 1 ? 'dia' : 'dias'} (${ate})` };
  }
  return { tipo: 'vigente', dias, texto: `Em garantia até ${ate}` };
}

/** Garantia que acaba antes da instalação é quase sempre data trocada: avisa, não bloqueia */
export function garantiaAntesDaInstalacao(dataInstalacao?: string | null, garantiaAte?: string | null): boolean {
  if (!dataInstalacao || !garantiaAte) return false;
  return diaUtc(garantiaAte) < diaUtc(dataInstalacao);
}
