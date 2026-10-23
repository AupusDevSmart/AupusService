import { AxiosError } from 'axios';
import { describe, expect, it } from 'vitest';
import { formatApiError, mensagemDoBackend } from '@/utils/api-error';

const erroComCorpo = (status: number, data: unknown) =>
  new AxiosError(String(status), 'ERR_BAD_REQUEST', undefined, undefined, { status, data } as never);

/**
 * Todo erro da API passa pelo HttpExceptionFilter, que manda a mensagem em
 * `error.message`. O `mensagemDoBackend` só lia `data.message` (o formato
 * padrão do Nest): devolvia sempre undefined e a tela mostrava só o texto
 * genérico ("Erro ao criar planta", "Nao foi possivel remover") — achado no
 * SN-12. Lê os dois formatos, como o `formatApiError`.
 */
describe('mensagemDoBackend', () => {
  it('lê a mensagem do envelope deste backend', () => {
    const erro = erroComCorpo(400, { success: false, error: { code: 'BAD_REQUEST', message: 'Exclua os componentes antes' } });

    expect(mensagemDoBackend(erro)).toBe('Exclua os componentes antes');
  });

  it('junta a lista do ValidationPipe numa linha', () => {
    const erro = erroComCorpo(400, { success: false, error: { message: ['nome é obrigatório', 'tag é obrigatória'] } });

    expect(mensagemDoBackend(erro)).toBe('nome é obrigatório; tag é obrigatória');
  });

  it('lê também o formato padrão do Nest', () => {
    expect(mensagemDoBackend(erroComCorpo(404, { statusCode: 404, message: 'Não encontrado' }))).toBe('Não encontrado');
  });

  it('sem mensagem do backend, devolve undefined para quem chama usar o próprio texto', () => {
    expect(mensagemDoBackend(erroComCorpo(500, undefined))).toBeUndefined();
    expect(mensagemDoBackend(new AxiosError('Network Error', 'ERR_NETWORK'))).toBeUndefined();
    expect(mensagemDoBackend(new Error('falhou'))).toBeUndefined();
  });

  it('dá o mesmo texto que o formatApiError quando há mensagem', () => {
    const erro = erroComCorpo(409, { success: false, error: { message: 'TAG já existe' } });

    expect(mensagemDoBackend(erro)).toBe(formatApiError(erro));
  });
});
