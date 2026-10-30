// @vitest-environment node
import { renderToBuffer } from '@react-pdf/renderer';
import type { ReactElement } from 'react';
import { beforeAll, describe, expect, it } from 'vitest';
import type { Proposta } from '@/services/proposta.services';
import { entradasVazias, imagensEmbutidas, tabelasToUnicode, textosDesenhados } from '@/test-utils/pdf';
import { DocumentoAupus, prepararFontes } from './documento';
import { PropostaDocumento, pdfDaProposta, resumoDoEscopo } from './proposta';

/**
 * A proposta comercial desenhada de verdade (SN-92): capa numa página própria,
 * seções numeradas, o total no painel e a Lexend embutida. Estilo que o
 * react-pdf não aceita só aparece ao renderizar, não no tipo.
 */
/** A proposta na conta de imposto e margem (29/out/2026), como o servidor a devolve */
const proposta = (mudar: Partial<Proposta> = {}): Proposta => ({
  conta_da_proposta: 'IMPOSTO_MARGEM',
  itens: [
    { instrucao_id: 'i1', descricao: 'TR-01 · Inspeção sensitiva do transformador', quantidade: 1, preco_unitario: 1850, valor_venda: 2846.15 },
    { instrucao_id: 'i2', descricao: 'TR-03 · Ensaios elétricos do transformador', quantidade: 1, preco_unitario: 6420.5, valor_venda: 9877.69 },
  ],
  outros_custos: [
    { descricao: 'ART', valor: 104, faturamento_direto: false },
    { descricao: 'Locação do gerador 150 kVA', valor: 2200, faturamento_direto: true },
  ],
  logistica: [{ tabela: 'DESLOCAMENTO', ativo: true, descricao: 'Picape 4x4', dias: 2, valor_unitario: 0, km: 920, valor_km: 1.4, total: 1288 }],
  imposto_percentual: 15,
  margem_percentual: 20,
  adm_servicos_percentual: 5,
  adm_fd_percentual: 2,
  distancia_km: 460,
  distancia_ida_volta_km: 920,
  deslocamento_interno_km: null,
  dias_previstos: 2,
  pessoas_previstas: 2,
  noites_fora: 1,
  validade_proposta: '2026-11-30',
  condicoes_comerciais: 'Pagamento em 30 dias da entrega do relatório.',
  total_custo: 11962.5,
  total_servicos: 9762.5,
  total_fd: 2200,
  total_administracao: 626,
  total_aupus: 15645.85,
  valor_imposto: 2346.88,
  margem_efetiva: 22.6,
  total_geral: 17845.85,
  desconto_tipo: null,
  desconto_valor: null,
  total_desconto: 0,
  fechamento: null,
  venda: { logistica: 1981.54, adicionais: 160 },
  ...mudar,
});

/** Os textos que o documento desenha (o `textosDesenhados` quer o Document: o do timbrado, desembrulhado) */
const desenhados = async (p: Proposta) => {
  const timbrado = PropostaDocumento({ proposta: p }) as ReactElement<Parameters<typeof DocumentoAupus>[0]>;
  return (await textosDesenhados(DocumentoAupus(timbrado.props))).map((t) => t.texto).join(' | ');
};

const paginas = (arquivo: Buffer) => arquivo.toString('latin1').match(/\/Type\s*\/Page\b/g)!.length;

