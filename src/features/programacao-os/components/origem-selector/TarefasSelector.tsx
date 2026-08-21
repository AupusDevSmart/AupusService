// src/features/programacao-os/components/origem-selector/TarefasSelector.tsx
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { TarefaDisponivel } from './types';

interface TarefasSelectorProps {
  tarefas: TarefaDisponivel[];
  selectedIds: string[];
  onToggle: (tarefaId: string, checked: boolean) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  loading?: boolean;
  disabled?: boolean;
}

/**
 * As tarefas de um plano, para escolher quais entram na OS.
 *
 * Linhas sobre o fundo do sheet, e não `Card` dentro de `Card`. No dark mode o
 * `--card` deste projeto é preto puro sobre um fundo azul-escuro: uma lista de
 * cards virava uma parede de retângulos pretos, e as tarefas sumiam.
 *
 * Os estados vinham de `bg-primary/5`, `bg-muted/30` e `bg-accent/50` — os
 * tokens daqui são `var()` puro, sem canal alpha, então esses modificadores não
 * geram regra nenhuma e o selecionado ficava igual ao não selecionado.
 */
export function TarefasSelector({
  tarefas,
  selectedIds,
  onToggle,
  onSelectAll,
  onDeselectAll,
  loading = false,
  disabled = false,
}: TarefasSelectorProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando tarefas...
      </div>
    );
  }

  if (tarefas.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Este plano não tem tarefas.
      </p>
    );
  }

  const todasMarcadas = selectedIds.length === tarefas.length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {selectedIds.length} de {tarefas.length} selecionadas
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={todasMarcadas ? onDeselectAll : onSelectAll}
          disabled={disabled}
        >
          {todasMarcadas ? 'Limpar' : 'Selecionar todas'}
        </Button>
      </div>

      <div className="max-h-72 space-y-0.5 overflow-y-auto overscroll-contain">
        {tarefas.map((tarefa) => {
          const marcada = selectedIds.includes(tarefa.id);
          const instrucao = tarefa.instrucao;

          const detalhe = [
            instrucao?.tag,
            instrucao?.nome,
            instrucao?.sub_instrucoes?.length
              ? `${instrucao.sub_instrucoes.length} etapa${instrucao.sub_instrucoes.length === 1 ? '' : 's'}`
              : null,
          ]
            .filter(Boolean)
            .join(' · ');

          const etiquetas = [instrucao?.categoria, instrucao?.tipo_manutencao].filter(
            Boolean,
          ) as string[];

          return (
            <label
              key={tarefa.id}
              className={`flex cursor-pointer items-start gap-3 rounded-md px-3 py-2 transition-colors ${
                marcada ? 'bg-muted' : 'hover:bg-muted'
              } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              <Checkbox
                checked={marcada}
                onCheckedChange={(estado) => onToggle(tarefa.id, estado as boolean)}
                disabled={disabled}
                className="mt-0.5"
              />

              <div className="min-w-0 flex-1">
                {etiquetas.length > 0 && (
                  <div className="mb-0.5 flex flex-wrap gap-1.5">
                    {etiquetas.map((etiqueta) => (
                      <span
                        key={etiqueta}
                        className="text-[10px] uppercase tracking-wide text-muted-foreground"
                      >
                        {etiqueta}
                      </span>
                    ))}
                  </div>
                )}

                <p className="truncate text-sm">{tarefa.nome}</p>
                {detalhe && <p className="truncate text-xs text-muted-foreground">{detalhe}</p>}
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
