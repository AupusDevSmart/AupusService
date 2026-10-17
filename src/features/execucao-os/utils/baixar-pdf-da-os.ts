// src/features/execucao-os/utils/baixar-pdf-da-os.ts
import { toast } from 'sonner';
import { execucaoOSApi } from '@/services/execucao-os.service';
import { documentoDaOS, urlDeConferencia } from '@/features/execucao-os/utils/documento-da-os';
import { fotosDoPdf } from '@/features/execucao-os/utils/fotos-do-pdf';
import type { InstalacaoDaOrigem } from '@/utils/instalacao';

/** O que o PDF lê da OS além do conteúdo: o id e os nomes do cadastro de hoje */
export interface OSDoPdf {
  id: string;
  status?: string;
  statusExecucao?: string;
  planta?: { nome?: string | null } | null;
  equipamento?: { nome?: string | null } | null;
  instalacoes?: InstalacaoDaOrigem[];
}

/**
 * Monta e baixa o PDF da OS (SN-62): o conteúdo do relatório (o gravado na
 * finalização, com o código; antes, a prévia), as fotos conferidas pela soma e
 * reduzidas, e o desenho no papel timbrado. Do sheet da OS e da conferência do
 * código ("Baixar o PDF registrado").
 */
export async function baixarPdfDaOS(os: OSDoPdf): Promise<void> {
  const relatorio = await execucaoOSApi.relatorio(os.id);
  const fotos = await fotosDoPdf(relatorio.conteudo.anexos, (anexoId) =>
    execucaoOSApi.downloadAnexo(os.id, anexoId, { semAvisoGlobal: true }),
  );
  const documento = documentoDaOS(
    relatorio,
    { planta: os.planta?.nome, equipamento: os.equipamento?.nome, instalacoes: os.instalacoes },
    fotos,
    relatorio.codigo ? urlDeConferencia(relatorio.codigo) : '',
  );
  // Carregada só aqui: a biblioteca é pesada, e quem não gera PDF não paga por ela
  const { gerarPdfDaOS } = await import('@/lib/pdf/ordem-de-servico');
  await gerarPdfDaOS(documento);
}

/** Erro da API o interceptor já mostra; aqui, o do PDF em si (desenho, foto, fonte) */
export function avisarFalhaDoPdf(erro: unknown) {
  if ((erro as { isAxiosError?: boolean } | null)?.isAxiosError) return;
  console.error('PDF da OS:', erro);
  toast.error('Não foi possível gerar o PDF', { description: erro instanceof Error ? erro.message : undefined });
}
