// src/features/execucao-os/components/AnexosDaOS.tsx
import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, Download, FileText, Loader2, Paperclip, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { execucaoOSApi } from '@/services/execucao-os.service';
import { toast } from '@/hooks/use-toast';
import { formatApiError } from '@/utils/api-error';
import type { AnexoOS, TipoAnexoOS } from '@/features/execucao-os/types';
import {
  ARQUIVOS_ACEITOS,
  ROTULO_DO_TIPO,
  agruparAnexos,
  mostraMiniatura,
  podeMexerNosAnexos,
  tipoSugerido,
} from '@/features/execucao-os/utils/anexos-da-os';

interface AnexosDaOSProps {
  osId: string;
  status: string | undefined;
  /** Permissão de executar (ou gerenciar) a OS — a mesma das rotas de escrita */
  podeEditar: boolean;
}

const chaveDosAnexos = (osId: string) => ['execucao-os', osId.trim(), 'anexos'];

/**
 * Fotos e documentos que provam o que foi feito na OS. Quem enviou e quando
 * aparecem em cada um; o arquivo nunca é apagado (excluir só tira da lista) e
 * a OS finalizada ou cancelada fica só leitura.
 */
export function AnexosDaOS({ osId, status, podeEditar }: AnexosDaOSProps) {
  const queryClient = useQueryClient();
  const [tipo, setTipo] = useState<TipoAnexoOS>(tipoSugerido(status));
  const camera = useRef<HTMLInputElement>(null);
  const arquivo = useRef<HTMLInputElement>(null);
  const editavel = podeEditar && podeMexerNosAnexos(status);

  useEffect(() => setTipo(tipoSugerido(status)), [status]);

  const { data: anexos = [], isLoading } = useQuery({
    queryKey: chaveDosAnexos(osId),
    queryFn: () => execucaoOSApi.getAnexos(osId),
  });

  const enviar = useMutation({
    mutationFn: async (arquivos: File[]) => {
      for (const f of arquivos) await execucaoOSApi.uploadAnexo(osId, f, tipo);
    },
    onSuccess: (_, arquivos) =>
      toast({ title: arquivos.length > 1 ? `${arquivos.length} anexos enviados` : 'Anexo enviado' }),
    onError: (erro) => toast({ title: 'Não foi possível enviar', description: formatApiError(erro), variant: 'destructive' }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: chaveDosAnexos(osId) }),
  });

  const excluir = useMutation({
    mutationFn: (anexoId: string) => execucaoOSApi.deleteAnexo(osId, anexoId),
    onError: (erro) => toast({ title: 'Não foi possível excluir', description: formatApiError(erro), variant: 'destructive' }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: chaveDosAnexos(osId) }),
  });

  const aoEscolher = (e: React.ChangeEvent<HTMLInputElement>) => {
    const escolhidos = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (escolhidos.length > 0) enviar.mutate(escolhidos);
  };

  const grupos = agruparAnexos(anexos);

  return (
    <section aria-label="Anexos da OS" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-medium">Fotos e documentos</h3>
        {editavel && (
          <div className="flex flex-wrap items-center gap-2">
            <Select value={tipo} onValueChange={(v) => setTipo(v as TipoAnexoOS)}>
              <SelectTrigger className="h-8 w-44" aria-label="Tipo do anexo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(ROTULO_DO_TIPO) as TipoAnexoOS[]).map((t) => (
                  <SelectItem key={t} value={t}>
                    {ROTULO_DO_TIPO[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" size="sm" variant="outline" className="h-8" disabled={enviar.isPending} onClick={() => camera.current?.click()}>
              <Camera className="mr-1.5 h-4 w-4" />
              Tirar foto
            </Button>
            <Button type="button" size="sm" variant="outline" className="h-8" disabled={enviar.isPending} onClick={() => arquivo.current?.click()}>
              {enviar.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Paperclip className="mr-1.5 h-4 w-4" />}
              Anexar arquivo
            </Button>
            {/* capture abre a câmera traseira no celular; no computador vira seletor de arquivo */}
            <input ref={camera} type="file" accept="image/*" capture="environment" className="hidden" onChange={aoEscolher} data-testid="entrada-camera" />
            <input ref={arquivo} type="file" accept={ARQUIVOS_ACEITOS} multiple className="hidden" onChange={aoEscolher} data-testid="entrada-arquivo" />
          </div>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando anexos...</p>
      ) : grupos.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {editavel ? 'Nenhum anexo ainda. Fotografe antes, durante e depois do serviço.' : 'Nenhum anexo.'}
        </p>
      ) : (
        grupos.map((g) => (
          <div key={g.titulo} className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{g.titulo}</p>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {g.anexos.map((a) => (
                <ItemDoAnexo
                  key={a.id}
                  osId={osId}
                  anexo={a}
                  podeExcluir={editavel}
                  excluindo={excluir.isPending && excluir.variables === a.id}
                  onExcluir={() => a.id && excluir.mutate(a.id)}
                />
              ))}
            </ul>
          </div>
        ))
      )}
    </section>
  );
}

