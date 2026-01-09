// src/features/anomalias/components/LocalizacaoController.tsx - VERSÃO FINAL LIMPA
import { useEquipamentos } from '@nexon/features/equipamentos/hooks/useEquipamentos';
import { PlantaResponse, PlantasService } from '@/services/plantas.services';
import { getUnidadesByPlanta } from '@/services/unidades.services';
import { Loader2 } from 'lucide-react';
import React from 'react';

interface LocalizacaoValue {
  plantaId?: string | number; // Pode ser CUID (string) ou número
  unidadeId?: string | number; // NOVO: Unidade do equipamento
  equipamentoId?: string | number; // Pode ser CUID (string) ou número
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
  const [unidadeEspecifica, setUnidadeEspecifica] = React.useState<any | null>(null); // NOVO: Unidade específica para VIEW/EDIT
  const [loadingPlantas, setLoadingPlantas] = React.useState(false);
  const [loadingPlantaEspecifica, setLoadingPlantaEspecifica] = React.useState(false);
  const [loadingUnidades, setLoadingUnidades] = React.useState(false); // NOVO: Loading state para unidades
  const [hasLoaded, setHasLoaded] = React.useState(false);

  const { equipamentos, fetchEquipamentos, fetchEquipamentosByPlanta, loading: loadingEquipamentos } = useEquipamentos();

  const isCreateMode = mode === 'create';
  const isViewMode = mode === 'view';

  // ✅ USAR VALUE DIRETAMENTE - Sem estados internos que conflitam
  const plantaId = value?.plantaId?.toString().trim() || '';
  const unidadeId = value?.unidadeId?.toString().trim() || '';
  const equipamentoId = value?.equipamentoId?.toString().trim() || '';



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
        // MODO VIEW/EDIT: Apenas criar mock e buscar unidade se tiver ID
        setLoadingPlantaEspecifica(true);

        // Sempre criar mock da planta com o nome que já temos
        setPlantaEspecifica({
          id: '',
          nome: value.local || 'Planta não especificada',
          cnpj: '',
          localizacao: '',
          horarioFuncionamento: '',
          proprietarioId: '',
          endereco: { logradouro: '', bairro: '', cidade: '', uf: '', cep: '' },
          criadoEm: '',
          atualizadoEm: ''
        });

        // Se tiver unidadeId, buscar em todas as plantas até encontrar
        if (value?.unidadeId) {
          const loadUnidade = async () => {
            try {
              const response = await PlantasService.getAllPlantas({ limit: 100 });
              const todasPlantas = response.data;

              for (const planta of todasPlantas) {
                try {
                  const unidadesData = await getUnidadesByPlanta(planta.id.toString());
                  const unidadeEncontrada = unidadesData?.find(
                    (u: any) => u.id?.toString().trim() === value.unidadeId.toString().trim()
                  );

                  if (unidadeEncontrada) {
                    setUnidadeEspecifica(unidadeEncontrada);
                    break;
                  }
                } catch (error) {
                  // Planta sem acesso, continuar
                }
              }
            } catch (error) {
              console.error('❌ [LocalizacaoController] Erro ao buscar unidade:', error);
            }
          };

          loadUnidade();
        }

