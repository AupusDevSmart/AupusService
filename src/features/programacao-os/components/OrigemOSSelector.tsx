// src/features/programacao-os/components/OrigemOSSelector.tsx - VERSÃO REFATORADA
import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { useOrigemDados } from '../hooks/useOrigemDados';
import { MultiplePlanosSelector } from './MultiplePlanosSelector';
import { usePlantas } from '@nexon/features/plantas/hooks/usePlantas';
import { useUnidadesByPlanta } from '@nexon/features/unidades/hooks/useUnidades';

// Importar os componentes refatorados
import {
  TipoOrigemSelector,
  PlantaSelector,
  UnidadeSelector,
  AnomaliaSelector,
  SolicitacaoSelector,
  PlanoSelector,
  TarefasSelector,
  HierarchyBreadcrumb,
  type HierarchyBreadcrumbStep,
  type OrigemOSValue,
  type PlantaDisponivel,
  type UnidadeDisponivel,
  type AnomaliaDisponivel,
  type SolicitacaoDisponivel,
  type PlanoDisponivel,
  type TarefaDisponivel
} from './origem-selector';

interface OrigemOSSelectorProps {
  value: OrigemOSValue;
  onChange: (value: OrigemOSValue) => void;
  onLocalAtivoChange?: (local: string, ativo: string) => void;
  disabled?: boolean;
}

