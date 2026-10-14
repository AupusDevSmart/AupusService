// src/features/usuarios/config/form-config.tsx - ATUALIZADO PARA DTO
import { useMemo } from 'react';
import { FormField } from '@/core/types/base';
import {  Permissao } from '../types';
import { Checkbox } from '@/core/components/ui/checkbox';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/core/components/ui/select';
import { EstadoSelect } from '@/core/components/common/EstadoSelect';
import { CidadeSelect } from '@/core/components/common/CidadeSelect';
import { CEPInput } from '@/core/components/common/CEPInput';
import { GerenteSelect } from '@/core/components/common/GerenteSelect';
import { ConcessionariaSelect } from '@/core/components/common/ConcessionariaSelect';
import { OrganizacaoSelect } from '@/core/components/common/OrganizacaoSelect';
import { useRoles, usePermissoesGrouped, useUserStore } from '@/core/context/hooks';
import { papeisQuePodeDar, permissoesMarcadas, soAsExtras, type PapelDaTela } from '@/core/features/usuarios/utils/papeis';

// Normaliza o valor recebido pelo selector de permissoes para sempre ser string[]
const normalizePermissionValue = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item: any) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') {
        return item.name || item.value || item.permission || '';
      }
      return '';
    })
    .filter((v): v is string => typeof v === 'string' && v.length > 0);
};

// Mapeia nomes tecnicos `recurso.acao` para nomes humanizados em portugues.
// Ex.: `anomalias.create` -> "Criar anomalia"; `dashboard.view` -> "Visualizar dashboard".
// Quando o backend ja entrega um display_name diferente do name, ele eh respeitado.
const RESOURCE_LABELS: Record<string, string> = {
  anomalias: 'anomalia',
  usuarios: 'usuário',
  plantas: 'planta',
  unidades: 'unidade',
  equipamentos: 'equipamento',
  organizacoes: 'organização',
  ugs: 'UG',
  concessionarias: 'concessionária',
  dashboard: 'dashboard',
  monitoramento: 'monitoramento',
  scada: 'SCADA',
  supervisorio: 'supervisório',
  controle: 'controle',
  prospeccao: 'prospecção',
  prospec: 'prospecção',
  oportunidades: 'oportunidade',
  financeiro: 'financeiro',
  clube: 'clube',
  configuracoes: 'configuração',
  documentos: 'documento',
  relatorios: 'relatório',
  admin: 'administração',
  equipe: 'equipe',
  permissions: 'permissão',
  roles: 'role',
  agenda: 'agenda',
  feriados: 'feriado',
  veiculos: 'veículo',
  planos: 'plano',
  tarefas: 'tarefa',
  manutencao: 'manutenção',
  diagramas: 'diagrama',
  iot: 'IoT',
  ota: 'OTA',
  mqtt: 'MQTT',
  logs: 'log',
};

const ACTION_LABELS: Record<string, string> = {
  view: 'Visualizar',
  list: 'Listar',
  create: 'Criar',
  update: 'Editar',
  edit: 'Editar',
  delete: 'Excluir',
  remove: 'Remover',
  manage: 'Gerenciar',
  export: 'Exportar',
  import: 'Importar',
  approve: 'Aprovar',
  reject: 'Rejeitar',
  assign: 'Atribuir',
  read: 'Visualizar',
  write: 'Editar',
  admin: 'Administrar',
  all: 'Acesso total',
};

const titleCase = (s: string) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

const humanizePermissionName = (name: string): string => {
  if (!name) return '';
  const [resource, action, ...rest] = name.split('.');
  const resourceLabel = RESOURCE_LABELS[resource] ?? resource.replace(/_/g, ' ');
  if (!action) return titleCase(resourceLabel);
  const actionLabel = ACTION_LABELS[action] ?? titleCase(action);
  const suffix = rest.length ? ' (' + rest.join('.') + ')' : '';
  return `${actionLabel} ${resourceLabel}${suffix}`;
};

// Decide qual texto usar no checkbox: prioriza display_name do backend
// (apenas se diferente do nome tecnico) e cai no humanizador caso contrario.
const getPermissionLabel = (permissao: { value: string; label?: string }): string => {
  if (permissao.label && permissao.label !== permissao.value) {
    return permissao.label;
  }
  return humanizePermissionName(permissao.value);
};

