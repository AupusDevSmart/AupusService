// src/lib/pdf/proposta.tsx
import { Text, View } from '@react-pdf/renderer';
import type { ReactNode } from 'react';
import { moeda, type Proposta } from '@/services/proposta.services';
import { DocumentoAupus, ListaPdf, PainelPdf, SecaoPdf, TabelaPdf, TotaisPdf, baixarPdf, estilos, textosDoPdf } from './documento';

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
  /** A duração do passo em horas (SN-85) */
  etapas: Array<{ descricao: string; duracao_horas?: number | null }>;
}

interface Secao {
  titulo: string;
  conteudo: ReactNode;
}

const horas = (h: number) => `${h.toFixed(1).replace('.', ',')} h`;

/** "12,5": o percentual do desconto como foi digitado */
const percentualDoPdf = (valor: number) => valor.toLocaleString('pt-BR', { maximumFractionDigits: 2 });

/** Linhas de descrição e valor, com o valor à direita */
function Valores({ titulo, linhas }: { titulo: string; linhas: Array<{ descricao: string; valor: number }> }) {
  return (
    <TabelaPdf
      colunas={[
        { titulo, largura: '78%' },
        { titulo: 'Valor', largura: '22%', alinhar: 'right' },
      ]}
      linhas={linhas.map((l) => [l.descricao, moeda(l.valor)])}
    />
  );
}

const ROTULOS_NA_CAPA = 4;

/**
 * O que a capa diz do escopo: os primeiros serviços e quantos mais. A lista
 * inteira, numa proposta de vinte instruções, descia por cima do slogan e do
 * rodapé da capa; ela está completa na seção do escopo.
 */
export function resumoDoEscopo(rotulos: string[]): string | undefined {
  if (rotulos.length === 0) return undefined;
  const primeiros = rotulos.slice(0, ROTULOS_NA_CAPA).join(' · ');
  const resto = rotulos.length - ROTULOS_NA_CAPA;
  return resto > 0 ? `${primeiros} e mais ${resto}` : primeiros;
}

/** "30/11/2026" do "2026-11-30" (o dia de calendário, sem fuso) */
const diaDoPdf = (dia: string) => dia.split('-').reverse().join('/');

/**
 * As seções do preço na conta de imposto e margem (29/out/2026): o preço de venda
 * de cada instrução, a logística e os adicionais numa linha cada (as tabelas de
 * frete, deslocamento e diárias nunca vão ao cliente), a administração, o
 * faturamento direto à parte e os três totais da spec.
 */
function precosDaContaNova(proposta: Proposta): { secoes: Secao[]; parcelas: Array<[string, string]>; total: [string, number] } {
  const venda = proposta.venda ?? { logistica: 0, adicionais: 0 };
  const custosFD = proposta.outros_custos.filter((c) => c.faturamento_direto);
  const linhasDeServico = [
    ...proposta.itens.map((item) => ({ descricao: item.descricao, valor: item.valor_venda ?? 0 })),
    ...(venda.logistica > 0 ? [{ descricao: 'Logística e mobilização (deslocamento, frete e diárias)', valor: venda.logistica }] : []),
    ...(venda.adicionais > 0 ? [{ descricao: 'Custos adicionais', valor: venda.adicionais }] : []),
    ...((proposta.total_administracao ?? 0) > 0 ? [{ descricao: 'Administração', valor: proposta.total_administracao ?? 0 }] : []),
  ];
  const secoes: Secao[] = [];
  if (linhasDeServico.length > 0) {
    secoes.push({ titulo: 'Investimento por serviço', conteudo: <Valores titulo="Serviço · faturado pela Aupus" linhas={linhasDeServico} /> });
  }
  /* Faturamento direto em bloco separado: o cliente paga ao fornecedor, não à
     Aupus. Misturado com o resto, daria a entender que está sendo faturado aqui. */
  if (custosFD.length > 0) {
    secoes.push({
      titulo: 'Faturamento direto',
      conteudo: (
        <View>
          <Text style={[estilos.fraco, { marginBottom: 8 }]}>Pago pelo cliente direto ao fornecedor, não à Aupus.</Text>
          <Valores titulo="Fornecimento · faturado pelo fornecedor" linhas={custosFD.map((c) => ({ descricao: c.descricao, valor: c.valor ?? 0 }))} />
        </View>
      ),
    });
  }
  const parcelas: Array<[string, string]> = [
    ...(proposta.total_desconto > 0
      ? [
          [
            proposta.desconto_tipo === 'PERCENTUAL' ? `Desconto (${percentualDoPdf(proposta.desconto_valor ?? 0)}%)` : 'Desconto',
            `- ${moeda(proposta.total_desconto)}`,
          ] as [string, string],
        ]
      : []),
    ['Total faturado pela Aupus', moeda(proposta.total_aupus ?? 0)],
    ...((proposta.total_fd ?? 0) > 0 ? [['Total faturado pelos fornecedores', moeda(proposta.total_fd ?? 0)] as [string, string]] : []),
  ];
  return { secoes, parcelas, total: ['Investimento global', proposta.total_geral ?? 0] };
}

