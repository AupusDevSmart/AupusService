// src/features/planos-manutencao/config/table-config.tsx
import { 
  Layers, 
  Users, 
  CheckCircle, 
  XCircle,
  Calendar,
  Settings,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TableColumn } from '@/types/base';
import { PlanoManutencaoApiResponse } from '@/services/planos-manutencao.services';

export const planosTableColumns: TableColumn<PlanoManutencaoApiResponse>[] = [
  {
    key: 'dados_principais',
    label: 'Plano de Manutenção',
    sortable: true,
    render: (plano) => (
      <div className="space-y-1">
        <div className="flex items-center gap-2 font-medium text-foreground">
          <Layers className="h-4 w-4 text-gray-600" />
          <span>{plano.nome}</span>
        </div>
        {plano.descricao && (
          <div className="text-sm text-muted-foreground truncate max-w-64" title={plano.descricao}>
            {plano.descricao}
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>v{plano.versao}</span>
          <span>•</span>
          <span>{plano.equipamento?.nome || 'Equipamento não informado'}</span>
        </div>
      </div>
    )
  },
  {
    key: 'estatisticas',
    label: 'Equipamento & Tarefas',
    render: (plano) => (
      <div className="space-y-1">
        {/* Hierarquia: Planta → Unidade */}
        <div className="flex items-center gap-2">
          <Users className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm font-medium">
            {plano.equipamento?.unidade?.planta?.nome || plano.equipamento?.planta?.nome || 'Planta não informada'}
          </span>
        </div>
        {plano.equipamento?.unidade && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>→</span>
            <span>{plano.equipamento.unidade.nome}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <FileText className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {plano.total_tarefas || 0} tarefas
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Settings className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {plano.tarefas_ativas || 0} ativas
          </span>
        </div>
      </div>
    )
  },
  {
    key: 'status_visibilidade',
    label: 'Status',
    render: (plano) => (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {plano.ativo ? (
            <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
              <CheckCircle className="h-3 w-3 mr-1" />
              Ativo
            </Badge>
          ) : (
            <Badge className="text-xs bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300">
              <XCircle className="h-3 w-3 mr-1" />
              Inativo
            </Badge>
          )}
        </div>
        <div>
          <Badge variant="outline" className="text-xs">
            {plano.status}
          </Badge>
        </div>
      </div>
    )
  },
  {
    key: 'templates_resumo',
    label: 'Templates',
    hideOnMobile: true,
    render: (plano) => {
      const templatesAtivos = plano.tarefas_ativas || 0;
      const totalTemplates = plano.total_tarefas || 0;
      const templatesCriticos = plano.tarefas?.filter(t => ['4', '5'].includes(String(t.criticidade))).length || 0;
      
      return (
        <div className="space-y-1">
          <div className="text-sm">
            <span className="font-medium">{templatesAtivos}</span>
            <span className="text-muted-foreground"> / {totalTemplates} ativos</span>
          </div>
          {templatesCriticos > 0 && (
            <div className="flex items-center gap-1 text-xs text-orange-600">
              <AlertTriangle className="h-3 w-3" />
              {templatesCriticos} críticos
            </div>
          )}
        </div>
      );
    }
  },
  {
    key: 'informacoes_criacao',
    label: 'Criação',
    hideOnTablet: true,
    render: (plano) => (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {plano.created_at ? new Date(plano.created_at).toLocaleDateString('pt-BR') : 'N/A'}
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          por {plano.criado_por || 'N/A'}
        </div>
        {plano.updated_at && (
          <div className="text-xs text-muted-foreground">
            Atualizado em {new Date(plano.updated_at).toLocaleDateString('pt-BR')}
          </div>
        )}
      </div>
    )
  }
];