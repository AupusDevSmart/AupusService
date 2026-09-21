// src/features/planos-manutencao/components/PlanoDoEquipamentoContext.tsx
import React from 'react';
import { toast } from '@/hooks/use-toast';
import { formatApiError } from '@/utils/api-error';
import {
  InstrucoesApiService,
  opcaoDaInstrucao,
  type InstrucaoApiResponse,
  type OpcaoDeInstrucao,
} from '@/services/instrucoes.services';
import {
  historicoEquipamentoApi,
  type HistoricoDoEquipamento,
  type SituacaoDaTarefa,
} from '@/services/historico-equipamento.services';
import {
  planosManutencaoApi,
  type PlanoManutencaoApiResponse,
  type PreviaDesvinculoApiResponse,
} from '@/services/planos-manutencao.services';

const instrucoesApi = new InstrucoesApiService();

/**
 * Estado do plano de manutenção de UM equipamento, compartilhado entre as duas
 * partes do sheet.
 *
 * A escolha do plano mora em Dados Básicos e a lista de tarefas é seção
 * própria — dois pontos distintos da árvore do sheet, montados por slots
 * diferentes do shared-pages. Como ambos precisam do mesmo plano atual, e
 * trocar o plano num lado tem que recarregar as tarefas do outro, o estado sobe
 * para cá em vez de ser duplicado (o que renderia duas cargas do mesmo endpoint
 * e uma delas desatualizada depois de vincular).
 */

interface PlanoDoEquipamentoValue {
  planoAtual: PlanoManutencaoApiResponse | null;
  templates: PlanoManutencaoApiResponse[];
  previa: PreviaDesvinculoApiResponse | null;
  instrucoesOptions: OpcaoDeInstrucao[];
  /** Põe no combobox, já selecionável, a instrução recém-cadastrada. */
  registrarInstrucaoCriada: (instrucao: InstrucaoApiResponse) => void;
  /**
   * Ordens e programações que passaram pelo equipamento, e a situação de cada
   * tarefa (última execução, próxima, atraso).
   *
   * Carregado aqui, e não dentro da aba Histórico, porque as duas abas do
   * sheet precisam: a de Tarefas mostra a última execução ao lado de cada
   * tarefa, e a de Histórico mostra o quadro completo. Duas buscas do mesmo
   * endpoint dariam respostas que divergem entre si depois de finalizar uma OS.
   */
  historico: HistoricoDoEquipamento;
  /** A mesma situação, indexada por id de tarefa, para a lista consultar. */
  situacaoPorTarefa: Record<string, SituacaoDaTarefa>;
  carregandoHistorico: boolean;
  erroHistorico: string | null;
  carregando: boolean;
  salvando: boolean;
  /** Sobe a cada vínculo/troca para a lista de tarefas recarregar. */
  refreshTarefas: number;
  ehUC: boolean;
  vincular: (planoId: string) => Promise<void>;
  desvincular: () => Promise<void>;
  recarregar: () => Promise<void>;
  /** Chamado pelos consumidores; ignora repetição do mesmo equipamento. */
  registrar: (equipamentoId: string, classificacao?: string) => void;
  /**
   * Plano escolhido no CADASTRO, antes de existir equipamento. O seletor
   * escreve e a aba de tarefas le, para mostrar o que sera copiado ao salvar.
   */
  planoEscolhidoNoCadastro: string;
  escolherPlanoNoCadastro: (planoId: string) => void;
}

const Ctx = React.createContext<PlanoDoEquipamentoValue | null>(null);

