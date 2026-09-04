// src/features/usuarios/components/usuarios-table.tsx
// Removed unused React import
import { BaseTable } from '@/core/components/common/base-table/BaseTable';
import { Users } from 'lucide-react';
import { Usuario, Pagination } from '../types';
import { usuariosTableColumns } from '../config/table-config';

interface UsuariosTableProps {
  usuarios: Usuario[];
  loading: boolean;
  pagination: Pagination;
  onPageChange: (page: number) => void;
  onView: (usuario: Usuario) => void;
  onEdit: (usuario: Usuario) => void;
  onPlantasClick: (usuario: Usuario) => void; // ✅ Mantido para compatibilidade mas não usado na tabela
  /** Acoes extras de linha (ex.: compartilhar com o outro produto). */
  customActions?: any[];
}

export function UsuariosTable({ 
  usuarios, 
  loading, 
  pagination, 
  onPageChange, 
  onView, 
  onEdit,
  onPlantasClick: _onPlantasClick, // ✅ Recebido mas não usado - só pelo modal
  customActions,
}: UsuariosTableProps) {

  return (
    <BaseTable
      data={usuarios}
      columns={usuariosTableColumns}
      pagination={pagination}
      loading={loading}
      onPageChange={onPageChange}
      onView={onView}
      onEdit={onEdit}
      customActions={customActions}
      emptyMessage="Nenhum usuário encontrado."
      emptyIcon={<Users className="h-8 w-8 text-muted-foreground/50" />}
    />
  );
}