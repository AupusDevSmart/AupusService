// src/features/execucao-os/components/LeituraDoItem.tsx
import { useEffect, useId, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CampoDeNumero } from '@/components/common/CampoDeNumero';
import { descreverFaixa, formatarLeitura } from '@/utils/leitura';
import type { ItemDoChecklist, MudancaDoItem } from '../utils/progresso-da-execucao';

interface LeituraDoItemProps {
  item: ItemDoChecklist;
  /** Digitar e explicar; sem isso, o registro do que foi lido */
  editavel: boolean;
  /** Grava na API; a mudança já aparece antes da volta */
  onGravar: (mudanca: MudancaDoItem) => void;
  /** Por que ainda não dá para digitar (o item exige foto e não tem) */
  bloqueio?: string | null;
}

/**
 * O passo de leitura do checklist (SN-58): a equipe digita o valor medido, com
 * a unidade e a faixa ao lado. Grava ao sair do campo. Fora da faixa, o item
 * continua feito — a medida é a que é —, mas pede a observação, sem a qual a
 * tarefa não fecha.
 */
export function LeituraDoItem({ item, editavel, onGravar, bloqueio }: LeituraDoItemProps) {
  const idDoCampo = useId();
  const [observacao, setObservacao] = useState(item.observacao ?? '');

  // A volta da API (ou o desfazer depois de erro) troca o item
  useEffect(() => setObservacao(item.observacao ?? ''), [item.observacao]);

  const faixa = descreverFaixa({ minimo: item.minimo, maximo: item.maximo, unidade: item.unidade });

  const gravarObservacao = () => {
    const texto = observacao.trim();
    if (texto === (item.observacao ?? '')) return;
    onGravar({ observacao: texto || null });
  };

  const selo = item.foraDaFaixa && (
    <Badge variant="outline" className="text-[11px] text-destructive">
      Fora da faixa
    </Badge>
  );

  if (!editavel) {
    return (
      <div className="space-y-0.5 py-1 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-foreground">{item.texto}:</span>
          <span className={item.valorLido === null ? 'text-muted-foreground' : 'font-medium text-foreground'}>
            {item.valorLido === null ? 'não lida' : formatarLeitura(item.valorLido, item.unidade)}
          </span>
          {faixa && <span className="text-xs text-muted-foreground">(faixa {faixa})</span>}
          {selo}
        </div>
        {item.observacao && <p className="text-xs text-muted-foreground">Obs.: {item.observacao}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-1.5 py-1 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={idDoCampo} className="text-foreground">
          {item.texto}
          {item.obrigatoria && <span className="text-xs text-muted-foreground"> (obrigatório)</span>}
        </label>
        <div className="flex items-start gap-1.5">
          <CampoDeNumero
            id={idDoCampo}
            value={item.valorLido}
            onChange={(valorLido) => onGravar({ valorLido })}
            destacar={item.foraDaFaixa}
            disabled={!!bloqueio && item.valorLido === null}
            title={bloqueio ?? undefined}
            aria-describedby={faixa ? `${idDoCampo}-faixa` : undefined}
            className="h-8 w-28"
            placeholder="valor lido"
          />
          {item.unidade && <span className="pt-1.5 text-muted-foreground">{item.unidade}</span>}
        </div>
        {faixa && (
          <span id={`${idDoCampo}-faixa`} className="text-xs text-muted-foreground">
            faixa {faixa}
          </span>
        )}
        {selo}
      </div>
      {item.foraDaFaixa && (
        <Input
          aria-label={`Observação da leitura fora da faixa: ${item.texto}`}
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          onBlur={gravarObservacao}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          className="h-8"
          placeholder="Explique a leitura fora da faixa (obrigatório para concluir a tarefa)"
        />
      )}
    </div>
  );
}
