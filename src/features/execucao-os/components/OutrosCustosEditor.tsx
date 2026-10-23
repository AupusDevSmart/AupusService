// src/features/execucao-os/components/OutrosCustosEditor.tsx
import { useId, type Dispatch, type SetStateAction } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CampoDeNumero } from '@/components/common/CampoDeNumero';
import { AVISO_DE_DINHEIRO, dinheiroNoCampo, lerDinheiroDigitado } from '@/utils/leitura';
import { formatCurrency } from '@/lib/utils';
import { NATUREZAS_DOS_OUTROS_CUSTOS, type NaturezaDoOutroCusto } from '@/features/execucao-os/types/custos';
import { linhaNaoPrevista, type LinhaDeOutroCusto } from '@/features/execucao-os/utils/outros-custos';

const rotulo = (n: NaturezaDoOutroCusto) => NATUREZAS_DOS_OUTROS_CUSTOS.find((o) => o.value === n)?.label ?? 'Outro';

interface OutrosCustosEditorProps {
  linhas: LinhaDeOutroCusto[];
  onChange: Dispatch<SetStateAction<LinhaDeOutroCusto[]>>;
  /** O texto de cima: no Executar, o que fazer; na correção, o que muda */
  explicacao?: string;
}

/**
 * Os outros custos da OS para conferir (SN-93, D2): cada item do orçamento com o
 * previsto ao lado e o que custou já preenchido com ele, e o não previsto
 * lançado com descrição e natureza. No painel do Executar e na correção depois.
 */
export function OutrosCustosEditor({ linhas, onChange, explicacao }: OutrosCustosEditorProps) {
  const idBase = useId();
  const mudar = (chave: string, mudanca: Partial<LinhaDeOutroCusto>) =>
    onChange((atuais) => atuais.map((l) => (l.chave === chave ? { ...l, ...mudanca } : l)));
  const tirar = (chave: string) => onChange((atuais) => atuais.filter((l) => l.chave !== chave));
  const previstos = linhas.filter((l) => !l.naoPrevisto);
  const naoPrevistos = linhas.filter((l) => l.naoPrevisto);

  const campoDoValor = (linha: LinhaDeOutroCusto, rotuloAcessivel: string) => (
    <CampoDeNumero
      id={`${idBase}-${linha.chave}`}
      value={linha.valor}
      onChange={(valor) => mudar(linha.chave, { valor })}
      onIlegivel={(ilegivel) => mudar(linha.chave, { ilegivel })}
      ler={lerDinheiroDigitado}
      mostrar={dinheiroNoCampo}
      aviso={AVISO_DE_DINHEIRO}
      placeholder="R$"
      aria-label={rotuloAcessivel}
      className="h-8 w-32 text-right"
    />
  );

  return (
    <div className="space-y-3 rounded-md border p-3">
      <div>
        <p className="text-sm font-medium">Outros custos</p>
        <p className="text-xs text-muted-foreground">
          {explicacao ?? 'Veículo, hospedagem, alimentação, instrumentos e terceiros: confira quanto custou cada um. O que não estava previsto, lance abaixo.'}
        </p>
      </div>

      {previstos.length === 0 && <p className="text-xs text-muted-foreground">Nenhum outro custo no orçamento desta OS.</p>}

      {previstos.map((linha) => (
        <div key={linha.chave} className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <label htmlFor={`${idBase}-${linha.chave}`} className="block truncate text-sm">
              {linha.descricao}
            </label>
            <span className="block truncate text-xs text-muted-foreground">
              {rotulo(linha.natureza)} · previsto {formatCurrency(linha.previsto ?? 0)}
            </span>
          </div>
          {campoDoValor(linha, `Quanto custou: ${linha.descricao}`)}
        </div>
      ))}

      {naoPrevistos.length > 0 && (
        <div className="space-y-2 border-t pt-3">
          <p className="text-xs font-medium text-muted-foreground">Não previstos</p>
          {naoPrevistos.map((linha) => (
            <div key={linha.chave} className="flex flex-wrap items-start gap-2">
              <Input
                value={linha.descricao}
                onChange={(e) => mudar(linha.chave, { descricao: e.target.value })}
                placeholder="O que foi (ex.: pedágio)"
                aria-label="Descrição do custo não previsto"
                maxLength={255}
                className="h-8 min-w-[10rem] flex-1"
              />
              <Select value={linha.natureza} onValueChange={(natureza) => mudar(linha.chave, { natureza: natureza as NaturezaDoOutroCusto })}>
                <SelectTrigger className="h-8 w-40" aria-label="Natureza do custo não previsto">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NATUREZAS_DOS_OUTROS_CUSTOS.map((n) => (
                    <SelectItem key={n.value} value={n.value}>
                      {n.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {campoDoValor(linha, `Quanto custou: ${linha.descricao || 'não previsto'}`)}
              <Button type="button" variant="ghost" size="sm" className="h-8" onClick={() => tirar(linha.chave)}>
                Tirar
              </Button>
            </div>
          ))}
        </div>
      )}

      <Button type="button" variant="outline" size="sm" onClick={() => onChange((atuais) => [...atuais, linhaNaoPrevista()])}>
        <Plus className="mr-1 h-3.5 w-3.5" />
        Lançar custo não previsto
      </Button>
    </div>
  );
}
