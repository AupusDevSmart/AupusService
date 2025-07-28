// src/features/equipamentos/components/ComponenteUARModal.tsx
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Component, Save, Wrench, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Equipamento } from '../../types';

// Reutilizando os mesmos campos técnicos do UC
const CAMPOS_TECNICOS_POR_TIPO = {
  'motor_inducao': [
    { key: 'potencia', label: 'Potência', type: 'number', unit: 'kW' },
    { key: 'tensaoNominal', label: 'Tensão Nominal', type: 'number', unit: 'V' },
    { key: 'correnteNominal', label: 'Corrente Nominal', type: 'number', unit: 'A' },
    { key: 'fatorServico', label: 'Fator de Serviço', type: 'number', placeholder: 'Ex: 1.15' },
    { key: 'numeroPolos', label: 'Número de Polos', type: 'number' },
    { key: 'grauProtecao', label: 'Grau de Proteção (IP)', type: 'select', options: ['IP20', 'IP54', 'IP55', 'IP65'] },
    { key: 'classeIsolamento', label: 'Classe de Isolamento', type: 'select', options: ['A', 'B', 'F', 'H'] },
    { key: 'tipoPartida', label: 'Tipo de Partida', type: 'select', options: ['Direta', 'Estrela-Triângulo', 'Soft-Starter', 'Inversor'] }
  ],

  'transformador': [
    { key: 'potenciaNominal', label: 'Potência Nominal', type: 'number', unit: 'kVA' },
    { key: 'tensaoPrimaria', label: 'Tensão Primária', type: 'number', unit: 'V' },
    { key: 'tensaoSecundaria', label: 'Tensão Secundária', type: 'number', unit: 'V' },
    { key: 'grupoLigacao', label: 'Grupo de Ligação', type: 'text', placeholder: 'Ex: Dyn11' },
    { key: 'tipoRefrigeracao', label: 'Tipo de Refrigeração', type: 'select', options: ['ONAN', 'ONAF', 'ONAN/ONAF'] },
    { key: 'tipoIsolamento', label: 'Tipo de Isolamento', type: 'select', options: ['Óleo Mineral', 'Silicone', 'Seco'] }
  ],

  'banco_capacitor': [
    { key: 'potenciaReativaTotal', label: 'Potência Reativa Total', type: 'number', unit: 'kVAR' },
    { key: 'tensaoNominal', label: 'Tensão Nominal', type: 'number', unit: 'V' },
    { key: 'frequenciaNominal', label: 'Frequência Nominal', type: 'number', unit: 'Hz', placeholder: '60' },
    { key: 'tipoConexao', label: 'Tipo de Conexão', type: 'select', options: ['Delta', 'Estrela'] },
    { key: 'nivelIsolamento', label: 'Nível de Isolamento', type: 'number', unit: 'V' }
  ],

  'reator': [
    { key: 'indutancia', label: 'Indutância', type: 'number', unit: 'mH' },
    { key: 'correnteNominal', label: 'Corrente Nominal', type: 'number', unit: 'A' },
    { key: 'tensaoNominal', label: 'Tensão Nominal', type: 'number', unit: 'V' },
    { key: 'tipoEnrolamento', label: 'Tipo de Enrolamento', type: 'select', options: ['Núcleo de Ar', 'Núcleo de Ferro'] }
  ],

  'seccionadora': [
    { key: 'correnteNominal', label: 'Corrente Nominal', type: 'number', unit: 'A' },
    { key: 'tensaoNominal', label: 'Tensão Nominal', type: 'number', unit: 'kV' },
    { key: 'tipoManobra', label: 'Tipo de Manobra', type: 'select', options: ['Manual', 'Motorizada'] },
    { key: 'capacidadeInterrupcao', label: 'Capacidade de Interrupção', type: 'number', unit: 'kA' }
  ],

  'disjuntor': [
    { key: 'correnteNominal', label: 'Corrente Nominal', type: 'number', unit: 'A' },
    { key: 'tensaoNominal', label: 'Tensão Nominal', type: 'number', unit: 'kV' },
    { key: 'capacidadeInterrupcao', label: 'Capacidade de Interrupção', type: 'number', unit: 'kA' },
    { key: 'tipo', label: 'Tipo', type: 'select', options: ['Caixa Moldada', 'Aberto', 'A Vácuo', 'SF6'] },
    { key: 'curvaDisparo', label: 'Curva de Disparo', type: 'select', options: ['B', 'C', 'D', 'K'] }
  ],

  'chave_fusivel': [
    { key: 'correnteNominal', label: 'Corrente Nominal', type: 'number', unit: 'A' },
    { key: 'tensaoNominal', label: 'Tensão Nominal', type: 'number', unit: 'kV' },
    { key: 'tipoFusivel', label: 'Tipo de Fusível', type: 'select', options: ['NH', 'HH', 'Diazed'] }
  ],

  'rele_protecao': [
    { key: 'correnteNominal', label: 'Corrente Nominal', type: 'number', unit: 'A' },
    { key: 'tensaoNominal', label: 'Tensão Nominal', type: 'number', unit: 'V' },
    { key: 'funcoesProtecao', label: 'Funções de Proteção', type: 'text', placeholder: 'Ex: 50, 51, 87, 27' }
  ],

  'inversor_frequencia': [
    { key: 'potencia', label: 'Potência', type: 'number', unit: 'kW' },
    { key: 'correnteNominal', label: 'Corrente Nominal', type: 'number', unit: 'A' },
    { key: 'tensaoEntrada', label: 'Tensão de Entrada', type: 'number', unit: 'V' },
    { key: 'tensaoSaida', label: 'Tensão de Saída', type: 'number', unit: 'V' },
    { key: 'frequenciaMaxima', label: 'Frequência Máxima', type: 'number', unit: 'Hz', placeholder: '120' },
    { key: 'grauProtecao', label: 'Grau de Proteção', type: 'select', options: ['IP20', 'IP54', 'IP55'] }
  ],

  'clp': [
    { key: 'numeroEntradas', label: 'Número de Entradas', type: 'number' },
    { key: 'numeroSaidas', label: 'Número de Saídas', type: 'number' },
    { key: 'tipoComunicacao', label: 'Tipo de Comunicação', type: 'text', placeholder: 'Ex: Profibus, Ethernet/IP' }
  ],

  // Tipos específicos para componentes
  'sensor_temperatura': [
    { key: 'faixaTemperatura', label: 'Faixa de Temperatura', type: 'text', placeholder: 'Ex: -40°C a +120°C' },
    { key: 'precisao', label: 'Precisão', type: 'text', placeholder: 'Ex: ±0.5°C' },
    { key: 'sinalSaida', label: 'Sinal de Saída', type: 'select', options: ['4-20mA', '0-10V', 'PT100', 'Termopar'] }
  ],

  'sensor_vibracao': [
    { key: 'faixaFrequencia', label: 'Faixa de Frequência', type: 'text', placeholder: 'Ex: 10Hz - 1kHz' },
    { key: 'sensibilidade', label: 'Sensibilidade', type: 'text', placeholder: 'Ex: 100mV/g' },
    { key: 'tipoMontagem', label: 'Tipo de Montagem', type: 'select', options: ['Magnética', 'Parafusada', 'Adesiva'] }
  ],

  'bomba_oleo': [
    { key: 'vazao', label: 'Vazão', type: 'number', unit: 'L/min' },
    { key: 'pressaoMaxima', label: 'Pressão Máxima', type: 'number', unit: 'bar' },
    { key: 'tipoOleo', label: 'Tipo de Óleo', type: 'text', placeholder: 'Especificação do óleo' }
  ],

  'filtro_ar': [
    { key: 'eficiencia', label: 'Eficiência', type: 'text', placeholder: 'Ex: 99.97%' },
    { key: 'vazaoNominal', label: 'Vazão Nominal', type: 'number', unit: 'm³/h' },
    { key: 'perda_carga', label: 'Perda de Carga', type: 'number', unit: 'Pa' }
  ],

  'valvula_seguranca': [
    { key: 'pressaoAbertura', label: 'Pressão de Abertura', type: 'number', unit: 'bar' },
    { key: 'diametroNominal', label: 'Diâmetro Nominal', type: 'text', placeholder: 'Ex: DN50' },
    { key: 'material', label: 'Material', type: 'text', placeholder: 'Ex: Aço Inox 316' }
  ]
};

