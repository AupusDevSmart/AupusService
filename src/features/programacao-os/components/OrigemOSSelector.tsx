// src/features/programacao-os/components/OrigemOSSelector.tsx
import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { useOrigemDados } from '../hooks/useOrigemDados';
import { MultiplePlanosSelector } from './MultiplePlanosSelector';

import {
  TipoOrigemSelector,
  AnomaliaSelector,
  SolicitacaoSelector,
  PlanoSelector,
  TarefasSelector,
  type OrigemOSValue,
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
  const tipo = value.tipo || 'ANOMALIA';
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

  const [tarefasDoPlano, setTarefasDoPlano] = useState<TarefaDisponivel[]>([]);
  const [loadingTarefas, setLoadingTarefas] = useState(false);

  // Carregar anomalias quando tipo for ANOMALIA
  useEffect(() => {
    if (tipo === 'ANOMALIA') {
      carregarAnomalias();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo]);

  // Carregar solicitações quando tipo for SOLICITACAO_SERVICO
  useEffect(() => {
    if (tipo === 'SOLICITACAO_SERVICO') {
      carregarSolicitacoes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo]);

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
        .catch(() => {
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

  const handleAnomaliaChange = (novaAnomaliaId: string) => {
    const anomalia = anomaliasDisponiveis.find(a => String(a.id).trim() === novaAnomaliaId);

    onChange({
      ...value,
      anomaliaId: novaAnomaliaId || undefined,
      // Auto-preencher planta e unidade da anomalia selecionada
      plantaId: anomalia?.plantaId || '',
      unidadeId: anomalia?.unidadeId || '',
    });

    if (anomalia && onLocalAtivoChange) {
      onLocalAtivoChange(anomalia.local, anomalia.ativo);
    }
  };

  const handleSolicitacaoChange = (novaSolicitacaoId: string) => {
    const solicitacao = solicitacoesDisponiveis.find(s => String(s.id).trim() === novaSolicitacaoId);

    onChange({
      ...value,
      solicitacaoServicoId: novaSolicitacaoId || undefined,
      // Auto-preencher planta e unidade da solicitação selecionada
      plantaId: solicitacao?.plantaId || '',
      unidadeId: solicitacao?.unidadeId || '',
    });

    if (solicitacao && onLocalAtivoChange) {
      onLocalAtivoChange(solicitacao.local, '');
    }
  };

  const handlePlanoChange = (novoPlanoId: string) => {
    onChange({
      ...value,
      planoId: novoPlanoId || undefined,
      tarefasSelecionadas: [],
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

      {/* ANOMALIA Flow - pesquisa direta */}
      {tipo === 'ANOMALIA' && (
        <AnomaliaSelector
          anomalias={anomaliasDisponiveis}
          value={anomaliaId}
          onChange={handleAnomaliaChange}
          loading={loading}
          disabled={disabled}
        />
      )}

      {/* SOLICITACAO_SERVICO Flow - pesquisa direta */}
      {tipo === 'SOLICITACAO_SERVICO' && (
        <SolicitacaoSelector
          solicitacoes={solicitacoesDisponiveis}
          value={solicitacaoServicoId}
          onChange={handleSolicitacaoChange}
          loading={loading}
          disabled={disabled}
        />
      )}

      {/* PLANO_MANUTENCAO Flow */}
      {tipo === 'PLANO_MANUTENCAO' && (
        <div className="space-y-6">
          <PlanoSelector
            planos={planosDisponiveis}
            value={planoId}
            onChange={handlePlanoChange}
            disabled={disabled}
          />

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
