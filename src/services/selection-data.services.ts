// src/services/selection-data.services.ts - COM PROPRIETÁRIOS COM PLANTAS
import { api } from '@/config/api';
import { UsuariosService } from './usuarios.services';
import { PlantasService, type PlantaResponse } from './plantas.services';

// ============================================================================
// TIPOS PARA DADOS DE SELEÇÃO
// ============================================================================

export interface SelectionOption {
  id: string;
  nome: string;
  label?: string;
}

export interface ProprietarioSelection extends SelectionOption {
  cpf_cnpj: string;
  tipo: 'pessoa_fisica' | 'pessoa_juridica';
  email?: string;
  telefone?: string;
  cidade?: string;
  estado?: string;
  totalPlantas?: number; // Novo campo para contar plantas
}

export interface PlantaSelection extends SelectionOption {
  localizacao?: string;
  cnpj?: string;
  proprietario_id: string;
}

/** Um nivel da hierarquia (area, subarea, linha...) — hoje so os dados mockados abaixo. */
export interface NivelDaHierarquia {
  id: string;
  nome: string;
  parent_id?: string;
  label: string;
}

/** O usuario como /usuarios devolve, no que a selecao de proprietario le. */
interface UsuarioDaApi {
  id: string;
  nome: string;
  cpf_cnpj?: string;
  email?: string;
  telefone?: string;
  cidade?: string;
  estado?: string;
}

/** A UC como /equipamentos/ucs-disponiveis devolve, no que a selecao le. */
interface UcDisponivelDaApi {
  id: string | number;
  nome?: string;
}

// ============================================================================
// SERVIÇO - COM INTEGRAÇÃO COM PLANTAS
// ============================================================================

export class SelectionDataService {
  
  // ============================================================================
  // PROPRIETÁRIOS - TODOS OS USUÁRIOS COM ROLES VÁLIDAS
  // ============================================================================
  async getProprietarios(): Promise<ProprietarioSelection[]> {
    // console.log('🔍 [SELECTION] Buscando todos os proprietários...');

    // Buscar TODOS os usuários com roles válidas
    const response = await api.get<UsuarioDaApi[] | { data?: UsuarioDaApi[] }>('/usuarios', {
      params: {
        roles: 'admin,gerente,proprietario',
        limit: 1000  // Buscar todos
      }
    });

    const usuariosData = response.data;
    const usuarios: UsuarioDaApi[] = (Array.isArray(usuariosData) ? usuariosData : usuariosData.data) || [];

    if (usuarios.length === 0) {
      console.warn('⚠️ [SELECTION] Nenhum proprietário cadastrado no sistema. Cadastre usuários com roles admin/gerente/proprietario.');
      return [];
    }

    // Mapear usuários para formato de proprietários
    const proprietarios: ProprietarioSelection[] = usuarios.map((usuario) => ({
      id: usuario.id,
      nome: usuario.nome,
      cpf_cnpj: usuario.cpf_cnpj || '',
      tipo: this.detectTipoPessoa(usuario.cpf_cnpj),
      email: usuario.email,
      telefone: usuario.telefone,
      cidade: usuario.cidade,
      estado: usuario.estado,
      totalPlantas: 0, // Não precisamos contar plantas aqui
      label: `${usuario.nome}${usuario.cpf_cnpj ? ` (${UsuariosService.formatCpfCnpj(usuario.cpf_cnpj)})` : ''}`
    }));

    // Ordenar por nome
    proprietarios.sort((a, b) => a.nome.localeCompare(b.nome));

    // console.log('✅ [SELECTION] Proprietários carregados:', proprietarios.length);

    return proprietarios;
  }

