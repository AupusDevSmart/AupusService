// src/features/execucao-os/components/FotosDoItem.tsx
import { useRef, useState } from 'react';
import { Camera, FileText, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { AnexoOS, DestinoDoAnexo, TipoAnexoOS } from '@/features/execucao-os/types';
import { mostraMiniatura } from '@/features/execucao-os/utils/anexos-da-os';
import { baixarAnexo, ehFoto, useEnviarAnexos, useExcluirAnexo, useUrlDoArquivo } from '@/features/execucao-os/hooks/useAnexosDaOS';

interface FotosDoItemProps {
  osId: string;
  /** O item do checklist (que já leva a tarefa) ou a tarefa */
  destino: DestinoDoAnexo;
  /** Os anexos que já provam este item ou esta tarefa */
  fotos: AnexoOS[];
  /** Tirar e excluir; sem isso, só as miniaturas */
  editavel: boolean;
  /** O tipo do anexo pelo momento da OS (durante, depois...) */
  tipo: TipoAnexoOS;
  /** Para o rótulo da câmera: "Fotografar <rotulo>" */
  rotulo: string;
  /** O passo exige foto: sem nenhuma, mostra o aviso */
  exigeFoto?: boolean;
  /** A consulta dos anexos ainda não voltou: "sem foto" ainda não é verdade */
  carregando?: boolean;
}

/**
 * As fotos de um item do checklist ou de uma tarefa da OS (SN-59): a câmera ao
 * lado do que a foto prova e as miniaturas debaixo. No celular, o botão abre a
 * câmera traseira; no computador, o seletor de arquivo. Excluir pede
 * confirmação e só tira da lista (o arquivo, que é a prova, fica).
 */
export function FotosDoItem({ osId, destino, fotos, editavel, tipo, rotulo, exigeFoto, carregando }: FotosDoItemProps) {
  const camera = useRef<HTMLInputElement>(null);
  const enviar = useEnviarAnexos(osId);
  const excluir = useExcluirAnexo(osId);

  if (!editavel && fotos.length === 0) return null;

  const aoEscolher = (e: React.ChangeEvent<HTMLInputElement>) => {
    const escolhidos = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (escolhidos.length > 0) enviar.mutate({ arquivos: escolhidos, tipo, destino });
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {fotos.map((foto) => (
        <Miniatura
          key={foto.id}
          osId={osId}
          anexo={foto}
          podeExcluir={editavel}
          excluindo={excluir.isPending && excluir.variables === foto.id}
          onExcluir={() => foto.id && excluir.mutate(foto.id)}
        />
      ))}
      {editavel && (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                disabled={enviar.isPending}
                onClick={() => camera.current?.click()}
                aria-label={`Fotografar ${rotulo}`}
                data-fundo-proprio
              >
                {enviar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Fotografar {rotulo}</TooltipContent>
          </Tooltip>
          {/* capture abre a câmera traseira no celular; no computador vira seletor de arquivo */}
          <input ref={camera} type="file" accept="image/*" capture="environment" className="hidden" onChange={aoEscolher} data-testid={`camera-${rotulo}`} />
        </>
      )}
      {/* A mesma conta da trava e da API: imagem, não documento */}
      {exigeFoto && !fotos.some(ehFoto) && (
        <span className="text-xs text-muted-foreground">{carregando ? 'carregando fotos' : 'foto obrigatória'}</span>
      )}
    </div>
  );
}

function Miniatura({
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
  const nome = anexo.descricao || anexo.nome_original;

  return (
    <span className="relative inline-flex">
      {url ? (
        <a href={url} target="_blank" rel="noreferrer" title={nome}>
          <img src={url} alt={nome} className="h-10 w-10 rounded object-cover" />
        </a>
      ) : (
        // HEIC (iPhone), PDF: a tela não desenha, então o ícone baixa o arquivo
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => baixarAnexo(osId, anexo)}
              aria-label={`Baixar ${nome}`}
              data-fundo-proprio
              className="flex h-10 w-10 items-center justify-center rounded bg-muted"
            >
              <FileText className="h-4 w-4 text-muted-foreground" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Baixar {nome}</TooltipContent>
        </Tooltip>
      )}
      {podeExcluir &&
        (confirmando ? (
          <span className="ml-1 inline-flex items-center gap-1">
            <Button type="button" size="sm" variant="destructive" className="h-6 px-1.5 text-[11px]" disabled={excluindo} onClick={onExcluir}>
              Excluir
            </Button>
            <Button type="button" size="sm" variant="ghost" className="h-6 px-1.5 text-[11px]" onClick={() => setConfirmando(false)}>
              Não
            </Button>
          </span>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setConfirmando(true)}
                aria-label={`Excluir a foto ${nome}`}
                data-fundo-proprio
                className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full border bg-background text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Excluir a foto</TooltipContent>
          </Tooltip>
        ))}
    </span>
  );
}
