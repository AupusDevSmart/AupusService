// src/lib/pdf/proposta.tsx
import { Text, View } from '@react-pdf/renderer';
import type { ReactNode } from 'react';
import { moeda, type LinhaDeLogistica, type Proposta, type TabelaDeLogistica } from '@/services/proposta.services';
import { DocumentoAupus, ListaPdf, PainelPdf, SecaoPdf, baixarPdf, estilos, textosDoPdf } from './documento';

interface DadosProposta {
  proposta: Proposta;
  numero?: string;
  titulo?: string;
  cliente?: string;
}

interface Secao {
  titulo: string;
  conteudo: ReactNode;
}

/** "2,5": o número como foi digitado */
const numeroDoPdf = (valor: number) => valor.toLocaleString('pt-BR', { maximumFractionDigits: 2 });

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

/** "1 dia", "2,5 dias" */
const quantos = (n: number, um: string, varios: string) => `${numeroDoPdf(n)} ${n === 1 ? um : varios}`;

/** As tabelas de logística na ordem do PDF */
const LOGISTICA_NO_PDF: Array<[TabelaDeLogistica, string]> = [
  ['DESLOCAMENTO', 'Deslocamento'],
  ['FRETE', 'Frete'],
  ['DIARIA', 'Diárias'],
];

/** O que a linha de logística é, sem quanto custa: as quantidades, nunca os valores */
function detalheDaLinha(linha: LinhaDeLogistica): string | undefined {
  const partes =
    linha.tabela === 'DESLOCAMENTO'
      ? [linha.dias ? quantos(linha.dias, 'dia', 'dias') : null, linha.km ? `${numeroDoPdf(linha.km)} km` : null]
      : linha.tabela === 'FRETE'
        ? [linha.quantidade ? quantos(linha.quantidade, 'viagem', 'viagens') : null, linha.km ? `${numeroDoPdf(linha.km)} km por viagem` : null]
        : [linha.quantidade ? quantos(linha.quantidade, 'diária', 'diárias') : null];
  return partes.filter(Boolean).join(' · ') || undefined;
}

/** O planejamento da execução em frases (o que estiver preenchido) */
function frasesDoPlanejamento(proposta: Proposta): string[] {
  const { distancia_km: ida, distancia_ida_volta_km: idaEVolta, pessoas_previstas: pessoas, noites_fora: noites } = proposta;
  return [
    ida ? `Distância até o local: ${numeroDoPdf(ida)} km${idaEVolta ? ` (${numeroDoPdf(idaEVolta)} km ida e volta)` : ''}.` : null,
    !ida && idaEVolta ? `Percurso de ${numeroDoPdf(idaEVolta)} km ida e volta.` : null,
    pessoas ? `Equipe prevista: ${quantos(pessoas, 'pessoa', 'pessoas')}.` : null,
    noites ? `Pernoites previstos: ${numeroDoPdf(noites)}.` : null,
  ].filter((frase): frase is string => Boolean(frase));
}

/** Um grupo de itens com o título em cima (o primeiro da seção sem a margem de cima) */
function Grupo({ titulo, primeiro, children }: { titulo: string; primeiro: boolean; children: ReactNode }) {
  return (
    <View style={{ marginBottom: 6 }}>
      <Text style={[estilos.subtitulo, primeiro ? { marginTop: 0 } : {}]} minPresenceAhead={40}>
        {titulo}
      </Text>
      {children}
    </View>
  );
}

const Paragrafos = ({ linhas }: { linhas: string[] }) => (
  <>
    {linhas.map((linha) => (
      <Text key={linha} style={estilos.paragrafo}>
        {linha}
      </Text>
    ))}
  </>
);

/**
 * A mobilização (planejamento e as linhas ativas de deslocamento, frete e
 * diárias) e os custos adicionais, pelo nome e pelas quantidades. Seção vazia
 * não entra.
 */