// TIPO DO USUÁRIO: só os papéis que quem está na tela pode dar
// (usuarios.create_<papel>, a mesma regra do backend), com o que cada um faz e
// o que enxerga.
const RoleSelector = ({ value, onChange, disabled }: any) => {
  const { roles, loading, error } = useRoles();
  const { hasPermission, isSuperAdmin } = useUserStore();
  const atual: string | undefined = typeof value === 'string' && value.trim() ? value : undefined;
  const opcoes = papeisQuePodeDar(roles, hasPermission, isSuperAdmin(), atual);
  const escolhido = roles.find((papel: PapelDaTela) => papel.value === atual);

  if (loading) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Carregando tipos de usuário..." />
        </SelectTrigger>
      </Select>
    );
  }

  if (error && roles.length === 0) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
        Não foi possível carregar os tipos de usuário: {error}
      </div>
    );
  }

  const descricao = escolhido?.description && (
    <p className="mt-1.5 text-xs text-muted-foreground">
      {escolhido.description}
      {escolhido.escopo ? ` Enxerga: ${escolhido.escopo.charAt(0).toLowerCase()}${escolhido.escopo.slice(1)}.` : ''}
    </p>
  );

  if (disabled) {
    return (
      <div>
        <div className="flex items-center rounded-md border bg-muted p-3">
          <span className="text-sm font-medium">{escolhido?.label ?? atual ?? 'Não definido'}</span>
        </div>
        {descricao}
      </div>
    );
  }

  if (opcoes.length === 0) {
    return <div className="rounded-md border p-3 text-sm text-muted-foreground">Você não pode dar nenhum tipo de usuário.</div>;
  }

  return (
    <div>
      <Select key={`papel-${atual ?? 'vazio'}`} value={atual} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Selecione o tipo de usuário" />
        </SelectTrigger>
        <SelectContent>
          {opcoes.map((papel) => (
            <SelectItem key={papel.value} value={papel.value}>
              <span className="font-medium">{papel.label}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {descricao}
    </div>
  );
};

// PERMISSÕES: as do tipo vêm do tipo (marcadas e travadas; mudar o tipo muda o
// acesso). Só as extras se escolhem, e só quem gerencia usuários — o backend
// grava como direta apenas o que o tipo não dá. O valor do campo guarda só as
// extras.
const PermissoesSelector = ({ value, onChange, disabled, formData, onMultipleChange }: any) => {
  const { permissoesPorCategoria, loading, error } = usePermissoesGrouped();
  const { roles } = useRoles();
  const { hasPermission } = useUserStore();

  const nomeDoPapel: string | undefined = (() => {
    const raw = formData?.roleNames;
    if (Array.isArray(raw)) return raw[0];
    if (typeof raw === 'string' && raw.trim()) return raw;
    return undefined;
  })();
  const papel = roles.find((r: PapelDaTela) => r.value === nomeDoPapel);
  const doPapel: string[] = useMemo(() => papel?.permissions ?? [], [papel]);
  const extras = useMemo(() => soAsExtras(normalizePermissionValue(value), doPapel), [value, doPapel]);
  const marcadas = permissoesMarcadas(doPapel, extras);
  const podeDarExtras = !disabled && hasPermission('usuarios.manage');

  const alterar = (novas: string[]) => {
    // Só a lista mexida vai ao servidor (mapFormDataToCreateDto): o sheet pode
    // abrir antes de as diretas carregarem, e mandar a lista vazia apagaria todas.
    if (onMultipleChange) onMultipleChange({ permissions: novas, permissoesAlteradas: true });
    else onChange(novas);
  };
  const alternar = (permissao: string, marcar: boolean) =>
    alterar(marcar ? [...extras, permissao] : extras.filter((p) => p !== permissao));

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-lg border p-8">
        <div className="text-sm text-muted-foreground">Carregando permissões...</div>
      </div>
    );
  }

  if (error && Object.keys(permissoesPorCategoria).length === 0) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        Não foi possível carregar as permissões: {error}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>
          {papel ? (
            <>
              <span className="font-medium text-foreground">{doPapel.length}</span> vêm do tipo{' '}
              <span className="font-medium text-foreground">{papel.label}</span>
            </>
          ) : (
            'Escolha o tipo do usuário: as permissões dele vêm do tipo'
          )}
          {extras.length > 0 && (
            <>
              {' '}
              e <span className="font-medium text-foreground">{extras.length}</span> extra{extras.length > 1 ? 's' : ''}
            </>
          )}
          .
        </span>
        {podeDarExtras && extras.length > 0 && (
          <Button type="button" variant="ghost" size="sm" onClick={() => alterar([])}>
            Tirar as extras
          </Button>
        )}
        {!disabled && !podeDarExtras && <span>Só quem gerencia usuários dá permissões extras.</span>}
      </div>

      <div className="grid max-h-72 grid-cols-1 gap-4 overflow-y-auto rounded-lg border p-4 md:grid-cols-2">
        {Object.entries(permissoesPorCategoria).map(([categoria, permissoes]) => (
          <div key={categoria} className="space-y-2">
            <h4 className="border-b pb-1 text-sm font-medium text-muted-foreground">{categoria}</h4>
            {(permissoes as any[]).map((permissao) => {
              const doTipo = doPapel.includes(permissao.value);
              const marcada = marcadas.has(permissao.value);
              return (
                <div key={permissao.value} className="flex items-center gap-2">
                  <Checkbox
                    id={permissao.value}
                    checked={marcada}
                    onCheckedChange={(c) => alternar(permissao.value as Permissao, !!c)}
                    disabled={disabled || doTipo || !podeDarExtras}
                  />
                  <label htmlFor={permissao.value} className="flex-1 cursor-pointer text-sm" title={permissao.description || permissao.value}>
                    {getPermissionLabel(permissao)}
                  </label>
                  {doTipo && (
                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                      do tipo
                    </Badge>
                  )}
                  {marcada && !doTipo && (
                    <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                      extra
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

// Componente para seleção de estado com IBGE
const EstadoSelector = ({ value, onChange, disabled, onMultipleChange, formData }: any) => {
  const handleEstadoChange = (estado: { id: string; nome: string; sigla: string }) => {

    // Atualizar estadoId (para o CidadeSelect depender)
    if (onChange) {
      onChange(estado.id);
    }

    // ✅ Atualizar campo de estado (nome) para enviar ao backend
    if (onMultipleChange) {
      onMultipleChange({
        estadoId: estado.id,
        estado: estado.sigla // Backend espera a sigla (ex: "GO", "SP")
      });
    }
  };

  return (
    <EstadoSelect
      value={value}
      displayValue={formData?.estado}
      onEstadoChange={handleEstadoChange}
      disabled={disabled}
      placeholder="Selecione um estado"
    />
  );
};

// Componente para seleção de cidade com IBGE
const CidadeSelector = ({ value, onChange, disabled, estadoId, onMultipleChange, formData }: any) => {
  const handleCidadeChange = (cidade: { id: string; nome: string }) => {

    // Atualizar cidadeId
    if (onChange) {
      onChange(cidade.id);
    }

    // ✅ Atualizar campo de cidade (nome) para enviar ao backend
    if (onMultipleChange) {
      onMultipleChange({
        cidadeId: cidade.id,
        cidade: cidade.nome // Backend espera o nome da cidade
      });
    }
  };

  return (
    <CidadeSelect
      value={value}
      displayValue={formData?.cidade}
      onCidadeChange={handleCidadeChange}
      estadoId={estadoId ? parseInt(estadoId) : null}
      disabled={disabled}
      placeholder="Selecione uma cidade"
    />
  );
};

// Componente para CEP com busca automática
const CEPSelector = ({ value, onChange, disabled, onMultipleChange }: any) => {
  const handleEnderecoChange = (endereco: any) => {
    // Atualizar campo de endereço completo quando CEP for encontrado
    if (onMultipleChange && endereco) {
      // Concatenar endereço e bairro em um único campo
      const enderecoCompleto = [
        endereco.endereco,
        endereco.bairro
      ].filter(Boolean).join(' - ');

      // ✅ Incluir TODOS os dados do endereço + IDs do IBGE
      const dataToSend = {
        cep: endereco.cep || value, // Priorizar o CEP que veio da busca
        endereco: enderecoCompleto || endereco.endereco,
        // ✅ Incluir dados de estado e cidade do ViaCEP + IDs do IBGE
        estado: endereco.estado, // Sigla (ex: "GO")
        estadoId: endereco.estadoId, // ID do IBGE (ex: "52")
        cidade: endereco.cidade, // Nome (ex: "Goiânia")
        cidadeId: endereco.cidadeId, // ID do IBGE (ex: "5208707")
      };

      onMultipleChange(dataToSend);
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
    label: 'Endereço Completo',
    type: 'text',
    placeholder: 'Rua das Flores, 123 - Centro - Apto 101',
    group: 'localizacao',
    help: 'Inclua rua, número, bairro e complemento'
  },
  
  // ✅ CONFIGURAÇÕES DO SISTEMA
  {
    key: 'roleNames',
    label: 'Tipo de Usuário',
    type: 'custom',
    required: true,
    render: RoleSelector,
    group: 'configuracoes',
    help: 'Define o que a pessoa faz e o que enxerga'
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    required: true,
    defaultValue: 'Ativo',
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
    group: 'permissoes',
    colSpan: 2 // Ocupa largura total
  }
];