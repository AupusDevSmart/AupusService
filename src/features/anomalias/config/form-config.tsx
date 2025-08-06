// src/features/anomalias/config/form-config.tsx
import React from 'react';
import { FormField, FormFieldProps } from '@/types/base';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  X, 
  Building,
  Wrench,
  AlertTriangle,
  CheckCircle,
  History
} from 'lucide-react';
import { useEquipamentos } from '@/features/equipamentos/hooks/useEquipamentos';

// ✅ COMPONENTE: Seleção hierárquica Planta → Equipamento → Componente
const LocalizacaoController = ({ value, onChange, disabled, entity, mode }: FormFieldProps & { entity?: any; mode?: string }) => {
  const { plantas, getEquipamentosUCByPlanta, getComponentesByEquipamento, getPlantaById, getEquipamentoById } = useEquipamentos();
  
  const [plantaId, setPlantaId] = React.useState(value?.plantaId?.toString() || '');
  const [equipamentoId, setEquipamentoId] = React.useState(value?.equipamentoId?.toString() || '');
  const [componenteId, setComponenteId] = React.useState('none');

  // Equipamentos UC filtrados pela planta selecionada
  const equipamentosDisponiveis = plantaId ? 
    getEquipamentosUCByPlanta(Number(plantaId)) : [];

  // Componentes UAR filtrados pelo equipamento selecionado
  const componentesDisponiveis = equipamentoId ? 
    getComponentesByEquipamento(Number(equipamentoId)) : [];

  const handlePlantaChange = (newPlantaId: string) => {
    setPlantaId(newPlantaId);
    setEquipamentoId('');
    setComponenteId('none');
    
    const planta = getPlantaById(Number(newPlantaId));
    onChange({
      plantaId: Number(newPlantaId),
      equipamentoId: null,
      local: planta?.nome || '',
      ativo: ''
    });
  };

  const handleEquipamentoChange = (newEquipamentoId: string) => {
    setEquipamentoId(newEquipamentoId);
    setComponenteId('none');
    
    const equipamento = getEquipamentoById(Number(newEquipamentoId));
    const planta = getPlantaById(Number(plantaId));
    
    onChange({
      plantaId: Number(plantaId),
      equipamentoId: Number(newEquipamentoId),
      local: planta?.nome || '',
      ativo: equipamento?.nome || ''
    });
  };

  const handleComponenteChange = (newComponenteId: string) => {
    setComponenteId(newComponenteId);
    
    const finalId = newComponenteId === 'none' ? Number(equipamentoId) : Number(newComponenteId);
    const finalItem = getEquipamentoById(finalId);
    const planta = getPlantaById(Number(plantaId));
    
    onChange({
      plantaId: Number(plantaId),
      equipamentoId: finalId,
      local: planta?.nome || '',
      ativo: finalItem?.nome || ''
    });
  };

  return (
    <div className="space-y-4">
      {/* Planta */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Planta/Local <span className="text-red-500">*</span>
        </label>
        <select
          value={plantaId}
          onChange={(e) => handlePlantaChange(e.target.value)}
          disabled={disabled}
          className="w-full p-2 border rounded-md bg-background text-foreground"
          required
        >
          <option value="">Selecione a planta...</option>
          {plantas.map(planta => (
            <option key={planta.id} value={planta.id.toString()}>
              {planta.nome}
            </option>
          ))}
        </select>
      </div>

      {/* Equipamento UC */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Equipamento <span className="text-red-500">*</span>
        </label>
        <select
          value={equipamentoId}
          onChange={(e) => handleEquipamentoChange(e.target.value)}
          disabled={disabled || !plantaId}
          className="w-full p-2 border rounded-md bg-background text-foreground"
          required
        >
          <option value="">
            {plantaId ? "Selecione o equipamento..." : "Primeiro selecione uma planta"}
          </option>
          {equipamentosDisponiveis.map(equipamento => (
            <option key={equipamento.id} value={equipamento.id.toString()}>
              {equipamento.nome} - {equipamento.tipo}
            </option>
          ))}
        </select>
      </div>

      {/* Componente UAR (Opcional) */}
      {equipamentoId && componentesDisponiveis.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Componente (Opcional)</label>
          <select
            value={componenteId}
            onChange={(e) => handleComponenteChange(e.target.value)}
            disabled={disabled}
            className="w-full p-2 border rounded-md bg-background text-foreground"
          >
            <option value="none">Nenhum componente específico</option>
            {componentesDisponiveis.map(componente => (
              <option key={componente.id} value={componente.id.toString()}>
                {componente.nome} - {componente.tipo}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Preview do item selecionado */}
      {equipamentoId && (
        <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            {componenteId !== 'none' ? 'Componente Selecionado:' : 'Equipamento Selecionado:'}
          </h4>
          {(() => {
            const finalId = componenteId !== 'none' ? Number(componenteId) : Number(equipamentoId);
            const item = getEquipamentoById(finalId);
            
            if (!item) return null;
            
            return (
              <div className="space-y-2">
                <p className="font-medium">{item.nome}</p>
                <p className="text-sm text-muted-foreground">{item.tipo}</p>
                <p className="text-sm text-muted-foreground">Localização: {item.localizacao}</p>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

// ✅ COMPONENTE: Upload de Anexos
const AnexosUpload = ({ value, onChange, disabled }: FormFieldProps) => {
  const [arquivos, setArquivos] = React.useState<File[]>(value || []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const novosArquivos = [...arquivos, ...files];
    setArquivos(novosArquivos);
    onChange(novosArquivos);
  };

  const removerArquivo = (index: number) => {
    const novosArquivos = arquivos.filter((_, i) => i !== index);
    setArquivos(novosArquivos);
    onChange(novosArquivos);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-2">
          Clique para selecionar arquivos ou arraste-os aqui
        </p>
        <input
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
          onChange={handleFileChange}
          disabled={disabled}
          className="hidden"
          id="anexos-upload"
        />
        <label
          htmlFor="anexos-upload"
          className={`inline-flex items-center gap-2 px-4 py-2 text-sm border rounded-md cursor-pointer hover:bg-muted ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <Upload className="h-4 w-4" />
          Selecionar Arquivos
        </label>
        <p className="text-xs text-muted-foreground mt-2">
          PNG, JPG, PDF, DOC, XLS até 10MB cada
        </p>
      </div>

      {arquivos.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Arquivos Selecionados ({arquivos.length})</label>
          <div className="space-y-2">
            {arquivos.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 border rounded"
              >
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                {!disabled && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removerArquivo(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const anomaliasFormFields: FormField[] = [
  // Informações Básicas
  {
    key: 'descricao',
    label: 'Descrição da Anomalia',
    type: 'textarea',
    required: true,
    placeholder: 'Descreva detalhadamente a anomalia identificada...',
  },

  // Localização
  {
    key: 'localizacao',
    label: 'Localização',
    type: 'custom',
    required: true,
    render: ({ value, onChange, disabled, entity, mode }) => (
      <LocalizacaoController 
        value={value} 
        onChange={onChange} 
        disabled={disabled}
        entity={entity}
        mode={mode}
      />
    ),
  },

  // Classificação
  {
    key: 'condicao',
    label: 'Condição',
    type: 'select',
    required: true,
    options: [
      { value: 'PARADO', label: 'Parado' },
      { value: 'FUNCIONANDO', label: 'Funcionando' },
      { value: 'RISCO_ACIDENTE', label: 'Risco de Acidente' }
    ],
  },
  {
    key: 'origem',
    label: 'Origem',
    type: 'select',
    required: true,
    options: [
      { value: 'SCADA', label: 'SCADA' },
      { value: 'OPERADOR', label: 'Operador' },
      { value: 'FALHA', label: 'Falha' }
    ],
  },
  {
    key: 'prioridade',
    label: 'Prioridade',
    type: 'select',
    required: true,
    options: [
      { value: 'BAIXA', label: 'Baixa' },
      { value: 'MEDIA', label: 'Média' },
      { value: 'ALTA', label: 'Alta' },
      { value: 'CRITICA', label: 'Crítica' }
    ],
  },

  // Observações
  {
    key: 'observacoes',
    label: 'Observações Adicionais',
    type: 'textarea',
    required: false,
    placeholder: 'Informações adicionais, contexto, detalhes técnicos...',
  },

  // Anexos (apenas para criação)
  {
    key: 'anexos',
    label: 'Anexos',
    type: 'custom',
    required: false,
    render: AnexosUpload,
    showOnlyOnMode: ['create'] // Só aparece no modo de criação
  }
];