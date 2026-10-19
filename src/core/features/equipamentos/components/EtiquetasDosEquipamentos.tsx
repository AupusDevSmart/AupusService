import { useState } from 'react';
import { Loader2, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu';
import { etiquetaDe, type DadosDaEtiqueta } from '@/core/features/equipamentos/utils/etiqueta';
import type { FormatoDaEtiqueta } from '@/lib/pdf/etiqueta-de-equipamento';

interface EtiquetasDosEquipamentosProps {
  /** Os equipamentos da etiqueta: o do sheet, ou toda a lista filtrada */
  carregar: () => Promise<DadosDaEtiqueta[]>;
  nomeDoArquivo: string;
  rotulo?: string;
  className?: string;
}

const FORMATOS: { formato: FormatoDaEtiqueta; titulo: string; detalhe: string }[] = [
  { formato: 'etiqueta', titulo: 'Etiqueta 100 × 65 mm', detalhe: 'Uma por página, para impressora de etiquetas' },
  { formato: 'a4', titulo: 'Folha A4', detalhe: '8 por folha, para recortar ou papel adesivo' },
];

/**
 * Etiqueta com QR do equipamento (SN-67): o QR abre o cadastro dele, com o
 * escopo de quem lê. O PDF (react-pdf, pesado) só carrega no clique.
 */
export function EtiquetasDosEquipamentos({ carregar, nomeDoArquivo, rotulo = 'Etiqueta', className }: EtiquetasDosEquipamentosProps) {
  const [gerando, setGerando] = useState(false);

  const gerar = async (formato: FormatoDaEtiqueta) => {
    setGerando(true);
    try {
      const dados = await carregar();
      if (dados.length === 0) {
        toast.info('Nenhum equipamento para etiquetar com estes filtros.');
        return;
      }
      const { baixarEtiquetas } = await import('@/lib/pdf/etiqueta-de-equipamento');
      await baixarEtiquetas(
        dados.map((d) => etiquetaDe(d, window.location.origin)),
        formato,
        nomeDoArquivo,
      );
    } catch (erro) {
      // Erro da API o interceptor já mostrou; aqui, o do PDF em si
      if (!(erro as { isAxiosError?: boolean } | null)?.isAxiosError) {
        console.error('Etiqueta do equipamento:', erro);
        toast.error('Não foi possível gerar a etiqueta', { description: erro instanceof Error ? erro.message : undefined });
      }
    } finally {
      setGerando(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className={className ?? 'btn-minimal-outline whitespace-nowrap'} disabled={gerando}>
          {gerando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <QrCode className="mr-2 h-4 w-4" />}
          {gerando ? 'Gerando...' : rotulo}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {FORMATOS.map(({ formato, titulo, detalhe }) => (
          <DropdownMenuItem key={formato} onSelect={() => void gerar(formato)} className="flex flex-col items-start gap-0.5">
            <span>{titulo}</span>
            <span className="text-xs text-muted-foreground">{detalhe}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
