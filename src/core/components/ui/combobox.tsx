// src/components/ui/combobox.tsx
import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/core/lib/utils"
import { Button } from "@/core/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/core/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/core/components/ui/popover"

export interface ComboboxOption {
  value: string
  label: string
  /** Titulo do bloco na lista. Opcoes sem grupo ficam num bloco sem titulo. */
  grupo?: string
}

/** Agrupa mantendo a ordem em que cada grupo aparece pela primeira vez. */
function emGrupos(options: ComboboxOption[]): [string | undefined, ComboboxOption[]][] {
  const grupos = new Map<string | undefined, ComboboxOption[]>()
  for (const option of options) {
    const lista = grupos.get(option.grupo) ?? []
    lista.push(option)
    grupos.set(option.grupo, lista)
  }
  return [...grupos.entries()]
}

/**
 * Cadastro que cresce: a busca vai para o servidor e a lista carrega a próxima
 * página ao rolar até o fim — mostra TODAS as opções, sem obrigar a pesquisar.
 */
export interface PaginacaoDoCombobox {
  /** O texto digitado (quem chama adia e busca); a lista não filtra de novo. */
  onBuscar: (texto: string) => void
  carregarMais: () => void
  temMais: boolean
  carregando: boolean
  /** O rótulo do valor escolhido quando ele não está nas páginas carregadas. */
  rotuloDoValor?: string
  /** A lista abriu: quem chama só busca a primeira página quando alguém vai escolher. */
  onAbrir?: () => void
}

/** Quantos pixels antes do fim a próxima página já começa a vir. */
const PERTO_DO_FIM = 48

interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  className?: string
  paginacao?: PaginacaoDoCombobox
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Selecione...",
  searchPlaceholder = "Buscar...",
  emptyText = "Nenhum resultado encontrado.",
  disabled = false,
  className,
  paginacao,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const selectedOption = React.useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  )

  const rotulo = selectedOption?.label ?? (value ? paginacao?.rotuloDoValor : undefined)

  const buscar = (texto: string) => {
    setSearch(texto)
    paginacao?.onBuscar(texto)
  }

  const aoRolar = (e: React.UIEvent<HTMLDivElement>) => {
    if (!paginacao?.temMais || paginacao.carregando) return
    const lista = e.currentTarget
    if (lista.scrollHeight - lista.scrollTop - lista.clientHeight < PERTO_DO_FIM) paginacao.carregarMais()
  }

  const filteredOptions = React.useMemo(() => {
    // Paginado, quem filtra é o servidor
    if (!search || paginacao) return options
    return options.filter((option) =>
      option.label.toLowerCase().includes(search.toLowerCase())
    )
  }, [options, search, paginacao])

  return (
    <Popover
      open={open}
      onOpenChange={(aberto) => {
        setOpen(aberto)
        if (aberto) paginacao?.onAbrir?.()
        if (!aberto && search) buscar("")
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal h-9 !rounded",
            !rotulo && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">
            {rotulo ?? placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        // min-w em vez de w: o dropdown acompanha o gatilho, mas cresce quando
        // as opcoes sao mais longas. Com largura fixa, combobox dentro de sheet
        // ou coluna estreita cortava o texto e ficava impossivel de escolher.
        className="min-w-[--radix-popover-trigger-width] w-auto max-w-[min(90vw,36rem)] p-0 rounded-sm"
        align="start"
        onWheel={(e) => e.stopPropagation()}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={buscar}
          />
          <CommandList className="max-h-[300px]" onScroll={paginacao ? aoRolar : undefined}>
            <CommandEmpty>{paginacao?.carregando ? "Carregando..." : emptyText}</CommandEmpty>
            {emGrupos(filteredOptions).map(([grupo, opcoes]) => (
            <CommandGroup key={grupo ?? ''} heading={grupo}>
              {opcoes.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => {
                    onValueChange(option.value === value ? "" : option.value)
                    setOpen(false)
                    if (search) buscar("")
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
            ))}
            {paginacao?.carregando && filteredOptions.length > 0 && (
              <div className="py-2 text-center text-xs text-muted-foreground">Carregando...</div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
