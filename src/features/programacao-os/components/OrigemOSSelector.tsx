// src/features/programacao-os/components/OrigemOSSelector.tsx
import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ExternalLink, FilePenLine, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AssistentePassos, type PassoDoAssistente } from '@/components/common/AssistentePassos';
import { DetalheDaOrigemSheet, type OrigemAberta } from './DetalheDaOrigemSheet';
import { useOrigemDados } from '../hooks/useOrigemDados';

import {
  TarefasSelector,
  ListaSelecionavel,
  type OpcaoDaLista,
  type OrigemOSValue,
  type TarefaDisponivel,
  type TipoOrigem,
} from './origem-selector';

interface OrigemOSSelectorProps {
  value: OrigemOSValue;
  onChange: (value: OrigemOSValue) => void;
  onLocalAtivoChange?: (local: string, ativo: string) => void;
  disabled?: boolean;
}

const TIPOS: Array<{
  tipo: TipoOrigem;
  rotulo: string;
  descricao: string;
  Icone: typeof AlertTriangle;
}> = [
  { tipo: 'ANOMALIA', rotulo: 'Anomalia', descricao: 'Problema detectado', Icone: AlertTriangle },
  { tipo: 'PLANO_MANUTENCAO', rotulo: 'Plano', descricao: 'Preventiva ou preditiva', Icone: Settings },
  { tipo: 'SOLICITACAO_SERVICO', rotulo: 'Solicitação', descricao: 'Requisição', Icone: FilePenLine },
];

/**
 * A origem da ordem de serviço, escolhida um passo por vez.
 *
 * Antes eram três blocos empilhados no mesmo scroll do sheet — tipo, busca e
 * lista —, e a lista encadeava a rolagem: chegar ao fim dela continuava rolando
 * o modal atrás e jogava a pessoa para o pé do formulário.
 *
 * Agora há uma pergunta por tela. O número de passos muda com o tipo: anomalia e
 * solicitação terminam em dois, plano tem um terceiro para as tarefas.
 *
 * Completa a escolha, o assistente sai e fica um resumo — quem está preenchendo
 * o resto do formulário precisa ver o que escolheu, não a máquina de escolher.
 */
