// src/features/usuarios/config/form-config.tsx - ATUALIZADO PARA DTO
import { FormField } from '@/types/base';
import {  Permissao } from '../types';
import { Checkbox } from '@/components/ui/checkbox';
import { EstadoSelect } from '@/components/common/EstadoSelect';
import { CidadeSelect } from '@/components/common/CidadeSelect';
import { CEPInput } from '@/components/common/CEPInput';
import { GerenteSelect } from '@/components/common/GerenteSelect';
import { ConcessionariaSelect } from '@/components/common/ConcessionariaSelect';
import { OrganizacaoSelect } from '@/components/common/OrganizacaoSelect';

// ✅ ROLES ATIVOS NO SISTEMA (BASEADO NA API ATUAL)
const ROLES_USUARIO = [
  { value: 'admin', label: 'Administrador', role: 'admin' },
  { value: 'gerente', label: 'Gerente', role: 'gerente' },
  { value: 'vendedor', label: 'Vendedor', role: 'vendedor' },
  { value: 'consultor', label: 'Consultor', role: 'consultor' },
];

// ✅ TODAS AS PERMISSÕES REAIS DO BANCO DE DADOS
const TODAS_PERMISSOES: { value: Permissao; label: string; categoria: string }[] = [
  // Painel Geral
  { value: 'PainelGeral', label: 'Painel Geral', categoria: 'Painel' },
  { value: 'PainelGeralOrganizacoes', label: 'Painel - Organizações', categoria: 'Painel' },
  { value: 'PainelGeralCativos', label: 'Painel - Cativos', categoria: 'Painel' },
  { value: 'PainelGeralClube', label: 'Painel - Clube', categoria: 'Painel' },
  
  // Dashboard
  { value: 'Dashboard', label: 'Dashboard', categoria: 'Dashboard' },
  { value: 'dashboard.view', label: 'Visualizar Dashboard', categoria: 'Dashboard' },
  
  // Monitoramento
  { value: 'MonitoramentoOrganizacoes', label: 'Monitoramento de Organizações', categoria: 'Monitoramento' },
  { value: 'Monitoramento', label: 'Monitoramento Geral', categoria: 'Monitoramento' },
  { value: 'MonitoramentoConsumo', label: 'Monitoramento de Consumo', categoria: 'Monitoramento' },
  
  // Sistemas Principais
  { value: 'NET', label: 'Sistema NET', categoria: 'Sistemas' },
  { value: 'CRM', label: 'Sistema CRM', categoria: 'Sistemas' },
  { value: 'Oportunidades', label: 'Oportunidades', categoria: 'Sistemas' },
  
  // Administração
  { value: 'Usuarios', label: 'Usuários', categoria: 'Administração' },
  { value: 'Organizacoes', label: 'Organizações', categoria: 'Administração' },
  { value: 'UnidadesConsumidoras', label: 'Unidades Consumidoras', categoria: 'Administração' },
  { value: 'Configuracoes', label: 'Configurações', categoria: 'Administração' },
  { value: 'Arquivos', label: 'Arquivos', categoria: 'Administração' },
  
  // Configurações Detalhadas
  { value: 'configuracoes.view', label: 'Visualizar Configurações', categoria: 'Configurações' },
  { value: 'configuracoes.edit', label: 'Editar Configurações', categoria: 'Configurações' },
  
  // Cadastros
  { value: 'Cadastros', label: 'Cadastros Geral', categoria: 'Cadastros' },
  { value: 'CadastroOrganizacoes', label: 'Cadastro de Organizações', categoria: 'Cadastros' },
  { value: 'CadastroUsuarios', label: 'Cadastro de Usuários', categoria: 'Cadastros' },
  { value: 'CadastroUnidadesConsumidoras', label: 'Cadastro de UCs', categoria: 'Cadastros' },
  { value: 'CadastroConcessionarias', label: 'Cadastro de Concessionárias', categoria: 'Cadastros' },
  
  // Financeiro
  { value: 'FinanceiroAdmin', label: 'Financeiro Admin', categoria: 'Financeiro' },
  { value: 'Financeiro', label: 'Financeiro Geral', categoria: 'Financeiro' },
  { value: 'FinanceiroConsultor', label: 'Financeiro Consultor', categoria: 'Financeiro' },
  
  // Super Admin
  { value: 'SuperAdmin', label: 'Super Administrador', categoria: 'Super Admin' },
  
  // Energia e Geração
  { value: 'GeracaoEnergia', label: 'Geração de Energia', categoria: 'Energia' },
  { value: 'Reclamacoes', label: 'Reclamações', categoria: 'Energia' },
  
  // Gestão (permissões da API que faltavam)
  { value: 'GestaoOportunidades', label: 'Gestão de Oportunidades', categoria: 'Gestão' },
  { value: 'Proprietarios', label: 'Proprietários', categoria: 'Gestão' },
  { value: 'Equipamentos', label: 'Equipamentos', categoria: 'Gestão' },
  { value: 'Plantas', label: 'Plantas', categoria: 'Gestão' },
  
  // Áreas Específicas
  { value: 'Associados', label: 'Associados', categoria: 'Áreas' },
  { value: 'Documentos', label: 'Documentos', categoria: 'Áreas' },
  { value: 'Prospeccao', label: 'Prospecção', categoria: 'Áreas' },
  { value: 'AreaDoAssociado', label: 'Área do Associado', categoria: 'Áreas' },
  { value: 'AreaDoProprietario', label: 'Área do Proprietário', categoria: 'Áreas' },
  { value: 'MinhasUsinas', label: 'Minhas Usinas', categoria: 'Áreas' },
  
  // Prospecção Detalhada
  { value: 'prospec.view', label: 'Visualizar Prospecções', categoria: 'Prospecção' },
  { value: 'prospec.create', label: 'Criar Prospecções', categoria: 'Prospecção' },
  { value: 'prospec.edit', label: 'Editar Prospecções', categoria: 'Prospecção' },
  { value: 'prospec.delete', label: 'Excluir Prospecções', categoria: 'Prospecção' },
  
  // Controle
  { value: 'controle.view', label: 'Visualizar Controle', categoria: 'Controle' },
  { value: 'controle.manage', label: 'Gerenciar Controle', categoria: 'Controle' },
  
  // UGs (Unidades Geradoras)
  { value: 'ugs.view', label: 'Visualizar UGs', categoria: 'UGs' },
  { value: 'ugs.create', label: 'Criar UGs', categoria: 'UGs' },
  { value: 'ugs.edit', label: 'Editar UGs', categoria: 'UGs' },
  
  // Relatórios
  { value: 'relatorios.view', label: 'Visualizar Relatórios', categoria: 'Relatórios' },
  { value: 'relatorios.export', label: 'Exportar Relatórios', categoria: 'Relatórios' },
  
  // Equipe
  { value: 'equipe.view', label: 'Visualizar Equipe', categoria: 'Equipe' },
  { value: 'equipe.create', label: 'Criar Equipe', categoria: 'Equipe' },
];

