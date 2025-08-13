// src/features/reservas/components/ReservasPage.tsx
import { useState, useCallback, useMemo } from 'react';
import { Layout } from '@/components/common/Layout';
import { TitleCard } from '@/components/common/title-card';
import { BaseTable, CustomAction } from '@/components/common/base-table/BaseTable';
import { BaseFilters } from '@/components/common/base-filters/BaseFilters';
import { BaseModal } from '@/components/common/base-modal/BaseModal';
import { ReservaModal } from './ReservaModal';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useGenericTable } from '@/hooks/useGenericTable';
import { useGenericModal } from '@/hooks/useGenericModal';
import { ReservaVeiculo, ReservasFilters, ReservaFormData, Veiculo } from '../types';
import { reservasTableColumns } from '../config/table-config';
import { reservasFilterConfig } from '../config/filter-config';
import { useReservasVeiculos } from '../hooks/useReservasVeiculos';

// Mock data para veículos - você deve substituir pela sua fonte de dados real
const mockVeiculos: Veiculo[] = [
  {
    id: 1,
    nome: 'Strada Adventure',
    placa: 'ABC-1234',
    marca: 'Fiat',
    modelo: 'Strada Adventure CD',
    ano: 2023,
    status: 'disponivel',
    tipoCombustivel: 'flex',
    numeroPassageiros: 5,
    capacidadeCarga: 650,
    responsavel: 'João Silva',
    localizacaoAtual: 'Garagem Principal',
    quilometragem: 15000,
    valorDiaria: 120.00,
    criadoEm: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    nome: 'Hilux SR',
    placa: 'DEF-5678',
    marca: 'Toyota',
    modelo: 'Hilux SR 4x4',
    ano: 2022,
    status: 'disponivel',
    tipoCombustivel: 'diesel',
    numeroPassageiros: 5,
    capacidadeCarga: 1000,
    responsavel: 'Maria Santos',
    localizacaoAtual: 'Pátio Externo',
    quilometragem: 45000,
    valorDiaria: 180.00,
    criadoEm: '2024-01-01T00:00:00Z'
  },
  {
    id: 3,
    nome: 'Van Sprinter',
    placa: 'GHI-9012',
    marca: 'Mercedes',
    modelo: 'Sprinter 415',
    ano: 2021,
    status: 'manutencao',
    tipoCombustivel: 'diesel',
    numeroPassageiros: 15,
    capacidadeCarga: 800,
    responsavel: 'Carlos Lima',
    localizacaoAtual: 'Oficina',
    quilometragem: 80000,
    valorDiaria: 250.00,
    criadoEm: '2024-01-01T00:00:00Z'
  }
];

const initialFilters: ReservasFilters = {
  search: '',
  status: 'all',
  tipoSolicitante: 'all',
  responsavel: '',
  dataInicio: '',
  dataFim: '',
  page: 1,
  limit: 10
};

