// src/lib/pdf/qr-code.tsx
import { Path, Svg } from '@react-pdf/renderer';
import qrcode from 'qrcode-generator';

/**
 * QR code em vetor, desenhado pelo próprio react-pdf (SN-67).
 *
 * A biblioteca (`qrcode-generator`, versão fixa, sem dependências) só calcula
 * a matriz; o desenho é um `Path` com um quadrado por módulo escuro. Sem
 * imagem: nítido em qualquer impressora e zoom, e o arquivo fica pequeno.
 *
 * Correção de erro M (15%): aguenta etiqueta riscada ou um pouco suja, sem o
 * QR ficar denso demais para a câmera do celular.
 */
const MARGEM = 4; // a "zona quieta" que o leitor exige, em módulos

/** A matriz do QR: `true` = módulo escuro. */
export function matrizDoQr(texto: string): boolean[][] {
  const qr = qrcode(0, 'M');
  qr.addData(texto, 'Byte');
  qr.make();
  const n = qr.getModuleCount();
  return Array.from({ length: n }, (_, linha) => Array.from({ length: n }, (_, coluna) => qr.isDark(linha, coluna)));
}

/** Os módulos escuros como um caminho SVG só, já com a margem. */
export function caminhoDoQr(matriz: boolean[][]): string {
  const partes: string[] = [];
  matriz.forEach((linha, y) =>
    linha.forEach((escuro, x) => {
      if (escuro) partes.push(`M${x + MARGEM} ${y + MARGEM}h1v1h-1z`);
    }),
  );
  return partes.join('');
}

export function QrCode({ texto, tamanho }: { texto: string; tamanho: number }) {
  const matriz = matrizDoQr(texto);
  const lado = matriz.length + 2 * MARGEM;
  return (
    <Svg width={tamanho} height={tamanho} viewBox={`0 0 ${lado} ${lado}`}>
      <Path d={caminhoDoQr(matriz)} fill="#000000" />
    </Svg>
  );
}
