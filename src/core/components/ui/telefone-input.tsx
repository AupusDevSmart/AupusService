import React, { forwardRef, useEffect, useState } from 'react';
import { Input } from '@/core/components/ui/input';
import { formatarTelefone, mascararTelefone, telefoneE164 } from '@/core/lib/telefone';

interface TelefoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  /** O telefone como está gravado (E.164) ou o texto que a pessoa digitou. */
  value?: string | null;
  /** E.164 quando o número está completo; senão o que está no campo (a API diz o que falta). */
  onChange: (valor: string) => void;
}

/**
 * Campo de telefone com máscara (SN-46). Mostra `(62) 99999-8888` e entrega ao
 * formulário o número em E.164 assim que ele fica completo — o mesmo formato
 * que a API grava. Antes era texto livre, e no dev havia 12 formatos.
 */
export const TelefoneInput = forwardRef<HTMLInputElement, TelefoneInputProps>(
  ({ value, onChange, placeholder = '(62) 99999-8888', ...props }, ref) => {
    const [exibido, setExibido] = useState(() => formatarTelefone(value));

    // Valor trocado por fora (abrir outro registro): mostra o novo
    useEffect(() => {
      if ((value ?? '') !== (telefoneE164(exibido) ?? exibido)) setExibido(formatarTelefone(value));
      // eslint-disable-next-line react-hooks/exhaustive-deps -- só reage ao valor de fora
    }, [value]);

    const aoDigitar = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Primeiro o número inteiro, como veio: a máscara corta em 11 dígitos e,
      // com o 0 da operadora ou o 55 do país, comia o último dígito e o número
      // errado continuava "válido" (revisão de falha silenciosa)
      const completo = telefoneE164(e.target.value);
      if (completo) {
        setExibido(formatarTelefone(completo));
        onChange(completo);
        return;
      }
      const mascarado = mascararTelefone(e.target.value);
      setExibido(mascarado);
      onChange(telefoneE164(mascarado) ?? mascarado);
    };

    return <Input ref={ref} type="tel" inputMode="tel" autoComplete="tel" value={exibido} onChange={aoDigitar} placeholder={placeholder} {...props} />;
  },
);
TelefoneInput.displayName = 'TelefoneInput';
