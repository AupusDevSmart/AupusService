/**
 * Atalho de outra tela para a programação de OS com a origem já escolhida.
 *
 *   /programacao-os?origem=ANOMALIA&id=<id>
 *
 * A página decide o que abrir: se a origem já tem programação em aberto, abre
 * essa programação; senão, abre o sheet de criação com a origem pré-selecionada.
 * Plano não fica "programado", então sempre abre a criação (no passo das
 * tarefas). O atalho só navega: nada da origem é copiado para o formulário.
 *
 * URL e não `location.state` porque sobrevive a recarregar a página e pode ser
 * compartilhada — o mesmo motivo do `?programacaoId=` que a página já aceita.
 */
import type { Permissao } from '@/types/dtos/usuarios-dto';

export type OrigemDoAtalho = 'ANOMALIA' | 'SOLICITACAO_SERVICO' | 'PLANO_MANUTENCAO';

/**
 * O botão que a tela da anomalia/solicitação mostra, pelo status dela.
 * A anomalia registrada e a solicitação com a proposta revisada (29/out/2026: a
 * registrada ainda tem a proposta em edição) podem ser programadas; programada
 * já tem a sua (uma por origem); finalizada não tem para onde ir.
 */
export function atalhoDaOrigem(
  status: string | undefined | null,
  tipo: 'ANOMALIA' | 'SOLICITACAO_SERVICO' = 'ANOMALIA',
): { rotulo: 'Programar' | 'Ver programação'; permissao: Permissao } | null {
  const s = status?.toUpperCase();
  const programavel = tipo === 'SOLICITACAO_SERVICO' ? 'PROPOSTA_REVISADA' : 'REGISTRADA';
  if (s === programavel) return { rotulo: 'Programar', permissao: 'programacao_os.manage' };
  if (s === 'PROGRAMADA') return { rotulo: 'Ver programação', permissao: 'programacao_os.view' };
  return null;
}

const ORIGENS: OrigemDoAtalho[] = ['ANOMALIA', 'SOLICITACAO_SERVICO', 'PLANO_MANUTENCAO'];

export function linkDeProgramacao(tipo: OrigemDoAtalho, id: string): string {
  return `/programacao-os?origem=${tipo}&id=${encodeURIComponent(id.trim())}`;
}

export function atalhoDaUrl(params: URLSearchParams): { tipo: OrigemDoAtalho; id: string } | null {
  const tipo = params.get('origem') as OrigemDoAtalho | null;
  const id = params.get('id')?.trim();
  if (!tipo || !ORIGENS.includes(tipo) || !id) return null;
  return { tipo, id };
}
