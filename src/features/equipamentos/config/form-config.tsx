// src/features/equipamentos/config/form-config.tsx - FORMULÁRIO DINÂMICO POR TIPO
import React from 'react';
import { FormField } from '@/types/base';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

// Mock de plantas para seleção
const mockPlantas = [
  { id: 1, nome: 'Planta Industrial São Paulo' },
  { id: 2, nome: 'Centro de Distribuição Rio' },
  { id: 3, nome: 'Unidade Administrativa BH' },
  { id: 4, nome: 'Oficina João Silva' },
  { id: 5, nome: 'Depósito Ana Costa' },
  { id: 6, nome: 'Fábrica Indústria XYZ' }
];

// Mock de proprietários para seleção
const mockProprietarios = [
  { id: 1, razaoSocial: 'Empresa ABC Ltda' },
  { id: 2, razaoSocial: 'João Silva' },
  { id: 3, razaoSocial: 'Maria Santos Consultoria ME' },
  { id: 4, razaoSocial: 'Tech Solutions Ltda' },
  { id: 5, razaoSocial: 'Ana Costa' },
  { id: 6, razaoSocial: 'Indústria XYZ S.A.' }
];

// Tipos de equipamentos com campos específicos
const TIPOS_EQUIPAMENTOS = [
  { value: 'motor_inducao', label: 'Motor de Indução' },
  { value: 'banco_capacitor', label: 'Banco de Capacitor' },
  { value: 'transformador', label: 'Transformador' },
  { value: 'pde', label: 'PDE (Poste de Distribuição)' },
  { value: 'cabine_blindada', label: 'Cabine Blindada ao Tempo' },
  { value: 'cabine_alvenaria', label: 'Cabine de Alvenaria' },
  { value: 'qgbt', label: 'QGBT – Quadro Geral de Baixa Tensão' },
  { value: 'qd', label: 'QD – Quadro de Distribuição' },
  { value: 'iluminacao', label: 'Iluminação' },
  { value: 'cftv', label: 'CFTV – Circuito Fechado de TV' },
  { value: 'monitoramento', label: 'Monitoramento' },
  { value: 'aterramento_spda', label: 'Aterramento / SPDA' },
  { value: 'inversor_solar', label: 'Inversor Solar' },
  { value: 'placa_solar', label: 'Placa Solar' },
  { value: 'estrutura_fixa', label: 'Estrutura Fixa' },
  { value: 'estrutura_tracker', label: 'Estrutura Tracker' },
  { value: 'cercamento', label: 'Cercamento' }
];

const CLASSIFICACOES = [
  { value: 'novo', label: 'Novo' },
  { value: 'usado', label: 'Usado' }
];

const CRITICIDADES = [
  { value: '1', label: '1 (Muito Baixa)' },
  { value: '2', label: '2 (Baixa)' },
  { value: '3', label: '3 (Média)' },
  { value: '4', label: '4 (Alta)' },
  { value: '5', label: '5 (Muito Alta)' }
];

const OPCOES_SIM_NAO = [
  { value: 'sim', label: 'Sim' },
  { value: 'nao', label: 'Não' }
];

const TIPOS_DEPRECIACAO = [
  { value: 'linear', label: 'Linear' },
  { value: 'uso', label: 'Uso' }
];

