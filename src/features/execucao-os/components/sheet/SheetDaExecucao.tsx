// src/features/execucao-os/components/sheet/SheetDaExecucao.tsx
import { useEffect, useState } from 'react';
import { ComentariosDoRegistro } from '@/features/comentarios/components/ComentariosDoRegistro';
import { toast } from '@/hooks/use-toast';
import { formatApiError } from '@/utils/api-error';
import { acoesDisponiveis, statusDaExecucao, type TemPermissao } from '../../config/actions-config';
import { montarProgresso, tarefasPendentes, type ProgressoDaExecucao } from '../../utils/progresso-da-execucao';
import { custoDoMaterialUsado, materiaisDaExecucao, type MaterialUsado } from '../../utils/recursos-usados';
import { maoDeObraDasHoras, outrosDoPainel } from '../../utils/custo-ate-agora';
import { tempoEfetivoAgora } from '../../utils/horas-da-equipe';
import { useRascunhoDaExecucao } from '../../hooks/useRascunhoDaExecucao';
import { ActionConfirmPanel, type DadosDaConfirmacao, type PendingAction } from '../ActionConfirmPanel';
import { HorasDaEquipe } from '../HorasDaEquipe';
import { AcoesDaOS } from '../AcoesDaOS';
import { BotaoPdfDaOS } from '../BotaoPdfDaOS';
import { OQueFoiFeito } from '../OQueFoiFeito';
import { RecursosUsados } from '../RecursosUsados';
import { AnexosDaOS } from '../AnexosDaOS';
import { CustosDaOS } from '../CustosDaOS';
import { ConcluirExecucao } from '../ConcluirExecucao';
import { HistoricoOSCard } from '../HistoricoOSCard';
import { Secao, SecaoRecolhida } from './blocos';
import { OutrosCustosDaOS } from './OutrosCustosDaOS';
import {
  AvaliacaoDaOS,
  EquipeDaOS,
  ResultadoDaOS,
  ResumoDaOS,
  VerificacaoDaOS,
  ViaturaDaOS,
  type OSDoSheet,
} from './SecoesDeLeitura';

interface SheetDaExecucaoProps {
  os: OSDoSheet;
  /** A ação escolhida (aqui ou na tabela); null mostra os botões */
  pendingAction: PendingAction | null;
  onAcao: (acao: PendingAction | null) => void;
  onConfirmar: (dados: DadosDaConfirmacao) => Promise<void>;
  temPermissao: TemPermissao;
  ehCliente: boolean;
  /** Relê a OS (o custo real refeito pela API depois de uma correção) */
  onRecarregar: () => Promise<void>;
  /** Comentário digitado e não enviado: o sheet pergunta antes de fechar */
  onRascunhoDoComentario: (tem: boolean) => void;
  /** Horas ou outros custos digitados e ainda não gravados (gravam ao concluir): idem */
  onRascunhoDaExecucao?: (tem: boolean) => void;
}

const EM_ANDAMENTO = ['EM_EXECUCAO', 'PAUSADA'];
const EXECUTADA = ['EXECUTADA', 'AUDITADA', 'FINALIZADA'];

/**
 * O sheet da OS (06/nov/2026, revisão com o usuário): uma ordem só, em qualquer
 * status, e cada seção aparece quando tem o que mostrar.
 *
 *   Resumo · Ações · O que foi feito · Materiais e ferramentas · Equipe ·
 *   Outros custos · Viatura · Fotos e documentos · Resultado · Avaliação ·
 *   Custos · Comentários · Histórico · Verificação · Concluir a execução
 *
 * O real de cada recurso se informa ao lado do previsto, na seção dele
 * (07/nov/2026): material e ferramenta gravam na hora; as horas da equipe e os
 * outros custos gravam ao concluir, que só confere o que falta.
 *
 * Antes eram dois sheets num: caixas no topo e o formulário desabilitado embaixo
 * (campos cinza que não se digitavam), com o que é a OS só depois do trabalho e
 * o mesmo assunto mudando de lugar conforme o status. Sem bordas nas seções: o
 * espaço e o título as separam (pedido do usuário). Nenhuma ação rola o sheet.
 */
