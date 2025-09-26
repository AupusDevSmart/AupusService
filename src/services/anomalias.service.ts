// src/services/anomalias.service.ts
import { api } from '@/config/api';
import { 
  Anomalia, 
  AnomaliaFormData, 
  AnomaliasFilters 
} from '@/features/anomalias/types';

export interface AnomaliasResponse {
  data: Anomalia[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AnomaliasStats {
  total: number;
  aguardando: number;
  emAnalise: number;
  osGerada: number;
  resolvida: number;
  cancelada: number;
  criticas: number;
}

export interface CreateAnomaliaDto {
  descricao: string;
  localizacao: {
    plantaId: string;
    equipamentoId: string;
    local: string;
    ativo: string;
  };
  condicao: string;
  origem: string;
  prioridade: string;
  observacoes?: string;
}

export interface UpdateAnomaliaDto extends Partial<Omit<CreateAnomaliaDto, 'localizacao'>> {
  localizacao?: {
    plantaId?: string;
    equipamentoId?: string;
    local?: string;
    ativo?: string;
  };
}

export interface ResolverAnomaliaDto {
  observacoes?: string;
}

export interface CancelarAnomaliaDto {
  motivo?: string;
}

class AnomaliasApiService {
  private baseUrl = '/anomalias';

  // ==========================================
  // 🔵 1. OPERAÇÕES CRUD BÁSICAS
  // ==========================================

  async findAll(filters: AnomaliasFilters): Promise<AnomaliasResponse> {
    // // console.log('🔍 [AnomaliasService] Buscando anomalias com filtros:', filters);
    
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.periodo && filters.periodo !== 'all') params.append('periodo', filters.periodo);
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.prioridade && filters.prioridade !== 'all') params.append('prioridade', filters.prioridade);
    if (filters.origem && filters.origem !== 'all') params.append('origem', filters.origem);
    if (filters.planta && filters.planta !== 'all') params.append('planta', filters.planta);

    const url = `${this.baseUrl}?${params}`;
    // // console.log('📡 [AnomaliasService] URL:', url);
    
    const response = await api.get(url);
    // // console.log('📨 [AnomaliasService] Resposta:', response.data);
    
    return response.data;
  }

  async findOne(id: string): Promise<Anomalia> {
    // // console.log('🔍 [AnomaliasService] Buscando anomalia:', id);
    
    const response = await api.get(`${this.baseUrl}/${id}`);
    // // console.log('📨 [AnomaliasService] Anomalia encontrada:', response.data);
    
    return response.data;
  }

  async create(data: AnomaliaFormData): Promise<Anomalia> {
    // // console.log('✨ [AnomaliasService] Criando anomalia:', data);
    
    // Se há anexos, usar multipart/form-data
    if (data.anexos && data.anexos.length > 0) {
      return this.createWithAttachments(data);
    }

    // Sem anexos, usar JSON normal
    const createDto: CreateAnomaliaDto = {
      descricao: data.descricao,
      localizacao: {
        plantaId: data.plantaId?.toString() || '',
        equipamentoId: data.equipamentoId?.toString() || '',
        local: data.local,
        ativo: data.ativo
      },
      condicao: data.condicao,
      origem: data.origem,
      prioridade: data.prioridade,
      observacoes: data.observacoes
    };
    
    const response = await api.post(this.baseUrl, createDto);
    // // console.log('✅ [AnomaliasService] Anomalia criada:', response.data);
    
    return response.data;
  }

