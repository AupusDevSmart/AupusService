import { useLayoutEffect, useRef, useState } from 'react';

/** "46rem" ou "736px" em pixels; rem pela fonte da raiz (o zoom do navegador muda) */
export function emPixels(largura: string): number {
  const valor = parseFloat(largura);
  if (Number.isNaN(valor)) return 0;
  if (largura.trim().endsWith('rem')) {
    const raiz = typeof document === 'undefined' ? 16 : parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    return valor * raiz;
  }
  return valor;
}

/**
 * Se o elemento está mais estreito que `largura` — a do próprio container, não
 * a da tela: o sheet é estreito também num monitor largo. Mede antes de pintar
 * (sem piscar o layout largo no celular) e acompanha o redimensionamento.
 * Sem ResizeObserver (jsdom), fica com a primeira medida.
 */
export function useMaisEstreitoQue<T extends HTMLElement>(largura: string) {
  const ref = useRef<T>(null);
  const [estreito, setEstreito] = useState(false);

  useLayoutEffect(() => {
    const elemento = ref.current;
    if (!elemento) return;
    const limite = emPixels(largura);
    const medir = (atual: number) => setEstreito(atual > 0 && atual < limite);

    medir(elemento.getBoundingClientRect().width);
    if (typeof ResizeObserver === 'undefined') return;
    const observador = new ResizeObserver(([entrada]) => medir(entrada.contentRect.width));
    observador.observe(elemento);
    return () => observador.disconnect();
  }, [largura]);

  return { ref, estreito };
}
