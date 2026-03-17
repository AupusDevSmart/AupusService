# Origem Selector Components

Esta pasta contém os componentes refatorados do seletor de origem de ordens de serviço.

## 📁 Estrutura

```
origem-selector/
├── index.ts                      # Barrel export - ponto de entrada
├── types.ts                      # Tipos TypeScript compartilhados
├── HierarchyBreadcrumb.tsx      # Breadcrumb de navegação hierárquica
├── TipoOrigemSelector.tsx       # Seletor de tipo (Anomalia, Plano, Solicitação, Manual)
├── PlantaSelector.tsx           # Seletor de planta
├── UnidadeSelector.tsx          # Seletor de unidade
├── AnomaliaSelector.tsx         # Seletor de anomalia com busca
├── SolicitacaoSelector.tsx      # Seletor de solicitação de serviço com busca
├── PlanoSelector.tsx            # Seletor de plano de manutenção com busca
└── TarefasSelector.tsx          # Seletor múltiplo de tarefas com checkboxes
```

## 🎯 Objetivo da Refatoração

O arquivo `OrigemOSSelector.tsx` original tinha **1252 linhas** e era difícil de manter. A refatoração:

- ✅ Reduziu o arquivo principal para **407 linhas** (redução de 67.5%)
- ✅ Separou responsabilidades em 9 componentes especializados
- ✅ Melhorou a reutilização e testabilidade
- ✅ Centralizou tipos TypeScript
- ✅ Manteve toda a funcionalidade original

## 📦 Componentes

### HierarchyBreadcrumb
Exibe o progresso visual do usuário através dos passos de seleção (Planta → Unidade → Origem).

**Props:**
- `steps: HierarchyBreadcrumbStep[]` - Lista de steps com número, label, estado ativo e completado

### TipoOrigemSelector
Permite selecionar o tipo de origem da OS (Anomalia, Plano de Manutenção, Solicitação de Serviço, Manual).

**Props:**
- `value: TipoOrigem` - Tipo selecionado
- `onChange: (tipo: TipoOrigem) => void` - Callback de mudança
- `disabled?: boolean` - Se desabilitado

### PlantaSelector
Seletor de planta com lista dropdown e card de selecionada.

**Props:**
- `plantas: PlantaDisponivel[]` - Lista de plantas
- `value?: string` - ID da planta selecionada
- `onChange: (plantaId: string) => void` - Callback
- `loading?: boolean` - Estado de carregamento
- `disabled?: boolean` - Se desabilitado

### UnidadeSelector
Similar ao PlantaSelector, mas para unidades.

**Props:**
- `unidades: UnidadeDisponivel[]` - Lista de unidades
- `value?: string` - ID da unidade selecionada
- `onChange: (unidadeId: string) => void` - Callback
- `loading?: boolean` - Estado de carregamento
- `disabled?: boolean` - Se desabilitado

### AnomaliaSelector
Seletor de anomalia com busca por descrição, local ou ativo. Exibe cards com badges de prioridade e status.

**Props:**
- `anomalias: AnomaliaDisponivel[]` - Lista de anomalias
- `value?: string` - ID da anomalia selecionada
- `onChange: (anomaliaId: string) => void` - Callback
- `plantaId?: string` - ID da planta (validação)
- `unidadeId?: string` - ID da unidade (validação)
- `disabled?: boolean` - Se desabilitado

### SolicitacaoSelector
Seletor de solicitação de serviço com busca. Similar ao AnomaliaSelector.

**Props:**
- `solicitacoes: SolicitacaoDisponivel[]` - Lista de solicitações
- `value?: string` - ID da solicitação selecionada
- `onChange: (solicitacaoId: string) => void` - Callback
- `plantaId?: string` - ID da planta (validação)
- `unidadeId?: string` - ID da unidade (validação)
- `disabled?: boolean` - Se desabilitado

### PlanoSelector
Seletor de plano de manutenção com busca por nome ou tipo.

**Props:**
- `planos: PlanoDisponivel[]` - Lista de planos
- `value?: string` - ID do plano selecionado
- `onChange: (planoId: string) => void` - Callback
- `disabled?: boolean` - Se desabilitado

### TarefasSelector
Seletor múltiplo de tarefas com checkboxes, botões "Selecionar Todas" e "Limpar".

**Props:**
- `tarefas: TarefaDisponivel[]` - Lista de tarefas
- `selectedIds: string[]` - IDs das tarefas selecionadas
- `onToggle: (tarefaId: string, checked: boolean) => void` - Callback de toggle
- `onSelectAll: () => void` - Callback selecionar todas
- `onDeselectAll: () => void` - Callback limpar seleção
- `loading?: boolean` - Estado de carregamento
- `disabled?: boolean` - Se desabilitado

## 💡 Como Usar

```typescript
import {
  TipoOrigemSelector,
  PlantaSelector,
  type TipoOrigem
} from './origem-selector';

// Usar os componentes individuais
<TipoOrigemSelector
  value="ANOMALIA"
  onChange={(tipo) => console.log(tipo)}
/>

<PlantaSelector
  plantas={plantasDisponiveis}
  value={plantaId}
  onChange={setPlantaId}
  loading={loadingPlantas}
/>
```

## 🔄 Fluxos de Seleção

### Anomalia
1. Selecionar Tipo → ANOMALIA
2. Selecionar Planta
3. Selecionar Unidade
4. Selecionar Anomalia

### Solicitação de Serviço
1. Selecionar Tipo → SOLICITACAO_SERVICO
2. Selecionar Planta
3. Selecionar Unidade
4. Selecionar Solicitação

### Plano de Manutenção
1. Selecionar Tipo → PLANO_MANUTENCAO
2. Selecionar Plano
3. Selecionar Tarefas (múltiplas)

### Manual
1. Selecionar Tipo → MANUAL
2. Preencher campos manualmente

## 📝 Tipos Compartilhados

Todos os tipos estão centralizados em `types.ts`:
- `TipoOrigem` - União de tipos de origem
- `OrigemOSValue` - Valor completo da seleção
- `PlantaDisponivel` - Interface de planta
- `UnidadeDisponivel` - Interface de unidade
- `AnomaliaDisponivel` - Interface de anomalia
- `SolicitacaoDisponivel` - Interface de solicitação
- `PlanoDisponivel` - Interface de plano
- `TarefaDisponivel` - Interface de tarefa

## 🧪 Testabilidade

Cada componente pode ser testado independentemente:

```typescript
import { render, screen } from '@testing-library/react';
import { PlantaSelector } from './PlantaSelector';

test('deve renderizar lista de plantas', () => {
  const plantas = [
    { id: '1', nome: 'Planta 1' },
    { id: '2', nome: 'Planta 2' }
  ];

  render(
    <PlantaSelector
      plantas={plantas}
      value=""
      onChange={jest.fn()}
    />
  );

  expect(screen.getByText('Planta 1')).toBeInTheDocument();
  expect(screen.getByText('Planta 2')).toBeInTheDocument();
});
```

## 🔧 Manutenção

Para adicionar um novo tipo de origem:

1. Adicionar o tipo em `types.ts` (`TipoOrigem`)
2. Criar o componente seletor correspondente
3. Exportar no `index.ts`
4. Adicionar o fluxo em `OrigemOSSelector.tsx`

## 📚 Referências

- Arquivo original: `OrigemOSSelector.backup.tsx` (1252 linhas)
- Arquivo refatorado: `OrigemOSSelector.tsx` (407 linhas)
- Redução: 67.5%
