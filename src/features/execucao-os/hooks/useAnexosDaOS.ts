// src/features/execucao-os/hooks/useAnexosDaOS.ts
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { execucaoOSApi } from '@/services/execucao-os.service';
import { toast } from '@/hooks/use-toast';
import { formatApiError, soRepeteFalhaDeRede } from '@/utils/api-error';
import type { AnexoOS, DestinoDoAnexo, TipoAnexoOS } from '@/features/execucao-os/types';
import { mostraMiniatura } from '@/features/execucao-os/utils/anexos-da-os';

/**
 * Os anexos da OS numa consulta só: a seção "Fotos e documentos" mostra os
 * gerais, e o "O que foi feito" mostra os de cada tarefa e item (SN-59). Os
 * dois leem e invalidam a mesma chave, então a foto tirada num lugar aparece
 * no outro.
 */
export const chaveDosAnexos = (osId: string) => ['execucao-os', osId.trim(), 'anexos'];

export function useAnexosDaOS(osId: string) {
  return useQuery({
    queryKey: chaveDosAnexos(osId),
    queryFn: () => execucaoOSApi.getAnexos(osId),
    // 4xx/5xx não se repete: o interceptor já avisou, e repetir dava o mesmo aviso de novo
    retry: soRepeteFalhaDeRede,
  });
}

/** A foto que conta para o item que exige foto: imagem, não documento (a mesma regra da API). */
export const ehFoto = (anexo: Pick<AnexoOS, 'mime_type'>) => anexo.mime_type?.toLowerCase().startsWith('image/') ?? false;

/** Anexo geral da OS: não prova nenhuma tarefa nem item. */
export const ehGeral = (anexo: AnexoOS) => !anexo.tarefa_os_id && !anexo.checklist_item_id;

/** Só a lista: o arquivo de cada miniatura (outra chave, debaixo desta) não precisa baixar de novo. */
const invalidarALista = (queryClient: ReturnType<typeof useQueryClient>, osId: string) =>
  queryClient.invalidateQueries({ queryKey: chaveDosAnexos(osId), exact: true });

/** O envio parou no meio: quantos já tinham subido, para ninguém mandar tudo de novo. */
class EnvioIncompleto extends Error {
  constructor(
    readonly causa: unknown,
    readonly enviados: number,
    readonly total: number,
  ) {
    super('envio incompleto');
  }
}

export function useEnviarAnexos(osId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ arquivos, tipo, destino }: { arquivos: File[]; tipo: TipoAnexoOS; destino?: DestinoDoAnexo }) => {
      let enviados = 0;
      try {
        for (const f of arquivos) {
          await execucaoOSApi.uploadAnexo(osId, f, tipo, undefined, destino);
          enviados++;
        }
      } catch (erro) {
        throw new EnvioIncompleto(erro, enviados, arquivos.length);
      }
    },
    onSuccess: (_, { arquivos }) =>
      toast({ title: arquivos.length > 1 ? `${arquivos.length} anexos enviados` : 'Anexo enviado' }),
    onError: (erro) => {
      const { causa, enviados, total } = erro instanceof EnvioIncompleto ? erro : { causa: erro, enviados: 0, total: 1 };
      toast({
        title: enviados > 0 ? `${enviados} de ${total} enviados; o resto não foi` : 'Não foi possível enviar',
        description: formatApiError(causa),
        variant: 'destructive',
      });
    },
    onSettled: () => invalidarALista(queryClient, osId),
  });
}

export function useExcluirAnexo(osId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (anexoId: string) => execucaoOSApi.deleteAnexo(osId, anexoId),
    onError: (erro) => toast({ title: 'Não foi possível excluir', description: formatApiError(erro), variant: 'destructive' }),
    onSettled: () => invalidarALista(queryClient, osId),
  });
}

/** O arquivo vem pela rota autenticada; vira URL local só enquanto o item está na tela. */
export function useUrlDoArquivo(osId: string, anexo: AnexoOS, carregar: boolean): string | null {
  const { data: blob } = useQuery({
    queryKey: [...chaveDosAnexos(osId), anexo.id, 'arquivo'],
    queryFn: () => execucaoOSApi.downloadAnexo(osId, anexo.id!),
    enabled: carregar && !!anexo.id,
    staleTime: Infinity,
  });
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!blob) return;
    // O tipo do blob é o da lista fechada (mostraMiniatura), nunca o que veio na resposta
    const tipo = mostraMiniatura(anexo.mime_type) ? anexo.mime_type.toLowerCase() : 'application/octet-stream';
    const local = URL.createObjectURL(new Blob([blob], { type: tipo }));
    setUrl(local);
    return () => URL.revokeObjectURL(local);
  }, [blob, anexo.mime_type]);
  return url;
}

/** Baixa o arquivo com o nome original (HEIC, PDF, documento: o que a tela não desenha). */
export async function baixarAnexo(osId: string, anexo: AnexoOS): Promise<void> {
  try {
    const blob = await execucaoOSApi.downloadAnexo(osId, anexo.id!);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([blob], { type: 'application/octet-stream' }));
    link.download = anexo.nome_original;
    link.click();
    URL.revokeObjectURL(link.href);
  } catch (erro) {
    toast({ title: 'Não foi possível baixar', description: formatApiError(erro), variant: 'destructive' });
  }
}
