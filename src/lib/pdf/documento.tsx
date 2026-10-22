// src/lib/pdf/documento.tsx
import { Document, Font, Page, Path, StyleSheet, Svg, Text, View } from '@react-pdf/renderer';
import type { DocumentProps } from '@react-pdf/renderer';
import type { ComponentProps, ReactElement, ReactNode } from 'react';
import { CAIXA_DA_LOGO, TRACOS_DA_LOGO, type CorDaLogo } from '@/lib/pdf/logo-aupus';

type EstiloDaLogo = ComponentProps<typeof Svg>['style'];

/**
 * Papel timbrado da Aupus e os primitivos de documento.
 *
 * A identidade é a do PDF modelo de proposta da Aupus (SN-92, pedido do usuário): Lexend,
 * navy no texto, verde nos números de seção e na barra do rodapé, logo no
 * canto de cima, a mesma logo em marca-d'água, seções numeradas e tabelas de
 * linha fina. As medidas (margem de 51 pt, corpos, cores) saíram do PDF.
 *
 * Por que @react-pdf/renderer, e não capturar a tela: a saída é vetorial, com
 * texto selecionável e pesquisável, arquivo pequeno e nítido em qualquer zoom.
 * Rasterizar a tela (html2canvas) daria o oposto nos quatro pontos.
 *
 * Este arquivo NÃO usa Tailwind. A biblioteca tem seu próprio subconjunto de
 * flexbox e as classes do app não valem aqui — por isso os estilos são
 * declarados abaixo, e não importados do design system.
 */

/**
 * O que a fonte do PDF tem além do Windows-1252. A Lexend tem estes; a
 * Courier (só no código de verificação e no endereço, ASCII) fica no
 * Windows-1252. O teste confere a lista contra o cmap dos arquivos da fonte.
 */
export const SIMBOLOS_DA_FONTE = 'ΩΔ≤≥≠≈√∞π−';

/**
 * O resto o react-pdf apaga calado ("1,5 MΩ" saía "1,5 M" com a Helvetica, no
 * SN-62): os símbolos técnicos comuns que a fonte não tem viram texto que se
 * lê; o que sobrar vira "?", que se vê.
 */
const SIMBOLOS: Record<string, string> = {
  // O mi grego não vira o micro (U+00B5, o certo para unidade) pelo NFC
  'μ': 'µ',
  '℃': '°C',
  '℉': '°F',
  'ω': 'omega',
  'δ': 'delta',
  '→': '->',
  '←': '<-',
  'φ': 'phi',
  'θ': 'theta',
  'λ': 'lambda',
  'α': 'alfa',
  'β': 'beta',
  'Σ': 'soma ',
};

/** O Windows-1252 além do ASCII e do Latin-1 (aspas curvas, travessão, euro...) */
export const EXTRAS_DO_WINDOWS_1252 = '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ';

/** Fora do Windows-1252 e dos símbolos da fonte (e sem ser quebra de linha) */
const FORA_DA_FONTE = new RegExp(`[^\\n\\x20-\\x7e\\xa0-\\xff${EXTRAS_DO_WINDOWS_1252}${SIMBOLOS_DA_FONTE}]`, 'gu');

export const textoDoPdf = (texto: string) =>
  texto
    // O NFC também troca o sinal de ohm (U+2126) pelo ômega, que a fonte tem
    .normalize('NFC')
    // Texto colado de planilha (tab) e de Windows (CRLF): o "?" no lugar deles enfeiava tudo
    .replace(/\r/g, '')
    .replace(/\t/g, ' ')
    .replace(FORA_DA_FONTE, (c) => SIMBOLOS[c] ?? '?');

/** Todo texto de um objeto (o documento montado) passado por `textoDoPdf` */
export function textosDoPdf<T>(valor: T): T {
  if (typeof valor === 'string') return textoDoPdf(valor) as T;
  if (Array.isArray(valor)) return valor.map(textosDoPdf) as T;
  if (valor && typeof valor === 'object') {
    return Object.fromEntries(Object.entries(valor).map(([k, v]) => [k, textosDoPdf(v)])) as T;
  }
  return valor;
}

