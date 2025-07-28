// src/features/fornecedores/components/FornecedoresPage.tsx - SOLUÇÃO COMPLETA
import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from '@/components/common/Layout';
import { TitleCard } from '@/components/common/title-card';
import { BaseTable } from '@/components/common/base-table/BaseTable';
import { BaseFilters } from '@/components/common/base-filters/BaseFilters';
import { BaseModal } from '@/components/common/base-modal/BaseModal';
import { Button } from '@/components/ui/button';
import { Plus, Users } from 'lucide-react';
import { useGenericTable } from '@/hooks/useGenericTable';
import { useGenericModal } from '@/hooks/useGenericModal';
import { Fornecedor, FornecedoresFilters } from '../types';
import { fornecedoresTableColumns } from '../config/table-config';
import { fornecedoresFilterConfig } from '../config/filter-config';
import { getFornecedoresFormFields, fornecedoresFormFields } from '../config/form-config';
import { mockFornecedores } from '../data/mock-data';

const initialFilters: FornecedoresFilters = {
  search: '',
  tipo: 'all',
  status: 'all',
  uf: 'all',
  page: 1,
  limit: 10
};

// ✅ WRAPPER CUSTOMIZADO PARA O MODAL - SOLUÇÃO DEFINITIVA
const FornecedorModal = ({ 
  isOpen, 
  mode, 
  entity, 
  onClose, 
  onSubmit 
}: {
  isOpen: boolean;
  mode: 'create' | 'edit' | 'view';
  entity: any;
  onClose: () => void;
  onSubmit: (data: any) => void;
}) => {
  const [modalKey, setModalKey] = useState(0);
  const [currentFormFields, setCurrentFormFields] = useState(fornecedoresFormFields);
  const [localEntity, setLocalEntity] = useState(entity);

  // ✅ Callback para mudança de tipo
  const handleTypeChange = useCallback((novoTipo: string) => {
    console.log('Tipo mudou para:', novoTipo);
    const newFields = getFornecedoresFormFields(novoTipo as any, handleTypeChange);
    setCurrentFormFields(newFields);
    setModalKey(prev => prev + 1); // ✅ Força re-render completo
    
    // ✅ Atualizar entidade local
    setLocalEntity(prev => ({
      ...prev,
      tipo: novoTipo
    }));
  }, []);

  // ✅ Inicializar campos quando modal abre
  useEffect(() => {
    if (isOpen) {
      setLocalEntity(entity);
      const tipo = entity?.tipo || 'pessoa_juridica';
      const newFields = getFornecedoresFormFields(tipo, handleTypeChange);
      setCurrentFormFields(newFields);
      setModalKey(prev => prev + 1);
    }
  }, [isOpen, entity, handleTypeChange]);

  if (!isOpen) return null;

  return (
    <BaseModal
      key={modalKey} // ✅ Força re-mount quando tipo muda
      isOpen={isOpen}
      mode={mode}
      entity={localEntity}
      title={`${mode === 'create' ? 'Novo' : mode === 'edit' ? 'Editar' : 'Visualizar'} Fornecedor`}
      icon={<Users className="h-5 w-5 text-blue-600" />}
      formFields={currentFormFields}
      onClose={onClose}
      onSubmit={onSubmit}
      width="w-[800px]"
    />
  );
};

export function FornecedoresPage() {
  const {
    paginatedData: fornecedores,
    pagination,
    filters,
    loading,
    setLoading,
    handleFilterChange,
    handlePageChange
  } = useGenericTable({
    data: mockFornecedores,
    initialFilters,
    searchFields: ['email', 'telefone']
  });

  const { modalState, openModal, closeModal } = useGenericModal<Fornecedor>();

  const handleSuccess = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    closeModal();
  };

  const handleSubmit = async (data: any) => {
    console.log('Dados do fornecedor:', data);
    await new Promise(resolve => setTimeout(resolve, 1500));
    await handleSuccess();
  };

  // ✅ ENTIDADE LIMPA E CONSISTENTE
  const getModalEntity = () => {
    if (modalState.mode === 'create') {
      return {
        tipo: 'pessoa_juridica',
        status: 'ativo',
        endereco: {},
        tiposMateriais: []
      };
    }
    
    // Para view/edit, expandir dados
    const entity = modalState.entity;
    if (entity) {
      return {
        ...entity,
        // Expandir dados PJ se existirem
        ...(entity.dadosPJ && {
          razaoSocial: entity.dadosPJ.razaoSocial,
          nomeFantasia: entity.dadosPJ.nomeFantasia,
          cnpj: entity.dadosPJ.cnpj,
          inscricaoEstadual: entity.dadosPJ.inscricaoEstadual,
          nomeContato: entity.dadosPJ.nomeContato,
          tiposMateriais: entity.dadosPJ.tiposMateriais || []
        }),
        // Expandir dados PF se existirem
        ...(entity.dadosPF && {
          nomeCompleto: entity.dadosPF.nomeCompleto,
          cpf: entity.dadosPF.cpf,
          especialidade: entity.dadosPF.especialidade
        })
      };
    }
    return entity;
  };

  return (
    <Layout>
      <Layout.Main>
        <div className="flex flex-col h-full w-full">
          <TitleCard title="Fornecedores" description="Gerencie fornecedores PF e PJ" />
          
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <BaseFilters 
                filters={filters}
                config={fornecedoresFilterConfig}
                onFilterChange={handleFilterChange}
              />
            </div>
            <Button onClick={() => openModal('create')} className="bg-primary hover:bg-primary/90 shrink-0">
              <Plus className="mr-2 h-4 w-4" />
              Novo Fornecedor
            </Button>
          </div>

          <div className="flex-1 min-h-0">
            <BaseTable
              data={fornecedores}
              columns={fornecedoresTableColumns}
              pagination={pagination}
              loading={loading}
              onPageChange={handlePageChange}
              onView={(f) => openModal('view', f)}
              onEdit={(f) => openModal('edit', f)}
              emptyMessage="Nenhum fornecedor encontrado."
              emptyIcon={<Users className="h-8 w-8 text-muted-foreground/50" />}
            />
          </div>
        </div>

        {/* ✅ MODAL CUSTOMIZADO - SOLUÇÃO DEFINITIVA */}
        <FornecedorModal
          isOpen={modalState.isOpen}
          mode={modalState.mode}
          entity={getModalEntity()}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      </Layout.Main>
    </Layout>
  );
}