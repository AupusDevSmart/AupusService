// src/features/execucao-os/utils/documento-da-os.ts
import type { ConteudoDaOS, RelatorioDaOS } from '@/services/execucao-os.service';
import { prioridadeLabels, tipoLabels } from '@/features/execucao-os/config/labels';
import { ROTULO_DO_TIPO, mostraMiniatura } from '@/features/execucao-os/utils/anexos-da-os';
import { descreverFaixa, foraDaFaixa, formatarLeitura } from '@/utils/leitura';
import { duracaoLegivel, formatarHoras } from '@/utils/horas';
import { formatCurrency } from '@/lib/utils';
import { rotuloDaInstalacao, type InstalacaoDaOrigem } from '@/utils/instalacao';
import { rotuloDoParou } from '@/features/execucao-os/utils/equipamento-parou';

/**
 * O PDF da OS (SN-62), já em texto: o desenho (`src/lib/pdf/ordem-de-servico.tsx`)
 * só posiciona. Montado do conteúdo que a API gravou na finalização — o PDF é
 * aquilo que o código prova, não a OS de agora.
 */

/** Onde o código do PDF é conferido: a página de Execução de OS abre a conferência com ele */
export const urlDeConferencia = (codigo: string, origem = window.location.origin) => `${origem}/execucao-os?conferir=${codigo}`;

/** O código em grupos de 8, para ler e ditar: "1a2b3c4d 5e6f..." */
export const codigoAgrupado = (codigo?: string | null) => (codigo ? codigo.trim().match(/.{1,8}/g)!.join(' ') : '');

/** A foto já reduzida para o PDF */
export interface FotoDoPdf {
  src: string;
  largura: number;
  altura: number;
}

export type Par = [rotulo: string, valor: string];

export interface DocumentoDaOS {
  numero: string;
  descricao: string | null;
  meta: string[];
  /** Prévia, ou finalizada antes do código existir */
  aviso: string | null;
  identificacao: Par[];
  /** Os nomes que vêm do cadastro de hoje, não do conteúdo que o código prova */
  cadastro: Par[];
  textos: { titulo: string; texto: string }[];
  falha: Par[];
  tarefas: { nome: string; situacao: string; quem: string; observacao: string }[];
  checklist: { tarefa: string; itens: { atividade: string; feito: string; leitura: string; observacao: string }[] }[];
  equipe: { nome: string; estimadas: string; trabalhadas: string; presente: string }[];
  totalDaEquipe: string | null;
  materiais: { descricao: string; planejado: string; consumido: string }[];
  ferramentas: { descricao: string; quantidade: string; utilizada: string }[];
  auditoria: Par[];
  fotos: { legenda: string; detalhe: string; foto: FotoDoPdf | null; falha: string | null }[];
  documentos: { nome: string; detalhe: string }[];
  verificacao: { codigo: string; agrupado: string; url: string } | null;
}

/** O que o PDF mostra e não é conteúdo da OS: os nomes do cadastro de hoje */
export interface ExibicaoDaOS {
  planta?: string | null;
  equipamento?: string | null;
  instalacoes?: InstalacaoDaOrigem[];
}

/**
 * No horário de Brasília, sempre: no fuso de quem gera, o mesmo código saía com
 * horários diferentes em Manaus e em São Paulo. O PDF diz o fuso no cabeçalho.
 */
export const FUSO_DO_DOCUMENTO = 'America/Sao_Paulo';
export const quando = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: FUSO_DO_DOCUMENTO }) : '';
const numero = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 3 });
const pares = (lista: [string, string | null | undefined][]): Par[] =>
  lista.filter((p): p is [string, string] => !!p[1]?.trim()).map(([r, v]) => [r, v.trim()]);
const juntar = (...partes: (string | null | undefined)[]) => partes.filter((p) => p?.trim()).join(' · ');

const SITUACAO_DA_TAREFA: Record<string, string> = { CONCLUIDA: 'Feita', CANCELADA: 'Não feita', PENDENTE: 'Pendente' };

const nomeDaTarefa = (t: ConteudoDaOS['tarefas'][number]) => juntar(t.instrucao_tag, t.nome || t.instrucao_nome || 'Tarefa');

function leituraDoItem(item: ConteudoDaOS['checklist'][number]): string {
  if (item.tipo !== 'LEITURA') return '';
  const faixa = { minimo: item.valor_minimo, maximo: item.valor_maximo, unidade: item.unidade };
  if (item.valor_lido === null) return 'sem leitura';
  const lido = formatarLeitura(item.valor_lido, item.unidade);
  return foraDaFaixa(item.valor_lido, faixa) ? `${lido} — fora da faixa (${descreverFaixa(faixa)})` : lido;
}

