// src/services/recursos.services.ts
import { api } from '@/config/api';

/**
 * As 6 categorias do AupusProject (SN-83: as planilhas de um importam no
 * outro, então os rótulos são os mesmos de lá). No banco o enum se chama
 * TipoRecurso; na tela é "Categoria". Eram instrumento, material, ferramenta,
 * técnico e viatura: o SQL converteu técnico em mão de obra, viatura em
 * veículo e ferramenta em instrumento.
 */
export type CategoriaRecurso = 'MAO_DE_OBRA' | 'MATERIAL' | 'INSTRUMENTO' | 'VEICULO' | 'TERCEIRO' | 'DESPESA_CAMPO';

export const CATEGORIAS_RECURSO: { value: CategoriaRecurso; label: string }[] = [
  { value: 'MAO_DE_OBRA', label: 'Mão de obra' },
  { value: 'MATERIAL', label: 'Material' },
  { value: 'INSTRUMENTO', label: 'Instrumento' },
  { value: 'VEICULO', label: 'Veículo' },
  { value: 'TERCEIRO', label: 'Terceiro' },
  { value: 'DESPESA_CAMPO', label: 'Despesa de campo' },
];

export const rotuloCategoria = (categoria?: string | null) =>
  CATEGORIAS_RECURSO.find((c) => c.value === categoria)?.label || categoria || '—';

/** Como o recurso é cobrado — e não é a categoria. Quais valem em cada categoria vem do servidor */
export type BaseDeCusto = 'hora' | 'diaria' | 'unidade' | 'km' | 'fechado';

export const ROTULO_DA_BASE: Record<BaseDeCusto, string> = {
  hora: 'Por hora',
  diaria: 'Por diária',
  unidade: 'Por unidade',
  km: 'Por quilômetro',
  fechado: 'Valor fechado',
};

/** A linha do orçamento em que o custo entra, na ordem do quadro */
export type RubricaDeCusto = 'instrucoes' | 'materiais' | 'veiculos' | 'combustivel' | 'diarias' | 'terceirizados';

export const ROTULO_DA_RUBRICA: Record<RubricaDeCusto, string> = {
  instrucoes: 'Instruções',
  materiais: 'Materiais',
  veiculos: 'Veículos',
  combustivel: 'Combustível',
  diarias: 'Diárias',
  terceirizados: 'Serviços terceirizados',
};

/** De onde sai o custo apurado */
export type OrigemDoCusto = 'amortizacao' | 'diaria_do_cadastro' | 'preco_fixo' | 'preco_unitario';

export const ROTULO_DA_ORIGEM: Record<OrigemDoCusto, string> = {
  amortizacao: 'Amortização do investimento',
  diaria_do_cadastro: 'Diária do cadastro',
  preco_fixo: 'Preço fixo do cadastro',
  preco_unitario: 'Preço do cadastro',
};

/** O sufixo do preço na base do recurso: "/h", "/diária", "/m", "/km"; no valor fechado, nada */
export function sufixoDaBase(recurso?: Pick<RecursoApiResponse, 'base_calculo' | 'unidade'> | null): string {
  switch (recurso?.base_calculo) {
    case 'hora':
      return '/h';
    case 'diaria':
      return '/diária';
    case 'km':
      return '/km';
    case 'unidade':
      return recurso.unidade ? `/${recurso.unidade}` : '/un';
    default:
      return '';
  }
}

/** Unidades de compra do material. O valor guardado é curto: aparece colado na quantidade ("2 m") */
export const UNIDADES_RECURSO: { value: string; label: string }[] = [
  { value: 'un', label: 'Unidade' },
  { value: 'm', label: 'Metro' },
  { value: 'kg', label: 'Quilo' },
  { value: 'l', label: 'Litro' },
  { value: 'rolo', label: 'Rolo' },
  { value: 'cx', label: 'Caixa' },
];

export const rotuloUnidade = (unidade?: string | null) =>
  UNIDADES_RECURSO.find((u) => u.value === unidade)?.label || unidade || '—';

/** A unidade que a linha da instrução mostra ao lado da quantidade, pela base da categoria */
export const unidadePadraoDaCategoria = (categoria?: CategoriaRecurso | '' | null) =>
  categoria === 'MATERIAL' ? 'un' : categoria === 'VEICULO' ? 'km' : categoria === 'TERCEIRO' ? 'serviço' : 'h';

/** Horas por dia de trabalho, usado para arredondar a duração de uma instrução. */
export const HORAS_POR_DIA = 8;

