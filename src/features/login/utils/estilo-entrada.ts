/**
 * Classes das telas de entrada (login, esqueci senha, redefinir senha).
 *
 * As tres telas sao sempre escuras, qualquer que seja o tema. Por isso as cores
 * aqui sao fixas (branco com opacidade, paleta da marca) e nao os tokens do
 * tema: um token como `text-destructive` muda com o tema e, no escuro, fica
 * ilegivel sobre o fundo da marca.
 */

/** Contem o formulario inteiro, abaixo do logo. */
export const CONTEINER_FORM = 'flex w-full max-w-sm flex-col space-y-6';
export const TITULO = 'text-xl font-semibold text-white';
export const SUBTITULO = 'text-sm text-white/60';

/**
 * `campo-marca` tira o campo da regra do dark mode que pinta todo input com a
 * cor do card (design-minimal-components.css). O autofill do Chrome pintaria o
 * campo de claro; a sombra interna na cor base cobre esse fundo.
 */
export const CAMPO =
  'campo-marca h-11 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-white/35 focus-visible:border-service-verde focus-visible:ring-0 ' +
  'autofill:shadow-[inset_0_0_0_1000px_rgb(var(--sv-azul))] autofill:[-webkit-text-fill-color:white]';
export const CAMPO_COM_ERRO = 'border-red-400 focus-visible:border-red-400';
export const ERRO_CAMPO = 'text-sm text-red-400';
export const AVISO_ERRO =
  'rounded-xl border-red-400/30 bg-red-500/10 text-red-300 dark:border-red-400/30';

/** Verde = acao. Texto sobre a cor de acao e sempre a cor base, nunca branco. */
export const BOTAO_PRINCIPAL =
  'mt-2 h-11 w-full rounded-xl bg-service-verde font-semibold text-service-azul hover:bg-service-verde/90';
export const BOTAO_SECUNDARIO =
  'h-11 w-full rounded-xl border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white';
export const ROTULO = 'text-white/70';
export const LINK_DISCRETO = 'text-sm text-white/50 transition-colors hover:text-service-verde';
export const BOTAO_VER_SENHA =
  'absolute right-3 top-1/2 -translate-y-1/2 text-white/50 transition-colors hover:text-white';
