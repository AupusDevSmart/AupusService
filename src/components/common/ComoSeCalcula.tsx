// src/components/common/ComoSeCalcula.tsx
import { Calculator, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

/** Um número (ou um bloco) e as frases que dizem de onde ele sai */
export interface Explicacao {
  rotulo: string;
  linhas: string[];
}

/**
 * O ícone de informação, pequeno e apagado, que abre como o número ao lado é
 * calculado (o padrão do painel de manutenção: a fórmula visível sem poluir a
 * tela). Popover, não dica: a dica do Radix não abre por toque e fecha no clique.
 */
export function DicaDaConta({ rotulo, linhas, className = 'h-3 w-3' }: Explicacao & { className?: string }) {
  if (linhas.length === 0) return null;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center rounded-sm text-muted-foreground hover:text-foreground"
          aria-label={`Como se calcula: ${rotulo}`}
          title="Como se calcula"
        >
          <Info className={className} />
        </button>
      </PopoverTrigger>
      {/* O Esc fecha só a legenda: o sheet de baixo (BaseModal) escuta o Esc no document e fecharia junto */}
      <PopoverContent className="w-80 space-y-1.5 p-3 text-xs" onEscapeKeyDown={(e) => e.stopPropagation()}>
        {linhas.map((linha) => (
          <p key={linha}>{linha}</p>
        ))}
      </PopoverContent>
    </Popover>
  );
}

/**
 * O botão discreto "Como se calcula" que abre, num painel lateral, todas as
 * contas de uma tela de uma vez — quem quer saber de onde sai um número acha
 * tudo num lugar só, e a tela fica limpa.
 */
export function PainelComoSeCalcula({ descricao, secoes }: { descricao: string; secoes: { titulo: string; itens: Explicacao[] }[] }) {
  const presentes = secoes.map((s) => ({ ...s, itens: s.itens.filter((i) => i.linhas.length > 0) })).filter((s) => s.itens.length > 0);
  if (presentes.length === 0) return null;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground" title="Como cada número é calculado">
          <Calculator className="mr-1 h-3.5 w-3.5" />
          Como se calcula
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full max-w-md flex-col gap-0 p-0" onEscapeKeyDown={(e) => e.stopPropagation()}>
        <div className="border-b px-5 py-4 pr-12">
          <SheetTitle className="text-base">Como se calcula</SheetTitle>
          <SheetDescription className="text-xs">{descricao}</SheetDescription>
        </div>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-4 text-xs">
          {presentes.map((secao) => (
            <section key={secao.titulo}>
              <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{secao.titulo}</h3>
              <dl className="space-y-3">
                {secao.itens.map((item) => (
                  <div key={item.rotulo} className="min-w-0">
                    <dt className="font-medium text-foreground">{item.rotulo}</dt>
                    {item.linhas.map((linha) => (
                      <dd key={linha} className="mt-0.5 text-muted-foreground">
                        {linha}
                      </dd>
                    ))}
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
