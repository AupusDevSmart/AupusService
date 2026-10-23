import { api } from '@/config/api';
// As respostas seguem o formato que a rota /unidades devolve (UnidadeResponse do
// backend), que e o `Unidade` da feature — nao o `UnidadeNexon` de types/unidades.
import {
  CreateUnidadeDto,
  UpdateUnidadeDto,
  Unidade as UnidadeCompleta,
  UnidadeFilters as FiltrosDeUnidade,
  UnidadesResponse,
  UnidadeEstatisticas,
  UnidadeEquipamentosResponse,
} from '../features/unidades/types';

class UnidadesService {
  private readonly baseUrl = '/unidades';

  // Listar unidades com filtros e paginação
  async listarUnidades(filtros?: FiltrosDeUnidade): Promise<UnidadesResponse> {
    try {
      const params = new URLSearchParams();

      if (filtros?.search) params.append('search', filtros.search);
      if (filtros?.plantaId) params.append('plantaId', filtros.plantaId);
      if (filtros?.proprietarioId) params.append('proprietarioId', filtros.proprietarioId); // ✅ ADICIONADO
      if (filtros?.tipo) params.append('tipo', filtros.tipo);
      if (filtros?.status) params.append('status', filtros.status);
      if (filtros?.estado) params.append('estado', filtros.estado);
      if (filtros?.page) params.append('page', filtros.page.toString());
      if (filtros?.limit) params.append('limit', filtros.limit.toString());
      if (filtros?.orderBy) params.append('orderBy', filtros.orderBy);
      if (filtros?.orderDirection) params.append('orderDirection', filtros.orderDirection);

      console.log('🔍 [UnidadesService] Enviando requisição com params:', params.toString());
      console.log('🔍 [UnidadesService] proprietarioId no filtro:', filtros?.proprietarioId);

      const response = await api.get<UnidadesResponse>(`${this.baseUrl}?${params.toString()}`);

      console.log('📨 [UnidadesService] Resposta da API:', {
        status: response.status,
        hasData: !!response.data,
        hasNestedData: !!response.data,
        dataKeys: response.data ? Object.keys(response.data) : []
      });

      // A API retorna { success: true, data: { data: [], pagination: {} } }
      return response.data;
    } catch (error) {
      console.error('❌ [UnidadesService] Erro ao listar unidades:', error);
      throw error;
    }
  }

  // Buscar unidade por ID
  async buscarUnidade(id: string): Promise<UnidadeCompleta> {
    try {
      const response = await api.get<UnidadeCompleta>(`${this.baseUrl}/${id}`);
      // Busca por ID retorna o objeto diretamente dentro de data
      return response.data;
    } catch (error) {
      console.error('❌ [UnidadesService] Erro ao buscar unidade:', error);
      throw error;
    }
  }

  // Criar nova unidade
  async criarUnidade(dados: CreateUnidadeDto): Promise<UnidadeCompleta> {
    try {
      // 🔍 LOG DETALHADO - Dados antes de enviar
      console.log('🏁 [FRONTEND SERVICE - CREATE] ===== INÍCIO =====');
      console.log('📦 [FRONTEND SERVICE - CREATE] DTO completo:', JSON.stringify(dados, null, 2));
      console.log('🔑 [FRONTEND SERVICE - CREATE] concessionaria_id:', dados.concessionaria_id);
      console.log('🔍 [FRONTEND SERVICE - CREATE] Tipo:', typeof dados.concessionaria_id);
      console.log('📝 [FRONTEND SERVICE - CREATE] É undefined?', dados.concessionaria_id === undefined);
      console.log('📝 [FRONTEND SERVICE - CREATE] É null?', dados.concessionaria_id === null);
      console.log('📝 [FRONTEND SERVICE - CREATE] É string vazia?', dados.concessionaria_id === '');

      const response = await api.post<UnidadeCompleta>(this.baseUrl, dados);

      console.log('✅ [FRONTEND SERVICE - CREATE] Resposta recebida');
      const result = response.data;
      console.log('🔑 [FRONTEND SERVICE - CREATE] concessionariaId na resposta:', result.concessionariaId);
      console.log('🏁 [FRONTEND SERVICE - CREATE] ===== FIM =====');

      // Sem alert nativo: ele BLOQUEIA a thread ate alguem clicar em OK, e o
      // sheet ja avisa por toast. No cadastro isso era pior ainda, porque o
      // upload dos anexos so continua depois do OK.
      return result;
    } catch (error) {
      console.error('❌ [UnidadesService] Erro ao criar unidade:', error);
      throw error;
    }
  }

