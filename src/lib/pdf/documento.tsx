// src/lib/pdf/documento.tsx
import { Document, Font, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import type { DocumentProps } from '@react-pdf/renderer';
import type { ReactElement, ReactNode } from 'react';

/**
 * Papel timbrado da Aupus e os primitivos de documento.
 *
 * Base compartilhada: a proposta comercial é o primeiro documento a usar isto,
 * e os próximos herdam o cabeçalho, o rodapé e a numeração de página de graça.
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
 * A Helvetica do PDF só tem os caracteres do Windows-1252 (o latim de sempre,
 * com acentos, °, ², µ, ±). O resto o react-pdf apaga calado: "1,5 MΩ" saía
 * "1,5 M" no PDF da OS (SN-62). Os símbolos técnicos comuns viram texto que se
 * lê; o que sobrar vira "?", que se vê.
 */
const SIMBOLOS: Record<string, string> = {
  // Um só: o NFC já troca o sinal de ohm (U+2126) pelo ômega
  'Ω': 'ohm',
  // O mi grego não vira o micro (U+00B5, que a fonte tem) pelo NFC
  'μ': 'µ',
  '℃': '°C',
  '℉': '°F',
  'ω': 'omega',
  'Δ': 'delta ',
  'δ': 'delta',
  '≤': '<=',
  '≥': '>=',
  '≠': '!=',
  '≈': '~',
  '√': 'raiz ',
  '∞': 'infinito',
  '→': '->',
  '←': '<-',
  'π': 'pi',
  'φ': 'phi',
  'θ': 'theta',
  'λ': 'lambda',
  'α': 'alfa',
  'β': 'beta',
  'Σ': 'soma ',
  '−': '-',
};

/** Fora do Windows-1252 (e sem ser quebra de linha) */
const FORA_DA_FONTE = /[^\n\x20-\x7e\xa0-\xff€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ]/gu;

export const textoDoPdf = (texto: string) =>
  texto
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
 * Sem hifenização: a do react-pdf é a do inglês ("con-ferir"), e no endereço
 * de conferência do PDF da OS o hífen entrava no que a pessoa digitaria.
 * O texto quebra nos espaços.
 */
Font.registerHyphenationCallback((palavra) => [palavra]);

/** Cores fixas: o PDF é impresso, não tem tema claro/escuro. */
const COR = {
  texto: '#1a1a1a',
  suave: '#6b7280',
  linha: '#d1d5db',
  faixa: '#f3f4f6',
};

export const estilos = StyleSheet.create({
  pagina: {
    paddingTop: 40,
    paddingBottom: 56,
    paddingHorizontal: 44,
    fontSize: 9,
    color: COR.texto,
    fontFamily: 'Helvetica',
  },

  cabecalho: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: COR.linha,
    paddingBottom: 10,
    marginBottom: 16,
  },
  marca: { fontSize: 15, fontFamily: 'Helvetica-Bold' },
  marcaLinha: { fontSize: 8, color: COR.suave, marginTop: 2 },
  cabecalhoDireita: { alignItems: 'flex-end' },
  documentoTipo: { fontSize: 11, fontFamily: 'Helvetica-Bold' },
  documentoMeta: { fontSize: 8, color: COR.suave, marginTop: 2 },

  secaoTitulo: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    marginTop: 14,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: COR.suave,
  },

  linhaTabela: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: COR.linha,
    paddingVertical: 4,
  },
  cabecalhoTabela: {
    flexDirection: 'row',
    backgroundColor: COR.faixa,
    paddingVertical: 4,
    paddingHorizontal: 2,
    fontFamily: 'Helvetica-Bold',
  },

  totalLinha: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: 2,
  },
  totalRotulo: { width: 120, textAlign: 'right', color: COR.suave },
  totalValor: { width: 90, textAlign: 'right' },
  totalDestaque: { fontFamily: 'Helvetica-Bold', fontSize: 11 },

  rodape: {
    position: 'absolute',
    bottom: 24,
    left: 44,
    right: 44,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: COR.linha,
    paddingTop: 6,
    fontSize: 7,
    color: COR.suave,
  },
});

interface DocumentoAupusProps {
  /** "Proposta comercial", "Relatório de manutenção"... */
  tipo: string;
  /** Número, data — o que identifica este documento. */
  meta?: string[];
  /** Texto do rodapé de toda página, ao lado da marca (o código de verificação da OS) */
  rodape?: string;
  children: ReactNode;
}

/**
 * Uma página com o timbrado.
 *
 * A numeração usa `render` do próprio react-pdf porque só ele sabe quantas
 * páginas o conteúdo gerou — calcular por fora exigiria renderizar duas vezes.
 */
export function DocumentoAupus({ tipo, meta = [], rodape, children }: DocumentoAupusProps) {
  return (
    <Document>
      <Page size="A4" style={estilos.pagina}>
        <View style={estilos.cabecalho} fixed>
          <View>
            <Text style={estilos.marca}>Aupus Energia</Text>
            <Text style={estilos.marcaLinha}>Manutenção e serviços</Text>
          </View>
          <View style={estilos.cabecalhoDireita}>
            <Text style={estilos.documentoTipo}>{tipo}</Text>
            {meta.map((linha) => (
              <Text key={linha} style={estilos.documentoMeta}>
                {linha}
              </Text>
            ))}
          </View>
        </View>

        {children}

        <View style={estilos.rodape} fixed>
          <Text>{rodape ? `Aupus Energia · ${rodape}` : 'Aupus Energia'}</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

/** Título de seção, no mesmo tom em todos os documentos. */
export function SecaoPdf({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <View>
      <Text style={estilos.secaoTitulo}>{titulo}</Text>
      {children}
    </View>
  );
}

/** Linha de total, alinhada à direita. */
export function TotalPdf({
  rotulo,
  valor,
  destaque,
}: {
  rotulo: string;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <View style={estilos.totalLinha}>
      <Text style={[estilos.totalRotulo, ...(destaque ? [estilos.totalDestaque] : [])]}>
        {rotulo}
      </Text>
      <Text style={[estilos.totalValor, ...(destaque ? [estilos.totalDestaque] : [])]}>
        {valor}
      </Text>
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
