// src/features/ferramentas/components/CalibracaoController.tsx
import React from 'react';
import { FormFieldProps } from '@/types/base';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, History } from 'lucide-react';
import { Ferramenta, HistoricoCalibracao } from '../types';

// ✅ COMPONENTE SIMPLIFICADO: Controle de Calibração
export const CalibracaoController = ({ onChange, disabled, entity, mode }: FormFieldProps & { entity?: Ferramenta | null; mode?: string }) => {
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