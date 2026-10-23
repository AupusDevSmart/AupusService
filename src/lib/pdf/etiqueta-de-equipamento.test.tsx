// @vitest-environment node
import { renderToBuffer } from '@react-pdf/renderer';
import jsQR from 'jsqr';
import { beforeAll, describe, expect, it } from 'vitest';
import { entradasVazias } from '@/test-utils/pdf';
import { prepararFontes } from './documento';
import { pdfDasEtiquetas, type EtiquetaDoEquipamento } from './etiqueta-de-equipamento';
import { caminhoDoQr, matrizDoQr } from './qr-code';

/** A etiqueta com QR do equipamento (SN-67), desenhada de verdade. */
const URL = 'https://service.aupus.com.br/cadastros/equipamentos?equipamento=cmt8vutpy00092f3ozjf2lbmz';

const etiqueta = (i: number): EtiquetaDoEquipamento => ({
  url: `${URL}${i}`,
  nome: `Inversor ${i} da UFV — 75 kW · 1,5 MΩ`,
  tag: `INV-${i}`,
  lugar: 'UFV Solar Power · Usina Norte',
  criticidade: '4 · Alta',
});

const paginas = (pdf: Buffer) => (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length;

describe('QR code', () => {
  it('a matriz é quadrada, com os três padrões de localização nos cantos', () => {
    const m = matrizDoQr(URL);
    const n = m.length;
    expect(m.every((linha) => linha.length === n)).toBe(true);
    // Versão = (n - 17) / 4: um endereço deste tamanho cabe em poucas versões
    expect((n - 17) % 4).toBe(0);
    for (const [y, x] of [[0, 0], [0, n - 7], [n - 7, 0]]) {
      // Anel escuro de 7×7 com o centro 3×3 escuro e o anel de dentro claro
      expect(m[y][x] && m[y][x + 6] && m[y + 6][x] && m[y + 6][x + 6]).toBe(true);
      expect(m[y + 1][x + 1]).toBe(false);
      expect(m[y + 3][x + 3]).toBe(true);
    }
    expect(m[0][7]).toBe(false); // o separador claro depois do padrão
  });

  // O que importa: a câmera lê o endereço. Um leitor de verdade (jsQR) decodifica a matriz
  it('um leitor de QR lê o endereço de volta', () => {
    const m = matrizDoQr(URL);
    const escala = 4;
    const margem = 4;
    const lado = (m.length + 2 * margem) * escala;
    const pixels = new Uint8ClampedArray(lado * lado * 4).fill(255);
    m.forEach((linha, y) =>
      linha.forEach((escuro, x) => {
        if (!escuro) return;
        for (let dy = 0; dy < escala; dy++) {
          for (let dx = 0; dx < escala; dx++) {
            const i = (((y + margem) * escala + dy) * lado + (x + margem) * escala + dx) * 4;
            pixels[i] = pixels[i + 1] = pixels[i + 2] = 0;
          }
        }
      }),
    );
    expect(jsQR(pixels, lado, lado)?.data).toBe(URL);
  });

  it('o mesmo texto dá o mesmo QR, e o caminho tem um quadrado por módulo escuro', () => {
    const m = matrizDoQr(URL);
    expect(matrizDoQr(URL)).toEqual(m);
    const escuros = m.flat().filter(Boolean).length;
    expect(caminhoDoQr(m).match(/M/g)).toHaveLength(escuros);
  });
});

describe('PDF das etiquetas', () => {
  // O que o baixarPdf faz antes de desenhar (ver `prepararFontes`)
  beforeAll(() => prepararFontes(), 30_000);

  it('etiqueta: uma por página, com o texto que se copia (a Lexend da identidade, SN-92)', async () => {
    const pdf = await renderToBuffer(pdfDasEtiquetas([etiqueta(1), etiqueta(2), etiqueta(3)], 'etiqueta'));
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(paginas(pdf)).toBe(3);
    expect(pdf.toString('latin1')).toMatch(/\/BaseFont\s*\/[A-Z]{6}\+Lexend-/);
    expect(entradasVazias(pdf)).toBe(0);
  });

  it('A4: 8 por folha', async () => {
    const pdf = await renderToBuffer(pdfDasEtiquetas(Array.from({ length: 9 }, (_, i) => etiqueta(i)), 'a4'));
    expect(paginas(pdf)).toBe(2);
  });

  it('sem TAG, lugar nem criticidade ainda desenha', async () => {
    const pdf = await renderToBuffer(pdfDasEtiquetas([{ url: URL, nome: 'Painel', tag: null, lugar: null, criticidade: null }], 'etiqueta'));
    expect(paginas(pdf)).toBe(1);
  });
});
