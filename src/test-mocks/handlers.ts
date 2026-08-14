/**
 * MSW handlers — respostas mock pros endpoints que o frontend consome
 * durante os testes.
 *
 * Comeca vazio de proposito. Com `onUnhandledRequest: 'error'` no test-setup,
 * qualquer request sem handler falha o teste de forma explicita — que e o
 * comportamento que se quer enquanto nao ha mock de dominio nenhum.
 *
 * Ao escrever teste que dependa de API, adicione o handler aqui se ele for util
 * pra varios testes, ou sobrescreva pontualmente no proprio teste:
 *
 *   server.use(http.get('*\/instrucoes', () => HttpResponse.json([])));
 */
import type { RequestHandler } from 'msw';

export const handlers: RequestHandler[] = [];
