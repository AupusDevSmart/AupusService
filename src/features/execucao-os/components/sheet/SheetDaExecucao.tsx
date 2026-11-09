// src/features/execucao-os/components/sheet/SheetDaExecucao.tsx
import { useEffect, useState } from 'react';
import { ComentariosDoRegistro } from '@/features/comentarios/components/ComentariosDoRegistro';
import { toast } from '@/hooks/use-toast';
import { formatApiError } from '@/utils/api-error';
import { acoesDisponiveis, statusDaExecucao, type TemPermissao } from '../../config/actions-config';
import { montarProgresso, tarefasPendentes, type ProgressoDaExecucao } from '../../utils/progresso-da-execucao';
import { custoDoMaterialUsado, materiaisDaExecucao, type MaterialUsado } from '../../utils/recursos-usados';
import { maoDeObraDasHoras, outrosDoPainel } from '../../utils/custo-ate-agora';
import { ActionConfirmPanel, type DadosDaConfirmacao, type PendingAction, type RascunhoDoExecutar } from '../ActionConfirmPanel';
import { AcoesDaOS } from '../AcoesDaOS';
import { BotaoPdfDaOS } from '../BotaoPdfDaOS';
import { OQueFoiFeito } from '../OQueFoiFeito';
import { RecursosUsados } from '../RecursosUsados';
import { AnexosDaOS } from '../AnexosDaOS';
import { CustosDaOS } from '../CustosDaOS';
import { ConcluirExecucao } from '../ConcluirExecucao';
import { HistoricoOSCard } from '../HistoricoOSCard';
import { Secao, SecaoRecolhida } from './blocos';
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
}

const EM_ANDAMENTO = ['EM_EXECUCAO', 'PAUSADA'];
const EXECUTADA = ['EXECUTADA', 'AUDITADA', 'FINALIZADA'];

/**
 * O sheet da OS (06/nov/2026, revisão com o usuário): uma ordem só, em qualquer
 * status, e cada seção aparece quando tem o que mostrar.
 *
 *   Resumo · Ações · O que foi feito · Materiais e ferramentas · Equipe ·
 *   Viatura · Fotos e documentos · Resultado · Avaliação · Custos ·
 *   Comentários · Histórico · Verificação · Concluir a execução
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
}: SheetDaExecucaoProps) {
  const status = statusDaExecucao(os);
  const emAndamento = EM_ANDAMENTO.includes(status ?? '');
  const executada = EXECUTADA.includes(status ?? '');
  const podeExecutar = temPermissao('execucao_os.manage', 'execucao_os.executar');

  // As tarefas e o checklist vivos: "O que foi feito" grava item a item, e o
  // concluir precisa saber o que ainda está pendente
  const [progresso, setProgresso] = useState<ProgressoDaExecucao>(() => montarProgresso(os.tarefas_os ?? [], os.checklist ?? []));
  // O material registrado agora e o que o painel de concluir tem digitado: o custo até agora
  const [materiaisVivos, setMateriaisVivos] = useState<MaterialUsado[] | null>(null);
  const [rascunho, setRascunho] = useState<RascunhoDoExecutar | null>(null);
  useEffect(() => {
    setProgresso(montarProgresso(os.tarefas_os ?? [], os.checklist ?? []));
    setMateriaisVivos(null);
  }, [os]);

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

  const custos = os.custos ? (
    <CustosDaOS
      osId={os.id}
      status={status ?? ''}
      custos={os.custos}
      itensOrcamento={os.itens_orcamento}
      aoVivo={
        emAndamento
          ? {
              // O material da OS lida é a base: a seção de materiais só avisa quando muda
              material: custoDoMaterialUsado(materiaisVivos ?? materiaisDaExecucao(os.materiaisConsumidos ?? [])),
              maoDeObra: rascunho ? maoDeObraDasHoras(rascunho.horas, os.tecnicos) : null,
              outros: rascunho && os.itens_orcamento ? outrosDoPainel(rascunho.outros) : null,
            }
          : null
      }
      // Na auditada, só quem gerencia: o auditor aprovou um custo (a API recusa igual)
      podeCorrigir={status === 'AUDITADA' ? temPermissao('execucao_os.manage') : podeExecutar}
      onCorrigido={onRecarregar}
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
            podeInformarValorDaHora={temPermissao('execucao_os.manage')}
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

      <EquipeDaOS os={os} status={status} />
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
            podeInformarValorDaHora={temPermissao('execucao_os.manage')}
            bloqueado={pendingAction && !concluindo ? 'Termine ou feche a ação aberta no topo antes de concluir.' : undefined}
            onRascunho={setRascunho}
            custos={custos}
          />
        </Secao>
      )}
    </div>
  );
}