/**
 * Um arquivo de `public/` para o react-pdf. No navegador ele baixa pelo
 * endereço (só quando o PDF é gerado: a fonte não pesa no app); no Node (o
 * teste que desenha de verdade) ele abre pelo caminho do disco, e
 * "/fonts/..." lá seria a raiz do disco.
 */
export function arquivoPublico(caminho: string): string {
  const raiz = raizNoNode();
  return raiz ? `${raiz}/public${caminho}` : caminho;
}

function raizNoNode(): string | null {
  const processo = (globalThis as { process?: { cwd?: () => string; versions?: { node?: string } } }).process;
  const noNode = typeof window === 'undefined' && Boolean(processo?.versions?.node);
  return noNode && processo?.cwd ? processo.cwd() : null;
}

/** A fonte da identidade (a mesma do NexON), em arquivos estáticos: o react-pdf não lê fonte variável */
export const FONTE = 'Lexend';
Font.register({
  family: FONTE,
  fonts: [
    { src: arquivoPublico('/fonts/pdf/Lexend-Light.ttf'), fontWeight: 300 },
    { src: arquivoPublico('/fonts/pdf/Lexend-Regular.ttf'), fontWeight: 400 },
    { src: arquivoPublico('/fonts/pdf/Lexend-Medium.ttf'), fontWeight: 500 },
    { src: arquivoPublico('/fonts/pdf/Lexend-SemiBold.ttf'), fontWeight: 600 },
    { src: arquivoPublico('/fonts/pdf/Lexend-Bold.ttf'), fontWeight: 700 },
  ],
});

const PESOS = [300, 400, 500, 600, 700];

/** Todo caractere que `textoDoPdf` deixa passar, o ASCII primeiro */
export const CARACTERES_DO_PDF = [
  ...Array.from({ length: 0x7e - 0x20 + 1 }, (_, i) => String.fromCodePoint(0x20 + i)),
  ...Array.from({ length: 0xff - 0xa0 + 1 }, (_, i) => String.fromCodePoint(0xa0 + i)),
  ...EXTRAS_DO_WINDOWS_1252,
  ...SIMBOLOS_DA_FONTE,
].join('');

/** O que o react-pdf guarda de cada arquivo de fonte (o `FontSource` dele, que não exporta o tipo) */
interface FonteDoReactPdf {
  data: unknown;
  loadResultPromise: unknown;
  load(): Promise<void>;
}

/**
 * O `Font.load` que deixa tentar de novo. O react-pdf guarda a promessa da
 * carga, inclusive a que falhou: depois de uma queda de rede, todo PDF da aba
 * falhava na hora com o mesmo erro, até recarregar a página. Aqui a carga que
 * falhou é esquecida e o próximo pedido baixa de novo.
 */
export async function carregarFonte(descritor: { fontFamily: string; fontWeight: number }): Promise<FonteDoReactPdf> {
  const fonte = Font.getFont(descritor) as unknown as FonteDoReactPdf;
  if (!('loadResultPromise' in fonte)) {
    throw new Error('o react-pdf mudou por dentro e a fonte não guarda mais a carga (rever carregarFonte)');
  }
  try {
    await fonte.load();
  } catch (erro) {
    if (!fonte.data) fonte.loadResultPromise = null;
    throw erro;
  }
  return fonte;
}

/**
 * Cada peso da fonte com todos os caracteres já pedidos.
 *
 * O fontkit guarda o glifo na primeira vez que alguém o pede, com os
 * caracteres daquele pedido. Ler a forma de um glifo composto (o "ç" é o "c"
 * mais a cedilha) pede o "c" sem caractere nenhum, e daí em diante o "c" de
 * todo texto sai sem: a tabela que diz ao leitor qual letra é cada glifo
 * (ToUnicode) ganha uma entrada vazia, e o texto do PDF quebra — o total
 * copiado da proposta saía "132433415". Na tela e no papel, nada se via.
 * Pedir tudo antes, pelo layout e com o ASCII primeiro, guarda cada glifo com o
 * seu caractere.
 */
