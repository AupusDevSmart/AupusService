import { useCallback, useRef } from 'react';
import { mensagemDoBackend } from '@/utils/api-error';

/** O que o sheet faz depois que o componente existe, pelo nome que aparece no aviso. */
export type AcoesPosCriacao = Map<string, (id: string) => Promise<void>>;

/**
 * Roda cada ação com o id criado e devolve o nome das que falharam, com o
 * motivo quando o backend mandou um ("os anexos (Arquivo maior que 10 MB)").
 * Uma falha não impede as outras; quem chama avisa o que ficou faltando (SN-12).
 */
export async function rodarAcoesPosCriacao(acoes: AcoesPosCriacao, id: string): Promise<string[]> {
  const falharam: string[] = [];
  for (const [nome, acao] of acoes) {
    try {
      await acao(id);
    } catch (erro) {
      const motivo = mensagemDoBackend(erro);
      falharam.push(motivo ? `${nome} (${motivo})` : nome);
    }
  }
  return falharam;
}

/**
 * O mapa de ações pós-criação de um sheet e a função que os campos usam para
 * se registrar. Recomeça vazio a cada abertura e a cada troca do modo lote: o
 * campo registra e não se desregistra ao desmontar, e a ação velha rodava no
 * próximo equipamento criado — os anexos do A subiam também no B (revisão do
 * SN-12). Limpa durante o render, e não num efeito: os efeitos dos filhos rodam
 * antes do efeito do pai, então limpar depois apagaria o registro que eles
 * acabaram de refazer. A identidade de `registrar` muda junto, para quem
 * continua montado se registrar de novo.
 */
export function useAcoesPosCriacao(aberto: boolean, modoLote = false) {
  const acoes = useRef<AcoesPosCriacao>(new Map());
  const anterior = useRef({ aberto, modoLote });
  if ((aberto && !anterior.current.aberto) || modoLote !== anterior.current.modoLote) {
    acoes.current.clear();
  }
  anterior.current = { aberto, modoLote };

  const registrar = useCallback(
    (chave: string, acao: (id: string) => Promise<void>) => {
      acoes.current.set(chave, acao);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- a identidade muda de propósito (ver acima)
    [aberto, modoLote],
  );

  return { acoes, registrar };
}
