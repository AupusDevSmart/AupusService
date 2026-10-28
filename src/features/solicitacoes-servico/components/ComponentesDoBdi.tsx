// src/features/solicitacoes-servico/components/ComponentesDoBdi.tsx
import { CampoDeNumero } from '@/components/common/CampoDeNumero';
import { lerQuantidadeDigitada } from '@/utils/leitura';
import { COMPONENTES_DO_BDI, calcularBdi, percentualNaTela, somaImpostos, type ComponentesDoBdi } from '@/services/proposta.services';

const AVISO_DE_PERCENTUAL = 'Percentual de 0 a 100, com vírgula e até 3 casas (ex.: 6,5)';

/** Fora de 0 a 100 é ilegível, como na API: no rascunho a conta saía, e o cadastro dava 400 depois */
const lerPercentual = (texto: string) => {
  const valor = lerQuantidadeDigitada(texto);
  return typeof valor === 'number' && (valor < 0 || valor > 100) ? undefined : valor;
};

interface ComponentesDoBdiCamposProps {
  value: ComponentesDoBdi;
  onChange: (componentes: ComponentesDoBdi) => void;
  disabled?: boolean;
}

/**
 * Os nove componentes do BDI (28/out/2026), com o BDI que dão — o do padrão da
 * empresa e o de cada proposta, editados igual. Pelos componentes, e não só o
 * percentual final: a memória de cálculo fica gravada e a proposta é auditável.
 */
export function ComponentesDoBdiCampos({ value, onChange, disabled }: ComponentesDoBdiCamposProps) {
  const impostos = somaImpostos(value);
  const fecha = impostos < 100;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
        {COMPONENTES_DO_BDI.map(({ campo, rotulo }) => (
          <label key={campo} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">{rotulo}</span>
            <span className="flex items-center gap-1">
              <CampoDeNumero
                className="h-8 w-20 text-right"
                value={value[campo]}
                // Vazio é zero: o componente que não se cobra
                onChange={(valor) => onChange({ ...value, [campo]: valor ?? 0 })}
                ler={lerPercentual}
                aviso={AVISO_DE_PERCENTUAL}
                avisoCurto
                disabled={disabled}
                aria-label={`${rotulo} (%)`}
              />
              <span className="text-xs text-muted-foreground">%</span>
            </span>
          </label>
        ))}
      </div>
      <p className="text-sm">
        {fecha ? (
          <>
            BDI: <span className="font-medium tabular-nums">{percentualNaTela(calcularBdi(value) * 100)}%</span>
            <span className="ml-2 text-xs text-muted-foreground">[(1 + AC + SG + R) × (1 + DF) × (1 + L) / (1 − I)] − 1, a fórmula do TCU</span>
          </>
        ) : (
          <span className="text-destructive">Os impostos (PIS, COFINS, CPRB e ISS) somam 100% ou mais: a conta do BDI não fecha.</span>
        )}
      </p>
    </div>
  );
}