  // Atualizar unidade
  async atualizarUnidade(id: string, dados: UpdateUnidadeDto): Promise<UnidadeCompleta> {
    try {
      const response = await api.put<UnidadeCompleta>(`${this.baseUrl}/${id}`, dados);

      // Exibir sucesso

      return response.data;
    } catch (error) {
      console.error('❌ [UnidadesService] Erro ao atualizar unidade:', error);
      throw error;
    }
  }

  // Excluir unidade
  async excluirUnidade(id: string): Promise<void> {
    try {
      await api.delete(`${this.baseUrl}/${id}`);

      // Exibir sucesso
    } catch (error) {
      console.error('Erro ao excluir unidade:', error);
      throw error;
    }
  }

  // obterEstatisticas (/stats), importarUnidades (/import) e exportarCSV
  // (/export/csv) sairam: chamavam rotas que o backend nao tem e ninguem os
  // usava (achado no SN-36). As estatisticas de uma unidade sao
  // buscarEstatisticasUnidade; a planilha do cadastro e a de plantas.

  // Validar dados antes de enviar
  private validarDados(dados: CreateUnidadeDto | UpdateUnidadeDto): boolean {
    if ('nome' in dados && dados.nome && dados.nome.trim().length === 0) {
      alert('Nome da unidade é obrigatório.');
      return false;
    }

    if ('potencia' in dados && dados.potencia !== undefined && dados.potencia < 0) {
      alert('Potência deve ser um valor positivo.');
      return false;
    }

    if ('latitude' in dados && dados.latitude !== undefined) {
      if (dados.latitude < -90 || dados.latitude > 90) {
        alert('Latitude deve estar entre -90 e 90.');
        return false;
      }
    }

    if ('longitude' in dados && dados.longitude !== undefined) {
      if (dados.longitude < -180 || dados.longitude > 180) {
        alert('Longitude deve estar entre -180 e 180.');
        return false;
      }
    }

    return true;
  }

  // Método público para validação
  validarDadosUnidade(dados: CreateUnidadeDto | UpdateUnidadeDto): boolean {
    return this.validarDados(dados);
  }

  // Buscar unidades por planta
  async buscarUnidadesPorPlanta(plantaId: string): Promise<UnidadeCompleta[]> {
    try {
      // Limpar o plantaId de espaços extras
      const cleanPlantaId = plantaId?.trim();
      console.log(`📡 [UnidadesService] Buscando unidades da planta ${cleanPlantaId}`);

      // Tentar endpoint específico primeiro
      try {
        const response = await api.get<UnidadeCompleta[]>(`${this.baseUrl}/planta/${cleanPlantaId}`);
        const data = response.data;
        return Array.isArray(data) ? data : [];
      } catch (err) {
        // Fallback: usar endpoint geral com filtro
        console.log('⚠️ [UnidadesService] Endpoint /planta não disponível, usando filtro');
        const response = await api.get<UnidadesResponse | UnidadeCompleta[]>(`${this.baseUrl}?plantaId=${cleanPlantaId}&limit=100`);

        const responseData = response.data;
        const data = (Array.isArray(responseData) ? responseData : responseData.data) || [];

        return Array.isArray(data) ? data : [];
      }
    } catch (error) {
      console.error(`❌ [UnidadesService] Erro ao buscar unidades por planta ${plantaId}:`, error);
      // Retornar array vazio em vez de throw para não quebrar o UI
      return [];
    }
  }

