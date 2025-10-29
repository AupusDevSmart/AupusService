// src/features/anomalias/components/LocalizacaoController.tsx - VERSÃO FINAL LIMPA
import { useEquipamentos } from '@/features/equipamentos_xxx/hooks/useEquipamentos';
import { PlantaResponse, PlantasService } from '@/services/plantas.services';
import { getUnidadesByPlanta } from '@/services/unidades.services';
import { Loader2 } from 'lucide-react';
import React from 'react';

interface LocalizacaoValue {
  plantaId?: number;
  unidadeId?: number; // NOVO: Unidade do equipamento
  equipamentoId?: number;
  local?: string;
  ativo?: string;
}

interface LocalizacaoControllerProps {
  value?: any;
  onChange: (value: any) => void;
  disabled?: boolean;
  mode?: 'create' | 'edit' | 'view';
}

export const LocalizacaoController = ({ 
  value, 
  onChange, 
  disabled, 
  mode = 'create' 
}: LocalizacaoControllerProps) => {
  // Estados
  const [plantas, setPlantas] = React.useState<PlantaResponse[]>([]);
  const [plantaEspecifica, setPlantaEspecifica] = React.useState<PlantaResponse | null>(null);
  const [unidades, setUnidades] = React.useState<any[]>([]); // NOVO: Estado para unidades
  const [loadingPlantas, setLoadingPlantas] = React.useState(false);
  const [loadingPlantaEspecifica, setLoadingPlantaEspecifica] = React.useState(false);
  const [loadingUnidades, setLoadingUnidades] = React.useState(false); // NOVO: Loading state para unidades
  const [plantaId, setPlantaId] = React.useState('');
  const [unidadeId, setUnidadeId] = React.useState(''); // NOVO: Estado para unidadeId
  const [equipamentoId, setEquipamentoId] = React.useState('');
  const [hasLoaded, setHasLoaded] = React.useState(false);
  
  const { equipamentos, fetchEquipamentosByPlanta, loading: loadingEquipamentos } = useEquipamentos();
  
  const isCreateMode = mode === 'create';
  const isViewMode = mode === 'view';

  // Inicialização otimizada por modo
  React.useEffect(() => {
    const initialize = async () => {
      if (hasLoaded) return;
      setHasLoaded(true);

      if (isCreateMode) {
        // MODO CREATE: Carregar lista completa de plantas
        setLoadingPlantas(true);
        try {
          const response = await PlantasService.getAllPlantas({ limit: 100 });
          setPlantas(response.data);
        } catch (error) {
          setPlantas([]);
        } finally {
          setLoadingPlantas(false);
        }
        
      } else {
        // MODO VIEW/EDIT: Carregar apenas a planta específica da anomalia
        if (value?.plantaId) {
          const plantaIdStr = value.plantaId.toString().trim();
          const unidadeIdStr = value.unidadeId?.toString().trim(); // NOVO: Capturar unidadeId
          const equipamentoIdStr = value.equipamentoId?.toString().trim();

          setPlantaId(plantaIdStr);
          if (unidadeIdStr) {
            setUnidadeId(unidadeIdStr);
          }
          if (equipamentoIdStr) {
            setEquipamentoId(equipamentoIdStr);
          }

          // Carregar dados da planta específica
          setLoadingPlantaEspecifica(true);
          try {
            const plantaData = await PlantasService.getPlanta(plantaIdStr);
            setPlantaEspecifica(plantaData);
            
            // Se estiver em modo EDIT, carregar também os equipamentos
            if (mode === 'edit') {
              await fetchEquipamentosByPlanta(plantaIdStr, { 
                proprietarioId: 'all',
                plantaId: plantaIdStr,
                classificacao: 'UC',
                criticidade: 'all',
                limit: 100 
              });
            }
          } catch (error) {
            // Se não conseguir carregar, criar um mock com os dados disponíveis
            setPlantaEspecifica({
              id: plantaIdStr,
              nome: value.local || `Planta ID: ${plantaIdStr}`,
              cnpj: '', 
              localizacao: '', 
              horarioFuncionamento: '', 
              proprietarioId: '',
              endereco: { logradouro: '', bairro: '', cidade: '', uf: '', cep: '' },
              criadoEm: '', 
              atualizadoEm: ''
            });
          } finally {
            setLoadingPlantaEspecifica(false);
          }
        }
      }
    };

    initialize();
  }, []);

  // NOVO: Carregar unidades quando planta mudar (modo create)
  React.useEffect(() => {
    const loadUnidades = async () => {
      if (!plantaId || !isCreateMode) {
        setUnidades([]);
        return;
      }

      setLoadingUnidades(true);
      try {
        console.log('Carregando unidades da planta:', plantaId);
        const response = await getUnidadesByPlanta(plantaId);
        setUnidades(response || []);
        console.log('Unidades carregadas:', response?.length || 0);
      } catch (error) {
        console.error('Erro ao carregar unidades:', error);
        setUnidades([]);
      } finally {
        setLoadingUnidades(false);
      }
    };

    loadUnidades();
  }, [plantaId, isCreateMode]);

  // Handlers
  const handlePlantaChange = async (newPlantaId: string) => {
    if (!isCreateMode) return;

    setPlantaId(newPlantaId);
    setUnidadeId(''); // NOVO: Resetar unidade quando planta muda
    setEquipamentoId(''); // Resetar equipamento quando planta muda

    const plantaSelecionada = plantas.find(p => p.id.toString() === newPlantaId);

    const novoValue: LocalizacaoValue = {
      plantaId: newPlantaId ? Number(newPlantaId) : undefined,
      unidadeId: undefined, // NOVO: Resetar unidadeId
      equipamentoId: undefined,
      local: plantaSelecionada?.nome || '',
      ativo: ''
    };

    onChange(novoValue);

    if (newPlantaId) {
      try {
        await fetchEquipamentosByPlanta(newPlantaId, { 
          proprietarioId: 'all',
          plantaId: newPlantaId,
          classificacao: 'UC',
          criticidade: 'all',
          limit: 100 
        });
      } catch (error) {
        // Erro no carregamento dos equipamentos
      }
    }
  };

  // NOVO: Handler para mudança de unidade
  const handleUnidadeChange = async (newUnidadeId: string) => {
    if (!isCreateMode) return;

    setUnidadeId(newUnidadeId);
    setEquipamentoId(''); // Resetar equipamento quando unidade muda

    const plantaSelecionada = plantas.find(p => p.id.toString() === plantaId);

    const novoValue: LocalizacaoValue = {
      plantaId: plantaId ? Number(plantaId) : undefined,
      unidadeId: newUnidadeId ? Number(newUnidadeId) : undefined,
      equipamentoId: undefined,
      local: plantaSelecionada?.nome || '',
      ativo: ''
    };

    onChange(novoValue);

    // Carregar equipamentos da unidade
    if (newUnidadeId) {
      try {
        // TODO: Atualizar para usar unidade_id quando backend suportar
        await fetchEquipamentosByPlanta(newUnidadeId, {
          proprietarioId: 'all',
          plantaId: newUnidadeId, // Temporariamente usando plantaId
          classificacao: 'UC',
          criticidade: 'all',
          limit: 100
        });
      } catch (error) {
        // Erro no carregamento dos equipamentos
      }
    }
  };

  const handleEquipamentoChange = (newEquipamentoId: string) => {
    if (isViewMode) return; // VIEW não permite edição

    setEquipamentoId(newEquipamentoId);

    const equipamentoSelecionado = equipamentos.find(eq => eq.id.toString() === newEquipamentoId);
    const plantaSelecionada = plantas.find(p => p.id.toString() === plantaId);

    const novoValue: LocalizacaoValue = {
      plantaId: plantaId ? Number(plantaId) : undefined,
      unidadeId: unidadeId ? Number(unidadeId) : undefined, // NOVO: Incluir unidadeId
      equipamentoId: newEquipamentoId ? Number(newEquipamentoId) : undefined,
      local: plantaSelecionada?.nome || '',
      ativo: equipamentoSelecionado?.nome || ''
    };

    onChange(novoValue);
  };

  // Equipamentos disponíveis - filtrar por unidade ao invés de planta
  const equipamentosDisponiveis = equipamentos.filter(eq =>
    eq.classificacao === 'UC' &&
    (unidadeId ? eq.unidadeId?.toString().trim() === unidadeId.trim() : eq.unidade?.plantaId?.toString().trim() === plantaId.trim())
  );

  // Loading state
  if (!hasLoaded || (isCreateMode && loadingPlantas) || (!isCreateMode && loadingPlantaEspecifica)) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>
            {isCreateMode ? 'Carregando plantas...' : 'Carregando localização...'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* SELECT DE PLANTAS */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Planta/Local <span className="text-red-500">*</span>
        </label>
        
        {isCreateMode ? (
          // MODO CREATE: Select com lista completa
          <select
            value={plantaId}
            onChange={(e) => handlePlantaChange(e.target.value)}
            disabled={disabled}
            className="w-full p-2 border rounded-md bg-background text-foreground"
            required
          >
            <option value="">Selecione a planta...</option>
            {plantas.map((planta) => (
              <option key={planta.id} value={planta.id}>
                {planta.nome}
              </option>
            ))}
          </select>
        ) : (
          // MODO VIEW/EDIT: Input readonly com nome da planta específica
          <input
            type="text"
            value={plantaEspecifica?.nome || value?.local || 'Planta não encontrada'}
            disabled
            className="w-full p-2 border rounded-md bg-muted text-foreground opacity-60 cursor-not-allowed"
          />
        )}
      </div>

      {/* NOVO: SELECT DE UNIDADES */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Unidade <span className="text-red-500">*</span>
        </label>

        {isCreateMode ? (
          <>
            {loadingUnidades && plantaId && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Carregando unidades...</span>
              </div>
            )}
            <select
              value={unidadeId}
              onChange={(e) => handleUnidadeChange(e.target.value)}
              disabled={disabled || !plantaId || loadingUnidades}
              className="w-full p-2 border rounded-md bg-background text-foreground"
              required
            >
              <option value="">
                {!plantaId
                  ? "Primeiro selecione uma planta"
                  : loadingUnidades
                    ? "Carregando unidades..."
                    : "Selecione a unidade..."
                }
              </option>
              {unidades.map((unidade) => (
                <option key={unidade.id} value={unidade.id}>
                  {unidade.nome}
                </option>
              ))}
            </select>
          </>
        ) : (
          // MODO VIEW/EDIT: Input readonly
          <input
            type="text"
            value={value?.unidadeNome || 'Unidade não especificada'}
            disabled
            className="w-full p-2 border rounded-md bg-muted text-foreground opacity-60 cursor-not-allowed"
          />
        )}
      </div>

      {/* SELECT/INPUT DE EQUIPAMENTOS */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Equipamento <span className="text-red-500">*</span>
        </label>
        
        {isCreateMode ? (
          <>
            {loadingEquipamentos && plantaId && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Carregando equipamentos...</span>
              </div>
            )}
            <select
              value={equipamentoId}
              onChange={(e) => handleEquipamentoChange(e.target.value)}
              disabled={disabled || !unidadeId || loadingEquipamentos}
              className="w-full p-2 border rounded-md bg-background text-foreground"
              required
            >
              <option value="">
                {!unidadeId
                  ? "Primeiro selecione uma unidade"
                  : loadingEquipamentos
                    ? "Carregando equipamentos..."
                    : "Selecione o equipamento..."
                }
              </option>
              {equipamentosDisponiveis.map((equipamento) => (
                <option key={equipamento.id} value={equipamento.id}>
                  {equipamento.nome}
                </option>
              ))}
            </select>
          </>
        ) : (
          // MODO VIEW: Input readonly
          <input
            type="text"
            value={value?.ativo || 'Equipamento não especificado'}
            disabled
            className="w-full p-2 border rounded-md bg-muted text-foreground opacity-60 cursor-not-allowed"
          />
        )}
      </div>


    </div>
  );
};