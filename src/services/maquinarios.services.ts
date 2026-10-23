// src/services/maquinarios.services.ts
import { api } from '@/config/api';
import type { OrigemDoCusto, RubricaDeCusto } from '@/services/recursos.services';

/** Próprio (da empresa) ou locação (alugado) — os rótulos são os do AupusProject (SN-84) */
export type TipoDeMaquinario = 'proprio' | 'locacao';

export const ROTULO_DO_TIPO_DE_MAQUINARIO: Record<TipoDeMaquinario, string> = {
  proprio: 'Próprio',
  locacao: 'Locação',
};

/** As bases do maquinário: unidade não faz sentido para máquina */
export type BaseDoMaquinario = 'diaria' | 'hora' | 'km' | 'fechado';

export const ROTULO_DA_BASE_DO_MAQUINARIO: Record<BaseDoMaquinario, string> = {
  diaria: 'Por diária',
  hora: 'Por hora',
  km: 'Por quilômetro',
  fechado: 'Valor fechado',
};

export interface MaquinarioApiResponse {
  id: string;
  nome: string;
  tipo: TipoDeMaquinario;
  descricao?: string | null;
  base_calculo: BaseDoMaquinario;
  rubrica: RubricaDeCusto;
  horas_por_diaria: number;
  preco_unitario?: string | number | null;
  valor_aquisicao?: string | number | null;
  prazo_retorno_meses?: number | null;
  custos_anuais?: string | number | null;
  meta_utilizacao_horas?: string | number | null;
  /** A amortização por hora de uso; nulo quando falta cadastro, nunca 0 */
  custo_hora?: number | null;
  /** O preço de UMA unidade da cobrança: o que a conta usa */
  preco_base?: number | null;
  custo_origem?: Exclude<OrigemDoCusto, 'preco_fixo'> | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateMaquinarioApiData {
  nome: string;
  tipo: TipoDeMaquinario;
  descricao?: string | null;
  base_calculo?: BaseDoMaquinario;
  rubrica?: RubricaDeCusto;
  horas_por_diaria?: number | null;
  preco_unitario?: number | null;
  valor_aquisicao?: number | null;
  prazo_retorno_meses?: number | null;
  custos_anuais?: number | null;
  meta_utilizacao_horas?: number | null;
  ativo?: boolean;
}

export interface QueryMaquinariosParams {
  tipo?: TipoDeMaquinario;
  search?: string;
  apenas_ativos?: boolean;
  page?: number;
  limit?: number;
}

export interface ListaMaquinariosResposta {
  data: MaquinarioApiResponse[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

/** As listas do formulário (`GET /maquinarios/catalogo`): a mesma regra que valida a gravação */
export interface CatalogoDeMaquinarios {
  tipos: TipoDeMaquinario[];
  bases: BaseDoMaquinario[];
  rubricas: RubricaDeCusto[];
  rubrica_padrao: Record<TipoDeMaquinario, RubricaDeCusto>;
}

const ehObjeto = (valor: unknown): valor is Record<string, unknown> => typeof valor === 'object' && valor !== null;

/** O interceptor pode embrulhar em { success, data }; às vezes duas vezes. Só desembrulha */
const desembrulhar = <T>(resposta: unknown): T => {
  const corpo = ehObjeto(resposta) ? resposta.data : undefined;
  const interno = ehObjeto(corpo) ? corpo.data : undefined;
  return (interno ?? corpo ?? resposta) as T;
};

class MaquinariosApiService {
  private readonly endpoint = '/maquinarios';

  async listar(params: QueryMaquinariosParams = {}): Promise<ListaMaquinariosResposta> {
    const response = await api.get<unknown>(this.endpoint, { params });
    const bruto = response.data as ListaMaquinariosResposta | { data?: ListaMaquinariosResposta };
    // Um embrulho a mais deixa a página dentro de `data`, no lugar do array: sem
    // isso a tabela ficava numa página só e a exportação parava na primeira
    const corpo = ehObjeto(bruto) && ehObjeto(bruto.data) && !Array.isArray(bruto.data) ? (bruto.data as ListaMaquinariosResposta) : (bruto as ListaMaquinariosResposta);
    if (!Array.isArray(corpo?.data)) throw new Error('A lista de maquinários veio num formato inesperado.');
    return { data: corpo.data, pagination: corpo.pagination ?? { page: 1, limit: corpo.data.length, total: corpo.data.length, totalPages: 1 } };
  }

  async catalogo(): Promise<CatalogoDeMaquinarios> {
    return desembrulhar<CatalogoDeMaquinarios>(await api.get<unknown>(`${this.endpoint}/catalogo`));
  }

  async criar(data: CreateMaquinarioApiData): Promise<MaquinarioApiResponse> {
    return desembrulhar<MaquinarioApiResponse>(await api.post<unknown>(this.endpoint, data));
  }

  async atualizar(id: string, data: Partial<CreateMaquinarioApiData>): Promise<MaquinarioApiResponse> {
    return desembrulhar<MaquinarioApiResponse>(await api.put<unknown>(`${this.endpoint}/${id.trim()}`, data));
  }

  async remover(id: string): Promise<void> {
    await api.delete(`${this.endpoint}/${id.trim()}`);
  }
}

export const maquinariosApi = new MaquinariosApiService();
