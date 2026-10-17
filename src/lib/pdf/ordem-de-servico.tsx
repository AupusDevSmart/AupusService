// src/lib/pdf/ordem-de-servico.tsx
import { Image, StyleSheet, Text, View } from '@react-pdf/renderer';
import type { DocumentoDaOS, Par } from '@/features/execucao-os/utils/documento-da-os';
import { DocumentoAupus, SecaoPdf, baixarPdf, estilos, textosDoPdf } from './documento';

/**
 * O PDF da OS (SN-62) no papel timbrado. Só desenha: o texto chega pronto de
 * `documentoDaOS`, montado do conteúdo que a API gravou na finalização — o que
 * o código de verificação prova.
 */

const COR_SUAVE = '#6b7280';

const local = StyleSheet.create({
  titulo: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  aviso: { borderWidth: 0.5, borderColor: '#d1d5db', padding: 6, marginBottom: 8, fontSize: 8.5 },
  pares: { flexDirection: 'row', flexWrap: 'wrap' },
  par: { width: '50%', flexDirection: 'row', paddingVertical: 2, paddingRight: 8 },
  rotulo: { width: 96, color: COR_SUAVE },
  valor: { flex: 1 },
  textoBloco: { marginBottom: 6, lineHeight: 1.35 },
  subtitulo: { fontFamily: 'Helvetica-Bold', marginTop: 6, marginBottom: 2 },
  celula: { paddingHorizontal: 2 },
  fraco: { color: COR_SUAVE, fontSize: 7.5 },
  fotos: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  foto: { width: '50%', padding: 4 },
  imagem: { width: '100%', objectFit: 'contain', maxHeight: 210, backgroundColor: '#f3f4f6' },
  semFoto: { height: 60, borderWidth: 0.5, borderColor: '#d1d5db', justifyContent: 'center', alignItems: 'center', color: COR_SUAVE },
  codigo: { fontFamily: 'Courier', fontSize: 9, marginVertical: 4 },
  endereco: { fontFamily: 'Courier', fontSize: 6.5, marginTop: 3 },
});

function Pares({ itens }: { itens: Par[] }) {
  return (
    <View style={local.pares}>
      {itens.map(([rotulo, valor]) => (
        <View key={rotulo} style={local.par} wrap={false}>
          <Text style={local.rotulo}>{rotulo}</Text>
          <Text style={local.valor}>{valor}</Text>
        </View>
      ))}
    </View>
  );
}

