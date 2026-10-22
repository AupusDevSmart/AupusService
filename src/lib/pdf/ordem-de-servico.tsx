// src/lib/pdf/ordem-de-servico.tsx
import { Image, StyleSheet, Text, View } from '@react-pdf/renderer';
import type { ReactNode } from 'react';
import type { DocumentoDaOS } from '@/features/execucao-os/utils/documento-da-os';
import {
  AvisoPdf,
  COR,
  DocumentoAupus,
  PainelPdf,
  ParesPdf,
  SecaoPdf,
  TabelaPdf,
  baixarPdf,
  estilos,
  textosDoPdf,
} from './documento';

/**
 * O PDF da OS (SN-62) no papel timbrado (SN-92). Só desenha: o texto chega
 * pronto de `documentoDaOS`, montado do conteúdo que a API gravou na
 * finalização — o que o código de verificação prova. O desenho não entra no
 * código: mudar o timbrado não muda o que ele confere.
 */

const local = StyleSheet.create({
  textoBloco: { marginBottom: 8 },
  fotos: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 },
  foto: { width: '50%', padding: 5 },
  imagem: { width: '100%', objectFit: 'contain', maxHeight: 210, backgroundColor: COR.fundo, borderRadius: 3 },
  semFoto: { height: 60, backgroundColor: COR.fundo, borderRadius: 3, justifyContent: 'center', alignItems: 'center', color: COR.cinza, fontSize: 8.5 },
  legenda: { fontSize: 9, marginTop: 4 },
  codigo: { fontFamily: 'Courier', fontSize: 10, color: COR.branco, marginTop: 10 },
  explicacao: { fontSize: 8, color: COR.painelRotulo, marginTop: 8, lineHeight: 1.4 },
  endereco: { fontFamily: 'Courier', fontSize: 6.5, color: COR.branco, marginTop: 4 },
});

interface Secao {
  titulo: string;
  conteudo: ReactNode;
  /** O começo do conteúdo que o cabeçalho leva junto (ver `SecaoPdf`) */
  reserva?: number;
}

/**
 * Os custos da OS (SN-93): o custo real em destaque contra o previsto; por
 * natureza (mão de obra, material, cada outro custo); cada instrução com o valor
 * dela e o total das feitas; os outros custos um a um; e o que a conta não fechou.
 */
function CustosDaOS({ custos }: { custos: NonNullable<DocumentoDaOS['custos']> }) {
  return (
    <View>
      <PainelPdf rotulo="Custo real" valor={custos.real}>
        <Text style={local.explicacao}>
          Previsto {custos.previsto} · {custos.diferenca}. Mão de obra pelas horas trabalhadas × valor da hora, material pelo
          consumido × custo unitário e os outros custos pelo conferido na execução.
        </Text>
      </PainelPdf>

      <Text style={[estilos.subtitulo, { marginTop: 14 }]} minPresenceAhead={60}>
        Por natureza
      </Text>
      <TabelaPdf
        colunas={[
          { titulo: 'Natureza', largura: '34%' },
          { titulo: 'Previsto', largura: '20%', alinhar: 'right' },
          { titulo: 'Real', largura: '20%', alinhar: 'right' },
          { titulo: 'Diferença', largura: '26%', alinhar: 'right' },
        ]}
        linhas={[
          ...custos.naturezas.map((n) => [n.rotulo, n.previsto, n.real, n.diferenca]),
          ['Total', custos.totalPrevisto, custos.totalReal, ''],
        ]}
      />
      {custos.ajuste && (
        <Text style={[estilos.fraco, { marginTop: 4 }]}>Ajuste do orçamento na aprovação: {custos.ajuste} (o previsto acima é o aprovado).</Text>
      )}

      {custos.instrucoes.length > 0 && (
        <>
          <Text style={estilos.subtitulo} minPresenceAhead={60}>
            Por instrução
          </Text>
          <TabelaPdf
            colunas={[
              { titulo: 'Instrução', largura: '52%' },
              { titulo: 'Situação', largura: '16%' },
              { titulo: 'Valor', largura: '32%', alinhar: 'right' },
            ]}
            linhas={custos.instrucoes.map((i) => [
              { texto: i.nome, detalhe: i.equipamento || undefined },
              i.situacao,
              { texto: i.valor, detalhe: i.detalhe ?? undefined },
            ])}
          />
          {custos.resumoDasInstrucoes && (
            <Text style={[estilos.fraco, { marginTop: 4 }]}>
              Instruções {custos.resumoDasInstrucoes}. O valor de cada instrução é o do cadastro no vínculo, ou o ajustado na programação.
            </Text>
          )}
        </>
      )}

      {custos.outros.length > 0 && (
        <>
          <Text style={estilos.subtitulo} minPresenceAhead={60}>
            Outros custos
          </Text>
          <TabelaPdf
            colunas={[
              { titulo: 'Custo', largura: '46%' },
              { titulo: 'Previsto', largura: '22%', alinhar: 'right' },
              { titulo: 'Real', largura: '32%', alinhar: 'right' },
            ]}
            linhas={custos.outros.map((o) => [{ texto: o.descricao, detalhe: o.natureza }, o.previsto, o.real])}
          />
        </>
      )}

      {custos.pendencias.map((p) => (
        <Text key={p} style={[estilos.fraco, { marginTop: 4 }]}>
          {p}
        </Text>
      ))}
    </View>
  );
}

