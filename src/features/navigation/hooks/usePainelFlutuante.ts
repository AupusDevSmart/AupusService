import { useCallback, useEffect, useRef, useState } from 'react';

const ATRASO_FECHAR_MS = 150;
const ALTURA_CABECALHO = 36;
const ALTURA_SUBITEM = 36;
const MARGEM = 8;
const DISTANCIA_DO_ITEM = 6;

export type PosicaoPainel = { top: number; left: number };

/**
 * Painel de subitens que abre ao lado de um grupo quando o menu esta recolhido.
 *
 * Abre no mouseenter do item e fecha 150 ms depois do mouseleave; entrar no
 * painel cancela o fechamento, entao o mouse atravessa o vao sem o painel sumir.
 */
export function usePainelFlutuante(habilitado: boolean, quantidadeSubitens: number) {
  const refItem = useRef<HTMLLIElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const [posicao, setPosicao] = useState<PosicaoPainel | null>(null);

  const cancelarFechar = useCallback(() => {
    window.clearTimeout(timer.current);
  }, []);

  const fechar = useCallback(() => {
    window.clearTimeout(timer.current);
    setPosicao(null);
  }, []);

  const agendarFechar = useCallback(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setPosicao(null), ATRASO_FECHAR_MS);
  }, []);

  const abrir = useCallback(() => {
    if (!habilitado || !refItem.current) return;
    window.clearTimeout(timer.current);
    const rect = refItem.current.getBoundingClientRect();
    const alturaEstimada = ALTURA_CABECALHO + quantidadeSubitens * ALTURA_SUBITEM + MARGEM;
    setPosicao({
      top: Math.max(MARGEM, Math.min(rect.top, window.innerHeight - alturaEstimada - MARGEM)),
      left: rect.right + DISTANCIA_DO_ITEM,
    });
  }, [habilitado, quantidadeSubitens]);

  // Menu expandido: o painel deixa de fazer sentido.
  useEffect(() => {
    if (!habilitado) fechar();
  }, [habilitado, fechar]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return { refItem, posicao, abrir, agendarFechar, cancelarFechar, fechar };
}
