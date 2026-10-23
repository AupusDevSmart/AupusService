// src/features/fornecedores/components/FornecedoresPage.tsx - SOLUÇÃO COMPLETA
import { useState, useEffect, useCallback } from 'react';
import { Layout } from '@/components/common/Layout';
import { TitleCard } from '@/components/common/title-card';
import { BaseTable } from '@/core';
import { BaseFilters } from '@/core';
import { BaseModal } from '@/core';
import { Button } from '@/components/ui/button';
import { Plus, Users } from 'lucide-react';
import { useGenericTable } from '@/hooks/useGenericTable';
import { useGenericModal } from '@/hooks/useGenericModal';
import { Fornecedor, FornecedoresFilters, type FornecedorFormData, type TipoFornecedor, type EnderecoFornecedor } from '../types';
import { fornecedoresTableColumns } from '../config/table-config';
import { fornecedoresFilterConfig } from '../config/filter-config';
import { getFornecedoresFormFields, fornecedoresFormFields } from '../config/form-config';

const initialFilters: FornecedoresFilters = {
  search: '',
  tipo: 'all',
  status: 'all',
  uf: 'all',
  page: 1,
  limit: 10
};

/** O fornecedor como o formulario o recebe: os dados de PF/PJ achatados no nivel de cima. */
type FornecedorDoFormulario = { id: string } & Partial<Omit<FornecedorFormData, 'endereco'>> & {
  endereco?: Partial<EnderecoFornecedor>;
};

/** O que o formulario entrega ao salvar (a pagina ainda nao tem API: so registra). */
type FormularioDoFornecedor = Partial<FornecedorFormData> & Record<string, unknown>;

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
  entity: FornecedorDoFormulario | null;
  onClose: () => void;
  onSubmit: (data: FormularioDoFornecedor) => void;
}) => {
  const [modalKey, setModalKey] = useState(0);
  const [currentFormFields, setCurrentFormFields] = useState(fornecedoresFormFields);
  const [localEntity, setLocalEntity] = useState(entity);

  // ✅ Callback para mudança de tipo
  const handleTypeChange = useCallback((novoTipo: TipoFornecedor) => {
    console.log('Tipo mudou para:', novoTipo);
    const newFields = getFornecedoresFormFields(novoTipo, handleTypeChange);
    setCurrentFormFields(newFields);
    setModalKey(prev => prev + 1); // ✅ Força re-render completo
    
    // ✅ Atualizar entidade local
    setLocalEntity((prev) => (prev ? {
      ...prev,
      tipo: novoTipo
    } : prev));
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
      onSubmit={(data: FormularioDoFornecedor) => Promise.resolve(onSubmit(data))}
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
    handlePageChange,
    handleLimitChange
  } = useGenericTable({
    data: [], // TODO: Integrar com API de fornecedores
    initialFilters,
    tabela: 'fornecedores',
    searchFields: ['email', 'telefone']
  });

  const { modalState, openModal, closeModal } = useGenericModal<Fornecedor>();

  const handleSuccess = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    closeModal();
  };

  const handleSubmit = async (data: FormularioDoFornecedor) => {
    console.log('Dados do fornecedor:', data);
    await new Promise(resolve => setTimeout(resolve, 1500));
    await handleSuccess();
  };

  // ✅ ENTIDADE LIMPA E CONSISTENTE
  const getModalEntity = (): FornecedorDoFormulario | null => {
    if (modalState.mode === 'create') {
      return {
        // Vazio: o cadastro ainda nao tem id e o BaseModal pede um (vazio vale "novo").
        id: '',
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
        <div className="flex flex-col w-full sm:h-full">
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

          <div className="sm:flex-1 sm:min-h-0">
            <BaseTable
              data={fornecedores}
              columns={fornecedoresTableColumns}
              pagination={pagination}
              loading={loading}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
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
          mode={modalState.mode as 'view' | 'create' | 'edit'}
          entity={getModalEntity()}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      </Layout.Main>
    </Layout>
  );
}