/** Tabela simples: colunas com a largura em fração e as linhas já em texto */
function Tabela({ colunas, linhas }: { colunas: { titulo: string; largura: string }[]; linhas: string[][] }) {
  return (
    <View>
      <View style={estilos.cabecalhoTabela} fixed={false}>
        {colunas.map((c) => (
          <Text key={c.titulo} style={[local.celula, { width: c.largura }]}>
            {c.titulo}
          </Text>
        ))}
      </View>
      {linhas.map((linha, i) => (
        <View key={i} style={estilos.linhaTabela} wrap={false}>
          {linha.map((celula, j) => (
            <Text key={j} style={[local.celula, { width: colunas[j].largura }]}>
              {celula}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

function OrdemDeServicoDocumento({ documento }: { documento: DocumentoDaOS }) {
  const d = documento;
  return (
    <DocumentoAupus
      tipo="Ordem de serviço"
      meta={d.meta}
      rodape={d.verificacao ? `Código ${d.verificacao.codigo.slice(0, 16)}…` : d.aviso ? 'Sem código de verificação' : undefined}
    >
      {d.descricao && <Text style={local.titulo}>{d.descricao}</Text>}
      {d.aviso && <Text style={local.aviso}>{d.aviso}</Text>}

      <SecaoPdf titulo="Identificação">
        <Pares itens={d.identificacao} />
        {d.cadastro.length > 0 && (
          <View style={{ marginTop: 4 }}>
            <Pares itens={d.cadastro} />
            {/* Não entram no código: renomear a planta não muda a OS */}
            <Text style={local.fraco}>Planta, instalação e equipamento com os nomes do cadastro na data de emissão.</Text>
          </View>
        )}
      </SecaoPdf>

      {d.textos.length > 0 && (
        <SecaoPdf titulo="Resultado">
          {d.textos.map((t) => (
            <View key={t.titulo} style={local.textoBloco}>
              <Text style={local.subtitulo}>{t.titulo}</Text>
              <Text>{t.texto}</Text>
            </View>
          ))}
        </SecaoPdf>
      )}

      {d.falha.length > 0 && (
        <SecaoPdf titulo="Dados da falha">
          <Pares itens={d.falha} />
        </SecaoPdf>
      )}

      {d.tarefas.length > 0 && (
        <SecaoPdf titulo="Tarefas">
          <Tabela
            colunas={[
              { titulo: 'Tarefa', largura: '40%' },
              { titulo: 'Situação', largura: '14%' },
              { titulo: 'Por / em', largura: '22%' },
              { titulo: 'Observação', largura: '24%' },
            ]}
            linhas={d.tarefas.map((t) => [t.nome, t.situacao, t.quem, t.observacao])}
          />
        </SecaoPdf>
      )}

      {d.checklist.length > 0 && (
        <SecaoPdf titulo="Checklist e leituras">
          {d.checklist.map((grupo) => (
            <View key={grupo.tarefa}>
              <Text style={local.subtitulo}>{grupo.tarefa}</Text>
              <Tabela
                colunas={[
                  { titulo: 'Item', largura: '38%' },
                  { titulo: 'Situação', largura: '26%' },
                  { titulo: 'Leitura', largura: '18%' },
                  { titulo: 'Observação', largura: '18%' },
                ]}
                linhas={grupo.itens.map((i) => [i.atividade, i.feito, i.leitura, i.observacao])}
              />
            </View>
          ))}
        </SecaoPdf>
      )}

      {d.equipe.length > 0 && (
        <SecaoPdf titulo="Equipe e horas">
          <Tabela
            colunas={[
              { titulo: 'Pessoa', largura: '52%' },
              { titulo: 'Previstas', largura: '16%' },
              { titulo: 'Trabalhadas', largura: '16%' },
              { titulo: 'Foi', largura: '16%' },
            ]}
            linhas={d.equipe.map((t) => [t.nome, t.estimadas, t.trabalhadas, t.presente])}
          />
          {d.totalDaEquipe && <Text style={{ marginTop: 4 }}>{d.totalDaEquipe}</Text>}
        </SecaoPdf>
      )}

      {d.materiais.length > 0 && (
        <SecaoPdf titulo="Materiais">
          <Tabela
            colunas={[
              { titulo: 'Material', largura: '56%' },
              { titulo: 'Planejado', largura: '22%' },
              { titulo: 'Consumido', largura: '22%' },
            ]}
            linhas={d.materiais.map((m) => [m.descricao, m.planejado, m.consumido])}
          />
        </SecaoPdf>
      )}

      {d.ferramentas.length > 0 && (
        <SecaoPdf titulo="Ferramentas">
          <Tabela
            colunas={[
              { titulo: 'Ferramenta', largura: '56%' },
              { titulo: 'Quantidade', largura: '16%' },
              { titulo: 'Utilizada', largura: '28%' },
            ]}
            linhas={d.ferramentas.map((f) => [f.descricao, f.quantidade, f.utilizada])}
          />
        </SecaoPdf>
      )}

      {d.auditoria.length > 0 && (
        <SecaoPdf titulo="Custo e auditoria">
          <Pares itens={d.auditoria} />
        </SecaoPdf>
      )}

      {d.fotos.length > 0 && (
        <SecaoPdf titulo="Fotos">
          <View style={local.fotos}>
            {d.fotos.map((f, i) => (
              <View key={i} style={local.foto} wrap={false}>
                {f.foto ? (
                  <Image src={f.foto.src} style={local.imagem} />
                ) : (
                  <View style={local.semFoto}>
                    <Text>{f.falha}</Text>
                  </View>
                )}
                <Text style={{ marginTop: 2 }}>{f.legenda}</Text>
                <Text style={local.fraco}>{f.detalhe}</Text>
              </View>
            ))}
          </View>
        </SecaoPdf>
      )}

      {d.documentos.length > 0 && (
        <SecaoPdf titulo="Documentos anexados">
          {d.documentos.map((doc, i) => (
            <View key={i} style={{ marginBottom: 3 }} wrap={false}>
              <Text>{doc.nome}</Text>
              <Text style={local.fraco}>{doc.detalhe}</Text>
            </View>
          ))}
        </SecaoPdf>
      )}

      {/* Inteira numa página: o título sozinho no pé de uma e o código na outra se perdia */}
      <View wrap={false}>
        <Text style={estilos.secaoTitulo}>Verificação</Text>
        {d.verificacao ? (
          <View>
            <Text>Código de verificação (SHA-256 do conteúdo registrado na finalização):</Text>
            <Text style={local.codigo}>{d.verificacao.agrupado}</Text>
            <Text style={local.fraco}>
              Para conferir se o conteúdo no sistema ainda é o deste documento: entre no sistema, em Execução de OS use
              "Conferir código" e cole o código acima, ou abra o endereço:
            </Text>
            {/* Numa linha própria, em fonte fixa: o endereço não quebra no meio */}
            <Text style={local.endereco}>{d.verificacao.url}</Text>
          </View>
        ) : (
          <Text style={local.fraco}>{d.aviso}</Text>
        )}
      </View>
    </DocumentoAupus>
  );
}

/** O documento como elemento do react-pdf (o teste o renderiza de verdade) */
export const pdfDaOS = (documento: DocumentoDaOS) => <OrdemDeServicoDocumento documento={textosDoPdf(documento)} />;

export async function gerarPdfDaOS(documento: DocumentoDaOS) {
  await baixarPdf(pdfDaOS(documento), `${documento.numero}${documento.verificacao ? '' : '-previa'}.pdf`);
}