export interface RecursoApiResponse {
  id: string;
  categoria: CategoriaRecurso;
  nome: string;
  /** Só mão de obra */
  funcao?: string | null;
  descricao?: string | null;
  unidade?: string | null;
  base_calculo: BaseDeCusto;
  /** As bases que a categoria aceita (a primeira é o padrão) — do servidor, para a tela não espelhar a regra */
  bases_disponiveis?: BaseDeCusto[];
  rubrica: RubricaDeCusto;
  horas_por_diaria: number;
  /** Nulo é preço desconhecido, não zero. */
  preco_unitario?: string | number | null;
  /** Só instrumento: o custo do item próprio */
  valor_aquisicao?: string | number | null;
  prazo_retorno_meses?: number | null;
  custos_anuais?: string | number | null;
  meta_utilizacao_horas?: string | number | null;
  /** A amortização por hora de uso (só instrumento); nulo quando falta cadastro, nunca 0 */
  custo_hora?: number | null;
  /** O preço de UMA unidade da cobrança: o que a conta usa */
  preco_base?: number | null;
  custo_origem?: OrigemDoCusto | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateRecursoApiData {
  categoria: CategoriaRecurso;
  nome: string;
  funcao?: string | null;
  descricao?: string | null;
  unidade?: string | null;
  base_calculo?: BaseDeCusto;
  rubrica?: RubricaDeCusto;
  horas_por_diaria?: number | null;
  preco_unitario?: number | null;
  valor_aquisicao?: number | null;
  prazo_retorno_meses?: number | null;
  custos_anuais?: number | null;
  meta_utilizacao_horas?: number | null;
  ativo?: boolean;
}

/** As listas do formulário (`GET /recursos/catalogo`): a mesma regra que valida a gravação */
export interface CatalogoDeRecursos {
  categorias: CategoriaRecurso[];
  bases: BaseDeCusto[];
  bases_por_categoria: Record<CategoriaRecurso, BaseDeCusto[]>;
  rubricas: RubricaDeCusto[];
  rubrica_padrao: Record<CategoriaRecurso, RubricaDeCusto>;
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

/** A página da listagem como a rota devolve — com um embrulho a mais, ela vem dentro de `data`. */
interface PaginaDeRecursosDaApi {
  data?: RecursoApiResponse[] | PaginaDeRecursosDaApi;
  pagination?: ListaRecursosResposta['pagination'];
}

const ehObjeto = (valor: unknown): valor is Record<string, unknown> =>
  typeof valor === 'object' && valor !== null;

/**
 * O interceptor pode embrulhar em { success, data }; às vezes duas vezes.
 * Só desembrulha: `T` é o que a rota devolve, não é conferido aqui.
 */
const desembrulhar = <T>(resposta: unknown): T => {
  const corpo = ehObjeto(resposta) ? resposta.data : undefined;
  const interno = ehObjeto(corpo) ? corpo.data : undefined;
  return (interno ?? corpo ?? resposta) as T;
};

class RecursosApiService {
  private readonly endpoint = '/recursos';

  async listar(params: QueryRecursosParams = {}): Promise<ListaRecursosResposta> {
    const response = await api.get<RecursoApiResponse[] | PaginaDeRecursosDaApi>(this.endpoint, { params });
    const bruto = response.data;

    // A listagem responde { data, pagination }; um embrulho a mais deixa essa
    // página dentro de `data`, no lugar do array. Tomar `data.data` direto
    // pegava o ARRAY da resposta normal e descartava a paginação: a tabela
    // ficava sempre em uma página só e a exportação parava na primeira.
    const corpo = !Array.isArray(bruto) && bruto?.data && !Array.isArray(bruto.data) ? bruto.data : bruto;

    if (Array.isArray(corpo)) {
      return {
        data: corpo,
        pagination: { page: 1, limit: corpo.length, total: corpo.length, totalPages: 1 },
      };
    }

    return {
      data: Array.isArray(corpo?.data) ? corpo.data : [],
      pagination: corpo?.pagination ?? { page: 1, limit: 10, total: 0, totalPages: 1 },
    };
  }

  async catalogo(): Promise<CatalogoDeRecursos> {
    const response = await api.get<unknown>(`${this.endpoint}/catalogo`);
    return desembrulhar<CatalogoDeRecursos>(response);
  }

  async buscarPorId(id: string): Promise<RecursoApiResponse> {
    const response = await api.get<unknown>(`${this.endpoint}/${id.trim()}`);
    return desembrulhar<RecursoApiResponse>(response);
  }

  async criar(data: CreateRecursoApiData): Promise<RecursoApiResponse> {
    const response = await api.post<unknown>(this.endpoint, data);
    return desembrulhar<RecursoApiResponse>(response);
  }

  async atualizar(id: string, data: Partial<CreateRecursoApiData>): Promise<RecursoApiResponse> {
    const response = await api.put<unknown>(`${this.endpoint}/${id.trim()}`, data);
    return desembrulhar<RecursoApiResponse>(response);
  }

  async remover(id: string): Promise<void> {
    await api.delete(`${this.endpoint}/${id.trim()}`);
  }
}

export const recursosApi = new RecursosApiService();
