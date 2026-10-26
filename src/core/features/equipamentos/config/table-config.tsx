// src/features/equipamentos/config/table-config.tsx
import { statusDoEquipamento } from '@/core/features/equipamentos/utils/status-do-equipamento';
import { rotuloDaCriticidade } from '@/core/features/equipamentos/config/criticidade';
import { Badge } from '@/core/components/ui/badge';
import { TableColumn } from '@/core/types/base';
import { Equipamento } from '../types';
import { EquipamentoAvatar } from '../components/EquipamentoAvatar';

export const getEquipamentosTableColumns = (): TableColumn<Equipamento>[] => [
  {
    key: 'foto',
    label: '',
    render: (equipamento) => (
      <EquipamentoAvatar
        fotoUrl={equipamento.fotoUrl}
        iconeSvg={equipamento.tipoEquipamentoObj?.iconeSvg}
        alt={equipamento.nome}
        size={32}
      />
    )
  },

  {
    key: 'nome',
    label: 'Nome',
    sortable: true,
    render: (equipamento) => (
      <span className="font-medium text-sm truncate block" title={equipamento.nome}>
        {equipamento.nome}
      </span>
    )
  },

  {
    key: 'tag',
    label: 'TAG',
    render: (equipamento) => (
      <span className="text-sm text-muted-foreground">
        {equipamento.tag || '-'}
      </span>
    )
  },

  {
    // A lista e so de UCs (os componentes abrem no dropdown da linha), entao
    // "UC" em toda linha nao diz nada; a contagem diz se ha o que abrir.
    key: 'componentes',
    label: 'Componentes',
    render: (equipamento) => {
      const total = equipamento.totalComponentes ?? 0;
      return (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {total === 0 ? '-' : `${total} ${total === 1 ? 'componente' : 'componentes'}`}
        </span>
      );
    }
  },

  {
    key: 'status',
    label: 'Status',
    // A regra do sheet: 'NORMAL' (da sincronização com o NexOn) saía em vermelho
    render: (equipamento) => {
      const status = statusDoEquipamento(equipamento.status);
      return (
        <Badge
          variant="outline"
          className={`text-xs ${status === 'Ativo' ? 'border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400' : 'border-red-300 text-red-700 dark:border-red-700 dark:text-red-400'}`}
        >
          {status}
        </Badge>
      );
    }
  },

  {
    key: 'em_operacao',
    label: 'Em operação',
    render: (equipamento) => (
      <span className={`text-sm ${equipamento.emOperacao === 'sim' ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
        {equipamento.emOperacao === 'sim' ? 'Sim' : equipamento.emOperacao === 'nao' ? 'Não' : '-'}
      </span>
    )
  },

  {
    key: 'unidade',
    label: 'Unidade',
    render: (equipamento) => (
      <span className="text-sm truncate block max-w-40" title={equipamento.unidade?.nome}>
        {equipamento.unidade?.nome || '-'}
      </span>
    )
  },

  {
    key: 'criticidade',
    label: 'Criticidade',
    render: (equipamento) => (
      <Badge variant="outline" className="text-xs whitespace-nowrap">
        {rotuloDaCriticidade(equipamento.criticidade)}
      </Badge>
    )
  },

  {
    key: 'fabricante',
    label: 'Fabricante',
    render: (equipamento) => (
      <span className="text-sm truncate block max-w-36" title={equipamento.fabricante}>
        {equipamento.fabricante || '-'}
      </span>
    )
  }
];

// Manter a exportação antiga para compatibilidade
export const equipamentosTableColumns = getEquipamentosTableColumns();
