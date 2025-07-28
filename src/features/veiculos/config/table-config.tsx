// src/features/veiculos/config/table-config.tsx
import React from 'react';
import { 
  Car, 
  Fuel, 
  Calendar, 
  MapPin, 
  User,
  FileText,
  Gauge,
  Package,
  DollarSign
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TableColumn } from '@/types/base';
import { Veiculo, TipoCombustivel, StatusVeiculo } from '../types';

// Função para formatar o tipo de combustível
const formatarTipoCombustivel = (tipo: TipoCombustivel) => {
  const tipos = {
    gasolina: 'Gasolina',
    etanol: 'Etanol',
    diesel: 'Diesel',
    flex: 'Flex',
    eletrico: 'Elétrico',
    hibrido: 'Híbrido',
    gnv: 'GNV'
  };
  return tipos[tipo] || tipo;
};

// Função para formatar o status
const formatarStatus = (status: StatusVeiculo) => {
  const configs = {
    disponivel: { label: 'Disponível', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
    em_uso: { label: 'Em Uso', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
    manutencao: { label: 'Manutenção', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
    inativo: { label: 'Inativo', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300' }
  };
  return configs[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
};

// Função para formatar valores monetários
const formatarMoeda = (valor: number) => {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
};

// Função para formatar quilometragem
const formatarQuilometragem = (km?: number) => {
  if (!km) return 'N/A';
  return `${km.toLocaleString('pt-BR')} km`;
};

export const veiculosTableColumns: TableColumn<Veiculo>[] = [
  {
    key: 'dados_principais',
    label: 'Veículo',
    sortable: true,
    render: (veiculo) => (
      <div className="space-y-1">
        <div className="flex items-center gap-2 font-medium text-foreground">
          <Car className="h-4 w-4 text-blue-600" />
          <span className="truncate">{veiculo.nome}</span>
        </div>
        <div className="text-xs font-mono text-muted-foreground">
          {veiculo.placa} • {veiculo.codigoPatrimonial}
        </div>
        <div className="text-xs text-muted-foreground">
          {veiculo.marca} {veiculo.modelo} ({veiculo.anoFabricacao})
        </div>
      </div>
    )
  },
  {
    key: 'status_combustivel',
    label: 'Status & Combustível',
    render: (veiculo) => {
      const statusConfig = formatarStatus(veiculo.status);
      return (
        <div className="space-y-2">
          <Badge className={`text-xs ${statusConfig.color}`}>
            {statusConfig.label}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Fuel className="h-3 w-3" />
            {formatarTipoCombustivel(veiculo.tipoCombustivel)}
          </div>
        </div>
      );
    }
  },
  {
    key: 'especificacoes',
    label: 'Especificações',
    hideOnMobile: true,
    render: (veiculo) => (
      <div className="space-y-1">
        <div className="flex items-center gap-1 text-xs">
          <Package className="h-3 w-3 text-muted-foreground" />
          <span>{veiculo.capacidadeCarga}kg</span>
        </div>
        {veiculo.tipoCombustivel !== 'eletrico' && (
          <div className="flex items-center gap-1 text-xs">
            <Gauge className="h-3 w-3 text-muted-foreground" />
            <span>{veiculo.autonomiaMedia} km/l</span>
          </div>
        )}
        <div className="text-xs text-muted-foreground">
          {formatarQuilometragem(veiculo.quilometragem)}
        </div>
      </div>
    )
  },
  {
    key: 'responsavel_localizacao',
    label: 'Responsável & Local',
    render: (veiculo) => (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <User className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm truncate max-w-32" title={veiculo.responsavel}>
            {veiculo.responsavel}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground truncate max-w-40" title={veiculo.localizacaoAtual}>
            {veiculo.localizacaoAtual}
          </span>
        </div>
      </div>
    )
  },
  {
    key: 'valor_documentacao',
    label: 'Valor & Docs',
    hideOnTablet: true,
    render: (veiculo) => (
      <div className="space-y-1">
        <div className="flex items-center gap-1">
          <DollarSign className="h-3 w-3 text-green-600" />
          <span className="text-sm font-medium text-green-600">
            {formatarMoeda(veiculo.valorDiaria)}/dia
          </span>
        </div>
        <div className="flex items-center gap-1">
          <FileText className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {veiculo.documentacao.length} doc{veiculo.documentacao.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    )
  },
  {
    key: 'informacoes_cadastro',
    label: 'Cadastro',
    hideOnMobile: true,
    render: (veiculo) => (
      <div className="space-y-1">
        {veiculo.criadoEm && (
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {new Date(veiculo.criadoEm).toLocaleDateString('pt-BR')}
            </span>
          </div>
        )}
      </div>
    )
  }
];