// Componente para campos específicos por tipo de equipamento
const CamposEspecificosPorTipo = ({ tipoEquipamento, formData, onChange }) => {
  const renderCamposPorTipo = () => {
    switch (tipoEquipamento) {
      case 'motor_inducao':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Tipo de Fundação</label>
              <Select value={formData?.tipoFundacao || ''} onValueChange={(value) => onChange('tipoFundacao', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="concreto">Concreto</SelectItem>
                  <SelectItem value="metalica">Metálica</SelectItem>
                  <SelectItem value="mista">Mista</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Potência (kW)</label>
              <input 
                type="number" 
                className="w-full px-3 py-2 border border-input bg-background rounded-md"
                placeholder="Ex: 15"
                value={formData?.potencia || ''}
                onChange={(e) => onChange('potencia', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Tensão Nominal</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-input bg-background rounded-md"
                placeholder="Ex: 380V"
                value={formData?.tensaoNominal || ''}
                onChange={(e) => onChange('tensaoNominal', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Corrente Nominal</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-input bg-background rounded-md"
                placeholder="Ex: 28A"
                value={formData?.correnteNominal || ''}
                onChange={(e) => onChange('correnteNominal', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Fator de Serviço</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-input bg-background rounded-md"
                placeholder="Ex: 1.15"
                value={formData?.fatorServico || ''}
                onChange={(e) => onChange('fatorServico', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Número de Polos</label>
              <Select value={formData?.numeroPolos || ''} onValueChange={(value) => onChange('numeroPolos', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 polos</SelectItem>
                  <SelectItem value="4">4 polos</SelectItem>
                  <SelectItem value="6">6 polos</SelectItem>
                  <SelectItem value="8">8 polos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Grau de Proteção (IP)</label>
              <Select value={formData?.grauProtecao || ''} onValueChange={(value) => onChange('grauProtecao', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IP54">IP54</SelectItem>
                  <SelectItem value="IP55">IP55</SelectItem>
                  <SelectItem value="IP56">IP56</SelectItem>
                  <SelectItem value="IP65">IP65</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Classe de Isolamento</label>
              <Select value={formData?.classeIsolamento || ''} onValueChange={(value) => onChange('classeIsolamento', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="B">Classe B</SelectItem>
                  <SelectItem value="F">Classe F</SelectItem>
                  <SelectItem value="H">Classe H</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Tipo de Partida</label>
              <Select value={formData?.tipoPartida || ''} onValueChange={(value) => onChange('tipoPartida', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="direta">Direta</SelectItem>
                  <SelectItem value="estrela_triangulo">Estrela-Triângulo</SelectItem>
                  <SelectItem value="soft_starter">Soft Starter</SelectItem>
                  <SelectItem value="inversor">Inversor de Frequência</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'transformador':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Potência Nominal (kVA)</label>
              <input 
                type="number" 
                className="w-full px-3 py-2 border border-input bg-background rounded-md"
                placeholder="Ex: 300"
                value={formData?.potenciaNominal || ''}
                onChange={(e) => onChange('potenciaNominal', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Tensão Primária</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-input bg-background rounded-md"
                placeholder="Ex: 13800V"
                value={formData?.tensaoPrimaria || ''}
                onChange={(e) => onChange('tensaoPrimaria', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Tensão Secundária</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-input bg-background rounded-md"
                placeholder="Ex: 380V"
                value={formData?.tensaoSecundaria || ''}
                onChange={(e) => onChange('tensaoSecundaria', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Tipo de Refrigeração</label>
              <Select value={formData?.tipoRefrigeracao || ''} onValueChange={(value) => onChange('tipoRefrigeracao', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ONAN">ONAN</SelectItem>
                  <SelectItem value="ONAF">ONAF</SelectItem>
                  <SelectItem value="A_SECO">A SECO</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Impedância (%)</label>
              <input 
                type="number" 
                step="0.01"
                className="w-full px-3 py-2 border border-input bg-background rounded-md"
                placeholder="Ex: 4.5"
                value={formData?.impedancia || ''}
                onChange={(e) => onChange('impedancia', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Grupo de Ligação</label>
              <Select value={formData?.grupoLigacao || ''} onValueChange={(value) => onChange('grupoLigacao', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dyn1">Dyn1</SelectItem>
                  <SelectItem value="Dyn5">Dyn5</SelectItem>
                  <SelectItem value="Dyn11">Dyn11</SelectItem>
                  <SelectItem value="Yyn0">Yyn0</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'inversor_solar':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Potência Nominal (kW)</label>
              <input 
                type="number" 
                className="w-full px-3 py-2 border border-input bg-background rounded-md"
                placeholder="Ex: 50"
                value={formData?.potenciaNominal || ''}
                onChange={(e) => onChange('potenciaNominal', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Tensão de Entrada (CC)</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-input bg-background rounded-md"
                placeholder="Ex: 600-1000V"
                value={formData?.tensaoEntrada || ''}
                onChange={(e) => onChange('tensaoEntrada', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Tensão de Saída (CA)</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-input bg-background rounded-md"
                placeholder="Ex: 380V"
                value={formData?.tensaoSaida || ''}
                onChange={(e) => onChange('tensaoSaida', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Rendimento (%)</label>
              <input 
                type="number" 
                step="0.1"
                className="w-full px-3 py-2 border border-input bg-background rounded-md"
                placeholder="Ex: 98.5"
                value={formData?.rendimento || ''}
                onChange={(e) => onChange('rendimento', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Número de MPPTs</label>
              <input 
                type="number" 
                className="w-full px-3 py-2 border border-input bg-background rounded-md"
                placeholder="Ex: 4"
                value={formData?.numeroMPPTs || ''}
                onChange={(e) => onChange('numeroMPPTs', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Tipo de Comunicação</label>
              <Select value={formData?.tipoComunicacao || ''} onValueChange={(value) => onChange('tipoComunicacao', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RS485">RS485</SelectItem>
                  <SelectItem value="WiFi">Wi-Fi</SelectItem>
                  <SelectItem value="Ethernet">Ethernet</SelectItem>
                  <SelectItem value="Bluetooth">Bluetooth</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      // Adicionar mais tipos conforme necessário...
      default:
        return (
          <div className="p-4 bg-muted/30 rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">
              Campos específicos para <strong>{TIPOS_EQUIPAMENTOS.find(t => t.value === tipoEquipamento)?.label}</strong> serão implementados.
            </p>
          </div>
        );
    }
  };

  if (!tipoEquipamento) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-sm text-muted-foreground border-b pb-2">
        Dados Técnicos - {TIPOS_EQUIPAMENTOS.find(t => t.value === tipoEquipamento)?.label}
      </h3>
      {renderCamposPorTipo()}
    </div>
  );
};

export const equipamentosFormFields: FormField[] = [
  // ============================================================================
  // DADOS GERAIS (COLUNA 1)
  // ============================================================================
  {
    key: 'nome',
    label: 'Nome',
    type: 'text',
    required: true,
    placeholder: 'Nome do equipamento',
    group: 'dados_gerais_col1'
  },
  {
    key: 'classificacao',
    label: 'Classificação',
    type: 'select',
    required: true,
    options: CLASSIFICACOES,
    group: 'dados_gerais_col1'
  },
  {
    key: 'numeroSerie',
    label: 'Número Série',
    type: 'text',
    placeholder: 'Número de série',
    group: 'dados_gerais_col1'
  },
  {
    key: 'emOperacao',
    label: 'Em Operação',
    type: 'select',
    options: OPCOES_SIM_NAO,
    group: 'dados_gerais_col1'
  },
  {
    key: 'tipoDepreciacao',
    label: 'Tipo de Depreciação',
    type: 'select',
    options: TIPOS_DEPRECIACAO,
    group: 'dados_gerais_col1'
  },
  {
    key: 'valorImobilizado',
    label: 'Valor Imobilizado',
    type: 'text',
    placeholder: '0,00',
    group: 'dados_gerais_col1'
  },

  // ============================================================================
  // DADOS GERAIS (COLUNA 2)
  // ============================================================================
  {
    key: 'plantaId',
    label: 'Planta',
    type: 'select',
    required: true,
    options: mockPlantas.map(p => ({ value: String(p.id), label: p.nome })),
    group: 'dados_gerais_col2'
  },
  {
    key: 'fabricante',
    label: 'Fabricante',
    type: 'text',
    placeholder: 'Nome do fabricante',
    group: 'dados_gerais_col2'
  },
  {
    key: 'criticidade',
    label: 'Criticidade',
    type: 'select',
    required: true,
    options: CRITICIDADES,
    group: 'dados_gerais_col2'
  },
  {
    key: 'fornecedor',
    label: 'Fornecedor',
    type: 'text',
    placeholder: 'Nome do fornecedor',
    group: 'dados_gerais_col2'
  },
  {
    key: 'dataImobilizacao',
    label: 'Data Imobilização',
    type: 'date',
    group: 'dados_gerais_col2'
  },
  {
    key: 'valorDepreciacao',
    label: 'Valor da Depreciação',
    type: 'text',
    placeholder: '0,00',
    group: 'dados_gerais_col2'
  },

  // ============================================================================
  // DADOS GERAIS (COLUNA 3)
  // ============================================================================
  {
    key: 'proprietarioId',
    label: 'Proprietário',
    type: 'select',
    required: true,
    options: mockProprietarios.map(p => ({ value: String(p.id), label: p.razaoSocial })),
    group: 'dados_gerais_col3'
  },
  {
    key: 'modelo',
    label: 'Modelo',
    type: 'text',
    placeholder: 'Modelo do equipamento',
    group: 'dados_gerais_col3'
  },
  {
    key: 'tipoEquipamento',
    label: 'Tipo',
    type: 'select',
    required: true,
    options: TIPOS_EQUIPAMENTOS,
    group: 'dados_gerais_col3'
  },
  {
    key: 'centroCusto',
    label: 'Centro de Custo',
    type: 'text',
    placeholder: 'Centro de custo',
    group: 'dados_gerais_col3'
  },
  {
    key: 'vidaUtil',
    label: 'Vida Útil',
    type: 'text',
    placeholder: 'Anos',
    group: 'dados_gerais_col3'
  },
  {
    key: 'valorContabil',
    label: 'Valor Contábil',
    type: 'text',
    placeholder: '0,00',
    group: 'dados_gerais_col3'
  },

  // ============================================================================
  // CHECKBOX TUC E CAMPOS A1-A6 (CAMPOS DE TEXTO SIMPLES)
  // ============================================================================
  {
    key: 'temTUC',
    label: 'TUC',
    type: 'checkbox',
    group: 'tuc_documentos'
  },
  {
    key: 'tuc',
    label: 'TUC',
    type: 'text',
    placeholder: 'Número/Código TUC',
    group: 'tuc_documentos',
    condition: (formData) => formData?.temTUC === true
  },
  {
    key: 'a1',
    label: 'A1',
    type: 'text',
    placeholder: 'Valor A1',
    group: 'tuc_documentos',
    condition: (formData) => formData?.temTUC === true
  },
  {
    key: 'a2',
    label: 'A2',
    type: 'text',
    placeholder: 'Valor A2',
    group: 'tuc_documentos',
    condition: (formData) => formData?.temTUC === true
  },
  {
    key: 'a3',
    label: 'A3',
    type: 'text',
    placeholder: 'Valor A3',
    group: 'tuc_documentos',
    condition: (formData) => formData?.temTUC === true
  },
  {
    key: 'a4',
    label: 'A4',
    type: 'text',
    placeholder: 'Valor A4',
    group: 'tuc_documentos',
    condition: (formData) => formData?.temTUC === true
  },
  {
    key: 'a5',
    label: 'A5',
    type: 'text',
    placeholder: 'Valor A5',
    group: 'tuc_documentos',
    condition: (formData) => formData?.temTUC === true
  },
  {
    key: 'a6',
    label: 'A6',
    type: 'text',
    placeholder: 'Valor A6',
    group: 'tuc_documentos',
    condition: (formData) => formData?.temTUC === true
  },

  // ============================================================================
  // PLANO DE MANUTENÇÃO
  // ============================================================================
  {
    key: 'planoManutencao',
    label: 'Plano de Manutenção',
    type: 'text',
    placeholder: 'Inserir',
    group: 'manutencao'
  },

  // ============================================================================
  // DADOS TÉCNICOS DINÂMICOS
  // ============================================================================
  {
    key: 'dadosTecnicosEspecificos',
    label: 'Dados Técnicos Específicos',
    type: 'custom',
    render: ({ formData, onChange }) => (
      <CamposEspecificosPorTipo 
        tipoEquipamento={formData?.tipoEquipamento}
        formData={formData}
        onChange={onChange}
      />
    ),
    group: 'dados_tecnicos'
  },

  // ============================================================================
  // LOCALIZAÇÃO
  // ============================================================================
  {
    key: 'localizacao',
    label: 'Localização (Área)',
    type: 'text',
    placeholder: 'Ex: Produção, Logística, Administrativo...',
    group: 'localizacao'
  }
];