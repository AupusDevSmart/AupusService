// src/features/solicitacoes-servico/components/PadroesDaPropostaSheet.tsx
import { useEffect, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { BaseModal } from '@/core';
import type { FormField, FormFieldProps } from '@/types/base';
import { CampoDeNumero } from '@/components/common/CampoDeNumero';
import { formatApiError } from '@/utils/api-error';
import { AVISO_DE_DINHEIRO, dinheiroNoCampo, lerDinheiroDigitado, lerNumeroDigitado, lerQuantidadeDigitada } from '@/utils/leitura';
import { propostaApi, type PadroesDaProposta } from '@/services/proposta.services';

const AVISO_DE_PERCENTUAL = 'Percentual de 0 a 100, com vírgula e até 3 casas (ex.: 6,5)';

/** Fora de 0 a 100 é ilegível, como na API */
const lerPercentual = (texto: string) => {
  const valor = lerQuantidadeDigitada(texto);
  return typeof valor === 'number' && (valor < 0 || valor > 100) ? undefined : valor;
};

/** Horas de 0 a 24, como na API */
const lerHoras = (texto: string) => {
  const valor = lerQuantidadeDigitada(texto);
  return typeof valor === 'number' && (valor < 0 || valor > 24) ? undefined : valor;
};

/** Pessoas por veículo: inteiro de 1 a 50 */
const lerPessoas = (texto: string) => {
  const valor = lerNumeroDigitado(texto);
  if (valor === null || valor === undefined) return valor;
  const inteiro = Math.round(valor);
  return inteiro < 1 || inteiro > 50 ? undefined : inteiro;
};

/** Pessoas padrão: inteiro de 0 (não supor) a 999 */
const lerPessoasPadrao = (texto: string) => {
  const valor = lerNumeroDigitado(texto);
  if (valor === null || valor === undefined) return valor;
  const inteiro = Math.round(valor);
  return inteiro < 0 || inteiro > 999 ? undefined : inteiro;
};

type Campo = keyof PadroesDaProposta;
type Tipo = 'percentual' | 'dinheiro' | 'horas' | 'pessoas' | 'equipe';

const LEITURA: Record<Tipo, { ler: (texto: string) => number | null | undefined; aviso: string; unidade: string; mostrar?: (valor: number | null) => string }> = {
  percentual: { ler: lerPercentual, aviso: AVISO_DE_PERCENTUAL, unidade: '%' },
  dinheiro: { ler: lerDinheiroDigitado, aviso: AVISO_DE_DINHEIRO, unidade: 'R$', mostrar: dinheiroNoCampo },
  horas: { ler: lerHoras, aviso: 'Horas de 0 a 24, com vírgula (ex.: 1,5)', unidade: 'h' },
  pessoas: { ler: lerPessoas, aviso: 'Número inteiro de 1 a 50', unidade: '' },
  equipe: { ler: lerPessoasPadrao, aviso: 'Número inteiro de 0 a 999 (0 = não supor)', unidade: '' },
};

const PERCENTUAIS: { campo: Campo; rotulo: string; dica: string; tipo: Tipo }[] = [
  { campo: 'imposto_percentual', rotulo: 'Imposto', dica: 'Sobre o faturamento da Aupus', tipo: 'percentual' },
  { campo: 'margem_percentual', rotulo: 'Margem', dica: 'Sobre o preço dos serviços', tipo: 'percentual' },
  { campo: 'adm_servicos_percentual', rotulo: 'Administração dos serviços', dica: 'Sobre o custo dos serviços da Aupus', tipo: 'percentual' },
  { campo: 'adm_fd_percentual', rotulo: 'Administração do faturamento direto', dica: 'Sobre o que o cliente paga ao fornecedor', tipo: 'percentual' },
];

const LOGISTICA: { campo: Campo; rotulo: string; dica: string; tipo: Tipo }[] = [
  { campo: 'valor_km', rotulo: 'Km rodado', dica: 'Por km de cada veículo', tipo: 'dinheiro' },
  { campo: 'horas_por_100_km', rotulo: 'Tempo de estrada', dica: 'Horas a cada 100 km', tipo: 'horas' },
  { campo: 'bate_volta_horas', rotulo: 'Bate-volta até', dica: 'Horas de ida; acima disso, a equipe dorme no local', tipo: 'horas' },
  { campo: 'interno_percentual', rotulo: 'Deslocamento interno', dica: 'Da ida e volta, quando não digitado', tipo: 'percentual' },
  { campo: 'pessoas_padrao', rotulo: 'Pessoas', dica: 'Quando a proposta não diz (0 = não supor)', tipo: 'equipe' },
  { campo: 'pessoas_por_veiculo', rotulo: 'Pessoas por veículo', dica: 'Os veículos são as pessoas ÷ isto, para cima', tipo: 'pessoas' },
  { campo: 'cafe_valor', rotulo: 'Café da manhã', dica: 'Por pessoa, a cada noite fora', tipo: 'dinheiro' },
  { campo: 'almoco_valor', rotulo: 'Almoço', dica: 'Por pessoa, a cada dia', tipo: 'dinheiro' },
  { campo: 'jantar_valor', rotulo: 'Jantar', dica: 'Por pessoa, a cada noite fora', tipo: 'dinheiro' },
  { campo: 'pernoite_valor', rotulo: 'Pernoite', dica: 'Por pessoa, a cada noite fora', tipo: 'dinheiro' },
];

function Grupo({ titulo, campos, value, onChange }: { titulo: string; campos: typeof LOGISTICA; value: PadroesDaProposta; onChange: (padroes: PadroesDaProposta) => void }) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{titulo}</h3>
      {campos.map(({ campo, rotulo, dica, tipo }) => {
        const { ler, aviso, unidade, mostrar } = LEITURA[tipo];
        return (
          <label key={campo} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 flex-col">
              <span>{rotulo}</span>
              <span className="text-xs text-muted-foreground">{dica}</span>
            </span>
            <span className="flex shrink-0 items-center gap-1">
              {unidade === 'R$' && <span className="text-xs text-muted-foreground">R$</span>}
              <CampoDeNumero
                className="h-8 w-24 text-right"
                value={value[campo]}
                // Apagado, fica o que estava (antes gravava zero: pernoite de R$ 0, estrada sem tempo)
                onChange={(valor) => onChange({ ...value, [campo]: valor ?? value[campo] })}
                ler={ler}
                {...(mostrar && { mostrar })}
                aviso={aviso}
                avisoCurto
                aria-label={rotulo}
              />
              {unidade && unidade !== 'R$' && <span className="w-3 text-xs text-muted-foreground">{unidade}</span>}
            </span>
          </label>
        );
      })}
    </div>
  );
}

