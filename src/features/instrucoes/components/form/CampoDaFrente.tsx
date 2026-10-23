import { useId } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { instrucoesApi } from '@/services/instrucoes.services';
import type { FormFieldProps } from '@/types/base';

/**
 * A frente de trabalho é texto livre, como no AupusProject: o vocabulário não
 * fechou. O que segura a grafia é a sugestão das frentes já usadas
 * (`GET /instrucoes/frentes`), numa lista do próprio navegador. Se a busca
 * falhar, o interceptor da API já avisa, e o campo segue sem sugestão.
 */
export function CampoDaFrente({ value, onChange, disabled }: FormFieldProps) {
  const lista = useId();
  const { data: frentes = [] } = useQuery({
    queryKey: ['instrucoes', 'frentes'],
    queryFn: () => instrucoesApi.frentes(),
    staleTime: 5 * 60 * 1000,
    enabled: !disabled,
  });

  return (
    <>
      <Input
        list={lista}
        maxLength={60}
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={disabled ? undefined : 'Ex.: Elétrica'}
        className="input-minimal"
      />
      <datalist id={lista}>
        {frentes.map((frente) => (
          <option key={frente} value={frente} />
        ))}
      </datalist>
    </>
  );
}
