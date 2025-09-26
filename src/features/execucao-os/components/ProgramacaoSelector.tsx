// src/features/execucao-os/components/ProgramacaoSelector.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Search,
  Calendar,
  Clock,
  User,
  Settings,
  AlertTriangle,
  CheckCircle2,
  Filter
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { programacaoOSApi } from '@/services/programacao-os.service';
import type { ProgramacaoOSApiData, StatusProgramacao, PrioridadeProgramacao } from '@/services/programacao-os.service';

interface ProgramacaoSelectorProps {
  value?: string;
  onChange: (programacaoId: string, programacao: ProgramacaoOSApiData) => void;
  disabled?: boolean;
}

export const ProgramacaoSelector: React.FC<ProgramacaoSelectorProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  const [programacoes, setProgramacoes] = useState<ProgramacaoOSApiData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusProgramacao | 'ALL'>('APROVADA');
  const [prioridadeFilter, setPrioridadeFilter] = useState<PrioridadeProgramacao | 'ALL'>('ALL');

  useEffect(() => {
    carregarProgramacoes();
  }, [statusFilter, prioridadeFilter]);

  const carregarProgramacoes = async () => {
    try {
      setLoading(true);
      const filters = {
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        prioridade: prioridadeFilter !== 'ALL' ? prioridadeFilter : undefined,
        page: 1,
        limit: 100
      };

      const response = await programacaoOSApi.findAll(filters);
      setProgramacoes(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar programações:', error);
      setProgramacoes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProgramacaoSelect = (programacao: ProgramacaoOSApiData) => {
    if (!disabled) {
      onChange(programacao.id, programacao);
    }
  };

  // Filtrar programações baseado na busca
  const programacoesFiltradas = programacoes.filter(programacao => {
    const searchLower = searchTerm.toLowerCase();
    return (
      programacao.nome.toLowerCase().includes(searchLower) ||
      programacao.descricao.toLowerCase().includes(searchLower) ||
      programacao.responsavel?.toLowerCase().includes(searchLower) ||
      programacao.numero_os?.toLowerCase().includes(searchLower)
    );
  });

  const getPrioridadeColor = (prioridade: PrioridadeProgramacao) => {
    switch (prioridade) {
      case 'CRITICA': return 'bg-red-100 text-red-700 border-red-200';
      case 'ALTA': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'MEDIA': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'BAIXA': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status: StatusProgramacao) => {
    switch (status) {
      case 'APROVADA': return 'bg-green-100 text-green-700';
      case 'PROGRAMADA': return 'bg-blue-100 text-blue-700';
      case 'PLANEJADA': return 'bg-purple-100 text-purple-700';
      case 'EM_ANALISE': return 'bg-yellow-100 text-yellow-700';
      case 'PENDENTE': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Carregando programações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium">Selecionar Programação de OS</Label>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-600">Buscar</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Nome, descrição, responsável..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              disabled={disabled}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-600">Status</Label>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusProgramacao | 'ALL')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="APROVADA">Aprovada</SelectItem>
              <SelectItem value="PROGRAMADA">Programada</SelectItem>
              <SelectItem value="PLANEJADA">Planejada</SelectItem>
              <SelectItem value="ALL">Todos os Status</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-600">Prioridade</Label>
          <Select value={prioridadeFilter} onValueChange={(value) => setPrioridadeFilter(value as PrioridadeProgramacao | 'ALL')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CRITICA">Crítica</SelectItem>
              <SelectItem value="ALTA">Alta</SelectItem>
              <SelectItem value="MEDIA">Média</SelectItem>
              <SelectItem value="BAIXA">Baixa</SelectItem>
              <SelectItem value="ALL">Todas as Prioridades</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lista de Programações */}
      <div className="max-h-96 overflow-y-auto space-y-3">
        {programacoesFiltradas.map((programacao) => (
          <Card
            key={programacao.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              value === programacao.id
                ? 'border-blue-500 bg-blue-50 shadow-sm'
                : 'hover:bg-gray-50'
            }`}
            onClick={() => handleProgramacaoSelect(programacao)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  {/* Cabeçalho */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-sm">{programacao.nome}</h4>
                    {programacao.numero_os && (
                      <Badge variant="outline" className="text-xs">
                        OS: {programacao.numero_os}
                      </Badge>
                    )}
                  </div>

                  {/* Status e Prioridade */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`text-xs ${getStatusColor(programacao.status)}`}>
                      {programacao.status.replace('_', ' ')}
                    </Badge>
                    <Badge className={`text-xs ${getPrioridadeColor(programacao.prioridade)}`}>
                      {programacao.prioridade}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {programacao.tipo}
                    </Badge>
                  </div>

                  {/* Descrição */}
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {programacao.descricao}
                  </p>

                  {/* Informações adicionais */}
                  <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                    {programacao.data_programada && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Programada: {formatDate(programacao.data_programada)}</span>
                      </div>
                    )}
                    {programacao.duracao_estimada && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Duração: {programacao.duracao_estimada}h</span>
                      </div>
                    )}
                    {programacao.responsavel && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>Resp: {programacao.responsavel}</span>
                      </div>
                    )}
                    {programacao.tarefas_count && (
                      <div className="flex items-center gap-1">
                        <Settings className="h-3 w-3" />
                        <span>{programacao.tarefas_count} tarefas</span>
                      </div>
                    )}
                  </div>

                  {/* Local e Equipamento */}
                  {(programacao.local || programacao.ativo) && (
                    <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                      {programacao.local && <div>Local: {programacao.local}</div>}
                      {programacao.ativo && <div>Ativo: {programacao.ativo}</div>}
                    </div>
                  )}
                </div>

                {/* Indicador de seleção */}
                {value === programacao.id && (
                  <CheckCircle2 className="h-5 w-5 text-blue-500 flex-shrink-0 ml-2" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {programacoesFiltradas.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Filter className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p>Nenhuma programação encontrada</p>
            <p className="text-xs mt-1">Tente ajustar os filtros de busca</p>
          </div>
        )}
      </div>

      {/* Resumo da seleção */}
      {value && (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">
              Programação selecionada
            </span>
          </div>
          {(() => {
            const selectedProgramacao = programacoes.find(p => p.id === value);
            return selectedProgramacao && (
              <p className="text-xs text-blue-700 mt-1">
                {selectedProgramacao.nome} - {selectedProgramacao.status}
              </p>
            );
          })()}
        </div>
      )}
    </div>
  );
};