const TIPOS_COMPONENTES = [
  { value: 'motor_inducao', label: 'Motor de Indução' },
  { value: 'transformador', label: 'Transformador' },
  { value: 'banco_capacitor', label: 'Banco de Capacitor' },
  { value: 'reator', label: 'Reator' },
  { value: 'seccionadora', label: 'Seccionadora' },
  { value: 'disjuntor', label: 'Disjuntor' },
  { value: 'chave_fusivel', label: 'Chave Fusível' },
  { value: 'rele_protecao', label: 'Relé de Proteção' },
  { value: 'inversor_frequencia', label: 'Inversor de Frequência' },
  { value: 'clp', label: 'CLP' },
  // Componentes específicos
  { value: 'sensor_temperatura', label: 'Sensor de Temperatura' },
  { value: 'sensor_vibracao', label: 'Sensor de Vibração' },
  { value: 'bomba_oleo', label: 'Bomba de Óleo' },
  { value: 'filtro_ar', label: 'Filtro de Ar' },
  { value: 'valvula_seguranca', label: 'Válvula de Segurança' }
];

interface ComponenteUARModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit' | 'view';
  entity?: Equipamento | null;
  equipamentoPai?: Equipamento | null;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export const ComponenteUARModal: React.FC<ComponenteUARModalProps> = ({
  isOpen,
  mode,
  entity,
  equipamentoPai,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (entity && mode !== 'create') {
      setFormData(entity);
    } else {
      setFormData({ 
        classificacao: 'UAR',
        criticidade: '3',
        equipamentoPaiId: equipamentoPai?.id,
        // Herdar dados do equipamento pai
        plantaId: equipamentoPai?.plantaId,
        proprietarioId: equipamentoPai?.proprietarioId
      });
    }
  }, [entity, mode, equipamentoPai]);

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderCamposTecnicos = () => {
    const campos = CAMPOS_TECNICOS_POR_TIPO[formData.tipoComponente];
    if (!campos) return null;

    return (
      <div className="space-y-4">
        <h4 className="font-medium text-sm text-muted-foreground border-b pb-2">
          Dados Técnicos - {TIPOS_COMPONENTES.find(t => t.value === formData.tipoComponente)?.label}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campos.map((campo) => (
            <div key={campo.key}>
              <label className="text-sm font-medium">
                {campo.label} {campo.unit && <span className="text-muted-foreground">({campo.unit})</span>}
              </label>
              {campo.type === 'select' ? (
                <Select 
                  value={formData[campo.key] || ''} 
                  onValueChange={(value) => handleFieldChange(campo.key, value)}
                  disabled={mode === 'view'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {campo.options?.map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type={campo.type}
                  placeholder={campo.placeholder || `${campo.label}${campo.unit ? ` (${campo.unit})` : ''}`}
                  value={formData[campo.key] || ''}
                  onChange={(e) => handleFieldChange(campo.key, e.target.value)}
                  disabled={mode === 'view'}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handleSubmit = () => {
    const dadosCompletos = {
      ...formData,
      classificacao: 'UAR'
    };
    onSubmit(dadosCompletos);
  };

  const isReadOnly = mode === 'view';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[1000px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="bg-blue-600 text-white px-6 py-4 -mx-6 -mt-6">
          <DialogTitle className="flex items-center gap-2">
            <Component className="h-5 w-5" />
            {mode === 'create' ? 'Novo Componente UAR' : 
             mode === 'edit' ? 'Editar Componente UAR' : 
             'Visualizar Componente UAR'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 p-1">
          {/* Informação do Equipamento Pai */}
          {equipamentoPai && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg dark:bg-orange-950 dark:border-orange-800">
              <div className="flex items-center gap-2 mb-2">
                <Wrench className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-900 dark:text-orange-100">
                  Equipamento Pai (UC):
                </span>
              </div>
              <div className="text-orange-700 dark:text-orange-300">
                <div className="font-medium">{equipamentoPai.nome}</div>
                <div className="text-xs">{equipamentoPai.fabricante} - {equipamentoPai.modelo}</div>
                <div className="text-xs">Planta: {equipamentoPai.planta?.nome}</div>
              </div>
            </div>
          )}

          {/* ============================================================================ */}
          {/* DADOS BÁSICOS DO COMPONENTE UAR */}
          {/* ============================================================================ */}
          <div>
            <h3 className="font-medium mb-4 text-primary">Dados do Componente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Coluna 1 */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nome <span className="text-red-500">*</span></label>
                  <Input 
                    value={formData.nome || ''} 
                    onChange={(e) => handleFieldChange('nome', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="Nome do componente"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Tipo <span className="text-red-500">*</span></label>
                  <Select value={formData.tipoComponente || ''} onValueChange={(value) => handleFieldChange('tipoComponente', value)} disabled={isReadOnly}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_COMPONENTES.map(tipo => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Modelo</label>
                  <Input 
                    value={formData.modelo || ''} 
                    onChange={(e) => handleFieldChange('modelo', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="Modelo do componente"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Fabricante</label>
                  <Input 
                    value={formData.fabricante || ''} 
                    onChange={(e) => handleFieldChange('fabricante', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="Fabricante"
                  />
                </div>
              </div>

              {/* Coluna 2 */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Data de Instalação</label>
                  <Input 
                    type="date"
                    value={formData.dataInstalacao || ''} 
                    onChange={(e) => handleFieldChange('dataInstalacao', e.target.value)}
                    disabled={isReadOnly}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Criticidade</label>
                  <Select value={formData.criticidade || ''} onValueChange={(value) => handleFieldChange('criticidade', value)} disabled={isReadOnly}>
                    <SelectTrigger>
                      <SelectValue placeholder="1 a 5" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 (Muito Baixa)</SelectItem>
                      <SelectItem value="2">2 (Baixa)</SelectItem>
                      <SelectItem value="3">3 (Média)</SelectItem>
                      <SelectItem value="4">4 (Alta)</SelectItem>
                      <SelectItem value="5">5 (Muito Alta)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Localização Específica</label>
                  <Input 
                    value={formData.localizacaoEspecifica || ''} 
                    onChange={(e) => handleFieldChange('localizacaoEspecifica', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="Ex: Lado direito, Entrada principal..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">PM (Plano de Manutenção)</label>
                  <Input 
                    value={formData.planoManutencao || ''} 
                    onChange={(e) => handleFieldChange('planoManutencao', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="Número do PM"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================================ */}
          {/* DADOS TÉCNICOS DINÂMICOS DO COMPONENTE */}
          {/* ============================================================================ */}
          <div>
            <h3 className="font-medium mb-4 text-primary">Dados Técnicos</h3>
            {renderCamposTecnicos()}
          </div>

          {/* ============================================================================ */}
          {/* OBSERVAÇÕES ADICIONAIS */}
          {/* ============================================================================ */}
          <div>
            <label className="text-sm font-medium">Observações</label>
            <Textarea 
              value={formData.observacoes || ''} 
              onChange={(e) => handleFieldChange('observacoes', e.target.value)}
              disabled={isReadOnly}
              placeholder="Observações adicionais sobre o componente"
              rows={3}
            />
          </div>
        </div>

        {/* Footer com botões */}
        <div className="border-t pt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Fechar
          </Button>
          {mode !== 'view' && (
            <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
              <Save className="h-4 w-4 mr-2" />
              Salvar Componente UAR
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};