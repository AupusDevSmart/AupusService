// src/features/plantas/config/table-config.tsx - TABELA MELHORADA
import React from 'react';
import { 
  Factory, 
  Building2, 
  MapPin, 
  Clock, 
  Calendar,
  Badge
} from 'lucide-react';
import { Badge as UIBadge } from '@/components/ui/badge';
import { TableColumn } from '@/types/base';
import { Planta } from '../types';

export const plantasTableColumns: TableColumn<Planta>[] = [
  {
    key: 'dados_principais',
    label: 'Planta',
    sortable: true,
    render: (planta) => (
      <div className="space-y-1">
        <div className="flex items-center gap-2 font-medium text-foreground">
          <Factory className="h-4 w-4 text-blue-600" />
          {planta.nome}
        </div>
        <div className="text-xs font-mono text-muted-foreground">
          CNPJ: {planta.cnpj}
        </div>
      </div>
    )
  },
  {
    key: 'proprietario',
    label: 'Proprietário',
    render: (planta) => (
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-gray-500" />
        <span className="truncate max-w-40 text-sm" title={planta.proprietario?.razaoSocial}>
          {planta.proprietario?.razaoSocial}
        </span>
      </div>
    )
  },
  {
    key: 'endereco_localizacao',
    label: 'Localização',
    render: (planta) => (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <MapPin className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">
            {planta.endereco.cidade}/{planta.endereco.uf}
          </span>
        </div>
        {planta.localizacao && (
          <div className="text-xs text-muted-foreground truncate max-w-32" title={planta.localizacao}>
            {planta.localizacao}
          </div>
        )}
      </div>
    )
  },
  {
    key: 'horario_funcionamento',
    label: 'Funcionamento',
    hideOnMobile: true,
    render: (planta) => (
      <div className="flex items-center gap-2">
        <Clock className="h-3 w-3 text-muted-foreground" />
        <span className="text-sm">
          {planta.horarioFuncionamento || 'Não informado'}
        </span>
      </div>
    )
  },
  {
    key: 'endereco_completo',
    label: 'Endereço',
    hideOnTablet: true,
    render: (planta) => (
      <div className="space-y-1">
        <div className="text-sm">
          {planta.endereco.logradouro && (
            <div className="truncate max-w-48" title={planta.endereco.logradouro}>
              {planta.endereco.logradouro}
            </div>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {planta.endereco.cep && `CEP: ${planta.endereco.cep}`}
        </div>
      </div>
    )
  },
  {
    key: 'informacoes_cadastro',
    label: 'Cadastro',
    hideOnMobile: true,
    render: (planta) => (
      <div className="space-y-1">
        {planta.criadoEm && (
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {new Date(planta.criadoEm).toLocaleDateString('pt-BR')}
            </span>
          </div>
        )}
      </div>
    )
  }
];