async function aquecerFonte(peso: number): Promise<void> {
  const fonte = await carregarFonte({ fontFamily: FONTE, fontWeight: peso });
  const dados = fonte.data as { layout?: (texto: string) => unknown } | null;
  // Sem o layout, o aquecimento viraria nada e o texto voltaria a quebrar calado
  if (typeof dados?.layout !== 'function') {
    throw new Error('o react-pdf mudou por dentro e a fonte carregada não tem layout (rever aquecerFonte)');
  }
  dados.layout(CARACTERES_DO_PDF);
}

let fontesProntas: Promise<void> | null = null;

/**
 * Antes de desenhar (o `baixarPdf`, e o teste que desenha): a fonte baixada e
 * aquecida. Uma vez por sessão; falhou, o erro diz o que fazer e o próximo
 * pedido tenta de novo.
 */
export function prepararFontes(): Promise<void> {
  fontesProntas ??= Promise.all(PESOS.map(aquecerFonte)).then(
    () => undefined,
    (erro: unknown) => {
      fontesProntas = null;
      const motivo = erro instanceof Error ? erro.message : String(erro);
      throw new Error(`Não foi possível baixar a fonte do PDF (${motivo}). Confira a conexão e tente de novo.`);
    },
  );
  return fontesProntas;
}

/** A logo colorida da barra do app, em vetor (ver `logo-aupus.ts`), com as cores do PNG */
const COR_DA_LOGO: Record<CorDaLogo, string> = { letra: '#181832', onda: '#76b83a', papel: '#ffffff' };

/** A cor já misturada com o branco do papel: o mesmo que `opacidade` sobre a folha */
function sobreOPapel(cor: string, opacidade: number): string {
  const canal = (i: number) => Math.round(255 - (255 - parseInt(cor.slice(i, i + 2), 16)) * opacidade);
  return `#${[1, 3, 5].map((i) => canal(i).toString(16).padStart(2, '0')).join('')}`;
}

/**
 * A marca-d'água (5%) em cores cheias, e não com transparência: a letra é
 * preenchimento mais contorno, e transparente a borda saía mais escura, como
 * letra vazada. Fica no fundo da página, então cheia ou transparente dá o mesmo.
 */
const COR_DA_MARCA_DAGUA = Object.fromEntries(
  Object.entries(COR_DA_LOGO).map(([parte, cor]) => [parte, sobreOPapel(cor, 0.05)]),
) as Record<CorDaLogo, string>;

const [, , LARGURA_DA_CAIXA, ALTURA_DA_CAIXA] = CAIXA_DA_LOGO.split(' ').map(Number);
const PROPORCAO_DA_LOGO = LARGURA_DA_CAIXA / ALTURA_DA_CAIXA;

function LogoPdf({ style, marcaDagua = false }: { style: EstiloDaLogo; marcaDagua?: boolean }) {
  const cores = marcaDagua ? COR_DA_MARCA_DAGUA : COR_DA_LOGO;
  return (
    <Svg viewBox={CAIXA_DA_LOGO} style={style} fixed>
      {TRACOS_DA_LOGO.map((traco, i) => (
        // O miter limit do SVG (10) é o padrão do PDF
        <Path
          key={i}
          d={traco.d}
          fill={traco.preenchido ? cores[traco.cor] : 'none'}
          {...(traco.contorno ? { stroke: cores[traco.cor], strokeWidth: traco.contorno } : {})}
        />
      ))}
    </Svg>
  );
}

/**
 * Sem hifenização: a do react-pdf é a do inglês ("con-ferir"), e no endereço
 * de conferência do PDF da OS o hífen entrava no que a pessoa digitaria.
 * O texto quebra nos espaços.
 */
Font.registerHyphenationCallback((palavra) => [palavra]);

