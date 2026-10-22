// @vitest-environment node
import { renderToBuffer } from '@react-pdf/renderer';
import { beforeAll, describe, expect, it } from 'vitest';
import type { DocumentoDaOS } from '@/features/execucao-os/utils/documento-da-os';
import { entradasVazias, imagensEmbutidas } from '@/test-utils/pdf';
import { prepararFontes } from './documento';
import { pdfDaOS } from './ordem-de-servico';

/**
 * O PDF da OS (SN-62) desenhado de verdade: estilo que o react-pdf não aceita
 * ou foto que ele não lê só aparecem ao renderizar, não no tipo.
 */
const PNG_1X1 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
const CODIGO = 'ab12cd34'.repeat(8);

const documento = (mudar: Partial<DocumentoDaOS> = {}): DocumentoDaOS => ({
  numero: 'OS-2026-0042',
  descricao: 'Inversor 3 desligando',
  meta: ['Nº OS-2026-0042', 'Finalizada em 17/10/2026, 09:00'],
  aviso: null,
  identificacao: [['Tipo', 'Corretiva']],
  cadastro: [['Planta', 'Planta Norte']],
  textos: [{ titulo: 'Resultado do serviço', texto: 'Ventilador trocado' }],
  falha: [['Causa', 'Ventilador travado']],
  tarefas: [{ nome: 'Trocar ventilador', situacao: 'Feita', quem: 'Ana', observacao: '' }],
  checklist: [{ tarefa: 'Trocar ventilador', itens: Array.from({ length: 60 }, (_, i) => ({ atividade: `Item ${i}`, feito: 'Feito', leitura: '600 V', observacao: '' })) }],
  equipe: [{ nome: 'Ana · Técnico Elétrico', estimadas: '4h', trabalhadas: '3h30', presente: 'Sim' }],
  totalDaEquipe: 'Horas-homem: 3h30 (4h previstas)',
  materiais: [{ descricao: 'Ventilador', planejado: '1 UN', consumido: '1 UN' }],
  ferramentas: [{ descricao: 'Multímetro', quantidade: '1', utilizada: 'Sim' }],
  auditoria: [['Custo real', 'R$ 234,50']],
  fotos: [
    { legenda: 'Foto de antes · Item 1', detalhe: 'Ana', foto: { src: PNG_1X1, largura: 1, altura: 1 }, falha: null },
    { legenda: 'Foto de depois', detalhe: '', foto: null, falha: 'arquivo não encontrado no servidor' },
  ],
  documentos: [{ nome: 'laudo.pdf · Laudo', detalhe: 'Geral da OS' }],
  verificacao: { codigo: CODIGO, agrupado: CODIGO.match(/.{8}/g)!.join(' '), url: `https://app/execucao-os?conferir=${CODIGO}` },
  ...mudar,
});

describe('PDF da OS', () => {
  // O que o baixarPdf faz antes de desenhar (ver `prepararFontes`)
  beforeAll(() => prepararFontes(), 30_000);

  it('desenha o documento inteiro, com foto, tabela de várias páginas e o código', async () => {
    const arquivo = await renderToBuffer(pdfDaOS(documento()));

    expect(arquivo.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    // Mais de uma página: o checklist longo quebra, e o rodapé com o código vai em todas
    expect(arquivo.toString('latin1').match(/\/Type\s*\/Page\b/g)!.length).toBeGreaterThan(1);
    // A fonte da identidade (SN-92), embutida: a Courier fica só no código e no endereço
    expect(arquivo.toString('latin1')).toMatch(/\/BaseFont\s*\/[A-Z]{6}\+Lexend-/);
    // E o texto se copia: todo glifo com a sua letra no ToUnicode
    expect(entradasVazias(arquivo)).toBe(0);
  }, 30_000);

  it('a prévia desenha sem código', async () => {
    const arquivo = await renderToBuffer(pdfDaOS(documento({ verificacao: null, aviso: 'Prévia: a OS ainda não foi finalizada.' })));
    expect(arquivo.subarray(0, 5).toString('latin1')).toBe('%PDF-');
  }, 30_000);

  // A logo é vetor: imagem no timbrado, no navegador, entrava de novo em cada página
  // (uns 250 KB por página). Imagem no PDF da OS, só a das fotos.
  it('sem foto, o PDF não embute imagem nenhuma', async () => {
    const arquivo = await renderToBuffer(pdfDaOS(documento({ fotos: [] })));
    expect(imagensEmbutidas(arquivo)).toBe(0);
  }, 30_000);
});