  // Buscar unidades por proprietário
  async buscarUnidadesPorProprietario(proprietarioId: string): Promise<UnidadeCompleta[]> {
    try {
      const cleanProprietarioId = proprietarioId?.trim();
      console.log(`📡 [UnidadesService] Buscando unidades do proprietário ${cleanProprietarioId}`);

      // Usar endpoint geral com filtro de proprietário
      const response = await api.get<UnidadesResponse | UnidadeCompleta[]>(`${this.baseUrl}?proprietarioId=${cleanProprietarioId}&limit=1000`);

      const responseData = response.data;
      const data = (Array.isArray(responseData) ? responseData : responseData.data) || [];

      console.log(`✅ [UnidadesService] ${Array.isArray(data) ? data.length : 0} unidades encontradas`);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error(`❌ [UnidadesService] Erro ao buscar unidades por proprietário ${proprietarioId}:`, error);
      // Retornar array vazio em vez de throw para não quebrar o UI
      return [];
    }
  }

  // Buscar estatísticas de uma unidade específica
  async buscarEstatisticasUnidade(id: string): Promise<UnidadeEstatisticas> {
    try {
      const cleanId = id?.trim();
      console.log(`📡 [UnidadesService] Buscando estatísticas da unidade ${cleanId}`);

      const response = await api.get<UnidadeEstatisticas>(`${this.baseUrl}/${cleanId}/estatisticas`);
      return response.data;
    } catch (error) {
      console.error(`❌ [UnidadesService] Erro ao buscar estatísticas da unidade ${id}:`, error);
      throw error;
    }
  }

  // Buscar equipamentos de uma unidade específica
  async buscarEquipamentosUnidade(
    id: string,
    filters?: { page?: number; limit?: number; search?: string }
  ): Promise<UnidadeEquipamentosResponse> {
    try {
      const cleanId = id?.trim();
      console.log(`📡 [UnidadesService] Buscando equipamentos da unidade ${cleanId}`);

      const params = new URLSearchParams();
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.search) params.append('search', filters.search);

      const response = await api.get<UnidadeEquipamentosResponse>(`${this.baseUrl}/${cleanId}/equipamentos?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error(`❌ [UnidadesService] Erro ao buscar equipamentos da unidade ${id}:`, error);
      throw error;
    }
  }
}

// Exportar instância única (singleton)
export const unidadesService = new UnidadesService();
export default unidadesService;

// ✅ EXPORTS NOMEADOS PARA COMPATIBILIDADE COM IMPORTS FUNCTION-BASED
export const getAllUnidades = (filters?: FiltrosDeUnidade) => unidadesService.listarUnidades(filters);
export const getUnidadeById = (id: string) => unidadesService.buscarUnidade(id);
export const createUnidade = (dados: CreateUnidadeDto) => unidadesService.criarUnidade(dados);
export const updateUnidade = (id: string, dados: UpdateUnidadeDto) => unidadesService.atualizarUnidade(id, dados);
export const deleteUnidade = (id: string) => unidadesService.excluirUnidade(id);
export const getUnidadesByPlanta = (plantaId: string) => unidadesService.buscarUnidadesPorPlanta(plantaId);
export const getUnidadesByProprietario = (proprietarioId: string) => unidadesService.buscarUnidadesPorProprietario(proprietarioId);
export const getUnidadeEstatisticas = (id: string) => unidadesService.buscarEstatisticasUnidade(id);
export const getUnidadeEquipamentos = (id: string, filters?: { page?: number; limit?: number; search?: string }) =>
  unidadesService.buscarEquipamentosUnidade(id, filters);

// ✅ TIPOS RE-EXPORTADOS
export type { UnidadeCompleta as Unidade, FiltrosDeUnidade as UnidadeFilters };