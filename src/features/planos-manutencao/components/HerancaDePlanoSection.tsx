import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/config/api';
import { toast } from '@/hooks/use-toast';
import { formatApiError } from '@/utils/api-error';
import { usePlanoDoEquipamento } from './PlanoDoEquipamentoContext';

interface TarefaHerdada {
  id: string;
  nome: string;
  data_ultima_execucao: string | null;
  data_ancora: string | null;
  numero_execucoes: number;
}

interface PlanoAHerdar {
  template_id: string | null;
  nome: string;
  tarefas: TarefaHerdada[];
}

interface Props {
  equipamentoId: string | null;
  /** Posicao onde o equipamento esta. Sem ela nao ha ocupante anterior. */
  posicaoId?: string | null;
  classificacao?: string;
  somenteLeitura?: boolean;
}

/** `<input type="date">` so aceita YYYY-MM-DD. */
const paraInput = (iso: string | null) => (iso ? iso.slice(0, 10) : '');

/**
 * Oferece ao equipamento novo o plano que o ocupante anterior da posicao tinha.
 *
 * O plano e do EQUIPAMENTO, entao quem entra numa posicao nasce sem nenhum. Mas
 * a posicao nao mudou de funcao: o que se fazia ali continua tendo de ser feito.
 * Sem esta secao, cada troca de equipamento obrigaria a remontar o plano na mao,
 * e quem esquecesse ficaria com uma posicao sem manutencao nenhuma — sem aviso.
 *
 * A heranca e explicita, e nao automatica, por causa das DATAS. Uma preventiva
 * semestral feita ha 3 meses no equipamento antigo pode ter sido feita ha 5 no
 * novo, ou nunca. Copiar as datas junto produziria vencimento errado em
 * silencio, que e pior do que nao herdar: ninguem confere um agendamento que
 * parece certo.
 */
export function HerancaDePlanoSection({
  equipamentoId, posicaoId, classificacao, somenteLeitura,
}: Props) {
  const { planoAtual, recarregar } = usePlanoDoEquipamento(equipamentoId ?? '', classificacao);

  const [heranca, setHeranca] = React.useState<PlanoAHerdar | null>(null);
  const [datas, setDatas] = React.useState<Record<string, string>>({});
  const [carregando, setCarregando] = React.useState(false);
  const [herdando, setHerdando] = React.useState(false);

  const posicao = posicaoId?.trim();

  React.useEffect(() => {
    if (!posicao) { setHeranca(null); return; }

    let cancelado = false;
    setCarregando(true);
    api.get(`/ativos-funcionais/${posicao}/plano-a-herdar`)
      .then(resp => {
        if (cancelado) return;
        const dados: PlanoAHerdar | null = resp.data?.data ?? resp.data ?? null;
        setHeranca(dados);
        // As datas do equipamento ANTIGO entram como ponto de partida, nao como
        // resposta: e mais rapido corrigir uma data errada do que digitar todas.
        setDatas(
          Object.fromEntries(
            (dados?.tarefas ?? []).map(t => [t.id, paraInput(t.data_ultima_execucao)]),
          ),
        );
      })
      .catch(() => { if (!cancelado) setHeranca(null); })
      .finally(() => { if (!cancelado) setCarregando(false); });

    return () => { cancelado = true; };
  }, [posicao]);

  // So faz sentido oferecer para quem ainda nao tem plano. Com plano vinculado,
  // herdar seria substituir — decisao diferente, que tem o seletor proprio.
  if (!equipamentoId || classificacao !== 'UC' || somenteLeitura) return null;
  if (planoAtual || carregando || !heranca?.template_id) return null;

  const herdar = async () => {
    setHerdando(true);
    try {
      const { data } = await api.post('/planos-manutencao/herdar', {
        ativo_funcional_id: posicao,
        equipamento_id: equipamentoId.trim(),
        ajustes: heranca.tarefas.map(t => ({
          tarefa_id: t.id,
          // Campo vazio vira nulo: a tarefa entra sem data e aparece como
          // pendente de definicao, em vez de herdar uma data que nao vale.
          data_ultima_execucao: datas[t.id] ? new Date(datas[t.id]).toISOString() : null,
        })),
      });
      const r = data?.data ?? data;
      toast({
        title: 'Plano herdado',
        description: `${r?.tarefas_copiadas ?? 0} tarefas copiadas, ${r?.datas_aplicadas ?? 0} com data definida.`,
      });
      await recarregar();
    } catch (error) {
      toast({
        title: 'Não foi possível herdar o plano',
        description: formatApiError(error),
        variant: 'destructive',
      });
    } finally {
      setHerdando(false);
    }
  };

  return (
    <div className="space-y-3 rounded-md border p-4">
      <div className="flex items-start gap-2">
        <Sparkles className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <div className="text-sm min-w-0">
          <p className="font-medium">O equipamento anterior desta posição tinha um plano</p>
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">{heranca.nome}</span>
            {' — '}confira quando cada tarefa foi feita <span className="font-medium text-foreground">neste</span>{' '}
            equipamento. Em branco, ela entra sem data.
          </p>
        </div>
      </div>

      <ul className="space-y-1.5">
        {heranca.tarefas.map(t => (
          <li key={t.id} className="flex items-center justify-between gap-3">
            <span className="text-sm truncate min-w-0" title={t.nome}>{t.nome}</span>
            <input
              type="date"
              className="h-8 px-2 rounded-md border bg-background text-sm shrink-0"
              value={datas[t.id] ?? ''}
              onChange={e => setDatas(d => ({ ...d, [t.id]: e.target.value }))}
            />
          </li>
        ))}
      </ul>

      <Button type="button" size="sm" onClick={herdar} disabled={herdando}>
        {herdando ? (
          <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Herdando...</>
        ) : 'Herdar plano'}
      </Button>
    </div>
  );
}