/** Cores fixas: o PDF é impresso, não tem tema claro/escuro. Medidas no modelo. */
export const COR = {
  navy: '#161633',
  /** número de seção, linha de abertura, destaque no texto */
  verde: '#177a3c',
  /** barra do rodapé e marcadores */
  verdeBarra: '#6fbf4a',
  cinza: '#5a5b70',
  linha: '#d5d6de',
  painelRotulo: '#a9acc4',
  fundo: '#f4f5f8',
  branco: '#ffffff',
};

const MARGEM = 51;
const CORPO = 10;

export const estilos = StyleSheet.create({
  /**
   * Sem `lineHeight` aqui: herdado pelo rodapé fixo (o texto com `render`), o
   * react-pdf o jogava milhares de pontos acima da página — o rodapé sumia de
   * toda página, calado. O espaçamento do modelo vai em `paragrafo`.
   */
  pagina: {
    paddingTop: 92,
    paddingBottom: 80,
    paddingHorizontal: MARGEM,
    fontFamily: FONTE,
    fontWeight: 400,
    fontSize: CORPO,
    color: COR.navy,
  },
  // O tamanho junto: o react-pdf resolve o lineHeight sem unidade pelo fontSize do próprio
  // elemento, e sem ele usa 18 (o padrão) — o parágrafo saía com 26 pt entre as linhas
  paragrafo: { fontSize: CORPO, lineHeight: 1.45 },
  paginaDaCapa: { paddingTop: 0, paddingBottom: 0 },

  logo: { position: 'absolute', top: 28, right: 45, height: 42, width: 42 * PROPORCAO_DA_LOGO },
  logoDaCapa: { position: 'absolute', top: 45, right: 45, height: 82, width: 82 * PROPORCAO_DA_LOGO },
  // Os 5% do modelo já estão nas cores (`COR_DA_MARCA_DAGUA`)
  marcaDagua: { position: 'absolute', left: 64, top: 315, width: 467, height: 467 / PROPORCAO_DA_LOGO },

  barra: { position: 'absolute', left: MARGEM, right: MARGEM, bottom: 45, height: 3, flexDirection: 'row' },
  rodape: {
    position: 'absolute',
    left: MARGEM,
    right: MARGEM,
    bottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7.5,
    color: COR.cinza,
  },
  rodapeReferencia: { fontWeight: 600, color: COR.navy },

  // Capa e abertura
  aberturaTipo: { fontSize: 9, fontWeight: 600, color: COR.verde, letterSpacing: 2.6, textTransform: 'uppercase' },
  capaTitulo: { fontSize: 30, lineHeight: 1.18, marginTop: 14 },
  aberturaTitulo: { fontSize: 20, lineHeight: 1.25, marginTop: 8 },
  capaSubtitulo: { fontSize: 12.5, color: COR.cinza, marginTop: 10 },
  aberturaSubtitulo: { fontSize: 10, color: COR.cinza, marginTop: 6 },
  campos: { marginTop: 26, borderTopWidth: 0.8, borderTopColor: COR.linha },
  campo: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 0.8, borderBottomColor: COR.linha, minHeight: 35, paddingVertical: 6 },
  campoMenor: { minHeight: 28, paddingVertical: 5 },
  campoRotulo: { width: 119, fontSize: 8.5, fontWeight: 300, color: COR.cinza, letterSpacing: 1.6, textTransform: 'uppercase' },
  campoValor: { flex: 1, fontSize: 11 },
  campoValorMenor: { fontSize: 10 },
  slogan: { position: 'absolute', left: MARGEM, bottom: 92, flexDirection: 'row', alignItems: 'center' },
  sloganBarra: { width: 2.2, height: 20, backgroundColor: COR.verdeBarra, marginRight: 14 },
  sloganTexto: { fontSize: 11 },

  // Seções
  secao: { marginTop: 22 },
  secaoCabecalho: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 12 },
  secaoNumero: { width: 26, fontSize: 11, fontWeight: 600, color: COR.verde, letterSpacing: 1 },
  // flex: o título longo quebra a linha em vez de passar da margem
  secaoTitulo: { flex: 1, fontSize: 12.5, fontWeight: 600, letterSpacing: 1.4, textTransform: 'uppercase' },
  subtitulo: { fontSize: 10, fontWeight: 600, marginTop: 8, marginBottom: 4 },
  fraco: { fontSize: 8.5, color: COR.cinza },

  // Tabela
  tabelaCabecalho: { flexDirection: 'row', borderBottomWidth: 0.8, borderBottomColor: COR.navy, paddingBottom: 7 },
  tabelaRotulo: { fontSize: 7.8, fontWeight: 500, color: COR.cinza, letterSpacing: 1, textTransform: 'uppercase' },
  tabelaLinha: { flexDirection: 'row', borderBottomWidth: 0.8, borderBottomColor: COR.linha, paddingVertical: 7 },
  celula: { paddingHorizontal: 6, fontSize: 9.2, lineHeight: 1.4 },
  celulaForte: { fontWeight: 500 },
  celulaDetalhe: { fontSize: 8.5, color: COR.cinza, marginTop: 1 },

  // Totais
  totalLinha: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 6, paddingVertical: 6, borderBottomWidth: 0.8, borderBottomColor: COR.linha },
  totalRotulo: { fontSize: 9.2, color: COR.cinza },
  totalValor: { fontSize: 9.2 },
  totalFinal: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 6, paddingTop: 10 },
  totalFinalTexto: { fontSize: 11, fontWeight: 700 },

  // Pares (rótulo e valor em grade)
  pares: { flexDirection: 'row', flexWrap: 'wrap', borderTopWidth: 0.8, borderTopColor: COR.linha },
  par: { borderBottomWidth: 0.8, borderBottomColor: COR.linha, paddingVertical: 6, paddingRight: 12 },
  parRotulo: { fontSize: 7.5, fontWeight: 300, color: COR.cinza, letterSpacing: 1.2, textTransform: 'uppercase' },
  parValor: { fontSize: 9.5, marginTop: 2 },

  // Painel de destaque
  painel: { backgroundColor: COR.navy, borderRadius: 6, paddingHorizontal: 20, paddingVertical: 18, marginTop: 4 },
  painelLinha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  painelRotulo: { fontSize: 9, color: COR.painelRotulo, letterSpacing: 1.6, textTransform: 'uppercase', flex: 1, paddingRight: 12 },
  painelValor: { fontSize: 20, fontWeight: 600, color: COR.branco },
  painelSufixo: { fontSize: 10, color: COR.painelRotulo },

  // Lista
  item: { flexDirection: 'row', marginBottom: 5 },
  marcador: { width: 5.5, height: 5.5, borderRadius: 2.75, backgroundColor: COR.verdeBarra, marginTop: 4.2, marginRight: 9 },
  numeroDoItem: { width: 18, color: COR.verde, fontWeight: 600 },

  aviso: { backgroundColor: COR.fundo, borderLeftWidth: 2.2, borderLeftColor: COR.verdeBarra, paddingVertical: 8, paddingHorizontal: 12, fontSize: 9 },
});

