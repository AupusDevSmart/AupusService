import { z } from 'zod';

/**
 * Schema de validação do formulário de "esqueci minha senha".
 * Solicita apenas o email da conta.
 */
export const esqueciSenhaSchema = z.object({
  email: z
    .string({ required_error: 'Email é obrigatório' })
    .min(1, 'Email é obrigatório')
    .email('Email inválido'),
});

export type EsqueciSenhaFormData = z.infer<typeof esqueciSenhaSchema>;
