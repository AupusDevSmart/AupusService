// src/features/solicitacoes-servico/services/selectDataCache.ts
import { api } from '@/config/api';
import { formatApiError } from '@/utils/api-error';
import { todasAsPaginas, type PaginaDaListagem } from '@/lib/planilha/todas-as-paginas';

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
  planta_id?: string;  // A API ainda manda o nome cru
}

class SelectDataCache {
  private static instance: SelectDataCache;
  private plantas: PlantaData[] = [];
  private unidades: UnidadeData[] = [];
  private loading = false;
  private loaded = false;
  private erro: string | null = null;
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

  /**
   * Todas as plantas e instalações, uma vez por sessão.
   *
   * Paginado (28/out/2026): com uma página de 100, a planta ou a instalação da
   * 101ª em diante não aparecia, e o combo dizia "nenhuma instalação nesta
   * planta" — agora é ele que escolhe onde a programação da solicitação sem
   * planta grava. O erro fica visível (`getErro`) e não marca como carregado: a
   * próxima abertura tenta de novo. Antes cada falha virava lista vazia calada.
   */
  async loadData() {
    if (this.loading || this.loaded) {
      return;
    }

    this.loading = true;
    this.erro = null;
    this.notify();

    const pagina = <T,>(rota: string) => async (page: number, limit: number) =>
      (await api.get(rota, { params: { page, limit } })).data as PaginaDaListagem<T>;

    try {
      const [plantas, unidades] = await Promise.all([
        todasAsPaginas(pagina<PlantaData>('/plantas')),
        todasAsPaginas(pagina<UnidadeData>('/unidades')),
      ]);
      this.plantas = plantas;
      this.unidades = unidades;
      this.loaded = true;
    } catch (erro) {
      this.erro = formatApiError(erro);
    } finally {
      this.loading = false;
      this.notify();
    }
  }

  /** A falha da última carga, para o seletor dizer que não leu (e não "nenhuma") */
  getErro(): string | null {
    return this.erro;
  }

  /**
   * Sem proprietario, devolve TODAS as plantas.
   *
   * Antes devolvia lista vazia, o que obrigava a escolher o proprietario
   * primeiro. Na solicitacao de servico isso era um passo a mais para chegar
   * onde se queria: quem abre o formulario sabe a planta, e o proprietario e
   * consequencia dela — nunca o contrario.
   */
  getPlantasOptions(proprietarioId?: string): SelectOption[] {
    const filtradas = proprietarioId
      ? this.plantas.filter((p) => p.proprietarioId?.trim() === proprietarioId.trim())
      : this.plantas;

    return filtradas.map(planta => ({
      value: planta.id,
      label: `${planta.nome}${planta.cidade ? ` - ${planta.cidade}/${planta.uf}` : ''}`,
    }));
  }

  /** O proprietario de uma planta, para preencher sozinho o que saiu da tela. */
  getProprietarioDaPlanta(plantaId?: string): string {
    if (!plantaId) return '';
    const planta = this.plantas.find((p) => p.id?.trim() === plantaId.trim());
    return planta?.proprietarioId?.trim() ?? '';
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
        const plantaIdFromUnidade = u.plantaId || u.planta_id;
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
    this.plantas = [];
    this.unidades = [];
    this.loaded = false;
    this.loading = false;
    this.notify();
  }
}

export default SelectDataCache.getInstance();