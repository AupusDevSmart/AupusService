// src/features/fornecedores/config/table-config.tsx
import React from 'react';
import { 
  Building2, 
  User, 
  MapPin, 
  Phone, 
  Mail,
  Calendar,
  Star,
  Badge as BadgeIcon
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TableColumn } from '@/types/base';
import { Fornecedor, TipoFornecedor, StatusFornecedor } from '../types';

// Função para formatar o tipo
const formatarTipo = (tipo: TipoFornecedor) => {
  const configs = {
    pessoa_juridica: { label: 'PJ', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
    pessoa_fisica: { label: 'PF', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' }
  };
  return configs[tipo];
};

// Função para formatar o status
const formatarStatus = (status: StatusFornecedor) => {
  const configs = {
    ativo: { label: 'Ativo', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
    inativo: { label: 'Inativo', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300' },
    suspenso: { label: 'Suspenso', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' }
  };
  return configs[status];
};

// Função para renderizar estrelas de avaliação
const renderAvaliacao = (nota?: number) => {
  if (!nota) return <span className="text-xs text-muted-foreground">Sem avaliação</span>;
  
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, i) => (
        <Star 
          key={i} 
          className={`h-3 w-3 ${i < nota ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
        />
      ))}
      <span className="text-xs text-muted-foreground ml-1">({nota})</span>
    </div>
  );
};

// Função para obter nome principal
const getNomePrincipal = (fornecedor: Fornecedor) => {
  if (fornecedor.tipo === 'pessoa_juridica') {
    return fornecedor.dadosPJ?.nomeFantasia || fornecedor.dadosPJ?.razaoSocial || 'Nome não informado';
  } else {
    return fornecedor.dadosPF?.nomeCompleto || 'Nome não informado';
  }
};

// Função para obter documento
const getDocumento = (fornecedor: Fornecedor) => {
  if (fornecedor.tipo === 'pessoa_juridica') {
    return fornecedor.dadosPJ?.cnpj || 'CNPJ não informado';
  } else {
    return fornecedor.dadosPF?.cpf || 'CPF não informado';
  }
};

export const fornecedoresTableColumns: TableColumn<Fornecedor>[] = [
  {
    key: 'dados_principais',
    label: 'Fornecedor',
    sortable: true,
    render: (fornecedor) => {
      const tipoConfig = formatarTipo(fornecedor.tipo);
      const nomePrincipal = getNomePrincipal(fornecedor);
      const documento = getDocumento(fornecedor);
      
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {fornecedor.tipo === 'pessoa_juridica' ? (
              <Building2 className="h-4 w-4 text-blue-600" />
            ) : (
              <User className="h-4 w-4 text-green-600" />
            )}
            <span className="font-medium text-foreground truncate max-w-48" title={nomePrincipal}>
              {nomePrincipal}
            </span>
            <Badge className={`text-xs ${tipoConfig.color}`}>
              {tipoConfig.label}
            </Badge>
          </div>
          <div className="text-xs font-mono text-muted-foreground">
            {documento}
          </div>
          {fornecedor.tipo === 'pessoa_juridica' && fornecedor.dadosPJ?.razaoSocial && 
           fornecedor.dadosPJ.nomeFantasia && fornecedor.dadosPJ.razaoSocial !== fornecedor.dadosPJ.nomeFantasia && (
            <div className="text-xs text-muted-foreground truncate max-w-48" title={fornecedor.dadosPJ.razaoSocial}>
              {fornecedor.dadosPJ.razaoSocial}
            </div>
          )}
        </div>
      );
    }
  },
  {
    key: 'contato',
    label: 'Contato',
    render: (fornecedor) => (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Mail className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm truncate max-w-40" title={fornecedor.email}>
            {fornecedor.email}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{fornecedor.telefone}</span>
        </div>
        {fornecedor.tipo === 'pessoa_juridica' && fornecedor.dadosPJ?.nomeContato && (
          <div className="text-xs text-muted-foreground">
            Contato: {fornecedor.dadosPJ.nomeContato}
          </div>
        )}
      </div>
    )
  },
  {
    key: 'localizacao',
    label: 'Localização',
    render: (fornecedor) => (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <MapPin className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">
            {fornecedor.endereco.cidade}/{fornecedor.endereco.uf}
          </span>
        </div>
        <div className="text-xs text-muted-foreground truncate max-w-40" title={fornecedor.endereco.logradouro}>
          {fornecedor.endereco.logradouro}, {fornecedor.endereco.numero}
        </div>
        {fornecedor.endereco.cep && (
          <div className="text-xs text-muted-foreground">
            CEP: {fornecedor.endereco.cep}
          </div>
        )}
      </div>
    )
  },
  {
    key: 'especialidade_materiais',
    label: 'Especialidade/Materiais',
    hideOnMobile: true,
    render: (fornecedor) => {
      if (fornecedor.tipo === 'pessoa_juridica' && fornecedor.dadosPJ?.tiposMateriais) {
        return (
          <div className="space-y-1">
            <div className="text-sm font-medium">Materiais/Serviços:</div>
            <div className="flex flex-wrap gap-1 max-w-48">
              {fornecedor.dadosPJ.tiposMateriais.slice(0, 2).map((material, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {material}
                </Badge>
              ))}
              {fornecedor.dadosPJ.tiposMateriais.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{fornecedor.dadosPJ.tiposMateriais.length - 2}
                </Badge>
              )}
            </div>
          </div>
        );
      } else if (fornecedor.tipo === 'pessoa_fisica' && fornecedor.dadosPF?.especialidade) {
        return (
          <div className="space-y-1">
            <div className="text-sm font-medium">Especialidade:</div>
            <div className="text-xs text-muted-foreground truncate max-w-40" title={fornecedor.dadosPF.especialidade}>
              {fornecedor.dadosPF.especialidade}
            </div>
          </div>
        );
      }
      return <span className="text-xs text-muted-foreground">Não informado</span>;
    }
  },
  {
    key: 'status_avaliacao',
    label: 'Status & Avaliação',
    hideOnTablet: true,
    render: (fornecedor) => {
      const statusConfig = formatarStatus(fornecedor.status);
      
      return (
        <div className="space-y-2">
          <Badge className={`text-xs ${statusConfig.color}`}>
            {statusConfig.label}
          </Badge>
          <div>
            {renderAvaliacao(fornecedor.avaliacaoQualidade)}
          </div>
        </div>
      );
    }
  },
  {
    key: 'ultimo_contato',
    label: 'Último Contato',
    hideOnMobile: true,
    render: (fornecedor) => (
      <div className="space-y-1">
        {fornecedor.ultimoContato && (
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {new Date(fornecedor.ultimoContato).toLocaleDateString('pt-BR')}
            </span>
          </div>
        )}
        {fornecedor.criadoEm && (
          <div className="text-xs text-muted-foreground">
            Cadastro: {new Date(fornecedor.criadoEm).toLocaleDateString('pt-BR')}
          </div>
        )}
      </div>
    )
  }
];