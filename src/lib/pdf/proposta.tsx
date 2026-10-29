// src/lib/pdf/proposta.tsx
import { Text, View } from '@react-pdf/renderer';
import type { ReactNode } from 'react';
import { moeda, type Proposta } from '@/services/proposta.services';
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

/**
 * A proposta comercial no papel timbrado (SN-92): capa como a do modelo, as
 * seções numeradas e o total no painel navy.
 *
 * De valor, só o final (decisão do usuário, 29/out/2026): nem o preço de cada
 * serviço, nem a logística, a administração, o desconto ou a divisão entre a
 * Aupus e os fornecedores — e nunca o custo, a margem ou as tabelas (a spec).
 * Sem o passo a passo das instruções também: o cliente compra o serviço, não o
 * roteiro do técnico, e as horas de cada passo são a composição que a spec manda
 * não expor. O escopo são os serviços, pelo nome.
 */
export function PropostaDocumento({ proposta, numero, titulo, cliente }: DadosProposta) {
  const hoje = new Date().toLocaleDateString('pt-BR');
  const servicos = proposta.itens.map((item) => item.descricao.trim()).filter(Boolean);
  const condicoes = [
    ...(proposta.dias_previstos ? [`Execução prevista em ${numeroDoPdf(proposta.dias_previstos)} ${proposta.dias_previstos === 1 ? 'dia' : 'dias'}.`] : []),
    ...(proposta.validade_proposta ? [`Proposta válida até ${diaDoPdf(proposta.validade_proposta)}.`] : []),
  ];

  const secoes: Array<Secao | false> = [
    servicos.length > 0 && {
      titulo: 'Escopo do serviço',
      conteudo: <ListaPdf numerada itens={servicos.map((texto) => ({ texto }))} />,
    },
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