/** A barra do rodapé do modelo: traços que crescem e a linha até a margem */
const TRACOS: Array<[number, number]> = [[2, 3], [2, 3], [3, 3], [4, 2], [5, 3], [7, 2]];

function Barra() {
  return (
    <View style={estilos.barra} fixed>
      {TRACOS.map(([largura, espaco], i) => (
        <View key={i} style={{ width: largura, marginRight: espaco, backgroundColor: COR.verdeBarra }} />
      ))}
      <View style={{ flex: 1, backgroundColor: COR.verdeBarra }} />
    </View>
  );
}

export interface RodapePdf {
  /** Em negrito: o número do documento */
  referencia: string;
  /** Em cinza, depois de um ponto: o código, o cliente */
  detalhe?: string;
}

/** O que se repete em toda página: marca-d'água, logo, barra, referência e "n / total" */
function Timbrado({ rodape, capa = false }: { rodape: RodapePdf; capa?: boolean }) {
  return (
    <>
      <LogoPdf style={estilos.marcaDagua} marcaDagua />
      <LogoPdf style={capa ? estilos.logoDaCapa : estilos.logo} />
      <Barra />
      <View style={estilos.rodape} fixed>
        <Text>
          <Text style={estilos.rodapeReferencia}>{rodape.referencia}</Text>
          {rodape.detalhe ? ` · ${rodape.detalhe}` : ''}
        </Text>
        {/* Só o react-pdf sabe quantas páginas o conteúdo gerou: calcular por fora renderizaria duas vezes */}
        <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
      </View>
    </>
  );
}

