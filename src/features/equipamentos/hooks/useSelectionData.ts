// src/features/equipamentos/hooks/useSelectionData.ts - COM CARREGAMENTO OTIMIZADO
import { useState, useEffect, useCallback, useRef } from 'react';
import { isAxiosError } from 'axios';
import { 
  selectionDataService,
  ProprietarioSelection,
  PlantaSelection,
  SelectionOption,
  type NivelDaHierarquia,
} from '@/services/selection-data.services';

/** A mensagem do erro, quando ha uma. */
const mensagemDoErro = (erro: unknown): string | undefined =>
  erro instanceof Error ? erro.message : undefined;

interface UseSelectionDataReturn {
  // Estados de loading
  loadingProprietarios: boolean;
  loadingPlantas: boolean;
  loadingHierarquia: boolean;
  loadingUCs: boolean;
  
  // Dados
  proprietarios: ProprietarioSelection[];
  plantas: PlantaSelection[];
  equipamentosUC: SelectionOption[];
  
  // Funções para carregar dados
  fetchProprietarios: () => Promise<ProprietarioSelection[]>;
  fetchPlantas: (proprietarioId?: string) => Promise<PlantaSelection[]>;
  fetchHierarquiaNivel: (nivel: string, parentId?: string) => Promise<NivelDaHierarquia[]>;
  fetchEquipamentosUC: (plantaId?: string) => Promise<SelectionOption[]>;
  
  // Utilitários
  getProprietarioById: (id: string) => ProprietarioSelection | null;
  getPlantaById: (id: string) => PlantaSelection | null;
  
  // Estados para o modal
  error: string | null;
  clearError: () => void;
}

