// src/core/features/equipamentos/config/criticidade.ts

/**
 * A escala de criticidade do equipamento, de 1 a 5 (a do cron: ≥ 4 gera OS de
 * prioridade alta). Um lugar só para o filtro da lista, a coluna e o painel —
 * eram três listas, com rótulos diferentes. A planilha tem os dela ("Muito
 * Alta"), que são contrato da importação e não mudam junto.
 */
export const NIVEIS_DE_CRITICIDADE = [
  { value: '5', label: 'Muito alta' },
  { value: '4', label: 'Alta' },
  { value: '3', label: 'Média' },
  { value: '2', label: 'Baixa' },
  { value: '1', label: 'Muito baixa' },
] as const;

/** "4 · Alta". Valor fora da escala (os A/B/C antigos) aparece como veio, não some. */
export function rotuloDaCriticidade(nivel?: string | null): string {
  const valor = nivel?.trim();
  if (!valor) return '—';
  const conhecido = NIVEIS_DE_CRITICIDADE.find((n) => n.value === valor);
  return conhecido ? `${conhecido.value} · ${conhecido.label}` : valor;
}

/** As opções do filtro, com "toda criticidade" primeiro. */
export const OPCOES_DE_CRITICIDADE = [
  { value: 'all', label: 'Toda criticidade' },
  ...NIVEIS_DE_CRITICIDADE.map((n) => ({ value: n.value, label: rotuloDaCriticidade(n.value) })),
];
