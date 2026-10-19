// src/lib/pdf/etiqueta-de-equipamento.tsx
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { baixarPdf, textosDoPdf } from '@/lib/pdf/documento';
import { QrCode } from '@/lib/pdf/qr-code';

/**
 * A etiqueta do equipamento (SN-67): o QR abre o cadastro dele no celular de
 * quem está em campo, e o texto diz o que é sem precisar ler o QR.
 *
 * Dois formatos, porque as duas impressoras existem:
 * - `etiqueta`: uma por página, 100 × 65 mm — impressora de etiquetas;
 * - `a4`: 8 por folha (2 × 4), com linha de corte — impressora comum, papel
 *   adesivo ou para recortar.
 */
export type FormatoDaEtiqueta = 'etiqueta' | 'a4';

export interface EtiquetaDoEquipamento {
  /** O endereço que o QR abre */
  url: string;
  nome: string;
  tag: string | null;
  /** "Planta · Unidade" */
  lugar: string | null;
  /** "4 · Alta" */
  criticidade: string | null;
}

const MM = 72 / 25.4;
const LARGURA = 100 * MM;
const ALTURA = 65 * MM;
const QR = 44 * MM;
const POR_FOLHA = 8;

const estilos = StyleSheet.create({
  etiqueta: {
    width: LARGURA,
    height: ALTURA,
    padding: 4 * MM,
    flexDirection: 'row',
    alignItems: 'center',
    fontFamily: 'Helvetica',
    color: '#111111',
  },
  corte: { borderWidth: 0.5, borderColor: '#bbbbbb', borderStyle: 'dashed' },
  texto: { flex: 1, marginLeft: 3 * MM, justifyContent: 'center' },
  tag: { fontFamily: 'Helvetica-Bold', fontSize: 15, marginBottom: 2 },
  nome: { fontSize: 10, marginBottom: 3 },
  linha: { fontSize: 8, color: '#444444', marginBottom: 1.5 },
  rodape: { fontSize: 6.5, color: '#666666', marginTop: 3 },
  folha: { paddingVertical: 18.5 * MM, paddingHorizontal: 5 * MM, flexDirection: 'row', flexWrap: 'wrap' },
});

function Etiqueta({ etiqueta, comCorte }: { etiqueta: EtiquetaDoEquipamento; comCorte: boolean }) {
  return (
    <View style={comCorte ? [estilos.etiqueta, estilos.corte] : estilos.etiqueta} wrap={false}>
      <QrCode texto={etiqueta.url} tamanho={QR} />
      <View style={estilos.texto}>
        {/* O título é a TAG, que é o que se procura em campo; sem ela, o nome */}
        <Text style={estilos.tag}>{etiqueta.tag ?? etiqueta.nome}</Text>
        {etiqueta.tag && <Text style={estilos.nome}>{etiqueta.nome}</Text>}
        {etiqueta.lugar && <Text style={estilos.linha}>{etiqueta.lugar}</Text>}
        {etiqueta.criticidade && <Text style={estilos.linha}>Criticidade {etiqueta.criticidade}</Text>}
        <Text style={estilos.rodape}>Aponte a câmera para abrir o cadastro</Text>
      </View>
    </View>
  );
}

const emFolhas = <T,>(itens: T[]) =>
  Array.from({ length: Math.ceil(itens.length / POR_FOLHA) }, (_, i) => itens.slice(i * POR_FOLHA, (i + 1) * POR_FOLHA));

export function pdfDasEtiquetas(etiquetas: EtiquetaDoEquipamento[], formato: FormatoDaEtiqueta) {
  // A fonte do PDF só tem o Windows-1252: o resto sumiria calado
  const prontas = textosDoPdf(etiquetas);
  return (
    <Document title="Etiquetas de equipamentos" author="Aupus Service">
      {formato === 'etiqueta'
        ? prontas.map((etiqueta, i) => (
            <Page key={i} size={[LARGURA, ALTURA]}>
              <Etiqueta etiqueta={etiqueta} comCorte={false} />
            </Page>
          ))
        : emFolhas(prontas).map((folha, i) => (
            <Page key={i} size="A4" style={estilos.folha}>
              {folha.map((etiqueta, j) => (
                <Etiqueta key={j} etiqueta={etiqueta} comCorte />
              ))}
            </Page>
          ))}
    </Document>
  );
}

export async function baixarEtiquetas(etiquetas: EtiquetaDoEquipamento[], formato: FormatoDaEtiqueta, nomeDoArquivo: string) {
  await baixarPdf(pdfDasEtiquetas(etiquetas, formato), nomeDoArquivo);
}
