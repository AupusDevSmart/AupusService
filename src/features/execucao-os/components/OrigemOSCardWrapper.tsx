// src/features/execucao-os/components/OrigemOSCardWrapper.tsx
import React, { useState, useEffect } from 'react';
import { OrigemOSCard as ProgramacaoOrigemCard } from '@/features/programacao-os/components/OrigemOSCard';
import { programacaoOSApi } from '@/services/programacao-os.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle } from 'lucide-react';

interface OrigemOSCardWrapperProps {
  value?: {
    programacao_id?: string;
    programacaoOrigem?: any;
    [key: string]: any;
  };
  programacao_id?: string;
  programacaoOrigem?: any;
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
  const programacaoId = data.programacao_id || data.programacaoOrigem?.id;

  const [programacao, setProgramacao] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const carregarProgramacao = async () => {
      if (!programacaoId) {
        console.log('⚠️ [OrigemOSCardWrapper] Nenhum programacao_id fornecido');
        return;
      }

      console.log('🔍 [OrigemOSCardWrapper] Buscando programação:', programacaoId);
      setLoading(true);
      setError(null);

      try {
        const programacaoData = await programacaoOSApi.buscarPorId(programacaoId);
        console.log('✅ [OrigemOSCardWrapper] Programação carregada:', programacaoData);
        setProgramacao(programacaoData);
      } catch (err) {
        console.error('❌ [OrigemOSCardWrapper] Erro ao buscar programação:', err);
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
      <Card className="border-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
            Carregando origem da OS...
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-sm text-muted-foreground">
            Buscando informações da programação...
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="border-2 border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-red-700 dark:text-red-400">
            <AlertTriangle className="h-4 w-4" />
            Erro ao Carregar Origem
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </CardContent>
      </Card>
    );
  }

  // No programacao_id provided
  if (!programacaoId) {
    return (
      <Card className="border-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Origem da OS</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nenhuma programação de origem vinculada
          </p>
        </CardContent>
      </Card>
    );
  }

  // No programacao loaded yet
  if (!programacao) {
    return null;
  }

  // Extract origem data from programacao
  const origem = programacao.origem || programacao.dados_origem?.tipo || 'MANUAL';
  const dadosOrigem = programacao.dados_origem || {};

  console.log('🔍 [OrigemOSCardWrapper] Renderizando com dados:', {
    origem,
    dadosOrigem,
    anomalia: programacao.anomalia,
    tarefas: programacao.tarefas,
    planoManutencao: programacao.plano_manutencao,
    tarefasPorPlano: dadosOrigem.tarefasPorPlano
  });

  // Use the programacao's OrigemOSCard component
  return (
    <ProgramacaoOrigemCard
      origem={origem}
      dadosOrigem={dadosOrigem}
      anomalia={programacao.anomalia}
      tarefas={programacao.tarefas || []}
      planoManutencao={programacao.plano_manutencao}
      tarefasPorPlano={dadosOrigem.tarefasPorPlano}
      planosSelecionados={dadosOrigem.planosSelecionados}
    />
  );
};
