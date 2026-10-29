// src/features/execucao-os/components/CustosDaOS.tsx
import { useState } from 'react';
import { Loader2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DicaDaConta } from '@/components/common/ComoSeCalcula';
import { formatCurrency } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { formatApiError } from '@/utils/api-error';
import { formatarHoras } from '@/utils/horas';
import { execucaoOSApi } from '@/services/execucao-os.service';
import type { ItemOrcamento } from '@/features/programacao-os/types';
import type { ResumoDoCusto } from '@/features/execucao-os/types/custos';
import {
  diferencaDoPrevisto,
  formatarQuantidade,
  nomeDaInstrucao,
  resumoDasInstrucoes,
  situacaoDaInstrucao,
  valorDaInstrucao,
  type SentidoDaDiferenca,
} from '@/features/execucao-os/utils/custos-da-os';
import {
  linhasDosOutrosCustos,
  outrosCustosDoPedido,
  pendenciaDosOutrosCustos,
  type LinhaDeOutroCusto,
} from '@/features/execucao-os/utils/outros-custos';
import { OutrosCustosEditor } from './OutrosCustosEditor';

/** Os status em que o custo real já foi apurado (o Executar grava as horas e os outros custos) */
const APURADO = new Set(['EXECUTADA', 'AUDITADA', 'FINALIZADA']);
/**
 * Onde os outros custos se corrigem: depois do Executar, antes de finalizar (a
 * finalizada está selada no código). Em execução quem confere é o painel do
 * Executar, que manda a lista inteira: a correção feita com ele aberto era
 * sobrescrita pela lista que ele já tinha.
 */
const CORRIGIVEL = new Set(['EXECUTADA', 'AUDITADA']);

const COR_DA_DIFERENCA: Record<SentidoDaDiferenca, string> = {
  acima: 'text-amber-600 dark:text-amber-500',
  abaixo: 'text-emerald-600 dark:text-emerald-400',
  igual: 'text-muted-foreground',
  'sem-previsto': 'text-muted-foreground',
};

const COMO_SE_CALCULA = [
  'Custo real = mão de obra (horas trabalhadas × valor da hora de cada pessoa) + material (quantidade consumida × custo unitário) + outros custos (veículo, hospedagem, alimentação, instrumentos, maquinário e terceiros, pelo valor conferido no Executar; o previsto quando não foi conferido) + os não previstos.',
  'Previsto = o orçamento aprovado na programação: as horas estimadas, o material planejado e os outros custos do orçamento.',
  'Cada instrução tem o valor do cadastro no vínculo, ou o ajustado na programação; o total das feitas mostra o que foi entregue, ao lado do que foi gasto.',
];

interface CustosDaOSProps {
  osId: string;
  status: string;
  custos?: ResumoDoCusto;
  itensOrcamento?: ItemOrcamento[];
  /** Quem corrige os outros custos depois do Executar (as permissões de registrar consumo) */
  podeCorrigir: boolean;
  /** Depois de corrigir: a OS relida, com o resumo novo (a conta é da API) */
  onCorrigido: () => Promise<void>;
}

/**
 * O custo da OS no sheet (SN-93), com destaque: o real contra o previsto, por
 * natureza, por instrução e o detalhe de cada pessoa, material e outro custo. A
 * conta é da API (a mesma do PDF e do custo real gravado). Os outros custos se
 * corrigem aqui até a auditoria.
 */
