// src/features/solicitacoes-servico/components/CustosAdicionais.tsx
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CampoDeNumero } from '@/components/common/CampoDeNumero';
import { DicaDaConta, type Explicacao } from '@/components/common/ComoSeCalcula';
import { AVISO_DE_DINHEIRO, dinheiroNoCampo, lerDinheiroDigitado } from '@/utils/leitura';
import type { OutroCusto } from '@/services/proposta.services';
import { TextoDaLinha } from './TabelaDaLogistica';

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

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm font-medium">
          Custos adicionais
          {explicacao && <DicaDaConta {...explicacao} />}
        </span>
        {editavel && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Adicionar custo"
            aria-label="Adicionar custo"
            onClick={() => onChange([...custos, { descricao: '', valor: 0, faturamento_direto: false }])}
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      {custos.map((custo, indice) => (
        <div key={custo.id ?? `novo-${indice}`} className="flex items-center gap-2">
          <TextoDaLinha valor={custo.descricao} editavel={editavel} placeholder="Ex.: ART, locação" onChange={(descricao) => trocar(indice, { descricao })} />
          <span className="shrink-0 text-xs text-muted-foreground">R$</span>
          <CampoDeNumero
            className="h-8 w-24 shrink-0 text-right"
            value={custo.valor}
            disabled={!editavel}
            onChange={(valor) => trocar(indice, { valor: valor ?? 0 })}
            ler={lerDinheiroDigitado}
            mostrar={dinheiroNoCampo}
            aviso={AVISO_DE_DINHEIRO}
            avisoCurto
            aria-label="Valor do custo"
          />
          {/* FD na tela, nome por extenso no hover: cabe na linha num sheet estreito */}
          <label
            className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground"
            title="Faturamento direto: o cliente paga o fornecedor. Fora do imposto e da margem da Aupus."
          >
            <input
              type="checkbox"
              className="h-3.5 w-3.5"
              checked={custo.faturamento_direto}
              disabled={!editavel}
              onChange={(e) => trocar(indice, { faturamento_direto: e.target.checked })}
            />
            FD
          </label>
          {editavel && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
              title="Remover"
              aria-label="Remover custo"
              onClick={() => onChange(custos.filter((_, i) => i !== indice))}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