describe('PDF da proposta', () => {
  // O que o baixarPdf faz antes de desenhar (ver `prepararFontes`)
  beforeAll(() => prepararFontes(), 30_000);

  it('capa numa página própria, conteúdo depois, e a fonte da identidade embutida', async () => {
    const arquivo = await renderToBuffer(pdfDaProposta({ proposta: proposta(), numero: 'PRG-2026-014', titulo: 'Manutenção do transformador', cliente: 'Laticínio Vale Verde' }));

    expect(arquivo.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    expect(paginas(arquivo)).toBeGreaterThanOrEqual(2);
    expect(arquivo.toString('latin1')).toMatch(/\/BaseFont\s*\/[A-Z]{6}\+Lexend-(Regular|SemiBold)/);
    // A logo e a marca-d'água em vetor: a imagem, no navegador, entrava de novo em cada página
    expect(imagensEmbutidas(arquivo)).toBe(0);
  }, 30_000);

  it('sem instrução, sem cliente e sem número: desenha do mesmo jeito', async () => {
    const arquivo = await renderToBuffer(pdfDaProposta({ proposta: proposta({ itens: [], outros_custos: [] }) }));
    expect(arquivo.subarray(0, 5).toString('latin1')).toBe('%PDF-');
  }, 30_000);

  // Sem as fontes preparadas, este caso (sem cliente nem número) saía com o "c" sem letra
  // no ToUnicode da Lexend SemiBold: o total copiado do PDF virava "132433415"
  it('o texto do PDF tem a letra de todo glifo: copiar o total dá o total', async () => {
    const arquivo = await renderToBuffer(pdfDaProposta({ proposta: proposta() }));
    expect(tabelasToUnicode(arquivo).length).toBeGreaterThan(1);
    expect(entradasVazias(arquivo)).toBe(0);
  }, 30_000);

  // Com desconto, o painel leva o total com ele, e o desconto não aparece
  it('com desconto: desenha só o total final, e o texto segue legível', async () => {
    const comDesconto = proposta({ desconto_tipo: 'PERCENTUAL', desconto_valor: 12.5, total_desconto: 1833.56, total_geral: 12834.88 });
    const arquivo = await renderToBuffer(pdfDaProposta({ proposta: comDesconto }));
    expect(arquivo.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    expect(entradasVazias(arquivo)).toBe(0);
    const textos = await desenhados(comDesconto);
    expect(textos).toMatch(/R\$\s12\.834,88/);
    expect(textos).not.toMatch(/desconto|1\.833,56/i);
  }, 30_000);

  // De valor, só o final (29/out/2026); e a spec: nunca o custo, a margem, as horas nem as tabelas
  it('a conta nova mostra os serviços pelo nome e só o valor final', async () => {
    const textos = await desenhados(proposta());
    // O formato de moeda do pt-BR põe um espaço não separável depois do "R$"
    expect(textos).toMatch(/Investimento global \| R\$\s17\.845,85/);
    expect(textos.match(/R\$/g)).toHaveLength(1);
    expect(textos).toContain('Escopo do serviço');
    expect(textos).toContain('TR-03 · Ensaios elétricos do transformador');
    expect(textos).toContain('30/11/2026');
    expect(textos).not.toMatch(/Administração|Total faturado|Desconto/);
    expect(textos).not.toMatch(/margem/i);
    // Os valores das linhas (R$ por km, total da linha, custo do adicional) nunca
    expect(textos).not.toMatch(/1,40|1\.288|104,00|2\.200/);
  }, 30_000);

  // Pedido do usuário (29/out/2026): o deslocamento, o frete, as diárias, o planejamento
  // e os adicionais vão ao PDF, pelo nome e pelas quantidades
  it('a mobilização e os adicionais vão pelo nome e pelas quantidades, sem valor', async () => {
    const comLogistica = proposta({
      logistica: [
        { tabela: 'DESLOCAMENTO', ativo: true, descricao: 'Picape 4x4', dias: 2, valor_unitario: 0, km: 920, valor_km: 1.4, total: 1288 },
        { tabela: 'FRETE', ativo: true, descricao: 'Caminhão munck', quantidade: 1, km: 460, valor_km: 6, total: 2760 },
        { tabela: 'FRETE', ativo: false, descricao: 'Carreta (desligada)', quantidade: 1, km: 460, valor_km: 9, total: 4140 },
        { tabela: 'DIARIA', ativo: true, descricao: 'Alimentação', quantidade: 4, valor_unitario: 60, total: 240 },
        // A automática zerada (sem noites) não vai
        { tabela: 'DIARIA', ativo: true, descricao: 'Pernoite', quantidade: 0, valor_unitario: 100, total: 0, automatica: 'PERNOITE' },
      ],
    });
    const textos = await desenhados(comLogistica);
    expect(textos).toContain('Mobilização e logística');
    expect(textos).toContain('Distância até o local: 460 km (920 km ida e volta).');
    expect(textos).toContain('Equipe prevista: 2 pessoas.');
    expect(textos).toContain('Pernoites previstos: 1.');
    expect(textos).toMatch(/Deslocamento \| .*Picape 4x4 \| 1 veículo · 920 km/);
    expect(textos).toMatch(/Frete \| .*Caminhão munck \| 1 viagem · 460 km por viagem/);
    expect(textos).toMatch(/Diárias \| .*Alimentação \| 4 unidades/);
    expect(textos).not.toContain('Carreta');
    expect(textos).not.toContain('| Pernoite |');
    expect(textos).toContain('Custos adicionais');
    expect(textos).toContain('ART');
    expect(textos).toMatch(/Faturamento direto \| Pago pelo cliente direto ao fornecedor.* \| .*Locação do gerador 150 kVA/);
    // O único valor continua o final
    expect(textos.match(/R\$/g)).toHaveLength(1);
    expect(textos).not.toMatch(/2\.760|240,00|60,00/);
  }, 30_000);

  // Campo vazio vale o calculado (30/out/2026): o PDF diz os dias, as noites e o interno que a conta usou
  it('os dias, as noites e o interno vazios saem do planejamento calculado', async () => {
    const calculado = { horas_dos_passos: 12, pessoas: 2, ida_e_volta_km: 920, interno_km: 92, interno_sugerido_km: 92, horas_por_trecho: 6.9, bate_volta: false, dias_sugeridos: 3, dias: 3, noites_sugeridas: 2, noites: 2, veiculos: 1, km_por_veiculo: 1012 };
    const textos = await desenhados(proposta({ dias_previstos: null, noites_fora: null, planejamento_calculado: calculado }));
    expect(textos).toContain('Deslocamento interno na obra: 92 km.');
    expect(textos).toContain('Pernoites previstos: 2.');
    expect(textos).toContain('Execução prevista em 3 dias.');
  }, 30_000);

  it('sem planejamento, logística nem adicionais: a seção não entra', async () => {
    const textos = await desenhados(proposta({ logistica: [], outros_custos: [], distancia_km: null, distancia_ida_volta_km: null, pessoas_previstas: null, noites_fora: null }));
    expect(textos).not.toMatch(/Mobilização|Custos adicionais/);
  }, 30_000);

  // A proposta de antes (BDI) também: o total, sem o custo nem o BDI
  it('a proposta de antes (BDI) desenha só o total', async () => {
    const deAntes = proposta({ conta_da_proposta: 'BDI', bdi_percentual: 30.44, total_bdi: 2909.94, total_custo: 11758.5, total_geral: 14668.44, venda: null });
    const textos = await desenhados(deAntes);
    expect(textos).toMatch(/R\$\s14\.668,44/);
    expect(textos.match(/R\$/g)).toHaveLength(1);
    expect(textos).not.toMatch(/BDI|30,44|11\.758,50/);
  }, 30_000);

  // Sem o passo a passo (29/out/2026): a capa resume os serviços dos itens
  it('a capa resume os serviços dos itens', async () => {
    const textos = await desenhados(proposta());
    expect(textos).toContain('TR-01 · Inspeção sensitiva do transformador · TR-03 · Ensaios elétricos do transformador');
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
