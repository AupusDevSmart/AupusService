// src/features/programacao-os/hooks/useProgramacaoOS.ts
import { useState, useCallback } from 'react';
import { OrdemServico, OrdemServicoFormData, ProgramacaoOSFormData } from '../types';
// import { ExecucaoOS } from '@/features/execucao-os/types';
import { mockOrdensServico } from '../data/mock-data';

interface IniciarExecucaoData {
  equipePresente: string[];
  responsavelExecucao: string;
  observacoesInicio?: string;
}

interface UseProgramacaoOSReturn {
  // Estados
  loading: boolean;
  
  // Operações CRUD
  criarOS: (dados: OrdemServicoFormData) => Promise<OrdemServico>;
  editarOS: (id: string, dados: Partial<OrdemServicoFormData>) => Promise<OrdemServico>;
  obterOS: (id: string) => Promise<OrdemServico | null>;
  excluirOS: (id: string) => Promise<boolean>;
  
  // Operações específicas de OS
  planejarOS: (osId: string, dados?: any) => Promise<{ success: boolean }>;
  programarOS: (osId: string, dados: ProgramacaoOSFormData) => Promise<{ success: boolean }>;
  iniciarExecucao: (osId: string, dados?: IniciarExecucaoData) => Promise<{ success: boolean; execucaoId: string; message: string }>;
  finalizarOS: (osId: string, observacoes: string) => Promise<{ success: boolean }>;
  cancelarOS: (osId: string, motivo: string) => Promise<{ success: boolean }>;
  
  // Gerenciamento de recursos
  confirmarMaterial: (osId: string, materialId: string) => Promise<{ success: boolean }>;
  confirmarFerramenta: (osId: string, ferramentaId: string) => Promise<{ success: boolean }>;
  confirmarTecnico: (osId: string, tecnicoId: string) => Promise<{ success: boolean }>;
  
  // Operações em lote
  programarLote: (osIds: string[], dados: ProgramacaoOSFormData) => Promise<{ success: boolean }>;
  cancelarLote: (osIds: string[], motivo: string) => Promise<{ success: boolean }>;
  
  // Relatórios e exportação
  exportarOS: (filtros?: any) => Promise<Blob>;
  gerarRelatorioRecursos: (osIds: string[]) => Promise<Blob>;
  calcularCustoTotal: (osIds: string[]) => Promise<{ custoTotal: number; custoMedio: number; breakdown: any }>;
  
  // Integração com outras features
  criarOSDeAnomalia: (anomaliaId: string, dados?: any) => Promise<{ success: boolean; numeroOS: string }>;
  criarOSDeTarefa: (tarefaId: string, dados?: any) => Promise<{ success: boolean; numeroOS: string }>;
}

