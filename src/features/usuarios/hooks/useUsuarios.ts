// src/features/usuarios/hooks/useUsuarios.ts
import { useGenericTable } from '@/hooks/useGenericTable';
import { Usuario, UsuariosFilters } from '../types';

// ✅ Mock data com controle de senha padrão
const mockUsuarios: Usuario[] = [
  {
    id: 1,
    nome: 'João Silva Santos',
    email: 'joao.silva@email.com',
    telefone: '(11) 99999-1234',
    instagram: '@joaosilva',
    tipo: 'Proprietário',
    status: 'Ativo',
    permissao: ['AreaDoProprietario', 'Dashboard', 'UnidadesConsumidoras'],
    primeiroAcesso: false, // Já alterou a senha
    ultimoLogin: '2024-07-08T08:30:00Z',
    plantas: 3,
    criadoEm: '2024-01-15T10:30:00Z',
    // Campos de compatibilidade
    perfil: 'Proprietário',
    razaoSocial: 'João Silva Santos',
    cnpjCpf: '123.456.789-10'
  },
  {
    id: 2,
    nome: 'Erick Analista',
    email: 'erick.analista@email.com',
    telefone: '(11) 98888-5678',
    tipo: 'Analista',
    status: 'Ativo',
    permissao: ['Dashboard', 'MonitoramentoConsumo', 'GeracaoEnergia'],
    primeiroAcesso: true, // Ainda precisa trocar senha
    senhaTemporaria: 'Aupus123!',
    criadoEm: '2024-01-20T14:15:00Z',
    perfil: 'Analista'
  },
  {
    id: 3,
    nome: 'Mateus Técnico',
    email: 'mateus.tecnico@email.com',
    telefone: '(11) 97777-9012',
    tipo: 'Técnico',
    status: 'Ativo',
    permissao: ['Equipamentos', 'Plantas', 'Dashboard'],
    primeiroAcesso: false,
    ultimoLogin: '2024-07-07T16:20:00Z',
    criadoEm: '2024-02-05T09:20:00Z',
    perfil: 'Técnico'
  },
  {
    id: 4,
    nome: 'Diego Administrador',
    email: 'diego.admin@email.com',
    telefone: '(11) 96666-3456',
    instagram: '@diego_admin',
    tipo: 'Adm',
    status: 'Ativo',
    permissao: ['Usuarios', 'Configuracoes', 'Dashboard', 'Financeiro', 'Organizacoes'],
    primeiroAcesso: false,
    ultimoLogin: '2024-07-08T09:15:00Z',
    criadoEm: '2024-02-10T16:45:00Z',
    perfil: 'Administrador'
  },
  {
    id: 5,
    nome: 'Mario Fornecedor',
    email: 'mario.fornecedor@empresa.com',
    telefone: '(11) 95555-7890',
    tipo: 'Fornecedor',
    status: 'Ativo',
    permissao: ['Dashboard', 'Equipamentos'],
    primeiroAcesso: false,
    ultimoLogin: '2024-07-06T14:30:00Z',
    criadoEm: '2024-02-18T15:10:00Z',
    perfil: 'Fornecedor'
  },
  {
    id: 6,
    nome: 'Maria Santos Oliveira',
    email: 'maria.santos@email.com',
    telefone: '(11) 94444-2345',
    instagram: '@maria_santos',
    tipo: 'Proprietário',
    status: 'Ativo',
    permissao: ['AreaDoProprietario', 'Dashboard', 'MinhasUsinas'],
    primeiroAcesso: false,
    ultimoLogin: '2024-07-05T10:45:00Z',
    plantas: 1,
    criadoEm: '2024-02-25T11:30:00Z',
    perfil: 'Proprietário',
    razaoSocial: 'Maria Santos Oliveira',
    cnpjCpf: '987.654.321-00'
  },
  {
    id: 7,
    nome: 'Carlos Técnico Externo',
    email: 'carlos.externo@email.com',
    telefone: '(11) 93333-6789',
    tipo: 'Técnico Externo',
    status: 'Inativo',
    permissao: ['Dashboard'],
    primeiroAcesso: true, // Nunca fez login
    senhaTemporaria: 'Aupus123!',
    criadoEm: '2024-03-01T08:45:00Z',
    perfil: 'Técnico externo'
  }
];

const initialFilters: UsuariosFilters = {
  search: '',
  status: 'all',
  tipo: 'all',
  page: 1,
  limit: 10
};

export function useUsuarios() {
  const {
    paginatedData: usuarios,
    pagination,
    filters,
    loading,
    setLoading,
    handleFilterChange,
    handlePageChange
  } = useGenericTable({
    data: mockUsuarios,
    initialFilters,
    searchFields: ['nome', 'email', 'telefone', 'instagram']
  });

  const refetch = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
  };

  return {
    usuarios,
    loading,
    pagination,
    filters,
    handleFilterChange,
    handlePageChange,
    refetch
  };
}