export function ReservasPage() {
  const { reservas, loading: hookLoading, criarReserva, editarReserva, cancelarReserva, finalizarReserva } = useReservasVeiculos();
  
  const {
    paginatedData: reservasPaginadas,
    pagination,
    filters,
    loading,
    setLoading,
    handleFilterChange,
    handlePageChange
  } = useGenericTable({
    data: reservas,
    initialFilters,
    searchFields: ['responsavel', 'finalidade', 'solicitanteId']
  });

  const { modalState, openModal, closeModal } = useGenericModal<ReservaVeiculo>();
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [reservaParaCancelar, setReservaParaCancelar] = useState<ReservaVeiculo | null>(null);
  const [motivoCancelamento, setMotivoCancelamento] = useState('');

  const handleSuccess = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    closeModal();
  };

  const handleSubmit = async (data: ReservaFormData) => {
    try {
      console.log('Dados da reserva:', data);
      
      if (modalState.mode === 'create') {
        await criarReserva(data);
      } else if (modalState.mode === 'edit' && modalState.entity) {
        await editarReserva(modalState.entity.id.toString(), data);
      }
      
      await handleSuccess();
    } catch (error) {
      console.error('Erro ao salvar reserva:', error);
      alert(error instanceof Error ? error.message : 'Erro ao salvar reserva');
    }
  };

  const handleCancelarReserva = useCallback((reserva: ReservaVeiculo) => {
    setReservaParaCancelar(reserva);
    setMotivoCancelamento('');
    setCancelModalOpen(true);
  }, []);

  const confirmarCancelamento = async () => {
    if (!reservaParaCancelar || !motivoCancelamento.trim()) return;

    try {
      await cancelarReserva(reservaParaCancelar.id.toString(), motivoCancelamento);
      setCancelModalOpen(false);
      setReservaParaCancelar(null);
      setMotivoCancelamento('');
    } catch (error) {
      console.error('Erro ao cancelar reserva:', error);
      alert(error instanceof Error ? error.message : 'Erro ao cancelar reserva');
    }
  };

  const handleFinalizarReserva = async (reserva: ReservaVeiculo) => {
    try {
      await finalizarReserva(reserva.id.toString(), 'Reserva finalizada normalmente');
    } catch (error) {
      console.error('Erro ao finalizar reserva:', error);
      alert(error instanceof Error ? error.message : 'Erro ao finalizar reserva');
    }
  };

  // Ações customizadas - usando useMemo para otimização
  const customActions: CustomAction<ReservaVeiculo>[] = useMemo(() => [
    {
      key: 'finalizar',
      label: 'Finalizar',
      icon: <CheckCircle className="h-4 w-4" />,
      variant: 'default',
      condition: (reserva) => reserva.status === 'ativa',
      handler: (reserva) => handleFinalizarReserva(reserva)
    },
    {
      key: 'cancelar',
      label: 'Cancelar',
      icon: <XCircle className="h-4 w-4" />,
      variant: 'destructive',
      condition: (reserva) => reserva.status === 'ativa',
      handler: (reserva) => handleCancelarReserva(reserva)
    },
    {
      key: 'reativar',
      label: 'Reativar',
      icon: <Clock className="h-4 w-4" />,
      variant: 'secondary',
      condition: (reserva) => reserva.status === 'cancelada',
      handler: (reserva) => {
        // Aqui você poderia implementar a reativação
        alert(`Reativando reserva ${reserva.id}`);
      }
    }
  ], [handleFinalizarReserva, handleCancelarReserva]);

  return (
    <Layout>
      <Layout.Main>
        <div className="flex flex-col h-full w-full">
          <TitleCard 
            title="Reservas de Veículos" 
            description="Gerencie as reservas de viaturas da empresa" 
          />
          
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <BaseFilters 
                filters={filters}
                config={reservasFilterConfig as any}
                onFilterChange={handleFilterChange}
              />
            </div>
            <Button 
              onClick={() => openModal('create')} 
              className="bg-primary hover:bg-primary/90 shrink-0"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Reserva
            </Button>
          </div>

          <div className="flex-1 min-h-0">
            <BaseTable
              data={reservasPaginadas}
              columns={reservasTableColumns}
              pagination={pagination}
              loading={loading || hookLoading}
              onPageChange={handlePageChange}
              onView={(r) => openModal('view', r)}
              onEdit={(r) => r.status === 'ativa' ? openModal('edit', r) : null}
              customActions={customActions}
              emptyMessage="Nenhuma reserva encontrada."
              emptyIcon={<Calendar className="h-8 w-8 text-muted-foreground/50" />}
            />
          </div>
        </div>

        {/* Modal principal de reservas com seletor de veículo */}
        <ReservaModal
          isOpen={modalState.isOpen}
          mode={modalState.mode as any}
          entity={modalState.entity}
          onClose={closeModal}
          onSubmit={handleSubmit}
          veiculos={mockVeiculos}
          reservas={reservas}
          reservaId={modalState.entity?.id?.toString()}
        />

        {/* Modal de cancelamento */}
        <BaseModal
          isOpen={cancelModalOpen}
          mode="edit"
          entity={{ id: 0, motivoCancelamento, criadoEm: new Date().toISOString() }}
          title="Cancelar Reserva"
          icon={<XCircle className="h-5 w-5 text-red-600" />}
          formFields={[
            {
              key: 'motivoCancelamento',
              label: 'Motivo do Cancelamento',
              type: 'textarea',
              required: true,
              placeholder: 'Descreva o motivo do cancelamento...'
            }
          ]}
          onClose={() => {
            setCancelModalOpen(false);
            setReservaParaCancelar(null);
            setMotivoCancelamento('');
          }}
          onSubmit={async (data) => {
            setMotivoCancelamento(data.motivoCancelamento);
            await confirmarCancelamento();
          }}
          width="w-[500px]"
        />
      </Layout.Main>
    </Layout>
  );
}