  private async createWithAttachments(data: AnomaliaFormData): Promise<Anomalia> {
    // // console.log('📎 [AnomaliasService] Criando anomalia com anexos:', data.anexos?.length);

    const formData = new FormData();
    
    // Dados da anomalia
    formData.append('descricao', data.descricao);
    formData.append('localizacao[plantaId]', data.plantaId?.toString() || '');
    formData.append('localizacao[equipamentoId]', data.equipamentoId?.toString() || '');
    formData.append('localizacao[local]', data.local);
    formData.append('localizacao[ativo]', data.ativo);
    formData.append('condicao', data.condicao);
    formData.append('origem', data.origem);
    formData.append('prioridade', data.prioridade);
    
    if (data.observacoes) {
      formData.append('observacoes', data.observacoes);
    }
    
    // Anexos
    if (data.anexos) {
      data.anexos.forEach((file) => {
        formData.append('anexos', file);
      });
    }

    const response = await api.post(this.baseUrl, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    // // console.log('✅ [AnomaliasService] Anomalia criada com anexos:', response.data);
    return response.data;
  }

  async update(id: string, data: Partial<AnomaliaFormData>): Promise<Anomalia> {
    // // console.log('📝 [AnomaliasService] Atualizando anomalia:', id, data);
    
    const updateDto: UpdateAnomaliaDto = {
      descricao: data.descricao,
      condicao: data.condicao,
      origem: data.origem,
      prioridade: data.prioridade,
      observacoes: data.observacoes
    };
    
    // Se há dados de localização, estruturar corretamente
    if (data.plantaId || data.equipamentoId || data.local || data.ativo) {
      updateDto.localizacao = {
        plantaId: data.plantaId?.toString() || '',
        equipamentoId: data.equipamentoId?.toString() || '',
        local: data.local || '',
        ativo: data.ativo || ''
      };
    }
    
    const response = await api.patch(`${this.baseUrl}/${id}`, updateDto);
    // // console.log('✅ [AnomaliasService] Anomalia atualizada:', response.data);
    
    return response.data;
  }

  async remove(id: string): Promise<{ message: string }> {
    // // console.log('🗑️ [AnomaliasService] Removendo anomalia:', id);
    
    const response = await api.delete(`${this.baseUrl}/${id}`);
    // // console.log('✅ [AnomaliasService] Anomalia removida:', response.data);
    
    return response.data;
  }

  // ==========================================
  // 📊 2. ESTATÍSTICAS
  // ==========================================

  async getStats(periodo?: string): Promise<AnomaliasStats> {
    // // console.log('📊 [AnomaliasService] Buscando estatísticas:', periodo);
    
    const params = new URLSearchParams();
    if (periodo && periodo !== 'all') {
      params.append('periodo', periodo);
    }

    const url = `${this.baseUrl}/stats${params.toString() ? `?${params}` : ''}`;
    // // console.log('📡 [AnomaliasService] URL Stats:', url);
    
    const response = await api.get(url);
    // // console.log('📊 [AnomaliasService] Estatísticas:', response.data);
    
    return response.data;
  }

  // ==========================================
  // 🔧 3. AÇÕES ESPECÍFICAS
  // ==========================================

  async gerarOS(anomaliaId: string): Promise<Anomalia> {
    // // console.log('🔧 [AnomaliasService] Gerando OS para anomalia:', anomaliaId);
    
    const response = await api.post(`${this.baseUrl}/${anomaliaId}/gerar-os`);
    // // console.log('✅ [AnomaliasService] OS gerada:', response.data);
    
    return response.data;
  }

  async resolver(anomaliaId: string, observacoes?: string): Promise<Anomalia> {
    // // console.log('✅ [AnomaliasService] Resolvendo anomalia:', anomaliaId, observacoes);
    
    const dto: ResolverAnomaliaDto = { observacoes };
    
    const response = await api.post(`${this.baseUrl}/${anomaliaId}/resolver`, dto);
    // // console.log('✅ [AnomaliasService] Anomalia resolvida:', response.data);
    
    return response.data;
  }

  async cancelar(anomaliaId: string, motivo?: string): Promise<Anomalia> {
    // // console.log('❌ [AnomaliasService] Cancelando anomalia:', anomaliaId, motivo);
    
    const dto: CancelarAnomaliaDto = { motivo };
    
    const response = await api.post(`${this.baseUrl}/${anomaliaId}/cancelar`, dto);
    // // console.log('❌ [AnomaliasService] Anomalia cancelada:', response.data);
    
    return response.data;
  }

  // ==========================================
  // 🔧 4. UTILITÁRIOS
  // ==========================================

  async testConnection(): Promise<boolean> {
    try {
      // // console.log('🧪 [AnomaliasService] Testando conexão com API...');
      
      // Fazer uma chamada simples para testar conectividade
      await api.get(`${this.baseUrl}/stats`);
      
      // // console.log('✅ [AnomaliasService] Conexão OK');
      return true;
    } catch (error) {
      // // console.error('❌ [AnomaliasService] Erro na conexão:', error);
      return false;
    }
  }
}

// Instância singleton
export const anomaliasService = new AnomaliasApiService();
export default anomaliasService;