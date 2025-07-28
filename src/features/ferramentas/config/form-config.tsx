// src/features/ferramentas/config/form-config.tsx - CORREÇÃO FINAL
import React from 'react';
import { FormField, FormFieldProps } from '@/types/base';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  X, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  History
} from 'lucide-react';
import { HistoricoCalibracao } from '../types';

// ✅ COMPONENTE SIMPLIFICADO: Controle de Calibração
const CalibracaoController = ({ value, onChange, disabled, entity, mode }: FormFieldProps & { entity?: any; mode?: string }) => {
  // Valores diretamente do entity para evitar loops
  const necessitaCalibracao = entity?.necessitaCalibracao || false;
  const proximaDataCalibracao = entity?.proximaDataCalibracao || '';
  
  const [localNecessita, setLocalNecessita] = React.useState(necessitaCalibracao);
  const [localData, setLocalData] = React.useState(proximaDataCalibracao);

  // Inicializar apenas uma vez
  React.useEffect(() => {
    setLocalNecessita(necessitaCalibracao);
    setLocalData(proximaDataCalibracao);
  }, [necessitaCalibracao, proximaDataCalibracao]);

  const handleNecessitaChange = (value: boolean) => {
    setLocalNecessita(value);
    if (!value) {
      setLocalData('');
      onChange({
        necessitaCalibracao: value,
        proximaDataCalibracao: undefined
      });
    } else {
      onChange({
        necessitaCalibracao: value,
        proximaDataCalibracao: localData
      });
    }
  };

  const handleDataChange = (data: string) => {
    setLocalData(data);
    onChange({
      necessitaCalibracao: localNecessita,
      proximaDataCalibracao: data
    });
  };

  const verificarVencimento = (data: string) => {
    if (!data) return null;
    
    const hoje = new Date();
    const vencimento = new Date(data);
    const diasRestantes = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diasRestantes < 0) {
      return { tipo: 'vencida', dias: Math.abs(diasRestantes) };
    } else if (diasRestantes <= 30) {
      return { tipo: 'vencendo', dias: diasRestantes };
    }
    return { tipo: 'ok', dias: diasRestantes };
  };

  const alerta = localNecessita && localData ? verificarVencimento(localData) : null;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <label className="text-sm font-medium">
          Necessita Calibração? <span className="text-red-500">*</span>
        </label>
        
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="necessitaCalibracao"
              value="true"
              checked={localNecessita === true}
              onChange={() => handleNecessitaChange(true)}
              disabled={disabled}
              className="text-blue-600"
            />
            <span className="text-sm">Sim</span>
          </label>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="necessitaCalibracao"
              value="false"
              checked={localNecessita === false}
              onChange={() => handleNecessitaChange(false)}
              disabled={disabled}
              className="text-blue-600"
            />
            <span className="text-sm">Não</span>
          </label>
        </div>
      </div>

      {/* Campo de data de calibração - só aparece se necessitaCalibracao = true */}
      {localNecessita && (
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Próxima Data de Calibração <span className="text-red-500">*</span>
          </label>
          
          <div className="space-y-2">
            <Input
              type="date"
              value={localData}
              onChange={(e) => handleDataChange(e.target.value)}
              disabled={disabled}
              className="w-full"
              min={new Date().toISOString().split('T')[0]}
            />
            
            {/* Alertas de vencimento */}
            {alerta && (
              <div className="flex items-center gap-2 p-2 rounded-md bg-muted/30">
                {alerta.tipo === 'vencida' && (
                  <>
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-600">
                      ⚠️ Calibração vencida há {alerta.dias} dias
                    </span>
                  </>
                )}
                {alerta.tipo === 'vencendo' && (
                  <>
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span className="text-sm text-amber-600">
                      ⚠️ Calibração vence em {alerta.dias} dias
                    </span>
                  </>
                )}
                {alerta.tipo === 'ok' && (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600">
                      ✅ Calibração em dia ({alerta.dias} dias restantes)
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Histórico de Calibração - só exibe em modo view/edit */}
      {(mode === 'view' || mode === 'edit') && entity?.historicoCalibracao && entity.historicoCalibracao.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            <label className="text-sm font-medium">Histórico de Calibração</label>
          </div>
          
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {entity.historicoCalibracao.map((calibracao: HistoricoCalibracao, index: number) => (
              <div key={index} className="p-3 bg-muted/20 rounded-md border">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">
                    {new Date(calibracao.data).toLocaleDateString('pt-BR')}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    Calibração {index + 1}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  <strong>Responsável:</strong> {calibracao.responsavel}
                </p>
                {calibracao.observacoes && (
                  <p className="text-xs text-muted-foreground mt-1">
                    <strong>Observações:</strong> {calibracao.observacoes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Informações sobre calibração */}
      <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950 p-3 rounded border">
        💡 <strong>Dica:</strong> Ferramentas de medição geralmente necessitam calibração periódica para manter a precisão.
        {localNecessita && (
          <span className="block mt-1">
            Configure a próxima data de calibração para receber alertas automáticos.
          </span>
        )}
      </div>
    </div>
  );
};

// ✅ COMPONENTE: Upload de Foto
const FotoUpload = ({ value, onChange, disabled }: FormFieldProps) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
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
      <label className="text-sm font-medium">Foto da Ferramenta</label>
      
      {value ? (
        <div className="space-y-3">
          <div className="relative inline-block">
            <img 
              src={value} 
              alt="Foto da ferramenta" 
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
            Clique para adicionar uma foto da ferramenta
          </p>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={disabled}
            className="hidden"
            id="foto-upload-ferramenta"
          />
          <label
            htmlFor="foto-upload-ferramenta"
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

export const ferramentasFormFields: FormField[] = [
  // Informações Básicas
  {
    key: 'nome',
    label: 'Nome da Ferramenta',
    type: 'text',
    required: true,
    placeholder: 'Ex: Multímetro Digital Fluke',
    group: 'informacoes_basicas'
  },
  // ✅ REMOVIDO: Campo "tipo" que estava causando o loop
  {
    key: 'codigoPatrimonial',
    label: 'Código Patrimonial',
    type: 'text',
    required: true,
    placeholder: 'Ex: FER-001',
    group: 'informacoes_basicas'
  },

  // Especificações da Ferramenta
  {
    key: 'fabricante',
    label: 'Fabricante',
    type: 'text',
    required: true,
    placeholder: 'Ex: Fluke, Bosch, Mitutoyo',
    group: 'especificacoes'
  },
  {
    key: 'modelo',
    label: 'Modelo',
    type: 'text',
    required: true,
    placeholder: 'Ex: 87V, GSB 20-2 RE',
    group: 'especificacoes'
  },
  {
    key: 'numeroSerie',
    label: 'Número de Série',
    type: 'text',
    required: true,
    placeholder: 'Ex: FLK87V-12345',
    group: 'especificacoes'
  },

  // Calibração
  {
    key: 'calibracao',
    label: 'Calibração',
    type: 'custom',
    required: true,
    render: ({ value, onChange, disabled, entity, mode }) => (
      <CalibracaoController 
        value={value} 
        onChange={onChange} 
        disabled={disabled}
        entity={entity}
        mode={mode}
      />
    ),
    group: 'calibracao'
  },

  // Informações Operacionais
  {
    key: 'valorDiaria',
    label: 'Valor da Diária (R$)',
    type: 'text',
    required: true,
    placeholder: 'Ex: 25.00',
    validation: (value) => {
      if (!value) return null;
      const valor = parseFloat(value);
      if (valor <= 0) {
        return 'Valor deve ser maior que zero';
      }
      return null;
    },
    group: 'operacionais'
  },
  {
    key: 'localizacaoAtual',
    label: 'Localização Atual',
    type: 'text',
    required: true,
    placeholder: 'Ex: Planta Industrial São Paulo - Laboratório',
    group: 'operacionais'
  },
  {
    key: 'responsavel',
    label: 'Responsável',
    type: 'text',
    required: true,
    placeholder: 'Ex: João Silva',
    group: 'operacionais'
  },
  {
    key: 'dataAquisicao',
    label: 'Data de Aquisição',
    type: 'text',
    required: true,
    placeholder: 'Data de aquisição da ferramenta',
    validation: (value) => {
      if (!value) return null;
      const data = new Date(value);
      const hoje = new Date();
      if (data > hoje) {
        return 'Data de aquisição não pode ser futura';
      }
      return null;
    },
    group: 'operacionais'
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    required: true,
    options: [
      { value: 'disponivel', label: 'Disponível' },
      { value: 'em_uso', label: 'Em Uso' },
      { value: 'manutencao', label: 'Em Manutenção' }
    ],
    group: 'operacionais'
  },

  // Observações e Foto
  {
    key: 'observacoes',
    label: 'Observações',
    type: 'textarea',
    required: false,
    placeholder: 'Observações adicionais sobre a ferramenta...',
    group: 'extras'
  },
  {
    key: 'foto',
    label: 'Foto da Ferramenta',
    type: 'custom',
    required: false,
    render: FotoUpload,
    group: 'extras'
  }
];