function CamposDosPadroes({ value, onChange }: { value: PadroesDaProposta; onChange: (padroes: PadroesDaProposta) => void }) {
  const fecha = value.imposto_percentual + value.margem_percentual < 100;
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Grupo titulo="Percentuais" campos={PERCENTUAIS} value={value} onChange={onChange} />
        <p className="text-xs text-muted-foreground">
          {fecha
            ? 'Valem para as solicitações novas; cada proposta se ajusta no fechamento dela. Preço dos serviços = custo ÷ (1 − imposto − margem).'
            : <span className="text-destructive">O imposto e a margem somam 100% ou mais: o preço não fecha.</span>}
        </p>
      </div>
      <div className="space-y-2">
        <Grupo titulo="Logística automática" campos={LOGISTICA} value={value} onChange={onChange} />
        <p className="text-xs text-muted-foreground">
          Calculam as linhas de km e de refeições das propostas em edição. O preço entra na linha quando ela nasce e lá fica: trocar aqui não muda a linha que já existe.
        </p>
      </div>
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
 * Os padrões da proposta: os percentuais (29/out/2026, no lugar do BDI padrão:
 * imposto, margem e as duas administrações, que a solicitação nova copia) e a
 * logística automática (30/out/2026: km, estrada, bate-volta, interno, veículos,
 * refeições e pernoite). Trocar não reescreve proposta já feita.
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
        toast.error('Não foi possível ler os padrões da proposta', { description: formatApiError(erro) });
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
      toast.success('Padrões da proposta salvos', { description: 'Os percentuais valem para as solicitações novas; a logística, a cada recálculo.' });
      onClose();
    } catch (erro) {
      toast.error('Não foi possível salvar os padrões da proposta', { description: formatApiError(erro) });
      throw erro;
    }
  };

  return (
    <BaseModal
      isOpen
      mode="edit"
      entity={{ id: 'padroes-da-proposta', padroes }}
      title="Padrões da proposta"
      icon={<SlidersHorizontal className="h-4 w-4 md:h-5 md:w-5 text-primary" />}
      formFields={campos}
      onClose={onClose}
      onSubmit={salvar}
      width="w-full max-w-[95vw] sm:max-w-[90vw] md:max-w-[560px]"
    />
  );
}
