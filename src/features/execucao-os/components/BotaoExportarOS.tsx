// src/features/execucao-os/components/BotaoExportarOS.tsx
import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { execucaoOSApi, type QueryExecucaoOSApiParams } from '@/services/execucao-os.service';
import { FiltroGrandeDemais, descricaoDoFiltro, planilhaDasOS, todasAsOS } from '@/features/execucao-os/utils/planilha-das-os';
import { baixar } from '@/lib/planilha/estilo';
import { useVeCustos } from '@/hooks/useVeCustos';

interface BotaoExportarOSProps {
  /** Os parâmetros que a tabela manda à API (a página é trocada pela exportação) */
  filtro: QueryExecucaoOSApiParams;
  /** Os valores dos filtros da tela e a configuração deles, para a aba FILTRO dizer o que foi pedido */
  valores: Record<string, unknown>;
  filtros: { key: string; label?: string; options?: { value: string; label: string }[] }[];
}

/**
 * Exporta a lista de OS (SN-63): todas as do filtro da tela, não só a página
 * aberta. No lugar do botão que só dizia "Funcionalidade em breve".
 */
export function BotaoExportarOS({ filtro, valores, filtros }: BotaoExportarOSProps) {
  const [exportando, setExportando] = useState(false);
  const comCustos = useVeCustos();

  const exportar = async () => {
    setExportando(true);
    try {
      const { ordens, mudou } = await todasAsOS(filtro, (params) => execucaoOSApi.findAll(params));
      if (ordens.length === 0) {
        toast.info('Nenhuma OS no filtro para exportar');
        return;
      }
      const livro = await planilhaDasOS(ordens, descricaoDoFiltro(valores, filtros, ordens, filtro), { mudou, comCustos });
      await baixar(livro, `ordens-de-servico-${new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })}.xlsx`);
      if (mudou) {
        toast.warning('A lista mudou durante a exportação', { description: 'Uma OS foi criada, iniciada ou excluída no meio: exporte de novo para ter o retrato exato.' });
      }
    } catch (erro) {
      if (erro instanceof FiltroGrandeDemais) {
        toast.warning(erro.message, { description: 'Refine o filtro (período, planta, status) e exporte de novo.' });
        return;
      }
      // Erro da API o interceptor já mostra; aqui, o da planilha em si
      if (!(erro as { isAxiosError?: boolean } | null)?.isAxiosError) {
        console.error('Exportação das OS:', erro);
        toast.error('Não foi possível exportar', { description: erro instanceof Error ? erro.message : undefined });
      }
    } finally {
      setExportando(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={exportar} disabled={exportando} className="flex-1 sm:flex-none">
      {exportando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
      {exportando ? 'Exportando...' : 'Exportar'}
    </Button>
  );
}
