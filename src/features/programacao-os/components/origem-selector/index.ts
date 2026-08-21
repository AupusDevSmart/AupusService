// src/features/programacao-os/components/origem-selector/index.ts
// Barrel export - centraliza as exportacoes dos componentes de selecao de origem

export * from './types';
export { ListaSelecionavel } from './ListaSelecionavel';
export type { OpcaoDaLista } from './ListaSelecionavel';
export { TarefasSelector } from './TarefasSelector';

// AnomaliaSelector, SolicitacaoSelector, PlanoSelector, PlantaSelector,
// UnidadeSelector, TipoOrigemSelector e HierarchyBreadcrumb sairam junto com o
// assistente: as tres primeiras eram a mesma lista com busca escrita tres
// vezes, e viraram ListaSelecionavel; planta e unidade nao sao mais perguntadas
// (vem da propria anomalia ou solicitacao); o tipo virou o primeiro passo e o
// breadcrumb virou a trilha do AssistentePassos.
