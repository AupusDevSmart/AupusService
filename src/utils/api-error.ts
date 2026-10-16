/**
 * Normaliza erro do axios em mensagem legivel para toast.
 *
 * Tratamentos cobertos:
 * - `response.data.message` como string OU array (NestJS ValidationPipe
 *   retorna `string[]` quando varias regras falham — uniao com "; ").
 * - `response.data.message` como objeto (raro mas possivel).
 * - Network error (sem `response`).
 * - Status code sem `data.message` (usa statusText).
 * - Erro fora do axios (Error generico ou throw de string).
 */
type AxiosErrorLike = {
  response?: {
    data?: { message?: unknown; error?: unknown };
    status?: number;
    statusText?: string;
  };
  message?: unknown;
};

/** Aceita string ou string[] (ValidationPipe manda array quando falha em varias regras). */
function textoDaMensagem(valor: unknown): string | null {
  if (Array.isArray(valor)) {
    const juntas = valor.filter(Boolean).join('; ');
    return juntas || null;
  }
  if (typeof valor === 'string' && valor) return valor;
  if (valor && typeof valor === 'object') {
    try {
      return JSON.stringify(valor);
    } catch {
      return String(valor);
    }
  }
  return null;
}

export function formatApiError(err: unknown): string {
  if (!err) return 'Erro desconhecido';

  const { response, message } = err as AxiosErrorLike;

  // Erro do axios com response do backend
  if (response) {
    const data = response.data;

    // NestJS padrao: { message: string | string[], error, statusCode }
    const direta = textoDaMensagem(data?.message);
    if (direta) return direta;

    // Formato do HttpExceptionFilter deste backend:
    // { success: false, error: { code, message, details }, meta }
    // Sem isso o usuario via "400 Bad Request" no lugar da mensagem real.
    const aninhada = textoDaMensagem((data?.error as { message?: unknown })?.message);
    if (aninhada) return aninhada;

    if (typeof data?.error === 'string') return data.error;
    if (response.statusText) return `${response.status} ${response.statusText}`;
    return `HTTP ${response.status}`;
  }

  // Network error / timeout — axios sem response
  if (message === 'Network Error') {
    return 'Sem conexao com o servidor';
  }

  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'Erro desconhecido';
}

/**
 * A mensagem que o backend mandou no erro, quando mandou. `undefined` quando
 * não veio nenhuma (rede, status sem corpo): quem chama mostra o próprio texto
 * ("Nao foi possivel remover"), que diz mais do que um status HTTP.
 *
 * Lê os mesmos dois formatos do `formatApiError`: o do Nest (`data.message`) e
 * o do HttpExceptionFilter deste backend (`data.error.message`), por onde passa
 * todo erro da API. As cópias que liam só o primeiro devolviam sempre
 * undefined, e a tela nunca mostrava o motivo (achado no SN-12).
 */
/**
 * Regra de nova tentativa do React Query: só falha de rede (sem resposta)
 * repete, até duas vezes. Erro com resposta (400, 403, 500) não melhora
 * tentando, e o interceptor dá um toast a cada tentativa — o padrão do TanStack
 * repete três vezes: quatro toasts e a tela de erro uns 7 s atrasada.
 */
export const soRepeteFalhaDeRede = (tentativas: number, err: unknown): boolean =>
  !(err as AxiosErrorLike | null | undefined)?.response && tentativas < 2;

export function mensagemDoBackend(err: unknown): string | undefined {
  const data = (err as AxiosErrorLike | null | undefined)?.response?.data;
  return (
    textoDaMensagem(data?.message) ??
    textoDaMensagem((data?.error as { message?: unknown } | undefined)?.message) ??
    undefined
  );
}
