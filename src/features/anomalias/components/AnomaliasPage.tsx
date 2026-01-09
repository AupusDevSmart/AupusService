// src/features/anomalias/components/AnomaliasPage.tsx - VERSÃO CORRIGIDA
import { useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/common/Layout';
import { TitleCard } from '@/components/common/title-card';
import { BaseTable, CustomAction } from '@/components/common/base-table/BaseTable';
import { BaseFilters } from '@/components/common/base-filters/BaseFilters';
import { BaseModal } from '@/components/common/base-modal/BaseModal';
import { Button } from '@/components/ui/button';
import { Plus, AlertTriangle, Clock, BarChart3, Download, Upload, Calendar, CheckCircle, XCircle, Settings, FileText } from 'lucide-react';
import { useGenericModal } from '@/hooks/useGenericModal';
import { Anomalia, AnomaliaFormData } from '../types';
import { anomaliasTableColumns } from '../config/table-config';
import { anomaliasFilterConfig } from '../config/filter-config';
import { anomaliasFormFields } from '../config/form-config';
import { useAnomaliasTable } from '../hooks/useAnomaliasTable';
import { useAnomalias } from '../hooks/useAnomalias';
import { planejarOSComAnomalia } from '@/utils/planejarOS';

export function AnomaliasPage() {
  const navigate = useNavigate();
  
  const {
    anomalias,
    pagination,
    filters,
    loading,
    error,
    stats,
    handleFilterChange,
    handlePageChange,
    refetch
  } = useAnomaliasTable();
  
  const {
    criarAnomalia,
    editarAnomalia,
    excluirAnomalia,
    loading: operationLoading
  } = useAnomalias();

  const {
    modalState,
    openModal,
    closeModal
  } = useGenericModal<Anomalia>();

  useEffect(() => {
    if (error) {
      console.error('❌ [AnomaliasPage] Erro na API:', error);
    }
  }, [error]);

  const handleSuccess = async () => {
    console.log('✅ [AnomaliasPage] Operação realizada com sucesso');
    refetch();
    closeModal();
  };

  const handleSubmit = async (data: AnomaliaFormData) => {
    try {
      // Extrair valores de localização
      const equipamentoId = data.localizacao?.equipamentoId || data.equipamentoId;
      const local = data.localizacao?.local || data.local;
      const ativo = data.localizacao?.ativo || data.ativo;

      // Validar campos obrigatórios
      if (!local || local.trim() === '') {
        throw new Error('O campo "Local" é obrigatório. Por favor, selecione uma planta.');
      }
      if (!ativo || ativo.trim() === '') {
        throw new Error('O campo "Equipamento" é obrigatório. Por favor, selecione um equipamento.');
      }

      // ✅ Transformar para o formato que o backend espera
      const transformedData: any = {
        descricao: data.descricao,
        condicao: data.condicao,
        origem: data.origem,
        prioridade: data.prioridade,
        observacoes: data.observacoes || '',
        localizacao: {
          local: local.trim(),
          ativo: ativo.trim(),
          ...(equipamentoId && equipamentoId.toString().trim() !== '' && {
            equipamentoId: equipamentoId.toString().trim()
          })
        },
        // Anexos NÃO são enviados aqui - serão enviados separadamente
      };

      if (modalState.mode === 'create') {
        const anomaliaCriada = await criarAnomalia(transformedData);

        // Upload anexos DEPOIS de criar a anomalia
        if (data.anexos && Array.isArray(data.anexos) && data.anexos.length > 0) {
          try {
            const { anomaliasService } = await import('@/services/anomalias.service');
            await anomaliasService.uploadAnexos(anomaliaCriada.id.trim(), data.anexos as File[]);
          } catch (uploadError) {
            console.error('Erro ao fazer upload dos anexos:', uploadError);
          }
        }
      } else if (modalState.mode === 'edit' && modalState.entity) {
        await editarAnomalia(modalState.entity.id, transformedData);
      }

      await handleSuccess();
    } catch (error) {
      console.error('❌ [AnomaliasPage] Erro ao salvar anomalia:', error);
      throw error;
    }
  };

  // ✅ CORREÇÃO: Memoizar a transformação da entidade
  const modalEntity = useMemo(() => {
    const entity = modalState.entity;
    
    if (modalState.mode === 'create') {
      return {
        id: '',
        descricao: '',
        plantaId: '',
        equipamentoId: '',
        local: '',
        ativo: '',
        data: new Date().toISOString(),
        condicao: 'FUNCIONANDO',
        origem: 'OPERADOR',
        status: 'AGUARDANDO',
        prioridade: 'MEDIA',
        observacoes: '',
        localizacao: {
          plantaId: '',
          equipamentoId: '',
          local: '',
          ativo: ''
        },
        anexos: [], // ✅ Inicializar como array vazio
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
      };
    }
    
    if (entity && (modalState.mode === 'edit' || modalState.mode === 'view')) {
      // ✅ CORRIGIDO: Buscar unidadeId e plantaId do objeto equipamento
      const unidadeIdFromEquipamento = entity.equipamento?.unidade?.id || entity.equipamento?.unidadeId || entity.equipamento?.unidade_id;
      const plantaIdFromEquipamento = entity.equipamento?.unidade?.planta?.id || entity.equipamento?.planta?.id || entity.equipamento?.plantaId;

      return {
        ...entity,
        prioridade: entity.prioridade || 'MEDIA',
        plantaId: entity.planta_id || entity.plantaId || plantaIdFromEquipamento || '',
        unidadeId: entity.unidade_id || entity.unidadeId || unidadeIdFromEquipamento || '',
        equipamentoId: entity.equipamento_id || entity.equipamentoId || '',
        local: entity.local || '',
        ativo: entity.ativo || '',
        localizacao: {
          plantaId: entity.planta_id || entity.plantaId || plantaIdFromEquipamento || '',
          unidadeId: entity.unidade_id || entity.unidadeId || unidadeIdFromEquipamento || '',
          equipamentoId: entity.equipamento_id || entity.equipamentoId || '',
          local: entity.local || '',
          ativo: entity.ativo || ''
        },
        anexos: (entity as any).anexos || []
      };
    }
    
    return entity;
  }, [modalState.entity, modalState.mode]); // ✅ Dependências específicas

  // ✅ CORREÇÃO: Memoizar títulos e ícones
  const modalTitle = useMemo(() => {
    const titles: Record<string, string> = {
      create: 'Nova Anomalia',
      edit: 'Editar Anomalia',
      view: 'Visualizar Anomalia',
      programar: 'Programar Anomalia'
    };
    return titles[modalState.mode] || 'Anomalia';
  }, [modalState.mode]);

  const modalIcon = useMemo(() => {
    return <AlertTriangle className="h-5 w-5 text-primary" />;
  }, []);

  const handleView = useCallback((anomalia: Anomalia) => {
    openModal('view', anomalia);
  }, [openModal]);

  const handleEdit = useCallback((anomalia: Anomalia) => {
    // ✅ BLOQUEAR edição de anomalias já analisadas
    if (anomalia.status !== 'AGUARDANDO' && anomalia.status !== 'EM_ANALISE') {
      alert(`Não é possível editar uma anomalia com status "${anomalia.status}". Apenas anomalias "AGUARDANDO" ou "EM_ANALISE" podem ser editadas.`);
      return;
    }
    openModal('edit', anomalia);
  }, [openModal]);

  const handlePlanejarOS = useCallback((anomalia: Anomalia) => {
    console.log('🚨 Planejando OS para anomalia:', anomalia.id);
    planejarOSComAnomalia(anomalia as any, navigate);
  }, [navigate]);

  const handleDelete = useCallback(async (anomalia: Anomalia) => {
    console.log('🗑️ [AnomaliasPage] Excluindo anomalia:', anomalia.id);
    
    const confirmDelete = confirm(`Tem certeza que deseja excluir a anomalia: ${anomalia.descricao}?`);
    if (!confirmDelete) return;
    
    try {
      await excluirAnomalia(anomalia.id);
      await handleSuccess();
    } catch (error) {
      console.error('❌ [AnomaliasPage] Erro ao excluir anomalia:', error);
    }
  }, [excluirAnomalia, handleSuccess]);

  const customActions: CustomAction<Anomalia>[] = useMemo(() => [
    {
      key: 'planejar_os',
      label: 'Planejar OS',
      icon: <Calendar className="h-4 w-4" />,
      variant: 'default',
      condition: () => true,
      handler: handlePlanejarOS
    }
  ], [handlePlanejarOS]);

  const handleCreateClick = useCallback(() => {
    openModal('create');
  }, [openModal]);

  return (
    <Layout>
      <Layout.Main>
        <div className="flex flex-col h-full w-full">
          <TitleCard
            title="Anomalias"
            description="Gerencie e monitore anomalias identificadas no sistema"
          />
          
          {/* Dashboard de Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
            <div className="bg-card border rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
              </div>
            </div>
            
            <div className="bg-card border rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                  <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.aguardando}</p>
                  <p className="text-sm text-muted-foreground">Aguardando</p>
                </div>
              </div>
            </div>
            
            <div className="bg-card border rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <Settings className="h-5 w-5 text-blue-600 dark:text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.emAnalise}</p>
                  <p className="text-sm text-muted-foreground">Em Análise</p>
                </div>
              </div>
            </div>
            
            <div className="bg-card border rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                  <FileText className="h-5 w-5 text-purple-600 dark:text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.osGerada}</p>
                  <p className="text-sm text-muted-foreground">OS Gerada</p>
                </div>
              </div>
            </div>
            
            <div className="bg-card border rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.resolvida}</p>
                  <p className="text-sm text-muted-foreground">Resolvidas</p>
                </div>
              </div>
            </div>
            
            <div className="bg-card border rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full">
                  <XCircle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.cancelada}</p>
                  <p className="text-sm text-muted-foreground">Canceladas</p>
                </div>
              </div>
            </div>
            
            <div className="bg-card border rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.criticas}</p>
                  <p className="text-sm text-muted-foreground">Críticas</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Filtros e Ação */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <BaseFilters 
                filters={filters}
                config={anomaliasFilterConfig}
                onFilterChange={handleFilterChange}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="mr-1 h-4 w-4" />
                <span className="hidden sm:inline">Exportar</span>
              </Button>
              
              <Button variant="outline" size="sm">
                <Upload className="mr-1 h-4 w-4" />
                <span className="hidden sm:inline">Importar</span>
              </Button>
              
              <Button onClick={handleCreateClick} className="shrink-0">
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Nova Anomalia</span>
                <span className="sm:hidden">Nova</span>
              </Button>
            </div>
          </div>

          {/* Alertas de Anomalias Críticas */}
          {stats.criticas > 0 && (
            <div className="mb-6">
              <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/50 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-red-900 dark:text-red-100 mb-1">
                      Anomalias Críticas Detectadas
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {stats.criticas} anomalia(s) com prioridade crítica identificadas. 
                      Verifique urgentemente para evitar problemas operacionais.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabela */}
          <div className="flex-1 min-h-0">
            <BaseTable
              data={anomalias}
              columns={anomaliasTableColumns}
              pagination={pagination}
              loading={loading || operationLoading}
              onPageChange={handlePageChange}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              customActions={customActions}
              emptyMessage="Nenhuma anomalia encontrada."
              emptyIcon={<AlertTriangle className="h-8 w-8 text-muted-foreground/50" />}
            />
          </div>
        </div>

        {/* ✅ MODAL CORRIGIDO */}
        {modalState.isOpen && (
          <BaseModal
            isOpen={modalState.isOpen}
            mode={modalState.mode}
            entity={modalEntity as any} // ✅ Referência estável
            title={modalTitle} // ✅ Referência estável
            icon={modalIcon} // ✅ Referência estável
            formFields={anomaliasFormFields}
            onClose={closeModal}
            onSubmit={handleSubmit}
            width="w-[800px]"
            groups={[
              {
                key: 'informacoes_basicas',
                title: 'Informações Básicas',
                fields: ['descricao']
              },
              {
                key: 'localizacao',
                title: 'Localização',
                fields: ['localizacao']
              },
              {
                key: 'classificacao',
                title: 'Classificação',
                fields: ['status', 'condicao', 'origem', 'prioridade']
              },
              {
                key: 'observacoes',
                title: 'Observações Adicionais',
                fields: ['observacoes']
              },
              {
                key: 'analise',
                title: 'Análise da Anomalia',
                fields: ['observacoes_analise']
              },
              {
                key: 'anexos',
                title: 'Anexos',
                fields: ['anexos']
              }
            ]}
          />
        )}
      </Layout.Main>
    </Layout>
  );
}