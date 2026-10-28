// src/features/programacao-os/components/OrigemOSSelector.tsx
import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ExternalLink, FilePenLine, Info, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AssistentePassos, type PassoDoAssistente } from '@/components/common/AssistentePassos';
import { DetalheDaOrigemSheet, type OrigemAberta } from './DetalheDaOrigemSheet';
import { SimpleCascadeSelector } from '@/features/solicitacoes-servico/components/SimpleCascadeSelector';
import { useOrigemDados, type AnomaliaDisponivel, type PlanoDisponivel, type SolicitacaoDisponivel } from '../hooks/useOrigemDados';

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

const alerta = (prioridade: string) => prioridade === 'CRITICA' || prioridade === 'ALTA';

function opcaoDaAnomalia(a: AnomaliaDisponivel): OpcaoDaLista {
  return {
    id: String(a.id).trim(),
    titulo: a.descricao,
    subtitulo: [a.local, a.ativo, a.plantaNome, a.unidadeNome].filter(Boolean).join(' · '),
    etiquetas: [{ texto: a.prioridade, alerta: alerta(a.prioridade) }, { texto: a.status }],
  };
}

function opcaoDaSolicitacao(s: SolicitacaoDisponivel): OpcaoDaLista {
  return {
    id: String(s.id).trim(),
    titulo: s.titulo,
    // Sem planta, o cliente em texto: a linha não fica sem dono (e a busca o acha)
    subtitulo: [s.local, s.tipo, s.plantaNome ?? s.clienteNome, s.unidadeNome, s.solicitanteNome].filter(Boolean).join(' · '),
    etiquetas: [{ texto: s.numero }, { texto: s.prioridade, alerta: alerta(s.prioridade) }],
  };
}

