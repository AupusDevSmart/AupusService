import * as React from "react"
import { format, parse, isValid } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarIcon, AlertCircle } from "lucide-react"

import { cn } from "@/core/lib/utils"
import { Button } from "@/core/components/ui/button"
import { Input } from "@/core/components/ui/input"
import { Calendar } from "@/core/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/core/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/core/components/ui/tooltip"

interface DateTimePickerProps {
  date?: Date
  setDate: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

/**
 * Hora proposta quando a pessoa escolhe o dia antes da hora: a proxima meia
 * hora a partir de agora.
 *
 * Este picker ja foi so de data e zerava a hora de proposito (`setHours(0)`),
 * embora servisse todos os campos `datetime-local` do sistema. Toda
 * programacao nascia para 00:00, e a tabela mostrava isso como se fosse o
 * combinado. Meia-noite nao e um palpite neutro — e um horario plausivel e
 * quase sempre errado.
 */
function horaSugerida(): string {
  const agora = new Date()
  const minutos = agora.getHours() * 60 + agora.getMinutes()
  const proxima = Math.min(Math.ceil((minutos + 1) / 30) * 30, 23 * 60 + 30)
  return `${String(Math.floor(proxima / 60)).padStart(2, "0")}:${String(proxima % 60).padStart(2, "0")}`
}

function comHora(dia: Date, hora: string): Date {
  const [h, m] = hora.split(":").map((n) => parseInt(n, 10))
  const resultado = new Date(dia)
  resultado.setHours(Number.isNaN(h) ? 0 : h, Number.isNaN(m) ? 0 : m, 0, 0)
  return resultado
}

export function DateTimePicker({
  date,
  setDate,
  placeholder = "dd/mm/aaaa",
  className,
  disabled = false,
}: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date)
  const [inputValue, setInputValue] = React.useState<string>(
    date ? format(date, "dd/MM/yyyy") : ""
  )
  const [timeValue, setTimeValue] = React.useState<string>(
    date ? format(date, "HH:mm") : ""
  )
  const [isOpen, setIsOpen] = React.useState(false)
  const [isInvalid, setIsInvalid] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState("")

  React.useEffect(() => {
    if (date) {
      setSelectedDate(date)
      setInputValue(format(date, "dd/MM/yyyy"))
      setTimeValue(format(date, "HH:mm"))
      setIsInvalid(false)
      setErrorMessage("")
    } else {
      setSelectedDate(undefined)
      setInputValue("")
      setTimeValue("")
      setIsInvalid(false)
      setErrorMessage("")
    }
  }, [date])

  /** Escolher o dia preserva a hora ja escolhida. */
  const aplicarDia = (dia: Date) => {
    const hora = timeValue || horaSugerida()
    const completa = comHora(dia, hora)
    setTimeValue(hora)
    setSelectedDate(completa)
    setDate(completa)
  }

  const handleDateSelect = (newDate: Date | undefined) => {
    if (!newDate) {
      setSelectedDate(undefined)
      setDate(undefined)
      setInputValue("")
      setIsInvalid(false)
      setErrorMessage("")
      return
    }

    aplicarDia(newDate)
    setInputValue(format(newDate, "dd/MM/yyyy"))
    setIsInvalid(false)
    setErrorMessage("")
    setIsOpen(false)
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hora = e.target.value
    setTimeValue(hora)
    // Sem dia ainda, a hora fica guardada e entra quando o dia for escolhido
    if (selectedDate && hora) {
      const completa = comHora(selectedDate, hora)
      setSelectedDate(completa)
      setDate(completa)
    }
  }

  const formatDateInput = (value: string): string => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, "")

    // Formata conforme o usuário digita
    if (numbers.length <= 2) {
      return numbers
    } else if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2)}`
    } else {
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`
    }
  }

  const validateDate = (dateString: string): { isValid: boolean; message: string } => {
    // Se está vazio, não é erro
    if (dateString.length === 0) {
      return { isValid: true, message: "" }
    }

    // Se está incompleto
    if (dateString.length > 0 && dateString.length < 10) {
      return { isValid: false, message: "Data incompleta. Use o formato dd/mm/aaaa" }
    }

    // Se tem 10 caracteres, validar a data
    if (dateString.length === 10) {
      const parsedDate = parse(dateString, "dd/MM/yyyy", new Date())

      if (!isValid(parsedDate)) {
        return { isValid: false, message: "Data inválida" }
      }

      // Validações adicionais
      const parts = dateString.split("/")
      const day = parseInt(parts[0], 10)
      const month = parseInt(parts[1], 10)
      const year = parseInt(parts[2], 10)

      if (day < 1 || day > 31) {
        return { isValid: false, message: "Dia inválido. Use um valor entre 01 e 31" }
      }

      if (month < 1 || month > 12) {
        return { isValid: false, message: "Mês inválido. Use um valor entre 01 e 12" }
      }

      if (year < 1900 || year > 2100) {
        return { isValid: false, message: "Ano inválido. Use um valor entre 1900 e 2100" }
      }
    }

    return { isValid: true, message: "" }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDateInput(e.target.value)
    setInputValue(formatted)

    // Validar a data em tempo real
    const validation = validateDate(formatted)

    if (!validation.isValid) {
      setIsInvalid(true)
      setErrorMessage(validation.message)
    } else {
      setIsInvalid(false)
      setErrorMessage("")

      // Tentar parsear a data se estiver completa e válida
      if (formatted.length === 10) {
        const parsedDate = parse(formatted, "dd/MM/yyyy", new Date())

        if (isValid(parsedDate)) {
          aplicarDia(parsedDate)
        }
      } else if (formatted.length === 0) {
        // Se apagou tudo, limpar a data
        setSelectedDate(undefined)
        setDate(undefined)
      }
    }
  }

  const handleInputBlur = () => {
    // Validar quando o usuário sai do campo
    const validation = validateDate(inputValue)

    if (!validation.isValid && inputValue.length > 0) {
      // Manter o erro visível
      setIsInvalid(true)
      setErrorMessage(validation.message)
    }
  }

  return (
    <TooltipProvider>
      <div className={cn("flex gap-1 items-center", className)}>
        <div className="flex-1 relative min-w-0">
          <Tooltip open={isInvalid && errorMessage.length > 0}>
            <TooltipTrigger asChild>
              <Input
                type="text"
                placeholder={placeholder}
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                disabled={disabled}
                className={cn(
                  "w-full",
                  isInvalid && "border-red-500 focus-visible:ring-red-500 pr-9"
                )}
                maxLength={10}
              />
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="bg-red-600 text-white border-red-700"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>{errorMessage}</span>
              </div>
            </TooltipContent>
          </Tooltip>

          {isInvalid && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
              <AlertCircle className="h-4 w-4 text-red-500" />
            </div>
          )}
        </div>

        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={disabled}
              aria-label="Abrir calendário"
              className={cn(
                "h-9 w-9 shrink-0",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              initialFocus
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>

        <Input
          type="time"
          value={timeValue}
          onChange={handleTimeChange}
          disabled={disabled}
          aria-label="Hora"
          className="w-[6.5rem] shrink-0"
        />
      </div>
    </TooltipProvider>
  )
}