export interface AberturaPdf {
  /** A linha de cima, em verde espaçado: "Proposta comercial", "Ordem de serviço" */
  tipo: string;
  titulo: string;
  subtitulo?: string;
  /** Rótulo e valor, em linhas finas (cliente, referência, data) */
  campos: Array<[string, string]>;
}

function Campos({ campos, menor }: { campos: Array<[string, string]>; menor?: boolean }) {
  return (
    <View style={estilos.campos}>
      {campos.map(([rotulo, valor]) => (
        <View key={rotulo} style={menor ? [estilos.campo, estilos.campoMenor] : estilos.campo} wrap={false}>
          <Text style={estilos.campoRotulo}>{rotulo}</Text>
          <Text style={menor ? [estilos.campoValor, estilos.campoValorMenor] : estilos.campoValor}>{valor}</Text>
        </View>
      ))}
    </View>
  );
}

/** A capa: uma página só dela, como a do modelo */
function Capa({ abertura }: { abertura: AberturaPdf }) {
  return (
    <View style={{ paddingTop: 232 }}>
      <Text style={estilos.aberturaTipo}>{abertura.tipo}</Text>
      <Text style={estilos.capaTitulo}>{abertura.titulo}</Text>
      {abertura.subtitulo && <Text style={estilos.capaSubtitulo}>{abertura.subtitulo}</Text>}
      <Campos campos={abertura.campos} />
    </View>
  );
}

/** A mesma abertura no alto da primeira página, menor, quando o documento não leva capa */
function Abertura({ abertura }: { abertura: AberturaPdf }) {
  return (
    <View style={{ marginBottom: 4 }}>
      <Text style={estilos.aberturaTipo}>{abertura.tipo}</Text>
      <Text style={estilos.aberturaTitulo}>{abertura.titulo}</Text>
      {abertura.subtitulo && <Text style={estilos.aberturaSubtitulo}>{abertura.subtitulo}</Text>}
      {abertura.campos.length > 0 && (
        <View style={{ marginTop: -8 }}>
          <Campos campos={abertura.campos} menor />
        </View>
      )}
    </View>
  );
}

interface DocumentoAupusProps {
  /** O título nos metadados do arquivo */
  titulo: string;
  abertura: AberturaPdf;
  /**
   * Capa numa página própria (a proposta, como o modelo). Sem ela, a abertura
   * vai no alto da primeira página: no relatório da OS, uma página a mais em
   * toda OS não se paga.
   */
  comCapa?: boolean;
  rodape: RodapePdf;
  children: ReactNode;
}

export function DocumentoAupus({ titulo, abertura, comCapa = false, rodape, children }: DocumentoAupusProps) {
  return (
    <Document title={titulo} author="Aupus Energia" creator="Aupus Service" producer="Aupus Service">
      {comCapa && (
        <Page size="A4" style={[estilos.pagina, estilos.paginaDaCapa]}>
          <Timbrado rodape={rodape} capa />
          <Capa abertura={abertura} />
          <View style={estilos.slogan}>
            <View style={estilos.sloganBarra} />
            <Text style={estilos.sloganTexto}>Interligando você com o futuro!</Text>
          </View>
        </Page>
      )}
      <Page size="A4" style={estilos.pagina}>
        <Timbrado rodape={rodape} />
        {!comCapa && <Abertura abertura={abertura} />}
        {children}
      </Page>
    </Document>
  );
}

