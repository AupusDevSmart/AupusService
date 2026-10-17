// src/components/common/CampoDeNumero.tsx
import { useEffect, useState, type ComponentProps } from 'react';
import { Input } from '@/components/ui/input';
import { lerNumeroDigitado, numeroNoCampo } from '@/utils/leitura';

interface CampoDeNumeroProps extends Omit<ComponentProps<typeof Input>, 'value' | 'onChange' | 'type' | 'inputMode'> {
  value: number | null;
  /** Chamado ao sair do campo, só quando o número mudou e dá para ler */
  onChange: (valor: number | null) => void;
  /** Marca o campo como fora do esperado (aria-invalid), além do texto ilegível */
  destacar?: boolean;
  /** Aviso de uma palavra, para campo estreito (a frase inteira fica para o leitor de tela) */
  avisoCurto?: boolean;
  /** Outro formato (as horas do SN-61: "3h30"): como ler o texto, como mostrar o número e o aviso */
  ler?: (texto: string) => number | null | undefined;
  mostrar?: (valor: number | null) => string;
  aviso?: string;
  /**
   * Ao sair do campo, se o texto ficou ilegível. Para quem grava junto com
   * outros campos (o painel do Executar): o texto ilegível fica na tela com o
   * aviso, e confirmar mandaria calado o valor anterior.
   */
  onIlegivel?: (ilegivel: boolean) => void;
}

const AVISO = 'Número com vírgula e até 4 casas (ex.: 601,25)';

/**
 * Campo de número com vírgula decimal (SN-58). Texto, não `type="number"`: o
 * campo numérico do navegador devolve "" para "12,5" num navegador em inglês
 * ou para "1.234,5", o valor virava null calado e o texto seguia na tela.
 * Aqui o que não dá para ler fica no campo, com aviso, e não grava; vazio
 * apaga (o campo se deixa apagar).
 */
export function CampoDeNumero({
  value,
  onChange,
  destacar,
  avisoCurto,
  ler = lerNumeroDigitado,
  mostrar = numeroNoCampo,
  aviso = AVISO,
  onIlegivel,
  onBlur,
  onKeyDown,
  ...resto
}: CampoDeNumeroProps) {
  const [digitado, setDigitado] = useState(mostrar(value));
  const [invalido, setInvalido] = useState(false);

  // A volta da API (ou o desfazer depois de erro) troca o valor
  useEffect(() => {
    setDigitado(mostrar(value));
    setInvalido(false);
    // `mostrar` é função de formato, estável na prática; o valor é o que muda
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span className="inline-flex flex-col gap-0.5">
      <Input
        {...resto}
        inputMode="decimal"
        autoComplete="off"
        value={digitado}
        aria-invalid={invalido || destacar || undefined}
        onChange={(e) => setDigitado(e.target.value)}
        onBlur={(e) => {
          const valor = ler(digitado);
          setInvalido(valor === undefined);
          onIlegivel?.(valor === undefined);
          if (valor !== undefined && valor !== value) onChange(valor);
          // O mesmo número escrito de outro jeito ("3,5" e "3h30") volta no formato do campo
          else if (valor !== undefined) setDigitado(mostrar(valor));
          onBlur?.(e);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
          onKeyDown?.(e);
        }}
      />
      {invalido && (
        <span role="alert" className="text-xs text-destructive" title={avisoCurto ? aviso : undefined}>
          {avisoCurto ? (
            <>
              inválido<span className="sr-only">: {aviso}</span>
            </>
          ) : (
            aviso
          )}
        </span>
      )}
    </span>
  );
}
