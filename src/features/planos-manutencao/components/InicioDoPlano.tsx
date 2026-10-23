import { useQuery } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ROTULO_FREQUENCIA } from '@/features/planos-manutencao/utils/frequencia';
import { planosManutencaoApi, type PrimeiroVencimento } from '@/services/planos-manutencao.services';
import { soRepeteFalhaDeRede, mensagemDoBackend } from '@/utils/api-error';
import { formatarEmBrasilia } from '@/utils/brasilia';

const DIA = /^\d{4}-\d{2}-\d{2}$/;
const DIA_MS = 86_400_000;
/** Os limites da API (5 anos para trás, 1 ano à frente), para o seletor de data não oferecer o que ela recusa. */
const limite = (dias: number) => formatarEmBrasilia(new Date(Date.now() + dias * DIA_MS), 'yyyy-MM-dd');

const frequencia = (t: PrimeiroVencimento) =>
  t.frequencia === 'PERSONALIZADA' && t.frequencia_personalizada
    ? `A cada ${t.frequencia_personalizada} dias`
    : t.frequencia
      ? (ROTULO_FREQUENCIA[t.frequencia] ?? t.frequencia)
      : 'Sem periodicidade';

function Vencimento({ tarefa, semPlanta }: { tarefa: PrimeiroVencimento; semPlanta: boolean }) {
  if (!tarefa.vence_em) return <span className="text-muted-foreground">sem prazo: o gerador não programa</span>;
  const dia = formatarEmBrasilia(tarefa.vence_em, 'dd/MM/yyyy');
  if (tarefa.atrasada) {
    return <span className="text-red-600 dark:text-red-400">venceu em {dia}{semPlanta ? '' : ': sai na primeira rodada do gerador'}</span>;
  }
  return <span>vence em {dia}</span>;
}

interface InicioDoPlanoProps {
  planoId: string;
  /** Sem equipamento (no cadastro), mostra só o vencimento. */
  equipamentoId?: string;
  dataInicio: string;
  onDataInicio: (dia: string) => void;
  disabled?: boolean;
}

/**
 * A data em que o plano começa a contar, ao vincular (SN-53): vira a âncora
 * das tarefas da cópia. Antes de confirmar, o primeiro vencimento de cada
 * tarefa pela regra do gerador — calculado no backend, nunca aqui (a tela já
 * disse "atrasada" com o gerador considerando a tarefa em dia).
 */
export function InicioDoPlano({ planoId, equipamentoId, dataInicio, onDataInicio, disabled }: InicioDoPlanoProps) {
  const valida = DIA.test(dataInicio);
  const previa = useQuery({
    queryKey: ['planos-manutencao', 'primeiros-vencimentos', planoId.trim(), equipamentoId?.trim() ?? null, dataInicio],
    queryFn: () => planosManutencaoApi.primeirosVencimentos(planoId, { data_inicio: dataInicio, equipamento_id: equipamentoId }),
    enabled: !!planoId.trim() && valida,
    retry: soRepeteFalhaDeRede,
  });

  return (
    <div className="space-y-2 rounded-md border border-border p-3">
      <div className="space-y-1">
        <label htmlFor="inicio-do-plano" className="text-sm font-medium">
          Começa a contar em
        </label>
        <Input
          id="inicio-do-plano"
          type="date"
          value={dataInicio}
          onChange={(e) => onDataInicio(e.target.value)}
          min={limite(-5 * 365)}
          max={limite(365)}
          disabled={disabled}
          className="h-9 w-full sm:w-48"
        />
        <p className="text-xs text-muted-foreground">
          A última vez que o plano foi feito neste equipamento, ou hoje se ele começa agora. O primeiro vencimento de cada tarefa conta a partir deste dia.
        </p>
      </div>

      {!valida ? (
        <p className="text-xs text-red-600 dark:text-red-400">Informe a data de início.</p>
      ) : previa.isLoading ? (
        <p className="text-xs text-muted-foreground">Calculando os vencimentos...</p>
      ) : previa.isError ? (
        <p className="text-xs text-red-600 dark:text-red-400">{mensagemDoBackend(previa.error) ?? 'Não foi possível calcular os vencimentos.'}</p>
      ) : previa.data ? (
        <div className="space-y-1">
          {previa.data.com_planta === false && (
            <p className="flex items-start gap-1.5 text-xs text-red-600 dark:text-red-400">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />O equipamento não está em nenhuma planta: o gerador não programa as tarefas.
            </p>
          )}
          <p className="text-xs font-medium text-muted-foreground">Primeiro vencimento</p>
          <ul className="divide-y divide-border text-xs">
            {previa.data.tarefas.map((t) => (
              <li key={t.tarefa_id} className="flex flex-col gap-0.5 py-1.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
                <span className="min-w-0 truncate text-foreground" title={t.nome}>
                  {t.nome} <span className="text-muted-foreground">· {frequencia(t)}</span>
                </span>
                <span className="shrink-0">
                  <Vencimento tarefa={t} semPlanta={previa.data.com_planta === false} />
                </span>
              </li>
            ))}
            {previa.data.tarefas.length === 0 && <li className="py-1.5 text-muted-foreground">O plano não tem tarefas.</li>}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
