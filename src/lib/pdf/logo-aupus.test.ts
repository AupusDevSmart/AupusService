// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CAIXA_DA_LOGO, TRACOS_DA_LOGO } from './logo-aupus';

/**
 * A logo do PDF são os traços do SVG da marca (SN-92): trocar a logo do app sem
 * gerar de novo o `logo-aupus.ts` quebra aqui, e não num PDF com a marca velha.
 */
const svg = readFileSync(`${process.cwd()}/public/brand/service-logo-negativo.svg`, 'utf8');
const caminhos = [...svg.matchAll(/<path ([^>]*?)\/?>/g)].map(([, atributos]) =>
  Object.fromEntries([...atributos.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, k, v]) => [k, v])),
);

describe('logo do PDF', () => {
  it('os mesmos traços, na mesma ordem, e a mesma caixa do SVG', () => {
    expect(svg).toContain(`viewBox="${CAIXA_DA_LOGO}"`);
    expect(TRACOS_DA_LOGO.map((t) => t.d)).toEqual(caminhos.map((c) => c.d));
  });

  it('cada traço com o papel que tem no SVG: o branco é letra, o verde a onda, o fundo os cortes da linha', () => {
    const papel = (c: Record<string, string>) => {
      if (c.stroke) return { cor: c.stroke === 'white' ? 'letra' : 'onda', preenchido: false };
      return { cor: c.fill === 'white' ? 'letra' : 'papel', preenchido: true };
    };
    expect(TRACOS_DA_LOGO.map(({ cor, preenchido }) => ({ cor, preenchido }))).toEqual(caminhos.map(papel));
  });

  // O peso da versão colorida (o PNG) só muda o "Aupus" e a onda: o "Energia" é o do SVG
  it('o "Energia" com o contorno do SVG', () => {
    const energia = caminhos.flatMap((c, i) => (i >= 7 && c.stroke === 'white' ? [[i, Number(c['stroke-width'])]] : []));
    expect(energia.length).toBeGreaterThan(0);
    energia.forEach(([i, largura]) => expect(TRACOS_DA_LOGO[i].contorno).toBe(largura));
  });
});
