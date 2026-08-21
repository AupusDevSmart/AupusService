// src/components/common/AssistentePassos.tsx
import { useMemo, type ReactNode } from 'react';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface PassoDoAssistente {
  /** Rótulo curto, mostrado sob o marcador. Uma palavra sempre que der. */
  rotulo: string;
  /** Título da pergunta deste passo. */
  titulo: string;
  conteudo: ReactNode;
  /** Impede avançar enquanto for falso. */
  concluido: boolean;
}

interface AssistentePassosProps {
  passos: PassoDoAssistente[];
  /** Índice do passo visível. Quem usa é dono deste estado. */
  atual: number;
  onAtualChange: (indice: number) => void;
  disabled?: boolean;
  /** Rótulo do botão no último passo. Ausente, o botão some ali. */
  rotuloFinal?: string;
  onFinalizar?: () => void;
}

/**
 * Um passo por vez, com trilha no topo.
 *
 * Substitui as listas empilhadas que o sheet tinha: escolher a origem de uma OS
 * era rolar por três blocos, e a lista interna encadeava a rolagem no modal —
 * chegar ao fim dela jogava a pessoa para o pé do formulário.
 *
 * Com um passo por vez sobra uma pergunta na tela, e a trilha diz onde se está.
 * Voltar é sempre livre; avançar só com o passo concluído, porque um passo
 * incompleto adiante não tem o que mostrar.
 */
export function AssistentePassos({
  passos,
  atual,
  onAtualChange,
  disabled = false,
  rotuloFinal,
  onFinalizar,
}: AssistentePassosProps) {
  const indice = Math.min(Math.max(atual, 0), Math.max(passos.length - 1, 0));
  const passo = passos[indice];

  // O passo mais distante que já dá para alcançar: até o primeiro pendente.
  // Sem isso, a trilha viraria um atalho para telas que ainda não têm conteúdo.
  const alcance = useMemo(() => {
    const pendente = passos.findIndex((p) => !p.concluido);
    return pendente === -1 ? passos.length - 1 : pendente;
  }, [passos]);

  if (!passo) return null;

  const ultimo = indice === passos.length - 1;

  return (
    <div className="space-y-4">
      {/* ---------------- TRILHA ---------------- */}
      <ol className="flex items-center gap-2">
        {passos.map((p, i) => {
          const feito = p.concluido && i < indice;
          const aqui = i === indice;
          const alcancavel = i <= alcance && !disabled;

          return (
            <li key={p.rotulo} className="flex min-w-0 flex-1 items-center gap-2">
              <button
                type="button"
                disabled={!alcancavel}
                onClick={() => onAtualChange(i)}
                className={`flex min-w-0 items-center gap-2 text-left ${
                  alcancavel ? 'cursor-pointer' : 'cursor-default'
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs tabular-nums transition-colors ${
                    aqui
                      ? 'bg-primary text-primary-foreground'
                      : feito
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {feito ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <span
                  className={`hidden truncate text-xs sm:inline ${
                    aqui ? 'font-medium text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {p.rotulo}
                </span>
              </button>

              {/* O traço entre um marcador e o próximo. Não vai depois do último. */}
              {i < passos.length - 1 && (
                <span
                  className={`h-px min-w-4 flex-1 ${i < indice ? 'bg-primary/30' : 'bg-border'}`}
                />
              )}
            </li>
          );
        })}
      </ol>

      {/* ---------------- PASSO ---------------- */}
      <div className="space-y-3">
        <div>
          <p className="text-xs text-muted-foreground">
            Passo {indice + 1} de {passos.length}
          </p>
          <p className="text-sm font-medium">{passo.titulo}</p>
        </div>

        {passo.conteudo}
      </div>

      {/* ---------------- NAVEGAÇÃO ---------------- */}
      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onAtualChange(indice - 1)}
          disabled={indice === 0 || disabled}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Voltar
        </Button>

        {ultimo ? (
          rotuloFinal && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onFinalizar}
              disabled={!passo.concluido || disabled}
            >
              {rotuloFinal}
            </Button>
          )
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onAtualChange(indice + 1)}
            disabled={!passo.concluido || disabled}
          >
            Avançar
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
