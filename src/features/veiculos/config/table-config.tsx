// src/features/veiculos/config/table-config.tsx
import { 
  Car, 
  Truck, 
  Bus, 
  Bike, 
  Users, 
  Package, 
  MapPin,
  Calendar,
  Wrench,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TableColumn } from '@/types/base';
import { VeiculoResponse, StatusVeiculo, TipoVeiculo, TipoCombustivel } from '@/services/veiculos.services';

// Função para formatar o status
const formatarStatus = (status: StatusVeiculo) => {
  const configs = {
    disponivel: { label: 'Disponível', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', icon: CheckCircle },
    em_uso: { label: 'Em Uso', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', icon: Clock },
    manutencao: { label: 'Manutenção', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300', icon: Wrench },
    inativo: { label: 'Inativo', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300', icon: XCircle }
  };
  return configs[status];
};

// Ícone por tipo de veículo
const getVeiculoIcon = (tipo: TipoVeiculo) => {
  const iconProps = { className: "h-4 w-4" };
  switch (tipo) {
    case 'carro': return <Car {...iconProps} />;
    case 'van': return <Bus {...iconProps} />;
    case 'caminhonete': return <Truck {...iconProps} />;
    case 'caminhao': return <Truck {...iconProps} />;
    case 'onibus': return <Bus {...iconProps} />;
    case 'moto': return <Bike {...iconProps} />;
    default: return <Car {...iconProps} />;
  }
};

// Cor por tipo de combustível
const getCombustivelColor = (combustivel: TipoCombustivel) => {
  switch (combustivel) {
    case 'gasolina': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'etanol': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'diesel': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    case 'eletrico': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'hibrido': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    case 'gnv': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
};

export const veiculosTableColumns: TableColumn<VeiculoResponse>[] = [
  {
    key: 'dados_principais',
    label: 'Veículo',
    sortable: true,
    render: (veiculo) => {
      const statusConfig = formatarStatus(veiculo.status);
      const StatusIcon = statusConfig.icon;
      
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {getVeiculoIcon(veiculo.tipo || 'carro')}
            <span className="font-medium text-foreground truncate max-w-48" title={veiculo.nome}>
              {veiculo.nome}
            </span>
            <div className="flex items-center gap-1">
              <StatusIcon className="h-3 w-3" />
              <Badge className={`text-xs ${statusConfig.color}`}>
                {statusConfig.label}
              </Badge>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            {veiculo.marca} {veiculo.modelo} {veiculo.ano}
          </div>
          <div className="text-xs font-mono text-muted-foreground">
            {veiculo.placa}
          </div>
        </div>
      );
    }
  },
  {
    key: 'especificacoes',
    label: 'Especificações',
    render: (veiculo) => (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {(veiculo.tipo || 'carro').charAt(0).toUpperCase() + (veiculo.tipo || 'carro').slice(1)}
          </Badge>
          <Badge className={`text-xs ${getCombustivelColor(veiculo.tipoCombustivel)}`}>
            {veiculo.tipoCombustivel}
          </Badge>
        </div>
        
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>{veiculo.capacidadePassageiros || 0}</span>
          </div>
          {veiculo.capacidadeCarga && (
            <div className="flex items-center gap-1">
              <Package className="h-3 w-3" />
              <span>{veiculo.capacidadeCarga}kg</span>
            </div>
          )}
        </div>
        
        <div className="text-xs text-muted-foreground">
          {(veiculo.kmAtual || 0).toLocaleString('pt-BR')} km
        </div>
      </div>
    )
  },
  {
    key: 'localizacao_responsavel',
    label: 'Localização & Responsável',
    hideOnMobile: true,
    render: (veiculo) => (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <MapPin className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm truncate max-w-40" title={veiculo.localizacaoAtual}>
            {veiculo.localizacaoAtual}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Wrench className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground truncate max-w-40" title={veiculo.responsavelManutencao}>
            {veiculo.responsavelManutencao || 'Não informado'}
          </span>
        </div>
      </div>
    )
  },
  {
    key: 'manutencao_seguro',
    label: 'Manutenção & Seguro',
    hideOnTablet: true,
    render: (veiculo) => {
      const proximaRevisao = veiculo.proximaRevisao ? new Date(veiculo.proximaRevisao) : null;
      const hoje = new Date();
      const diasParaRevisao = proximaRevisao ? Math.ceil((proximaRevisao.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      const revisaoProxima = proximaRevisao && diasParaRevisao <= 30;
      
      let seguroStatus = null;
      if (veiculo.vencimentoSeguro) {
        const vencimentoSeguro = new Date(veiculo.vencimentoSeguro);
        const diasParaVencimento = Math.ceil((vencimentoSeguro.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
        seguroStatus = {
          vencimento: vencimentoSeguro,
          diasRestantes: diasParaVencimento,
          proximo: diasParaVencimento <= 30
        };
      }
      
      return (
        <div className="space-y-2">
          {proximaRevisao && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span className={`text-xs ${revisaoProxima ? 'text-orange-600' : 'text-muted-foreground'}`}>
                Revisão: {proximaRevisao.toLocaleDateString('pt-BR')}
              </span>
              {revisaoProxima && <AlertTriangle className="h-3 w-3 text-orange-600" />}
            </div>
          )}
          
          {seguroStatus && (
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3 text-muted-foreground" />
              <span className={`text-xs ${seguroStatus.proximo ? 'text-red-600' : 'text-muted-foreground'}`}>
                Seguro: {seguroStatus.vencimento.toLocaleDateString('pt-BR')}
              </span>
              {seguroStatus.proximo && <AlertTriangle className="h-3 w-3 text-red-600" />}
            </div>
          )}
        </div>
      );
    }
  },
  {
    key: 'documentos',
    label: 'Documentos',
    hideOnMobile: true,
    render: (veiculo) => (
      <div className="space-y-1">
        <div className="text-xs text-muted-foreground">
          <div>Chassi: {veiculo.chassi?.slice(-6) || 'N/A'}</div>
          <div>Renavam: {veiculo.renavam?.slice(-6) || 'N/A'}</div>
        </div>
        {veiculo.seguradora && (
          <div className="text-xs text-blue-600">
            {veiculo.seguradora}
          </div>
        )}
      </div>
    )
  }
];