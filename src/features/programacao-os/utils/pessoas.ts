import type { ComboboxOption } from '@/core/components/ui/combobox';

/** Só o que o seletor lê: a rota da OS (SN-61) não manda e-mail nem papel */
type PessoasPorNome = {
  equipe: { id: string; nome: string }[];
  apoio: { id: string; nome: string }[];
};

export const GRUPO_EQUIPE = 'Equipe da planta';
export const GRUPO_APOIO = 'Planejamento e gestão';
export const GRUPO_ANTES = 'Escalado antes';

/**
 * As opções do seletor de pessoa: a equipe da planta primeiro, depois o apoio.
 * Quem já está escalado e não aparece mais (saiu da equipe, trocou de planta)
 * continua visível, para a tela não mostrar o campo vazio — gravar de novo é
 * que o backend recusa, com o motivo.
 */
export function opcoesDePessoas(
  pessoas: PessoasPorNome | undefined,
  atual?: { id?: string | null; nome?: string | null },
): ComboboxOption[] {
  const opcoes: ComboboxOption[] = [
    ...(pessoas?.equipe ?? []).map((p) => ({ value: p.id.trim(), label: p.nome, grupo: GRUPO_EQUIPE })),
    ...(pessoas?.apoio ?? []).map((p) => ({ value: p.id.trim(), label: p.nome, grupo: GRUPO_APOIO })),
  ];
  const id = atual?.id?.trim();
  if (id && !opcoes.some((o) => o.value === id)) {
    opcoes.push({ value: id, label: atual?.nome?.trim() || 'Usuário escalado', grupo: GRUPO_ANTES });
  }
  return opcoes;
}

/**
 * A planta da programação no formulário: vem da origem escolhida (o seletor
 * guarda em `origem.plantaId`); a programação já salva traz `planta_id`.
 */
export function plantaDoFormulario(formData?: Record<string, unknown>): string | null {
  const origem = formData?.origem as { plantaId?: string } | undefined;
  // A origem da preventiva gerada pelo cron vem com plantaId vazio ('')
  return origem?.plantaId?.trim() || (formData?.planta_id as string | undefined)?.trim() || null;
}

/** O nome da opção escolhida, para gravar junto do id (o backend confirma). */
export function nomeDaOpcao(opcoes: ComboboxOption[], id: string): string {
  return opcoes.find((o) => o.value === id)?.label ?? '';
}

/** Texto antigo, de antes de o responsável ser usuário. */
export function textoSemUsuario(nome?: string | null, id?: string | null): string | null {
  return !id?.trim() && nome?.trim() ? `${nome.trim()} (sem usuário)` : null;
}