function ItemDoAnexo({
  osId,
  anexo,
  podeExcluir,
  excluindo,
  onExcluir,
}: {
  osId: string;
  anexo: AnexoOS;
  podeExcluir: boolean;
  excluindo: boolean;
  onExcluir: () => void;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const imagem = mostraMiniatura(anexo.mime_type);
  const url = useUrlDoArquivo(osId, anexo, imagem);

  const baixar = async () => {
    try {
      const blob = await execucaoOSApi.downloadAnexo(osId, anexo.id!);
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = anexo.nome_original;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (erro) {
      toast({ title: 'Não foi possível baixar', description: formatApiError(erro), variant: 'destructive' });
    }
  };

  return (
    <li className="flex gap-3 rounded-md border bg-card p-2">
      {imagem && url ? (
        <a href={url} target="_blank" rel="noreferrer" className="shrink-0">
          <img src={url} alt={anexo.descricao || anexo.nome_original} className="h-16 w-16 rounded object-cover" />
        </a>
      ) : (
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded bg-muted">
          <FileText className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
      <div className="min-w-0 flex-1 text-xs">
        <p className="truncate text-sm font-medium" title={anexo.nome_original}>
          {anexo.descricao || anexo.nome_original}
        </p>
        <p className="text-muted-foreground">{ROTULO_DO_TIPO[anexo.tipo]}</p>
        <p className="text-muted-foreground">
          {anexo.uploaded_by ? `${anexo.uploaded_by}, ` : ''}
          {new Date(anexo.uploaded_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={baixar} aria-label="Baixar">
              <Download className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Baixar</TooltipContent>
        </Tooltip>
        {podeExcluir &&
          (confirmando ? (
            <div className="flex gap-1">
              <Button type="button" size="sm" variant="destructive" className="h-7 px-2 text-xs" disabled={excluindo} onClick={onExcluir}>
                Excluir
              </Button>
              <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setConfirmando(false)}>
                Não
              </Button>
            </div>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => setConfirmando(true)} aria-label="Excluir anexo">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Excluir anexo</TooltipContent>
            </Tooltip>
          ))}
      </div>
    </li>
  );
}

/** O arquivo vem pela rota autenticada; vira URL local só enquanto o item está na tela. */
function useUrlDoArquivo(osId: string, anexo: AnexoOS, carregar: boolean): string | null {
  const { data: blob } = useQuery({
    queryKey: [...chaveDosAnexos(osId), anexo.id, 'arquivo'],
    queryFn: () => execucaoOSApi.downloadAnexo(osId, anexo.id!),
    enabled: carregar && !!anexo.id,
    staleTime: Infinity,
  });
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!blob) return;
    const local = URL.createObjectURL(blob);
    setUrl(local);
    return () => URL.revokeObjectURL(local);
  }, [blob]);
  return url;
}
