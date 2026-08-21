// src/features/solicitacoes-servico/components/proposta-contexto.ts
import { createContext } from 'react';

/**
 * Os valores da proposta, para o card da instrução poder editá-los.
 *
 * O valor mora na proposta, mas é editado no card — que é renderizado pelo
 * campo `instrucoes_ids`, um irmão ACIMA da seção da proposta. Um não alcança o
 * outro por prop, e por isso a ponte é um contexto que a página fornece: a
 * `PropostaSection` publica os valores para cima, e a página os devolve para
 * baixo.
 *
 * Contexto, e não prop no `camposDoSheet`: aquele é memoizado, e cada `render`
 * vira componente por `React.createElement` — trocar a identidade a cada
 * digitação desmontaria o campo inteiro no meio da edição.
 */
export interface ValoresDaProposta {
  /** Valor por `instrucao_id`. Ausente quando a linha ainda não existe. */
  valores: Record<string, number>;
  definir: (instrucaoId: string, valor: number) => void;
  editavel: boolean;
}

export const ValoresDaPropostaContext = createContext<ValoresDaProposta | null>(null);

/** Quem abre o sheet da instrução por cima do sheet da solicitação. */
export const AbrirInstrucaoContext = createContext<((id: string) => void) | null>(null);
