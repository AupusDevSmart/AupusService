
// src/features/usuarios/components/UsuariosPage.tsx - CORRIGIDO
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/common/Layout';
import { TitleCard } from '@/components/common/title-card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { UsuariosTable } from './usuarios-table';
import { UsuariosFilters } from './usuarios-filters';
import { UsuarioModal } from './usuario-modal';
import { useUsuarios } from '../hooks/useUsuarios';
import { Usuario, ModalState } from '../types';

export function UsuariosPage() {
  const navigate = useNavigate();
  
  const {
    usuarios,
    loading,
    pagination,
    filters,
    handleFilterChange,
    handlePageChange,
    refetch
  } = useUsuarios();

  // Estado do modal de usuário
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    mode: 'create',
    usuario: null
  });

  const handleOpenModal = (mode: ModalState['mode'], usuario: Usuario | null = null): void => {
    setModalState({
      isOpen: true,
      mode,
      usuario
    });
  };

  const handleCloseModal = (): void => {
    setModalState({
      isOpen: false,
      mode: 'create',
      usuario: null
    });
  };

  const handleSuccess = (): void => {
    refetch();
    handleCloseModal();
  };

  // Handler para gerenciar plantas (só para proprietários)
  const handleGerenciarPlantas = (usuario: Usuario) => {
    console.log(`Gerenciando plantas do usuário ${usuario.id}: ${usuario.nome}`);
    
    // Fechar modal se estiver aberto
    if (modalState.isOpen) {
      handleCloseModal();
    }
    
    // Navegar para plantas filtradas
    navigate(`/plantas?usuarioId=${usuario.id}&usuarioNome=${encodeURIComponent(usuario.nome)}`);
  };

  return (
    <Layout>
      <Layout.Main>
        <div className="flex flex-col h-full w-full">
          <TitleCard
            title="Usuários"
            description="Gerencie os usuários cadastrados no sistema"
          />
          
          {/* Filtros e Botão de Cadastrar */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <UsuariosFilters 
                filters={filters}
                onFilterChange={handleFilterChange}
              />
            </div>
            <Button 
              onClick={() => handleOpenModal('create')}
              className="bg-primary hover:bg-primary/90 shrink-0"
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Usuário
            </Button>
          </div>

          {/* Tabela */}
          <div className="flex-1 min-h-0">
            <UsuariosTable
              usuarios={usuarios}
              loading={loading}
              pagination={pagination}
              onPageChange={handlePageChange}
              onView={(usuario) => handleOpenModal('view', usuario)}
              onEdit={(usuario) => handleOpenModal('edit', usuario)}
              onPlantasClick={handleGerenciarPlantas}
            />
          </div>
        </div>

        {/* Modal do Usuário */}
        <UsuarioModal
          isOpen={modalState.isOpen}
          mode={modalState.mode}
          usuario={modalState.usuario}
          onClose={handleCloseModal}
          onSuccess={handleSuccess}
          onGerenciarPlantas={handleGerenciarPlantas}
        />
      </Layout.Main>
    </Layout>
  );
}