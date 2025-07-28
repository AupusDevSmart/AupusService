// src/features/equipamentos/components/modals/EquipamentoUCModal.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Wrench, Component, Save, X, Plus, Trash2 } from 'lucide-react';
import { Equipamento } from '../../types';

// ============================================================================
// CAMPOS TÉCNICOS DINÂMICOS POR TIPO DE EQUIPAMENTO
// ============================================================================
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

  'inversor_frequencia': [
    { key: 'potencia', label: 'Potência', type: 'number', unit: 'kW' },
    { key: 'correnteNominal', label: 'Corrente Nominal', type: 'number', unit: 'A' },
    { key: 'tensaoEntrada', label: 'Tensão de Entrada', type: 'number', unit: 'V' },
    { key: 'tensaoSaida', label: 'Tensão de Saída', type: 'number', unit: 'V' },
    { key: 'frequenciaMaxima', label: 'Frequência Máxima', type: 'number', unit: 'Hz', placeholder: '120' },
    { key: 'grauProtecao', label: 'Grau de Proteção', type: 'select', options: ['IP20', 'IP54', 'IP55'] }
  ],

  'disjuntor': [
    { key: 'correnteNominal', label: 'Corrente Nominal', type: 'number', unit: 'A' },
    { key: 'tensaoNominal', label: 'Tensão Nominal', type: 'number', unit: 'kV' },
    { key: 'capacidadeInterrupcao', label: 'Capacidade de Interrupção', type: 'number', unit: 'kA' },
    { key: 'tipo', label: 'Tipo', type: 'select', options: ['Caixa Moldada', 'Aberto', 'A Vácuo', 'SF6'] },
    { key: 'curvaDisparo', label: 'Curva de Disparo', type: 'select', options: ['B', 'C', 'D', 'K'] }
  ]
};

const TIPOS_EQUIPAMENTOS = [
  { value: 'motor_inducao', label: 'Motor de Indução' },
  { value: 'transformador', label: 'Transformador' },
  { value: 'banco_capacitor', label: 'Banco de Capacitor' },
  { value: 'inversor_frequencia', label: 'Inversor de Frequência' },
  { value: 'disjuntor', label: 'Disjuntor' },
  { value: 'seccionadora', label: 'Seccionadora' },
  { value: 'rele_protecao', label: 'Relé de Proteção' },
  { value: 'clp', label: 'CLP (Controlador Lógico Programável)' }
];

// Mock data
const mockPlantas = [
  { id: 1, nome: 'Planta Industrial São Paulo' },
  { id: 2, nome: 'Centro de Distribuição Rio' },
  { id: 3, nome: 'Unidade Administrativa BH' },
  { id: 4, nome: 'Oficina João Silva' }
];

const mockProprietarios = [
  { id: 1, razaoSocial: 'Empresa ABC Ltda' },
  { id: 2, razaoSocial: 'João Silva' },
  { id: 3, razaoSocial: 'Maria Santos Consultoria ME' },
  { id: 4, razaoSocial: 'Tech Solutions Ltda' }
];