export function PlanoDoEquipamentoProvider({ children }: { children: React.ReactNode }) {
  const [equipamentoId, setEquipamentoId] = React.useState('');
  const [classificacao, setClassificacao] = React.useState<string | undefined>(undefined);

  const [planoAtual, setPlanoAtual] = React.useState<PlanoManutencaoApiResponse | null>(null);
  const [templates, setTemplates] = React.useState<PlanoManutencaoApiResponse[]>([]);
  const [previa, setPrevia] = React.useState<PreviaDesvinculoApiResponse | null>(null);
  const [carregando, setCarregando] = React.useState(true);
  const [salvando, setSalvando] = React.useState(false);
  const [refreshTarefas, setRefreshTarefas] = React.useState(0);
  const [planoEscolhidoNoCadastro, setPlanoEscolhidoNoCadastro] = React.useState('');
  const [instrucoesOptions, setInstrucoesOptions] = React.useState<OpcaoDeInstrucao[]>([]);

  const [historico, setHistorico] = React.useState<HistoricoDoEquipamento>({
    tarefas: [],
    ordens: [],
  });
  // Nasce carregando: entre o mount e a primeira busca a lista está vazia, e
  // com `false` a aba Histórico piscaria "nenhuma tarefa" antes de ter olhado.
  // As duas saídas de `recarregarHistorico` desligam, inclusive a do caso vazio.
  const [carregandoHistorico, setCarregandoHistorico] = React.useState(true);
  const [erroHistorico, setErroHistorico] = React.useState<string | null>(null);

  React.useEffect(() => {
    // `listarTodasAtivas` pagina: pedir uma página de 100 (o teto do DTO)
    // truncava o catálogo em silêncio a partir da 101ª instrução, e a tarefa
    // que apontasse para uma delas aparecia com o combobox em branco.
    instrucoesApi
      .listarTodasAtivas()
      .then((lista) =>
        setInstrucoesOptions(
          lista.filter((inst) => inst.id && inst.nome).map((inst) => opcaoDaInstrucao(inst)),
        ),
      )
      .catch((error) => {
        setInstrucoesOptions([]);
        toast({
          title: 'Erro ao carregar as instruções',
          description: formatApiError(error),
          variant: 'destructive',
        });
      });
  }, []);

  /**
   * A instrução acabou de nascer no cadastro rápido: entra no topo da lista,
   * porque é a que vai ser escolhida em seguida, e sem recarregar o catálogo
   * inteiro só por causa de uma linha.
   */
  const registrarInstrucaoCriada = React.useCallback((instrucao: InstrucaoApiResponse) => {
    const opcao = opcaoDaInstrucao(instrucao);
    setInstrucoesOptions((atuais) => [
      opcao,
      ...atuais.filter((existente) => existente.value !== opcao.value),
    ]);
  }, []);

  const registrar = React.useCallback((id: string, classif?: string) => {
    const limpo = id?.trim() || '';
    setEquipamentoId((atual) => (atual === limpo ? atual : limpo));
    setClassificacao(classif);
  }, []);

  const ehUC = !classificacao || classificacao === 'UC';

  /**
   * Situação das tarefas + ordens que passaram pelo equipamento.
   *
   * Em chamada separada do plano de propósito: não depende do vínculo atual
   * (lê o que foi congelado nas ordens) e uma falha aqui não pode esconder o
   * plano, nem o contrário.
   */
  const recarregarHistorico = React.useCallback(async () => {
    if (!equipamentoId || !ehUC) {
      setHistorico({ tarefas: [], ordens: [] });
      setCarregandoHistorico(false);
      return;
    }

    setCarregandoHistorico(true);
    setErroHistorico(null);
    try {
      setHistorico(await historicoEquipamentoApi.obter(equipamentoId));
    } catch (error) {
      setHistorico({ tarefas: [], ordens: [] });
      setErroHistorico(formatApiError(error));
    } finally {
      setCarregandoHistorico(false);
    }
  }, [equipamentoId, ehUC]);

  // Sem efeito próprio: quem dispara é o `recarregar` abaixo, que roda no mount
  // e a cada mudança de tarefa ou de vínculo. Com os dois, abrir o sheet fazia
  // duas buscas iguais do mesmo endpoint.

  const situacaoPorTarefa = React.useMemo(() => {
    const mapa: Record<string, SituacaoDaTarefa> = {};
    // O id vem aparado do backend; aparar de novo aqui protege a consulta de
    // quem indexar com o id cru da tarefa (Char(26) volta com padding).
    for (const situacao of historico.tarefas) mapa[situacao.id.trim()] = situacao;
    return mapa;
  }, [historico.tarefas]);

  const recarregar = React.useCallback(async () => {
    // Antes do corte por equipamento/classificação: `recarregarHistorico` trata
    // o caso vazio limpando o que tinha, e é ele quem zera a lista ao trocar de
    // equipamento. Mexeu em tarefa ou em vínculo, a situação muda junto — sem
    // isto a aba Tarefas continuaria mostrando a última execução de uma tarefa
    // que acabou de ser trocada. Não é aguardado: as ordens são o bloco de
    // baixo, e travar o plano por elas atrasaria a tela toda.
    void recarregarHistorico();

    if (!equipamentoId || !ehUC) {
      setCarregando(false);
      return;
    }

    setCarregando(true);
    try {
      const [lista, previaAtual] = await Promise.all([
        planosManutencaoApi.listarTemplatesDoEquipamento(equipamentoId),
        planosManutencaoApi.previaDesvinculo(equipamentoId),
      ]);

      setTemplates(lista);
      setPrevia(previaAtual);

      if (previaAtual.possui_plano) {
        // A cópia vinculada, para mostrar nome e origem
        const copia = await planosManutencaoApi.findByEquipamento(equipamentoId).catch(() => null);
        setPlanoAtual(copia);
      } else {
        setPlanoAtual(null);
      }
    } catch (error) {
      console.error('Erro ao carregar plano do equipamento:', error);
      setTemplates([]);
    } finally {
      setCarregando(false);
    }
  }, [equipamentoId, ehUC, recarregarHistorico]);

  React.useEffect(() => {
    recarregar();
  }, [recarregar]);

  /**
   * Vincular COPIA o template para este equipamento, e é nessa cópia que as
   * tarefas dele passam a viver. Trocar o plano substitui a cópia inteira,
   * então o que foi criado ou ajustado só aqui se perde — por isso a
   * confirmação diz o número exato antes de agir.
   */
  const confirmarPerda = React.useCallback((): boolean => {
    const proprias = previa?.tarefas_proprias ?? 0;
    const customizadas = previa?.tarefas_customizadas ?? 0;

    if (proprias === 0 && customizadas === 0) return true;

    const partes: string[] = [];
    if (proprias > 0) partes.push(`${proprias} criada${proprias > 1 ? 's' : ''} neste equipamento`);
    if (customizadas > 0)
      partes.push(`${customizadas} ajustada${customizadas > 1 ? 's' : ''} localmente`);

    return confirm(
      `Isso remove o plano atual deste equipamento e as tarefas dele.\n\n` +
        `Serão perdidas: ${partes.join(' e ')}.\n\nDeseja continuar?`,
    );
  }, [previa]);

  const vincular = React.useCallback(
    async (planoId: string) => {
      if (!planoId) return;
      if (previa?.possui_plano && !confirmarPerda()) return;

      setSalvando(true);
      try {
        const resultado = await planosManutencaoApi.vincular({
          equipamento_id: equipamentoId,
          plano_id: planoId,
        });

        toast({
          title: resultado.substituiu_vinculo_anterior ? 'Plano substituído' : 'Plano vinculado',
          description: `${resultado.tarefas_copiadas} tarefa${resultado.tarefas_copiadas === 1 ? '' : 's'} copiada${resultado.tarefas_copiadas === 1 ? '' : 's'} do plano.`,
        });

        setRefreshTarefas((n) => n + 1);
        await recarregar();
      } catch (error) {
        toast({
          title: 'Erro ao vincular plano',
          description: formatApiError(error),
          variant: 'destructive',
        });
      } finally {
        setSalvando(false);
      }
    },
    [equipamentoId, previa, confirmarPerda, recarregar],
  );

  const desvincular = React.useCallback(async () => {
    if (!confirmarPerda()) return;

    setSalvando(true);
    try {
      await planosManutencaoApi.desvincular(equipamentoId);
      toast({ title: 'Plano desvinculado' });
      setRefreshTarefas((n) => n + 1);
      await recarregar();
    } catch (error) {
      toast({
        title: 'Erro ao desvincular',
        description: formatApiError(error),
        variant: 'destructive',
      });
    } finally {
      setSalvando(false);
    }
  }, [equipamentoId, confirmarPerda, recarregar]);

  const valor: PlanoDoEquipamentoValue = {
    planoAtual,
    templates,
    previa,
    instrucoesOptions,
    registrarInstrucaoCriada,
    historico,
    situacaoPorTarefa,
    carregandoHistorico,
    erroHistorico,
    carregando,
    salvando,
    refreshTarefas,
    ehUC,
    vincular,
    desvincular,
    recarregar,
    registrar,
    planoEscolhidoNoCadastro,
    escolherPlanoNoCadastro: setPlanoEscolhidoNoCadastro,
  };

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

/**
 * Consome o estado e, de quebra, informa ao provider de qual equipamento se
 * trata. Os dois consumidores passam o mesmo id, e o provider ignora repetição.
 */
export function usePlanoDoEquipamento(equipamentoId: string, classificacao?: string) {
  const ctx = React.useContext(Ctx);
  if (!ctx) {
    throw new Error('usePlanoDoEquipamento precisa de <PlanoDoEquipamentoProvider> acima');
  }

  const { registrar } = ctx;
  React.useEffect(() => {
    registrar(equipamentoId, classificacao);
  }, [equipamentoId, classificacao, registrar]);

  return ctx;
}
