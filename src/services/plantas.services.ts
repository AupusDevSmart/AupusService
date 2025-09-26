// src/services/plantas.services.ts - ALTERNATIVA COM TIPOS LOCAIS
import { api } from '@/config/api';

// ✅ TIPO LOCAL: PaginatedResponse (se não quiser modificar base.ts)
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ✅ INTERFACES DE REQUEST/RESPONSE
export interface CreatePlantaRequest {
  nome: string;
  cnpj: string;
  proprietarioId: string;
  horarioFuncionamento: string;
  localizacao: string;
  endereco: {
    logradouro: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
  };
}

export interface UpdatePlantaRequest {
  nome?: string;
  cnpj?: string;
  proprietarioId?: string;
  horarioFuncionamento?: string;
  localizacao?: string;
  endereco?: {
    logradouro?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
    cep?: string;
  };
}

export interface PlantaResponse {
  id: string;
  nome: string;
  cnpj: string;
  localizacao: string;
  horarioFuncionamento: string;
  endereco: {
    logradouro: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
  };
  proprietarioId: string;
  proprietario?: ProprietarioBasico;
  criadoEm: string;
  atualizadoEm: string;
}

// ✅ Interface ProprietarioBasico
export interface ProprietarioBasico {
  id: string;
  nome: string;
  cpf_cnpj: string;
  tipo: 'pessoa_fisica' | 'pessoa_juridica';
}

export interface FindAllPlantasParams {
  page?: number;
  limit?: number;
  search?: string;
  proprietarioId?: string;
  orderBy?: 'nome' | 'cnpj' | 'localizacao' | 'cidade' | 'criadoEm' | 'proprietario';
  orderDirection?: 'asc' | 'desc';
}

// ✅ SERVICE CLASS ADAPTADO
export class PlantasService {
  // ✅ Endpoint das plantas (sem base URL)
  private static readonly ENDPOINT = '/plantas';

  // ✅ MÉTODO: Listar plantas com filtros e paginação
  static async getAllPlantas(params: FindAllPlantasParams = {}): Promise<PaginatedResponse<PlantaResponse>> {
    // console.log('🏭 [PLANTAS SERVICE] Buscando plantas com parâmetros:', params);

    try {
      // ✅ Usando sua instância do axios com parâmetros
      const response = await api.get<PaginatedResponse<PlantaResponse>>(this.ENDPOINT, {
        params: {
          page: params.page,
          limit: params.limit,
          search: params.search?.trim() || undefined,
          proprietarioId: params.proprietarioId !== 'all' ? params.proprietarioId : undefined,
          orderBy: params.orderBy,
          orderDirection: params.orderDirection,
        }
      });

      // console.log('✅ [PLANTAS SERVICE] Plantas carregadas:', {
      //   total: response.data.pagination.total,
      //   page: response.data.pagination.page,
      //   count: response.data.data.length
      // });

      return response.data;

    } catch (error: any) {
      // console.error('❌ [PLANTAS SERVICE] Erro ao buscar plantas:', error);
      throw new Error(error.response?.data?.message || error.message || 'Erro ao carregar lista de plantas');
    }
  }

  // ✅ MÉTODO: Buscar planta específica por ID
  static async getPlanta(id: string): Promise<PlantaResponse> {
    // console.log('🔍 [PLANTAS SERVICE] Buscando planta:', id);

    try {
      const response = await api.get<PlantaResponse>(`${this.ENDPOINT}/${id}`);

      // console.log('✅ [PLANTAS SERVICE] Planta encontrada:', response.data.nome);
      return response.data;

    } catch (error: any) {
      // console.error('❌ [PLANTAS SERVICE] Erro ao buscar planta:', error);
      
      if (error.response?.status === 404) {
        throw new Error('Planta não encontrada');
      }
      
      throw new Error(error.response?.data?.message || error.message || 'Erro ao carregar dados da planta');
    }
  }

  // ✅ MÉTODO: Criar nova planta
  static async createPlanta(data: CreatePlantaRequest): Promise<PlantaResponse> {
    // console.log('🏭 [PLANTAS SERVICE] Criando nova planta:', data.nome);

    try {
      const response = await api.post<PlantaResponse>(this.ENDPOINT, data);

      // console.log('✅ [PLANTAS SERVICE] Planta criada com sucesso:', response.data.id);
      return response.data;

    } catch (error: any) {
      // console.error('❌ [PLANTAS SERVICE] Erro ao criar planta:', error);
      
      // Mapear erros específicos
      if (error.response?.status === 409) {
        throw new Error('CNPJ já cadastrado no sistema');
      }
      
      if (error.response?.status === 404) {
        throw new Error('Proprietário não encontrado ou inativo');
      }
      
      if (error.response?.status === 400) {
        throw new Error(error.response?.data?.message || 'Dados inválidos para criação da planta');
      }
      
      throw new Error(error.response?.data?.message || error.message || 'Erro interno ao criar planta');
    }
  }

  // ✅ MÉTODO: Atualizar planta existente
  static async updatePlanta(id: string, data: UpdatePlantaRequest): Promise<PlantaResponse> {
    // console.log('🔄 [PLANTAS SERVICE] Atualizando planta:', id);

    try {
      const response = await api.put<PlantaResponse>(`${this.ENDPOINT}/${id}`, data);

      // console.log('✅ [PLANTAS SERVICE] Planta atualizada com sucesso:', response.data.nome);
      return response.data;

    } catch (error: any) {
      // console.error('❌ [PLANTAS SERVICE] Erro ao atualizar planta:', error);
      
      // Mapear erros específicos
      if (error.response?.status === 404) {
        throw new Error('Planta não encontrada');
      }
      
      if (error.response?.status === 409) {
        throw new Error('CNPJ já cadastrado por outra planta');
      }
      
      if (error.response?.status === 400) {
        throw new Error(error.response?.data?.message || 'Dados inválidos para atualização da planta');
      }
      
      throw new Error(error.response?.data?.message || error.message || 'Erro interno ao atualizar planta');
    }
  }

  // ✅ MÉTODO: Buscar proprietários disponíveis
  static async getProprietarios(): Promise<ProprietarioBasico[]> {
    // console.log('👥 [PLANTAS SERVICE] Buscando proprietários disponíveis');

    try {
      const response = await api.get<ProprietarioBasico[]>(`${this.ENDPOINT}/proprietarios`);

      // console.log('✅ [PLANTAS SERVICE] Proprietários carregados:', response.data.length);
      return response.data;

    } catch (error: any) {
      // console.error('❌ [PLANTAS SERVICE] Erro ao buscar proprietários:', error);
      throw new Error(error.response?.data?.message || error.message || 'Erro ao carregar lista de proprietários');
    }
  }

  // ✅ MÉTODO UTILITÁRIO: Validar CNPJ
  static validateCNPJ(cnpj: string): boolean {
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    return cleanCNPJ.length === 14;
  }

  // ✅ MÉTODO UTILITÁRIO: Formatar CNPJ
  static formatCNPJ(cnpj: string): string {
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    if (cleanCNPJ.length === 14) {
      return cleanCNPJ.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return cnpj;
  }
}