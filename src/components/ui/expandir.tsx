import * as React from "react"
import { cn } from "@/lib/utils"

export const DURACAO_EXPANDIR_MS = 200

/** Anima a altura com grid-template-rows 0fr → 1fr; mantém montado até a saída terminar. */
export function Expandir({ aberto, children, className }: {
  aberto: boolean; children: React.ReactNode; className?: string
}) {
  const montado = useMontadoAteSair(aberto)
  const [visivel, setVisivel] = React.useState(false)
  React.useEffect(() => {
    if (!aberto) { setVisivel(false); return }
    const id = requestAnimationFrame(() => setVisivel(true))
    return () => cancelAnimationFrame(id)
  }, [aberto])
  if (!montado) return null
  return (
    <div aria-hidden={!aberto} className={cn(
      "grid transition-[grid-template-rows,opacity] duration-200 ease-out",
      visivel ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
      className
    )}>
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  )
}

/** Mantém algo montado por `duracao` ms depois de fechar, para a saída animar. */
// eslint-disable-next-line react-refresh/only-export-components
export function useMontadoAteSair(aberto: boolean, duracao = DURACAO_EXPANDIR_MS) {
  const [montado, setMontado] = React.useState(aberto)
  React.useEffect(() => {
    if (aberto) { setMontado(true); return }
    const id = window.setTimeout(() => setMontado(false), duracao)
    return () => window.clearTimeout(id)
  }, [aberto, duracao])
  return aberto || montado
}

/** Linhas de tabela (não dá para animar a altura de <tr>): entram deslizando e saem sumindo. */
// eslint-disable-next-line react-refresh/only-export-components
export function classesLinhaExpandida(aberto: boolean) {
  return aberto
    ? "animate-in fade-in-0 slide-in-from-top-1 duration-200 fill-mode-both"
    : "animate-out fade-out-0 slide-out-to-top-1 duration-200 fill-mode-forwards"
}

// eslint-disable-next-line react-refresh/only-export-components
export function atrasoLinha(indice: number): React.CSSProperties {
  return { animationDelay: `${Math.min(indice, 8) * 25}ms` }
}