function situacaoDoItem(item: ConteudoDaOS['checklist'][number]): string {
  if (item.concluida) return juntar('Feito', item.concluida_por, quando(item.concluida_em));
  return item.obrigatoria ? 'Não feito (obrigatório)' : 'Não feito';
}

export function documentoDaOS(
  relatorio: RelatorioDaOS,
  exibicao: ExibicaoDaOS,
  fotos: Map<string, FotoDoPdf | string>,
  urlDeConferencia: string,
): DocumentoDaOS {
  const { os, tarefas, checklist, anexos, equipe, materiais, ferramentas } = relatorio.conteudo;
  const instalacao = rotuloDaInstalacao(exibicao.instalacoes);
  const nomePorTarefa = new Map(tarefas.map((t) => [t.id, nomeDaTarefa(t)]));
  const itemPorId = new Map(checklist.map((c) => [c.id, c]));

  const finalizada = relatorio.status === 'FINALIZADA';
  const aviso = relatorio.previa
    ? 'Prévia: a OS ainda não foi finalizada. O documento final sai na finalização, com o código de verificação.'
    : !relatorio.codigo
      ? 'OS finalizada antes de o código de verificação existir: este documento mostra o conteúdo registrado hoje, sem código.'
      : null;

  // Item sem tarefa (OS antiga) ou de tarefa que não está na OS vai para "Itens gerais"
  const grupoDoItem = (c: ConteudoDaOS['checklist'][number]) => (c.tarefa_os_id && nomePorTarefa.has(c.tarefa_os_id) ? c.tarefa_os_id : null);
  const grupos = [...tarefas.map((t) => t.id), null].map((tarefaId) => ({
    tarefa: tarefaId ? nomePorTarefa.get(tarefaId)! : 'Itens gerais',
    itens: checklist
      .filter((c) => grupoDoItem(c) === tarefaId)
      .map((c) => ({ atividade: c.atividade, feito: situacaoDoItem(c), leitura: leituraDoItem(c), observacao: c.observacoes ?? '' })),
  }));

  const trabalhadas = equipe.filter((t) => t.horas_trabalhadas !== null);
  const estimadas = equipe.reduce((s, t) => s + t.horas_estimadas, 0);
  const real = trabalhadas.reduce((s, t) => s + (t.horas_trabalhadas ?? 0), 0);

  const ondeEsta = (a: ConteudoDaOS['anexos'][number]) => {
    const item = a.checklist_item_id ? itemPorId.get(a.checklist_item_id) : undefined;
    if (item) return item.atividade;
    return a.tarefa_os_id ? nomePorTarefa.get(a.tarefa_os_id) ?? null : 'Geral da OS';
  };
  const detalheDoAnexo = (a: ConteudoDaOS['anexos'][number]) =>
    juntar(a.descricao, a.uploaded_by, quando(a.uploaded_at), a.sha256 ? `SHA-256 ${a.sha256.slice(0, 16)}…` : 'arquivo não encontrado no servidor');
  const imagens = anexos.filter((a) => mostraMiniatura(a.mime_type));

  return {
    numero: os.numero_os,
    descricao: os.descricao,
    meta: [
      `Nº ${os.numero_os}`,
      finalizada && os.finalizada_em ? `Finalizada em ${quando(os.finalizada_em)}` : relatorio.previa ? 'Prévia' : '',
      `Emitido em ${quando(new Date().toISOString())}`,
      'Horários de Brasília',
    ].filter(Boolean),
    aviso,
    identificacao: pares([
      ['Tipo', tipoLabels[os.tipo] ?? os.tipo],
      ['Prioridade', prioridadeLabels[os.prioridade] ?? os.prioridade],
      ['Local', juntar(os.local, os.ativo)],
      ['Responsável', os.responsavel],
      ['Programada para', quando(os.data_hora_programada)],
      ['Início', quando(os.data_hora_inicio_real)],
      ['Fim', quando(os.data_hora_fim_real)],
      // Do conteúdo (a trilha da OS), não da conta de agora
      ['Tempo efetivo', duracaoLegivel(os.tempo_efetivo_minutos) && `${duracaoLegivel(os.tempo_efetivo_minutos)}, sem as pausas`],
    ]),
    cadastro: pares([
      ['Planta', exibicao.planta],
      ['Instalação', instalacao.ausente ? null : instalacao.titulo || instalacao.texto],
      ['Equipamento', exibicao.equipamento],
    ]),
    textos: [
      { titulo: 'Resultado do serviço', texto: os.resultado_servico ?? '' },
      { titulo: 'Problemas encontrados', texto: os.problemas_encontrados ?? '' },
      { titulo: 'Recomendações', texto: os.recomendacoes ?? '' },
      { titulo: 'Incidente de segurança', texto: os.incidentes_seguranca ?? '' },
    ].filter((t) => t.texto.trim()),
    falha: pares([
      ['Equipamento parou', rotuloDoParou(os)],
      ['Parou em', quando(os.parada_inicio)],
      ['Voltou em', quando(os.parada_fim)],
      [
        'Tempo parado',
        os.parada_inicio && os.parada_fim
          ? duracaoLegivel((new Date(os.parada_fim).getTime() - new Date(os.parada_inicio).getTime()) / 60_000)
          : null,
      ],
      ['Sintoma', os.falha_sintoma],
      ['Causa', os.falha_causa],
      ['Ação tomada', os.falha_acao],
    ]),
    tarefas: tarefas.map((t) => ({
      nome: nomeDaTarefa(t),
      situacao: SITUACAO_DA_TAREFA[t.status] ?? t.status,
      quem: juntar(t.concluida_por, quando(t.data_conclusao)),
      // Na tarefa não feita, `observacoes` é o motivo (D2 da execução)
      observacao: t.observacoes ? (t.status === 'CANCELADA' ? `Motivo: ${t.observacoes}` : t.observacoes) : '',
    })),
    checklist: grupos.filter((g) => g.itens.length > 0),
    equipe: equipe.map((t) => ({
      nome: juntar(t.nome || `${t.especialidade} (sem pessoa)`, t.nome ? t.especialidade : null),
      estimadas: formatarHoras(t.horas_estimadas),
      trabalhadas: t.horas_trabalhadas === null ? '—' : formatarHoras(t.horas_trabalhadas),
      presente: t.horas_trabalhadas === null ? '—' : t.presente ? 'Sim' : 'Não',
    })),
    totalDaEquipe:
      equipe.length === 0
        ? null
        : trabalhadas.length > 0
          ? `Horas-homem: ${formatarHoras(Math.round(real * 100) / 100)} (${formatarHoras(estimadas)} previstas)`
          : `Horas-homem não registradas (${formatarHoras(estimadas)} previstas)`,
    materiais: materiais.map((m) => ({
      descricao: juntar(m.descricao, m.observacoes),
      planejado: `${numero(m.quantidade_planejada)} ${m.unidade}`,
      consumido: m.quantidade_consumida === null ? '—' : `${numero(m.quantidade_consumida)} ${m.unidade}`,
    })),
    ferramentas: ferramentas.map((f) => ({
      descricao: juntar(f.descricao, f.observacoes),
      quantidade: numero(f.quantidade),
      utilizada: juntar(
        f.utilizada ? 'Sim' : 'Não',
        f.condicao_antes && `antes: ${f.condicao_antes}`,
        f.condicao_depois && `depois: ${f.condicao_depois}`,
      ),
    })),
    auditoria: pares([
      ['Custo real', os.custo_real ? formatCurrency(os.custo_real) : null],
      ['Nota da auditoria', os.avaliacao_qualidade ? `${os.avaliacao_qualidade} de 5` : null],
      ['Obs. da auditoria', os.observacoes_qualidade],
      // Antes da auditoria, `aprovado_por` é quem aprovou a programação (copiado ao gerar a OS);
      // o auditar o troca pelo auditor
      [os.avaliacao_qualidade ? 'Auditada por' : 'Programação aprovada por', juntar(os.aprovado_por, quando(os.data_aprovacao))],
      ['Finalizada por', juntar(os.finalizado_por, quando(os.finalizada_em))],
    ]),
    fotos: imagens.map((a) => {
      const carregada = fotos.get(a.id);
      return {
        legenda: juntar(ROTULO_DO_TIPO[a.tipo] ?? a.tipo, ondeEsta(a)),
        detalhe: detalheDoAnexo(a),
        foto: typeof carregada === 'object' ? carregada : null,
        // Foto que não entrou no PDF diz por quê — sumir calada parecia que não havia
        falha: typeof carregada === 'object' ? null : (carregada ?? (a.sha256 ? 'não foi possível carregar a foto' : 'arquivo não encontrado no servidor')),
      };
    }),
    documentos: anexos
      .filter((a) => !mostraMiniatura(a.mime_type))
      .map((a) => ({ nome: juntar(a.nome_original, ROTULO_DO_TIPO[a.tipo] ?? a.tipo), detalhe: juntar(ondeEsta(a), detalheDoAnexo(a)) })),
    verificacao: relatorio.codigo
      ? { codigo: relatorio.codigo, agrupado: codigoAgrupado(relatorio.codigo), url: urlDeConferencia }
      : null,
  };
}
