// src/lib/pdf/proposta.tsx
import { Text, View } from '@react-pdf/renderer';
import { moeda, type Proposta } from '@/services/proposta.services';
import { DocumentoAupus, SecaoPdf, TotalPdf, baixarPdf, estilos } from './documento';

interface DadosProposta {
  proposta: Proposta;
  numero?: string;
  titulo?: string;
  cliente?: string;
}

/** As etapas de uma instrução, lidas na hora de gerar. */
interface EscopoDaInstrucao {
  id: string;
  rotulo: string;
  etapas: Array<{ descricao: string; tempo_estimado?: number | null }>;
}

function PropostaDocumento({
  proposta,
  numero,
  titulo,
  cliente,
  escopo,
}: DadosProposta & { escopo: EscopoDaInstrucao[] }) {
  const hoje = new Date().toLocaleDateString('pt-BR');

  const meta = [numero ? `Nº ${numero}` : null, `Emitida em ${hoje}`].filter(
    (x): x is string => Boolean(x),
  );

  const custosFD = proposta.outros_custos.filter((c) => c.faturamento_direto);
  const custosComuns = proposta.outros_custos.filter((c) => !c.faturamento_direto);

  // O faturamento direto fica fora da base do BDI, então sai do custo e volta
  // como linha própria — assim as três parcelas fecham o total à vista.
  const totalFD = custosFD.reduce((soma, c) => soma + (c.valor || 0), 0);
  const custoBase = proposta.total_custo - totalFD;

  const bdi = (Number.isFinite(proposta.bdi_percentual) ? proposta.bdi_percentual : 0)
    .toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <DocumentoAupus tipo="Proposta comercial" meta={meta}>
      {(titulo || cliente) && (
        <View>
          {titulo && <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold' }}>{titulo}</Text>}
          {cliente && (
            <Text style={{ fontSize: 9, color: '#6b7280', marginTop: 2 }}>{cliente}</Text>
          )}
        </View>
      )}

      {/* ---------------- ESCOPO ----------------
          As etapas vêm antes do preço de propósito: quem lê uma proposta quer
          saber o que será feito antes de quanto custa.

          Lidas AO VIVO das instruções vinculadas, e não de uma cópia guardada
          na proposta: escopo é descrição do serviço, não preço. Quem corrige
          uma instrução quer a correção valendo na próxima proposta impressa —
          o que precisa ficar congelado é o valor, e esse está nos itens. */}
      {escopo.length > 0 && (
        <SecaoPdf titulo="Escopo do serviço">
          {escopo.map((instrucao) => (
            <View key={instrucao.id} style={{ marginBottom: 6 }}>
              <Text style={{ fontFamily: 'Helvetica-Bold', marginBottom: 2 }}>
                {instrucao.rotulo}
              </Text>
              {instrucao.etapas.map((etapa, indice) => (
                <View key={indice} style={{ flexDirection: 'row', marginBottom: 2 }}>
                  <Text style={{ width: 24, color: '#6b7280' }}>{indice + 1}.</Text>
                  <Text style={{ flex: 1 }}>{etapa.descricao}</Text>
                  {etapa.tempo_estimado ? (
                    <Text style={{ width: 60, textAlign: 'right', color: '#6b7280' }}>
                      {(etapa.tempo_estimado / 60).toFixed(1).replace('.', ',')} h
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          ))}
        </SecaoPdf>
      )}

      {/* ---------------- INSTRUÇÕES ----------------
          Uma linha por instrução, com o valor fechado dela. Sem coluna de
          quantidade ou unitário: o que a proposta promete é o serviço inteiro,
          não uma composição de insumos. */}
      {proposta.itens.length > 0 && (
        <SecaoPdf titulo="Instruções">
          {proposta.itens.map((item, indice) => (
            <View key={item.id ?? indice} style={estilos.linhaTabela} wrap={false}>
              <Text style={{ flex: 1 }}>{item.descricao}</Text>
              <Text style={{ width: 90, textAlign: 'right' }}>{moeda(item.preco_unitario)}</Text>
            </View>
          ))}
        </SecaoPdf>
      )}

      {/* ---------------- OUTROS CUSTOS ---------------- */}
      {custosComuns.length > 0 && (
        <SecaoPdf titulo="Outros custos">
          {custosComuns.map((custo, indice) => (
            <View key={custo.id ?? indice} style={estilos.linhaTabela} wrap={false}>
              <Text style={{ flex: 1 }}>{custo.descricao}</Text>
              <Text style={{ width: 90, textAlign: 'right' }}>{moeda(custo.valor)}</Text>
            </View>
          ))}
        </SecaoPdf>
      )}

      {/* Faturamento direto em bloco separado: é dinheiro que o cliente paga
          ao fornecedor, não à Aupus. Misturado com o resto, daria a entender
          que está sendo faturado aqui. */}
      {custosFD.length > 0 && (
        <SecaoPdf titulo="Faturamento direto (pago pelo cliente ao fornecedor)">
          {custosFD.map((custo, indice) => (
            <View key={custo.id ?? indice} style={estilos.linhaTabela} wrap={false}>
              <Text style={{ flex: 1 }}>{custo.descricao}</Text>
              <Text style={{ width: 90, textAlign: 'right' }}>{moeda(custo.valor)}</Text>
            </View>
          ))}
        </SecaoPdf>
      )}

      {/* ---------------- TOTAIS ---------------- */}
      <View style={{ marginTop: 14 }}>
        <TotalPdf rotulo="Custo" valor={moeda(custoBase)} />
        <TotalPdf rotulo={`BDI (${bdi}%)`} valor={moeda(proposta.total_bdi)} />
        {totalFD > 0 && <TotalPdf rotulo="Faturamento direto" valor={moeda(totalFD)} />}
        <TotalPdf rotulo="Total" valor={moeda(proposta.total_geral)} destaque />
      </View>
    </DocumentoAupus>
  );
}

/**
 * As etapas das instruções vinculadas, buscadas na hora de gerar.
 *
 * As instruções saem dos próprios itens da proposta — cada linha carrega o
 * `instrucao_id` de onde veio —, então não é preciso passar a lista de fora.
 *
 * Uma instrução que não carrega é omitida do escopo, e não derruba o PDF: o
 * documento vale pelo preço, e ficar sem uma etapa é melhor do que a pessoa
 * não conseguir gerar a proposta.
 */
async function carregarEscopo(proposta: Proposta): Promise<EscopoDaInstrucao[]> {
  const ids = [
    ...new Set(
      proposta.itens.map((i) => String(i.instrucao_id ?? '').trim()).filter(Boolean),
    ),
  ];

  if (ids.length === 0) return [];

  const { instrucoesApi } = await import('@/services/instrucoes.services');
  const { rotuloInstrucao } = await import('@/services/proposta.services');

  const detalhes = await Promise.all(
    ids.map((id) => instrucoesApi.findOne(id).catch(() => null)),
  );

  return detalhes
    .filter((d): d is NonNullable<typeof d> => Boolean(d))
    .map((instrucao) => ({
      id: instrucao.id,
      rotulo: rotuloInstrucao(instrucao.tag, instrucao.nome),
      etapas: (instrucao.sub_instrucoes ?? []).map((s) => ({
        descricao: s.descricao,
        tempo_estimado: s.tempo_estimado ?? null,
      })),
    }))
    .filter((i) => i.etapas.length > 0);
}

export async function gerarPropostaPdf(dados: DadosProposta) {
  const escopo = await carregarEscopo(dados.proposta);
  const nome = dados.numero ? `proposta-${dados.numero}` : 'proposta';
  await baixarPdf(<PropostaDocumento {...dados} escopo={escopo} />, nome);
}
