// src/features/solicitacoes-servico/components/BdiPadraoSheet.tsx
import { useEffect, useState } from 'react';
import { Percent } from 'lucide-react';
import { toast } from 'sonner';
import { BaseModal } from '@/core';
import type { FormField, FormFieldProps } from '@/types/base';
import { formatApiError } from '@/utils/api-error';
import { componentesDe, percentualNaTela, propostaApi, type ComponentesDoBdi } from '@/services/proposta.services';
import { ComponentesDoBdiCampos } from './ComponentesDoBdi';

const campos: FormField[] = [
  {
    key: 'componentes',
    label: '',
    type: 'custom',
    colSpan: 2,
    render: ({ value, onChange }: FormFieldProps) => (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Vale para as solicitações novas. As que já existem ficam com o BDI que têm, e cada proposta se ajusta no
          fechamento dela.
        </p>
        <ComponentesDoBdiCampos value={value as ComponentesDoBdi} onChange={onChange} />
      </div>
    ),
  },
];

interface BdiPadraoSheetProps {
  aberto: boolean;
  onClose: () => void;
}

/**
 * O BDI padrão da empresa (28/out/2026): o lugar de configurar o BDI, que era
 * fixo na tabela GOINFRA (30,44%). A solicitação nova copia daqui; trocar o
 * padrão não reescreve proposta já feita — pode já ter ido ao cliente.
 */
export function BdiPadraoSheet({ aberto, onClose }: BdiPadraoSheetProps) {
  const [padrao, setPadrao] = useState<ComponentesDoBdi | null>(null);

  useEffect(() => {
    if (!aberto) {
      setPadrao(null);
      return;
    }
    let cancelado = false;
    propostaApi
      .obterBdiPadrao()
      .then((lido) => {
        if (!cancelado) setPadrao(componentesDe(lido));
      })
      .catch((erro) => {
        if (cancelado) return;
        toast.error('Não foi possível ler o BDI padrão', { description: formatApiError(erro) });
        onClose();
      });
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto]);

  if (!aberto || !padrao) return null;

  const salvar = async (dados: Record<string, unknown>) => {
    const componentes = componentesDe((dados.componentes as ComponentesDoBdi | undefined) ?? padrao);
    try {
      const salvo = await propostaApi.salvarBdiPadrao(componentes);
      toast.success(`BDI padrão em ${percentualNaTela(salvo.bdi_percentual)}%`, { description: 'Vale para as solicitações novas.' });
      onClose();
    } catch (erro) {
      toast.error('Não foi possível salvar o BDI padrão', { description: formatApiError(erro) });
      throw erro;
    }
  };

  return (
    <BaseModal
      isOpen
      mode="edit"
      entity={{ id: 'bdi-padrao', componentes: padrao }}
      title="BDI padrão"
      icon={<Percent className="h-4 w-4 md:h-5 md:w-5 text-primary" />}
      formFields={campos}
      onClose={onClose}
      onSubmit={salvar}
      width="w-full max-w-[95vw] sm:max-w-[90vw] md:max-w-[640px]"
    />
  );
}