function OrdemDeServicoDocumento({ documento }: { documento: DocumentoDaOS }) {
  const d = documento;

  // Só as seções que a OS tem, numeradas na ordem em que aparecem
  const secoes: Array<Secao | false> = [
    d.identificacao.length > 0 && { titulo: 'Identificação', conteudo: <ParesPdf itens={d.identificacao} /> },
    d.textos.length > 0 && {
      titulo: 'Resultado',
      conteudo: d.textos.map((t) => (
        <View key={t.titulo} style={local.textoBloco}>
          <Text style={[estilos.subtitulo, { marginTop: 0 }]}>{t.titulo}</Text>
          <Text style={estilos.paragrafo}>{t.texto}</Text>
        </View>
      )),
    },
    // SN-93: o custo logo depois do resultado, com destaque — pedido do usuário: é a parte que mais importa para o controle
    d.custos
      ? {
          titulo: 'Custos',
          // O painel do custo real inteiro com o cabeçalho
          reserva: 100,
          conteudo: <CustosDaOS custos={d.custos} />,
        }
      : false,
    d.falha.length > 0 && { titulo: 'Dados da falha', conteudo: <ParesPdf itens={d.falha} /> },
    d.tarefas.length > 0 && {
      titulo: 'Tarefas',
      conteudo: (
        <TabelaPdf
          colunas={[
            { titulo: 'Tarefa', largura: '40%' },
            { titulo: 'Situação', largura: '14%' },
            { titulo: 'Por / em', largura: '22%' },
            { titulo: 'Observação', largura: '24%' },
          ]}
          // O equipamento debaixo do nome: nove "INV-03 · Termografia" iguais não diziam de qual inversor
          linhas={d.tarefas.map((t) => [{ texto: t.nome, detalhe: t.equipamento || undefined }, t.situacao, t.quem, t.observacao])}
        />
      ),
    },
    d.checklist.length > 0 && {
      titulo: 'Checklist e leituras',
      conteudo: d.checklist.map((grupo, i) => (
        <View key={grupo.tarefa}>
          <Text style={[estilos.subtitulo, i === 0 ? { marginTop: 0 } : {}]} minPresenceAhead={50}>
            {grupo.tarefa}
          </Text>
          <TabelaPdf
            colunas={[
              { titulo: 'Item', largura: '38%' },
              { titulo: 'Situação', largura: '26%' },
              { titulo: 'Leitura', largura: '18%' },
              { titulo: 'Observação', largura: '18%' },
            ]}
            linhas={grupo.itens.map((item) => [item.atividade, item.feito, item.leitura, item.observacao])}
          />
        </View>
      )),
    },
    d.equipe.length > 0 && {
      titulo: 'Equipe e horas',
      conteudo: (
        <View>
          {/* SN-93 (D3): o valor da hora e o custo de cada pessoa */}
          <TabelaPdf
            colunas={[
              { titulo: 'Pessoa', largura: '36%' },
              { titulo: 'Previstas', largura: '12%', alinhar: 'right' },
              { titulo: 'Trabalhadas', largura: '13%', alinhar: 'right' },
              { titulo: 'R$/h', largura: '13%', alinhar: 'right' },
              { titulo: 'Custo', largura: '16%', alinhar: 'right' },
              { titulo: 'Foi', largura: '10%', alinhar: 'right' },
            ]}
            linhas={d.equipe.map((t) => [t.nome, t.estimadas, t.trabalhadas, t.valorHora, t.custo, t.presente])}
          />
          {d.totalDaEquipe && <Text style={[estilos.fraco, { marginTop: 6 }]}>{d.totalDaEquipe}</Text>}
        </View>
      ),
    },
    d.materiais.length > 0 && {
      titulo: 'Materiais',
      conteudo: (
        <TabelaPdf
          colunas={[
            { titulo: 'Material', largura: '34%' },
            { titulo: 'Planejado', largura: '15%', alinhar: 'right' },
            { titulo: 'Consumido', largura: '15%', alinhar: 'right' },
            { titulo: 'Unitário', largura: '16%', alinhar: 'right' },
            { titulo: 'Custo', largura: '20%', alinhar: 'right' },
          ]}
          linhas={d.materiais.map((m) => [m.descricao, m.planejado, m.consumido, m.unitario, m.custo])}
        />
      ),
    },
    d.ferramentas.length > 0 && {
      titulo: 'Ferramentas',
      conteudo: (
        <TabelaPdf
          colunas={[
            { titulo: 'Ferramenta', largura: '56%' },
            { titulo: 'Quantidade', largura: '16%', alinhar: 'right' },
            { titulo: 'Utilizada', largura: '28%' },
          ]}
          linhas={d.ferramentas.map((f) => [f.descricao, f.quantidade, f.utilizada])}
        />
      ),
    },
    d.auditoria.length > 0 && { titulo: 'Auditoria', conteudo: <ParesPdf itens={d.auditoria} /> },
    d.fotos.length > 0 && {
      titulo: 'Fotos',
      // A primeira foto inteira: até 210 pt, o respiro (10) e legenda e detalhe em duas
      // linhas cada (~48). Menor, o cabeçalho ficava sozinho no pé com a foto de celular
      reserva: 280,
      conteudo: (
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
              <Text style={local.legenda}>{f.legenda}</Text>
              <Text style={estilos.fraco}>{f.detalhe}</Text>
            </View>
          ))}
        </View>
      ),
    },
    d.documentos.length > 0 && {
      titulo: 'Documentos anexados',
      conteudo: (
        <TabelaPdf
          colunas={[{ titulo: 'Documento', largura: '100%' }]}
          linhas={d.documentos.map((doc) => [{ texto: doc.nome, detalhe: doc.detalhe }])}
        />
      ),
    },
  ];
  const presentes = secoes.filter((s): s is Secao => Boolean(s));

  const meta = d.meta.filter((m) => !m.startsWith('Nº '));
  return (
    <DocumentoAupus
      titulo={`Ordem de serviço ${d.numero}`}
      abertura={{
        tipo: `Ordem de serviço · ${d.numero}`,
        titulo: d.descricao || `Ordem de serviço ${d.numero}`,
        subtitulo: meta.join(' · '),
        campos: d.cadastro,
      }}
      rodape={{
        referencia: d.numero,
        detalhe: d.verificacao ? `Código ${d.verificacao.codigo.slice(0, 16)}… · Aupus Energia` : d.aviso ? 'Sem código de verificação · Aupus Energia' : 'Aupus Energia',
      }}
    >
      {/* Não entram no código: renomear a planta não muda a OS */}
      {d.cadastro.length > 0 && (
        <Text style={[estilos.fraco, { marginTop: 6 }]}>Planta, instalação e equipamento com os nomes do cadastro na data de emissão.</Text>
      )}
      {d.aviso && <AvisoPdf>{d.aviso}</AvisoPdf>}

      {presentes.map((secao, i) => (
        <SecaoPdf key={secao.titulo} numero={i + 1} titulo={secao.titulo} reserva={secao.reserva}>
          {secao.conteudo}
        </SecaoPdf>
      ))}

      {/* Inteira numa página: o título sozinho no pé de uma e o código na outra se perdia */}
      <View wrap={false}>
        <SecaoPdf numero={presentes.length + 1} titulo="Verificação">
          {d.verificacao ? (
            <PainelPdf rotulo="Código de verificação">
              <Text style={local.codigo}>{d.verificacao.agrupado}</Text>
              <Text style={local.explicacao}>
                SHA-256 do conteúdo registrado na finalização. Para conferir se o conteúdo no sistema ainda é o deste
                documento: entre no sistema, em Execução de OS use "Conferir código" e cole o código acima, ou abra o
                endereço:
              </Text>
              {/* Numa linha própria, em fonte fixa: o endereço não quebra no meio */}
              <Text style={local.endereco}>{d.verificacao.url}</Text>
            </PainelPdf>
          ) : (
            <Text style={estilos.fraco}>{d.aviso}</Text>
          )}
        </SecaoPdf>
      </View>
    </DocumentoAupus>
  );
}

/** O documento como elemento do react-pdf (o teste o renderiza de verdade) */
export const pdfDaOS = (documento: DocumentoDaOS) => <OrdemDeServicoDocumento documento={textosDoPdf(documento)} />;

/** O `<Document>` do PDF, para o teste ler onde cada texto ficou (`textosDesenhados`) */
export const documentoDoPdfDaOS = (documento: DocumentoDaOS) => {
  const timbrado = OrdemDeServicoDocumento({ documento: textosDoPdf(documento) });
  return DocumentoAupus(timbrado.props as Parameters<typeof DocumentoAupus>[0]);
};

export async function gerarPdfDaOS(documento: DocumentoDaOS) {
  await baixarPdf(pdfDaOS(documento), `${documento.numero}${documento.verificacao ? '' : '-previa'}.pdf`);
}
