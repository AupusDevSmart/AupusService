// src/examples/services-integration-example.tsx
// Exemplo de como integrar os novos services de planos-manutencao e tarefas

import React, { useEffect, useState } from 'react';
import { usePlanosManutencaoApi } from '@/features/planos-manutencao/hooks/usePlanosManutencaoApi';
import { useTarefasApi } from '@/features/tarefas/hooks/useTarefasApi';
import { Button } from '@/components/ui/button';

// ============================================================================
// EXEMPLO DE INTEGRAÇÃO COM OS NOVOS SERVICES
// ============================================================================

export function ServicesIntegrationExample() {
  const planosService = usePlanosManutencaoApi();
  const tarefasService = useTarefasApi();
  
  const [selectedPlanoId, setSelectedPlanoId] = useState<string>('');

  // Carregar dados iniciais
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Carregar planos de manutenção
        await planosService.fetchPlanos({ 
          page: 1, 
          limit: 10,
          ativo: true 
        });

        // Carregar dashboard das tarefas
        await tarefasService.getDashboard();

        console.log('✅ Dados iniciais carregados com sucesso');
      } catch (error) {
        console.error('💥 Erro ao carregar dados iniciais:', error);
      }
    };

    loadInitialData();
  }, []);

  // ============================================================================
  // EXEMPLOS DE OPERAÇÕES CRUD
  // ============================================================================

  const handleCreatePlano = async () => {
    try {
      console.log('📝 Exemplo: Criando novo plano de manutenção');
      
      const novoPlano = await planosService.createPlano({
        equipamento_id: 'equipamento-123',
        nome: 'Plano de Teste via API',
        descricao: 'Este é um plano criado através do novo service',
        versao: '1.0',
        status: 'ATIVO',
        ativo: true,
        criado_por: 'usuario-teste'
      });

      console.log('✅ Plano criado:', novoPlano);
      setSelectedPlanoId(novoPlano.id);
      
    } catch (error) {
      console.error('💥 Erro ao criar plano:', error);
    }
  };

  const handleCreateTarefa = async () => {
    if (!selectedPlanoId) {
      alert('Primeiro crie um plano de manutenção!');
      return;
    }

    try {
      console.log('📝 Exemplo: Criando nova tarefa');
      
      const novaTarefa = await tarefasService.createTarefa({
        plano_manutencao_id: selectedPlanoId,
        nome: 'Tarefa de Teste via API',
        descricao: 'Esta é uma tarefa criada através do novo service',
        categoria: 'MECANICA',
        tipo_manutencao: 'PREVENTIVA',
        frequencia: 'MENSAL',
        condicao_ativo: 'PARADO',
        criticidade: 3,
        duracao_estimada: 2,
        tempo_estimado: 120,
        ordem: 1,
        responsavel: 'Técnico Teste',
        status: 'ATIVA',
        ativo: true,
        criado_por: 'usuario-teste',
        sub_tarefas: [
          {
            descricao: 'Verificar componentes',
            obrigatoria: true,
            tempo_estimado: 30,
            ordem: 1
          }
        ],
        recursos: [
          {
            tipo: 'FERRAMENTA',
            descricao: 'Chave inglesa',
            quantidade: 1,
            unidade: 'un',
            obrigatorio: true
          }
        ]
      });

      console.log('✅ Tarefa criada:', novaTarefa);
      
    } catch (error) {
      console.error('💥 Erro ao criar tarefa:', error);
    }
  };

  const handleDuplicatePlano = async () => {
    if (!selectedPlanoId) {
      alert('Primeiro selecione um plano!');
      return;
    }

    try {
      console.log('📋 Exemplo: Duplicando plano');
      
      const planoDuplicado = await planosService.duplicarPlano(selectedPlanoId, {
        equipamento_destino_id: 'equipamento-456',
        novo_nome: 'Plano Duplicado via API',
        novo_prefixo_tag: 'DUP-',
        criado_por: 'usuario-teste'
      });

      console.log('✅ Plano duplicado:', planoDuplicado);
      
    } catch (error) {
      console.error('💥 Erro ao duplicar plano:', error);
    }
  };

  const handleUploadAnexo = async () => {
    if (!tarefasService.tarefas.length) {
      alert('Primeiro crie uma tarefa!');
      return;
    }

    try {
      // Criar um arquivo fake para teste
      const fakeFile = new File(['conteúdo teste'], 'manual-teste.pdf', { 
        type: 'application/pdf' 
      });

      const primeiraTarefa = tarefasService.tarefas[0];
      
      console.log('📤 Exemplo: Fazendo upload de anexo');
      
      const anexo = await tarefasService.uploadAnexo(
        primeiraTarefa.id, 
        fakeFile, 
        'Manual de teste via API',
        'usuario-teste'
      );

      console.log('✅ Anexo enviado:', anexo);
      
    } catch (error) {
      console.error('💥 Erro ao enviar anexo:', error);
    }
  };

  // ============================================================================
  // RENDER DO EXEMPLO
  // ============================================================================

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Exemplo de Integração dos Services</h1>
      
      {/* Status dos Services */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Planos de Manutenção</h3>
          <p>Loading: {planosService.loading ? '✅' : '❌'}</p>
          <p>Error: {planosService.error || 'Nenhum'}</p>
          <p>Total: {planosService.total}</p>
          <p>Planos Carregados: {planosService.planos.length}</p>
        </div>
        
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Tarefas</h3>
          <p>Loading: {tarefasService.loading ? '✅' : '❌'}</p>
          <p>Error: {tarefasService.error || 'Nenhum'}</p>
          <p>Total: {tarefasService.total}</p>
          <p>Tarefas Carregadas: {tarefasService.tarefas.length}</p>
        </div>
      </div>

      {/* Botões de Teste */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Operações de Teste</h3>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={handleCreatePlano}
            disabled={planosService.loading}
          >
            Criar Plano de Teste
          </Button>
          
          <Button 
            onClick={handleCreateTarefa}
            disabled={tarefasService.loading || !selectedPlanoId}
          >
            Criar Tarefa de Teste
          </Button>
          
          <Button 
            onClick={handleDuplicatePlano}
            disabled={planosService.loading || !selectedPlanoId}
          >
            Duplicar Plano
          </Button>
          
          <Button 
            onClick={handleUploadAnexo}
            disabled={tarefasService.loading || !tarefasService.tarefas.length}
          >
            Upload Anexo
          </Button>
        </div>
      </div>

      {/* Lista de Planos */}
      {planosService.planos.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Planos Carregados</h3>
          <div className="space-y-2">
            {planosService.planos.map(plano => (
              <div 
                key={plano.id} 
                className={`p-3 border rounded cursor-pointer ${
                  selectedPlanoId === plano.id ? 'border-blue-500 bg-blue-50' : ''
                }`}
                onClick={() => setSelectedPlanoId(plano.id)}
              >
                <div className="font-medium">{plano.nome}</div>
                <div className="text-sm text-gray-600">
                  {plano.descricao} | Versão: {plano.versao} | Status: {plano.status}
                </div>
                <div className="text-xs text-gray-500">
                  Tarefas: {plano.total_tarefas || 0} | ID: {plano.id}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de Tarefas */}
      {tarefasService.tarefas.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Tarefas Carregadas</h3>
          <div className="space-y-2">
            {tarefasService.tarefas.map(tarefa => (
              <div key={tarefa.id} className="p-3 border rounded">
                <div className="font-medium">{tarefa.nome}</div>
                <div className="text-sm text-gray-600">
                  {tarefa.descricao} | Tipo: {tarefa.tipo_manutencao} | Status: {tarefa.status}
                </div>
                <div className="text-xs text-gray-500">
                  Sub-tarefas: {tarefa.total_sub_tarefas || 0} | Recursos: {tarefa.total_recursos || 0}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Console de Logs */}
      <div className="p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold mb-2">Console</h3>
        <p className="text-sm text-gray-600">
          Abra o console do navegador (F12) para ver os logs detalhados das operações da API.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// EXEMPLO DE USO EM OUTRAS PARTES DA APLICAÇÃO
// ============================================================================

export const ApiIntegrationExamples = {
  // Exemplo de como buscar planos com filtros
  async buscarPlanosAtivos() {
    const planosService = usePlanosManutencaoApi();
    
    return await planosService.fetchPlanos({
      ativo: true,
      status: 'ATIVO',
      page: 1,
      limit: 20,
      sort_by: 'nome',
      sort_order: 'asc'
    });
  },

  // Exemplo de como buscar tarefas por plano
  async buscarTarefasDoPlano(planoId: string) {
    const tarefasService = useTarefasApi();
    
    return await tarefasService.fetchTarefasByPlano(planoId, {
      ativo: true,
      status: 'ATIVA'
    });
  },

  // Exemplo de como atualizar status de uma tarefa
  async ativarTarefa(tarefaId: string, usuarioId: string) {
    const tarefasService = useTarefasApi();
    
    return await tarefasService.updateStatus(tarefaId, {
      status: 'ATIVA',
      ativo: true,
      atualizado_por: usuarioId
    });
  },

  // Exemplo de como obter dashboard
  async obterDashboards() {
    const planosService = usePlanosManutencaoApi();
    const tarefasService = useTarefasApi();
    
    const [dashboardPlanos, dashboardTarefas] = await Promise.all([
      planosService.getDashboard(),
      tarefasService.getDashboard()
    ]);

    return { dashboardPlanos, dashboardTarefas };
  }
};

export default ServicesIntegrationExample;