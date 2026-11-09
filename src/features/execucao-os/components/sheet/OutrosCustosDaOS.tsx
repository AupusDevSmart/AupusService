// src/features/execucao-os/components/sheet/OutrosCustosDaOS.tsx
import { useState, type Dispatch, type SetStateAction } from 'react';
import { Loader2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { formatApiError } from '@/utils/api-error';
import { execucaoOSApi } from '@/services/execucao-os.service';
import {
  linhasDosOutrosCustos,
  outrosCustosDoPedido,
  pendenciaDosOutrosCustos,
  type LinhaDeOutroCusto,
} from '@/features/execucao-os/utils/outros-custos';
import { OutrosCustosEditor } from '../OutrosCustosEditor';
import { Secao } from './blocos';
import type { OSDoSheet } from './SecoesDeLeitura';

/**
 * Onde os outros custos se corrigem depois do Executar, antes de finalizar (a
 * finalizada está selada no código de verificação). A API recusa em outro status.
 */
const CORRIGIVEL = ['EXECUTADA', 'AUDITADA'];

interface OutrosCustosDaOSProps {
  os: OSDoSheet;
  status?: string;
  /** Em execução: o rascunho que o concluir manda (null: a OS veio sem a lista do orçamento) */
  rascunho: LinhaDeOutroCusto[] | null;
  onRascunho: Dispatch<SetStateAction<LinhaDeOutroCusto[]>>;
  /** OS em execução e quem olha executa: confere aqui, ao lado do previsto */
  podeConferir: boolean;
  /** Depois de executar, até a auditoria (na auditada, só quem gerencia) */
  podeCorrigir: boolean;
  /** Depois de corrigir: a OS relida, com o custo real que a API refez */
  onCorrigido: () => Promise<void>;
}

/**
 * Os outros custos (veículo, hospedagem, alimentação, instrumentos, terceiros):
 * o previsto e, ao lado, quanto custou (07/nov/2026). Em execução, o real começa
 * no previsto e grava ao concluir; depois, corrige-se aqui. Antes isso ficava no
 * painel de concluir e num botão do quadro de custos, e o detalhe do custo dizia
 * "não conferido" de um valor que estava na tela.
 */
export function OutrosCustosDaOS({ os, status, rascunho, onRascunho, podeConferir, podeCorrigir, onCorrigido }: OutrosCustosDaOSProps) {
  const [corrigindo, setCorrigindo] = useState<LinhaDeOutroCusto[] | null>(null);
  const [gravando, setGravando] = useState(false);
  // O cliente não vê custo (SERV-10): sem o resumo, a seção não existe
  if (!os.custos) return null;

  if (podeConferir && rascunho) {
    const pendencia = pendenciaDosOutrosCustos(rascunho);
    return (
      <Secao>
        <OutrosCustosEditor
          linhas={rascunho}
          onChange={onRascunho}
          explicacao="Veículo, hospedagem, alimentação, instrumentos e terceiros: confira quanto custou cada um, ao lado do previsto. O que não estava previsto, lance abaixo. Gravam ao concluir a execução."
        />
        {pendencia && <p className="text-xs text-muted-foreground">{pendencia}</p>}
      </Secao>
    );
  }

  if (corrigindo) {
    const pendencia = pendenciaDosOutrosCustos(corrigindo);
    const salvar = async () => {
      if (pendencia || gravando) return;
      setGravando(true);
      try {
        await execucaoOSApi.registrarOutrosCustos(os.id, outrosCustosDoPedido(corrigindo));
      } catch (error) {
        toast({ title: 'Não foi possível salvar os outros custos', description: formatApiError(error), variant: 'destructive' });
        setGravando(false);
        return;
      }
      toast({ title: 'Outros custos salvos' });
      setCorrigindo(null);
      // Gravou: a releitura que falha não pode dizer que não salvou
      try {
        await onCorrigido();
      } catch (error) {
        toast({ title: 'Salvo, mas a OS não foi relida', description: `Feche e abra a OS para ver o custo novo. ${formatApiError(error)}`, variant: 'destructive' });
      } finally {
        setGravando(false);
      }
    };
    return (
      <Secao>
        <OutrosCustosEditor
          linhas={corrigindo}
          onChange={(mudanca) => setCorrigindo((atual) => (atual === null ? null : typeof mudanca === 'function' ? mudanca(atual) : mudanca))}
          explicacao="Corrija o que custou cada um e lance o que faltou. O custo real da OS é refeito ao salvar."
        />
        {pendencia && <p className="text-xs text-muted-foreground">{pendencia}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => setCorrigindo(null)} disabled={gravando}>
            Cancelar
          </Button>
          <Button type="button" size="sm" onClick={salvar} disabled={Boolean(pendencia) || gravando}>
            {gravando && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            Salvar outros custos
          </Button>
        </div>
      </Secao>
    );
  }

  const outros = os.custos.outros ?? [];
  const corrigivel = podeCorrigir && CORRIGIVEL.includes(status ?? '') && !!os.itens_orcamento;
  if (outros.length === 0 && !corrigivel) return null;
  const emAndamento = status === 'EM_EXECUCAO' || status === 'PAUSADA';
  return (
    <Secao
      titulo="Outros custos"
      aoLado={
        corrigivel ? (
          <Button type="button" variant="outline" size="sm" className="h-8" onClick={() => setCorrigindo(linhasDosOutrosCustos(os.itens_orcamento))}>
            <Pencil className="mr-1 h-3.5 w-3.5" />
            Corrigir
          </Button>
        ) : undefined
      }
    >
      {outros.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum outro custo nesta OS.</p>
      ) : (
        <ul className="divide-y divide-border">
          {outros.map((o, i) => (
            <li key={i} className="flex items-start justify-between gap-3 py-2 text-sm">
              <span className="min-w-0">
                {o.descricao}
                <span className="block text-xs text-muted-foreground">
                  {o.rotulo}
                  {o.nao_previsto ? ' · não previsto' : ` · previsto ${formatCurrency(o.previsto)}`}
                  {!o.conferido && !o.nao_previsto && (emAndamento ? ' · conferido ao concluir' : ' · não conferido')}
                </span>
              </span>
              <span className="shrink-0 tabular-nums">{o.conferido ? formatCurrency(o.real ?? 0) : '—'}</span>
            </li>
          ))}
        </ul>
      )}
    </Secao>
  );
}