export function SheetDaExecucao({
  os,
  pendingAction,
  onAcao,
  onConfirmar,
  temPermissao,
  ehCliente,
  onRecarregar,
  onRascunhoDoComentario,
  onRascunhoDaExecucao,
}: SheetDaExecucaoProps) {
  const status = statusDaExecucao(os);
  const emAndamento = EM_ANDAMENTO.includes(status ?? '');
  const executada = EXECUTADA.includes(status ?? '');
  const podeExecutar = temPermissao('execucao_os.manage', 'execucao_os.executar');

  // As tarefas e o checklist vivos: "O que foi feito" grava item a item, e o
  // concluir precisa saber o que ainda está pendente
  const [progresso, setProgresso] = useState<ProgressoDaExecucao>(() => montarProgresso(os.tarefas_os ?? [], os.checklist ?? []));
  // O material registrado agora: o custo até agora
  const [materiaisVivos, setMateriaisVivos] = useState<MaterialUsado[] | null>(null);
  // As horas e os outros custos digitados nas seções, que o concluir manda
  const rascunho = useRascunhoDaExecucao(os);
  useEffect(() => {
    setProgresso(montarProgresso(os.tarefas_os ?? [], os.checklist ?? []));
    setMateriaisVivos(null);
  }, [os]);
  useEffect(() => {
    onRascunhoDaExecucao?.(emAndamento && rascunho.alterado);
    // Só quando muda: quem recebe guarda numa ref
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emAndamento, rascunho.alterado]);

  // Gravou; a releitura que falha não pode passar calada (o custo real na tela ficaria o de antes)
  const relerDepoisDeGravar = () => {
    onRecarregar().catch((erro: unknown) =>
      toast({ title: 'Salvo, mas a OS não foi relida', description: `Feche e abra a OS para ver o custo novo. ${formatApiError(erro)}`, variant: 'destructive' }),
    );
  };

  const temProgresso = progresso.tarefas.length > 0;
  const pendentes = tarefasPendentes(progresso).map((t) => ({ id: t.id, nome: t.nome }));
  // O Executar fica no fim, depois de tudo: no topo, convidava a concluir antes de marcar
  const concluirNoFim = emAndamento && acoesDisponiveis(status, temPermissao).some((a) => a.acao === 'executar');
  const concluindo = concluirNoFim && pendingAction === 'executar';

  // Material e ferramenta: registra-se em execução e, depois de executar, até a auditoria
  // (a API refaz o custo real); na auditada, só quem gerencia, como os outros custos
  const podeRegistrarUso = emAndamento || status === 'EXECUTADA' ? podeExecutar : status === 'AUDITADA' && temPermissao('execucao_os.manage');
  const soPlanejado = status === 'PENDENTE' || (status === 'CANCELADA' && !os.data_hora_inicio_real);
  const temRecursos = (os.materiaisConsumidos?.length ?? 0) + (os.ferramentasUtilizadas?.length ?? 0) > 0;

  // Quem informa as horas e confere os outros custos: quem executa, com a OS em andamento
  const informaNoSheet = emAndamento && podeExecutar;

  const custos = os.custos ? (
    <CustosDaOS
      status={status ?? ''}
      custos={os.custos}
      aoVivo={
        emAndamento
          ? {
              // O material da OS lida é a base: a seção de materiais só avisa quando muda
              material: custoDoMaterialUsado(materiaisVivos ?? materiaisDaExecucao(os.materiaisConsumidos ?? [])),
              maoDeObra: maoDeObraDasHoras(rascunho.horas, os.tecnicos),
              outros: rascunho.outros ? outrosDoPainel(rascunho.outros) : null,
            }
          : null
      }
    />
  ) : null;

  return (
    <div className="space-y-8">
      <ResumoDaOS os={os} status={status} />

      <Secao>
        {pendingAction && !concluindo ? (
          // As ações curtas (pausar, cancelar, iniciar, auditar...) confirmam aqui mesmo
          <ActionConfirmPanel
            key={pendingAction}
            action={pendingAction}
            entity={os}
            onConfirm={onConfirmar}
            onVoltar={() => onAcao(null)}
            tarefasPendentes={pendentes}
          />
        ) : (
          <div className="space-y-3">
            <AcoesDaOS
              status={status}
              temPermissao={temPermissao}
              onAcao={onAcao}
              ocultar={concluirNoFim ? ['executar'] : []}
              aviso={concluirNoFim ? 'Marque o que foi feito e o que foi usado; para concluir, desça até o fim.' : undefined}
              bloqueadas={concluindo ? 'Feche o painel "Concluir a execução", no fim, para escolher outra ação.' : undefined}
            />
            {/* O PDF da OS (SN-62): prévia antes de finalizar, com o código depois */}
            <BotaoPdfDaOS os={os} />
          </div>
        )}
      </Secao>

      {(emAndamento || executada) && temProgresso && (
        <Secao>
          <OQueFoiFeito status={status} osId={os.id} progresso={progresso} editavel={emAndamento && podeExecutar} onChange={setProgresso} />
        </Secao>
      )}

      {(temRecursos || emAndamento) && (
        <Secao>
          <RecursosUsados
            key={os.id}
            osId={os.id}
            materiais={os.materiaisConsumidos}
            ferramentas={os.ferramentasUtilizadas}
            editavel={Boolean(podeRegistrarUso)}
            soPlanejado={soPlanejado}
            onMateriais={setMateriaisVivos}
            // Depois de executar, a API refaz o custo real: relê a OS para o quadro de custos
            onGravado={executada ? relerDepoisDeGravar : undefined}
          />
        </Secao>
      )}

      {informaNoSheet ? (
        <Secao titulo="Equipe">
          <HorasDaEquipe
            osId={os.id}
            linhas={rascunho.horas}
            onChange={rascunho.setHoras}
            tempoEfetivoMinutos={tempoEfetivoAgora(os)}
            hhEstimado={os.hh_estimado}
            podeInformarValorDaHora={temPermissao('execucao_os.manage')}
          />
        </Secao>
      ) : (
        <EquipeDaOS os={os} status={status} />
      )}

      <OutrosCustosDaOS
        os={os}
        status={status}
        rascunho={rascunho.outros}
        onRascunho={rascunho.setOutros}
        podeConferir={informaNoSheet}
        // Na auditada, só quem gerencia: o auditor aprovou um custo (a API recusa igual)
        podeCorrigir={status === 'AUDITADA' ? temPermissao('execucao_os.manage') : podeExecutar}
        onCorrigido={onRecarregar}
      />

      <ViaturaDaOS os={os} />

      <Secao>
        <AnexosDaOS osId={os.id} status={status} soGerais={(emAndamento || executada) && temProgresso} podeEditar={podeExecutar} />
      </Secao>

      <ResultadoDaOS os={os} status={status} />
      <AvaliacaoDaOS os={os} status={status} />

      {/* Concluindo, o quadro vai para dentro do painel, logo antes do botão */}
      {custos && !concluindo && <Secao>{custos}</Secao>}

      <Secao>
        <ComentariosDoRegistro alvo="ordem_servico" registroId={os.id} podeComentar={podeExecutar} ehCliente={ehCliente} onRascunho={onRascunhoDoComentario} />
      </Secao>

      <SecaoRecolhida titulo="Histórico" aoLado={os.historico?.length ? `${os.historico.length} registros` : undefined}>
        <HistoricoOSCard historico={os.historico} />
      </SecaoRecolhida>

      <VerificacaoDaOS os={os} status={status} />

      {concluirNoFim && (
        <Secao>
          <ConcluirExecucao
            aberto={concluindo}
            onAbrir={() => onAcao('executar')}
            onFechar={() => onAcao(null)}
            entity={os}
            onConfirm={onConfirmar}
            tarefasPendentes={pendentes}
            totalDeTarefas={progresso.tarefas.length}
            horas={rascunho.horas}
            outros={rascunho.outros}
            bloqueado={pendingAction && !concluindo ? 'Termine ou feche a ação aberta no topo antes de concluir.' : undefined}
            custos={custos}
          />
        </Secao>
      )}
    </div>
  );
}
