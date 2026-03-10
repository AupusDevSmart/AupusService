// src/features/veiculos/components/VeiculosPage.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Layout } from '@/components/common/Layout';
import { TitleCard } from '@/components/common/title-card';
import { BaseTable, CustomAction } from '@nexon/components/common/base-table/BaseTable';
import { BaseFilters } from '@nexon/components/common/base-filters/BaseFilters';
import { BaseModal } from '@nexon/components/common/base-modal/BaseModal';
import { Button } from '@/components/ui/button';
import { Plus, Car, Wrench, Calendar, RefreshCw, Filter } from 'lucide-react';
import { useGenericModal } from '@/hooks/useGenericModal';
import { useVeiculos } from '../hooks/useVeiculos';
import { veiculosFilterConfig } from '../config/filter-config';
import { veiculosFormFields } from '../config/form-config';
import { veiculosTableColumns } from '../config/table-config';
import { toast } from '@/hooks/use-toast';
import {
  VeiculoResponse,
  CreateVeiculoRequest,
  VeiculosFilters
} from '../types';
import { useDocumentosVeiculos } from '../hooks/useDocumentosVeiculos';

const initialFilters: VeiculosFilters = {
  search: '',
  status: 'all',
  tipo: 'all',
  tipoCombustivel: 'all',
  marca: '',
  disponivel: 'all',
  page: 1,
  limit: 10
};

