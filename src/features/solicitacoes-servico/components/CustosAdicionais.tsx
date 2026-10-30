// src/features/solicitacoes-servico/components/CustosAdicionais.tsx
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CampoDeNumero } from '@/components/common/CampoDeNumero';
import type { Explicacao } from '@/components/common/ComoSeCalcula';
import { AVISO_DE_DINHEIRO, dinheiroNoCampo, lerDinheiroDigitado } from '@/utils/leitura';
import type { OutroCusto } from '@/services/proposta.services';
import { TextoDaLinha } from './TabelaDaLogistica';
import { BotaoAdicionar, TituloDaSecao } from './TituloDaSecao';

interface CustosAdicionaisProps {
  custos: OutroCusto[];
  editavel: boolean;
  onChange: (custos: OutroCusto[]) => void;
  explicacao?: Explicacao;
}

/**
 * Os custos adicionais da proposta (o que não é instrução nem logística: ART,
 * locação, material de terceiro). O de faturamento direto o cliente paga ao
 * fornecedor: entra no investimento global, fora do imposto e da margem da Aupus.
 */
export function CustosAdicionais({ custos, editavel, onChange, explicacao }: CustosAdicionaisProps) {
  const trocar = (indice: number, dados: Partial<OutroCusto>) => onChange(custos.map((c, i) => (i === indice ? { ...c, ...dados } : c)));
  const total = custos.reduce((s, c) => s + (c.valor ?? 0), 0);

  return (
    <div className="space-y-1">
      <TituloDaSecao titulo="Custos adicionais" explicacao={explicacao} valor={custos.length > 0 ? total : undefined}>
        {editavel && <BotaoAdicionar descricao="Adicionar custo" onClick={() => onChange([...custos, { descricao: '', valor: 0, faturamento_direto: false }])} />}
      </TituloDaSecao>

      {custos.length > 0 && (
        <div className="space-y-2 pt-1">
          {custos.map((custo, indice) => (
            <div key={custo.id ?? `novo-${indice}`} className="flex flex-wrap items-center gap-2">
              <TextoDaLinha valor={custo.descricao} editavel={editavel} placeholder="Ex.: ART, locação" onChange={(descricao) => trocar(indice, { descricao })} />
              <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                R$
                <CampoDeNumero
                  className="h-7 w-24 text-right text-sm"
                  value={custo.valor}
                  disabled={!editavel}
                  onChange={(valor) => trocar(indice, { valor: valor ?? 0 })}
                  ler={lerDinheiroDigitado}
                  mostrar={dinheiroNoCampo}
                  aviso={AVISO_DE_DINHEIRO}
                  avisoCurto
                  aria-label="Valor do custo"
                />
              </span>
              <label className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground" title="O cliente paga o fornecedor: fora do imposto e da margem da Aupus">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 accent-foreground"
                  checked={custo.faturamento_direto}
                  disabled={!editavel}
                  onChange={(e) => trocar(indice, { faturamento_direto: e.target.checked })}
                />
                Faturamento direto
              </label>
              {editavel && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                  title="Remover custo"
                  aria-label="Remover custo"
                  onClick={() => onChange(custos.filter((_, i) => i !== indice))}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
