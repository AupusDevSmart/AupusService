// src/features/ferramentas/config/table-config.tsx
import { 
  Wrench, 
  Calendar, 
  MapPin, 
  User,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TableColumn } from '@/types/base';
import { Ferramenta, StatusFerramenta } from '../types';

// Função para formatar o status
const formatarStatus = (status: StatusFerramenta) => {
  const configs = {
    disponivel: { label: 'Disponível', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
    em_uso: { label: 'Em Uso', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
    manutencao: { label: 'Manutenção', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' }
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

// Função para verificar calibração
const verificarCalibracao = (ferramenta: Ferramenta) => {
  if (!ferramenta.necessitaCalibracao) {
    return { status: 'nao_necessita', dias: 0 };
  }
  
  if (!ferramenta.proximaDataCalibracao) {
    return { status: 'sem_data', dias: 0 };
  }
  
  const hoje = new Date();
  const proximaCalibracao = new Date(ferramenta.proximaDataCalibracao);
  const diasRestantes = Math.ceil((proximaCalibracao.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diasRestantes < 0) {
    return { status: 'vencida', dias: Math.abs(diasRestantes) };
  } else if (diasRestantes <= 30) {
    return { status: 'vencendo', dias: diasRestantes };
  } else {
    return { status: 'ok', dias: diasRestantes };
  }
};

export const ferramentasTableColumns: TableColumn<Ferramenta>[] = [
  {
    key: 'dados_principais',
    label: 'Ferramenta',
    sortable: true,
    render: (ferramenta) => (
      <div className="space-y-1">
        <div className="flex items-center gap-2 font-medium text-foreground">
          <Wrench className="h-4 w-4 text-blue-600" />
          <span className="truncate">{ferramenta.nome}</span>
        </div>
        <div className="text-xs font-mono text-muted-foreground">
          {ferramenta.codigoPatrimonial}
        </div>
        <div className="text-xs text-muted-foreground">
          {ferramenta.fabricante} {ferramenta.modelo}
        </div>
      </div>
    )
  },
  {
    key: 'status_calibracao',
    label: 'Status & Calibração',
    render: (ferramenta) => {
      const statusConfig = formatarStatus(ferramenta.status);
      const calibracao = verificarCalibracao(ferramenta);
      
      return (
        <div className="space-y-2">
          <Badge className={`text-xs ${statusConfig.color}`}>
            {statusConfig.label}
          </Badge>
          
          <div className="flex items-center gap-1 text-xs">
            {ferramenta.necessitaCalibracao ? (
              <>
                {calibracao.status === 'vencida' && (
                  <>
                    <XCircle className="h-3 w-3 text-red-500" />
                    <span className="text-red-600">Vencida há {calibracao.dias}d</span>
                  </>
                )}
                {calibracao.status === 'vencendo' && (
                  <>
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                    <span className="text-amber-600">Vence em {calibracao.dias}d</span>
                  </>
                )}
                {calibracao.status === 'ok' && (
                  <>
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span className="text-green-600">OK ({calibracao.dias}d)</span>
                  </>
                )}
                {calibracao.status === 'sem_data' && (
                  <>
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                    <span className="text-amber-600">Sem data</span>
                  </>
                )}
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3 text-gray-400" />
                <span className="text-muted-foreground">Não necessita</span>
              </>
            )}
          </div>
        </div>
      );
    }
  },
  {
    key: 'numero_serie',
    label: 'Nº Série',
    hideOnMobile: true,
    render: (ferramenta) => (
      <div className="text-xs font-mono text-muted-foreground">
        {ferramenta.numeroSerie}
      </div>
    )
  },
  {
    key: 'responsavel_localizacao',
    label: 'Responsável & Local',
    render: (ferramenta) => (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <User className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm truncate max-w-32" title={ferramenta.responsavel}>
            {ferramenta.responsavel}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground truncate max-w-40" title={ferramenta.localizacaoAtual}>
            {ferramenta.localizacaoAtual}
          </span>
        </div>
      </div>
    )
  },
  {
    key: 'valor_aquisicao',
    label: 'Valor & Aquisição',
    hideOnTablet: true,
    render: (ferramenta) => (
      <div className="space-y-1">
        <div className="flex items-center gap-1">
          <DollarSign className="h-3 w-3 text-green-600" />
          <span className="text-sm font-medium text-green-600">
            {formatarMoeda(ferramenta.valorDiaria)}/dia
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {new Date(ferramenta.dataAquisicao).toLocaleDateString('pt-BR')}
          </span>
        </div>
      </div>
    )
  },
  {
    key: 'informacoes_cadastro',
    label: 'Cadastro',
    hideOnMobile: true,
    render: (ferramenta) => (
      <div className="space-y-1">
        {ferramenta.criadoEm && (
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {new Date(ferramenta.criadoEm).toLocaleDateString('pt-BR')}
            </span>
          </div>
        )}
      </div>
    )
  }
];