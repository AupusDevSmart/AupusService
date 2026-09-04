import { useEffect, useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/core/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { formatApiError } from '@/utils/api-error';
import { OUTRO_PRODUTO, PreviaDaCadeia } from './useSincronizacao';

export interface AlvoDoCompartilhamento {
  id: string;
  nome: string;
  /** `ligar` pede a previa da hierarquia; `desligar` so confirma. */
  acao: 'ligar' | 'desligar';
}

interface Props {
  alvo: AlvoDoCompartilhamento | null;
  onFechar: () => void;
  onPrevia: (id: string) => Promise<PreviaDaCadeia>;
  onCompartilhar: (id: string) => Promise<void>;
  onParar: (id: string) => Promise<void>;
}

/**
 * Confirmacao de compartilhamento — UM por pagina, nao um por linha.
 *
 * Renderizado uma vez e controlado por `alvo`. Montar este dialogo dentro da
 * linha da tabela criaria um por registro: na tela de equipamentos seriam 250
 * AlertDialogs no DOM para que no maximo um apareca. Mesmo motivo pelo qual o
 * sheet de instrucao vive no nivel de cima, e nao dentro da secao que o abre.
 *
 * Compartilhar e uma DECISAO, nao um envio: a partir dela as edicoes dos dois
 * lados se propagam sozinhas. O texto diz isso com todas as letras, porque
 * "compartilhar" sozinho sugere copia unica — e a diferenca so apareceria
 * quando alguem editasse do outro lado e visse a mudanca aqui.
 *
 * E lista a HIERARQUIA que vai junto. Nao existe planta sem proprietario nem
 * instalacao sem planta, entao compartilhar um equipamento pode levar um
 * USUARIO para o outro produto — isso nunca pode acontecer sem a pessoa ver.
 */
export function DialogoCompartilhar({
  alvo, onFechar, onPrevia, onCompartilhar, onParar,
}: Props) {
  const [salvando, setSalvando] = useState(false);
  const [previa, setPrevia] = useState<PreviaDaCadeia | null>(null);
  const [carregandoPrevia, setCarregandoPrevia] = useState(false);
  const [erroPrevia, setErroPrevia] = useState<string | null>(null);

  const alvoId = alvo?.id;
  const alvoAcao = alvo?.acao;

  useEffect(() => {
    if (alvoAcao !== 'ligar' || !alvoId) { setPrevia(null); setErroPrevia(null); return; }

    let cancelado = false;
    setPrevia(null);
    setErroPrevia(null);
    setCarregandoPrevia(true);

    onPrevia(alvoId)
      .then(p => { if (!cancelado) setPrevia(p); })
      .catch(e => {
        // Sem previa nao da para pedir consentimento informado, entao o dialogo
        // mostra o erro e NAO oferece o botao de confirmar. Compartilhar no
        // escuro e exatamente o que este fluxo existe para impedir.
        if (!cancelado) setErroPrevia(formatApiError(e));
      })
      .finally(() => { if (!cancelado) setCarregandoPrevia(false); });

    return () => { cancelado = true; };
  }, [alvoId, alvoAcao, onPrevia]);

  if (!alvo) return null;

  const ligando = alvo.acao === 'ligar';

  const executar = async () => {
    setSalvando(true);
    try {
      if (ligando) {
        await onCompartilhar(alvo.id);
        const extras = previa?.faltando?.length ?? 0;
        toast({
          title: `Compartilhado com o ${OUTRO_PRODUTO}`,
          description: extras
            ? `${1 + extras} registros passam a se propagar nos dois sentidos.`
            : 'As edições dos dois lados passam a se propagar.',
        });
      } else {
        await onParar(alvo.id);
        toast({
          title: 'Compartilhamento encerrado',
          description: `O registro continua no ${OUTRO_PRODUTO}, mas para de receber alterações.`,
        });
      }
      onFechar();
    } catch (error) {
      toast({
        title: 'Não foi possível concluir',
        description: formatApiError(error),
        variant: 'destructive',
      });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <AlertDialog open onOpenChange={o => !o && onFechar()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {ligando ? `Compartilhar com o ${OUTRO_PRODUTO}?` : 'Parar de compartilhar?'}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            {ligando ? (
              <div className="space-y-3">
                <p>
                  <span className="font-medium text-foreground">{alvo.nome}</span> passa a existir
                  também no {OUTRO_PRODUTO}. A partir daí, editar de qualquer um dos dois lados
                  atualiza o outro — não é uma cópia única.
                </p>

                {carregandoPrevia && (
                  <p className="flex items-center gap-2 text-sm">
                    <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                    Verificando o que precisa ir junto...
                  </p>
                )}

                {erroPrevia && (
                  <div className="flex items-start gap-2 rounded-md border border-destructive p-2.5">
                    <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <span className="text-sm min-w-0">{erroPrevia}</span>
                  </div>
                )}

                {previa && previa.faltando.length > 0 && (
                  <div className="rounded-md border p-2.5 space-y-1.5">
                    <p className="text-sm font-medium text-foreground">
                      Estes também serão compartilhados:
                    </p>
                    {/* Por NOME, e nao so a contagem: "1 usuário" nao deixa
                        ninguem decidir se aquele usuario deve mesmo atravessar. */}
                    <ul className="space-y-1">
                      {previa.faltando.map(elo => (
                        <li
                          key={`${elo.recurso}-${elo.registro_id}`}
                          className="flex gap-1.5 text-sm min-w-0"
                        >
                          <span className="text-muted-foreground shrink-0">{elo.comoChamar}:</span>
                          {/* `min-w-0` no pai e obrigatorio para o truncate
                              funcionar — sem ele o filho assume a largura do
                              conteudo e estoura a horizontal em 360px. */}
                          <span className="font-medium text-foreground truncate">{elo.nome}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {previa && previa.faltando.length === 0 && (
                  <p className="text-sm">Tudo de que ele depende já está compartilhado.</p>
                )}
              </div>
            ) : (
              <span>
                <span className="font-medium text-foreground">{alvo.nome}</span> continua no{' '}
                {OUTRO_PRODUTO}, mas para de receber as alterações feitas aqui.
                Nada é apagado de lá.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={salvando}>Cancelar</AlertDialogCancel>
          {(!ligando || (previa && !erroPrevia)) && (
            <AlertDialogAction
              onClick={e => { e.preventDefault(); void executar(); }}
              disabled={salvando}
            >
              {salvando ? (
                <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Aguarde...</>
              ) : ligando ? 'Compartilhar' : 'Parar'}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
