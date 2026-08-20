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

/** Larguras das colunas da tabela de itens, em porcentagem da linha. */
const COL = { descricao: '46%', qtd: '12%', unidade: '10%', preco: '16%', total: '16%' } as const;

function PropostaDocumento({ proposta, numero, titulo, cliente }: DadosProposta) {
  const hoje = new Date().toLocaleDateString('pt-BR');

  const meta = [numero ? `Nº ${numero}` : null, `Emitida em ${hoje}`].filter(
    (x): x is string => Boolean(x),
  );

  const custosFD = proposta.outros_custos.filter((c) => c.faturamento_direto);
  const custosComuns = proposta.outros_custos.filter((c) => !c.faturamento_direto);

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
          As etapas vêm antes do preço de propósito: quem lê uma proposta
          quer saber o que será feito antes de quanto custa. */}
      {proposta.subinstrucoes.length > 0 && (
        <SecaoPdf titulo="Escopo do serviço">
          {proposta.subinstrucoes.map((sub, indice) => (
            <View key={sub.id ?? indice} style={{ flexDirection: 'row', marginBottom: 2 }}>
              <Text style={{ width: 16, color: '#6b7280' }}>{indice + 1}.</Text>
              <Text style={{ flex: 1 }}>{sub.descricao}</Text>
              {sub.tempo_estimado ? (
                <Text style={{ width: 60, textAlign: 'right', color: '#6b7280' }}>
                  {(sub.tempo_estimado / 60).toFixed(1).replace('.', ',')} h
                </Text>
              ) : null}
            </View>
          ))}
        </SecaoPdf>
      )}

      {/* ---------------- ITENS ---------------- */}
      {proposta.itens.length > 0 && (
        <SecaoPdf titulo="Itens">
          <View style={estilos.cabecalhoTabela}>
            <Text style={{ width: COL.descricao }}>Descrição</Text>
            <Text style={{ width: COL.qtd, textAlign: 'right' }}>Qtd</Text>
            <Text style={{ width: COL.unidade, textAlign: 'center' }}>Un.</Text>
            <Text style={{ width: COL.preco, textAlign: 'right' }}>Unitário</Text>
            <Text style={{ width: COL.total, textAlign: 'right' }}>Total</Text>
          </View>

          {proposta.itens.map((item, indice) => (
            <View key={item.id ?? indice} style={estilos.linhaTabela} wrap={false}>
              <Text style={{ width: COL.descricao }}>{item.descricao}</Text>
              <Text style={{ width: COL.qtd, textAlign: 'right' }}>
                {String(item.quantidade).replace('.', ',')}
              </Text>
              <Text style={{ width: COL.unidade, textAlign: 'center' }}>{item.unidade || '—'}</Text>
              <Text style={{ width: COL.preco, textAlign: 'right' }}>
                {moeda(item.preco_unitario)}
              </Text>
              <Text style={{ width: COL.total, textAlign: 'right' }}>
                {moeda(item.quantidade * item.preco_unitario)}
              </Text>
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
        <TotalPdf rotulo="Custo" valor={moeda(proposta.total_custo)} />
        {proposta.total_imposto > 0 && (
          <TotalPdf
            rotulo={`Impostos (${proposta.aliquota_percentual}%)`}
            valor={moeda(proposta.total_imposto)}
          />
        )}
        {proposta.total_lucro > 0 && (
          <TotalPdf
            rotulo={`Lucro (${proposta.lucro_percentual}%)`}
            valor={moeda(proposta.total_lucro)}
          />
        )}
        <TotalPdf rotulo="Total" valor={moeda(proposta.total_geral)} destaque />
      </View>
    </DocumentoAupus>
  );
}

export async function gerarPropostaPdf(dados: DadosProposta) {
  const nome = dados.numero ? `proposta-${dados.numero}` : 'proposta';
  await baixarPdf(<PropostaDocumento {...dados} />, nome);
}
