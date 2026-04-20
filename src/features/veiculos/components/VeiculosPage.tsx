// src/features/veiculos/components/VeiculosPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { Layout } from '@/components/common/Layout';
import { TitleCard } from '@/components/common/title-card';
import { BaseTable } from '@aupus/shared-pages';
import { BaseFilters } from '@aupus/shared-pages';
import { BaseModal } from '@aupus/shared-pages';
import { Plus, Car, RefreshCw, Filter } from 'lucide-react';
import { useGenericModal } from '@/hooks/useGenericModal';
import { useVeiculos } from '../hooks/useVeiculos';
import { useDocumentosVeiculos } from '../hooks/useDocumentosVeiculos';
import { veiculosFilterConfig } from '../config/filter-config';
import { veiculosFormFields } from '../config/form-config';
import { veiculosTableColumns } from '../config/table-config';
import { toast } from '@/hooks/use-toast';
import { CreateVeiculoRequest, VeiculosFilters } from '../types';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filters, setFilters] = useState<VeiculosFilters>(initialFilters);

  const {
    veiculos,
    totalVeiculos,
    loading,
    fetchVeiculos,
    createVeiculo,
    updateVeiculo,
    clearError
  } = useVeiculos({ autoFetch: false });

  const { modalState, openModal, closeModal } = useGenericModal<any>();
  const { uploadDocumento } = useDocumentosVeiculos();

  // Buscar veículos com filtros
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

  useEffect(() => {
    fetchVeiculosWithFilters(initialFilters);
  }, []);

  // Handlers de filtros e paginação
  const handleFilterChange = useCallback((newFilters: Partial<VeiculosFilters>) => {
    const updatedFilters = { ...filters, ...newFilters, page: newFilters.page || 1 };
    setFilters(updatedFilters);
    fetchVeiculosWithFilters(updatedFilters);
  }, [filters, fetchVeiculosWithFilters]);

  const handlePageChange = useCallback((newPage: number) => {
    handleFilterChange({ page: newPage });
  }, [handleFilterChange]);

  const handleRefresh = useCallback(() => {
    fetchVeiculosWithFilters(filters);
  }, [fetchVeiculosWithFilters, filters]);

  // Handler de submissão do formulário
  const handleSubmit = async (data: CreateVeiculoRequest) => {
    setIsSubmitting(true);

    try {
      const apiData: CreateVeiculoRequest = {
        nome: data.nome,
        placa: data.placa,
        marca: data.marca,
        modelo: data.modelo,
        ano: data.ano,
        status: data.status || 'disponivel',
        tipo: data.tipo,
        tipoCombustivel: data.tipoCombustivel,
        capacidadePassageiros: data.capacidadePassageiros,
        capacidadeCarga: data.capacidadeCarga,
        localizacaoAtual: data.localizacaoAtual,
        ...(data.cor && { cor: data.cor }),
        ...(data.kmAtual !== undefined && { kmAtual: data.kmAtual }),
        ...(data.proximaRevisao && { proximaRevisao: data.proximaRevisao }),
        ...(data.responsavelManutencao && { responsavelManutencao: data.responsavelManutencao }),
        ...(data.observacoes && { observacoes: data.observacoes }),
        ...(data.chassi && { chassi: data.chassi }),
        ...(data.renavam && { renavam: data.renavam }),
        ...(data.seguradora && { seguradora: data.seguradora })
      };

      if (modalState.mode === 'create') {
        const novoVeiculo = await createVeiculo(apiData);

        // Upload dos documentos
        let documentosUploadados = 0;
        let totalDocumentos = 0;

        const documentos = (data as CreateVeiculoRequest & { documentos?: Array<{ file: File; categoria: any; descricao?: string; dataVencimento?: string }> }).documentos;
        if (documentos && Array.isArray(documentos) && documentos.length > 0) {
          totalDocumentos = documentos.length;

          for (const documento of documentos) {
            try {
              await uploadDocumento(novoVeiculo.id, {
                file: documento.file,
                categoria: documento.categoria,
                descricao: documento.descricao,
                dataVencimento: documento.dataVencimento
              });
              documentosUploadados++;
            } catch (docError) {
              console.error('Erro ao fazer upload do documento:', documento.file.name, docError);
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
        const updateData: Partial<any> = {
          nome: data.nome,
          placa: data.placa,
          marca: data.marca,
          modelo: data.modelo,
          tipoCombustivel: data.tipoCombustivel,
          capacidadePassageiros: data.capacidadePassageiros,
          capacidadeCarga: data.capacidadeCarga,
          localizacaoAtual: data.localizacaoAtual,
          ...(data.cor && { cor: data.cor }),
          ...(data.proximaRevisao && { proximaRevisao: data.proximaRevisao }),
          ...(data.responsavelManutencao && { responsavelManutencao: data.responsavelManutencao }),
          ...(data.observacoes && { observacoes: data.observacoes }),
          ...(data.chassi && { chassi: data.chassi }),
          ...(data.renavam && { renavam: data.renavam }),
          ...(data.seguradora && { seguradora: data.seguradora })
        };

        await updateVeiculo(modalState.entity.id, updateData);

        toast({
          title: "Veículo atualizado!",
          description: `O veículo foi atualizado com sucesso.`,
          variant: "default",
        });
      }

      closeModal();
      fetchVeiculosWithFilters(filters);
    } catch (error: any) {
      console.error('Erro ao salvar veículo:', error);

      toast({
        title: modalState.mode === 'create' ? "Erro ao criar veículo" : "Erro ao atualizar veículo",
        description: error.message || "Ocorreu um erro interno. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mapeamento de entidade para o modal
  const getModalEntity = () => {
    const entity = modalState.entity;

    if (modalState.mode === 'create') {
      return {
        id: 0,
        nome: '',
        placa: '',
        marca: '',
        modelo: '',
        ano: new Date().getFullYear(),
        cor: '',
        status: 'disponivel' as const,
        tipo: 'carro' as const,
        tipoCombustivel: 'gasolina' as const,
        capacidadePassageiros: 5,
        capacidadeCarga: 0,
        kmAtual: 0,
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

    if (entity) {
      return {
        id: entity.id,
        nome: entity.nome || '',
        placa: entity.placa || '',
        marca: entity.marca || '',
        modelo: entity.modelo || '',
        ano: entity.ano || new Date().getFullYear(),
        cor: entity.cor || '',
        status: entity.status || 'disponivel',
        tipo: entity.tipo || 'carro',
        tipoCombustivel: entity.tipoCombustivel || 'gasolina',
        capacidadePassageiros: entity.capacidadePassageiros || 5,
        capacidadeCarga: entity.capacidadeCarga || 0,
        kmAtual: entity.kmAtual || entity.quilometragem || 0,
        proximaRevisao: entity.proximaRevisao ?
          new Date(entity.proximaRevisao).toISOString().split('T')[0] : '',
        responsavelManutencao: entity.responsavelManutencao || '',
        localizacaoAtual: entity.localizacaoAtual || 'Garagem Principal',
        observacoes: entity.observacoes || '',
        chassi: entity.chassi || '',
        renavam: entity.renavam || '',
        seguradora: entity.seguradora || '',
        documentos: []
      };
    }

    return {};
  };

  // Paginação
  const pagination = {
    page: filters.page || 1,
    limit: filters.limit || 10,
    total: totalVeiculos,
    totalPages: Math.ceil(totalVeiculos / (filters.limit || 10))
  };

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

            <div className="flex gap-2 flex-col sm:flex-row shrink-0">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="btn-minimal flex items-center justify-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </button>

              <button
                onClick={() => openModal('create')}
                disabled={isSubmitting}
                className="btn-minimal-primary flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Novo Veículo
              </button>
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
