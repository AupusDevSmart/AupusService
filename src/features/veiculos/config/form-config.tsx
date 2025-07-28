// src/features/veiculos/config/form-config.tsx
import React from 'react';
import { FormField, FormFieldProps } from '@/types/base';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Car, 
  FileText, 
  Upload, 
  X, 
  Plus, 
  Calendar,
  DollarSign,
  AlertTriangle
} from 'lucide-react';
import { DocumentacaoVeiculo, TipoCombustivel, StatusVeiculo } from '../types';

// ✅ COMPONENTE: Gerenciador de Documentação
const DocumentacaoManager = ({ value, onChange, disabled }: FormFieldProps) => {
  const documentacao: DocumentacaoVeiculo[] = value || [];

  const adicionarDocumento = () => {
    const novoDoc: DocumentacaoVeiculo = {
      tipo: 'ipva',
      descricao: '',
      dataVencimento: '',
      valor: 0,
      observacoes: ''
    };
    onChange([...documentacao, novoDoc]);
  };

  const removerDocumento = (index: number) => {
    const novaDocs = documentacao.filter((_, i) => i !== index);
    onChange(novaDocs);
  };

  const atualizarDocumento = (index: number, campo: keyof DocumentacaoVeiculo, valor: any) => {
    const novaDocs = documentacao.map((doc, i) => 
      i === index ? { ...doc, [campo]: valor } : doc
    );
    onChange(novaDocs);
  };

  const getTipoLabel = (tipo: string) => {
    const tipos = {
      ipva: 'IPVA',
      seguro: 'Seguro',
      licenciamento: 'Licenciamento',
      revisao: 'Revisão',
      outros: 'Outros'
    };
    return tipos[tipo] || tipo;
  };

  const getTipoBadgeColor = (tipo: string) => {
    const cores = {
      ipva: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      seguro: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      licenciamento: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      revisao: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      outros: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    };
    return cores[tipo] || cores.outros;
  };

  const verificarVencimento = (dataVencimento: string) => {
    if (!dataVencimento) return null;
    
    const hoje = new Date();
    const vencimento = new Date(dataVencimento);
    const diasRestantes = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diasRestantes < 0) {
      return { tipo: 'vencido', dias: Math.abs(diasRestantes) };
    } else if (diasRestantes <= 30) {
      return { tipo: 'vencendo', dias: diasRestantes };
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={adicionarDocumento}
          disabled={disabled}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Adicionar Documento
        </Button>
      </div>

      {documentacao.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Nenhum documento adicionado</p>
          <p className="text-xs">Clique em "Adicionar Documento" para começar</p>
        </div>
      ) : (
        <div className="space-y-4">
          {documentacao.map((doc, index) => {
            const alerta = verificarVencimento(doc.dataVencimento);
            
            return (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={getTipoBadgeColor(doc.tipo)}>
                      {getTipoLabel(doc.tipo)}
                    </Badge>
                    {alerta && (
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <span className="text-xs text-amber-600 dark:text-amber-400">
                          {alerta.tipo === 'vencido' 
                            ? `Vencido há ${alerta.dias} dias`
                            : `Vence em ${alerta.dias} dias`
                          }
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removerDocumento(index)}
                    disabled={disabled}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Tipo</label>
                    <select
                      value={doc.tipo}
                      onChange={(e) => atualizarDocumento(index, 'tipo', e.target.value)}
                      disabled={disabled}
                      className="w-full px-3 py-2 text-sm border border-input bg-background rounded-md"
                    >
                      <option value="ipva">IPVA</option>
                      <option value="seguro">Seguro</option>
                      <option value="licenciamento">Licenciamento</option>
                      <option value="revisao">Revisão</option>
                      <option value="outros">Outros</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium">Descrição</label>
                    <Input
                      type="text"
                      placeholder="Ex: IPVA 2024"
                      value={doc.descricao}
                      onChange={(e) => atualizarDocumento(index, 'descricao', e.target.value)}
                      disabled={disabled}
                      className="text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium">Data de Vencimento</label>
                    <Input
                      type="date"
                      value={doc.dataVencimento}
                      onChange={(e) => atualizarDocumento(index, 'dataVencimento', e.target.value)}
                      disabled={disabled}
                      className="text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium">Valor (R$)</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={doc.valor || ''}
                      onChange={(e) => atualizarDocumento(index, 'valor', parseFloat(e.target.value) || 0)}
                      disabled={disabled}
                      className="text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium">Observações</label>
                  <Input
                    type="text"
                    placeholder="Observações adicionais..."
                    value={doc.observacoes || ''}
                    onChange={(e) => atualizarDocumento(index, 'observacoes', e.target.value)}
                    disabled={disabled}
                    className="text-sm"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {documentacao.length > 0 && (
        <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded">
          💡 <strong>Dica:</strong> Mantenha a documentação sempre atualizada para evitar problemas legais
        </div>
      )}
    </div>
  );
};

// ✅ COMPONENTE: Upload de Foto
const FotoUpload = ({ value, onChange, disabled }: FormFieldProps) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Simular upload - em produção você faria upload real para storage
      const reader = new FileReader();
      reader.onload = (e) => {
        onChange(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removerFoto = () => {
    onChange('');
  };

  return (
    <div className="space-y-2">
      {value ? (
        <div className="space-y-3">
          <div className="relative inline-block">
            <img 
              src={value} 
              alt="Foto do veículo" 
              className="w-32 h-24 object-cover rounded-lg border"
            />
            {!disabled && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={removerFoto}
                className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Foto carregada com sucesso
          </p>
        </div>
      ) : (
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-2">
            Clique para adicionar uma foto do veículo
          </p>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={disabled}
            className="hidden"
            id="foto-upload"
          />
          <label
            htmlFor="foto-upload"
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm border rounded-md cursor-pointer hover:bg-muted ${
              disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Upload className="h-4 w-4" />
            Selecionar Foto
          </label>
          <p className="text-xs text-muted-foreground mt-2">
            PNG, JPG até 5MB
          </p>
        </div>
      )}
    </div>
  );
};

export const veiculosFormFields: FormField[] = [
  // Informações Básicas
  {
    key: 'nome',
    label: 'Nome do Veículo',
    type: 'text',
    required: true,
    placeholder: 'Ex: Caminhonete 4x4 Toyota',
  },
  {
    key: 'tipo',
    label: 'Tipo',
    type: 'select',
    required: true,
    options: [
      { value: 'veiculo', label: 'Veículo' }
    ],
  },
  {
    key: 'codigoPatrimonial',
    label: 'Código Patrimonial',
    type: 'text',
    required: true,
    placeholder: 'Ex: VEI-001',
  },
  {
    key: 'placa',
    label: 'Placa',
    type: 'text',
    required: true,
    placeholder: 'Ex: ABC-1234',
    validation: (value) => {
      if (!value) return null;
      const placaRegex = /^[A-Z]{3}-\d{4}$/;
      if (!placaRegex.test(value.toUpperCase())) {
        return 'Formato inválido. Use ABC-1234';
      }
      return null;
    },
  },

  // Especificações do Veículo
  {
    key: 'marca',
    label: 'Marca',
    type: 'text',
    required: true,
    placeholder: 'Ex: Toyota, Ford, Volkswagen',
  },
  {
    key: 'modelo',
    label: 'Modelo',
    type: 'text',
    required: true,
    placeholder: 'Ex: Hilux CD 4x4',
  },
  {
    key: 'anoFabricacao',
    label: 'Ano de Fabricação',
    type: 'text',
    required: true,
    placeholder: 'Ex: 2023',
    validation: (value) => {
      if (!value) return null;
      const ano = parseInt(value);
      const anoAtual = new Date().getFullYear();
      if (ano < 1900 || ano > anoAtual + 1) {
        return `Ano deve estar entre 1900 e ${anoAtual + 1}`;
      }
      return null;
    },
  },
  {
    key: 'tipoCombustivel',
    label: 'Tipo de Combustível',
    type: 'select',
    required: true,
    options: [
      { value: 'gasolina', label: 'Gasolina' },
      { value: 'etanol', label: 'Etanol' },
      { value: 'diesel', label: 'Diesel' },
      { value: 'flex', label: 'Flex (Gasolina/Etanol)' },
      { value: 'eletrico', label: 'Elétrico' },
      { value: 'hibrido', label: 'Híbrido' },
      { value: 'gnv', label: 'GNV' }
    ],
  },
  {
    key: 'capacidadeCarga',
    label: 'Capacidade de Carga (kg)',
    type: 'text',
    required: true,
    placeholder: 'Ex: 1000',
    validation: (value) => {
      if (!value) return null;
      const capacidade = parseFloat(value);
      if (capacidade <= 0) {
        return 'Capacidade deve ser maior que zero';
      }
      return null;
    },
  },
  {
    key: 'autonomiaMedia',
    label: 'Autonomia Média (km/l)',
    type: 'text',
    required: true,
    placeholder: 'Ex: 12.5 (para elétrico use 0)',
    validation: (value) => {
      if (!value) return null;
      const autonomia = parseFloat(value);
      if (autonomia < 0) {
        return 'Autonomia não pode ser negativa';
      }
      return null;
    },
  },
  {
    key: 'quilometragem',
    label: 'Quilometragem Atual (km)',
    type: 'text',
    required: false,
    placeholder: 'Ex: 45000',
  },

  // Informações Operacionais
  {
    key: 'valorDiaria',
    label: 'Valor da Diária (R$)',
    type: 'text',
    required: true,
    placeholder: 'Ex: 250.00',
    validation: (value) => {
      if (!value) return null;
      const valor = parseFloat(value);
      if (valor <= 0) {
        return 'Valor deve ser maior que zero';
      }
      return null;
    },
  },
  {
    key: 'localizacaoAtual',
    label: 'Localização Atual',
    type: 'text',
    required: true,
    placeholder: 'Ex: Planta Industrial São Paulo - Pátio A',
  },
  {
    key: 'responsavel',
    label: 'Responsável',
    type: 'text',
    required: true,
    placeholder: 'Ex: João Silva',
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    required: true,
    options: [
      { value: 'disponivel', label: 'Disponível' },
      { value: 'em_uso', label: 'Em Uso' },
      { value: 'manutencao', label: 'Em Manutenção' },
      { value: 'inativo', label: 'Inativo' }
    ],
  },

  // Documentação
  {
    key: 'documentacao',
    label: 'Documentação',
    type: 'custom',
    required: true,
    render: DocumentacaoManager,
  },

  // Observações e Foto
  {
    key: 'observacoes',
    label: 'Observações',
    type: 'textarea',
    required: false,
    placeholder: 'Observações adicionais sobre o veículo...',
  },
  {
    key: 'foto',
    label: 'Foto do Veículo',
    type: 'custom',
    required: false,
    render: FotoUpload,
  }
];