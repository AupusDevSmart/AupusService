// src/features/execucao-os/components/sheet/formato.ts

/** Texto que pode estar vazio: só com valor */
export const texto = (v?: string | null) => (v?.trim() ? v.trim() : null);

/** O instante da API (ISO em UTC) na hora de quem está na tela: "06/11/2026 14:30" */
export function dataHora(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
