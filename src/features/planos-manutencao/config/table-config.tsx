// src/features/planos-manutencao/config/table-config.tsx
import React from 'react';
import { 
  Layers, 
  Users, 
  CheckCircle, 
  XCircle,
  Calendar,
  Settings,
  FileText,
  AlertTriangle,
  ExternalLink,  // NOVO: Para botão associar
  Eye           // NOVO: Para ver tarefas
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';  // NOVO: Para botões de ação
import { TableColumn } from '@/types/base';
import { PlanoManutencao, CATEGORIAS_PLANO_LABELS } from '../types';

export const planosTableColumns: TableColumn<PlanoManutencao>[] = [
  {
    key: 'dados_principais',
    label: 'Plano de Manutenção',
    sortable: true,
    render: (plano) => (
      <div className="space-y-1">
        <div className="flex items-center gap-2 font-medium text-foreground">
          <Layers className="h-4 w-4 text-blue-600" />
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
          <span>{CATEGORIAS_PLANO_LABELS[plano.categoria]}</span>
        </div>
      </div>
    )
  },
  {
    key: 'estatisticas',
    label: 'Equipamentos & Tarefas',
    render: (plano) => (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Users className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm font-medium">
            {plano.totalEquipamentos || 0} equipamentos
          </span>
        </div>
        <div className="flex items-center gap-2">
          <FileText className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {plano.tarefasTemplate.length} templates
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Settings className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {plano.totalTarefasGeradas || 0} tarefas geradas
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
          {plano.publico ? (
            <Badge variant="outline" className="text-xs">
              Público
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs">
              Privado
            </Badge>
          )}
        </div>
      </div>
    )
  },
  {
    key: 'templates_resumo',
    label: 'Templates',
    hideOnMobile: true,
    render: (plano) => {
      const templatesAtivos = plano.tarefasTemplate.filter(t => t.ativa).length;
      const templatesCriticos = plano.tarefasTemplate.filter(t => ['4', '5'].includes(t.criticidade)).length;
      
      return (
        <div className="space-y-1">
          <div className="text-sm">
            <span className="font-medium">{templatesAtivos}</span>
            <span className="text-muted-foreground"> / {plano.tarefasTemplate.length} ativos</span>
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
            {new Date(plano.criadoEm).toLocaleDateString('pt-BR')}
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          por {plano.criadoPor}
        </div>
        {plano.atualizadoEm && (
          <div className="text-xs text-muted-foreground">
            Atualizado em {new Date(plano.atualizadoEm).toLocaleDateString('pt-BR')}
          </div>
        )}
      </div>
    )
  }
];