// @vitest-environment node
import { copyFileSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Font } from '@react-pdf/renderer';
import { describe, expect, it } from 'vitest';
import { CARACTERES_DO_PDF, carregarFonte, textoDoPdf } from './documento';

/**
 * O que `textoDoPdf` deixa passar tem de estar em todos os pesos da fonte do
 * PDF (SN-92): o react-pdf apaga calado o caractere que a fonte não tem. Lê o
 * cmap (formato 4, o da Lexend) direto do arquivo, sem depender da fonte que
 * o react-pdf carrega: trocar a fonte sem conferir quebra aqui.
 */
const PESOS = ['Light', 'Regular', 'Medium', 'SemiBold', 'Bold'];

function caracteresDaFonte(arquivo: string): Set<number> {
  const b = readFileSync(arquivo);
  const tabelas = b.readUInt16BE(4);
  let cmap = -1;
  for (let i = 0; i < tabelas; i++) {
    if (b.toString('latin1', 12 + i * 16, 16 + i * 16) === 'cmap') cmap = b.readUInt32BE(12 + i * 16 + 8);
  }
  if (cmap < 0) throw new Error(`${arquivo} sem cmap`);

  const codigos = new Set<number>();
  for (let i = 0; i < b.readUInt16BE(cmap + 2); i++) {
    const registro = cmap + 4 + i * 8;
    const sub = cmap + b.readUInt32BE(registro + 4);
    if (b.readUInt16BE(registro) !== 3 || b.readUInt16BE(registro + 2) !== 1 || b.readUInt16BE(sub) !== 4) continue;
    const segmentos = b.readUInt16BE(sub + 6) / 2;
    const fins = sub + 14;
    const inicios = fins + segmentos * 2 + 2;
    const deltas = inicios + segmentos * 2;
    const deslocamentos = deltas + segmentos * 2;
    for (let s = 0; s < segmentos; s++) {
      const inicio = b.readUInt16BE(inicios + s * 2);
      const fim = b.readUInt16BE(fins + s * 2);
      const delta = b.readInt16BE(deltas + s * 2);
      const deslocamento = b.readUInt16BE(deslocamentos + s * 2);
      for (let c = inicio; c <= fim && c !== 0xffff; c++) {
        const glifo = deslocamento === 0
          ? (c + delta) & 0xffff
          : b.readUInt16BE(deslocamentos + s * 2 + deslocamento + (c - inicio) * 2);
        if (glifo !== 0) codigos.add(c);
      }
    }
  }
  return codigos;
}

const permitidos = [...CARACTERES_DO_PDF];

describe('fonte do PDF', () => {
  it.each(PESOS)('Lexend %s tem todo caractere que o texto do PDF deixa passar', (peso) => {
    const fonte = caracteresDaFonte(`${process.cwd()}/public/fonts/pdf/Lexend-${peso}.ttf`);
    expect(permitidos.filter((c) => !fonte.has(c.codePointAt(0)!))).toEqual([]);
  });

  it('o cmap lido é o do arquivo: a seta, que a Lexend não tem, não aparece', () => {
    const fonte = caracteresDaFonte(`${process.cwd()}/public/fonts/pdf/Lexend-Regular.ttf`);
    expect(fonte.has('A'.codePointAt(0)!)).toBe(true);
    expect(fonte.has('→'.codePointAt(0)!)).toBe(false);
  });

  it('o que passa pelo texto do PDF é exatamente o permitido (nenhum vira "?")', () => {
    expect(textoDoPdf(permitidos.join(''))).toBe(permitidos.join(''));
  });

  // O react-pdf guardava a carga que falhou: o arquivo voltava e a fonte continuava falhando
  it('a fonte que não carregou carrega na tentativa seguinte', async () => {
    const pasta = mkdtempSync(join(tmpdir(), 'fonte-do-pdf-'));
    try {
      const arquivo = join(pasta, 'Tardia.ttf');
      Font.register({ family: 'FonteTardia', src: arquivo });
      const descritor = { fontFamily: 'FonteTardia', fontWeight: 400 };

      await expect(carregarFonte(descritor)).rejects.toThrow();
      copyFileSync(`${process.cwd()}/public/fonts/pdf/Lexend-Regular.ttf`, arquivo);
      const fonte = await carregarFonte(descritor);
      expect(fonte.data).toBeTruthy();
    } finally {
      rmSync(pasta, { recursive: true, force: true });
    }
  });
});