/**
 * Um View vazio, que não ocupa nada, na frente do conteúdo que começa por um
 * bloco inteiro (`wrap={false}`), dentro de um View sem estilo.
 *
 * Quando nenhum filho de um nó cabe no resto da página, o react-pdf passa o nó
 * para a próxima — menos se nada veio antes dele na lista do pai: aí entende
 * que a página está vazia (mover não adiantaria) e deixa o nó inteiro onde
 * está. Num nó aninhado a página não está vazia, e o conteúdo ficava nela:
 * desenhado abaixo da folha (23 de 30 linhas da tabela, 6 de 8 fotos) ou
 * espremido para caber, texto sobre texto, sem aviso (SN-92). Com a âncora
 * antes, o bloco que não cabe vai para a próxima página.
 * `secao-no-pe-da-pagina.test.tsx` varre a faixa em que acontecia.
 */
const Ancora = () => <View />;

/**
 * Seção numerada ("01  OBJETIVO"). O cabeçalho não fica sozinho no pé da
 * página: ele vai num bloco inteiro com uma reserva invisível do tamanho do
 * começo do conteúdo, e sem lugar para os dois o bloco passa para a próxima;
 * o conteúdo sobe por cima da reserva (margem negativa nele, e não na
 * reserva, que aí não contaria na altura do bloco). O `minPresenceAhead` do
 * react-pdf não segurava dentro do timbrado. `reserva` maior para o conteúdo
 * que começa grande (a foto). O conteúdo que começa maior que a reserva vai
 * para a próxima página e o cabeçalho fica — feio, mas nada se perde (`Ancora`).
 */
export function SecaoPdf({ numero, titulo, reserva = 80, children }: { numero: number; titulo: string; reserva?: number; children: ReactNode }) {
  return (
    <View style={estilos.secao}>
      <View wrap={false}>
        <View style={estilos.secaoCabecalho}>
          <Text style={estilos.secaoNumero}>{String(numero).padStart(2, '0')}</Text>
          <Text style={estilos.secaoTitulo}>{titulo}</Text>
        </View>
        <View style={{ height: reserva }} />
      </View>
      <View style={{ marginTop: -reserva }}>
        <Ancora />
        {children}
      </View>
    </View>
  );
}

export interface ColunaPdf {
  titulo: string;
  /** Fração ("40%") ou pontos */
  largura: string | number;
  alinhar?: 'right';
}

/** Uma célula: o texto, e às vezes uma segunda linha em cinza */
export type CelulaPdf = string | { texto: string; detalhe?: string };

/**
 * A tabela do modelo: rótulos em caixa alta cinza, linha navy debaixo do
 * cabeçalho, linhas finas entre as linhas. A primeira coluna vai em peso
 * médio (é o nome da linha). Uma linha não se parte entre duas páginas.
 */
export function TabelaPdf({ colunas, linhas }: { colunas: ColunaPdf[]; linhas: CelulaPdf[][] }) {
  const estiloDa = (coluna: ColunaPdf) => ({ width: coluna.largura, textAlign: coluna.alinhar ?? ('left' as const) });
  const Linha = ({ linha }: { linha: CelulaPdf[] }) => (
    <View style={estilos.tabelaLinha} wrap={false}>
      {linha.map((celula, j) => {
        const { texto, detalhe } = typeof celula === 'string' ? { texto: celula, detalhe: undefined } : celula;
        return (
          <View key={j} style={[estilos.celula, estiloDa(colunas[j])]}>
            <Text style={j === 0 ? estilos.celulaForte : undefined}>{texto}</Text>
            {detalhe ? <Text style={estilos.celulaDetalhe}>{detalhe}</Text> : null}
          </View>
        );
      })}
    </View>
  );
  const [primeira, ...resto] = linhas;
  return (
    <View>
      <Ancora />
      {/* O cabeçalho vai junto da primeira linha: sozinho no pé da página, não diz nada */}
      <View wrap={false}>
        <View style={estilos.tabelaCabecalho}>
          {colunas.map((coluna) => (
            <Text key={coluna.titulo} style={[estilos.celula, estilos.tabelaRotulo, estiloDa(coluna)]}>
              {coluna.titulo}
            </Text>
          ))}
        </View>
        {primeira && <Linha linha={primeira} />}
      </View>
      {resto.map((linha, i) => (
        <Linha key={i} linha={linha} />
      ))}
    </View>
  );
}