interface EquipamentoUCModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit' | 'view';
  entity?: Equipamento | null;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export const EquipamentoUCModal: React.FC<EquipamentoUCModalProps> = ({
  isOpen,
  mode,
  entity,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState<any>({});
  const [mcpse, setMcpse] = useState(false);
  const [camposAdicionais, setCamposAdicionais] = useState<any[]>([]);
  const [componentesUAR, setComponentesUAR] = useState<any[]>([]);

  useEffect(() => {
    if (entity && mode !== 'create') {
      setFormData({
        ...entity,
        plantaId: entity.plantaId ? String(entity.plantaId) : '',
        proprietarioId: entity.proprietarioId ? String(entity.proprietarioId) : ''
      });
      setMcpse(!!entity.mcpse);
      setComponentesUAR(entity.componentesUAR || []);
    } else {
      setFormData({ 
        classificacao: 'UC', 
        criticidade: '3',
        emOperacao: 'sim',
        tipoDepreciacao: 'linear'
      });
      setMcpse(false);
      setComponentesUAR([]);
    }
    setCamposAdicionais([]);
  }, [entity, mode]);

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderCamposTecnicos = () => {
    const campos = CAMPOS_TECNICOS_POR_TIPO[formData.tipoEquipamento];
    if (!campos) return null;

    return (
      <div className="space-y-4">
        <h4 className="font-medium text-sm text-muted-foreground border-b pb-2">
          Dados Técnicos - {TIPOS_EQUIPAMENTOS.find(t => t.value === formData.tipoEquipamento)?.label}
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

  const adicionarCampoPersonalizado = () => {
    const novoCampo = {
      id: Date.now(),
      nome: '',
      tipo: 'text',
      valor: ''
    };
    setCamposAdicionais(prev => [...prev, novoCampo]);
  };

  const removerCampoPersonalizado = (id: number) => {
    setCamposAdicionais(prev => prev.filter(campo => campo.id !== id));
  };

  const handleSubmit = () => {
    const dadosCompletos = {
      ...formData,
      mcpse,
      camposAdicionais,
      componentesUAR,
      plantaId: formData.plantaId ? parseInt(formData.plantaId) : null,
      proprietarioId: formData.proprietarioId ? parseInt(formData.proprietarioId) : null
    };
    onSubmit(dadosCompletos);
  };

  const isReadOnly = mode === 'view';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[1400px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="bg-orange-600 text-white px-6 py-4 -mx-6 -mt-6">
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            {mode === 'create' ? 'Novo Equipamento UC' : 
             mode === 'edit' ? 'Editar Equipamento UC' : 
             'Visualizar Equipamento UC'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 p-1">
          {/* ============================================================================ */}
          {/* DADOS GERAIS - Layout 3 colunas */}
          {/* ============================================================================ */}
          <div>
            <h3 className="font-medium mb-4 text-primary">Dados Gerais</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Coluna 1 */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nome <span className="text-red-500">*</span></label>
                  <Input 
                    value={formData.nome || ''} 
                    onChange={(e) => handleFieldChange('nome', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="Nome do equipamento"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Classificação</label>
                  <Select value={formData.classificacao || ''} onValueChange={(value) => handleFieldChange('classificacao', value)} disabled={isReadOnly}>
                    <SelectTrigger>
                      <SelectValue placeholder="novo/usado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="novo">Novo</SelectItem>
                      <SelectItem value="usado">Usado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Número Série</label>
                  <Input 
                    value={formData.numeroSerie || ''} 
                    onChange={(e) => handleFieldChange('numeroSerie', e.target.value)}
                    disabled={isReadOnly}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Em operação</label>
                  <Select value={formData.emOperacao || ''} onValueChange={(value) => handleFieldChange('emOperacao', value)} disabled={isReadOnly}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sim/Não" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sim">Sim</SelectItem>
                      <SelectItem value="nao">Não</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Tipo de depreciação</label>
                  <Select value={formData.tipoDepreciacao || ''} onValueChange={(value) => handleFieldChange('tipoDepreciacao', value)} disabled={isReadOnly}>
                    <SelectTrigger>
                      <SelectValue placeholder="Linear/Uso" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="linear">Linear</SelectItem>
                      <SelectItem value="uso">Uso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Valor Imobilizado</label>
                  <Input 
                    value={formData.valorImobilizado || ''} 
                    onChange={(e) => handleFieldChange('valorImobilizado', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="0,00"
                  />
                </div>
              </div>

              {/* Coluna 2 */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Planta <span className="text-red-500">*</span></label>
                  <Select value={formData.plantaId || ''} onValueChange={(value) => handleFieldChange('plantaId', value)} disabled={isReadOnly}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma planta" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockPlantas.map(planta => (
                        <SelectItem key={planta.id} value={String(planta.id)}>
                          {planta.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Fabricante</label>
                  <Input 
                    value={formData.fabricante || ''} 
                    onChange={(e) => handleFieldChange('fabricante', e.target.value)}
                    disabled={isReadOnly}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Criticidade <span className="text-red-500">*</span></label>
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
                  <label className="text-sm font-medium">Fornecedor</label>
                  <Input 
                    value={formData.fornecedor || ''} 
                    onChange={(e) => handleFieldChange('fornecedor', e.target.value)}
                    disabled={isReadOnly}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Data Imobilização</label>
                  <Input 
                    type="date"
                    value={formData.dataImobilizacao || ''} 
                    onChange={(e) => handleFieldChange('dataImobilizacao', e.target.value)}
                    disabled={isReadOnly}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Valor da depreciação</label>
                  <Input 
                    value={formData.valorDepreciacao || ''} 
                    onChange={(e) => handleFieldChange('valorDepreciacao', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="0,00"
                  />
                </div>
              </div>

              {/* Coluna 3 */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Proprietário <span className="text-red-500">*</span></label>
                  <Select value={formData.proprietarioId || ''} onValueChange={(value) => handleFieldChange('proprietarioId', value)} disabled={isReadOnly}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um proprietário" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockProprietarios.map(prop => (
                        <SelectItem key={prop.id} value={String(prop.id)}>
                          {prop.razaoSocial}
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
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Tipo <span className="text-red-500">*</span></label>
                  <Select value={formData.tipoEquipamento || ''} onValueChange={(value) => handleFieldChange('tipoEquipamento', value)} disabled={isReadOnly}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_EQUIPAMENTOS.map(tipo => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Centro de custo</label>
                  <Input 
                    value={formData.centroCusto || ''} 
                    onChange={(e) => handleFieldChange('centroCusto', e.target.value)}
                    disabled={isReadOnly}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Vida útil</label>
                  <Input 
                    value={formData.vidaUtil || ''} 
                    onChange={(e) => handleFieldChange('vidaUtil', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="Anos"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Valor contábil</label>
                  <Input 
                    value={formData.valorContabil || ''} 
                    onChange={(e) => handleFieldChange('valorContabil', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="0,00"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================================ */}
          {/* CAMPOS MCPSE E TUC/A1-A6 (CAMPOS DE TEXTO) */}
          {/* ============================================================================ */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Checkbox 
                id="mcpse" 
                checked={mcpse}
                onCheckedChange={setMcpse}
                disabled={isReadOnly}
              />
              <label htmlFor="mcpse" className="text-sm font-medium">
                MCPSE (Habilita campos TUC e A1-A6)
              </label>
            </div>
            
            {mcpse && (
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground border-b pb-2">
                  Campos MCPSE
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium">TUC</label>
                    <Input 
                      value={formData.tuc || ''} 
                      onChange={(e) => handleFieldChange('tuc', e.target.value)}
                      disabled={isReadOnly}
                      placeholder="Número/Código TUC"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">A1</label>
                    <Input 
                      value={formData.a1 || ''} 
                      onChange={(e) => handleFieldChange('a1', e.target.value)}
                      disabled={isReadOnly}
                      placeholder="Valor A1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">A2</label>
                    <Input 
                      value={formData.a2 || ''} 
                      onChange={(e) => handleFieldChange('a2', e.target.value)}
                      disabled={isReadOnly}
                      placeholder="Valor A2"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">A3</label>
                    <Input 
                      value={formData.a3 || ''} 
                      onChange={(e) => handleFieldChange('a3', e.target.value)}
                      disabled={isReadOnly}
                      placeholder="Valor A3"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">A4</label>
                    <Input 
                      value={formData.a4 || ''} 
                      onChange={(e) => handleFieldChange('a4', e.target.value)}
                      disabled={isReadOnly}
                      placeholder="Valor A4"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">A5</label>
                    <Input 
                      value={formData.a5 || ''} 
                      onChange={(e) => handleFieldChange('a5', e.target.value)}
                      disabled={isReadOnly}
                      placeholder="Valor A5"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">A6</label>
                    <Input 
                      value={formData.a6 || ''} 
                      onChange={(e) => handleFieldChange('a6', e.target.value)}
                      disabled={isReadOnly}
                      placeholder="Valor A6"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ============================================================================ */}
          {/* PLANO DE MANUTENÇÃO */}
          {/* ============================================================================ */}
          <div>
            <label className="text-sm font-medium">Plano de manutenção</label>
            <Input 
              value={formData.planoManutencao || ''} 
              onChange={(e) => handleFieldChange('planoManutencao', e.target.value)}
              disabled={isReadOnly}
              placeholder="Inserir ou vincular plano existente"
            />
          </div>

          {/* ============================================================================ */}
          {/* DADOS TÉCNICOS DINÂMICOS */}
          {/* ============================================================================ */}
          <div>
            <h3 className="font-medium mb-4 text-primary">Dados Técnicos</h3>
            {renderCamposTecnicos()}
            
            {/* Campos adicionais personalizados */}
            {camposAdicionais.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">Campos Adicionais</h4>
                {camposAdicionais.map((campo, index) => (
                  <div key={campo.id} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Input 
                        placeholder="Nome do campo"
                        value={campo.nome}
                        onChange={(e) => {
                          const novos = [...camposAdicionais];
                          novos[index].nome = e.target.value;
                          setCamposAdicionais(novos);
                        }}
                        disabled={isReadOnly}
                      />
                    </div>
                    <div className="flex-1">
                      <Input 
                        placeholder="Valor"
                        value={campo.valor}
                        onChange={(e) => {
                          const novos = [...camposAdicionais];
                          novos[index].valor = e.target.value;
                          setCamposAdicionais(novos);
                        }}
                        disabled={isReadOnly}
                      />
                    </div>
                    {!isReadOnly && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removerCampoPersonalizado(campo.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {!isReadOnly && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={adicionarCampoPersonalizado}
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Campo Técnico
              </Button>
            )}
          </div>

          {/* ============================================================================ */}
          {/* COMPONENTES UAR */}
          {/* ============================================================================ */}
          <div>
            <h3 className="font-medium mb-4 text-primary">Componentes UAR</h3>
            <div className="p-4 bg-muted/30 rounded-lg border">
              {componentesUAR.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Component className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum componente UAR cadastrado</p>
                  <p className="text-xs mt-1">Use o botão "Gerenciar" na tabela para adicionar componentes</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {componentesUAR.map((uar) => (
                    <div key={uar.id} className="flex items-center justify-between p-2 bg-background rounded border">
                      <div className="flex items-center gap-2">
                        <Component className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">{uar.nome}</span>
                        <Badge variant="outline">{uar.tipo}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {uar.fabricante} - {uar.modelo}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer com botões */}
        <div className="border-t pt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Fechar
          </Button>
          {mode !== 'view' && (
            <Button onClick={handleSubmit} className="bg-orange-600 hover:bg-orange-700">
              <Save className="h-4 w-4 mr-2" />
              Salvar Equipamento UC
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};