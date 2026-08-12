// src/features/planos-manutencao/components/PlanoDoEquipamentoContext.tsx
import React from 'react';
import { toast } from '@/hooks/use-toast';
import { formatApiError } from '@/utils/api-error';
import { InstrucoesApiService } from '@/services/instrucoes.services';
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
  instrucoesOptions: Array<{ value: string; label: string }>;
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
  const [instrucoesOptions, setInstrucoesOptions] = React.useState<
    Array<{ value: string; label: string }>
  >([]);

  React.useEffect(() => {
    instrucoesApi
      .findAll({ limit: 100, status: 'ATIVA' as never })
      .then((res) => {
        setInstrucoesOptions(
          (res.data || [])
            .filter((inst) => inst.id && inst.nome)
            .map((inst) => ({
              value: inst.id.trim(),
              label: `${inst.tag ? inst.tag + ' - ' : ''}${inst.nome}`,
            })),
        );
      })
      .catch(() => setInstrucoesOptions([]));
  }, []);

  const registrar = React.useCallback((id: string, classif?: string) => {
    const limpo = id?.trim() || '';
    setEquipamentoId((atual) => (atual === limpo ? atual : limpo));
    setClassificacao(classif);
  }, []);

  const ehUC = !classificacao || classificacao === 'UC';

  const recarregar = React.useCallback(async () => {
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
  }, [equipamentoId, ehUC]);

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
