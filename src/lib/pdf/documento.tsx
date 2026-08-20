// src/lib/pdf/documento.tsx
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
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
  children: ReactNode;
}

/**
 * Uma página com o timbrado.
 *
 * A numeração usa `render` do próprio react-pdf porque só ele sabe quantas
 * páginas o conteúdo gerou — calcular por fora exigiria renderizar duas vezes.
 */
export function DocumentoAupus({ tipo, meta = [], children }: DocumentoAupusProps) {
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
          <Text>Aupus Energia</Text>
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
