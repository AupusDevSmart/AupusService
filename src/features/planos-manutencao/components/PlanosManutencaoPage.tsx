// src/features/planos-manutencao/components/PlanosManutencaoPage.tsx - COM PLANEJAR OS
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/common/Layout';
import { TitleCard } from '@/components/common/title-card';
import { BaseTable } from '@/components/common/base-table/BaseTable';
import { BaseFilters } from '@/components/common/base-filters/BaseFilters';
import { BaseModal } from '@/components/common/base-modal/BaseModal';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Layers, 
  Copy, 
  Users, 
  FileText, 
  Download, 
  Upload,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Eye,
  Calendar
} from 'lucide-react';
import { useGenericTable } from '@/hooks/useGenericTable';
import { useGenericModal } from '@/hooks/useGenericModal';
import { PlanoManutencao, PlanosFilters } from '../types';
import { planosTableColumns } from '../config/table-config';
import { planosFilterConfig } from '../config/filter-config';
import { planosFormFields } from '../config/form-config';
import { mockPlanosManutencao } from '../data/mock-data';
import { usePlanosManutencao } from '../hooks/usePlanosManutencao';
import { SelecionarTarefasModal } from '@/components/common/planejar-os/SelecionarTarefasModal';
import { planejarOSComPlano } from '@/utils/planejarOS';

const initialFilters: PlanosFilters = {
  search: '',
  categoria: 'all',
  ativo: 'all',
  publico: 'all',
  page: 1,
  limit: 10
};

