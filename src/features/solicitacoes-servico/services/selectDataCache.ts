// src/features/solicitacoes-servico/services/selectDataCache.ts
import { api } from '@/config/api';

interface SelectOption {
  value: string;
  label: string;
}

interface PlantaData {
  id: string;
  nome: string;
  proprietarioId?: string;  // Corrigido para camelCase
  proprietario?: {
    id: string;
    nome: string;
  };
  cidade?: string;
  uf?: string;
  endereco?: string;
}

interface UnidadeData {
  id: string;
  nome: string;
  plantaId: string;  // Corrigido para camelCase
}

class SelectDataCache {
  private static instance: SelectDataCache;
  private proprietarios: SelectOption[] = [];
  private plantas: PlantaData[] = [];
  private unidades: UnidadeData[] = [];
  private loading = false;
  private loaded = false;
  private listeners: Set<() => void> = new Set();

  private constructor() {}

  static getInstance(): SelectDataCache {
    if (!SelectDataCache.instance) {
      SelectDataCache.instance = new SelectDataCache();
    }
    return SelectDataCache.instance;
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener());
  }

  async loadData() {
    // Se já está carregando ou já carregou, não fazer nada
    if (this.loading || this.loaded) {
      return;
    }

    this.loading = true;
    this.notify();

    try {
      const [proprietariosRes, plantasRes, unidadesRes] = await Promise.all([
        api.get('/usuarios', { params: { limit: 100 } }).catch(err => {
          console.error('Erro ao buscar proprietários:', err);
          return { data: { data: [] } };
        }),
        api.get('/plantas', { params: { limit: 100 } }).catch(err => {
          console.error('Erro ao buscar plantas:', err);
          return { data: { data: [] } };
        }),
        api.get('/unidades', { params: { limit: 100 } }).catch(err => {
          console.error('Erro ao buscar unidades:', err);
          return { data: { data: [] } };
        })
      ]);

      // Processar proprietários
      const usuarios = proprietariosRes.data.data || proprietariosRes.data || [];
      this.proprietarios = usuarios.map((usuario: any) => ({
        value: usuario.id,
        label: usuario.nome,
      }));

      // Processar plantas
      const plantasData = plantasRes.data.data || plantasRes.data || [];
      this.plantas = Array.isArray(plantasData) ? plantasData : [];

      console.log('[CACHE] Plantas carregadas:', this.plantas.length);
      if (this.plantas.length > 0) {
        console.log('[CACHE] Exemplo de planta:', this.plantas[0]);
      }

      // Processar unidades
      const unidadesData = unidadesRes.data.data || unidadesRes.data || [];
      this.unidades = Array.isArray(unidadesData) ? unidadesData : [];

      console.log('[CACHE] Unidades carregadas:', this.unidades.length);
      if (this.unidades.length > 0) {
        console.log('[CACHE] Exemplo de unidade:', this.unidades[0]);
      }

      this.loaded = true;
    } catch (error) {
      console.error('SelectDataCache: Erro ao carregar dados:', error);
    } finally {
      this.loading = false;
      this.notify();
    }
  }

  getProprietarios(): SelectOption[] {
    return this.proprietarios;
  }

  getPlantasOptions(proprietarioId?: string): SelectOption[] {
    if (!proprietarioId) {
      return [];
    }

    // Filtrar plantas pelo proprietarioId (camelCase)
    const filteredPlantas = this.plantas.filter(p =>
      p.proprietarioId?.trim() === proprietarioId.trim()
    );

    return filteredPlantas.map(planta => ({
      value: planta.id,
      label: `${planta.nome}${planta.cidade ? ` - ${planta.cidade}/${planta.uf}` : ''}`,
    }));
  }

  // Buscar uma unidade específica por ID
  getUnidadeById(unidadeId?: string): SelectOption | null {
    if (!unidadeId) {
      console.log('[CACHE] getUnidadeById chamado com ID vazio/nulo');
      return null;
    }

    console.log('[CACHE] Buscando unidade por ID:', unidadeId, 'Length:', unidadeId.length);

    // Tentar encontrar com trim em ambos os lados
    const unidade = this.unidades.find(u => {
      // Comparar com trim em ambos para lidar com espaços
      return u.id?.trim() === unidadeId.trim();
    });

    if (unidade) {
      console.log('[CACHE] ✅ Unidade encontrada por ID:', unidade.nome, 'ID:', unidade.id);
      return {
        value: unidade.id,
        label: unidade.nome,
      };
    }

    console.log('[CACHE] ❌ Unidade NÃO encontrada por ID:', unidadeId);

    // Debug: mostrar os primeiros 5 IDs disponíveis
    console.log('[CACHE] Primeiros IDs de unidades disponíveis:',
      this.unidades.slice(0, 5).map(u => ({ id: u.id, nome: u.nome }))
    );

    return null;
  }

  getUnidadesOptions(plantaId?: string, currentUnidadeId?: string): SelectOption[] {
    console.log('[CACHE] getUnidadesOptions chamado com:', { plantaId, currentUnidadeId });

    const unidadesSet = new Map<string, SelectOption>();

    // SEMPRE incluir a unidade atual se ela existir
    // Isso garante que a unidade selecionada apareça mesmo se a planta estiver diferente
    if (currentUnidadeId) {
      const unidadeAtual = this.getUnidadeById(currentUnidadeId);
      if (unidadeAtual) {
        unidadesSet.set(unidadeAtual.value, unidadeAtual);
        console.log('[CACHE] Adicionada unidade atual:', unidadeAtual.label);
      }
    }

    // Se há plantaId, adicionar as unidades dessa planta
    if (plantaId) {
      console.log('[CACHE] Filtrando unidades pela planta:', plantaId);

      const unidadesDaPlanta = this.unidades.filter(u => {
        const plantaIdFromUnidade = u.plantaId || (u as any).planta_id;
        return plantaIdFromUnidade?.trim() === plantaId.trim();
      });

      console.log('[CACHE] Unidades da planta encontradas:', unidadesDaPlanta.length);

      unidadesDaPlanta.forEach(unidade => {
        if (!unidadesSet.has(unidade.id)) {
          unidadesSet.set(unidade.id, {
            value: unidade.id,
            label: unidade.nome,
          });
        }
      });
    }

    const resultado = Array.from(unidadesSet.values());
    console.log('[CACHE] Total de unidades para mostrar:', resultado.length);

    return resultado;
  }

  isLoading(): boolean {
    return this.loading;
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  // Limpar cache quando necessário (ex: ao fazer logout)
  clearCache() {
    this.proprietarios = [];
    this.plantas = [];
    this.unidades = [];
    this.loaded = false;
    this.loading = false;
    this.notify();
  }
}

export default SelectDataCache.getInstance();