// @vitest-environment node
import { renderToBuffer } from '@react-pdf/renderer';
import { beforeAll, describe, expect, it } from 'vitest';
import type { Proposta } from '@/services/proposta.services';
import { entradasVazias, imagensEmbutidas, tabelasToUnicode, textosDesenhados } from '@/test-utils/pdf';
import { DocumentoAupus, prepararFontes } from './documento';
import { pdfDaProposta, resumoDoEscopo } from './proposta';

/**
 * A proposta comercial desenhada de verdade (SN-92): capa numa página própria,
 * seções numeradas, o total no painel e a Lexend embutida. Estilo que o
 * react-pdf não aceita só aparece ao renderizar, não no tipo.
 */
const proposta = (mudar: Partial<Proposta> = {}): Proposta => ({
  itens: [
    { instrucao_id: 'i1', descricao: 'TR-01 · Inspeção sensitiva do transformador', quantidade: 1, preco_unitario: 1850 },
    { instrucao_id: 'i2', descricao: 'TR-03 · Ensaios elétricos do transformador', quantidade: 1, preco_unitario: 6420.5 },
  ],
  outros_custos: [
    { descricao: 'Deslocamento (460 km)', valor: 1288, faturamento_direto: false },
    { descricao: 'Locação do gerador 150 kVA', valor: 2200, faturamento_direto: true },
  ],
  bdi_regime: 'SEM_REIDI',
  bdi_administracao_central: 4,
  bdi_seguro_garantia: 0.8,
  bdi_taxa_risco: 1.27,
  bdi_despesas_financeiras: 1.23,
  bdi_lucro: 7.4,
  bdi_pis: 0.65,
  bdi_cofins: 3,
  bdi_cprb: 0,
  bdi_issqn: 5,
  bdi_percentual: 30.44,
  total_custo: 11758.5,
  total_bdi: 2909.94,
  total_geral: 14668.44,
  ...mudar,
});

const escopo = [
  {
    id: 'i1',
    rotulo: 'TR-01 · Inspeção sensitiva do transformador',
    etapas: [
      { descricao: 'Conferir o nível e a temperatura do óleo', duracao_horas: 0.5 },
      { descricao: 'Medir a resistência de isolamento (mínimo 1 GΩ)', duracao_horas: 1.5 },
    ],
  },
];

const paginas = (arquivo: Buffer) => arquivo.toString('latin1').match(/\/Type\s*\/Page\b/g)!.length;

describe('PDF da proposta', () => {
  // O que o baixarPdf faz antes de desenhar (ver `prepararFontes`)
  beforeAll(() => prepararFontes(), 30_000);

  it('capa numa página própria, conteúdo depois, e a fonte da identidade embutida', async () => {
    const arquivo = await renderToBuffer(pdfDaProposta({ proposta: proposta(), numero: 'PRG-2026-014', titulo: 'Manutenção do transformador', cliente: 'Laticínio Vale Verde', escopo }));

    expect(arquivo.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    expect(paginas(arquivo)).toBeGreaterThanOrEqual(2);
    expect(arquivo.toString('latin1')).toMatch(/\/BaseFont\s*\/[A-Z]{6}\+Lexend-(Regular|SemiBold)/);
    // A logo e a marca-d'água em vetor: a imagem, no navegador, entrava de novo em cada página
    expect(imagensEmbutidas(arquivo)).toBe(0);
  }, 30_000);

  it('sem escopo, sem cliente e sem número: desenha do mesmo jeito', async () => {
    const arquivo = await renderToBuffer(pdfDaProposta({ proposta: proposta({ outros_custos: [] }), escopo: [] }));
    expect(arquivo.subarray(0, 5).toString('latin1')).toBe('%PDF-');
  }, 30_000);

  // Sem as fontes preparadas, este caso (sem cliente nem número) saía com o "c" sem letra
  // no ToUnicode da Lexend SemiBold: o total copiado do PDF virava "132433415"
  it('o texto do PDF tem a letra de todo glifo: copiar o total dá o total', async () => {
    const arquivo = await renderToBuffer(pdfDaProposta({ proposta: proposta(), escopo: [] }));
    expect(tabelasToUnicode(arquivo).length).toBeGreaterThan(1);
    expect(entradasVazias(arquivo)).toBe(0);
  }, 30_000);
});

describe('escopo na capa', () => {
  beforeAll(() => prepararFontes(), 30_000);

  // A lista inteira, numa proposta grande, descia por cima do slogan e do rodapé da capa
  it('os quatro primeiros serviços e quantos mais', () => {
    const rotulos = Array.from({ length: 20 }, (_, i) => `TR-${i + 1}`);
    expect(resumoDoEscopo(rotulos)).toBe('TR-1 · TR-2 · TR-3 · TR-4 e mais 16');
    expect(resumoDoEscopo(rotulos.slice(0, 4))).toBe('TR-1 · TR-2 · TR-3 · TR-4');
    expect(resumoDoEscopo([])).toBeUndefined();
  });

  it('com vinte instruções de nome longo, a capa termina antes do slogan', async () => {
    const rotulos = Array.from({ length: 20 }, (_, i) => `TR-${i + 1} · Ensaios elétricos e termografia do transformador de potência da subestação principal`);
    const capa = (subtitulo: string) =>
      textosDesenhados(
        DocumentoAupus({
          titulo: 'Proposta',
          comCapa: true,
          abertura: { tipo: 'Proposta comercial', titulo: 'Manutenção do transformador', subtitulo, campos: [['Cliente', 'Laticínio Vale Verde'], ['Data', 'Emitida em 21/10/2026']] },
          rodape: { referencia: 'Proposta' },
          children: null,
        }),
      );
    const folga = async (subtitulo: string) => {
      const desenhados = (await capa(subtitulo)).filter((t) => t.pagina === 1);
      const slogan = desenhados.find((t) => t.texto.startsWith('Interligando'))!;
      const data = desenhados.find((t) => t.texto.startsWith('Emitida em'))!;
      return slogan.inicio - data.fim;
    };
    // A conta sem o resumo, para o teste valer: a lista inteira passa por cima do slogan
    expect(await folga(rotulos.join(' · '))).toBeLessThan(0);
    expect(await folga(resumoDoEscopo(rotulos)!)).toBeGreaterThan(20);
  }, 30_000);
});
