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
}

const AVISO = 'Número com vírgula e até 4 casas (ex.: 601,25)';

/**
 * Campo de número com vírgula decimal (SN-58). Texto, não `type="number"`: o
 * campo numérico do navegador devolve "" para "12,5" num navegador em inglês
 * ou para "1.234,5", o valor virava null calado e o texto seguia na tela.
 * Aqui o que não dá para ler fica no campo, com aviso, e não grava; vazio
 * apaga (o campo se deixa apagar).
 */
export function CampoDeNumero({ value, onChange, destacar, avisoCurto, onBlur, onKeyDown, ...resto }: CampoDeNumeroProps) {
  const [digitado, setDigitado] = useState(numeroNoCampo(value));
  const [invalido, setInvalido] = useState(false);

  // A volta da API (ou o desfazer depois de erro) troca o valor
  useEffect(() => {
    setDigitado(numeroNoCampo(value));
    setInvalido(false);
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
          const valor = lerNumeroDigitado(digitado);
          setInvalido(valor === undefined);
          if (valor !== undefined && valor !== value) onChange(valor);
          onBlur?.(e);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
          onKeyDown?.(e);
        }}
      />
      {invalido && (
        <span role="alert" className="text-xs text-destructive" title={avisoCurto ? AVISO : undefined}>
          {avisoCurto ? (
            <>
              inválido<span className="sr-only">: {AVISO}</span>
            </>
          ) : (
            AVISO
          )}
        </span>
      )}
    </span>
  );
}
