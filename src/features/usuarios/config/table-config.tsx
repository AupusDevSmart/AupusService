// src/features/usuarios/config/table-config.tsx
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  User, 
  BarChart3, 
  Wrench, 
  Shield, 
  UserCheck,
  Phone,
  Mail
} from 'lucide-react';
import { TableColumn } from '@/types/base';
import { Usuario } from '../types';

// ✅ Função para obter ícone do perfil
const getPerfilIcon = (perfil: string) => {
  const icons = {
    'Proprietário': Building2,
    'Analista': BarChart3,
    'Técnico': Wrench,
    'Administrador': Shield,
    'Técnico externo': UserCheck
  };
  const Icon = icons[perfil as keyof typeof icons] || User;
  return <Icon className="h-3 w-3 mr-1" />;
};

// ✅ Função para obter cor do perfil
const getPerfilColor = (perfil: string) => {
  const colors = {
    'Proprietário': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300',
    'Administrador': 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300',
    'Analista': 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300',
    'Técnico': 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300',
    'Técnico externo': 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-300'
  };
  return colors[perfil as keyof typeof colors] || 'bg-gray-50 text-gray-700 border-gray-200';
};

// ✅ Configuração das colunas da tabela
export const usuariosTableColumns: TableColumn<Usuario>[] = [
  {
    key: 'nome',
    label: 'Nome',
    sortable: true,
    render: (usuario) => (
      <div className="font-medium">
        {usuario.nome}
      </div>
    )
  },
  {
    key: 'status',
    label: 'Status',
    render: (usuario) => (
      <div className="flex justify-left">
        <Badge 
          variant="outline" 
          className={`w-16 justify-center ${usuario.status === 'Ativo' 
            ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300'
            : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300'
          }`}
        >
          {usuario.status}
        </Badge>
      </div>
    )
  },
  {
    key: 'tipo',
    label: 'Tipo',
    render: (usuario) => (
      <div className="flex justify-left">
        <Badge 
          variant="outline" 
          className={`w-32 justify-center ${getPerfilColor(usuario.tipo || usuario.perfil || '')}`}
        >
          {getPerfilIcon(usuario.tipo || usuario.perfil || '')}
          {usuario.tipo || usuario.perfil}
        </Badge>
      </div>
    )
  },
  {
    key: 'telefone',
    label: 'Telefone',
    hideOnMobile: true,
    render: (usuario) => (
      <div className="flex items-center gap-2">
        <Phone className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">
          {usuario.telefone || '-'}
        </span>
      </div>
    )
  },
  {
    key: 'email',
    label: 'Email',
    hideOnTablet: true,
    render: (usuario) => (
      <div className="flex items-center gap-2">
        <Mail className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm truncate max-w-48" title={usuario.email}>
          {usuario.email}
        </span>
      </div>
    )
  }
];