export function PlanosManutencaoPage() {
  const navigate = useNavigate();
  
  const {
    paginatedData: planos,
    pagination,
    filters,
    loading,
    setLoading,
    handleFilterChange,
    handlePageChange
  } = useGenericTable({
    data: mockPlanosManutencao,
    initialFilters,
    searchFields: ['nome', 'descricao', 'categoria', 'criadoPor']
  });

  const {
    modalState,
    openModal,
    closeModal
  } = useGenericModal<PlanoManutencao>();

  const {
    criarPlano,
    editarPlano,
    duplicarPlano,
    excluirPlano,
    importarPlano,
    ativarPlanos,
    desativarPlanos
  } = usePlanosManutencao();

  // Estado para modal de seleção de tarefas
  const [showSelecionarTarefasModal, setShowSelecionarTarefasModal] = useState(false);
  const [planoParaPlanejar, setPlanoParaPlanejar] = useState<PlanoManutencao | null>(null);

  // Dashboard com cores simplificadas
  const [stats, setStats] = useState({
    total: 0,
    ativos: 0,
    inativos: 0,
    totalEquipamentos: 0,
    totalTarefasGeradas: 0
  });

  // Calcular estatísticas
  useEffect(() => {
    const total = mockPlanosManutencao.length;
    const ativos = mockPlanosManutencao.filter(p => p.ativo).length;
    const inativos = mockPlanosManutencao.filter(p => !p.ativo).length;
    const totalEquipamentos = mockPlanosManutencao.reduce((acc, p) => acc + (p.totalEquipamentos || 0), 0);
    const totalTarefasGeradas = mockPlanosManutencao.reduce((acc, p) => acc + (p.totalTarefasGeradas || 0), 0);

    setStats({
      total,
      ativos,
      inativos,
      totalEquipamentos,
      totalTarefasGeradas
    });
  }, []);

  const handleSuccess = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    closeModal();
  };

  const handleSubmit = async (data: any) => {
    console.log('Dados do plano para salvar:', data);
    
    try {
      if (modalState.mode === 'create') {
        await criarPlano(data);
      } else if (modalState.mode === 'edit' && modalState.entity) {
        await editarPlano(String(modalState.entity.id), data);
      }
      
      await handleSuccess();
    } catch (error) {
      console.error('Erro ao salvar plano:', error);
    }
  };

  const getModalTitle = () => {
    const titles = {
      create: 'Novo Plano de Manutenção',
      edit: 'Editar Plano de Manutenção', 
      view: 'Visualizar Plano de Manutenção'
    };
    return titles[modalState.mode as keyof typeof titles] || 'Plano de Manutenção';
  };

  const getModalIcon = () => {
    return <Layers className="h-5 w-5 text-blue-600" />;
  };

  const getModalEntity = () => {
    const entity = modalState.entity;
    
    if (modalState.mode === 'create') {
      return {
        id: 0,
        categoria: 'MOTORES_ELETRICOS',
        versao: '1.0',
        ativo: true,
        publico: false,
        tarefasTemplate: []
      };
    }
    
    return entity;
  };

  const handleView = (plano: PlanoManutencao) => {
    console.log('Clicou em Visualizar:', plano);
    openModal('view', plano);
  };

  const handleEdit = (plano: PlanoManutencao) => {
    console.log('Clicou em Editar:', plano);
    openModal('edit', plano);
  };

  // NOVA FUNCIONALIDADE: Planejar OS
  const handlePlanejarOS = (plano: PlanoManutencao) => {
    console.log('📋 Iniciando planejamento de OS para plano:', plano.id);
    setPlanoParaPlanejar(plano);
    setShowSelecionarTarefasModal(true);
  };

  // NOVA FUNCIONALIDADE: Confirmar seleção de tarefas e navegar para OS
  const handleConfirmarSelecaoTarefas = (tarefasSelecionadas: any[], equipamentosSelecionados: number[]) => {
    if (planoParaPlanejar) {
      console.log('✅ Confirmando seleção:', {
        plano: planoParaPlanejar.id,
        tarefas: tarefasSelecionadas.length,
        equipamentos: equipamentosSelecionados.length
      });
      
      // Fechar modal
      setShowSelecionarTarefasModal(false);
      
      // Navegar para programação com dados pré-selecionados
      planejarOSComPlano(planoParaPlanejar as any, tarefasSelecionadas, equipamentosSelecionados, navigate);
      
      // Limpar estado
      setPlanoParaPlanejar(null);
    }
  };

  // Navegar para associação
  const handleAssociarEquipamentos = (plano: PlanoManutencao) => {
    console.log('Navegando para associação do plano:', plano.id);
    navigate(`/planos-manutencao/associar?planoId=${plano.id}`);
  };

  // Ver tarefas geradas
  const handleVerTarefas = (plano: PlanoManutencao) => {
    console.log('Navegando para tarefas do plano:', plano.id);
    navigate(`/tarefas?planoId=${plano.id}`);
  };

  // Ações personalizadas para planos
  const handleDuplicar = async (plano: PlanoManutencao) => {
    console.log('Duplicando plano:', plano.id);
    try {
      await duplicarPlano(String(plano.id));
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLoading(false);
    } catch (error) {
      console.error('Erro ao duplicar plano:', error);
    }
  };

  const handleAtivar = async (plano: PlanoManutencao) => {
    console.log('Ativando plano:', plano.id);
    await ativarPlanos([String(plano.id)]);
  };

  const handleDesativar = async (plano: PlanoManutencao) => {
    console.log('Desativando plano:', plano.id);
    await desativarPlanos([String(plano.id)]);
  };

  const handleExcluir = async (plano: PlanoManutencao) => {
    console.log('Excluindo plano:', plano.id);
    try {
      const sucesso = await excluirPlano(String(plano.id));
      if (sucesso) {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setLoading(false);
      }
    } catch (error) {
      console.error('Erro ao excluir plano:', error);
      alert(error instanceof Error ? error.message : 'Erro desconhecido');
    }
  };

  const handleExportar = async () => {
    console.log('Exportando planos...');
  };

  const handleImportar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('Importando planos...');
      const resultado = await importarPlano(file);
      console.log('Resultado da importação:', resultado);
      
      event.target.value = '';
    }
  };

  return (
    <Layout>
      <Layout.Main>
        <div className="flex flex-col h-full w-full">
          {/* Header */}
          <TitleCard
            title="Planos de Manutenção"
            description="Gerencie templates de manutenção para equipamentos similares"
          />
          
          {/* Dashboard Simplificado - APENAS 5 CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {/* Total - Neutro */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Layers className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
                </div>
              </div>
            </div>
            
            {/* Ativos - Verde */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.ativos}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Ativos</p>
                </div>
              </div>
            </div>
            
            {/* Inativos - Amarelo */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <XCircle className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.inativos}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Inativos</p>
                </div>
              </div>
            </div>
            
            {/* Equipamentos - Azul */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.totalEquipamentos}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Equipamentos</p>
                </div>
              </div>
            </div>
            
            {/* Tarefas - Azul */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.totalTarefasGeradas}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Tarefas</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Filtros e Ação */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <BaseFilters 
                filters={filters}
                config={planosFilterConfig}
                onFilterChange={handleFilterChange}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportar}>
                <Download className="mr-1 h-4 w-4" />
                <span className="hidden sm:inline">Exportar</span>
              </Button>
              
              <Button variant="outline" size="sm" asChild>
                <label>
                  <Upload className="mr-1 h-4 w-4" />
                  <span className="hidden sm:inline">Importar</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportar}
                    className="hidden"
                  />
                </label>
              </Button>
              
              <Button 
                onClick={() => openModal('create')}
                className="bg-primary hover:bg-primary/90 shrink-0"
              >
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Novo Plano</span>
                <span className="sm:hidden">Novo</span>
              </Button>
            </div>
          </div>

          {/* Alertas Simplificados */}
          {stats.inativos > 0 && (
            <div className="mb-6">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg dark:bg-amber-950 dark:border-amber-800">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <div>
                    <h4 className="font-medium text-amber-900 dark:text-amber-100">
                      Planos Inativos
                    </h4>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      {stats.inativos} plano(s) inativo(s) não estão gerando tarefas para equipamentos.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabela */}
          <div className="flex-1 min-h-0">
            <BaseTable
              data={planos}
              columns={planosTableColumns}
              pagination={pagination}
              loading={loading}
              onPageChange={handlePageChange}
              onView={handleView}
              onEdit={handleEdit}
              emptyMessage="Nenhum plano de manutenção encontrado."
              emptyIcon={<Layers className="h-8 w-8 text-muted-foreground/50" />}
              customActions={[
                {
                  key: 'planejar_os',
                  label: 'Planejar OS',
                  handler: handlePlanejarOS,
                  condition: (item: PlanoManutencao) => item.ativo && (item.totalEquipamentos || 0) > 0,
                  icon: <Calendar className="h-4 w-4" />,
                  variant: 'default'
                },
                {
                  key: 'associar',
                  label: 'Associar Equipamentos',
                  handler: handleAssociarEquipamentos,
                  icon: <ExternalLink className="h-4 w-4" />,
                  variant: 'secondary'
                },
                {
                  key: 'ver_tarefas',
                  label: 'Ver Tarefas',
                  handler: handleVerTarefas,
                  condition: (item: PlanoManutencao) => (item.totalTarefasGeradas || 0) > 0,
                  icon: <Eye className="h-4 w-4" />
                },
                {
                  key: 'duplicar',
                  label: 'Duplicar',
                  handler: handleDuplicar,
                  icon: <Copy className="h-4 w-4" />
                },
                {
                  key: 'ativar',
                  label: 'Ativar',
                  handler: handleAtivar,
                  condition: (item: PlanoManutencao) => !item.ativo,
                  icon: <CheckCircle className="h-4 w-4" />
                },
                {
                  key: 'desativar',
                  label: 'Desativar',
                  handler: handleDesativar,
                  condition: (item: PlanoManutencao) => item.ativo,
                  icon: <XCircle className="h-4 w-4" />
                },
                {
                  key: 'excluir',
                  label: 'Excluir',
                  handler: handleExcluir,
                  condition: (item: PlanoManutencao) => (item.totalEquipamentos || 0) === 0,
                  variant: 'destructive'
                }
              ]}
            />
          </div>
        </div>

        {/* Modal Principal */}
        <BaseModal
          isOpen={modalState.isOpen}
          mode={modalState.mode}
          entity={getModalEntity()}
          title={getModalTitle()}
          icon={getModalIcon()}
          formFields={planosFormFields}
          onClose={closeModal}
          onSubmit={handleSubmit}
          width="w-[1000px]"
          groups={[
            { key: 'informacoes_basicas', title: 'Informações Básicas' },
            { key: 'configuracoes', title: 'Configurações' },
            { key: 'tarefas_template', title: 'Templates de Tarefas' }
          ]}
        />

        {/* Modal de Seleção de Tarefas */}
        <SelecionarTarefasModal
          isOpen={showSelecionarTarefasModal}
          plano={planoParaPlanejar as any}
          onClose={() => {
            setShowSelecionarTarefasModal(false);
            setPlanoParaPlanejar(null);
          }}
          onConfirm={handleConfirmarSelecaoTarefas}
        />
      </Layout.Main>
    </Layout>
  );
}