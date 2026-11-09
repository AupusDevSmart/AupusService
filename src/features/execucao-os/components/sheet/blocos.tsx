// src/features/execucao-os/components/sheet/blocos.tsx
import { useState, type ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * As peças do sheet da OS (06/nov/2026): seção sem borda — o espaço e o título
 * separam uma da outra (pedido do usuário) — e o dado como texto, rótulo em
 * cima e valor embaixo, no lugar do campo de formulário desabilitado.
 */

interface SecaoProps {
  titulo?: string;
  /** À direita do título: um resumo curto ("3 pessoas · 17h45 previstas") */
  aoLado?: ReactNode;
  children: ReactNode;
}

/** Seção do sheet. Sem título quando o componente de dentro já traz o dele */
export function Secao({ titulo, aoLado, children }: SecaoProps) {
  return (
    <section className="space-y-3" aria-label={titulo}>
      {titulo && (
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-sm font-medium">{titulo}</h3>
          {aoLado && <span className="text-xs text-muted-foreground">{aoLado}</span>}
        </div>
      )}
      {children}
    </section>
  );
}

/** Seção que começa fechada (o histórico): o título é o botão */
export function SecaoRecolhida({ titulo, aoLado, children }: SecaoProps & { titulo: string }) {
  const [aberta, setAberta] = useState(false);
  return (
    <section className="space-y-3" aria-label={titulo}>
      <button type="button" onClick={() => setAberta(!aberta)} aria-expanded={aberta} className="flex w-full items-center gap-1.5 text-left">
        <ChevronRight className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', aberta && 'rotate-90')} aria-hidden />
        <span className="text-sm font-medium">{titulo}</span>
        {aoLado && <span className="ml-auto text-xs text-muted-foreground">{aoLado}</span>}
      </button>
      {aberta && children}
    </section>
  );
}

/** Rótulo e valor; sem valor, nada (a seção não mostra campo vazio) */
export function Dado({ rotulo, valor, largo = false }: { rotulo: string; valor: ReactNode; largo?: boolean }) {
  if (valor === null || valor === undefined || valor === false || (typeof valor === 'string' && !valor.trim())) return null;
  return (
    <div className={cn('min-w-0', largo && 'col-span-full')}>
      <dt className="text-xs text-muted-foreground">{rotulo}</dt>
      <dd className={cn('text-sm text-foreground', largo && 'whitespace-pre-wrap break-words')}>{valor}</dd>
    </div>
  );
}

/** A grade dos dados: duas colunas no celular, três na tela larga */
export function Dados({ children }: { children: ReactNode }) {
  return <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">{children}</dl>;
}
