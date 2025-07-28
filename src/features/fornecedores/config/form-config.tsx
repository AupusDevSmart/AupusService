// src/features/fornecedores/config/form-config.tsx - SOLUÇÃO COMPLETA
import React from 'react';
import { FormField, FormFieldProps } from '@/types/base';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  User, 
  Plus, 
  X,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

// ✅ COMPONENTE CORRIGIDO: Seletor de Tipo com callback
const TipoFornecedorSelector = ({ value, onChange, disabled, onTypeChange }: FormFieldProps & { onTypeChange?: (tipo: string) => void }) => {
  const handleTipoChange = (novoTipo: 'pessoa_fisica' | 'pessoa_juridica') => {
    onChange(novoTipo);
    // ✅ Notificar mudança de tipo para o componente pai
    if (onTypeChange) {
      onTypeChange(novoTipo);
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">
        Tipo de Fornecedor <span className="text-red-500">*</span>
      </label>
      
      <div className="grid grid-cols-2 gap-3">
        <label 
          className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-muted/50 ${
            value === 'pessoa_juridica' 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
              : 'border-border'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input
            type="radio"
            name={`tipoFornecedor-${Date.now()}`} // ✅ Nome único
            value="pessoa_juridica"
            checked={value === 'pessoa_juridica'}
            onChange={() => handleTipoChange('pessoa_juridica')}
            disabled={disabled}
            className="sr-only"
          />
          <Building2 className="h-6 w-6 text-blue-600" />
          <div>
            <div className="font-medium">Pessoa Jurídica</div>
            <div className="text-xs text-muted-foreground">Empresa, CNPJ</div>
          </div>
        </label>
        
        <label 
          className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-muted/50 ${
            value === 'pessoa_fisica' 
              ? 'border-green-500 bg-green-50 dark:bg-green-950' 
              : 'border-border'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input
            type="radio"
            name={`tipoFornecedor-${Date.now()}`} // ✅ Nome único
            value="pessoa_fisica"
            checked={value === 'pessoa_fisica'}
            onChange={() => handleTipoChange('pessoa_fisica')}
            disabled={disabled}
            className="sr-only"
          />
          <User className="h-6 w-6 text-green-600" />
          <div>
            <div className="font-medium">Pessoa Física</div>
            <div className="text-xs text-muted-foreground">Indivíduo, CPF</div>
          </div>
        </label>
      </div>
    </div>
  );
};

// ✅ COMPONENTE CORRIGIDO: Status Selector - SOLUÇÃO DEFINITIVA
const StatusSelector = ({ value, onChange, disabled }: FormFieldProps) => {
  const currentStatus = value || 'ativo';

  const statusOptions = [
    { 
      value: 'ativo', 
      label: 'Ativo', 
      icon: CheckCircle,
      gradient: 'from-green-50 to-emerald-50',
      border: 'border-green-300',
      selectedBorder: 'border-green-500',
      text: 'text-green-700',
      iconColor: 'text-green-600',
      ring: 'focus:ring-green-500'
    },
    { 
      value: 'inativo', 
      label: 'Inativo', 
      icon: XCircle,
      gradient: 'from-gray-50 to-slate-50',
      border: 'border-gray-300',
      selectedBorder: 'border-gray-500',
      text: 'text-gray-700',
      iconColor: 'text-gray-500',
      ring: 'focus:ring-gray-500'
    },
    { 
      value: 'suspenso', 
      label: 'Suspenso', 
      icon: AlertCircle,
      gradient: 'from-red-50 to-rose-50',
      border: 'border-red-300',
      selectedBorder: 'border-red-500',
      text: 'text-red-700',
      iconColor: 'text-red-600',
      ring: 'focus:ring-red-500'
    }
  ];

  return (
    <div className="space-y-4">
      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        Status <span className="text-red-500">*</span>
      </label>
      
      <div className="grid grid-cols-3 gap-4">
        {statusOptions.map((option) => {
          const IconComponent = option.icon;
          const isSelected = currentStatus === option.value;
          
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => !disabled && onChange(option.value)}
              disabled={disabled}
              className={`
                relative flex flex-col items-center gap-2 p-4 rounded-xl border-2
                bg-gradient-to-br ${option.gradient}
                transition-all duration-300 ease-out
                ${isSelected 
                  ? `${option.selectedBorder} ${option.text} shadow-lg transform scale-105` 
                  : `${option.border} text-gray-500 hover:${option.text} hover:${option.selectedBorder} hover:shadow-md hover:scale-102`
                }
                ${disabled 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'cursor-pointer active:scale-95'
                }
                focus:outline-none focus:ring-2 ${option.ring} focus:ring-opacity-50
                group
              `}
            >
              {/* Indicador de seleção */}
              {isSelected && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full shadow-sm animate-pulse" />
              )}
              
              <IconComponent 
                className={`h-6 w-6 transition-all duration-300 ${
                  isSelected ? option.iconColor : 'text-gray-400 group-hover:' + option.iconColor.replace('text-', '')
                }`} 
              />
              <span className="text-sm font-medium transition-all duration-300">
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ✅ ENDEREÇO SIMPLIFICADO
const EnderecoSimples = ({ value, onChange, disabled }: FormFieldProps) => {
  const endereco = value || {};

  const updateEndereco = (campo: string, valor: string) => {
    onChange({
      ...endereco,
      [campo]: valor
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">CEP</label>
          <Input
            type="text"
            placeholder="00000-000"
            value={endereco.cep || ''}
            onChange={(e) => updateEndereco('cep', e.target.value)}
            disabled={disabled}
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">UF <span className="text-red-500">*</span></label>
          <Input
            type="text"
            placeholder="SP"
            value={endereco.uf || ''}
            onChange={(e) => updateEndereco('uf', e.target.value.toUpperCase())}
            disabled={disabled}
            maxLength={2}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Cidade <span className="text-red-500">*</span></label>
          <Input
            type="text"
            placeholder="São Paulo"
            value={endereco.cidade || ''}
            onChange={(e) => updateEndereco('cidade', e.target.value)}
            disabled={disabled}
            required
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Bairro <span className="text-red-500">*</span></label>
          <Input
            type="text"
            placeholder="Centro"
            value={endereco.bairro || ''}
            onChange={(e) => updateEndereco('bairro', e.target.value)}
            disabled={disabled}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium">Logradouro <span className="text-red-500">*</span></label>
          <Input
            type="text"
            placeholder="Rua, Avenida, etc."
            value={endereco.logradouro || ''}
            onChange={(e) => updateEndereco('logradouro', e.target.value)}
            disabled={disabled}
            required
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Número <span className="text-red-500">*</span></label>
          <Input
            type="text"
            placeholder="123"
            value={endereco.numero || ''}
            onChange={(e) => updateEndereco('numero', e.target.value)}
            disabled={disabled}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Complemento</label>
        <Input
          type="text"
          placeholder="Apto, Sala, etc."
          value={endereco.complemento || ''}
          onChange={(e) => updateEndereco('complemento', e.target.value)}
          disabled={disabled}
        />
      </div>
    </div>
  );
};

// ✅ GERENCIADOR DE MATERIAIS
const TiposMateriaisManager = ({ value, onChange, disabled }: FormFieldProps) => {
  const materiais: string[] = value || [];
  const [novoMaterial, setNovoMaterial] = React.useState('');

  const adicionarMaterial = () => {
    if (novoMaterial.trim() && !materiais.includes(novoMaterial.trim())) {
      onChange([...materiais, novoMaterial.trim()]);
      setNovoMaterial('');
    }
  };

  const removerMaterial = (index: number) => {
    onChange(materiais.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">
        Tipos de Materiais ou Serviços Fornecidos
      </label>
      
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Ex: Estruturas Metálicas, Soldas..."
          value={novoMaterial}
          onChange={(e) => setNovoMaterial(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), adicionarMaterial())}
          disabled={disabled}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={adicionarMaterial}
          disabled={disabled || !novoMaterial.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {materiais.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {materiais.map((material, index) => (
            <Badge key={index} variant="secondary" className="text-sm">
              {material}
              {!disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removerMaterial(index)}
                  className="h-4 w-4 p-0 ml-2 hover:bg-destructive hover:text-destructive-foreground"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

// ✅ FUNÇÃO HELPER: Criar campos dinâmicos baseados no tipo
const createFieldsForType = (tipo: 'pessoa_fisica' | 'pessoa_juridica'): FormField[] => {
  if (tipo === 'pessoa_juridica') {
    return [
      {
        key: 'razaoSocial',
        label: 'Razão Social',
        type: 'text',
        required: true,
        placeholder: 'Ex: Metalúrgica ABC Ltda',
        group: 'dados_especificos'
      },
      {
        key: 'nomeFantasia',
        label: 'Nome Fantasia',
        type: 'text',
        placeholder: 'Ex: ABC Metais',
        group: 'dados_especificos'
      },
      {
        key: 'cnpj',
        label: 'CNPJ',
        type: 'text',
        required: true,
        placeholder: '00.000.000/0000-00',
        validation: (value) => {
          if (!value) return null;
          const cleaned = value.replace(/\D/g, '');
          if (cleaned.length !== 14) return 'CNPJ deve ter 14 dígitos';
          return null;
        },
        group: 'dados_especificos'
      },
      {
        key: 'inscricaoEstadual',
        label: 'Inscrição Estadual',
        type: 'text',
        placeholder: '000.000.000.000',
        group: 'dados_especificos'
      },
      {
        key: 'nomeContato',
        label: 'Nome do Contato',
        type: 'text',
        required: true,
        placeholder: 'Ex: João Silva Santos',
        group: 'dados_especificos'
      },
      {
        key: 'tiposMateriais',
        label: 'Materiais/Serviços',
        type: 'custom',
        render: TiposMateriaisManager,
        group: 'dados_especificos'
      }
    ];
  } else {
    return [
      {
        key: 'nomeCompleto',
        label: 'Nome Completo',
        type: 'text',
        required: true,
        placeholder: 'Ex: Carlos Eduardo Oliveira',
        group: 'dados_especificos'
      },
      {
        key: 'cpf',
        label: 'CPF',
        type: 'text',
        required: true,
        placeholder: '000.000.000-00',
        validation: (value) => {
          if (!value) return null;
          const cleaned = value.replace(/\D/g, '');
          if (cleaned.length !== 11) return 'CPF deve ter 11 dígitos';
          return null;
        },
        group: 'dados_especificos'
      },
      {
        key: 'especialidade',
        label: 'Especialidade ou Tipo de Serviço',
        type: 'text',
        required: true,
        placeholder: 'Ex: Instalações Elétricas Industriais',
        group: 'dados_especificos'
      }
    ];
  }
};

// ✅ CAMPOS BASE (sempre mostrados) - COM CALLBACK PARA TIPO
const createCamposBase = (onTypeChange?: (tipo: string) => void): FormField[] => [
  {
    key: 'tipo',
    label: 'Tipo de Fornecedor',
    type: 'custom',
    required: true,
    render: (props) => <TipoFornecedorSelector {...props} onTypeChange={onTypeChange} />,
    group: 'tipo'
  },
  {
    key: 'email',
    label: 'E-mail',
    type: 'text',
    required: true,
    placeholder: 'contato@empresa.com.br',
    validation: (value) => {
      if (!value) return null;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) return 'E-mail inválido';
      return null;
    },
    group: 'contato'
  },
  {
    key: 'telefone',
    label: 'Telefone',
    type: 'text',
    required: true,
    placeholder: '(11) 9 8765-4321',
    group: 'contato'
  },
  {
    key: 'endereco',
    label: 'Endereço',
    type: 'custom',
    required: true,
    render: EnderecoSimples,
    group: 'endereco'
  },
  {
    key: 'status',
    label: 'Status',
    type: 'custom',
    required: true,
    render: StatusSelector,
    group: 'status'
  },
  {
    key: 'observacoes',
    label: 'Observações',
    type: 'textarea',
    placeholder: 'Observações sobre o fornecedor...',
    group: 'observacoes'
  }
];

// ✅ FUNÇÃO PRINCIPAL: Gerar campos baseados no tipo
export const getFornecedoresFormFields = (
  tipo: 'pessoa_fisica' | 'pessoa_juridica' = 'pessoa_juridica',
  onTypeChange?: (tipo: string) => void
): FormField[] => {
  const camposEspecificos = createFieldsForType(tipo);
  const camposBase = createCamposBase(onTypeChange);
  
  // Inserir campos específicos após o tipo e antes do contato
  const camposOrdenados = [
    camposBase[0], // tipo
    ...camposEspecificos, // campos específicos (PJ ou PF)
    ...camposBase.slice(1) // resto dos campos
  ];
  
  return camposOrdenados;
};

// ✅ EXPORT PADRÃO para compatibilidade
export const fornecedoresFormFields = getFornecedoresFormFields('pessoa_juridica');