        setLoadingPlantaEspecifica(false);
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
        const response = await getUnidadesByPlanta(plantaId);
        setUnidades(response || []);
      } catch (error) {
        console.error('Erro ao carregar unidades:', error);
        setUnidades([]);
      } finally {
        setLoadingUnidades(false);
      }
    };

    loadUnidades();
  }, [plantaId, isCreateMode]);

  // NOVO: Carregar unidade específica quando tiver unidadeId no modo VIEW/EDIT
  React.useEffect(() => {
    const loadUnidadeEspecifica = async () => {
      if (isCreateMode || !value?.unidadeId) {
        return;
      }

      try {
        const response = await PlantasService.getAllPlantas({ limit: 100 });
        const todasPlantas = response.data;

        for (const planta of todasPlantas) {
          try {
            const unidadesData = await getUnidadesByPlanta(planta.id.toString());
            const unidadeEncontrada = unidadesData?.find(
              (u: any) => u.id?.toString().trim() === value.unidadeId.toString().trim()
            );

            if (unidadeEncontrada) {
              setUnidadeEspecifica(unidadeEncontrada);
              return;
            }
          } catch (error) {
            // Planta sem acesso, continuar
          }
        }
      } catch (error) {
        console.error('❌ [LocalizacaoController] Erro ao buscar unidade:', error);
      }
    };

    loadUnidadeEspecifica();
  }, [value?.unidadeId, isCreateMode]);

  // Handlers
  const handlePlantaChange = async (newPlantaId: string) => {
    if (!isCreateMode) return;

    const plantaIdTrimmed = newPlantaId.trim();
    const plantaSelecionada = plantas.find(p => p.id.toString().trim() === plantaIdTrimmed);

    const novoValue: LocalizacaoValue = {
      plantaId: plantaIdTrimmed || undefined,
      unidadeId: undefined, // Resetar quando planta muda
      equipamentoId: undefined, // Resetar quando planta muda
      local: plantaSelecionada?.nome || '',
      ativo: ''
    };

    onChange(novoValue);
  };

  // Handler para mudança de unidade
  const handleUnidadeChange = async (newUnidadeId: string) => {
    if (!isCreateMode) return;

    const unidadeIdTrimmed = newUnidadeId.trim();
    const plantaSelecionada = plantas.find(p => p.id.toString().trim() === plantaId.trim());

    const novoValue: LocalizacaoValue = {
      plantaId: plantaId || undefined,
      unidadeId: unidadeIdTrimmed || undefined,
      equipamentoId: undefined, // Resetar quando unidade muda
      local: plantaSelecionada?.nome || '',
      ativo: ''
    };

    onChange(novoValue);

    // Carregar equipamentos da unidade
    if (unidadeIdTrimmed) {
      try {
        await fetchEquipamentos({
          proprietarioId: 'all',
          plantaId: plantaId,
          unidadeId: unidadeIdTrimmed,
          classificacao: 'UC',
          criticidade: 'all',
          limit: 100
        });
      } catch (error) {
        console.error('❌ [LocalizacaoController] Erro ao carregar equipamentos da unidade:', error);
      }
    }
  };

  const handleEquipamentoChange = (newEquipamentoId: string) => {
    if (isViewMode) return;

    const equipamentoSelecionado = equipamentos.find(
      eq => eq.id.toString().trim() === newEquipamentoId.trim()
    );
    const plantaSelecionada = plantas.find(p => p.id.toString().trim() === plantaId.trim());

    const novoValue: LocalizacaoValue = {
      plantaId: plantaId || undefined,
      unidadeId: unidadeId || undefined,
      equipamentoId: newEquipamentoId.trim() || undefined,
      local: plantaSelecionada?.nome || '',
      ativo: equipamentoSelecionado?.nome || ''
    };

    onChange(novoValue);
  };

  // Equipamentos disponíveis - filtrar por unidade ao invés de planta
  const equipamentosDisponiveis = React.useMemo(() => {
    return equipamentos.filter(eq => {
      const eqUnidadeId = (eq.unidadeId || eq.unidade_id || eq.unidade?.id)?.toString().trim();
      const matchClassificacao = eq.classificacao === 'UC';
      const matchUnidade = unidadeId ? eqUnidadeId === unidadeId.trim() : eq.unidade?.plantaId?.toString().trim() === plantaId.trim();
      return matchClassificacao && matchUnidade;
    });
  }, [equipamentos, unidadeId, plantaId]);

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
            value={unidadeEspecifica?.nome || 'Unidade não especificada'}
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
                <option key={equipamento.id} value={equipamento.id.toString().trim()}>
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