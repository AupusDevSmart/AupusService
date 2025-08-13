// src/features/usuarios/config/form-config.tsx
import { FormField } from '@/types/base';
import { Permissao } from '@/types/dtos/usuarios-dto';
import { Checkbox } from '@/components/ui/checkbox';
import { agruparPermissoesPorCategoria } from '../utils/permissoes-utils';

// ✅ Opções de tipo de usuário
const TIPOS_USUARIO = [
  { value: 'Proprietário', label: 'Proprietário' },
  { value: 'Analista', label: 'Analista' },
  { value: 'Adm', label: 'Administrador' },
  { value: 'Técnico', label: 'Técnico' },
  { value: 'Fornecedor', label: 'Fornecedor' },
  { value: 'Técnico Externo', label: 'Técnico Externo' }
];

// ✅ Componente customizado para seleção de permissões - AUTOMATIZADO
const PermissoesSelector = ({ value, onChange, disabled }: any) => {
  const permissoesSelecionadas = value || [];
  
  const handlePermissaoChange = (permissao: Permissao, checked: boolean) => {
    let novasPermissoes;
    if (checked) {
      novasPermissoes = [...permissoesSelecionadas, permissao];
    } else {
      novasPermissoes = permissoesSelecionadas.filter((p: Permissao) => p !== permissao);
    }
    onChange(novasPermissoes);
  };

  // ✅ AUTOMATIZADO: Obtém permissões automaticamente
  const gruposPermissoes = agruparPermissoesPorCategoria();

  return (
    <div className="space-y-4">   
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-64 overflow-y-auto border rounded-lg p-4">
        {Object.entries(gruposPermissoes).map(([grupo, permissoes]) => (
          <div key={grupo} className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground border-b pb-1">
              {grupo}
            </h4>
            {permissoes.map((permissao) => (
              <div key={permissao.value} className="flex items-center space-x-2">
                <Checkbox
                  id={permissao.value}
                  checked={permissoesSelecionadas.includes(permissao.value)}
                  onCheckedChange={(checked) => handlePermissaoChange(permissao.value, !!checked)}
                  disabled={disabled}
                />
                <label 
                  htmlFor={permissao.value}
                  className="text-sm cursor-pointer"
                >
                  {permissao.label}
                </label>
              </div>
            ))}
          </div>
        ))}
      </div>
      
      <div className="text-xs text-muted-foreground">
        {permissoesSelecionadas.length} permissão(ões) selecionada(s)
      </div>
    </div>
  );
};

export const usuariosFormFields: FormField[] = [
  // Informações Básicas
  {
    key: 'nome',
    label: 'Nome Completo',
    type: 'text',
    required: true,
    placeholder: 'Ex: João Silva Santos',
  },
  {
    key: 'email',
    label: 'E-mail',
    type: 'text',
    required: true,
    placeholder: 'joao@email.com',
    validation: (value) => {
      if (!value) return null;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(String(value))) {
        return 'E-mail deve ter um formato válido';
      }
      return null;
    },
  },
  {
    key: 'telefone',
    label: 'Telefone',
    type: 'text',
    required: true,
    placeholder: '(11) 99999-9999',
    group: 'informacoes_basicas'
  },
  {
    key: 'instagram',
    label: 'Instagram',
    type: 'text',
    placeholder: '@usuario',
  },
  
  // Configurações do Sistema
  {
    key: 'tipo',
    label: 'Tipo de Usuário',
    type: 'select',
    required: true,
    options: TIPOS_USUARIO,
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    required: true,
    options: [
      { value: 'Ativo', label: 'Ativo' },
      { value: 'Inativo', label: 'Inativo' }
    ],
  },
  {
    key: 'permissao',
    label: 'Permissões',
    type: 'custom',
    required: true,
    render: PermissoesSelector,
  }
  
  // ✅ REMOVIDO: Campo de senha manual
  // O usuário será criado com senha padrão "Aupus123!" 
  // e será solicitado a alterar no primeiro acesso
];