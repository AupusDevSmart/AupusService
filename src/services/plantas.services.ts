// src/services/plantas.services.ts

import { isAxiosError } from 'axios';
import { api } from '@/config/api';
import type { PaginatedResponse } from '@/types/base';

// ✅ INTERFACES

export interface Endereco {
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
}

export interface ProprietarioBasico {
  id: string;
  nome: string;
  cpf_cnpj: string;
  tipo: 'pessoa_fisica' | 'pessoa_juridica';
}

export interface PlantaResponse {
  id: string;
  nome: string;
  cnpj: string;
  localizacao: string;
  horarioFuncionamento: string;
  endereco: Endereco;
  numeroUc?: string; // ✅ Número da Unidade Consumidora
  proprietarioId: string;
  proprietario?: ProprietarioBasico;
  criadoEm: string;
  atualizadoEm: string;
}

export interface FindAllPlantasParams {
  page?: number;
  limit?: number;
  search?: string;
  proprietarioId?: string;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface CreatePlantaDto {
  nome: string;
  cnpj: string;
  localizacao: string;
  horario_funcionamento: string;
  numero_uc?: string; // ✅ Número da Unidade Consumidora
  proprietario_id: string;
  endereco: {
    logradouro: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
  };
}

export type UpdatePlantaDto = Partial<CreatePlantaDto>;

/** Usuario como a rota /plantas/proprietarios devolve (os nomes alternativos cobrem formatos antigos). */
interface ProprietarioDaRota {
  id: string;
  nome?: string | null;
  name?: string;
  cpf_cnpj?: string | null;
  cpf?: string;
  cnpj?: string;
  tipo?: ProprietarioBasico['tipo'];
}

/** A mensagem que o backend mandou no corpo do erro, se mandou. */
function mensagemDoBackend(error: unknown): string | undefined {
  return isAxiosError<{ message?: string }>(error) ? error.response?.data?.message : undefined;
}

// ✅ SERVICE CLASS

class PlantasServiceClass {
  /**
   * Get all plantas with pagination and filters
   */
  async getAllPlantas(params: FindAllPlantasParams = {}): Promise<PaginatedResponse<PlantaResponse>> {
    try {
      const queryParams = new URLSearchParams();

      if (params.search) queryParams.append('search', params.search);
      if (params.proprietarioId && params.proprietarioId !== 'all') {
        queryParams.append('proprietarioId', params.proprietarioId);
      }
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.orderBy) queryParams.append('orderBy', params.orderBy);
      if (params.orderDirection) queryParams.append('orderDirection', params.orderDirection);

      const response = await api.get<PaginatedResponse<PlantaResponse> | PlantaResponse[]>(`/plantas?${queryParams.toString()}`);

      // Normalize response - handle nested data structure from backend
      // Backend returns: { success: true, data: { data: [...plantas], pagination: {...} } }
      const responseData = response.data;
      const data = (Array.isArray(responseData) ? responseData : responseData?.data) || [];
      const pagination = (!Array.isArray(responseData) && responseData?.pagination) || {
        page: params.page || 1,
        limit: params.limit || 10,
        total: Array.isArray(data) ? data.length : 0,
        totalPages: Math.ceil((Array.isArray(data) ? data.length : 0) / (params.limit || 10)),
      };

      return {
        data: Array.isArray(data) ? data : [],
        pagination,
      };
    } catch (error) {
      console.error('❌ [PlantasService] Error fetching plantas:', error);
      throw new Error(mensagemDoBackend(error) || 'Erro ao buscar plantas');
    }
  }

  /**
   * Get planta by ID
   */
  async getPlanta(id: string): Promise<PlantaResponse> {
    try {
      const response = await api.get<PlantaResponse>(`/plantas/${id}`);

      // ✅ CORRIGIDO: A API retorna { success, data, meta }, extrair apenas o "data"
      const planta = response.data;

      return planta;
    } catch (error) {
      console.error(`❌ [PlantasService] Error fetching planta ${id}:`, error);
      throw new Error(mensagemDoBackend(error) || 'Erro ao buscar planta');
    }
  }

  /**
   * Create new planta
   */
  async createPlanta(dto: CreatePlantaDto): Promise<PlantaResponse> {
    try {
      console.log('📡 [PlantasService] POST /plantas', dto);
      const response = await api.post<PlantaResponse>('/plantas', dto);

      // ✅ CORRIGIDO: Extrair dados do caminho correto
      const planta = response.data;
      console.log('✅ [PlantasService] Planta created:', planta?.id);

      return planta;
    } catch (error) {
      console.error('❌ [PlantasService] Error creating planta:', error);
      throw new Error(mensagemDoBackend(error) || 'Erro ao criar planta');
    }
  }

  /**
   * Update planta
   */
  async updatePlanta(id: string, dto: UpdatePlantaDto): Promise<PlantaResponse> {
    try {
      console.log(`📡 [PlantasService] PUT /plantas/${id}`, dto);
      const response = await api.put<PlantaResponse>(`/plantas/${id}`, dto);

      // ✅ CORRIGIDO: Extrair dados do caminho correto
      const planta = response.data;
      console.log('✅ [PlantasService] Planta updated:', planta?.id);

      return planta;
    } catch (error) {
      console.error(`❌ [PlantasService] Error updating planta ${id}:`, error);
      throw new Error(mensagemDoBackend(error) || 'Erro ao atualizar planta');
    }
  }

  /**
   * Delete planta
   */
  async deletePlanta(id: string): Promise<void> {
    try {
      console.log(`📡 [PlantasService] DELETE /plantas/${id}`);
      await api.delete(`/plantas/${id}`);
      console.log('✅ [PlantasService] Planta deleted:', id);
    } catch (error) {
      console.error(`❌ [PlantasService] Error deleting planta ${id}:`, error);
      throw new Error(mensagemDoBackend(error) || 'Erro ao excluir planta');
    }
  }

  /**
   * Get proprietarios (usuarios with roles: admin, gerente, or proprietário)
   */
  async getProprietarios(comUnidades?: boolean): Promise<ProprietarioBasico[]> {
    try {
      console.log('📡 [PlantasService] GET /plantas/proprietarios - buscando proprietários');

      const response = await api.get<ProprietarioDaRota[]>('/plantas/proprietarios', {
        params: {
          ...(comUnidades ? { comUnidades: 'true' } : {}),
        }
      });

      // A API retorna via ResponseInterceptor: { success, data: [...] }
      const usuarios = response.data || [];

      console.log('🔍 [PlantasService] Response structure:', {
        hasData: !!response.data,
        hasDataData: !!response.data,
        hasDataDataData: !!response.data,
        usuariosLength: Array.isArray(usuarios) ? usuarios.length : 0
      });

      // Transform to ProprietarioBasico format
      const proprietarios: ProprietarioBasico[] = usuarios.map((user) => ({
        id: user.id,
        nome: user.nome || user.name || 'Nome não informado',
        cpf_cnpj: user.cpf_cnpj || user.cpf || user.cnpj || 'Não informado',
        tipo: user.tipo || (user.cpf ? 'pessoa_fisica' : 'pessoa_juridica')
      }));

      console.log('✅ [PlantasService] Proprietarios fetched from /usuarios:', proprietarios.length);
      return proprietarios;
    } catch (error) {
      console.error('❌ [PlantasService] Error fetching proprietarios:', error);

      // Return empty array instead of throwing to prevent blocking the UI
      console.warn('⚠️ [PlantasService] Returning empty proprietarios list');
      return [];
    }
  }
}

// ✅ EXPORT SINGLETON INSTANCE

export const PlantasService = new PlantasServiceClass();