export function useSelectionData(): UseSelectionDataReturn {
  // Estados de loading
  const [loadingProprietarios, setLoadingProprietarios] = useState(false);
  const [loadingPlantas, setLoadingPlantas] = useState(false);
  const [loadingHierarquia, setLoadingHierarquia] = useState(false);
  const [loadingUCs, setLoadingUCs] = useState(false);

  // Estados de dados
  const [proprietarios, setProprietarios] = useState<ProprietarioSelection[]>([]);
  const [plantas, setPlantas] = useState<PlantaSelection[]>([]);
  const [equipamentosUC, setEquipamentosUC] = useState<SelectionOption[]>([]);

  // Estado de erro
  const [error, setError] = useState<string | null>(null);

  // Flag para evitar loop quando fetch falha (403, network, etc.) e ainda assim deixa proprietarios = []
  const proprietariosAttemptedRef = useRef(false);

  // ============================================================================
  // PROPRIETÁRIOS - APENAS AQUELES COM PLANTAS
  // ============================================================================
  const fetchProprietarios = useCallback(async (): Promise<ProprietarioSelection[]> => {
    console.log('🚀 [HOOK] Iniciando fetchProprietarios (apenas com plantas)...');
    proprietariosAttemptedRef.current = true;
    try {
      setLoadingProprietarios(true);
      setError(null);
      
      const data = await selectionDataService.getProprietarios();
      console.log(`✅ [HOOK] ${data.length} proprietários com plantas carregados`);
      
      setProprietarios(data);
      return data;
    } catch (error) {
      // 403 e esperado para roles sem `usuarios.view`. Nao mostrar banner de erro.
      if (isAxiosError(error) && error.response?.status === 403) {
        console.warn('[HOOK] Sem permissao para listar proprietarios (403). Lista fica vazia.');
      } else {
        console.error('❌ [HOOK] Erro ao carregar proprietários:', error);
        const errorMessage = mensagemDoErro(error) || 'Erro ao carregar proprietários';
        setError(`Erro ao carregar proprietários: ${errorMessage}`);
      }
      setProprietarios([]); // Limpar dados em caso de erro
      return [];
    } finally {
      setLoadingProprietarios(false);
    }
  }, []);

  // ============================================================================
  // PLANTAS - DINÂMICO POR PROPRIETÁRIO
  // ============================================================================
  const fetchPlantas = useCallback(async (proprietarioId?: string): Promise<PlantaSelection[]> => {
    console.log('🚀 [HOOK] Iniciando fetchPlantas para proprietário:', proprietarioId);
    
    // Se não tem proprietário, limpar plantas
    if (!proprietarioId || proprietarioId === 'all') {
      console.log('📝 [HOOK] Limpando plantas (nenhum proprietário selecionado)');
      setPlantas([]);
      return [];
    }

    try {
      setLoadingPlantas(true);
      setError(null);
      
      const data = await selectionDataService.getPlantas(proprietarioId);
      console.log(`✅ [HOOK] ${data.length} plantas carregadas para proprietário ${proprietarioId}`);
      
      setPlantas(data);
      return data;
    } catch (error) {
      console.error('❌ [HOOK] Erro ao carregar plantas:', error);
      const errorMessage = mensagemDoErro(error) || 'Erro ao carregar plantas';
      setError(`Erro ao carregar plantas: ${errorMessage}`);
      setPlantas([]); // Limpar dados em caso de erro
      return [];
    } finally {
      setLoadingPlantas(false);
    }
  }, []);

  // ============================================================================
  // HIERARQUIA
  // ============================================================================
  const fetchHierarquiaNivel = useCallback(async (nivel: string, parentId?: string): Promise<NivelDaHierarquia[]> => {
    try {
      setLoadingHierarquia(true);
      setError(null);
      return await selectionDataService.getHierarquiaNivel(nivel, parentId);
    } catch (error) {
      console.error(`❌ [HOOK] Erro ao carregar ${nivel}:`, error);
      const errorMessage = mensagemDoErro(error) || `Erro ao carregar ${nivel}`;
      setError(`Erro ao carregar ${nivel}: ${errorMessage}`);
      return [];
    } finally {
      setLoadingHierarquia(false);
    }
  }, []);

  // Os tipos de equipamento (lista fixa, mockada) sairam: os campos tecnicos vem
  // da categoria e o modelo, da rota /tipos-equipamentos (useModelos). SN-42.

  // ============================================================================
  // EQUIPAMENTOS UC
  // ============================================================================
  const fetchEquipamentosUC = useCallback(async (plantaId?: string): Promise<SelectionOption[]> => {
    try {
      setLoadingUCs(true);
      setError(null);
      
      const data = await selectionDataService.getEquipamentosUCDisponiveis(plantaId);
      setEquipamentosUC(data);
      return data;
    } catch (error) {
      console.error('❌ [HOOK] Erro ao carregar equipamentos UC:', error);
      const errorMessage = mensagemDoErro(error) || 'Erro ao carregar equipamentos UC';
      setError(`Erro ao carregar equipamentos UC: ${errorMessage}`);
      setEquipamentosUC([]);
      return [];
    } finally {
      setLoadingUCs(false);
    }
  }, []);

  // ============================================================================
  // UTILITÁRIOS
  // ============================================================================
  const getProprietarioById = useCallback((id: string): ProprietarioSelection | null => {
    return proprietarios.find(p => p.id === id) || null;
  }, [proprietarios]);

  const getPlantaById = useCallback((id: string): PlantaSelection | null => {
    return plantas.find(p => p.id === id) || null;
  }, [plantas]);

  // Função para limpar erro
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Debug dos estados importantes
  useEffect(() => {
    console.log('📊 [HOOK] Estados atuais:');
    console.log('- Proprietários:', { loading: loadingProprietarios, count: proprietarios.length });
    console.log('- Plantas:', { loading: loadingPlantas, count: plantas.length });
    console.log('- Erro:', error);
  }, [loadingProprietarios, proprietarios.length, loadingPlantas, plantas.length, error]);

  // ============================================================================
  // EFEITO PARA CARREGAR PROPRIETÁRIOS QUANDO NECESSÁRIO
  // ============================================================================
  useEffect(() => {
    // Carregar apenas uma vez por montagem do hook. Mesmo que o fetch termine
    // com [] (ex: usuario sem permission `usuarios.view` recebe 403), nao
    // re-tentar — senao o effect entra em loop porque o estado de proprietarios
    // continua === 0.
    if (
      !proprietariosAttemptedRef.current &&
      proprietarios.length === 0 &&
      !loadingProprietarios
    ) {
      console.log('📝 [HOOK] Proprietários não carregados, iniciando carregamento...');
      fetchProprietarios();
    }
  }, [proprietarios.length, loadingProprietarios, fetchProprietarios]);

  return {
    // Estados de loading
    loadingProprietarios,
    loadingPlantas,
    loadingHierarquia,
    loadingUCs,
    
    // Dados
    proprietarios,
    plantas,
    equipamentosUC,
    
    // Funções
    fetchProprietarios,
    fetchPlantas,
    fetchHierarquiaNivel,
    fetchEquipamentosUC,
    
    // Utilitários
    getProprietarioById,
    getPlantaById,
    
    // Estados para o modal
    error,
    clearError
  };
}