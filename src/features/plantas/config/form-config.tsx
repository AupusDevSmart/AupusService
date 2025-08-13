// src/features/plantas/config/form-config.tsx - ATUALIZADO
import React from 'react';
import { FormField, FormFieldProps } from '@/types/base';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Factory, Settings, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ProprietarioSelector } from '../components/ProprietarioSelector';
import { useEstadosIBGE, useCidadesIBGE, useViaCEP, formatarCEP, validarCEP } from '@/hooks/useEstadosIBGE';

// ✅ COMPONENTE COMPLETO: UF, Cidade e CEP com busca automática - SEM MUDANÇAS
const EnderecoCompleto = ({ onChange, disabled, entity }: FormFieldProps & { entity?: any }) => {
  const [selectedUF, setSelectedUF] = React.useState<string>('');
  const [selectedCidade, setSelectedCidade] = React.useState<string>('');
  const [cep, setCep] = React.useState<string>('');
  const [logradouro, setLogradouro] = React.useState<string>('');
  const [bairro, setBairro] = React.useState<string>('');
  const [initialized, setInitialized] = React.useState(false);
  const [lastCEP, setLastCEP] = React.useState('');
  
  const { estados, loading: loadingEstados } = useEstadosIBGE();
  const { cidades, loading: loadingCidades } = useCidadesIBGE(selectedUF);
  const { buscarCEP, loading: loadingCEP, error: errorCEP } = useViaCEP();

  // Inicializar apenas uma vez com dados existentes
  React.useEffect(() => {
    if (entity?.endereco && !initialized) {
      const endereco = entity.endereco;
      setSelectedUF(endereco.uf || '');
      setSelectedCidade(endereco.cidade || '');
      setCep(endereco.cep || '');
      setLogradouro(endereco.logradouro || '');
      setBairro(endereco.bairro || '');
      setInitialized(true);
    } else if (!entity?.endereco && !initialized) {
      setInitialized(true);
    }
  }, [entity?.endereco, initialized]);

  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;

  React.useEffect(() => {
    if (initialized) {
      const enderecoAtualizado = {
        uf: selectedUF,
        cidade: selectedCidade,
        cep,
        logradouro,
        bairro
      };
      
      onChangeRef.current(enderecoAtualizado);
    }
  }, [selectedUF, selectedCidade, cep, logradouro, bairro, initialized]);

  const handleUFChange = (newUF: string) => {
    setSelectedUF(newUF);
    setSelectedCidade('');
  };

  const handleCEPChange = (novoCEP: string) => {
    const cepFormatado = formatarCEP(novoCEP);
    setCep(cepFormatado);
  };

  const handleBuscarCEP = async () => {
    if (!validarCEP(cep)) {
      return;
    }

    const endereco = await buscarCEP(cep);
    if (endereco) {
      setLogradouro(endereco.logradouro);
      setBairro(endereco.bairro);
      setSelectedCidade(endereco.cidade);
      setSelectedUF(endereco.uf);
    }
  };

  React.useEffect(() => {
    if (validarCEP(cep) && cep.length === 9 && cep !== lastCEP) {
      setLastCEP(cep);
      handleBuscarCEP();
    }
  }, [cep, lastCEP]);

  if (!initialized) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-muted rounded"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-10 bg-muted rounded"></div>
          <div className="h-10 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Campo CEP com busca automática */}
      <div className="space-y-2">
        <label className="text-sm font-medium">CEP</label>
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="00000-000"
            value={cep}
            onChange={(e) => handleCEPChange(e.target.value)}
            disabled={disabled}
            maxLength={9}
            className={errorCEP ? 'border-red-500' : ''}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleBuscarCEP}
            disabled={disabled || !validarCEP(cep) || loadingCEP}
            className="shrink-0"
          >
            {loadingCEP ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
            ) : (
              <Settings className="h-4 w-4" />
            )}
            {loadingCEP ? 'Buscando...' : 'Buscar'}
          </Button>
        </div>
        
        {loadingCEP && (
          <p className="text-xs text-blue-600 flex items-center gap-1">
            <Settings className="h-3 w-3 animate-pulse" />
            Buscando endereço via CEP...
          </p>
        )}
        
        {errorCEP && (
          <p className="text-xs text-red-600">
            ⚠️ {errorCEP}
          </p>
        )}
        
        {validarCEP(cep) && !loadingCEP && !errorCEP && logradouro && (
          <p className="text-xs text-green-600">
            ✅ Endereço encontrado automaticamente
          </p>
        )}
      </div>

      {/* Grid com Logradouro e Bairro */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Logradouro <span className="text-red-500">*</span></label>
          <Input
            type="text"
            placeholder="Ex: Av. Industrial, 1000"
            value={logradouro}
            onChange={(e) => setLogradouro(e.target.value)}
            disabled={disabled}
            required
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Bairro</label>
          <Input
            type="text"
            placeholder="Ex: Distrito Industrial"
            value={bairro}
            onChange={(e) => setBairro(e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Grid com UF e Cidade */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">UF <span className="text-red-500">*</span></label>
          <select
            value={selectedUF}
            onChange={(e) => handleUFChange(e.target.value)}
            disabled={disabled || loadingEstados}
            className="w-full px-3 py-2 border border-input bg-background rounded-md"
            required
          >
            <option value="">
              {loadingEstados ? "Carregando estados..." : "Selecione um estado"}
            </option>
            {estados.map((estado) => (
              <option key={estado.value} value={estado.value}>
                {estado.label}
              </option>
            ))}
          </select>
          
          {loadingEstados && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Settings className="h-3 w-3 animate-pulse" />
              Carregando estados do IBGE...
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Cidade <span className="text-red-500">*</span></label>
          <select
            value={selectedCidade}
            onChange={(e) => setSelectedCidade(e.target.value)}
            disabled={disabled || loadingCidades || !selectedUF}
            className="w-full px-3 py-2 border border-input bg-background rounded-md"
            required
          >
            <option value="">
              {!selectedUF 
                ? "Selecione um estado primeiro" 
                : loadingCidades 
                ? "Carregando cidades..." 
                : "Selecione uma cidade"
              }
            </option>
            {cidades.map((cidade) => (
              <option key={cidade.value} value={cidade.value}>
                {cidade.label}
              </option>
            ))}
          </select>
          
          {loadingCidades && selectedUF && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Settings className="h-3 w-3 animate-pulse" />
              Carregando cidades de {selectedUF}...
            </p>
          )}
          
          {selectedUF && cidades.length > 0 && !loadingCidades && (
            <p className="text-xs text-green-600">
              ✅ {cidades.length} cidades disponíveis
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// ✅ COMPONENTE ATUALIZADO: Gestão de Equipamentos com navegação inteligente
const GestaoEquipamentosButton = ({ entity, mode }: { entity?: any; mode?: 'create' | 'edit' | 'view' }) => {
  const navigate = useNavigate();

  const handleOpenEquipamentos = () => {
    // ✅ Se é uma planta existente (view ou edit), navegar com filtro específico
    if (entity && entity.id && (mode === 'view' || mode === 'edit')) {
      const plantaId = entity.id;
      const plantaNome = encodeURIComponent(entity.nome || `Planta ${plantaId}`);
      
      console.log(`Navegando para equipamentos da planta ${plantaId}: ${entity.nome}`);
      navigate(`/equipamentos?plantaId=${plantaId}&plantaNome=${plantaNome}`);
    } else {
      // ✅ Para criar nova planta ou sem ID, navegar sem filtro
      console.log('Navegando para equipamentos sem filtro específico');
      navigate('/equipamentos');
    }
  };

  // ✅ Determinar se é uma planta existente
  const isPlantaExistente = entity && entity.id && (mode === 'view' || mode === 'edit');
  
  return (
    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 dark:from-green-950 dark:to-emerald-950 dark:border-green-800">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h4 className="font-medium text-green-900 dark:text-green-100 flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Gestão de Equipamentos
          </h4>
          
          {isPlantaExistente ? (
            <div className="space-y-1 mt-2">
              <p className="text-sm text-green-700 dark:text-green-300">
                Gerencie os equipamentos específicos desta planta:
              </p>
              <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 font-medium">
                <Factory className="h-3 w-3" />
                <span className="truncate">{entity.nome}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              {mode === 'create' 
                ? 'Após salvar a planta, você poderá gerenciar seus equipamentos'
                : 'Acesse a gestão completa de equipamentos do sistema'
              }
            </p>
          )}
        </div>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-green-300 text-green-700 hover:bg-green-100 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-800 shrink-0 ml-4"
          onClick={handleOpenEquipamentos}
          disabled={mode === 'create' && !entity?.id} // ✅ Desabilitar para nova planta
        >
          {isPlantaExistente ? (
            <>
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver Equipamentos
            </>
          ) : (
            <>
              <Settings className="h-4 w-4 mr-2" />
              Ir para Equipamentos
            </>
          )}
        </Button>
      </div>
      
      {/* ✅ Informação adicional para modo create */}
      {mode === 'create' && (
        <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-300">
          💡 <strong>Dica:</strong> Salve a planta primeiro para poder gerenciar seus equipamentos específicos
        </div>
      )}
    </div>
  );
};

export const plantasFormFields: FormField[] = [
  // Informações Básicas
  {
    key: 'nome',
    label: 'Nome da Planta',
    type: 'text',
    required: true,
    placeholder: 'Ex: Planta Industrial São Paulo',
  },
  {
    key: 'cnpj',
    label: 'CNPJ',
    type: 'text',
    required: true,
    placeholder: '00.000.000/0000-00',
    validation: (value) => {
      if (!value) return null;
      const cleaned = String(value).replace(/\D/g, '');
      if (cleaned.length !== 14) {
        return 'CNPJ deve ter 14 dígitos';
      }
      return null;
    },
  },
  // Campo customizado para seleção de proprietário
  {
    key: 'proprietarioId',
    label: 'Proprietário',
    type: 'custom',
    required: true,
    render: ({ value, onChange, disabled }) => (
      <ProprietarioSelector 
        value={value as number | null} 
        onChange={onChange} 
        disabled={disabled}
      />
    ),
  },
  {
    key: 'horarioFuncionamento',
    label: 'Horário de Funcionamento',
    type: 'text',
    required: true,
    placeholder: 'Ex: 08:00 às 18:00',
  },

  // Localização
  {
    key: 'localizacao',
    label: 'Localização',
    type: 'text',
    required: true,
    placeholder: 'Ex: Zona Sul - Galpão 1',
  },

  // Endereço
  {
    key: 'endereco',
    label: 'Endereço Completo',
    type: 'custom',
    required: true,
    render: EnderecoCompleto,
  },

  // ✅ CAMPO ATUALIZADO: Gestão de Equipamentos com mode
  {
    key: 'gestaoEquipamentos',
    label: 'Gestão de Equipamentos',
    type: 'custom',
    required: false,
    render: ({ entity, mode }) => (
      <GestaoEquipamentosButton entity={entity} mode={mode as 'view' | 'create' | 'edit'} />
    ),
  }
];