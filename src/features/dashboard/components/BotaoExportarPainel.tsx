// src/features/dashboard/components/BotaoExportarPainel.tsx
import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { dashboardManutencaoApi, type FiltrosDashboard } from '@/services/dashboard-manutencao.services';
import { planilhaDoPainel } from '@/features/dashboard/utils/planilha-do-painel';
import { baixar } from '@/lib/planilha/estilo';

interface BotaoExportarPainelProps {
  filtros: FiltrosDashboard;
  /** Rótulo e valor de cada filtro, como a tela os mostra (aba FILTRO) */
  filtrosEmPalavras: [string, string][];
  /** Os gráficos à vista: a legenda deles vai na aba INDICADORES */
  graficosAVista: string[];
  /** Dados de exemplo não se exportam: seriam lidos como reais fora da tela */
  desabilitado?: boolean;
}

/**
 * Exporta o painel (SN-82): os números, a fórmula e a base de cada um, as
 * séries e as OS que entraram na conta.
 *
 * O painel e a lista são lidos JUNTOS, no clique, com o mesmo filtro: com o
 * que a tela tinha em memória, trocar o filtro e exportar antes de a consulta
 * voltar dava os números de um filtro e as OS de outro, e a aba aberta desde
 * cedo dava cartões de horas atrás contra as OS de agora.
 */
export function BotaoExportarPainel({ filtros, filtrosEmPalavras, graficosAVista, desabilitado }: BotaoExportarPainelProps) {
  const [exportando, setExportando] = useState(false);

  const exportar = async () => {
    setExportando(true);
    try {
      const [painel, { periodo, ordens }] = await Promise.all([
        dashboardManutencaoApi.carregar(filtros),
        dashboardManutencaoApi.ordensDaConta(filtros),
      ]);
      // Na virada do mês, "mês atual" vira outra janela entre as duas leituras
      if (painel.periodo && (painel.periodo.desde !== periodo.desde || painel.periodo.ate !== periodo.ate)) {
        throw new Error('O período mudou durante a exportação (virada do mês): exporte de novo.');
      }
      const graficos = (painel.graficos ?? []).filter((g) => graficosAVista.includes(g.id));
      const livro = await planilhaDoPainel(painel, ordens, { filtros: filtrosEmPalavras, graficos });
      await baixar(livro, `painel-de-manutencao-${new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })}.xlsx`);
    } catch (erro) {
      // Erro da API o interceptor já mostra; aqui, o da planilha em si
      if (!(erro as { isAxiosError?: boolean } | null)?.isAxiosError) {
        console.error('Exportação do painel:', erro);
        toast.error('Não foi possível exportar', { description: erro instanceof Error ? erro.message : undefined });
      }
    } finally {
      setExportando(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 px-2 text-muted-foreground"
      onClick={exportar}
      disabled={exportando || desabilitado}
      title={desabilitado ? 'Dados de exemplo não se exportam' : 'Exportar o painel para planilha'}
    >
      {exportando ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Download className="mr-1 h-3.5 w-3.5" />}
      {exportando ? 'Exportando...' : 'Exportar'}
    </Button>
  );
}
