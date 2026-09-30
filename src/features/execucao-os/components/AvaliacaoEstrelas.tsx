// src/features/execucao-os/components/AvaliacaoEstrelas.tsx
import type { KeyboardEvent } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const ROTULOS = ['Insatisfatório', 'Abaixo do esperado', 'Satisfatório', 'Bom', 'Excelente'];

interface AvaliacaoEstrelasProps {
  valor: number | null | undefined;
  onChange?: (nota: number) => void;
  /** Só mostra a nota (OS auditada/finalizada) */
  somenteLeitura?: boolean;
}

/**
 * Avaliação da qualidade em 5 estrelas. Substitui o select "1 - Insatisfatório
 * … 5 - Excelente" da auditoria e o número cru na OS finalizada.
 *
 * Grupo de rádio de verdade (setas do teclado, leitor de tela), com o rótulo
 * da nota ao lado para não depender só da contagem de estrelas.
 */
export function AvaliacaoEstrelas({ valor, onChange, somenteLeitura = false }: AvaliacaoEstrelasProps) {
  const nota = valor && valor >= 1 && valor <= 5 ? Math.round(valor) : 0;

  if (somenteLeitura) {
    return (
      <div className="flex items-center gap-2" aria-label={`Avaliação: ${nota} de 5`}>
        <div className="flex gap-0.5" aria-hidden>
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              className={cn('h-5 w-5', n <= nota ? 'fill-foreground text-foreground' : 'text-muted-foreground')}
            />
          ))}
        </div>
        {nota > 0 && <span className="text-sm text-muted-foreground">{ROTULOS[nota - 1]}</span>}
      </div>
    );
  }

  const aoTeclar = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!onChange) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      onChange(Math.min(5, (nota || 0) + 1));
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      onChange(Math.max(1, (nota || 2) - 1));
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div role="radiogroup" aria-label="Avaliação da qualidade" tabIndex={0} onKeyDown={aoTeclar} className="flex gap-1 rounded-md outline-none focus-visible:ring-1 focus-visible:ring-ring">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={n === nota}
            aria-label={`${n} estrela${n > 1 ? 's' : ''} — ${ROTULOS[n - 1]}`}
            tabIndex={-1}
            onClick={() => onChange?.(n)}
            className="rounded p-0.5 transition-colors hover:bg-muted"
          >
            <Star className={cn('h-7 w-7', n <= nota ? 'fill-foreground text-foreground' : 'text-muted-foreground')} />
          </button>
        ))}
      </div>
      <span className="text-sm text-muted-foreground">{nota > 0 ? ROTULOS[nota - 1] : 'Escolha de 1 a 5'}</span>
    </div>
  );
}
