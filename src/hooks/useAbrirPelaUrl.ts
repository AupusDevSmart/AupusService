import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { formatApiError } from '@/utils/api-error';

/** Id de registro: cuid (25) ou hex (26). Outra coisa no link não vira caminho de API ("../usuarios/x"). */
const FORMATO_DO_ID = /^[A-Za-z0-9]{20,30}$/;

/** Erro HTTP já sai no toast do interceptor do axios: aqui só o que não veio da API. */
const veioDaApi = (erro: unknown) => typeof erro === 'object' && erro !== null && 'response' in erro && Boolean(erro.response);

/**
 * Abre o registro que veio no link (`?anomaliaId=...`): é por onde a
 * notificação leva à anomalia ou à solicitação (SN-47).
 *
 * O parâmetro sai da URL na hora: fechar o sheet não pode reabrir, e o mesmo
 * link clicado de novo depois volta a abrir. A ref segura a segunda chamada do
 * StrictMode, que chega antes de o parâmetro sumir.
 */
export function useAbrirPelaUrl(parametro: string, abrir: (id: string) => Promise<unknown>) {
  const [searchParams, setSearchParams] = useSearchParams();
  const id = searchParams.get(parametro)?.trim() || null;
  const abrirAtual = useRef(abrir);
  abrirAtual.current = abrir;
  const aberto = useRef<string | null>(null);

  useEffect(() => {
    if (!id) {
      aberto.current = null;
      return;
    }
    if (aberto.current === id) return;
    aberto.current = id;

    setSearchParams(
      (atual) => {
        const proximo = new URLSearchParams(atual);
        proximo.delete(parametro);
        return proximo;
      },
      { replace: true },
    );
    if (!FORMATO_DO_ID.test(id)) {
      toast.error('Link inválido', { description: 'O endereço não traz o registro em um formato conhecido.' });
      return;
    }
    abrirAtual.current(id).catch((erro: unknown) => {
      if (!veioDaApi(erro)) toast.error('Não foi possível abrir o registro do link', { description: formatApiError(erro) });
    });
  }, [id, parametro, setSearchParams]);
}
