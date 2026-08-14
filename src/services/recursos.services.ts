// src/services/recursos.services.ts
import { api } from '@/config/api';

/**
 * No banco o enum se chama TipoRecurso e continua assim — renomear enum em
 * Postgres é migração com risco. Na tela é "Categoria", que é o nome que
 * interessa a quem usa.
 */
export type CategoriaRecurso =
  | 'INSTRUMENTO'
  | 'MATERIAL'
  | 'FERRAMENTA'
  | 'TECNICO'
  | 'VIATURA';

export const CATEGORIAS_RECURSO: { value: CategoriaRecurso; label: string }[] = [
  { value: 'INSTRUMENTO', label: 'Instrumento' },
  { value: 'MATERIAL', label: 'Material' },
  { value: 'FERRAMENTA', label: 'Ferramenta' },
  { value: 'TECNICO', label: 'Técnico' },
  { value: 'VIATURA', label: 'Viatura' },
];

export const rotuloCategoria = (categoria?: string | null) =>
  CATEGORIAS_RECURSO.find((c) => c.value === categoria)?.label || categoria || '—';

/**
 * Unidades possíveis. O valor guardado é curto porque aparece colado na
 * quantidade dentro da instrução — "2 h" se lê melhor que "2 hora".
 */
export const UNIDADES_RECURSO: { value: string; label: string }[] = [
  { value: 'h', label: 'Hora' },
  { value: 'un', label: 'Unidade' },
  { value: 'm', label: 'Metro' },
  { value: 'kg', label: 'Quilo' },
  { value: 'rolo', label: 'Rolo' },
];

export const rotuloUnidade = (unidade?: string | null) =>
  UNIDADES_RECURSO.find((u) => u.value === unidade)?.label || unidade || '—';

/**
 * Quase tudo se mede em hora porque o que custa é o tempo de quem opera:
 * instrumento, ferramenta, técnico e viatura são cobrados pelo período em que
 * ficam alocados. Material é o único que se conta por peça.
 */
export const unidadePadraoDaCategoria = (categoria?: CategoriaRecurso | '' | null) =>
  categoria === 'MATERIAL' ? 'un' : 'h';

/** Horas por dia de trabalho, usado para arredondar a duração de uma instrução. */
export const HORAS_POR_DIA = 8;

export interface RecursoApiResponse {
  id: string;
  categoria: CategoriaRecurso;
  nome: string;
  unidade?: string | null;
  /** Nulo é preço desconhecido, não zero. */
  preco_medio?: string | number | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateRecursoApiData {
  categoria: CategoriaRecurso;
  nome: string;
  unidade?: string | null;
  preco_medio?: number | null;
  ativo?: boolean;
}

export interface QueryRecursosParams {
  categoria?: CategoriaRecurso;
  search?: string;
  apenas_ativos?: boolean;
  page?: number;
  limit?: number;
}

export interface ListaRecursosResposta {
  data: RecursoApiResponse[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

/** O interceptor pode embrulhar em { success, data }; às vezes duas vezes. */
const desembrulhar = (resposta: any) => resposta?.data?.data ?? resposta?.data ?? resposta;

class RecursosApiService {
  private readonly endpoint = '/recursos';

  async listar(params: QueryRecursosParams = {}): Promise<ListaRecursosResposta> {
    const response = await api.get<any>(this.endpoint, { params });
    const corpo = response.data?.data ?? response.data;

    // A listagem responde { data, pagination }; um embrulho a mais deixaria
    // `data` sendo o corpo inteiro em vez do array.
    if (Array.isArray(corpo)) {
      return {
        data: corpo,
        pagination: { page: 1, limit: corpo.length, total: corpo.length, totalPages: 1 },
      };
    }

    return {
      data: corpo?.data ?? [],
      pagination: corpo?.pagination ?? { page: 1, limit: 10, total: 0, totalPages: 1 },
    };
  }

  async buscarPorId(id: string): Promise<RecursoApiResponse> {
    const response = await api.get<any>(`${this.endpoint}/${id.trim()}`);
    return desembrulhar(response);
  }

  async criar(data: CreateRecursoApiData): Promise<RecursoApiResponse> {
    const response = await api.post<any>(this.endpoint, data);
    return desembrulhar(response);
  }

  async atualizar(id: string, data: Partial<CreateRecursoApiData>): Promise<RecursoApiResponse> {
    const response = await api.put<any>(`${this.endpoint}/${id.trim()}`, data);
    return desembrulhar(response);
  }

  async remover(id: string): Promise<void> {
    await api.delete(`${this.endpoint}/${id.trim()}`);
  }
}

export const recursosApi = new RecursosApiService();
