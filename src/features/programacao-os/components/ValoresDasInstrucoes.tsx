// src/features/programacao-os/components/ValoresDasInstrucoes.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CampoDeNumero } from '@/components/common/CampoDeNumero';
import { formatCurrency } from '@/lib/utils';
import { AVISO_DE_DINHEIRO, lerDinheiroDigitado } from '@/utils/leitura';
import { valorNaTela, type AjustesDeValor, type LinhaDeValor } from '@/features/programacao-os/utils/valores-das-instrucoes';

interface ValoresDasInstrucoesProps {
  linhas: LinhaDeValor[];
  ajustes: AjustesDeValor;
  onChange: (ajustes: AjustesDeValor) => void;
  disabled?: boolean;
  /** Na criação as linhas ainda não existem: o valor vem do cadastro e se ajusta depois */
  criando?: boolean;
  /**
   * Algum valor ficou ilegível: o formulário não salva. Sem isso o aviso aparecia
   * no campo e o Salvar gravava calado o valor anterior (ou nenhum)
   */
  onIlegivel?: (ilegivel: boolean) => void;
}

/**
 * O valor de cada instrução nesta programação (SN-93, D1): o do cadastro no
 * vínculo, ajustável aqui sem mudar o padrão da instrução. É o valor que a OS
 * mostra ao lado do custo apurado, e o total das feitas.
 */
export function ValoresDasInstrucoes({ linhas, ajustes, onChange, disabled, criando, onIlegivel }: ValoresDasInstrucoesProps) {
  const [ilegiveis, setIlegiveis] = useState<ReadonlySet<string>>(new Set());
  const marcarIlegivel = (chave: string, ilegivel: boolean) => {
    const proximas = new Set(ilegiveis);
    if (ilegivel) proximas.add(chave);
    else proximas.delete(chave);
    setIlegiveis(proximas);
    onIlegivel?.(proximas.size > 0);
  };
  if (criando) {
    return (
      <p className="text-xs text-muted-foreground">
        Cada instrução entra com o valor do cadastro. Para ajustar o valor só nesta programação, salve e abra em Editar.
      </p>
    );
  }
  if (linhas.length === 0) return null;
  const total = linhas.reduce((soma, l) => soma + (valorNaTela(l, ajustes) ?? 0), 0);

  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-medium">Valor das instruções</p>
        <p className="text-xs text-muted-foreground">
          O do cadastro de cada instrução. O ajuste vale só nesta programação: o padrão da instrução não muda.
        </p>
      </div>
      <ul className="divide-y rounded-md border">
        {linhas.map((linha) => {
          const valor = valorNaTela(linha, ajustes);
          const ajustado = valor !== null && linha.original !== null && valor !== linha.original;
          return (
            <li key={linha.chave} className="flex flex-wrap items-start gap-2 px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{linha.nome}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {[linha.equipamento, ajustado && linha.original !== null ? `cadastro ${formatCurrency(linha.original)}` : null].filter(Boolean).join(' · ')}
                </p>
              </div>
              <CampoDeNumero
                value={valor}
                onChange={(novo) => onChange({ ...ajustes, [linha.chave]: novo })}
                onIlegivel={(ilegivel) => marcarIlegivel(linha.chave, ilegivel)}
                ler={lerDinheiroDigitado}
                aviso={AVISO_DE_DINHEIRO}
                disabled={disabled}
                placeholder="R$"
                aria-label={`Valor de ${linha.nome}${linha.equipamento ? ` (${linha.equipamento})` : ''}`}
                className="h-8 w-32 text-right"
              />
              {ajustado && !disabled && (
                <Button type="button" variant="ghost" size="sm" className="h-8" onClick={() => onChange({ ...ajustes, [linha.chave]: null })}>
                  Voltar ao cadastro
                </Button>
              )}
            </li>
          );
        })}
      </ul>
      <p className="text-right text-xs text-muted-foreground">Total das instruções: {formatCurrency(total)}</p>
    </div>
  );
}
