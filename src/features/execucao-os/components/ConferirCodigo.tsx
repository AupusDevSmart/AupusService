// src/features/execucao-os/components/ConferirCodigo.tsx
import { useEffect, useId, useRef, useState } from 'react';
import { CheckCircle2, FileDown, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { execucaoOSApi, type ConferenciaDoCodigo } from '@/services/execucao-os.service';
import { formatApiError, mensagemDoBackend } from '@/utils/api-error';
import { quando } from '@/features/execucao-os/utils/documento-da-os';
import { avisarFalhaDoPdf, baixarPdfDaOS } from '@/features/execucao-os/utils/baixar-pdf-da-os';

interface ConferirCodigoProps {
  aberto: boolean;
  onAbertoChange: (aberto: boolean) => void;
  /** O código do link do PDF (`?conferir=`): já confere ao abrir */
  codigoInicial?: string | null;
  onAbrirOS: (osId: string) => void;
}

/**
 * Conferir o código de verificação de um PDF de OS (SN-62): a API leva à OS
 * do código e refaz a conta sobre o conteúdo de agora. Confere quando nada
 * mudou desde a finalização; senão, diz em que parte e em qual anexo.
 *
 * O código prova o registro no sistema, não o arquivo que a pessoa recebeu (o
 * PDF se edita): por isso a conferência oferece o PDF registrado, para comparar.
 */
export function ConferirCodigo({ aberto, onAbertoChange, codigoInicial, onAbrirOS }: ConferirCodigoProps) {
  const idDoCampo = useId();
  const [codigo, setCodigo] = useState(codigoInicial ?? '');
  const [resultado, setResultado] = useState<ConferenciaDoCodigo | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [conferindo, setConferindo] = useState(false);
  const [baixando, setBaixando] = useState(false);
  // Só a resposta do último pedido vale: a de um código anterior, mais lenta,
  // aparecia embaixo do código novo
  const ultimoPedido = useRef(0);

  const conferir = async (texto: string) => {
    if (!texto.trim()) return;
    const pedido = ++ultimoPedido.current;
    setConferindo(true);
    setResultado(null);
    setErro(null);
    try {
      const conferencia = await execucaoOSApi.conferir(texto.trim());
      if (pedido === ultimoPedido.current) setResultado(conferencia);
    } catch (e) {
      // A chamada vai sem o toast global: a recusa aparece aqui, no lugar do resultado
      if (pedido === ultimoPedido.current) setErro(mensagemDoBackend(e) ?? formatApiError(e));
    } finally {
      if (pedido === ultimoPedido.current) setConferindo(false);
    }
  };

  const baixarRegistrado = async (osId: string) => {
    setBaixando(true);
    try {
      // A OS completa: o PDF leva os nomes de planta e equipamento do cadastro
      await baixarPdfDaOS(await execucaoOSApi.findOne(osId));
    } catch (e) {
      avisarFalhaDoPdf(e);
    } finally {
      setBaixando(false);
    }
  };

  // Veio pelo link do PDF: já confere
  useEffect(() => {
    if (aberto && codigoInicial) {
      setCodigo(codigoInicial);
      void conferir(codigoInicial);
    }
    // Só ao abrir com um código novo (o `conferir` muda a cada render)
  }, [aberto, codigoInicial]);

  return (
    <Dialog open={aberto} onOpenChange={onAbertoChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Conferir código de verificação</DialogTitle>
          <DialogDescription>
            Cole o código do PDF da OS. A conferência refaz a conta sobre o que está no sistema agora.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            // O Enter no campo também envia: o botão desabilitado não bastava
            if (!conferindo) void conferir(codigo);
          }}
        >
          <label htmlFor={idDoCampo} className="block text-sm text-muted-foreground">
            Código (64 letras e números)
          </label>
          <Input
            id={idDoCampo}
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="ex.: 1a2b3c4d 5e6f7a8b ..."
            autoComplete="off"
            className="font-mono text-xs"
          />
          <Button type="submit" size="sm" disabled={conferindo || !codigo.trim()}>
            {conferindo && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Conferir
          </Button>
        </form>

        {erro && (
          <p role="alert" className="text-sm text-destructive">
            {erro}
          </p>
        )}

        {resultado && (
          <div className="space-y-2 rounded-md border p-3 text-sm" role="status">
            <p className="flex items-center gap-2 font-medium">
              {resultado.confere ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4 text-destructive" />}
              {resultado.confere ? 'Confere' : 'Não confere'}
            </p>
            <p className="text-muted-foreground">
              {resultado.numero_os}
              {resultado.finalizada_em ? `, finalizada em ${quando(resultado.finalizada_em)} (horário de Brasília)` : ''}
              {resultado.finalizado_por ? ` por ${resultado.finalizado_por}` : ''}.
            </p>
            {resultado.confere ? (
              <p>O registro no sistema é o mesmo da finalização.</p>
            ) : (
              <>
                <p>O registro no sistema mudou depois da finalização em: {resultado.diferencas.join(', ')}.</p>
                {resultado.anexos.length > 0 && (
                  <ul className="list-disc pl-5 text-muted-foreground">
                    {resultado.anexos.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                )}
              </>
            )}
            <p className="text-xs text-muted-foreground">
              O código prova o registro no sistema, não o arquivo que você recebeu: compare o seu PDF com o PDF registrado.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => baixarRegistrado(resultado.os_id)} disabled={baixando}>
                {baixando ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <FileDown className="mr-1.5 h-4 w-4" />}
                Baixar o PDF registrado
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => onAbrirOS(resultado.os_id)}>
                Abrir a OS
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
