
// src/features/usuarios/components/UsuariosPage.tsx - CORRIGIDO
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/core/components/common/Layout';
import { TitleCard } from '@/core/components/common/TitleCard';
import { Plus } from 'lucide-react';
import { UsuariosTable } from './usuarios-table';
import { UsuariosFilters } from './usuarios-filters';
import { UsuarioModal } from './usuario-modal';
import { useUsuarios } from '@/core/context/hooks';
import { useAcoesDeCompartilhamento } from '@/core/features/sincronizacao';
import { Usuario, ModalState } from '../types';
import { PlanilhaDoCadastro } from '@/components/common/PlanilhaDoCadastro';
import { useUserStore } from '@/store/useUserStore';
import { exportarUsuarios, lerUsuarios } from '../utils/planilha';

export function UsuariosPage() {
  const navigate = useNavigate();
  const { hasPermission } = useUserStore();
  // Criar: quem pode criar ao menos um tipo; editar: quem gerencia usuários (o
  // backend ainda confere a hierarquia de papéis em cada caso).
  const podeCriar = hasPermission(
    'usuarios.create_operador',
    'usuarios.create_proprietario',
    'usuarios.create_analista',
    'usuarios.create_gerente',
    'usuarios.create_admin',
  );
  const podeEditar = hasPermission('usuarios.manage');

  const {
    usuarios,
    loading,
    error,
    pagination,
    filters,
    handleFilterChange,
    handlePageChange,
    handleLimitChange,
    refetch
  } = useUsuarios();

  // Usuario e o topo da hierarquia: nao depende de nada, entao a previa dele
  // sempre vem vazia. A acao existe do mesmo jeito — e por ela que um usuario
  // passa a existir no outro produto sem precisar de uma planta como carona.
  const compartilhamento = useAcoesDeCompartilhamento({
    recurso: 'usuarios',
    registros: usuarios,
  });

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
    // Fechar modal se estiver aberto
    if (modalState.isOpen) {
      handleCloseModal();
    }

    // A rota é /cadastros/plantas; /plantas não existe e cairia em tela branca.
    navigate(`/cadastros/plantas?proprietarioId=${usuario.id}&proprietarioNome=${encodeURIComponent(usuario.nome)}`);
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
          <div className="flex flex-col lg:flex-row gap-3 md:gap-4 mb-4 md:mb-6 lg:items-start">
            <div className="flex-1">
              <UsuariosFilters
                filters={filters}
                onFilterChange={handleFilterChange}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
              <PlanilhaDoCadastro
                cadastro="usuarios"
                titulo="Usuários"
                exportar={() =>
                  exportarUsuarios({
                    search: filters.search || undefined,
                    status: filters.status && filters.status !== 'all' ? filters.status : undefined,
                    role: filters.role && filters.role !== 'all' ? filters.role : undefined,
                  })
                }
                ler={lerUsuarios}
                aoImportar={refetch}
                podeImportar={podeCriar || podeEditar}
                aviso="Usuário compartilhado com o NexOn: o que você confirmar aqui é replicado lá. Senha e permissões diretas não passam pela planilha."
              />
              {podeCriar && (
                <button
                  onClick={() => handleOpenModal('create')}
                  className="btn-minimal-primary w-full lg:w-auto lg:mt-0 whitespace-nowrap"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  <span>Novo Usuário</span>
                </button>
              )}
            </div>
          </div>

          {/* Tabela */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <UsuariosTable
              usuarios={usuarios}
              loading={loading}
              pagination={pagination}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
              onView={(usuario) => handleOpenModal('view', usuario)}
              onEdit={podeEditar ? (usuario) => handleOpenModal('edit', usuario) : undefined}
              onPlantasClick={handleGerenciarPlantas}
              customActions={compartilhamento.acoes}
            />
          </div>
        </div>

        {compartilhamento.dialogo}

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