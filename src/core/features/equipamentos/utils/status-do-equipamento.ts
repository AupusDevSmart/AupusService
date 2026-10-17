// src/core/features/equipamentos/utils/status-do-equipamento.ts

/**
 * O status do equipamento como a tela mostra: Inativo ou Ativo. A coluna vem
 * com outros textos — 'NORMAL' (235 de 254 no dev, da sincronização com o
 * NexOn), 'ativo' minúsculo, 'Ativo ' com espaço —, e a tabela pintava de
 * vermelho tudo que não fosse exatamente 'Ativo', enquanto o sheet já mostrava
 * Ativo. Uma regra só para os dois; o dado não muda (é compartilhado).
 */
export function statusDoEquipamento(status?: string | null): 'Ativo' | 'Inativo' {
  return String(status ?? '').trim().toLowerCase() === 'inativo' ? 'Inativo' : 'Ativo';
}