export function VeiculosPage() {
  // Estados locais
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filters, setFilters] = useState<VeiculosFilters>(initialFilters);

  // Hook da API
  const {
    veiculos,
    totalVeiculos,
    loading,
    fetchVeiculos,
    createVeiculo,
    updateVeiculo,
    updateStatus,
    clearError
  } = useVeiculos({ autoFetch: false });

  const { modalState, openModal, closeModal } = useGenericModal<any>();
  const { uploadDocumento } = useDocumentosVeiculos();

  // Buscar veículos quando filtros mudarem
  const fetchVeiculosWithFilters = useCallback(async (currentFilters: VeiculosFilters) => {
    try {
      clearError();

      const params = {
        page: currentFilters.page,
        limit: currentFilters.limit,
        search: currentFilters.search || undefined,
        status: currentFilters.status !== 'all' ? currentFilters.status as any : undefined,
        tipo: currentFilters.tipo !== 'all' ? currentFilters.tipo as any : undefined,
        tipoCombustivel: currentFilters.tipoCombustivel !== 'all' ? currentFilters.tipoCombustivel as any : undefined,
        marca: currentFilters.marca || undefined,
        disponivel: currentFilters.disponivel !== 'all' ? currentFilters.disponivel === 'true' : undefined,
        orderBy: 'nome' as const,
        orderDirection: 'asc' as const
      };

      await fetchVeiculos(params);
    } catch (error) {
      console.error('Erro ao buscar veículos:', error);
    }
  }, [fetchVeiculos, clearError]);

  // Efeito inicial
  useEffect(() => {
    fetchVeiculosWithFilters(initialFilters);
  }, []);

  // Handler: Mudança de filtros
  const handleFilterChange = useCallback((newFilters: Partial<VeiculosFilters>) => {
    console.log('🔄 [VEICULOS PAGE] Filtros alterados:', newFilters);

    const updatedFilters = {
      ...filters,
      ...newFilters,
      page: newFilters.page || 1
    };

    setFilters(updatedFilters);
    fetchVeiculosWithFilters(updatedFilters);
  }, [filters, fetchVeiculosWithFilters]);

  // Handler: Mudança de página
  const handlePageChange = useCallback((newPage: number) => {
    console.log('📄 [VEICULOS PAGE] Mudança de página:', newPage);
    handleFilterChange({ page: newPage });
  }, [handleFilterChange]);

  // Handler: Refresh manual
  const handleRefresh = useCallback(() => {
    console.log('🔄 [VEICULOS PAGE] Refresh manual');
    fetchVeiculosWithFilters(filters);
  }, [fetchVeiculosWithFilters, filters]);

  // Handler: Submissão do formulário - VERSÃO CORRIGIDA
  const handleSubmit = async (data: CreateVeiculoRequest) => {
    console.log('💾 [VEICULOS PAGE] Iniciando submissão:', data);
    setIsSubmitting(true);

    try {
      // ⭐ CONVERSÃO: Transformar dados do form para formato da API
      const apiData: CreateVeiculoRequest = {
        // Campos obrigatórios mapeados corretamente
        nome: data.nome,
        placa: data.placa,
        marca: data.marca,
        modelo: data.modelo,
        ano: data.ano, // API espera 'ano' diretamente
        status: data.status || 'disponivel',
        tipo: data.tipo,
        tipoCombustivel: data.tipoCombustivel,
        capacidadePassageiros: data.capacidadePassageiros,
        capacidadeCarga: data.capacidadeCarga,
        localizacaoAtual: data.localizacaoAtual,

        // Campos opcionais
        ...(data.cor && { cor: data.cor }),
        ...(data.kmAtual !== undefined && { kmAtual: data.kmAtual }), // API espera 'kmAtual'
        ...(data.proximaRevisao && { proximaRevisao: data.proximaRevisao }),
        ...(data.responsavelManutencao && { responsavelManutencao: data.responsavelManutencao }),
        ...(data.observacoes && { observacoes: data.observacoes }),
        ...(data.chassi && { chassi: data.chassi }),
        ...(data.renavam && { renavam: data.renavam }),
        ...(data.seguradora && { seguradora: data.seguradora })
      };

      console.log('🔄 [VEICULOS PAGE] Dados convertidos para API:', apiData);

      if (modalState.mode === 'create') {
        const novoVeiculo = await createVeiculo(apiData);

        // Upload dos documentos selecionados
        let documentosUploadados = 0;
        let totalDocumentos = 0;

        if (data.documentos && Array.isArray(data.documentos) && data.documentos.length > 0) {
          totalDocumentos = data.documentos.length;
          console.log('📄 [VEICULOS PAGE] Fazendo upload de documentos:', totalDocumentos);

          for (const documento of data.documentos) {
            try {
              await uploadDocumento(novoVeiculo.id, {
                file: documento.file,
                categoria: documento.categoria,
                descricao: documento.descricao,
                dataVencimento: documento.dataVencimento
              });
              documentosUploadados++;
            } catch (docError) {
              console.error('❌ Erro ao fazer upload do documento:', documento.file.name, docError);
            }
          }
        }

        const documentosMessage = totalDocumentos > 0
          ? ` ${documentosUploadados}/${totalDocumentos} documentos enviados.`
          : '';

        toast({
          title: "Veículo criado!",
          description: `O veículo ${data.nome} foi criado com sucesso.${documentosMessage}`,
          variant: documentosUploadados === totalDocumentos ? "default" : "destructive",
        });

      } else if (modalState.mode === 'edit' && modalState.entity) {
        // 🔧 FIX: Para update, criar payload específico apenas com campos editáveis
        const updateData: Partial<any> = {
          nome: data.nome,
          placa: data.placa,
          marca: data.marca,
          modelo: data.modelo,
          tipoCombustivel: data.tipoCombustivel,
          capacidadePassageiros: data.capacidadePassageiros,
          capacidadeCarga: data.capacidadeCarga,
          localizacaoAtual: data.localizacaoAtual,

          // Campos opcionais editáveis
          ...(data.cor && { cor: data.cor }),
          ...(data.proximaRevisao && { proximaRevisao: data.proximaRevisao }),
          ...(data.responsavelManutencao && { responsavelManutencao: data.responsavelManutencao }),
          ...(data.observacoes && { observacoes: data.observacoes }),
          ...(data.chassi && { chassi: data.chassi }),
          ...(data.renavam && { renavam: data.renavam }),
          ...(data.seguradora && { seguradora: data.seguradora })
        };

        console.log('🔄 [VEICULOS PAGE] Dados de update (apenas campos editáveis):', updateData);

        await updateVeiculo(modalState.entity.id, updateData);

        toast({
          title: "Veículo atualizado!",
          description: `O veículo foi atualizado com sucesso.`,
          variant: "default",
        });
      }

      closeModal();
    } catch (error: any) {
      console.error('❌ [VEICULOS PAGE] Erro ao salvar veículo:', error);

      toast({
        title: modalState.mode === 'create' ? "Erro ao criar veículo" : "Erro ao atualizar veículo",
        description: error.message || "Ocorreu um erro interno. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mapeamento completo baseado na documentação da API
  const getModalEntity = () => {
    const entity = modalState.entity;

    if (modalState.mode === 'create') {
      return {
        id: 0,
        nome: '',
        placa: '',
        marca: '',
        modelo: '',
        ano: new Date().getFullYear(), // Para o form
        cor: '',
        status: 'disponivel' as const,
        tipo: 'carro' as const,
        tipoCombustivel: 'gasolina' as const,
        capacidadePassageiros: 5,
        capacidadeCarga: 0,
        kmAtual: 0, // Para o form
        proximaRevisao: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        responsavelManutencao: '',
        localizacaoAtual: 'Garagem Principal',
        observacoes: '',
        chassi: '',
        renavam: '',
        seguradora: '',
        documentos: []
      };
    }

    // Para edit/view - mapear da API para o form
    if (entity) {
      console.log('🔍 [VEICULOS PAGE] Entity da API:', entity);
      console.log('🔍 [VEICULOS PAGE] Fields check:', {
        kmAtual: entity.kmAtual,
        quilometragem: entity.quilometragem,
        proximaRevisao: entity.proximaRevisao,
        ano: entity.ano,
        proximaRevisaoType: typeof entity.proximaRevisao,
        allEntityKeys: Object.keys(entity).sort()
      });

      return {
        id: entity.id,
        nome: entity.nome || '',
        placa: entity.placa || '',
        marca: entity.marca || '',
        modelo: entity.modelo || '',
        
        // ⭐ CAMPO PRINCIPAL: ano (form) ← ano (API)
        ano: entity.ano || new Date().getFullYear(),

        cor: entity.cor || '',
        status: entity.status || 'disponivel',
        tipo: entity.tipo || 'carro',
        tipoCombustivel: entity.tipoCombustivel || 'gasolina',
        capacidadePassageiros: entity.capacidadePassageiros || 5,
        capacidadeCarga: entity.capacidadeCarga || 0,

        // ⭐ CAMPO PRINCIPAL: kmAtual (form) ← multiple possible API fields
        kmAtual: entity.kmAtual || entity.quilometragem || 0,

        // Data fields - API pode retornar ISO com timestamp (2026-04-23 00:00:00.000)
        proximaRevisao: entity.proximaRevisao ?
          new Date(entity.proximaRevisao).toISOString().split('T')[0] : '',

        // Mapeamento de outros campos da API
        responsavelManutencao: entity.responsavelManutencao || '',
        localizacaoAtual: entity.localizacaoAtual || 'Garagem Principal',
        observacoes: entity.observacoes || '',
        
        // Campos de documentação
        chassi: entity.chassi || '',
        renavam: entity.renavam || '',
        seguradora: entity.seguradora || '',

        // Documentos vazios (carregados pelo componente)
        documentos: []
      };
    }

    return {};
  };
  // Calcular paginação
  const pagination = {
    page: filters.page || 1,
    limit: filters.limit || 10,
    total: totalVeiculos,
    totalPages: Math.ceil(totalVeiculos / (filters.limit || 10))
  };

  // Handler: Enviar para manutenção
  const handleEnviarManutencao = async (veiculo: VeiculoResponse) => {
    try {
      await updateStatus(veiculo.id, 'manutencao');

      toast({
        title: "Veículo em manutenção",
        description: `${veiculo.nome} foi enviado para manutenção.`,
        variant: "default",
      });
    } catch (error: any) {
      console.error('Erro ao enviar para manutenção:', error);

      toast({
        title: "Erro ao enviar para manutenção",
        description: error.message || "Ocorreu um erro interno. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Handler: Retornar da manutenção
  const handleRetornarManutencao = async (veiculo: VeiculoResponse) => {
    try {
      await updateStatus(veiculo.id, 'disponivel');

      toast({
        title: "Veículo disponível",
        description: `${veiculo.nome} retornou da manutenção e está disponível.`,
        variant: "default",
      });
    } catch (error: any) {
      console.error('Erro ao retornar da manutenção:', error);

      toast({
        title: "Erro ao retornar da manutenção",
        description: error.message || "Ocorreu um erro interno. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Handler: Agendar revisão
  const handleAgendarRevisao = useCallback((veiculo: VeiculoResponse) => {
    // Aqui você poderia abrir um modal de agendamento
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: `Agendamento de revisão para ${veiculo.nome} será implementado em breve.`,
      variant: "default",
    });
  }, []);

  // Ações customizadas
  const customActions: CustomAction<VeiculoResponse>[] = useMemo(() => [
    {
      key: 'manutencao',
      label: 'Manutenção',
      icon: <Wrench className="h-4 w-4" />,
      variant: 'secondary',
      condition: (veiculo) => veiculo.status === 'disponivel',
      handler: (veiculo) => handleEnviarManutencao(veiculo)
    },
    {
      key: 'retornar',
      label: 'Retornar',
      icon: <Car className="h-4 w-4" />,
      variant: 'default',
      condition: (veiculo) => veiculo.status === 'manutencao',
      handler: (veiculo) => handleRetornarManutencao(veiculo)
    },
    {
      key: 'revisao',
      label: 'Agendar Revisão',
      icon: <Calendar className="h-4 w-4" />,
      variant: 'outline',
      condition: (veiculo) => veiculo.status === 'disponivel',
      handler: (veiculo) => handleAgendarRevisao(veiculo)
    }
  ], [handleAgendarRevisao]);

  return (
    <Layout>
      <Layout.Main>
        <div className="flex flex-col h-full w-full">
          <TitleCard 
            title="Veículos da Frota" 
            description="Gerencie os veículos e viaturas da empresa" 
          />
          
          {/* Filtros e Ações */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <BaseFilters
                filters={filters}
                config={veiculosFilterConfig}
                onFilterChange={handleFilterChange}
              />
            </div>

            <div className="flex gap-2 shrink-0">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={loading}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>

              <Button
                onClick={() => openModal('create')}
                className="bg-primary hover:bg-primary/90"
                disabled={isSubmitting}
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo Veículo
              </Button>
            </div>
          </div>

          {/* Indicador de filtros ativos */}
          {Object.entries(filters).some(([key, value]) =>
            key !== 'page' && key !== 'limit' && value !== 'all' && value !== ''
          ) && (
            <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span>Filtros aplicados</span>
            </div>
          )}

          {/* Tabela */}
          <div className="flex-1 min-h-0">
            <BaseTable
              data={veiculos as any}
              columns={veiculosTableColumns as any}
              pagination={pagination}
              loading={loading}
              onPageChange={handlePageChange}
              onView={(v: any) => openModal('view', v)}
              onEdit={(v: any) => openModal('edit', v)}
              customActions={customActions as any}
              emptyMessage="Nenhum veículo encontrado"
              emptyIcon={<Car className="h-8 w-8 text-muted-foreground/50" />}
            />
          </div>
        </div>

        {/* Modal de veículos */}
        <BaseModal
          isOpen={modalState.isOpen}
          mode={modalState.mode}
          entity={getModalEntity() as any}
          title={`${modalState.mode === 'create' ? 'Novo' : modalState.mode === 'edit' ? 'Editar' : 'Visualizar'} Veículo`}
          icon={<Car className="h-5 w-5 text-blue-600" />}
          formFields={veiculosFormFields}
          onClose={closeModal}
          onSubmit={handleSubmit}
          width="w-[800px]"
          loading={isSubmitting}
          loadingText={modalState.mode === 'create' ? 'Criando veículo...' : 'Atualizando veículo...'}
          closeOnBackdropClick={true}
          closeOnEscape={true}
        />
      </Layout.Main>
    </Layout>
  );
}