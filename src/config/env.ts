import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  clientPrefix: 'VITE_',

  client: {
    VITE_API_URL: z.string().url(),
    VITE_WEBSOCKET_URL: z.string().url(),
    VITE_APP_NAME: z.string(),

    // O Pusher saiu (SN-9, 22/out/2026): nada no app o usa, e o schema exigia as chaves, segredo
    // incluso. Com o `runtimeEnv: import.meta.env` de antes, o Vite embutia no JavaScript TODA VITE_*
    // do .env.production, e o VITE_PUSHER_APP_SECRET ia para qualquer um que abrisse a página.

    // VITE_SENTRY_DSN: z
    // 	.string()
    // 	.url()
    // 	.optional()
    // 	.refine((value) => {
    // 		if (import.meta.env.DEV) {
    // 			return true;
    // 		} else {
    // 			return value !== '' && value !== undefined;
    // 		}
    // 	}),

    VITE_WEB_VITALS: z
      .string()
      .refine((s) => s === 'true' || s === 'false')
      .transform((s) => s === 'true'),
    VITE_STANDALONE: z
      .string()
      .refine((s) => s === 'true' || s === 'false')
      .transform((s) => s === 'true'),
    VITE_DEFAULT_DOMAIN: z.string().url(),

    VITE_S3_URL: z.string().url(),
  },

  // Chave por chave, nunca o import.meta.env inteiro: assim o Vite embute só estas no JavaScript, e
  // o que mais houver no .env.production (segredo de serviço, por engano) não vai para o navegador
  runtimeEnv: {
    VITE_API_URL: import.meta.env.VITE_API_URL,
    VITE_WEBSOCKET_URL: import.meta.env.VITE_WEBSOCKET_URL,
    VITE_APP_NAME: import.meta.env.VITE_APP_NAME,
    VITE_WEB_VITALS: import.meta.env.VITE_WEB_VITALS,
    VITE_STANDALONE: import.meta.env.VITE_STANDALONE,
    VITE_DEFAULT_DOMAIN: import.meta.env.VITE_DEFAULT_DOMAIN,
    VITE_S3_URL: import.meta.env.VITE_S3_URL,
  },
  emptyStringAsUndefined: true,
});