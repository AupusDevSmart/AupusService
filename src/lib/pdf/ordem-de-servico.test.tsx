// @vitest-environment node
import { renderToBuffer } from '@react-pdf/renderer';
import { beforeAll, describe, expect, it } from 'vitest';
import type { DocumentoDaOS } from '@/features/execucao-os/utils/documento-da-os';
import { entradasVazias, imagensEmbutidas, textosDesenhados } from '@/test-utils/pdf';
import { prepararFontes } from './documento';
import { documentoDoPdfDaOS, pdfDaOS } from './ordem-de-servico';

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
  tarefas: [{ nome: 'Trocar ventilador', equipamento: 'Inversor 03', situacao: 'Feita', quem: 'Ana', observacao: '' }],
  checklist: [{ tarefa: 'Trocar ventilador', itens: Array.from({ length: 60 }, (_, i) => ({ atividade: `Item ${i}`, feito: 'Feito', leitura: '600 V', observacao: '' })) }],
  equipe: [{ nome: 'Ana · Técnico Elétrico', estimadas: '4h', trabalhadas: '3h30', valorHora: 'R$ 78,00', custo: 'R$ 273,00', presente: 'Sim' }],
  totalDaEquipe: 'Horas-homem: 3h30 (4h previstas)',
  materiais: [{ descricao: 'Ventilador', planejado: '1 UN', consumido: '1 UN', unitario: 'R$ 180,00', custo: 'R$ 180,00' }],
  custos: {
    real: 'R$ 1.855,50',
    previsto: 'R$ 1.802,00',
    diferenca: '+R$ 53,50 (+3%)',
    naturezas: [
      { rotulo: 'Mão de obra', previsto: 'R$ 312,00', real: 'R$ 273,00', diferenca: '−R$ 39,00 (−12,5%)' },
      { rotulo: 'Veículo', previsto: 'R$ 1.310,00', real: 'R$ 1.402,50', diferenca: '+R$ 92,50 (+7,1%)' },
    ],
    totalPrevisto: 'R$ 1.802,00',
    totalReal: 'R$ 1.855,50',
    ajuste: null,
    instrucoes: [{ nome: 'INV-03 · Trocar ventilador', equipamento: 'Inversor 03', situacao: 'Feita', valor: 'R$ 902,08', detalhe: null }],
    resumoDasInstrucoes: '1 de 1 feita · R$ 902,08 de R$ 902,08',
    outros: [{ descricao: 'Veículo: Picape 4x4', natureza: 'Veículo', previsto: 'R$ 1.310,00', real: 'R$ 1.402,50' }],
    pendencias: ['1 outro custo não foi conferido e entra pelo previsto.'],
  },
  ferramentas: [{ descricao: 'Multímetro', quantidade: '1', utilizada: 'Sim' }],
  auditoria: [['Nota da auditoria', '4 de 5']],
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

  // SN-93: o custo aberto logo depois do resultado, e o equipamento de cada tarefa
  it('a seção de custos e o equipamento da tarefa saem desenhados', async () => {
    const desenhados = (await textosDesenhados(documentoDoPdfDaOS(documento()))).map((t) => t.texto);
    for (const texto of ['Custos', 'Custo real', 'R$ 1.855,50', 'Por natureza', 'Por instrução', 'R$ 902,08', 'Outros custos', 'R$ 273,00']) {
      expect(desenhados.some((t) => t.includes(texto)), texto).toBe(true);
    }
    // A tarefa e a instrução dizem de qual inversor
    expect(desenhados.filter((t) => t === 'Inversor 03').length).toBeGreaterThanOrEqual(2);
    // O custo saiu da seção da auditoria
    expect(desenhados).not.toContain('Custo e auditoria');
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