function secoesDaExecucao(proposta: Proposta): Secao[] {
  const planejamento = frasesDoPlanejamento(proposta);
  const grupos = LOGISTICA_NO_PDF.map(([tabela, titulo]) => ({
    titulo,
    // A linha desligada fica na proposta, fora da conta: fora do PDF também
    itens: (proposta.logistica ?? [])
      .filter((l) => l.tabela === tabela && l.ativo && l.descricao.trim())
      .map((l) => ({ texto: l.descricao.trim(), detalhe: detalheDaLinha(l) })),
  })).filter((g) => g.itens.length > 0);
  const adicionais = proposta.outros_custos.filter((c) => c.descricao.trim());
  const daAupus = adicionais.filter((c) => !c.faturamento_direto);
  const doFornecedor = adicionais.filter((c) => c.faturamento_direto);

  const secoes: Secao[] = [];
  if (planejamento.length > 0 || grupos.length > 0) {
    secoes.push({
      titulo: 'Mobilização e logística',
      conteudo: (
        <View>
          <Paragrafos linhas={planejamento} />
          {grupos.map((grupo, i) => (
            <Grupo key={grupo.titulo} titulo={grupo.titulo} primeiro={i === 0 && planejamento.length === 0}>
              <ListaPdf itens={grupo.itens} />
            </Grupo>
          ))}
        </View>
      ),
    });
  }
  if (adicionais.length > 0) {
    secoes.push({
      titulo: 'Custos adicionais',
      conteudo: (
        <View>
          {daAupus.length > 0 && <ListaPdf itens={daAupus.map((c) => ({ texto: c.descricao.trim() }))} />}
          {/* O cliente paga o fornecedor direto: dito, para a nota da Aupus não parecer menor que a proposta */}
          {doFornecedor.length > 0 && (
            <Grupo titulo="Faturamento direto" primeiro={daAupus.length === 0}>
              <Text style={[estilos.fraco, { marginBottom: 6 }]}>Pago pelo cliente direto ao fornecedor, não à Aupus; incluído no investimento global.</Text>
              <ListaPdf itens={doFornecedor.map((c) => ({ texto: c.descricao.trim() }))} />
            </Grupo>
          )}
        </View>
      ),
    });
  }
  return secoes;
}

/**
 * A proposta comercial no papel timbrado (SN-92): capa como a do modelo, as
 * seções numeradas e o total no painel navy.
 *
 * De valor, só o final (decisão do usuário, 29/out/2026): nem o preço de cada
 * serviço, nem a logística, a administração, o desconto ou a divisão entre a
 * Aupus e os fornecedores — e nunca o custo nem a margem. O deslocamento, o
 * frete, as diárias, o planejamento e os adicionais vão pelo nome e pelas
 * quantidades (pedido do usuário, no lugar da regra da spec de não mostrar as
 * tabelas). Sem o passo a passo das instruções: o cliente compra o serviço, não
 * o roteiro do técnico, e as horas de cada passo são a composição do preço.
 */
export function PropostaDocumento({ proposta, numero, titulo, cliente }: DadosProposta) {
  const hoje = new Date().toLocaleDateString('pt-BR');
  const servicos = proposta.itens.map((item) => item.descricao.trim()).filter(Boolean);
  const condicoes = [
    ...(proposta.dias_previstos ? [`Execução prevista em ${quantos(proposta.dias_previstos, 'dia', 'dias')}.`] : []),
    ...(proposta.validade_proposta ? [`Proposta válida até ${diaDoPdf(proposta.validade_proposta)}.`] : []),
  ];

  const secoes: Array<Secao | false> = [
    servicos.length > 0 && {
      titulo: 'Escopo do serviço',
      conteudo: <ListaPdf numerada itens={servicos.map((texto) => ({ texto }))} />,
    },
    ...secoesDaExecucao(proposta),
    (condicoes.length > 0 || Boolean(proposta.condicoes_comerciais)) && {
      titulo: 'Prazo e condições',
      conteudo: (
        <View>
          <Paragrafos linhas={condicoes} />
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
        subtitulo: resumoDoEscopo(servicos),
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
          {/* O total com o desconto e o faturamento direto, nas duas contas (a do BDI também) */}
          <PainelPdf rotulo="Investimento global" valor={moeda(proposta.total_geral ?? 0)} />
        </SecaoPdf>
      </View>
    </DocumentoAupus>
  );
}

/** O documento como elemento do react-pdf (o teste o renderiza de verdade) */
export const pdfDaProposta = (dados: DadosProposta) => (
  // Os textos sem o que a fonte não tem (ver `textoDoPdf`)
  <PropostaDocumento {...textosDoPdf(dados)} />
);

/** Gera e baixa. Tudo o que o PDF diz já está na proposta: nada a buscar na hora */
export async function gerarPropostaPdf(dados: DadosProposta): Promise<void> {
  const nome = dados.numero ? `proposta-${dados.numero}` : 'proposta';
  await baixarPdf(pdfDaProposta(dados), nome);
}
