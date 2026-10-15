import { isAxiosError } from 'axios';
import { formatApiError } from '@/utils/api-error';

/**
 * A mensagem que o backend mandou no erro, quando mandou.
 *
 * `undefined` quando nao veio nenhuma: quem chama mostra o proprio texto
 * ("Nao foi possivel remover"), que diz mais do que um status HTTP. Quando
 * veio uma lista (ValidationPipe), sai junta numa linha so.
 */
export function mensagemDoBackend(erro: unknown): string | undefined {
  return isAxiosError<{ message?: unknown }>(erro) && erro.response?.data?.message
    ? formatApiError(erro)
    : undefined;
}