export function OrigemOSSelector({
  value,
  onChange,
  onLocalAtivoChange,
  disabled = false,
}: OrigemOSSelectorProps) {
  const tipo = value.tipo || 'ANOMALIA';
  const anomaliaId = value.anomaliaId?.toString().trim() || '';
  const planoId = value.planoId?.toString().trim() || '';
  const solicitacaoId = value.solicitacaoServicoId?.toString().trim() || '';
  const tarefasSelecionadas = value.tarefasSelecionadas || [];

  const {
    anomaliasDisponiveis,
    planosDisponiveis,
    solicitacoesDisponiveis,
    carregarAnomalias,
    carregarPlanos,
    carregarSolicitacoes,
    gerarTarefasDoPlano,
    loading,
  } = useOrigemDados();

  const [tarefasDoPlano, setTarefasDoPlano] = useState<TarefaDisponivel[]>([]);
  const [carregandoTarefas, setCarregandoTarefas] = useState(false);
  const [passo, setPasso] = useState(0);

  /**
   * Se a pessoa está no meio da escolha.
   *
   * Não dá para deduzir isso do valor: no fluxo de plano a escolha fica
   * COMPLETA assim que a primeira tarefa é marcada, e as tarefas são múltiplas —
   * deduzir trocava o assistente pelo resumo no primeiro clique, no meio da
   * seleção.
   *
   * Nasce falso para uma OS já salva abrir no resumo, e vira verdadeiro assim
   * que a pessoa entra no assistente.
   */
  const [escolhendo, setEscolhendo] = useState(false);

  // O registro de origem aberto em leitura, por cima de tudo.
  const [detalhe, setDetalhe] = useState<OrigemAberta | null>(null);

  useEffect(() => {
    if (tipo === 'ANOMALIA') carregarAnomalias();
    if (tipo === 'SOLICITACAO_SERVICO') carregarSolicitacoes();
    if (tipo === 'PLANO_MANUTENCAO') carregarPlanos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo]);

  useEffect(() => {
    if (tipo !== 'PLANO_MANUTENCAO' || !planoId) {
      setTarefasDoPlano([]);
      return;
    }

    setCarregandoTarefas(true);
    gerarTarefasDoPlano(planoId)
      .then((tarefas) => setTarefasDoPlano((tarefas || []) as TarefaDisponivel[]))
      .catch(() => setTarefasDoPlano([]))
      .finally(() => setCarregandoTarefas(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planoId, tipo]);

  // ==================== HANDLERS ====================

  const trocarTipo = (novo: TipoOrigem) => {
    onChange({
      tipo: novo,
      plantaId: '',
      unidadeId: '',
      anomaliaId: undefined,
      planoId: undefined,
      solicitacaoServicoId: undefined,
      tarefasSelecionadas: [],
    });
    setEscolhendo(true);
    setPasso(1);
  };

  const escolherAnomalia = (id: string) => {
    const anomalia = anomaliasDisponiveis.find((a) => String(a.id).trim() === id);

    onChange({
      ...value,
      anomaliaId: id || undefined,
      // A planta e a unidade vêm da anomalia: perguntá-las de novo seria pedir
      // que a pessoa repita o que o registro já sabe.
      plantaId: anomalia?.plantaId || '',
      unidadeId: anomalia?.unidadeId || '',
    });

    if (anomalia && onLocalAtivoChange) onLocalAtivoChange(anomalia.local, anomalia.ativo);

    // Último passo do fluxo de anomalia: escolher já é concluir.
    if (id) setEscolhendo(false);
  };

  const escolherSolicitacao = (id: string) => {
    const solicitacao = solicitacoesDisponiveis.find((s) => String(s.id).trim() === id);

    onChange({
      ...value,
      solicitacaoServicoId: id || undefined,
      plantaId: solicitacao?.plantaId || '',
      unidadeId: solicitacao?.unidadeId || '',
    });

    if (solicitacao && onLocalAtivoChange) onLocalAtivoChange(solicitacao.local, '');

    if (id) setEscolhendo(false);
  };

  const escolherPlano = (id: string) => {
    const plano = planosDisponiveis.find((p) => String(p.id).trim() === id);

    onChange({
      ...value,
      planoId: id || undefined,
      tarefasSelecionadas: [],
      // O plano e de um equipamento so, e a OS herda a localizacao dele.
      plantaId: plano?.plantaId || value.plantaId || '',
    });

    if (plano && onLocalAtivoChange) {
      onLocalAtivoChange(
        [plano.plantaNome, plano.unidadeNome].filter(Boolean).join(' / '),
        plano.equipamentoNome || '',
      );
    }

    // O plano NÃO é o fim do fluxo: sem tarefa escolhida não há OS. Escolher o
    // plano leva direto à lista delas, e o assistente segue aberto até
    // "Concluir" — as tarefas são múltiplas, e sair no primeiro clique
    // interromperia a seleção.
    if (id) {
      setEscolhendo(true);
      setPasso(2);
    }
  };

  const alternarTarefa = (tarefaId: string, marcada: boolean) => {
    onChange({
      ...value,
      tarefasSelecionadas: marcada
        ? [...tarefasSelecionadas, tarefaId]
        : tarefasSelecionadas.filter((id) => id !== tarefaId),
    });
  };

  // ==================== OPÇÕES ====================

  const opcoesAnomalia: OpcaoDaLista[] = useMemo(
    () =>
      anomaliasDisponiveis.map((a) => ({
        id: String(a.id).trim(),
        titulo: a.descricao,
        subtitulo: [a.local, a.ativo, a.plantaNome, a.unidadeNome].filter(Boolean).join(' · '),
        etiquetas: [
          { texto: a.prioridade, alerta: a.prioridade === 'CRITICA' || a.prioridade === 'ALTA' },
          { texto: a.status },
        ],
      })),
    [anomaliasDisponiveis],
  );

  const opcoesSolicitacao: OpcaoDaLista[] = useMemo(
    () =>
      solicitacoesDisponiveis.map((s) => ({
        id: String(s.id).trim(),
        titulo: s.titulo,
        subtitulo: [s.local, s.tipo, s.plantaNome, s.unidadeNome, s.solicitanteNome]
          .filter(Boolean)
          .join(' · '),
        etiquetas: [
          { texto: s.numero },
          { texto: s.prioridade, alerta: s.prioridade === 'CRITICA' || s.prioridade === 'ALTA' },
        ],
      })),
    [solicitacoesDisponiveis],
  );

  const opcoesPlano: OpcaoDaLista[] = useMemo(
    () =>
      planosDisponiveis.map((p) => ({
        id: String(p.id).trim(),
        titulo: p.nome,
        // Equipamento e instalacao no subtitulo, que e o texto legivel; a planta
        // desce para as etiquetas, em corpo menor. Duas plantas raramente
        // convivem numa mesma decisao — o que separa dois planos parecidos e o
        // ativo e onde ele esta.
        subtitulo: [
          p.equipamentoNome,
          p.unidadeNome,
          `${p.totalTarefas} ${p.totalTarefas === 1 ? 'tarefa' : 'tarefas'}`,
        ]
          .filter(Boolean)
          .join(' · '),
        // A busca varre titulo, subtitulo E etiquetas, entao a planta continua
        // pesquisavel mesmo em corpo menor.
        etiquetas: [{ texto: p.categoria }, ...(p.plantaNome ? [{ texto: p.plantaNome }] : [])],
      })),
    [planosDisponiveis],
  );

  // ==================== RESUMO ====================

  const escolhido = useMemo(() => {
    if (tipo === 'ANOMALIA' && anomaliaId) {
      return opcoesAnomalia.find((o) => o.id === anomaliaId) ?? null;
    }
    if (tipo === 'SOLICITACAO_SERVICO' && solicitacaoId) {
      return opcoesSolicitacao.find((o) => o.id === solicitacaoId) ?? null;
    }
    if (tipo === 'PLANO_MANUTENCAO' && planoId && tarefasSelecionadas.length > 0) {
      const plano = opcoesPlano.find((o) => o.id === planoId);
      if (!plano) return null;
      return {
        ...plano,
        subtitulo: [
          plano.subtitulo,
          `${tarefasSelecionadas.length} ${tarefasSelecionadas.length === 1 ? 'tarefa' : 'tarefas'}`,
        ]
          .filter(Boolean)
          .join(' · '),
      };
    }
    return null;
  }, [
    tipo,
    anomaliaId,
    solicitacaoId,
    planoId,
    tarefasSelecionadas.length,
    opcoesAnomalia,
    opcoesSolicitacao,
    opcoesPlano,
  ]);

  const rotuloDoTipo = TIPOS.find((t) => t.tipo === tipo)?.rotulo ?? 'Origem';

  // Qual registro o botão de detalhes abre. No plano é o plano em si — as
  // tarefas escolhidas aparecem dentro dele.
  const origemParaDetalhe: OrigemAberta | null =
    tipo === 'ANOMALIA' && anomaliaId
      ? { tipo: 'ANOMALIA', id: anomaliaId }
      : tipo === 'SOLICITACAO_SERVICO' && solicitacaoId
        ? { tipo: 'SOLICITACAO_SERVICO', id: solicitacaoId }
        : tipo === 'PLANO_MANUTENCAO' && planoId
          ? { tipo: 'PLANO_MANUTENCAO', id: planoId }
          : null;

  if (escolhido && !escolhendo) {
    return (
      <div className="flex items-start justify-between gap-3 py-1">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {rotuloDoTipo}
          </p>
          <p className="truncate text-sm font-medium">{escolhido.titulo}</p>
          {escolhido.subtitulo && (
            <p className="truncate text-xs text-muted-foreground">{escolhido.subtitulo}</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {/* Detalhes vale também em leitura: quem só consulta a OS costuma
              querer justamente conferir o que a origem pedia. */}
          {origemParaDetalhe && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title={`Ver ${rotuloDoTipo.toLowerCase()}`}
              onClick={() => setDetalhe(origemParaDetalhe)}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}

          {!disabled && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setEscolhendo(true);
                setPasso(0);
              }}
            >
              Trocar
            </Button>
          )}
        </div>

        <DetalheDaOrigemSheet origem={detalhe} onClose={() => setDetalhe(null)} />
      </div>
    );
  }

  // ==================== PASSOS ====================

  const passoDoTipo: PassoDoAssistente = {
    rotulo: 'Tipo',
    titulo: 'De onde vem esta ordem de serviço?',
    concluido: true,
    conteudo: (
      <div className="grid gap-2 sm:grid-cols-3">
        {TIPOS.map(({ tipo: t, rotulo, descricao, Icone }) => {
          const ativo = tipo === t;

          return (
            // Uma linha por opção. Empilhar ícone, rótulo e descrição deixava
            // três cartões altos e quase vazios; a pergunta do passo já diz o
            // que se está escolhendo, e a descrição cabe no `title`.
            //
            // `bg-primary/10` no ativo não pintava nada: os tokens deste projeto
            // são `var()` puro, sem canal alpha.
            <button
              key={t}
              type="button"
              disabled={disabled}
              title={descricao}
              onClick={() => trocarTipo(t)}
              className={`flex items-center gap-2 rounded-md border px-3 py-2 text-left transition-colors ${
                ativo ? 'border-primary bg-muted' : 'hover:bg-muted'
              } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              <Icone
                className={`h-4 w-4 shrink-0 ${ativo ? 'text-primary' : 'text-muted-foreground'}`}
              />
              <span className="truncate text-sm">{rotulo}</span>
            </button>
          );
        })}
      </div>
    ),
  };

  const passos: PassoDoAssistente[] = [passoDoTipo];

  if (tipo === 'ANOMALIA') {
    passos.push({
      rotulo: 'Anomalia',
      titulo: 'Qual anomalia origina a OS?',
      concluido: Boolean(anomaliaId),
      conteudo: (
        <ListaSelecionavel
          opcoes={opcoesAnomalia}
          value={anomaliaId}
          onChange={escolherAnomalia}
          placeholder="Buscar por descrição, local, ativo, planta ou unidade..."
          vazio="Nenhuma anomalia registrada disponível."
          loading={loading}
          disabled={disabled}
        />
      ),
    });
  }

  if (tipo === 'SOLICITACAO_SERVICO') {
    passos.push({
      rotulo: 'Solicitação',
      titulo: 'Qual solicitação origina a OS?',
      concluido: Boolean(solicitacaoId),
      conteudo: (
        <ListaSelecionavel
          opcoes={opcoesSolicitacao}
          value={solicitacaoId}
          onChange={escolherSolicitacao}
          placeholder="Buscar por número, título, local ou solicitante..."
          vazio="Nenhuma solicitação disponível."
          loading={loading}
          disabled={disabled}
        />
      ),
    });
  }

  if (tipo === 'PLANO_MANUTENCAO') {
    passos.push(
      {
        rotulo: 'Plano',
        titulo: 'Qual plano de manutenção?',
        concluido: Boolean(planoId),
        conteudo: (
          <ListaSelecionavel
            opcoes={opcoesPlano}
            value={planoId}
            onChange={escolherPlano}
            placeholder="Buscar por plano, equipamento, instalação ou planta..."
            vazio="Nenhum plano disponível."
            loading={loading}
            disabled={disabled}
          />
        ),
      },
      {
        rotulo: 'Tarefas',
        titulo: 'Quais tarefas entram nesta OS?',
        concluido: tarefasSelecionadas.length > 0,
        conteudo: (
          <TarefasSelector
            tarefas={tarefasDoPlano}
            selectedIds={tarefasSelecionadas}
            onToggle={alternarTarefa}
            onSelectAll={() =>
              onChange({ ...value, tarefasSelecionadas: tarefasDoPlano.map((t) => t.id) })
            }
            onDeselectAll={() => onChange({ ...value, tarefasSelecionadas: [] })}
            loading={carregandoTarefas}
            disabled={disabled}
          />
        ),
      },
    );
  }

  return (
    <AssistentePassos
      passos={passos}
      atual={passo}
      onAtualChange={setPasso}
      disabled={disabled}
      rotuloFinal="Concluir"
      onFinalizar={() => setEscolhendo(false)}
    />
  );
}
