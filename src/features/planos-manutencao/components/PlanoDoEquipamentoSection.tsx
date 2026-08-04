// src/features/planos-manutencao/components/PlanoDoEquipamentoSection.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Combobox } from '@aupus/shared-pages';
import { ClipboardList, Link2, Unlink, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatApiError } from '@/utils/api-error';
import {
  planosManutencaoApi,
  type PlanoManutencaoApiResponse,
  type PreviaDesvinculoApiResponse,
} from '@/services/planos-manutencao.services';

interface PlanoDoEquipamentoSectionProps {
  equipamentoId: string;
  classificacao?: string;
  somenteLeitura?: boolean;
}

/**
 * Secao de plano de manutencao dentro do sheet do equipamento.
 *
 * O plano e um template de categoria; vincular COPIA o template para este
 * equipamento, e e nessa copia que as tarefas dele passam a viver. Trocar o
 * plano substitui a copia inteira, entao o que foi criado ou ajustado so aqui
 * se perde — por isso a confirmacao diz o numero exato antes de agir.
 */
export function PlanoDoEquipamentoSection({
  equipamentoId,
  classificacao,
  somenteLeitura = false,
}: PlanoDoEquipamentoSectionProps) {
  const [planoAtual, setPlanoAtual] = React.useState<PlanoManutencaoApiResponse | null>(null);
  const [templates, setTemplates] = React.useState<PlanoManutencaoApiResponse[]>([]);
  const [previa, setPrevia] = React.useState<PreviaDesvinculoApiResponse | null>(null);
  const [selecionado, setSelecionado] = React.useState('');
  const [carregando, setCarregando] = React.useState(true);
  const [salvando, setSalvando] = React.useState(false);

  const id = equipamentoId?.trim();
  const ehUC = !classificacao || classificacao === 'UC';

  const carregar = React.useCallback(async () => {
    if (!id || !ehUC) {
      setCarregando(false);
      return;
    }

    setCarregando(true);
    try {
      const [lista, previaAtual] = await Promise.all([
        planosManutencaoApi.listarTemplatesDoEquipamento(id),
        planosManutencaoApi.previaDesvinculo(id),
      ]);

      setTemplates(lista);
      setPrevia(previaAtual);

      if (previaAtual.possui_plano) {
        // A copia vinculada, para mostrar nome e origem
        const copia = await planosManutencaoApi.findByEquipamento(id).catch(() => null);
        setPlanoAtual(copia);
        setSelecionado((copia?.plano_origem_id || '').trim());
      } else {
        setPlanoAtual(null);
        setSelecionado('');
      }
    } catch (error) {
      console.error('Erro ao carregar plano do equipamento:', error);
      setTemplates([]);
    } finally {
      setCarregando(false);
    }
  }, [id, ehUC]);

  React.useEffect(() => {
    carregar();
  }, [carregar]);

  const confirmarPerda = (): boolean => {
    const proprias = previa?.tarefas_proprias ?? 0;
    const customizadas = previa?.tarefas_customizadas ?? 0;

    if (proprias === 0 && customizadas === 0) return true;

    const partes: string[] = [];
    if (proprias > 0) partes.push(`${proprias} criada${proprias > 1 ? 's' : ''} neste equipamento`);
    if (customizadas > 0) partes.push(`${customizadas} ajustada${customizadas > 1 ? 's' : ''} localmente`);

    return confirm(
      `Isso remove o plano atual deste equipamento e as tarefas dele.\n\n` +
        `Serão perdidas: ${partes.join(' e ')}.\n\nDeseja continuar?`,
    );
  };

  const handleVincular = async () => {
    if (!selecionado) return;
    if (previa?.possui_plano && !confirmarPerda()) return;

    setSalvando(true);
    try {
      const resultado = await planosManutencaoApi.vincular({
        equipamento_id: id,
        plano_id: selecionado,
      });

      toast({
        title: resultado.substituiu_vinculo_anterior ? 'Plano substituído' : 'Plano vinculado',
        description: `${resultado.tarefas_copiadas} tarefa${resultado.tarefas_copiadas === 1 ? '' : 's'} copiada${resultado.tarefas_copiadas === 1 ? '' : 's'} do plano.`,
      });

      await carregar();
    } catch (error) {
      toast({
        title: 'Erro ao vincular plano',
        description: formatApiError(error),
        variant: 'destructive',
      });
    } finally {
      setSalvando(false);
    }
  };

  const handleDesvincular = async () => {
    if (!confirmarPerda()) return;

    setSalvando(true);
    try {
      await planosManutencaoApi.desvincular(id);
      toast({ title: 'Plano desvinculado' });
      await carregar();
    } catch (error) {
      toast({
        title: 'Erro ao desvincular',
        description: formatApiError(error),
        variant: 'destructive',
      });
    } finally {
      setSalvando(false);
    }
  };

  if (!ehUC) return null;

  const options = templates
    .filter((t) => t.id)
    .map((t) => ({ value: t.id.trim(), label: t.nome }));

  const planoOrigemAtual = (planoAtual?.plano_origem_id || '').trim();
  const podeAplicar = selecionado && selecionado !== planoOrigemAtual;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <ClipboardList className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">Plano de Manutenção</h3>
      </div>

      {carregando ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : templates.length === 0 ? (
        <div className="border border-dashed rounded-md p-4 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="text-sm text-muted-foreground">
            Nenhum plano disponível para este equipamento. Os planos são criados por{' '}
            <span className="text-foreground">categoria</span>, e só aparecem aqui os da categoria
            do modelo deste equipamento. Se ele ainda não tem modelo definido, não há categoria a
            que se aplicar.
          </div>
        </div>
      ) : (
        <>
          {planoAtual && (
            <div className="border rounded-md p-3 space-y-1">
              <div className="text-sm font-medium">{planoAtual.nome}</div>
              <div className="text-xs text-muted-foreground">
                {previa?.total_tarefas ?? 0} tarefa{(previa?.total_tarefas ?? 0) === 1 ? '' : 's'}
                {(previa?.tarefas_proprias ?? 0) > 0 && ` · ${previa?.tarefas_proprias} própria(s)`}
                {(previa?.tarefas_customizadas ?? 0) > 0 &&
                  ` · ${previa?.tarefas_customizadas} customizada(s)`}
              </div>
            </div>
          )}

          {!somenteLeitura && (
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 min-w-0">
                <Combobox
                  options={options}
                  value={selecionado || undefined}
                  onValueChange={(val) => setSelecionado((val || '').trim())}
                  placeholder="Selecione um plano..."
                  searchPlaceholder="Buscar plano..."
                  emptyText="Nenhum plano encontrado"
                  disabled={salvando}
                />
              </div>

              <Button
                type="button"
                onClick={handleVincular}
                disabled={!podeAplicar || salvando}
                size="sm"
                className="h-9"
              >
                <Link2 className="h-4 w-4 mr-1.5" />
                {planoAtual ? 'Trocar' : 'Vincular'}
              </Button>

              {planoAtual && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDesvincular}
                  disabled={salvando}
                  size="sm"
                  className="h-9 dark:bg-black"
                >
                  <Unlink className="h-4 w-4 mr-1.5" />
                  Desvincular
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
