// @vitest-environment node
import type { ReactNode } from 'react';
import { Text, View } from '@react-pdf/renderer';
import { beforeAll, describe, expect, it } from 'vitest';
import { textosDesenhados, type TextoDesenhado } from '@/test-utils/pdf';
import { DocumentoAupus, ListaPdf, ParesPdf, SecaoPdf, TabelaPdf, prepararFontes } from './documento';

/**
 * A seção perto do pé da página não perde conteúdo (SN-92).
 *
 * O react-pdf deixa na página o nó cujos filhos foram todos para a próxima
 * quando ele é o primeiro da lista dele (ele lê "primeiro da lista" como
 * "página vazia"). Com a reserva da `SecaoPdf`, o conteúdo ia em primeiro num
 * bloco próprio: quando o cabeçalho caía numa faixa de uns 7 a 20 pt perto do
 * pé e o primeiro bloco inteiro do conteúdo não cabia, o conteúdo todo ficava
 * na página e era desenhado abaixo da folha (23 de 30 linhas de uma tabela, 6
 * de 8 fotos) ou espremido nela, texto sobre texto — sem aviso. A varredura
 * move a seção de 4 em 4 pt por essa faixa.
 */

/** A4 menos a margem de baixo da página do timbrado */
const FIM_DA_AREA = 842 - 80;

const desenhar = (conteudo: ReactNode) =>
  textosDesenhados(
    DocumentoAupus({
      titulo: 'teste',
      abertura: { tipo: 'Teste', titulo: 'Seção no pé da página', campos: [] },
      rodape: { referencia: 'T-1' },
      children: conteudo,
    }),
  );

const LONGO = 'Observação longa do técnico sobre o estado do equipamento, que quebra em várias linhas na coluna estreita';
/** Mais alto que a reserva padrão (80 pt) em qualquer largura de coluna daqui */
const LONGUISSIMO = Array.from({ length: 6 }, () => LONGO).join(' ');
const N = 12;
const marcas = Array.from({ length: N }, (_, i) => `MARCA${i}`);

const tabela = () => (
  <TabelaPdf
    colunas={[
      { titulo: 'Tarefa', largura: '40%' },
      { titulo: 'Situação', largura: '14%' },
      { titulo: 'Por / em', largura: '22%' },
      { titulo: 'Observação', largura: '24%' },
    ]}
    linhas={marcas.map((marca, i) => [marca, 'Feita', 'Ana', i === 0 ? LONGO : ''])}
  />
);

/** Cada conteúdo começa com um bloco inteiro mais alto que a reserva */
const CONTEUDOS: Array<{ nome: string; reserva?: number; conteudo: () => ReactNode }> = [
  { nome: 'tabela direto na seção', conteudo: tabela },
  // A "Equipe e horas" da OS: a tabela dentro de um View, dois níveis abaixo da seção
  {
    nome: 'tabela dentro de um View',
    conteudo: () => (
      <View>
        {tabela()}
        <Text>total</Text>
      </View>
    ),
  },
  {
    nome: 'lista dentro de um View',
    conteudo: () => (
      <View>
        <ListaPdf itens={marcas.map((marca, i) => ({ texto: i === 0 ? `${marca} ${LONGUISSIMO}` : marca }))} />
      </View>
    ),
  },
  {
    nome: 'pares dentro de um View',
    conteudo: () => (
      <View>
        <ParesPdf colunas={1} itens={marcas.map((marca, i) => [marca, i === 0 ? LONGUISSIMO : 'curto'])} />
      </View>
    ),
  },
  // As fotos da OS: blocos inteiros mais altos que a reserva de 250
  {
    nome: 'blocos de foto',
    reserva: 250,
    conteudo: () => (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {marcas.slice(0, 6).map((marca) => (
          <View key={marca} style={{ width: '50%', height: 268 }} wrap={false}>
            <Text>{marca}</Text>
          </View>
        ))}
      </View>
    ),
  },
];

const daMarca = (desenhados: TextoDesenhado[], marca: string) =>
  desenhados.filter((t) => t.texto === marca || t.texto.startsWith(`${marca} `));

describe('seção perto do pé da página', () => {
  beforeAll(() => prepararFontes(), 30_000);

  it.each(CONTEUDOS)('$nome: nada fica abaixo da área, espremido nem some', async ({ reserva, conteudo }) => {
    const esperadas = reserva === 250 ? marcas.slice(0, 6) : marcas;
    const comEnchimento = (enchimento: number) =>
      desenhar([
        <View key="enchimento" style={{ height: enchimento }} />,
        <SecaoPdf key="secao" numero={1} titulo="Seção" reserva={reserva}>
          {conteudo()}
        </SecaoPdf>,
      ]);
    // A altura de cada bloco com a seção no alto da página. Mantido na página, o conteúdo
    // também saía espremido para caber (a lista: 7 linhas numa caixa de 15 pt, texto sobre texto)
    const noAlto = await comEnchimento(0);
    const altura = new Map(esperadas.map((marca) => [marca, daMarca(noAlto, marca)[0]?.altura]));
    expect([...altura.values()].every((a) => a && a > 5)).toBe(true);

    const perdidas: string[] = [];
    // A seção começa entre ~440 e ~720 pt: o cabeçalho passa pela faixa em que o bug aparecia
    for (let enchimento = 280; enchimento <= 560; enchimento += 4) {
      const desenhados = await comEnchimento(enchimento);
      for (const marca of esperadas) {
        const vezes = daMarca(desenhados, marca);
        const [unica] = vezes;
        let defeito = '';
        if (vezes.length !== 1) defeito = `desenhada ${vezes.length} vezes`;
        else if (unica.fim > FIM_DA_AREA + 0.5) defeito = `abaixo da área (y ${unica.fim.toFixed(0)}, página ${unica.pagina})`;
        else if (Math.abs(unica.altura - altura.get(marca)!) > 1) defeito = `espremida (${unica.altura.toFixed(0)} pt em vez de ${altura.get(marca)!.toFixed(0)})`;
        if (defeito) perdidas.push(`enchimento ${enchimento}: ${marca} ${defeito}`);
      }
    }
    expect(perdidas.slice(0, 5)).toEqual([]);
  }, 120_000);
});