/** As parcelas (cinza, linha fina) e, se houver, o total em negrito, como o "Total" do modelo */
export function TotaisPdf({ parcelas, total }: { parcelas: Array<[string, string]>; total?: [string, string] }) {
  return (
    <View wrap={false}>
      {parcelas.map(([rotulo, valor]) => (
        <View key={rotulo} style={estilos.totalLinha}>
          <Text style={estilos.totalRotulo}>{rotulo}</Text>
          <Text style={estilos.totalValor}>{valor}</Text>
        </View>
      ))}
      {total && (
        <View style={estilos.totalFinal}>
          <Text style={estilos.totalFinalTexto}>{total[0]}</Text>
          <Text style={estilos.totalFinalTexto}>{total[1]}</Text>
        </View>
      )}
    </View>
  );
}

/** Rótulo e valor em grade (duas colunas por padrão), cada par com a linha fina */
export function ParesPdf({ itens, colunas = 2 }: { itens: Array<[string, string]>; colunas?: number }) {
  return (
    // A âncora fora da grade: dentro, a linha de cima ficaria sozinha no pé da página
    <View>
      <Ancora />
      <View style={estilos.pares}>
        {itens.map(([rotulo, valor]) => (
          <View key={rotulo} style={[estilos.par, { width: `${100 / colunas}%` }]} wrap={false}>
            <Text style={estilos.parRotulo}>{rotulo}</Text>
            <Text style={estilos.parValor}>{valor}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/** O painel navy do valor que importa (a mensalidade, no modelo) */
export function PainelPdf({ rotulo, valor, sufixo, children }: { rotulo: string; valor?: string; sufixo?: string; children?: ReactNode }) {
  return (
    <View style={estilos.painel} wrap={false}>
      <View style={estilos.painelLinha}>
        <Text style={estilos.painelRotulo}>{rotulo}</Text>
        {valor && (
          <Text style={estilos.painelValor}>
            {valor}
            {sufixo ? <Text style={estilos.painelSufixo}>{`  ${sufixo}`}</Text> : null}
          </Text>
        )}
      </View>
      {children}
    </View>
  );
}

/** Lista com o marcador verde do modelo, ou numerada (o número em verde) */
export function ListaPdf({ itens, numerada }: { itens: Array<{ texto: string; detalhe?: string }>; numerada?: boolean }) {
  return (
    <View>
      <Ancora />
      {itens.map((item, i) => (
        <View key={i} style={estilos.item} wrap={false}>
          {numerada ? <Text style={estilos.numeroDoItem}>{i + 1}</Text> : <View style={estilos.marcador} />}
          <Text style={[{ flex: 1 }, estilos.paragrafo]}>{item.texto}</Text>
          {item.detalhe ? <Text style={[estilos.fraco, { marginLeft: 12 }]}>{item.detalhe}</Text> : null}
        </View>
      ))}
    </View>
  );
}

/** Aviso no alto do documento (a prévia, o que ficou de fora) */
export function AvisoPdf({ children }: { children: ReactNode }) {
  return (
    <View style={[estilos.aviso, { marginTop: 16 }]} wrap={false}>
      <Text style={[estilos.paragrafo, { fontSize: 9 }]}>{children}</Text>
    </View>
  );
}

/**
 * Baixa o PDF já renderizado.
 *
 * O download vive aqui e não em cada documento: revogar a URL do blob depois é
 * fácil de esquecer, e cada esquecimento segura o arquivo inteiro na memória
 * até a aba fechar.
 */
export async function baixarPdf(
  elemento: ReactElement<DocumentProps>,
  nomeArquivo: string,
) {
  const { pdf } = await import('@react-pdf/renderer');
  await prepararFontes();
  const blob = await pdf(elemento).toBlob();
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo.endsWith('.pdf') ? nomeArquivo : `${nomeArquivo}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}