/** A proposta de antes (BDI), impressa como foi: o custo, o BDI em % e o total */
function precosDoBdi(proposta: Proposta): { secoes: Secao[]; parcelas: Array<[string, string]>; total: [string, number] } {
  const custosFD = proposta.outros_custos.filter((c) => c.faturamento_direto);
  const custosComuns = proposta.outros_custos.filter((c) => !c.faturamento_direto);
  // O faturamento direto fica fora da base do BDI, então sai do custo e volta como linha própria
  const totalFD = custosFD.reduce((soma, c) => soma + (c.valor || 0), 0);
  const custoBase = (proposta.total_custo ?? 0) - totalFD;
  const bdi = (proposta.bdi_percentual ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const secoes: Array<Secao | false> = [
    proposta.itens.length > 0 && {
      titulo: 'Instruções',
      conteudo: <Valores titulo="Instrução" linhas={proposta.itens.map((item) => ({ descricao: item.descricao, valor: item.preco_unitario ?? 0 }))} />,
    },
    custosComuns.length > 0 && { titulo: 'Outros custos', conteudo: <Valores titulo="Custo" linhas={custosComuns.map((c) => ({ descricao: c.descricao, valor: c.valor ?? 0 }))} /> },
    custosFD.length > 0 && {
      titulo: 'Faturamento direto',
      conteudo: (
        <View>
          <Text style={[estilos.fraco, { marginBottom: 8 }]}>Pago pelo cliente direto ao fornecedor, não à Aupus.</Text>
          <Valores titulo="Custo" linhas={custosFD.map((c) => ({ descricao: c.descricao, valor: c.valor ?? 0 }))} />
        </View>
      ),
    },
  ];
  const parcelas: Array<[string, string]> = [
    ['Custo', moeda(custoBase)],
    [`BDI (${bdi}%)`, moeda(proposta.total_bdi ?? 0)],
    ...(totalFD > 0 ? [['Faturamento direto', moeda(totalFD)] as [string, string]] : []),
    ...(proposta.total_desconto > 0
      ? [
          [
            proposta.desconto_tipo === 'PERCENTUAL' ? `Desconto (${percentualDoPdf(proposta.desconto_valor ?? 0)}%)` : 'Desconto',
            `- ${moeda(proposta.total_desconto)}`,
          ] as [string, string],
        ]
      : []),
  ];
  return { secoes: secoes.filter((x): x is Secao => Boolean(x)), parcelas, total: ['Total da proposta · à vista', proposta.total_geral ?? 0] };
}

/**
 * A proposta comercial no papel timbrado (SN-92): capa como a do modelo, as
 * seções numeradas e o total no painel navy. Nunca o custo, a margem nem as
 * tabelas de logística (a spec): só o que é comercialmente pertinente.
 */
export function PropostaDocumento({
  proposta,
  numero,
  titulo,
  cliente,
  escopo,
}: DadosProposta & { escopo: EscopoDaInstrucao[] }) {
  const hoje = new Date().toLocaleDateString('pt-BR');
  const precos = proposta.conta_da_proposta === 'BDI' ? precosDoBdi(proposta) : precosDaContaNova(proposta);
  const condicoes = [
    ...(proposta.dias_previstos ? [`Execução prevista em ${percentualDoPdf(proposta.dias_previstos)} ${proposta.dias_previstos === 1 ? 'dia' : 'dias'}.`] : []),
    ...(proposta.validade_proposta ? [`Proposta válida até ${diaDoPdf(proposta.validade_proposta)}.`] : []),
  ];

  const secoes: Array<Secao | false> = [
    /* As etapas vêm antes do preço de propósito: quem lê uma proposta quer
       saber o que será feito antes de quanto custa.

       Lidas AO VIVO das instruções vinculadas, e não de uma cópia guardada
       na proposta: escopo é descrição do serviço, não preço. Quem corrige
       uma instrução quer a correção valendo na próxima proposta impressa —
       o que precisa ficar congelado é o valor, e esse está nos itens. */
    escopo.length > 0 && {
      titulo: 'Escopo do serviço',
      conteudo: escopo.map((instrucao, i) => (
        <View key={instrucao.id} style={{ marginBottom: 8 }}>
          <Text style={[estilos.subtitulo, i === 0 ? { marginTop: 0 } : {}]} minPresenceAhead={40}>
            {instrucao.rotulo}
          </Text>
          <ListaPdf
            numerada
            itens={instrucao.etapas.map((etapa) => ({
              texto: etapa.descricao,
              detalhe: etapa.duracao_horas ? horas(etapa.duracao_horas) : undefined,
            }))}
          />
        </View>
      )),
    },
    ...precos.secoes,
    (condicoes.length > 0 || Boolean(proposta.condicoes_comerciais)) && {
      titulo: 'Prazo e condições',
      conteudo: (
        <View>
          {condicoes.map((linha) => (
            <Text key={linha} style={estilos.paragrafo}>
              {linha}
            </Text>
          ))}
          {proposta.condicoes_comerciais && <Text style={estilos.paragrafo}>{proposta.condicoes_comerciais}</Text>}
        </View>
      ),
    },
  ];
  const presentes = secoes.filter((s): s is Secao => Boolean(s));

  return (
    <DocumentoAupus
      titulo={numero ? `Proposta comercial ${numero}` : 'Proposta comercial'}
      comCapa
      abertura={{
        tipo: 'Proposta comercial',
        titulo: titulo || 'Proposta comercial',
        subtitulo: resumoDoEscopo(escopo.map((e) => e.rotulo)),
        campos: [
          ...(cliente ? [['Cliente', cliente] as [string, string]] : []),
          ...(numero ? [['Referência', `Nº ${numero}`] as [string, string]] : []),
          ['Data', `Emitida em ${hoje}`],
        ],
      }}
      rodape={{ referencia: numero ? `Proposta ${numero}` : 'Proposta comercial', detalhe: cliente ? `${cliente} · Aupus Energia` : 'Aupus Energia' }}
    >
      {presentes.map((secao, i) => (
        <SecaoPdf key={secao.titulo} numero={i + 1} titulo={secao.titulo}>
          {secao.conteudo}
        </SecaoPdf>
      ))}

      <View wrap={false}>
        <SecaoPdf numero={presentes.length + 1} titulo="Investimento">
          {/* As parcelas fecham o total, que vai uma vez só: no painel */}
          <TotaisPdf parcelas={precos.parcelas} />
          <View style={{ marginTop: 14 }}>
            <PainelPdf rotulo={precos.total[0]} valor={moeda(precos.total[1])} />
          </View>
        </SecaoPdf>
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
 * não conseguir gerar a proposta. Mas não calada: volta em `faltaram`, e quem
 * gera é avisado antes de mandar ao cliente (revisão do SN-62). A apagada (404)
 * não conta: não há escopo a mostrar.
 */
async function carregarEscopo(proposta: Proposta): Promise<{ escopo: EscopoDaInstrucao[]; faltaram: string[] }> {
  const ids = [
    ...new Set(
      proposta.itens.map((i) => String(i.instrucao_id ?? '').trim()).filter(Boolean),
    ),
  ];

  if (ids.length === 0) return { escopo: [], faltaram: [] };

  const { instrucoesApi } = await import('@/services/instrucoes.services');
  const { rotuloInstrucao } = await import('@/services/proposta.services');

  const faltaram: string[] = [];
  const nomeDoItem = (id: string) => proposta.itens.find((i) => String(i.instrucao_id ?? '').trim() === id)?.descricao?.trim() || id;
  const detalhes = await Promise.all(
    ids.map((id) =>
      instrucoesApi.findOne(id).catch((erro: { response?: { status?: number } }) => {
        if (erro?.response?.status !== 404) {
          console.error(`Escopo da instrução ${id} fora da proposta:`, erro);
          faltaram.push(nomeDoItem(id));
        }
        return null;
      }),
    ),
  );

  const escopo = detalhes
    .filter((d): d is NonNullable<typeof d> => Boolean(d))
    .map((instrucao) => ({
      id: instrucao.id,
      rotulo: rotuloInstrucao(instrucao.codigo, instrucao.nome),
      etapas: (instrucao.sub_instrucoes ?? []).map((s) => ({
        descricao: s.descricao,
        duracao_horas: s.duracao_horas ?? null,
      })),
    }))
    .filter((i) => i.etapas.length > 0);
  return { escopo, faltaram };
}

/** O documento como elemento do react-pdf (o teste o renderiza de verdade) */
export const pdfDaProposta = (dados: DadosProposta & { escopo: EscopoDaInstrucao[] }) => (
  // Os textos sem o que a fonte não tem (ver `textoDoPdf`)
  <PropostaDocumento {...textosDoPdf(dados)} />
);

/** Gera e baixa; devolve o que ficou fora do escopo, para quem gerou ser avisado. */
export async function gerarPropostaPdf(dados: DadosProposta): Promise<string[]> {
  const { escopo, faltaram } = await carregarEscopo(dados.proposta);
  const nome = dados.numero ? `proposta-${dados.numero}` : 'proposta';
  await baixarPdf(pdfDaProposta({ ...dados, escopo }), nome);
  return faltaram;
}
