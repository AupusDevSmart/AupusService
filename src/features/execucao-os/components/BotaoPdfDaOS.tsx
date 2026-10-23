// src/features/execucao-os/components/BotaoPdfDaOS.tsx
import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { avisarFalhaDoPdf, baixarPdfDaOS, type OSDoPdf } from '@/features/execucao-os/utils/baixar-pdf-da-os';

const COM_PDF = new Set(['EXECUTADA', 'AUDITADA', 'FINALIZADA']);

/**
 * O PDF da OS (SN-62). Finalizada, sai do conteúdo gravado na finalização,
 * com o código de verificação; antes disso (executada, auditada), é prévia
 * sem código. O cliente baixa o das OS das plantas dele.
 */
export function BotaoPdfDaOS({ os }: { os: OSDoPdf }) {
  const [gerando, setGerando] = useState(false);
  const status = os.statusExecucao ?? os.status ?? '';
  if (!COM_PDF.has(status)) return null;

  const gerar = async () => {
    setGerando(true);
    try {
      await baixarPdfDaOS(os);
    } catch (erro) {
      avisarFalhaDoPdf(erro);
    } finally {
      setGerando(false);
    }
  };

  return (
    <Button type="button" variant="outline" size="sm" onClick={gerar} disabled={gerando}>
      {gerando ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <FileDown className="mr-1.5 h-4 w-4" />}
      {status === 'FINALIZADA' ? 'Baixar PDF' : 'PDF (prévia)'}
    </Button>
  );
}
