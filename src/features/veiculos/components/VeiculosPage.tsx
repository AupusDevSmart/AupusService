// src/features/veiculos/components/VeiculosPage.tsx
import React, { useState, useMemo } from 'react';
import { Layout } from '@/components/common/Layout';
import { TitleCard } from '@/components/common/title-card';
import { BaseTable, CustomAction } from '@/components/common/base-table/BaseTable';
import { BaseFilters } from '@/components/common/base-filters/BaseFilters';
import { BaseModal } from '@/components/common/base-modal/BaseModal';
import { Button } from '@/components/ui/button';
import { Plus, Car, Wrench, Calendar } from 'lucide-react';
import { useGenericTable } from '@/hooks/useGenericTable';
import { useGenericModal } from '@/hooks/useGenericModal';
import { Veiculo, VeiculosFilters, VeiculoFormData } from '../../reservas/types';
import { veiculosTableColumns } from '../config/table-config';
import { veiculosFilterConfig } from '../config/filter-config';
import { veiculosFormFields } from '../config/form-config';
import { mockVeiculos } from '../data/mock-data';

const initialFilters: VeiculosFilters = {
  search: '',
  status: 'all',
  tipo: 'all',
  tipoCombustivel: 'all',
  marca: 'all',
  page: 1,
  limit: 10
};

export function VeiculosPage() {
  const [veiculos, setVeiculos] = useState<Veiculo[]>(mockVeiculos);
  
  const {
    paginatedData: veiculosPaginados,
    pagination,
    filters,
    loading,
    setLoading,
    handleFilterChange,
    handlePageChange
  } = useGenericTable({
    data: veiculos,
    initialFilters,
    searchFields: ['nome', 'placa', 'marca', 'modelo']
  });

  const { modalState, openModal, closeModal } = useGenericModal<Veiculo>();

  const handleSuccess = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    closeModal();
  };

  const handleSubmit = async (data: VeiculoFormData) => {
    try {
      console.log('Dados do veículo:', data);
      
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (modalState.mode === 'create') {
        const novoVeiculo: Veiculo = {
          id: Date.now(),
          criadoEm: new Date().toISOString(),
          ...data
        };
        setVeiculos(prev => [...prev, novoVeiculo]);
      } else if (modalState.mode === 'edit' && modalState.entity) {
        setVeiculos(prev => 
          prev.map(v => v.id === modalState.entity!.id ? { ...modalState.entity!, ...data } : v)
        );
      }
      
      await handleSuccess();
    } catch (error) {
      console.error('Erro ao salvar veículo:', error);
      alert('Erro ao salvar veículo');
    }
  };

  // Entidade limpa para o modal
  const getModalEntity = () => {
    if (modalState.mode === 'create') {
      return {
        status: 'disponivel',
        tipo: 'carro',
        tipoCombustivel: 'gasolina',
        capacidadePassageiros: 5,
        kmAtual: 0,
        proximaRevisao: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 dias
        ano: new Date().getFullYear()
      };
    }
    return modalState.entity;
  };

  // Ações customizadas - usando useMemo para otimização
  const customActions: CustomAction<Veiculo>[] = useMemo(() => [
    {
      key: 'manutencao',
      label: 'Manutenção',
      icon: <Wrench className="h-4 w-4" />,
      variant: 'secondary',
      condition: (veiculo) => veiculo.status === 'disponivel',
      handler: (veiculo) => {
        setVeiculos(prev => 
          prev.map(v => 
            v.id === veiculo.id 
              ? { ...v, status: 'manutencao' as const, localizacaoAtual: 'Em Manutenção' }
              : v
          )
        );
      }
    },
    {
      key: 'retornar',
      label: 'Retornar',
      icon: <Car className="h-4 w-4" />,
      variant: 'default',
      condition: (veiculo) => veiculo.status === 'manutencao',
      handler: (veiculo) => {
        setVeiculos(prev => 
          prev.map(v => 
            v.id === veiculo.id 
              ? { ...v, status: 'disponivel' as const, localizacaoAtual: 'Garagem Principal' }
              : v
          )
        );
      }
    },
    {
      key: 'revisao',
      label: 'Agendar Revisão',
      icon: <Calendar className="h-4 w-4" />,
      variant: 'outline',
      condition: (veiculo) => veiculo.status === 'disponivel',
      handler: (veiculo) => {
        // Aqui você poderia abrir um modal de agendamento
        alert(`Agendando revisão para ${veiculo.nome || veiculo.placa}`);
      }
    }
  ], [setVeiculos]);

  return (
    <Layout>
      <Layout.Main>
        <div className="flex flex-col h-full w-full">
          <TitleCard 
            title="Veículos da Frota" 
            description="Gerencie os veículos e viaturas da empresa" 
          />
          
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <BaseFilters 
                filters={filters}
                config={veiculosFilterConfig}
                onFilterChange={handleFilterChange}
              />
            </div>
            <Button 
              onClick={() => openModal('create')} 
              className="bg-primary hover:bg-primary/90 shrink-0"
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Veículo
            </Button>
          </div>

          <div className="flex-1 min-h-0">
            <BaseTable
              data={veiculosPaginados}
              columns={veiculosTableColumns}
              pagination={pagination}
              loading={loading}
              onPageChange={handlePageChange}
              onView={(v) => openModal('view', v)}
              onEdit={(v) => openModal('edit', v)}
              customActions={customActions}
              emptyMessage="Nenhum veículo encontrado."
              emptyIcon={<Car className="h-8 w-8 text-muted-foreground/50" />}
            />
          </div>
        </div>

        {/* Modal de veículos */}
        <BaseModal
          isOpen={modalState.isOpen}
          mode={modalState.mode}
          entity={getModalEntity()}
          title={`${modalState.mode === 'create' ? 'Novo' : modalState.mode === 'edit' ? 'Editar' : 'Visualizar'} Veículo`}
          icon={<Car className="h-5 w-5 text-blue-600" />}
          formFields={veiculosFormFields}
          onClose={closeModal}
          onSubmit={handleSubmit}
          width="w-[800px]"
          readOnly={modalState.mode === 'view'}
        />
      </Layout.Main>
    </Layout>
  );
}