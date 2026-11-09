// src/features/execucao-os/components/sheet/SecoesDeLeitura.tsx
import { Badge } from '@/components/ui/badge';
import { formatarHoras, duracaoLegivel } from '@/utils/horas';
import { rotuloDaInstalacao } from '@/utils/instalacao';
import { formatarDiaDaReserva } from '@/features/reservas/utils/dia-da-reserva';
import { rotuloDoParou } from '@/features/execucao-os/utils/equipamento-parou';
import { nomeDaLinha } from '@/features/execucao-os/utils/horas-da-equipe';
import { prioridadeLabels, statusLabels, tipoLabels } from '../../config/labels';
import type { ExecucaoOS } from '../../types';
import { AvaliacaoEstrelas } from '../AvaliacaoEstrelas';
import { OrigemOSCardWrapper, type OSDaOrigem } from '../OrigemOSCardWrapper';
import { Dado, Dados, Secao } from './blocos';
import { dataHora, texto } from './formato';

/**
 * As seções de leitura do sheet da OS (06/nov/2026): o que antes era o
 * formulário desabilitado (campos cinza que não se digitavam), agora texto.
 * Cada dado só aparece com valor, e cada seção só com algum dado.
 */

/** A OS como o transform a entrega: os campos crus da API e os já legíveis */
export type OSDoSheet = ExecucaoOS & {
  tempoEfetivo?: string;
  hhReal?: string;
  hh_estimado?: number;
  tempo_efetivo_minutos?: number | null;
  tempo_efetivo_lido_em?: number;
  codigoVerificacao?: string;
  finalizada_em?: string | null;
  incidentes_seguranca?: string | null;
  atividadesRealizadas?: string | null;
  procedimentosSeguidos?: string | null;
  equipamentosSeguranca?: string | null;
  origemCard?: OSDaOrigem;
  reserva_veiculo?: ExecucaoOS['reserva_veiculo'] & { status?: string; km_inicial?: number | null; km_final?: number | null };
};

const DEPOIS_DE_EXECUTAR = ['EXECUTADA', 'AUDITADA', 'FINALIZADA'];

/** O que é a OS: a primeira coisa do sheet, em qualquer status */
export function ResumoDaOS({ os, status }: { os: OSDoSheet; status?: string }) {
  const instalacao = rotuloDaInstalacao(os.instalacoes);
  const cancelada = status === 'CANCELADA';
  return (
    <Secao titulo="Resumo">
      <Dados>
        <Dado rotulo="Status" valor={status ? <Badge variant="outline">{statusLabels[status] ?? status}</Badge> : null} />
        <Dado rotulo="Tipo" valor={os.tipo ? (tipoLabels[os.tipo] ?? os.tipo) : null} />
        <Dado rotulo="Prioridade" valor={os.prioridade ? (prioridadeLabels[os.prioridade] ?? os.prioridade) : null} />
        <Dado rotulo="Planta" valor={texto(os.planta?.nome)} />
        <Dado rotulo="Instalação" valor={instalacao.ausente ? null : instalacao.texto} />
        <Dado rotulo="Equipamento" valor={texto(os.equipamento?.nome) ?? texto(os.ativo)} />
        <Dado rotulo="Programada para" valor={dataHora(os.data_hora_programada)} />
        <Dado rotulo="Responsável" valor={os.responsavel && os.responsavel !== 'Não atribuído' ? os.responsavel : null} />
        <Dado rotulo="Início" valor={dataHora(os.data_hora_inicio_real)} />
        <Dado rotulo="Fim" valor={dataHora(os.data_hora_fim_real)} />
        <Dado rotulo="Tempo efetivo (sem pausas)" valor={texto(os.tempoEfetivo)} />
        <Dado rotulo="Horas-homem" valor={DEPOIS_DE_EXECUTAR.includes(status ?? '') ? texto(os.hhReal) : null} />
        <Dado rotulo="Descrição" valor={texto(os.descricao)} largo />
        {cancelada && <Dado rotulo="Motivo do cancelamento" valor={texto(os.motivo_cancelamento)} largo />}
        {cancelada && <Dado rotulo="Cancelada por" valor={texto(os.finalizado_por)} />}
        <Dado rotulo="Observações da execução" valor={texto(os.observacoes_execucao)} largo />
      </Dados>
      <OrigemOSCardWrapper value={os.origemCard} entity={os as OSDaOrigem} />
    </Secao>
  );
}

/** Quem foi escalado, com as horas previstas; depois de executar, as trabalhadas */
export function EquipeDaOS({ os, status }: { os: OSDoSheet; status?: string }) {
  const tecnicos = os.tecnicos ?? [];
  if (tecnicos.length === 0) return null;
  const executada = DEPOIS_DE_EXECUTAR.includes(status ?? '');
  const previstas = tecnicos.reduce((s, t) => s + (Number(t.horas_estimadas) || 0), 0);
  const trabalhadas = tecnicos.reduce((s, t) => s + (Number(t.horas_trabalhadas) || 0), 0);
  return (
    <Secao
      titulo="Equipe"
      aoLado={`${tecnicos.length} ${tecnicos.length === 1 ? 'pessoa' : 'pessoas'} · ${executada ? `${formatarHoras(trabalhadas)} trabalhadas de ` : ''}${formatarHoras(previstas)} previstas`}
    >
      <ul className="divide-y divide-border">
        {tecnicos.map((t, i) => (
          <li key={t.id ?? i} className="flex flex-wrap items-baseline justify-between gap-x-3 py-2 text-sm">
            <span className="min-w-0">
              {nomeDaLinha(t)}
              {t.nome?.trim() && t.especialidade && <span className="block text-xs text-muted-foreground">{t.especialidade}</span>}
            </span>
            <span className="text-xs text-muted-foreground">
              {executada && t.horas_trabalhadas !== null && t.horas_trabalhadas !== undefined && `${formatarHoras(Number(t.horas_trabalhadas))} trabalhadas · `}
              {`${formatarHoras(Number(t.horas_estimadas) || 0)} previstas`}
            </span>
          </li>
        ))}
      </ul>
      {!executada && <p className="text-xs text-muted-foreground">As horas de quem trabalhou se informam ao concluir a execução.</p>}
    </Secao>
  );
}