// ✅ COMPONENTE PARA SELEÇÃO DE PERMISSÕES
const PermissoesSelector = ({ value, onChange, disabled }: any) => {
  const permissoesSelecionadas = value || [];
  
  // console.log('🔐 PermissoesSelector - valor recebido:', value);
  // console.log('🔐 PermissoesSelector - permissões selecionadas:', permissoesSelecionadas);
  
  // Debug: verificar se as permissões selecionadas existem na lista
  if (permissoesSelecionadas.length > 0) {
    const permissoesDisponiveis = TODAS_PERMISSOES.map(p => p.value);
    const permissoesNaoEncontradas = permissoesSelecionadas.filter((p: string) => !permissoesDisponiveis.includes(p as Permissao));
    if (permissoesNaoEncontradas.length > 0) {
      console.warn('⚠️ Permissões não encontradas na lista:', permissoesNaoEncontradas);
    }
  }
  
  const handlePermissaoChange = (permissao: Permissao, checked: boolean) => {
    let novasPermissoes;
    if (checked) {
      novasPermissoes = [...permissoesSelecionadas, permissao];
    } else {
      novasPermissoes = permissoesSelecionadas.filter((p: Permissao) => p !== permissao);
    }
    onChange(novasPermissoes);
  };

  // Agrupar permissões por categoria
  const permissoesPorCategoria = TODAS_PERMISSOES.reduce((acc, perm) => {
    if (!acc[perm.categoria]) acc[perm.categoria] = [];
    acc[perm.categoria].push(perm);
    return acc;
  }, {} as Record<string, typeof TODAS_PERMISSOES>);

  return (
    <div className="space-y-4">   
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-64 overflow-y-auto border rounded-lg p-4">
        {Object.entries(permissoesPorCategoria).map(([categoria, permissoes]) => (
          <div key={categoria} className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground border-b pb-1">
              {categoria}
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

// Componente para seleção de estado com IBGE
const EstadoSelector = ({ value, onChange, disabled }: any) => {
  return (
    <EstadoSelect
      value={value}
      onValueChange={onChange}
      disabled={disabled}
      placeholder="Selecione um estado"
    />
  );
};

// Componente para seleção de cidade com IBGE
const CidadeSelector = ({ value, onChange, disabled, estadoId }: any) => {
  return (
    <CidadeSelect
      value={value}
      onValueChange={onChange}
      estadoId={estadoId ? parseInt(estadoId) : null}
      disabled={disabled}
      placeholder="Selecione uma cidade"
    />
  );
};

// Componente para CEP com busca automática
const CEPSelector = ({ value, onChange, disabled, onMultipleChange }: any) => {
  const handleEnderecoChange = (endereco: any) => {
    // Atualizar outros campos do formulário quando CEP for encontrado
    if (onMultipleChange) {
      onMultipleChange({
        endereco: endereco.endereco,
        bairro: endereco.bairro,
        // Nota: cidade e estado ficam nos selects IBGE separados
      });
    }
  };

  return (
    <CEPInput
      value={value}
      onChange={onChange}
      onEnderecoChange={handleEnderecoChange}
      disabled={disabled}
      placeholder="Digite o CEP (ex: 01234-567)"
      autoSearch={true}
    />
  );
};

// Componente para seleção de gerente responsável
const GerenteSelector = ({ value, onChange, disabled }: any) => {
  return (
    <GerenteSelect
      value={value}
      onValueChange={onChange}
      disabled={disabled}
      placeholder="Selecione o gerente responsável"
    />
  );
};

// Componente para seleção de concessionária
const ConcessionariaSelector = ({ value, onChange, disabled }: any) => {
  return (
    <ConcessionariaSelect
      value={value}
      onValueChange={onChange}
      disabled={disabled}
      placeholder="Selecione a concessionária"
    />
  );
};

// Componente para seleção de organização
const OrganizacaoSelector = ({ value, onChange, disabled }: any) => {
  return (
    <OrganizacaoSelect
      value={value}
      onValueChange={onChange}
      disabled={disabled}
      placeholder="Selecione a organização"
    />
  );
};

export const usuariosFormFields: FormField[] = [
  // ✅ INFORMAÇÕES BÁSICAS
  {
    key: 'nome',
    label: 'Nome Completo',
    type: 'text',
    required: true,
    placeholder: 'Ex: João Silva Santos',
    group: 'informacoes_basicas'
  },
  {
    key: 'email',
    label: 'E-mail',
    type: 'email',
    required: true,
    placeholder: 'joao@email.com',
    group: 'informacoes_basicas',
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
    placeholder: '(11) 99999-9999',
    group: 'informacoes_basicas'
  },
  {
    key: 'instagram',
    label: 'Instagram',
    type: 'text',
    placeholder: '@usuario',
    group: 'informacoes_basicas'
  },
  {
    key: 'cpfCnpj',
    label: 'CPF/CNPJ',
    type: 'text',
    placeholder: '123.456.789-10',
    group: 'informacoes_basicas'
  },
  
  // ✅ LOCALIZAÇÃO
  {
    key: 'cep',
    label: 'CEP',
    type: 'custom',
    required: false,
    render: CEPSelector,
    group: 'localizacao'
  },
  {
    key: 'estadoId',
    label: 'Estado',
    type: 'custom',
    required: false,
    render: EstadoSelector,
    group: 'localizacao'
  },
  {
    key: 'cidadeId',
    label: 'Cidade',
    type: 'custom',
    required: false,
    render: CidadeSelector,
    group: 'localizacao',
    dependencies: ['estadoId']
  },
  {
    key: 'endereco',
    label: 'Endereço',
    type: 'text',
    placeholder: 'Rua das Flores, 123',
    group: 'localizacao'
  },
  {
    key: 'bairro',
    label: 'Bairro',
    type: 'text',
    placeholder: 'Centro',
    group: 'localizacao'
  },
  
  // ✅ CONFIGURAÇÕES DO SISTEMA
  {
    key: 'roleNames',
    label: 'Tipo de Usuário',
    type: 'select',
    required: true,
    options: ROLES_USUARIO.map(role => ({
      value: role.value,
      label: role.label
    })),
    group: 'configuracoes'
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
    group: 'configuracoes'
  },
  
  // ✅ PERMISSÕES
  {
    key: 'permissions',
    label: 'Permissões',
    type: 'custom',
    required: false,
    render: PermissoesSelector,
    group: 'permissoes'
  },
  
  // ✅ ORGANIZACIONAL (OPCIONAL)
  {
    key: 'managerId',
    label: 'Gerente Responsável',
    type: 'custom',
    required: false,
    render: GerenteSelector,
    group: 'organizacional'
  },
  {
    key: 'concessionariaAtualId',
    label: 'Concessionária Atual',
    type: 'custom',
    required: false,
    render: ConcessionariaSelector,
    group: 'organizacional'
  },
  {
    key: 'organizacaoAtualId',
    label: 'Organização Atual',
    type: 'custom',
    required: false,
    render: OrganizacaoSelector,
    group: 'organizacional'
  }
];