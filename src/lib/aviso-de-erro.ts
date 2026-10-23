/**
 * Um erro da API, um aviso (SN-43).
 *
 * O interceptor do axios mostra um aviso para todo erro da API, e a tela que
 * trata o erro mostra o dela, com contexto ("Erro ao salvar componente UAR."):
 * eram dois avisos com a mesma mensagem, um em cima e outro embaixo. Agora o do
 * interceptor espera um instante; se a tela avisar ESSE erro nesse meio tempo, o
 * global dele não aparece. A tela que não trata o erro (só um console.error, ou
 * nem isso) continua com o aviso global: ninguém fica sem saber que falhou.
 *
 * Qual aviso sai:
 * - `erroParaATela(err)` (a tela mostra o erro no formulário) cancela o do `err`;
 * - um aviso de erro da tela (`toast` do shadcn com `variant: 'destructive'`,
 *   `toast.error` do Sonner) não diz de qual erro é: cancela o do último erro que
 *   a tela leu (`formatApiError`/`mensagemDoBackend` avisam qual), ou, sem esse,
 *   o mais recente. Nunca todos: duas falhas juntas, uma tratada e outra não,
 *   deixavam a segunda sem aviso.
 */

/** O React Query entrega o onError num setTimeout(0): a espera cobre isso com folga, e a pessoa não a percebe */
export const ESPERA_DO_AVISO_GLOBAL_MS = 400;

interface Pendente {
  id: ReturnType<typeof setTimeout> | undefined;
  erro: object | undefined;
}

const pendentes: Pendente[] = [];
let mostrandoGlobal = false;
let ultimoLido: object | null = null;

const objeto = (valor: unknown): object | undefined => (valor && typeof valor === 'object' ? valor : undefined);

function tirar(pendente: Pendente) {
  const i = pendentes.indexOf(pendente);
  if (i >= 0) pendentes.splice(i, 1);
}

/** O interceptor agenda o aviso do erro: aparece se nenhuma tela avisar esse erro antes */
export function avisoGlobalDeErro(mostrar: () => void, espera = ESPERA_DO_AVISO_GLOBAL_MS, erro?: unknown): void {
  const pendente: Pendente = { id: undefined, erro: objeto(erro) };
  pendente.id = setTimeout(() => {
    tirar(pendente);
    mostrandoGlobal = true;
    try {
      mostrar();
    } finally {
      mostrandoGlobal = false;
    }
  }, espera);
  pendentes.push(pendente);
}

/** Os helpers que leem a mensagem dizem qual erro a tela tem em mãos (o aviso que vier em seguida é dele) */
export function erroLido(erro: unknown): void {
  const o = objeto(erro);
  if (o) ultimoLido = o;
}

/**
 * Uma tela avisou um erro: sai o aviso global dele. Com o erro na mão, o desse
 * erro (e nenhum, se ele não tem aviso global, como a requisição com
 * `semAvisoGlobal`); sem ele, o do último erro lido ou o mais recente.
 */
export function telaAvisouErro(erro?: unknown): void {
  // O próprio aviso global passa pelo mesmo toast: não cancela os outros que esperam
  if (mostrandoGlobal) return;
  const dado = objeto(erro);
  const alvo = dado
    ? pendentes.find((p) => p.erro === dado)
    : ((ultimoLido && pendentes.find((p) => p.erro === ultimoLido)) ?? pendentes[pendentes.length - 1]);
  ultimoLido = null;
  if (!alvo) return;
  clearTimeout(alvo.id);
  tirar(alvo);
}

type ToastDoSonner = { error: (...args: never[]) => unknown };

/** Liga a detecção no `toast.error` do Sonner (uma vez, ao subir o app) */
export function detectarAvisosDoSonner(toast: ToastDoSonner): void {
  const original = toast.error as (...args: unknown[]) => unknown;
  if ((original as { __detectado?: boolean }).__detectado) return;
  const comDeteccao = (...args: unknown[]) => {
    telaAvisouErro();
    return original(...args);
  };
  (comDeteccao as { __detectado?: boolean }).__detectado = true;
  toast.error = comDeteccao as ToastDoSonner['error'];
}