/** A reserva de viatura e os KM de saída e retorno */
export function ViaturaDaOS({ os }: { os: OSDoSheet }) {
  const r = os.reserva_veiculo;
  if (!r) return null;
  const veiculo = [r.veiculo?.placa, [r.veiculo?.marca, r.veiculo?.modelo].filter(Boolean).join(' ')].filter(Boolean).join(' · ');
  const periodo = [
    [formatarDiaDaReserva(r.data_inicio), r.hora_inicio].filter(Boolean).join(' '),
    [formatarDiaDaReserva(r.data_fim), r.hora_fim].filter(Boolean).join(' '),
  ]
    .filter(Boolean)
    .join(' até ');
  const km = (v?: number | null) => (v === null || v === undefined ? null : Number(v).toLocaleString('pt-BR'));
  return (
    <Secao titulo="Viatura">
      <Dados>
        <Dado rotulo="Veículo" valor={veiculo || null} />
        <Dado rotulo="Período" valor={periodo || null} />
        <Dado rotulo="KM na saída" valor={km(r.km_inicial)} />
        <Dado rotulo="KM no retorno" valor={km(r.km_final)} />
        <Dado rotulo="Finalidade" valor={texto(r.finalidade)} largo />
      </Dados>
    </Secao>
  );
}

/** O que a execução registrou: aparece depois de executar */
export function ResultadoDaOS({ os, status }: { os: OSDoSheet; status?: string }) {
  if (!DEPOIS_DE_EXECUTAR.includes(status ?? '')) return null;
  const parou = rotuloDoParou(os);
  const comFalha = parou || os.falha_sintoma || os.falha_causa || os.falha_acao;
  return (
    <Secao titulo="Resultado">
      <Dados>
        <Dado rotulo="Resultado do serviço" valor={texto(os.resultado_servico)} largo />
        <Dado rotulo="Problemas encontrados" valor={texto(os.problemas_encontrados)} largo />
        {comFalha && (
          <>
            <Dado rotulo="O equipamento parou?" valor={parou} />
            <Dado rotulo="Parou em" valor={dataHora(os.parada_inicio)} />
            <Dado rotulo="Voltou a funcionar em" valor={dataHora(os.parada_fim)} />
            <Dado rotulo="Tempo parado" valor={duracaoLegivel(os.minutos_parado) || null} />
            <Dado rotulo="Sintoma" valor={texto(os.falha_sintoma)} largo />
            <Dado rotulo="Causa" valor={texto(os.falha_causa)} largo />
            <Dado rotulo="Ação tomada" valor={texto(os.falha_acao)} largo />
          </>
        )}
        <Dado rotulo="Recomendações" valor={texto(os.recomendacoes)} largo />
        <Dado rotulo="Incidente de segurança" valor={texto(os.incidentes_seguranca)} largo />
        {/* Campos de OS antiga: o Executar não os pede mais, e só aparecem se a OS tiver */}
        <Dado rotulo="Próxima manutenção" valor={dataHora(os.proxima_manutencao)} />
        <Dado rotulo="Atividades realizadas" valor={texto(os.atividadesRealizadas)} largo />
        <Dado rotulo="Procedimentos seguidos" valor={texto(os.procedimentosSeguidos)} largo />
        <Dado rotulo="EPIs" valor={texto(os.equipamentosSeguranca)} largo />
      </Dados>
    </Secao>
  );
}

/** A nota da auditoria: aparece depois de auditar */
export function AvaliacaoDaOS({ os, status }: { os: OSDoSheet; status?: string }) {
  if (!['AUDITADA', 'FINALIZADA'].includes(status ?? '') || !os.avaliacao_qualidade) return null;
  return (
    <Secao titulo="Avaliação">
      <AvaliacaoEstrelas valor={Number(os.avaliacao_qualidade)} somenteLeitura />
      <Dados>
        <Dado rotulo="Observações da auditoria" valor={texto(os.observacoes_qualidade)} largo />
      </Dados>
    </Secao>
  );
}

/** Quem finalizou e o código que o PDF leva (SN-62): só na finalizada */
export function VerificacaoDaOS({ os, status }: { os: OSDoSheet; status?: string }) {
  if (status !== 'FINALIZADA') return null;
  return (
    <Secao titulo="Verificação">
      <Dados>
        <Dado rotulo="Finalizada por" valor={texto(os.finalizado_por)} />
        <Dado rotulo="Finalizada em" valor={dataHora(os.finalizada_em)} />
        <Dado rotulo="Aprovada por" valor={texto(os.aprovado_por)} />
        <Dado rotulo="Aprovada em" valor={dataHora(os.data_aprovacao)} />
        <Dado rotulo="Código de verificação" valor={texto(os.codigoVerificacao) ? <span className="font-mono">{os.codigoVerificacao}</span> : null} largo />
      </Dados>
    </Secao>
  );
}
