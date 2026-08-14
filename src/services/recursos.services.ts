// src/services/recursos.services.ts
import { api } from '@/config/api';

/**
 * No banco o enum se chama TipoRecurso e continua assim — renomear enum em
 * Postgres é migração com risco. Na tela é "Categoria", que é o nome que
 * interessa a quem usa.
 */
export type CategoriaRecurso = 'PECA' | 'MATERIAL' | 'FERRAMENTA' | 'TECNICO' | 'VIATURA';

export const CATEGORIAS_RECURSO: { value: CategoriaRecurso; label: string }[] = [
  { value: 'PECA', label: 'Peça' },
  { value: 'MATERIAL', label: 'Material' },
  { value: 'FERRAMENTA', label: 'Ferramenta' },
  { value: 'TECNICO', label: 'Técnico' },
  { value: 'VIATURA', label: 'Viatura' },
];

export const rotuloCategoria = (categoria?: string | null) =>
  CATEGORIAS_RECURSO.find((c) => c.value === categoria)?.label || categoria || '—';

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