function opcaoDoPlano(p: PlanoDisponivel): OpcaoDaLista {
  return {
    id: String(p.id).trim(),
    titulo: p.nome,
    // Equipamento e instalacao no subtitulo, que e o texto legivel; a planta
    // desce para as etiquetas, em corpo menor. Duas plantas raramente
    // convivem numa mesma decisao — o que separa dois planos parecidos e o
    // ativo e onde ele esta.
    subtitulo: [p.equipamentoNome, p.unidadeNome, `${p.totalTarefas} ${p.totalTarefas === 1 ? 'tarefa' : 'tarefas'}`]
      .filter(Boolean)
      .join(' · '),
    // A busca do servidor alcança a categoria e a planta (SN-77), mesmo em corpo menor
    etiquetas: [{ texto: p.categoria }, ...(p.plantaNome ? [{ texto: p.plantaNome }] : [])],
  };
}

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

  // Só a lista do tipo escolhido busca (SN-77: todas, por rolagem e busca no servidor)
  const { resolverOrigem, guardar, anomalias, planos, solicitacoes, gerarTarefasDoPlano } = useOrigemDados(tipo);
  const anomaliasDisponiveis = anomalias.itens;
  const planosDisponiveis = planos.itens;
  const solicitacoesDisponiveis = solicitacoes.itens;

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

  // ==================== PRÉ-SELEÇÃO DO ATALHO ====================

  // Atalho "Programar" de anomalia, solicitação ou plano do equipamento. A
  // escolha passa pelas mesmas funções do clique: são elas que preenchem planta,
  // unidade, local e ativo — uma pré-seleção por fora deixaria tudo isso vazio.
  const [abrindoOrigem, setAbrindoOrigem] = useState(false);
  const [avisoOrigem, setAvisoOrigem] = useState<string | null>(null);
  const preSelecao = value.preSelecao;

  useEffect(() => {
    if (!preSelecao) return;
    let vivo = true;
    const alvo = preSelecao.id.trim();
    const base: OrigemOSValue = { ...value, tipo: preSelecao.tipo, preSelecao: undefined };

    setAbrindoOrigem(true);
    setAvisoOrigem(null);
    resolverOrigem(preSelecao.tipo, alvo)
      .then((resultado) => {
        if (!vivo) return;
        if ('motivo' in resultado) {
          setAvisoOrigem(resultado.motivo);
          onChange(base);
          setEscolhendo(true);
          setPasso(1);
          return;
        }
        // O item e do tipo pedido: resolverOrigem busca pelo id naquela origem
        const { item } = resultado;
        if (preSelecao.tipo === 'ANOMALIA') escolherAnomalia(alvo, item as AnomaliaDisponivel, base);
        else if (preSelecao.tipo === 'SOLICITACAO_SERVICO') escolherSolicitacao(alvo, item as SolicitacaoDisponivel, base);
        else escolherPlano(alvo, item as PlanoDisponivel, base);
      })
      .finally(() => {
        if (vivo) setAbrindoOrigem(false);
      });

    return () => {
      vivo = false;
    };
    // Só quando o atalho pede outra origem; o resto do valor muda a cada escolha.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preSelecao?.tipo, preSelecao?.id]);

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

  // `item` e `base`: a pre-selecao do atalho escolhe antes de a lista do
  // estado atualizar, e a partir de um valor sem o campo `preSelecao`.
  const escolherAnomalia = (id: string, item?: AnomaliaDisponivel, base: OrigemOSValue = value) => {
    const anomalia = item ?? anomalias.porId(id);
    // Fica no resumo mesmo que a busca ou a página a tirem da lista
    if (anomalia) guardar('ANOMALIA', anomalia);

    onChange({
      ...base,
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

  const escolherSolicitacao = (id: string, item?: SolicitacaoDisponivel, base: OrigemOSValue = value) => {
    const solicitacao = item ?? solicitacoes.porId(id);
    if (solicitacao) guardar('SOLICITACAO_SERVICO', solicitacao);

    onChange({
      ...base,
      solicitacaoServicoId: id || undefined,
      plantaId: solicitacao?.plantaId || '',
      unidadeId: solicitacao?.unidadeId || '',
    });

    if (solicitacao && onLocalAtivoChange) onLocalAtivoChange(solicitacao.local, '');

    if (id) setEscolhendo(false);
  };

  const escolherPlano = (id: string, item?: PlanoDisponivel, base: OrigemOSValue = value) => {
    const plano = item ?? planos.porId(id);
    if (plano) guardar('PLANO_MANUTENCAO', plano);

    onChange({
      ...base,
      planoId: id || undefined,
      tarefasSelecionadas: [],
      // O plano e de um equipamento so, e a OS herda a localizacao dele.
      plantaId: plano?.plantaId || base.plantaId || '',
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

  const opcoesAnomalia = useMemo(() => anomaliasDisponiveis.map(opcaoDaAnomalia), [anomaliasDisponiveis]);
  const opcoesSolicitacao = useMemo(() => solicitacoesDisponiveis.map(opcaoDaSolicitacao), [solicitacoesDisponiveis]);
  const opcoesPlano = useMemo(() => planosDisponiveis.map(opcaoDoPlano), [planosDisponiveis]);

  // ==================== RESUMO ====================

  // Pelo id, e não pelas opções: a busca ou a página podem ter tirado o escolhido da lista
  const anomaliaEscolhida = anomaliaId ? anomalias.porId(anomaliaId) : undefined;
  const solicitacaoEscolhida = solicitacaoId ? solicitacoes.porId(solicitacaoId) : undefined;
  const planoEscolhido = planoId ? planos.porId(planoId) : undefined;

  const escolhido = useMemo((): OpcaoDaLista | null => {
    if (tipo === 'ANOMALIA') return anomaliaEscolhida ? opcaoDaAnomalia(anomaliaEscolhida) : null;
    if (tipo === 'SOLICITACAO_SERVICO') return solicitacaoEscolhida ? opcaoDaSolicitacao(solicitacaoEscolhida) : null;
    if (tipo === 'PLANO_MANUTENCAO' && planoEscolhido && tarefasSelecionadas.length > 0) {
      const plano = opcaoDoPlano(planoEscolhido);
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
  }, [tipo, anomaliaEscolhida, solicitacaoEscolhida, planoEscolhido, tarefasSelecionadas.length]);

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

  // A solicitação sem planta (28/out/2026): a planta e a instalação se escolhem
  // aqui, e a API as grava de volta na solicitação ao criar a programação
  const solicitacaoSemPlanta = tipo === 'SOLICITACAO_SERVICO' && Boolean(solicitacaoEscolhida) && !solicitacaoEscolhida?.plantaId;

  if (escolhido && !escolhendo) {
    return (
      <div className="space-y-3">
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

      {solicitacaoSemPlanta && !disabled && (
        <div className="space-y-2 rounded-md border p-3">
          <p className="text-xs text-muted-foreground">
            {solicitacaoEscolhida?.clienteNome ? `Solicitação de ${solicitacaoEscolhida.clienteNome}, sem planta cadastrada. ` : 'Solicitação sem planta cadastrada. '}
            Escolha onde a OS será feita: a planta e a instalação ficam gravadas também na solicitação.
          </p>
          <SimpleCascadeSelector
            formData={{ planta_id: value.plantaId, unidade_id: value.unidadeId }}
            onChange={() => {}}
            onMultipleChange={(lugar) =>
              onChange({
                ...value,
                plantaId: lugar.planta_id !== undefined ? String(lugar.planta_id ?? '') : value.plantaId,
                unidadeId: String(lugar.unidade_id ?? ''),
              })
            }
          />
        </div>
      )}
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
          loading={anomalias.carregando}
          erro={anomalias.erro}
          paginacao={anomalias.paginacao}
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
          loading={solicitacoes.carregando}
          erro={solicitacoes.erro}
          paginacao={solicitacoes.paginacao}
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
            loading={planos.carregando}
            erro={planos.erro}
            paginacao={planos.paginacao}
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

  const assistente = (
    <AssistentePassos
      passos={passos}
      atual={passo}
      onAtualChange={setPasso}
      disabled={disabled}
      rotuloFinal="Concluir"
      onFinalizar={() => setEscolhendo(false)}
    />
  );

  if (abrindoOrigem) {
    return <p className="py-2 text-sm text-muted-foreground">Abrindo a origem selecionada…</p>;
  }

  if (!avisoOrigem) return assistente;

  return (
    <div className="space-y-3">
      <p className="flex items-start gap-2 rounded-md border px-3 py-2 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{avisoOrigem} Escolha a origem abaixo.</span>
      </p>
      {assistente}
    </div>
  );
}
