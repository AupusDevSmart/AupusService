// src/features/programacao-os/components/PrazoDaOrigem.tsx
import { useEffect, useState } from 'react';
import { AlertTriangle, CalendarClock } from 'lucide-react';

interface PrazoDaOrigemProps {
  tipo?: string;
  anomaliaId?: string;
  solicitacaoId?: string;
  /** A data em que se pretende terminar. É ela que se compara com o prazo. */
  previsaoFim?: string;
}

/**
 * O prazo que a origem impõe, mostrado na hora de agendar.
 *
 * Sem isto, o prazo da anomalia só pintava uma célula de vermelho numa lista que
 * ninguém abre para programar — a cobrança não alcançava o momento da decisão.
 * Dava para agendar para o dia 30 uma anomalia que vence dia 25 e nada avisava.
 *
 * Lido AO VIVO, e não congelado na programação: prazo é compromisso, e se
 * alguém o estende, o que vale é o novo. Congelar mostraria uma data que já não
 * é verdade.
 *
 * Avisa, não impede. Às vezes não dá mesmo para cumprir — e uma trava faria a
 * pessoa contornar pelo caminho errado, tirando do sistema a informação de que
 * aquela OS nasceu atrasada.
 *
 * Plano não entra: periodicidade não é prazo. O plano diz de quanto em quanto
 * tempo, não até quando.
 */
export function PrazoDaOrigem({
  tipo,
  anomaliaId,
  solicitacaoId,
  previsaoFim,
}: PrazoDaOrigemProps) {
  const [prazo, setPrazo] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    const buscar = async (): Promise<string | null> => {
      if (tipo === 'ANOMALIA' && anomaliaId) {
        const { anomaliasService } = await import('@/services/anomalias.service');
        const anomalia = await anomaliasService.findOne(anomaliaId.trim());
        return (anomalia as { prazo?: string }).prazo ?? null;
      }

      if (tipo === 'SOLICITACAO_SERVICO' && solicitacaoId) {
        const { solicitacoesServicoService } = await import(
          '@/services/solicitacoes-servico.service'
        );
        const solicitacao = await solicitacoesServicoService.findOne(solicitacaoId.trim());
        return (solicitacao as { data_necessidade?: string }).data_necessidade ?? null;
      }

      return null;
    };

    void buscar()
      // Prazo é contexto: falhar em buscá-lo não pode travar a programação.
      .catch(() => null)
      .then((achado) => {
        if (!cancelado) setPrazo(achado);
      });

    return () => {
      cancelado = true;
    };
  }, [tipo, anomaliaId, solicitacaoId]);

  if (!prazo) return null;

  const limite = new Date(prazo);
  if (Number.isNaN(limite.getTime())) return null;

  const fim = previsaoFim ? new Date(previsaoFim) : null;
  const estoura = fim && !Number.isNaN(fim.getTime()) && fim.getTime() > limite.getTime();

  const quando = limite.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const rotulo = tipo === 'ANOMALIA' ? 'Esta anomalia' : 'Esta solicitação';

  return (
    <div
      className={`flex items-start gap-2 text-sm ${
        estoura ? 'text-red-600 dark:text-red-500' : 'text-muted-foreground'
      }`}
    >
      {estoura ? (
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <CalendarClock className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      <span>
        {rotulo} precisa estar resolvida até <strong>{quando}</strong>
        {estoura && ' — a previsão de término passa desse prazo.'}
      </span>
    </div>
  );
}