export const OrigemOSSelector: React.FC<OrigemOSSelectorProps> = ({
  value,
  onChange,
  onLocalAtivoChange,
  disabled = false
}) => {
  // ✅ DERIVAR VALORES DIRETAMENTE DAS PROPS
  const tipo = value.tipo || 'ANOMALIA';
  const plantaId = value.plantaId?.toString().trim() || '';
  const unidadeId = value.unidadeId?.toString().trim() || '';
  const anomaliaId = value.anomaliaId?.toString().trim() || '';
  const planoId = value.planoId?.toString().trim() || '';
  const solicitacaoServicoId = value.solicitacaoServicoId?.toString().trim() || '';
  const tarefasSelecionadas = value.tarefasSelecionadas || [];

  const {
    anomaliasDisponiveis,
    planosDisponiveis,
    solicitacoesDisponiveis,
    carregarAnomalias,
    carregarPlanos,
    carregarSolicitacoes,
    gerarTarefasDoPlano,
    loading
  } = useOrigemDados();

  // ✅ Hooks para carregar plantas e unidades
  const {
    plantas,
    carregarPlantasSimples,
    loading: loadingPlantas
  } = usePlantas();

  const {
    unidades,
    isLoading: loadingUnidades
  } = useUnidadesByPlanta(plantaId || undefined);

  // ✅ Estado local apenas para UI
  const [tarefasDoPlano, setTarefasDoPlano] = useState<TarefaDisponivel[]>([]);
  const [loadingTarefas, setLoadingTarefas] = useState(false);

  // Carregar plantas ao montar
  useEffect(() => {
    carregarPlantasSimples();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Carregar anomalias quando planta e unidade forem selecionadas
  useEffect(() => {
    if (tipo === 'ANOMALIA' && plantaId && unidadeId) {
      carregarAnomalias(plantaId, unidadeId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo, plantaId, unidadeId]);

  // Carregar solicitações quando planta e unidade forem selecionadas
  useEffect(() => {
    if (tipo === 'SOLICITACAO_SERVICO' && plantaId && unidadeId) {
      carregarSolicitacoes(plantaId, unidadeId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo, plantaId, unidadeId]);

  // Carregar planos quando tipo for PLANO_MANUTENCAO
  useEffect(() => {
    if (tipo === 'PLANO_MANUTENCAO') {
      carregarPlanos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo]);

  // Carregar tarefas quando um plano for selecionado
  useEffect(() => {
    if (tipo === 'PLANO_MANUTENCAO' && planoId) {
      setLoadingTarefas(true);
      gerarTarefasDoPlano(planoId)
        .then((tarefas) => {
          setTarefasDoPlano(tarefas || []);
        })
        .catch((err) => {
          console.error('Erro ao carregar tarefas:', err);
          setTarefasDoPlano([]);
        })
        .finally(() => {
          setLoadingTarefas(false);
        });
    } else {
      setTarefasDoPlano([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planoId, tipo]);

  // ==================== HANDLERS ====================

  const handleTipoChange = (novoTipo: typeof tipo) => {
    onChange({
      tipo: novoTipo,
      plantaId: '',
      unidadeId: '',
      anomaliaId: undefined,
      planoId: undefined,
      solicitacaoServicoId: undefined,
      tarefasSelecionadas: [],
    });
  };

  const handlePlantaChange = (novaPlantaId: string) => {
    onChange({
      ...value,
      plantaId: novaPlantaId,
      unidadeId: '',
      anomaliaId: undefined,
      planoId: undefined,
      solicitacaoServicoId: undefined,
      tarefasSelecionadas: [],
    });
  };

  const handleUnidadeChange = (novaUnidadeId: string) => {
    onChange({
      ...value,
      unidadeId: novaUnidadeId,
      anomaliaId: undefined,
      planoId: undefined,
      solicitacaoServicoId: undefined,
      tarefasSelecionadas: [],
    });
  };

  const handleAnomaliaChange = (novaAnomaliaId: string) => {
    const anomalia = anomaliasDisponiveis.find(a => String(a.id).trim() === novaAnomaliaId);

    onChange({
      ...value,
      anomaliaId: novaAnomaliaId || undefined,
    });

    // Callback para atualizar local e ativo
    if (anomalia && onLocalAtivoChange) {
      onLocalAtivoChange(anomalia.local, anomalia.ativo);
    }
  };

  const handleSolicitacaoChange = (novaSolicitacaoId: string) => {
    const solicitacao = solicitacoesDisponiveis.find(s => String(s.id).trim() === novaSolicitacaoId);

    onChange({
      ...value,
      solicitacaoServicoId: novaSolicitacaoId || undefined,
    });

    // Callback para atualizar local
    if (solicitacao && onLocalAtivoChange) {
      onLocalAtivoChange(solicitacao.local, '');
    }
  };

  const handlePlanoChange = (novoPlanoId: string) => {
    onChange({
      ...value,
      planoId: novoPlanoId || undefined,
      tarefasSelecionadas: [], // Limpar tarefas ao trocar de plano
    });
  };

  const handleTarefaToggle = (tarefaId: string, checked: boolean) => {
    const novasTarefas = checked
      ? [...tarefasSelecionadas, tarefaId]
      : tarefasSelecionadas.filter(id => id !== tarefaId);

    onChange({
      ...value,
      tarefasSelecionadas: novasTarefas,
    });
  };

  const handleSelectAllTarefas = () => {
    onChange({
      ...value,
      tarefasSelecionadas: tarefasDoPlano.map(t => t.id),
    });
  };

  const handleDeselectAllTarefas = () => {
    onChange({
      ...value,
      tarefasSelecionadas: [],
    });
  };

  // ==================== DADOS MAPEADOS ====================

  const plantasDisponiveis: PlantaDisponivel[] = plantas.map(p => ({
    id: p.id,
    nome: p.nome,
    localizacao: p.localizacao
  }));

  const unidadesDisponiveis: UnidadeDisponivel[] = unidades.map(u => ({
    id: u.id,
    nome: u.nome,
    tipo: u.tipo,
    planta_id: u.planta_id
  }));

  // ==================== BREADCRUMB STEPS ====================

  const getBreadcrumbSteps = (): HierarchyBreadcrumbStep[] => {
    if (tipo === 'ANOMALIA' || tipo === 'SOLICITACAO_SERVICO') {
      return [
        {
          stepNumber: 1,
          label: 'Planta',
          isActive: !plantaId,
          isCompleted: !!plantaId
        },
        {
          stepNumber: 2,
          label: 'Unidade',
          isActive: !!plantaId && !unidadeId,
          isCompleted: !!unidadeId
        },
        {
          stepNumber: 3,
          label: tipo === 'ANOMALIA' ? 'Anomalia' : 'Solicitação',
          isActive: !!plantaId && !!unidadeId && (tipo === 'ANOMALIA' ? !anomaliaId : !solicitacaoServicoId),
          isCompleted: tipo === 'ANOMALIA' ? !!anomaliaId : !!solicitacaoServicoId
        }
      ];
    }
    return [];
  };

  // ==================== RENDER ====================

  return (
    <div className="space-y-6">
      {/* Seletor de Tipo */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground">Tipo de Origem</Label>
        <TipoOrigemSelector
          value={tipo}
          onChange={handleTipoChange}
          disabled={disabled}
        />
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* ANOMALIA Flow */}
      {tipo === 'ANOMALIA' && (
        <div className="space-y-6">
          {/* Breadcrumb */}
          <HierarchyBreadcrumb steps={getBreadcrumbSteps()} />

          {/* Planta */}
          <PlantaSelector
            plantas={plantasDisponiveis}
            value={plantaId}
            onChange={handlePlantaChange}
            loading={loadingPlantas}
            disabled={disabled}
          />

          {/* Unidade */}
          {plantaId && (
            <UnidadeSelector
              unidades={unidadesDisponiveis}
              value={unidadeId}
              onChange={handleUnidadeChange}
              loading={loadingUnidades}
              disabled={disabled}
            />
          )}

          {/* Anomalia */}
          {plantaId && unidadeId && (
            <AnomaliaSelector
              anomalias={anomaliasDisponiveis}
              value={anomaliaId}
              onChange={handleAnomaliaChange}
              plantaId={plantaId}
              unidadeId={unidadeId}
              disabled={disabled}
            />
          )}
        </div>
      )}

      {/* SOLICITACAO_SERVICO Flow */}
      {tipo === 'SOLICITACAO_SERVICO' && (
        <div className="space-y-6">
          {/* Breadcrumb */}
          <HierarchyBreadcrumb steps={getBreadcrumbSteps()} />

          {/* Planta */}
          <PlantaSelector
            plantas={plantasDisponiveis}
            value={plantaId}
            onChange={handlePlantaChange}
            loading={loadingPlantas}
            disabled={disabled}
          />

          {/* Unidade */}
          {plantaId && (
            <UnidadeSelector
              unidades={unidadesDisponiveis}
              value={unidadeId}
              onChange={handleUnidadeChange}
              loading={loadingUnidades}
              disabled={disabled}
            />
          )}

          {/* Solicitação */}
          {plantaId && unidadeId && (
            <SolicitacaoSelector
              solicitacoes={solicitacoesDisponiveis}
              value={solicitacaoServicoId}
              onChange={handleSolicitacaoChange}
              plantaId={plantaId}
              unidadeId={unidadeId}
              disabled={disabled}
            />
          )}
        </div>
      )}

      {/* PLANO_MANUTENCAO Flow */}
      {tipo === 'PLANO_MANUTENCAO' && (
        <div className="space-y-6">
          {/* Plano */}
          <PlanoSelector
            planos={planosDisponiveis}
            value={planoId}
            onChange={handlePlanoChange}
            disabled={disabled}
          />

          {/* Tarefas */}
          {planoId && (
            <TarefasSelector
              tarefas={tarefasDoPlano}
              selectedIds={tarefasSelecionadas}
              onToggle={handleTarefaToggle}
              onSelectAll={handleSelectAllTarefas}
              onDeselectAll={handleDeselectAllTarefas}
              loading={loadingTarefas}
              disabled={disabled}
            />
          )}
        </div>
      )}

    </div>
  );
};
