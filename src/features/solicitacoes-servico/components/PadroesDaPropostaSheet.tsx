// src/features/solicitacoes-servico/components/PadroesDaPropostaSheet.tsx
import { useEffect, useState } from 'react';
import { Percent } from 'lucide-react';
import { toast } from 'sonner';
import { BaseModal } from '@/core';
import type { FormField, FormFieldProps } from '@/types/base';
import { CampoDeNumero } from '@/components/common/CampoDeNumero';
import { formatApiError } from '@/utils/api-error';
import { lerQuantidadeDigitada } from '@/utils/leitura';
import { propostaApi, type PadroesDaProposta } from '@/services/proposta.services';

const AVISO_DE_PERCENTUAL = 'Percentual de 0 a 100, com vírgula e até 3 casas (ex.: 6,5)';

/** Fora de 0 a 100 é ilegível, como na API */
const lerPercentual = (texto: string) => {
  const valor = lerQuantidadeDigitada(texto);
  return typeof valor === 'number' && (valor < 0 || valor > 100) ? undefined : valor;
};

const CAMPOS: { campo: keyof PadroesDaProposta; rotulo: string; dica: string }[] = [
  { campo: 'imposto_percentual', rotulo: 'Imposto', dica: 'Sobre o faturamento da Aupus' },
  { campo: 'margem_percentual', rotulo: 'Margem', dica: 'Sobre o preço dos serviços' },
  { campo: 'adm_servicos_percentual', rotulo: 'Administração dos serviços', dica: 'Sobre o custo dos serviços da Aupus' },
  { campo: 'adm_fd_percentual', rotulo: 'Administração do faturamento direto', dica: 'Sobre o que o cliente paga ao fornecedor' },
];

function CamposDosPadroes({ value, onChange }: { value: PadroesDaProposta; onChange: (padroes: PadroesDaProposta) => void }) {
  const fecha = value.imposto_percentual + value.margem_percentual < 100;
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Valem para as solicitações novas. As que já existem ficam com os seus, e cada proposta se ajusta no fechamento dela.
      </p>
      <div className="space-y-2">
        {CAMPOS.map(({ campo, rotulo, dica }) => (
          <label key={campo} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex flex-col">
              <span>{rotulo}</span>
              <span className="text-xs text-muted-foreground">{dica}</span>
            </span>
            <span className="flex items-center gap-1">
              <CampoDeNumero
                className="h-8 w-20 text-right"
                value={value[campo]}
                onChange={(valor) => onChange({ ...value, [campo]: valor ?? 0 })}
                ler={lerPercentual}
                aviso={AVISO_DE_PERCENTUAL}
                avisoCurto
                aria-label={`${rotulo} (%)`}
              />
              <span className="text-xs text-muted-foreground">%</span>
            </span>
          </label>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {fecha
          ? 'Preço dos serviços = custo ÷ (1 − imposto − margem). A administração leva só o imposto: ela já é receita da Aupus.'
          : <span className="text-destructive">O imposto e a margem somam 100% ou mais: o preço não fecha.</span>}
      </p>
    </div>
  );
}

const campos: FormField[] = [
  {
    key: 'padroes',
    label: '',
    type: 'custom',
    colSpan: 2,
    render: ({ value, onChange }: FormFieldProps) => <CamposDosPadroes value={value as PadroesDaProposta} onChange={onChange} />,
  },
];

interface PadroesDaPropostaSheetProps {
  aberto: boolean;
  onClose: () => void;
}

/**
 * Os percentuais padrão da proposta (29/out/2026, no lugar do BDI padrão):
 * imposto, margem e as duas administrações. A solicitação nova copia daqui;
 * trocar não reescreve proposta já feita — pode já ter ido ao cliente.
 */
export function PadroesDaPropostaSheet({ aberto, onClose }: PadroesDaPropostaSheetProps) {
  const [padroes, setPadroes] = useState<PadroesDaProposta | null>(null);

  useEffect(() => {
    if (!aberto) {
      setPadroes(null);
      return;
    }
    let cancelado = false;
    propostaApi
      .obterPadroes()
      .then((lidos) => !cancelado && setPadroes(lidos))
      .catch((erro) => {
        if (cancelado) return;
        toast.error('Não foi possível ler os percentuais padrão', { description: formatApiError(erro) });
        onClose();
      });
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto]);

  if (!aberto || !padroes) return null;

  const salvar = async (dados: Record<string, unknown>) => {
    const novos = (dados.padroes as PadroesDaProposta | undefined) ?? padroes;
    if (novos.imposto_percentual + novos.margem_percentual >= 100) {
      toast.error('O imposto e a margem somam 100% ou mais', { description: 'O preço não fecha.' });
      throw new Error('percentuais que não fecham');
    }
    try {
      await propostaApi.salvarPadroes(novos);
      toast.success('Percentuais padrão salvos', { description: 'Valem para as solicitações novas.' });
      onClose();
    } catch (erro) {
      toast.error('Não foi possível salvar os percentuais padrão', { description: formatApiError(erro) });
      throw erro;
    }
  };

  return (
    <BaseModal
      isOpen
      mode="edit"
      entity={{ id: 'padroes-da-proposta', padroes }}
      title="Percentuais da proposta"
      icon={<Percent className="h-4 w-4 md:h-5 md:w-5 text-primary" />}
      formFields={campos}
      onClose={onClose}
      onSubmit={salvar}
      width="w-full max-w-[95vw] sm:max-w-[90vw] md:max-w-[560px]"
    />
  );
}