export function CustosDaOS({ osId, status, custos, itensOrcamento, podeCorrigir, onCorrigido }: CustosDaOSProps) {
  const [corrigindo, setCorrigindo] = useState(false);
  const [linhas, setLinhas] = useState<LinhaDeOutroCusto[]>([]);
  const [gravando, setGravando] = useState(false);
  if (!custos) return null;

  const apurado = APURADO.has(status);
  // Na OS finalizada antes do SN-93 os outros custos ficam fora do real: o previsto comparado também
  const previsto = custos.outros_fora_do_total ? custos.previsto : (custos.orcamento_previsto ?? custos.previsto);
  const diferenca = diferencaDoPrevisto(previsto, custos.real);
  const pendencia = corrigindo ? pendenciaDosOutrosCustos(linhas) : null;
  const naturezas = custos.naturezas.filter((n) => n.previsto > 0 || (n.real ?? 0) > 0);
  const resumo = resumoDasInstrucoes(custos);

  const abrirCorrecao = () => {
    setLinhas(linhasDosOutrosCustos(itensOrcamento));
    setCorrigindo(true);
  };
  const salvar = async () => {
    if (pendencia || gravando) return;
    setGravando(true);
    try {
      await execucaoOSApi.registrarOutrosCustos(osId, outrosCustosDoPedido(linhas));
    } catch (error) {
      toast({ title: 'Não foi possível salvar os outros custos', description: formatApiError(error), variant: 'destructive' });
      setGravando(false);
      return;
    }
    toast({ title: 'Outros custos salvos' });
    setCorrigindo(false);
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
    <section className="space-y-4" aria-label="Custos da OS">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-medium">Custos</h3>
        <DicaDaConta rotulo="o custo da OS" linhas={COMO_SE_CALCULA} className="h-3.5 w-3.5" />
        {podeCorrigir && CORRIGIVEL.has(status) && !corrigindo && (
          <Button type="button" variant="outline" size="sm" className="ml-auto h-8" onClick={abrirCorrecao}>
            <Pencil className="mr-1 h-3.5 w-3.5" />
            Corrigir outros custos
          </Button>
        )}
      </div>

      {/* O número que importa, em destaque: o real contra o previsto */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="rounded-md border bg-muted p-3">
          <p className="text-xs text-muted-foreground">{apurado ? 'Custo real' : 'Custo real (sai no Executar)'}</p>
          <p className="text-2xl font-semibold leading-tight">{apurado ? formatCurrency(custos.real) : '—'}</p>
        </div>
        <div className="rounded-md border p-3">
          <p className="text-xs text-muted-foreground">Previsto</p>
          <p className="text-lg font-medium leading-tight">{formatCurrency(previsto)}</p>
          {custos.outros_fora_do_total ? (
            <p className="text-xs text-muted-foreground">mão de obra e material: os outros custos ficam fora do total nesta OS</p>
          ) : (
            custos.ajuste_do_orcamento !== 0 && (
              <p className="text-xs text-muted-foreground">com {formatCurrency(custos.ajuste_do_orcamento)} de ajuste na aprovação</p>
            )
          )}
        </div>
        <div className="rounded-md border p-3">
          <p className="text-xs text-muted-foreground">Diferença</p>
          <p className={`text-lg font-medium leading-tight ${apurado ? COR_DA_DIFERENCA[diferenca.sentido] : 'text-muted-foreground'}`}>
            {apurado ? diferenca.texto : '—'}
          </p>
        </div>
      </div>

      {naturezas.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">Por natureza</p>
          <div className="divide-y rounded-md border text-sm">
            <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-3 py-1.5 text-xs text-muted-foreground sm:grid-cols-[1fr_7rem_7rem_9rem]">
              <span>Natureza</span>
              <span className="w-24 text-right sm:w-auto">Previsto</span>
              <span className="w-24 text-right sm:w-auto">Real</span>
              <span className="hidden text-right sm:block">Diferença</span>
            </div>
            {naturezas.map((n) => {
              // Fora do total (OS finalizada antes do SN-93): sem real nem diferença, que leria como economia
              const comReal = apurado && n.real !== null;
              const d = diferencaDoPrevisto(n.previsto, n.real ?? 0);
              return (
                <div key={n.natureza} className="grid grid-cols-[1fr_auto_auto] gap-3 px-3 py-1.5 sm:grid-cols-[1fr_7rem_7rem_9rem]">
                  <span className="min-w-0 truncate">{n.rotulo}</span>
                  <span className="w-24 text-right tabular-nums sm:w-auto">{n.previsto > 0 ? formatCurrency(n.previsto) : '—'}</span>
                  <span className={`w-24 text-right tabular-nums sm:w-auto ${n.real === null ? 'text-xs text-muted-foreground' : ''}`}>
                    {n.real === null ? 'fora do total' : apurado ? formatCurrency(n.real) : '—'}
                  </span>
                  <span className={`hidden text-right text-xs sm:block ${comReal ? COR_DA_DIFERENCA[d.sentido] : 'text-muted-foreground'}`}>
                    {comReal ? d.texto : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {custos.instrucoes.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">Por instrução</p>
          <ul className="divide-y rounded-md border text-sm">
            {custos.instrucoes.map((i, indice) => {
              const valor = valorDaInstrucao(i);
              return (
                <li key={indice} className="flex items-start gap-3 px-3 py-1.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate">{nomeDaInstrucao(i)}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[i.equipamento, situacaoDaInstrucao(i.status)].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="tabular-nums">{valor.texto}</p>
                    {valor.detalhe && <p className="text-xs text-muted-foreground">{valor.detalhe}</p>}
                  </div>
                </li>
              );
            })}
          </ul>
          {resumo && <p className="mt-1 text-right text-xs text-muted-foreground">Instruções {resumo}</p>}
        </div>
      )}

      {corrigindo ? (
        <div className="space-y-2">
          <OutrosCustosEditor
            linhas={linhas}
            onChange={setLinhas}
            explicacao="Corrija o que custou cada um e lance o que faltou. O custo real da OS é refeito ao salvar."
          />
          {pendencia && <p className="text-xs text-muted-foreground">{pendencia}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setCorrigindo(false)} disabled={gravando}>
              Cancelar
            </Button>
            <Button type="button" size="sm" onClick={salvar} disabled={Boolean(pendencia) || gravando}>
              {gravando && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Salvar outros custos
            </Button>
          </div>
        </div>
      ) : (
        <details className="rounded-md border px-3 py-2">
          <summary className="cursor-pointer text-sm text-muted-foreground">O detalhe: cada pessoa, material e outro custo</summary>
          <div className="mt-3 space-y-3 text-sm">
            {custos.equipe.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">Mão de obra</p>
                {custos.equipe.map((p, i) => (
                  <div key={i} className="flex items-start justify-between gap-3 py-0.5">
                    <span className="min-w-0">
                      {p.nome}
                      <span className="block text-xs text-muted-foreground">
                        {formatarHoras(p.horas_trabalhadas ?? p.horas_previstas)}
                        {p.horas_trabalhadas === null ? ' previstas' : ''} × {p.valor_hora ? `${formatCurrency(p.valor_hora)}/h` : 'sem valor/hora'}
                      </span>
                    </span>
                    <span className="shrink-0 tabular-nums">{formatCurrency(apurado ? p.real : p.previsto)}</span>
                  </div>
                ))}
              </div>
            )}
            {custos.materiais.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">Material</p>
                {custos.materiais.map((m, i) => (
                  <div key={i} className="flex items-start justify-between gap-3 py-0.5">
                    <span className="min-w-0">
                      {m.descricao}
                      <span className="block text-xs text-muted-foreground">
                        {apurado
                          ? `${formatarQuantidade(m.quantidade_consumida ?? 0)} ${m.unidade} consumidos`
                          : `${formatarQuantidade(m.quantidade_planejada)} ${m.unidade} planejados`} ×{' '}
                        {m.custo_unitario ? formatCurrency(m.custo_unitario) : 'sem custo unitário'}
                      </span>
                    </span>
                    <span className="shrink-0 tabular-nums">{formatCurrency(apurado ? m.real : m.previsto)}</span>
                  </div>
                ))}
              </div>
            )}
            {custos.outros.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">Outros custos</p>
                {custos.outros.map((o, i) => (
                  <div key={i} className="flex items-start justify-between gap-3 py-0.5">
                    <span className="min-w-0">
                      {o.descricao}
                      <span className="block text-xs text-muted-foreground">
                        {o.rotulo}
                        {o.nao_previsto ? ' · não previsto' : ` · previsto ${formatCurrency(o.previsto)}`}
                        {!o.conferido && !o.nao_previsto && ' · não conferido'}
                        {o.no_real === null && ' · fora do total'}
                      </span>
                    </span>
                    <span className="shrink-0 tabular-nums">{o.conferido ? formatCurrency(o.real ?? 0) : '—'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </details>
      )}

      {custos.pendencias.length > 0 && (
        <ul className="space-y-0.5 text-xs text-amber-600 dark:text-amber-500">
          {custos.pendencias.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
