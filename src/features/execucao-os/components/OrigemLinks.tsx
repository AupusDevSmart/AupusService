// src/features/execucao-os/components/OrigemLinks.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ClipboardList, FileText, ExternalLink } from 'lucide-react';
import { AnomaliaViewSheet } from '@/features/anomalias/components/AnomaliaViewSheet';
import { InstrucoesModal } from '@/features/instrucoes/components/InstrucoesModal';
import { instrucoesFormFields } from '@/features/instrucoes/config/form-config';
import { instrucoesApi } from '@/services/instrucoes.services';
import { toast } from '@/hooks/use-toast';
import { formatApiError } from '@/utils/api-error';

/**
 * Atalhos da OS para a entidade que a originou.
 *
 * A origem e o que diz POR QUE a OS existe e O QUE deve ser feito, mas ate
 * aqui ela era so um rotulo. Estes botoes abrem o sheet da entidade por cima
 * do sheet da OS — sem navegar, para nao perder o que estiver preenchido numa
 * OS em execucao.
 *
 * Anomalia e instrucao carregam sozinhas a partir do id: embutir a entidade
 * inteira no payload da OS engordaria a resposta para um dado que a maioria
 * dos usuarios nunca abre.
 */

interface OrigemLinksProps {
  anomaliaId?: string | null;
  /** Instrucao da tarefa: e nela que vivem etapas, recursos e anexos. */
  instrucaoId?: string | null;
  instrucaoRotulo?: string | null;
  /** Abre o plano; quem controla o sheet e a pagina, que ja o tem montado. */
  onVerPlano?: () => void;
  planoNome?: string | null;
}

export function OrigemLinks({
  anomaliaId,
  instrucaoId,
  instrucaoRotulo,
  onVerPlano,
  planoNome,
}: OrigemLinksProps) {
  const [anomaliaAberta, setAnomaliaAberta] = useState(false);
  const [instrucao, setInstrucao] = useState<unknown>(null);
  const [carregandoInstrucao, setCarregandoInstrucao] = useState(false);

  const abrirInstrucao = async () => {
    const id = instrucaoId?.trim();
    if (!id) return;

    setCarregandoInstrucao(true);
    try {
      setInstrucao(await instrucoesApi.findOne(id));
    } catch (error) {
      toast({
        title: 'Erro ao abrir a instrução',
        description: formatApiError(error),
        variant: 'destructive',
      });
    } finally {
      setCarregandoInstrucao(false);
    }
  };

  const temAlgum = !!(anomaliaId || instrucaoId || onVerPlano);
  if (!temAlgum) return null;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {anomaliaId && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 dark:bg-black"
            onClick={() => setAnomaliaAberta(true)}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Ver anomalia
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </Button>
        )}

        {onVerPlano && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 dark:bg-black"
            onClick={onVerPlano}
            title={planoNome || undefined}
          >
            <ClipboardList className="h-3.5 w-3.5" />
            Ver plano
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </Button>
        )}

        {instrucaoId && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 dark:bg-black"
            onClick={abrirInstrucao}
            disabled={carregandoInstrucao}
            title={instrucaoRotulo || undefined}
          >
            <FileText className="h-3.5 w-3.5" />
            {carregandoInstrucao ? 'Abrindo...' : 'Ver instrução'}
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </Button>
        )}
      </div>

      <AnomaliaViewSheet
        anomaliaId={anomaliaId}
        isOpen={anomaliaAberta}
        onClose={() => setAnomaliaAberta(false)}
      />

      {instrucao && (
        <InstrucoesModal
          isOpen
          mode="view"
          entity={instrucao as never}
          formFields={instrucoesFormFields}
          pendingFiles={[]}
          onClose={() => setInstrucao(null)}
          onSubmit={async () => {}}
          onFilesChange={() => {}}
        />
      )}
    </>
  );
}