  // ============================================================================
  // PLANTAS - DINÂMICO POR PROPRIETÁRIO
  // ============================================================================
  async getPlantas(proprietarioId?: string): Promise<PlantaSelection[]> {
    // console.log('🔍 [SELECTION] Carregando plantas para proprietário:', proprietarioId);
    
    if (!proprietarioId || proprietarioId === 'all') {
      // console.log('⚠️ [SELECTION] Proprietário não especificado, retornando array vazio');
      return [];
    }

    // Buscar plantas do proprietário específico com paginação
    let todasPlantas: PlantaResponse[] = [];
    let page = 1;
    let hasMore = true;
    
    while (hasMore) {
      const plantasPage = await PlantasService.getAllPlantas({
        proprietarioId,
        limit: 100,
        page: page
      });
      
      if (!plantasPage.data || plantasPage.data.length === 0) {
        hasMore = false;
      } else {
        todasPlantas = [...todasPlantas, ...plantasPage.data];
        hasMore = plantasPage.pagination.page < plantasPage.pagination.totalPages;
        page++;
      }
    }

    if (todasPlantas.length === 0) {
      console.warn(`⚠️ [SELECTION] Nenhuma planta cadastrada para o proprietário ${proprietarioId}. Cadastre pelo menos uma planta antes de criar equipamentos.`);
      return [];
    }

    // Mapear plantas para formato de seleção
    const plantas: PlantaSelection[] = todasPlantas.map(planta => ({
      id: planta.id,
      nome: planta.nome,
      localizacao: planta.localizacao,
      cnpj: planta.cnpj,
      proprietario_id: planta.proprietarioId,
      label: `${planta.nome} - ${planta.localizacao || 'Localização não informada'}`
    }));

    // Ordenar por nome
    plantas.sort((a, b) => a.nome.localeCompare(b.nome));

    // console.log(`✅ [SELECTION] ${plantas.length} plantas carregadas para proprietário ${proprietarioId}`);
    
    return plantas;
  }

  private detectTipoPessoa(documento?: string): 'pessoa_fisica' | 'pessoa_juridica' {
    if (!documento) return 'pessoa_fisica';
    const limpo = documento.replace(/\D/g, '');
    return limpo.length > 11 ? 'pessoa_juridica' : 'pessoa_fisica';
  }

  // ============================================================================
  // HIERARQUIA - MOCK (TEMPORÁRIO - AGUARDANDO IMPLEMENTAÇÃO DA API)
  // ============================================================================
  async getHierarquiaNivel(nivel: string, parentId?: string): Promise<NivelDaHierarquia[]> {
    console.warn(`⚠️ [SELECTION] USANDO DADOS MOCKADOS para hierarquia ${nivel}. Implementar endpoint real na API.`);

    const mockData: Record<string, Omit<NivelDaHierarquia, 'label'>[]> = {
      'area': [
        { id: '1', nome: 'Produção', parent_id: parentId },
        { id: '2', nome: 'Logística', parent_id: parentId },
        { id: '3', nome: 'Administrativo', parent_id: parentId },
        { id: '4', nome: 'Manutenção', parent_id: parentId }
      ],
      'subarea': [
        { id: '1', nome: 'Linha A', parent_id: parentId },
        { id: '2', nome: 'Linha B', parent_id: parentId },
        { id: '3', nome: 'Expedição', parent_id: parentId },
        { id: '4', nome: 'Recebimento', parent_id: parentId }
      ],
      'linha': [
        { id: '1', nome: 'Montagem Principal', parent_id: parentId },
        { id: '2', nome: 'Montagem Secundária', parent_id: parentId },
        { id: '3', nome: 'Linha de Embalagem', parent_id: parentId }
      ],
      'conjunto': [
        { id: '1', nome: 'Conjunto Motor Principal', parent_id: parentId },
        { id: '2', nome: 'Conjunto Hidráulico', parent_id: parentId },
        { id: '3', nome: 'Conjunto Pneumático', parent_id: parentId }
      ],
      'maquina': [
        { id: '1', nome: 'Motor Elétrico 01', parent_id: parentId },
        { id: '2', nome: 'Bomba Hidráulica Principal', parent_id: parentId },
        { id: '3', nome: 'Compressor de Ar', parent_id: parentId }
      ]
    };
    
    return (mockData[nivel] || []).map(item => ({
      ...item,
      label: item.nome
    }));
  }

  // ============================================================================
  // EQUIPAMENTOS UC DISPONÍVEIS
  // ============================================================================
  async getEquipamentosUCDisponiveis(plantaId?: string): Promise<SelectionOption[]> {
    const params = plantaId ? { planta_id: plantaId } : {};
    const response = await api.get<UcDisponivelDaApi[]>('/equipamentos/ucs-disponiveis', { params });
    
    if (!response.data || !Array.isArray(response.data)) {
      console.warn('⚠️ [SELECTION] Nenhum equipamento UC disponível. Resposta da API inválida ou vazia.');
      return [];
    }

    return response.data.map((uc) => ({
      id: String(uc.id),
      nome: uc.nome || 'UC sem nome',
      label: uc.nome || 'UC sem nome'
    })).filter(uc => uc.id);
  }
}

// Instância única do serviço
export const selectionDataService = new SelectionDataService();