export const useProgramacaoOS = (): UseProgramacaoOSReturn => {
  const [loading, setLoading] = useState(false);

  // Simular delay de API
  const simulateDelay = (ms: number = 1000) => 
    new Promise(resolve => setTimeout(resolve, ms));

  // Gerar ID único
  const generateId = () => String(Date.now() + Math.random());
  const generateNumeroOS = () => {
    const ano = new Date().getFullYear();
    const numero = String(Date.now()).slice(-3);
    return `OS-${ano}-${numero}`;
  };

  // ✅ CRIAR NOVA OS
  const criarOS = useCallback(async (dados: OrdemServicoFormData): Promise<OrdemServico> => {
    setLoading(true);
    try {
      console.log('📝 Criando nova OS:', dados);
      await simulateDelay(1500);
      
      const novaOS: OrdemServico = {
        id: Date.now(),
        numeroOS: generateNumeroOS(),
        ...dados,
        status: 'PENDENTE',
        materiais: (dados.materiais || []).map((m: any) => ({ ...m, id: m.id || String(Date.now()) })),
        ferramentas: (dados.ferramentas || []).map((f: any) => ({ ...f, id: f.id || String(Date.now()) })),
        tecnicos: (dados.tecnicos || []).map((t: any) => ({ ...t, id: t.id || String(Date.now()) })),
        criadoEm: new Date().toISOString(),
        criadoPor: 'Usuário Atual',
        historico: [{
          id: generateId(),
          acao: 'OS criada',
          usuario: 'Usuário Atual',
          data: new Date().toISOString()
        }]
      };
      
      mockOrdensServico.unshift(novaOS);
      console.log('✅ OS criada:', novaOS.numeroOS);
      return novaOS;
    } catch (error) {
      console.error('❌ Erro ao criar OS:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ EDITAR OS EXISTENTE
  const editarOS = useCallback(async (id: string, dados: Partial<OrdemServicoFormData>): Promise<OrdemServico> => {
    setLoading(true);
    try {
      console.log('✏️ Editando OS:', id, dados);
      await simulateDelay(1200);
      
      const index = mockOrdensServico.findIndex(os => os.id === parseInt(String(id)));
      if (index === -1) {
        throw new Error('OS não encontrada');
      }
      
      const osAtualizada = {
        ...mockOrdensServico[index],
        ...dados,
        atualizadoEm: new Date().toISOString(),
        historico: [
          ...(mockOrdensServico[index].historico || []),
          {
            id: generateId(),
            acao: 'OS editada',
            usuario: 'Usuário Atual',
            data: new Date().toISOString()
          }
        ]
      };
      
      mockOrdensServico[index] = osAtualizada as any;
      console.log('✅ OS editada com sucesso');
      return osAtualizada as any;
    } catch (error) {
      console.error('❌ Erro ao editar OS:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ OBTER OS POR ID
  const obterOS = useCallback(async (id: string): Promise<OrdemServico | null> => {
    setLoading(true);
    try {
      console.log('🔍 Buscando OS:', id);
      await simulateDelay(500);
      
      const os = mockOrdensServico.find(os => os.id === parseInt(String(id)));
      console.log(os ? '✅ OS encontrada' : '❌ OS não encontrada');
      return os || null;
    } catch (error) {
      console.error('❌ Erro ao buscar OS:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ EXCLUIR OS
  const excluirOS = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    try {
      console.log('🗑️ Excluindo OS:', id);
      await simulateDelay(1000);
      
      const index = mockOrdensServico.findIndex(os => os.id === parseInt(String(id)));
      if (index === -1) {
        console.log('❌ OS não encontrada para exclusão');
        return false;
      }
      
      mockOrdensServico.splice(index, 1);
      console.log('✅ OS excluída com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao excluir OS:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ PLANEJAR OS
  const planejarOS = useCallback(async (osId: string, dados: any = {}): Promise<{ success: boolean }> => {
    setLoading(true);
    try {
      console.log('🔧 Planejando OS:', osId, dados);
      await simulateDelay(1500);
      
      const index = mockOrdensServico.findIndex(os => os.id === parseInt(String(osId)));
      if (index === -1) {
        throw new Error('OS não encontrada');
      }
      
      const osAtualizada = {
        ...mockOrdensServico[index],
        ...dados,
        status: 'PLANEJADA' as const,
        atualizadoEm: new Date().toISOString(),
        historico: [
          ...(mockOrdensServico[index].historico || []),
          {
            id: generateId(),
            acao: 'OS planejada',
            usuario: 'Usuário Atual',
            data: new Date().toISOString(),
            observacoes: 'Recursos e materiais definidos'
          }
        ]
      };
      
      mockOrdensServico[index] = osAtualizada as any;
      console.log('✅ OS planejada com sucesso');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao planejar OS:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ PROGRAMAR OS
  const programarOS = useCallback(async (osId: string, dados: ProgramacaoOSFormData): Promise<{ success: boolean }> => {
    setLoading(true);
    try {
      console.log('📅 Programando OS:', osId, dados);
      await simulateDelay(1800);
      
      const index = mockOrdensServico.findIndex(os => os.id === parseInt(String(osId)));
      if (index === -1) {
        throw new Error('OS não encontrada');
      }
      
      // Simular criação de reserva de viatura se especificada
      let reservaInfo = '';
      if (dados.viatura) {
        console.log('🚗 Criando reserva de viatura...');
        await simulateDelay(500);
        reservaInfo = ` • Viatura VTR-${String(dados.viatura).padStart(3, '0')}`;
      }
      
      const osAtualizada = {
        ...mockOrdensServico[index],
        ...dados,
        status: 'PROGRAMADA' as const,
        programadoPor: 'Usuário Atual',
        atualizadoEm: new Date().toISOString(),
        historico: [
          ...(mockOrdensServico[index].historico || []),
          {
            id: generateId(),
            acao: 'OS programada para execução',
            usuario: 'Usuário Atual',
            data: new Date().toISOString(),
            observacoes: `Data: ${dados.dataProgramada} às ${dados.horaProgramada}${reservaInfo}`
          }
        ]
      };
      
      mockOrdensServico[index] = osAtualizada as any;
      console.log('✅ OS programada com sucesso');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao programar OS:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ INICIAR EXECUÇÃO (transforma programação em execução)
  const iniciarExecucao = useCallback(async (osId: string, dados?: IniciarExecucaoData): Promise<{ success: boolean; execucaoId: string; message: string }> => {
    setLoading(true);
    try {
      console.log('🚀 Iniciando execução da OS:', osId, dados);
      await simulateDelay(2000);
      
      const index = mockOrdensServico.findIndex(os => os.id === parseInt(String(osId)));
      if (index === -1) {
        throw new Error('OS não encontrada');
      }
      
      // Atualizar OS para EM_EXECUCAO
      const osAtualizada = {
        ...mockOrdensServico[index],
        status: 'EM_EXECUCAO' as const,
        dataInicioExecucao: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
        historico: [
          ...(mockOrdensServico[index].historico || []),
          {
            id: generateId(),
            acao: 'Execução iniciada',
            usuario: dados?.responsavelExecucao || 'Usuário Atual',
            data: new Date().toISOString(),
            observacoes: [
              dados?.observacoesInicio,
              dados?.equipePresente?.length ? `Equipe: ${dados.equipePresente.join(', ')}` : null
            ].filter(Boolean).join(' • ')
          }
        ]
      };
      
      mockOrdensServico[index] = osAtualizada as any;
      
      // Aqui seria criado o registro na tabela de execuções
      const execucaoId = `exec_${Date.now()}`;
      
      console.log('✅ Execução iniciada com sucesso:', execucaoId);
      console.log('📋 Checklist inicial criado com 4 atividades');
      
      return { 
        success: true, 
        execucaoId,
        message: 'Execução iniciada com sucesso!' 
      };
      
    } catch (error) {
      console.error('❌ Erro ao iniciar execução:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ FINALIZAR OS
  const finalizarOS = useCallback(async (osId: string, observacoes: string): Promise<{ success: boolean }> => {
    setLoading(true);
    try {
      console.log('🏁 Finalizando OS:', osId, observacoes);
      await simulateDelay(1500);
      
      const index = mockOrdensServico.findIndex(os => os.id === parseInt(String(osId)));
      if (index === -1) {
        throw new Error('OS não encontrada');
      }
      
      const osAtualizada = {
        ...mockOrdensServico[index],
        status: 'FINALIZADA' as const,
        dataFimExecucao: new Date().toISOString(),
        observacoesExecucao: observacoes,
        finalizadoPor: 'Usuário Atual',
        atualizadoEm: new Date().toISOString(),
        historico: [
          ...(mockOrdensServico[index].historico || []),
          {
            id: generateId(),
            acao: 'OS finalizada',
            usuario: 'Usuário Atual',
            data: new Date().toISOString(),
            observacoes
          }
        ]
      };
      
      mockOrdensServico[index] = osAtualizada as any;
      console.log('✅ OS finalizada com sucesso');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao finalizar OS:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ CANCELAR OS
  const cancelarOS = useCallback(async (osId: string, motivo: string): Promise<{ success: boolean }> => {
    setLoading(true);
    try {
      console.log('❌ Cancelando OS:', osId, motivo);
      await simulateDelay(1000);
      
      const index = mockOrdensServico.findIndex(os => os.id === parseInt(String(osId)));
      if (index === -1) {
        throw new Error('OS não encontrada');
      }
      
      const osAtualizada = {
        ...mockOrdensServico[index],
        status: 'CANCELADA' as const,
        motivoCancelamento: motivo,
        canceladoPor: 'Usuário Atual',
        atualizadoEm: new Date().toISOString(),
        historico: [
          ...(mockOrdensServico[index].historico || []),
          {
            id: generateId(),
            acao: 'OS cancelada',
            usuario: 'Usuário Atual',
            data: new Date().toISOString(),
            observacoes: motivo
          }
        ]
      };
      
      mockOrdensServico[index] = osAtualizada as any;
      console.log('✅ OS cancelada com sucesso');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao cancelar OS:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ GERENCIAMENTO DE RECURSOS
  const confirmarMaterial = useCallback(async (osId: string, materialId: string): Promise<{ success: boolean }> => {
    setLoading(true);
    try {
      console.log('📦 Confirmando material:', osId, materialId);
      await simulateDelay(800);
      
      const index = mockOrdensServico.findIndex(os => os.id === parseInt(String(osId)));
      if (index === -1) {
        throw new Error('OS não encontrada');
      }
      
      // Atualizar material na OS
      const osAtualizada = {
        ...mockOrdensServico[index],
        materiais: mockOrdensServico[index].materiais.map(mat => 
          mat.id === materialId ? { ...mat, confirmado: true } : mat
        ),
        atualizadoEm: new Date().toISOString()
      };
      
      mockOrdensServico[index] = osAtualizada as any;
      console.log('✅ Material confirmado');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao confirmar material:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const confirmarFerramenta = useCallback(async (osId: string, ferramentaId: string): Promise<{ success: boolean }> => {
    setLoading(true);
    try {
      console.log('🔧 Confirmando ferramenta:', osId, ferramentaId);
      await simulateDelay(800);
      
      const index = mockOrdensServico.findIndex(os => os.id === parseInt(String(osId)));
      if (index === -1) {
        throw new Error('OS não encontrada');
      }
      
      // Atualizar ferramenta na OS
      const osAtualizada = {
        ...mockOrdensServico[index],
        ferramentas: mockOrdensServico[index].ferramentas.map(ferr => 
          ferr.id === ferramentaId ? { ...ferr, confirmada: true } : ferr
        ),
        atualizadoEm: new Date().toISOString()
      };
      
      mockOrdensServico[index] = osAtualizada as any;
      console.log('✅ Ferramenta confirmada');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao confirmar ferramenta:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const confirmarTecnico = useCallback(async (osId: string, tecnicoId: string): Promise<{ success: boolean }> => {
    setLoading(true);
    try {
      console.log('👤 Confirmando técnico:', osId, tecnicoId);
      await simulateDelay(800);
      
      const index = mockOrdensServico.findIndex(os => os.id === parseInt(String(osId)));
      if (index === -1) {
        throw new Error('OS não encontrada');
      }
      
      // Atualizar técnico na OS
      const osAtualizada = {
        ...mockOrdensServico[index],
        tecnicos: mockOrdensServico[index].tecnicos.map(tec => 
          tec.id === tecnicoId ? { ...tec, disponivel: true } : tec
        ),
        atualizadoEm: new Date().toISOString()
      };
      
      mockOrdensServico[index] = osAtualizada as any;
      console.log('✅ Técnico confirmado');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao confirmar técnico:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ OPERAÇÕES EM LOTE
  const programarLote = useCallback(async (osIds: string[], dados: ProgramacaoOSFormData): Promise<{ success: boolean }> => {
    setLoading(true);
    try {
      console.log('📅 Programando lote de OS:', osIds.length, 'ordens');
      await simulateDelay(2500);
      
      let sucessos = 0;
      for (const osId of osIds) {
        try {
          await programarOS(osId, dados);
          sucessos++;
        } catch (error) {
          console.error(`Erro ao programar OS ${osId}:`, error);
        }
      }
      
      console.log(`✅ Lote programado: ${sucessos}/${osIds.length} ordens`);
      return { success: sucessos > 0 };
    } catch (error) {
      console.error('❌ Erro ao programar lote:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelarLote = useCallback(async (osIds: string[], motivo: string): Promise<{ success: boolean }> => {
    setLoading(true);
    try {
      console.log('❌ Cancelando lote de OS:', osIds.length, 'ordens');
      await simulateDelay(2000);
      
      let sucessos = 0;
      for (const osId of osIds) {
        try {
          await cancelarOS(osId, motivo);
          sucessos++;
        } catch (error) {
          console.error(`Erro ao cancelar OS ${osId}:`, error);
        }
      }
      
      console.log(`✅ Lote cancelado: ${sucessos}/${osIds.length} ordens`);
      return { success: sucessos > 0 };
    } catch (error) {
      console.error('❌ Erro ao cancelar lote:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ RELATÓRIOS E EXPORTAÇÃO
  const exportarOS = useCallback(async (filtros: any = {}): Promise<Blob> => {
    setLoading(true);
    try {
      console.log('📄 Exportando OS com filtros:', filtros);
      await simulateDelay(2000);
      
      // Filtrar OS baseado nos filtros
      let osFiltradas = mockOrdensServico;
      
      if (filtros.status && filtros.status !== 'all') {
        osFiltradas = osFiltradas.filter(os => os.status === filtros.status);
      }
      
      if (filtros.tipo && filtros.tipo !== 'all') {
        osFiltradas = osFiltradas.filter(os => os.tipo === filtros.tipo);
      }
      
      // Gerar CSV
      const header = 'Número OS,Descrição,Local,Ativo,Status,Tipo,Prioridade,Data Programada,Responsável\n';
      const csvContent = osFiltradas.map(os => 
        `"${os.numeroOS}","${os.descricao}","${os.local}","${os.ativo}","${os.status}","${os.tipo}","${os.prioridade}","${os.dataProgramada || 'N/A'}","${os.responsavel || 'N/A'}"`
      ).join('\n');
      
      const blob = new Blob([header + csvContent], { type: 'text/csv;charset=utf-8;' });
      console.log(`✅ Exportação concluída: ${osFiltradas.length} ordens`);
      
      return blob;
    } catch (error) {
      console.error('❌ Erro ao exportar:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const gerarRelatorioRecursos = useCallback(async (osIds: string[]): Promise<Blob> => {
    setLoading(true);
    try {
      console.log('📊 Gerando relatório de recursos para:', osIds.length, 'OS');
      await simulateDelay(2500);
      
      const ossSelecionadas = mockOrdensServico.filter(os => osIds.includes(String(os.id)));
      
      let relatorio = `RELATÓRIO DE RECURSOS NECESSÁRIOS
=============================================

Ordens de Serviço: ${ossSelecionadas.length}
Data: ${new Date().toLocaleDateString('pt-BR')}
Gerado por: Usuário Atual

RESUMO DAS OS:
${ossSelecionadas.map(os => `- ${os.numeroOS}: ${os.descricao}`).join('\n')}

OBSERVAÇÕES:
- Verifique disponibilidade dos recursos antes da execução
- Confirme a presença da equipe técnica
- Validar estado dos equipamentos e ferramentas
`;
      
      const blob = new Blob([relatorio], { type: 'text/plain;charset=utf-8;' });
      console.log('✅ Relatório de recursos gerado');
      
      return blob;
    } catch (error) {
      console.error('❌ Erro ao gerar relatório:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const calcularCustoTotal = useCallback(async (osIds: string[]): Promise<{ custoTotal: number; custoMedio: number; breakdown: any }> => {
    setLoading(true);
    try {
      console.log('💰 Calculando custo total para:', osIds.length, 'OS');
      await simulateDelay(1500);
      
      const ossSelecionadas = mockOrdensServico.filter(os => osIds.includes(String(os.id)));
      
      let custoMateriais = 0;
      let custoMaoObra = 0;
      let custoVeiculo = 0;
      
      ossSelecionadas.forEach(os => {
        // Custo materiais
        custoMateriais += os.materiais?.reduce((total, mat) => 
          total + (mat.custo || 0) * mat.quantidade, 0
        ) || 0;
        
        // Custo mão de obra
        custoMaoObra += os.tecnicos?.reduce((total, tec) => 
          total + (tec.custoHora || 50) * tec.horasEstimadas, 0
        ) || 0;
        
        // Custo estimado de viatura
        custoVeiculo += os.duracaoEstimada * 15;
      });
      
      const custoTotal = custoMateriais + custoMaoObra + custoVeiculo;
      const custoMedio = ossSelecionadas.length > 0 ? custoTotal / ossSelecionadas.length : 0;
      
      console.log(`✅ Custo calculado: R$ ${custoTotal.toFixed(2)}`);
      
      return {
        custoTotal,
        custoMedio,
        breakdown: {
          materiais: custoMateriais,
          maoDeObra: custoMaoObra,
          veiculo: custoVeiculo
        }
      };
    } catch (error) {
      console.error('❌ Erro ao calcular custo:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ INTEGRAÇÃO COM OUTRAS FEATURES
  const criarOSDeAnomalia = useCallback(async (anomaliaId: string, dados: any = {}): Promise<{ success: boolean; numeroOS: string }> => {
    setLoading(true);
    try {
      console.log('🚨 Criando OS a partir de anomalia:', anomaliaId);
      await simulateDelay(1800);
      
      const dadosOS: OrdemServicoFormData = {
        descricao: dados.descricao || `Correção de anomalia ${anomaliaId.slice(-6)}`,
        local: dados.local || 'Local da Anomalia',
        ativo: dados.ativo || 'Ativo da Anomalia',
        condicoes: dados.condicoes || 'PARADO',
        tipo: 'CORRETIVA',
        prioridade: dados.prioridade || 'ALTA',
        origem: 'ANOMALIA',
        plantaId: dados.plantaId || 1,
        equipamentoId: dados.equipamentoId || 1,
        anomaliaId,
        tempoEstimado: dados.tempoEstimado || 4,
        duracaoEstimada: dados.duracaoEstimada || 6,
        materiais: dados.materiais || [],
        ferramentas: dados.ferramentas || [],
        tecnicos: dados.tecnicos || [],
        observacoes: `OS criada automaticamente a partir da anomalia ${anomaliaId}`
      };
      
      const novaOS = await criarOS(dadosOS);
      console.log('✅ OS criada a partir de anomalia:', novaOS.numeroOS);
      
      return { success: true, numeroOS: novaOS.numeroOS };
    } catch (error) {
      console.error('❌ Erro ao criar OS de anomalia:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const criarOSDeTarefa = useCallback(async (tarefaId: string, dados: any = {}): Promise<{ success: boolean; numeroOS: string }> => {
    setLoading(true);
    try {
      console.log('📋 Criando OS a partir de tarefa:', tarefaId);
      await simulateDelay(1800);
      
      const dadosOS: OrdemServicoFormData = {
        descricao: dados.descricao || `Execução da tarefa ${tarefaId.slice(-6)}`,
        local: dados.local || 'Local da Tarefa',
        ativo: dados.ativo || 'Ativo da Tarefa',
        condicoes: dados.condicoes || 'PARADO',
        tipo: dados.tipo || 'PREVENTIVA',
        prioridade: dados.prioridade || 'MEDIA',
        origem: 'TAREFA',
        plantaId: dados.plantaId || 1,
        equipamentoId: dados.equipamentoId || 1,
        tarefaId,
        tempoEstimado: dados.tempoEstimado || 2,
        duracaoEstimada: dados.duracaoEstimada || 3,
        materiais: dados.materiais || [],
        ferramentas: dados.ferramentas || [],
        tecnicos: dados.tecnicos || [],
        observacoes: `OS criada automaticamente a partir da tarefa ${tarefaId}`
      };
      
      const novaOS = await criarOS(dadosOS);
      console.log('✅ OS criada a partir de tarefa:', novaOS.numeroOS);
      
      return { success: true, numeroOS: novaOS.numeroOS };
    } catch (error) {
      console.error('❌ Erro ao criar OS de tarefa:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ RETORNO DO HOOK COM TODAS AS FUNÇÕES
  return {
    loading,
    // CRUD
    criarOS,
    editarOS,
    obterOS,
    excluirOS,
    // Operações específicas
    planejarOS,
    programarOS,
    iniciarExecucao,
    finalizarOS,
    cancelarOS,
    // Recursos
    confirmarMaterial,
    confirmarFerramenta,
    confirmarTecnico,
    // Lote
    programarLote,
    cancelarLote,
    // Relatórios
    exportarOS,
    gerarRelatorioRecursos,
    calcularCustoTotal,
    // Integração
    criarOSDeAnomalia,
    criarOSDeTarefa
  };
};