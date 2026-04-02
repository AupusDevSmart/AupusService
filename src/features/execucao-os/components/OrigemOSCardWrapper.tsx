// src/features/execucao-os/components/OrigemOSCardWrapper.tsx
import React, { useState, useEffect } from 'react';
// Reutilizar o mesmo OrigemOSCard da programacao-os
import { OrigemOSCard } from '@/features/programacao-os/components/OrigemOSCard';
import { programacaoOSApi } from '@/services/programacao-os.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, FileText } from 'lucide-react';

interface OrigemOSCardWrapperProps {
  value?: {
    programacao_id?: string;
    programacaoOrigem?: any;
    anomalia?: any;
    plano_manutencao?: any;
    origem?: string;
    dados_origem?: any;
    [key: string]: any;
  };
  programacao_id?: string;
  programacaoOrigem?: any;
  anomalia?: any;
  plano_manutencao?: any;
  origem?: string;
  dados_origem?: any;
  // Passar toda a entity da execução
  formData?: any;
  entity?: any;
}

/**
 * Wrapper que busca a programação de origem e reutiliza o componente OrigemOSCard da programação.
 *
 * Fluxo:
 * 1. Recebe programacao_id da execução
 * 2. Busca programação completa da API
 * 3. Extrai dados de origem (anomalia, tarefas, planos)
 * 4. Passa para o componente OrigemOSCard da programação
 */
export const OrigemOSCardWrapper: React.FC<OrigemOSCardWrapperProps> = (props) => {
  // Aceitar dados via 'value' (quando vem do BaseForm) ou props individuais
  const data = props.value || props;

  // Priorizar dados diretos da execução (entity ou formData)
  const execucaoData = props.entity || props.formData || data;

  // Tentar pegar dados de origem diretamente da execução ANTES de buscar da programação
  const anomaliaFromExecucao = execucaoData?.anomalia;
  const planoManutencaoFromExecucao = execucaoData?.plano_manutencao;
  const origemFromExecucao = execucaoData?.origem;
  const dadosOrigemFromExecucao = execucaoData?.dados_origem;

  const programacaoId = data.programacao_id || data.programacaoOrigem?.id || execucaoData?.programacao_id;

  const [programacao, setProgramacao] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const carregarProgramacao = async () => {
      if (!programacaoId) return;

      setLoading(true);
      setError(null);

      try {
        const programacaoData = await programacaoOSApi.buscarPorId(programacaoId);
        setProgramacao(programacaoData);
      } catch (err) {
        setError('Erro ao carregar dados de origem');
      } finally {
        setLoading(false);
      }
    };

    carregarProgramacao();
  }, [programacaoId]);

  // Loading state
  if (loading) {
    return (
      <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
        <CardHeader className="pb-3 bg-gray-50 dark:bg-gray-800/50">
          <CardTitle className="text-sm flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <Loader2 className="h-4 w-4 animate-spin" />
            Origem da OS
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Carregando informações...
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
        <CardHeader className="pb-3 bg-gray-50 dark:bg-gray-800/50">
          <CardTitle className="text-sm flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <AlertTriangle className="h-4 w-4" />
            Origem da OS
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
        </CardContent>
      </Card>
    );
  }

  // Tentar usar dados diretos da execução primeiro
  const hasDirectOrigemData = anomaliaFromExecucao || planoManutencaoFromExecucao || origemFromExecucao;

  // Se temos dados diretos da execução, usar eles
  if (hasDirectOrigemData) {
    // Determinar origem baseado nos dados disponíveis
    let origem = origemFromExecucao || 'MANUAL';
    if (anomaliaFromExecucao) {
      origem = 'ANOMALIA';
    } else if (planoManutencaoFromExecucao) {
      origem = 'PLANO_MANUTENCAO';
    }

    return (
      <OrigemOSCard
        origem={origem}
        dadosOrigem={dadosOrigemFromExecucao}
        anomalia={anomaliaFromExecucao}
        tarefas={execucaoData?.tarefas_os || []}
        planoManutencao={planoManutencaoFromExecucao}
        tarefasPorPlano={dadosOrigemFromExecucao?.tarefasPorPlano || {}}
        solicitacaoServico={execucaoData?.programacao?.solicitacao_servico}
      />
    );
  }

  // Se não temos dados diretos e nem programação, mostrar vazio
  if (!programacaoId && !programacao) {
    return (
      <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
        <CardHeader className="pb-3 bg-gray-50 dark:bg-gray-800/50">
          <CardTitle className="text-sm flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <FileText className="h-4 w-4" />
            Origem da OS
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
            Ordem criada manualmente
          </p>
        </CardContent>
      </Card>
    );
  }

  // Se ainda está carregando a programação, aguardar
  if (!programacao && programacaoId) {
    return null;
  }

  // Usar dados da programação se disponível
  if (programacao) {
    const origem = programacao.origem || programacao.dados_origem?.tipo || 'MANUAL';
    return (
      <OrigemOSCard
        origem={origem}
        dadosOrigem={programacao.dados_origem}
        anomalia={programacao.anomalia}
        tarefas={programacao.tarefas || []}
        planoManutencao={programacao.plano_manutencao}
        tarefasPorPlano={programacao.dados_origem?.tarefasPorPlano || {}}
        solicitacaoServico={programacao.solicitacao_servico}
      />
    );
  }

  // Fallback - não deveria chegar aqui
  return null;
};
