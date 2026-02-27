# Maintenance Dashboard

Dashboard de manutenção industrial refatorado com arquitetura profissional.

## 🎯 Características

- ✅ **Arquitetura modular** - Feature-Driven Design com separação clara de responsabilidades
- ✅ **Tipagens fortes** - TypeScript com tipos explícitos, sem `any`
- ✅ **Componentização avançada** - Componentes reutilizáveis e bem documentados
- ✅ **Layout responsivo** - 100vh em desktop/tablet, scroll apenas em mobile
- ✅ **Dark/Light mode** - Suporte completo a temas
- ✅ **Performance otimizada** - React.memo, useMemo, React Query
- ✅ **Testável** - Lógica de domínio isolada e testável

## 📁 Estrutura

```
maintenance-dashboard/
├── api/                          # Chamadas HTTP ao backend
│   └── maintenance-dashboard-api.ts
├── components/
│   ├── layout/                   # Componentes de layout
│   │   ├── DashboardGrid.tsx
│   │   ├── DashboardHeader.tsx
│   │   ├── DashboardSection.tsx
│   │   ├── DashboardSkeleton.tsx
│   │   └── DashboardError.tsx
│   ├── metrics/                  # Componentes de métricas
│   │   ├── MetricCard.tsx        # Card genérico
│   │   ├── WorkOrdersCard.tsx    # OS
│   │   ├── AnomaliesCard.tsx     # Anomalias
│   │   ├── MaintenancePlansCard.tsx
│   │   └── EnergyConsumptionCard.tsx
│   └── MaintenanceDashboard.tsx  # Componente principal
├── domain/
│   └── calculators/              # Lógica de negócio
│       └── MetricsCalculator.ts
├── hooks/
│   └── useMaintenanceDashboard.ts # Hook principal
├── types/
│   └── index.ts                  # Tipagens TypeScript
└── index.ts                      # Public API
```

## 🚀 Uso

### Importação Básica

```tsx
import { MaintenanceDashboard } from '@/features/maintenance-dashboard';

function App() {
  return <MaintenanceDashboard refreshInterval={30} />;
}
```

### Usando Componentes Individuais

```tsx
import {
  WorkOrdersCard,
  AnomaliesCard,
  MaintenancePlansCard,
  DashboardGrid,
} from '@/features/maintenance-dashboard';

function CustomDashboard() {
  return (
    <DashboardGrid>
      <WorkOrdersCard
        totalOpen={23}
        overdueCount={5}
        completionRate={85}
        trend={2.5}
      />
      <AnomaliesCard
        total={12}
        criticalCount={3}
        resolutionRate={75}
      />
      <MaintenancePlansCard
        totalActive={45}
        upcomingCount={8}
        complianceRate={92}
      />
    </DashboardGrid>
  );
}
```

### Usando Hook Diretamente

```tsx
import { useMaintenanceDashboard } from '@/features/maintenance-dashboard';

function MyDashboard() {
  const {
    metrics,
    overview,
    workOrders,
    anomalies,
    isLoading,
    refetch,
  } = useMaintenanceDashboard({ refreshInterval: 30 });

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div>
      <h1>Dashboard Customizado</h1>
      <p>Total de OS: {workOrders?.totalOpen}</p>
      <p>Anomalias Críticas: {anomalies?.byPriority.critical}</p>
      <button onClick={refetch}>Atualizar</button>
    </div>
  );
}
```

## 📡 APIs Consumidas

O dashboard consome os seguintes endpoints do backend:

| Endpoint | Descrição | Frequência |
|----------|-----------|------------|
| `GET /dashboard/overview` | Visão geral do dashboard | 30s |
| `GET /dashboard/work-orders` | Métricas de OS | 30s |
| `GET /anomalias/stats` | Estatísticas de anomalias | 30s |
| `GET /planos-manutencao/dashboard` | Dashboard de planos | 30s |
| `GET /dashboard/system-status` | Status do sistema | 30s |

## 🎨 Componentes

### MetricCard

Card de métrica profissional com status e tendência.

```tsx
<MetricCard
  title="Ordens de Serviço"
  value={23}
  unit="abertas"
  subtitle="5 atrasadas"
  icon={Wrench}
  iconColor="text-blue-600"
  status="warning"
  trend={{ value: 2.5, direction: 'up' }}
  onClick={() => navigate('/work-orders')}
/>
```

**Props:**
- `title` - Título do card
- `value` - Valor principal (número ou string)
- `unit?` - Unidade (kW, kWh, etc)
- `subtitle?` - Subtítulo descritivo
- `icon` - Ícone (LucideIcon)
- `iconColor?` - Cor do ícone
- `status?` - Status visual: `'normal' | 'warning' | 'critical' | 'offline'`
- `trend?` - Indicador de tendência
- `onClick?` - Callback ao clicar

### WorkOrdersCard

Card especializado para ordens de serviço.

```tsx
<WorkOrdersCard
  totalOpen={23}
  overdueCount={5}
  completionRate={85}
  trend={2.5}
  onClick={() => navigate('/execucao-os')}
/>
```

### AnomaliesCard

Card especializado para anomalias.

```tsx
<AnomaliesCard
  total={12}
  criticalCount={3}
  resolutionRate={75}
  trend={-12}
  onClick={() => navigate('/anomalias')}
/>
```

### MaintenancePlansCard

Card especializado para planos de manutenção.

```tsx
<MaintenancePlansCard
  totalActive={45}
  upcomingCount={8}
  complianceRate={92}
  onClick={() => navigate('/planos-manutencao')}
/>
```

## 🧪 Testes

### Testes Unitários (Domain Layer)

```bash
npm run test:unit -- MetricsCalculator
```

### Testes de Integração (Components + Hooks)

```bash
npm run test:integration -- MaintenanceDashboard
```

### Testes E2E (Fluxos Completos)

```bash
npm run test:e2e -- dashboard
```

## 📊 Responsividade

O dashboard é totalmente responsivo:

| Breakpoint | Layout | Scroll |
|------------|--------|--------|
| Mobile (< 768px) | 1 coluna | Vertical |
| Tablet (768-1023px) | 2 colunas | Leve |
| Desktop (>= 1024px) | 4 colunas | Nenhum |

## 🌓 Tema

O dashboard suporta **Dark Mode** e **Light Mode** automaticamente, usando as variáveis CSS do shadcn/ui.

Todas as cores se adaptam ao tema ativo, garantindo contraste adequado.

## 🔄 Polling e Cache

- **Polling:** Atualiza automaticamente a cada 30 segundos (configurável)
- **Cache:** React Query com staleTime de 20 segundos
- **Retry:** 2 tentativas em caso de erro
- **Pause:** Polling pausa quando aba está inativa

## 🎯 Roadmap

### Fase 1: Fundações ✅ COMPLETO
- [x] Estrutura de pastas
- [x] Tipagens TypeScript
- [x] API layer
- [x] Domain layer (calculators)
- [x] Componentes de layout
- [x] MetricCard base

### Fase 2: Componentes ✅ COMPLETO
- [x] Metric Cards de domínio
- [x] Hooks customizados
- [x] Dashboard principal
- [x] Rota configurada

### Fase 3: Gráficos e Painéis (Próximo)
- [ ] Gráficos com dados reais do backend
- [ ] Painéis detalhados (OS recentes, status)
- [ ] Filtros e período

### Fase 4: Testes
- [ ] Testes unitários (MetricsCalculator)
- [ ] Testes de integração (Componentes + Hooks)
- [ ] Testes E2E (Fluxos completos)

### Fase 5: Migração
- [ ] Validação com usuários
- [ ] Substituição do dashboard antigo
- [ ] Cleanup

## 📝 Convenções

- **Componentes:** PascalCase, React.FC com props tipadas
- **Hooks:** camelCase, prefixo `use`
- **Tipos:** PascalCase, sufixo para distinguir (Props, Data, Stats)
- **Arquivos:** kebab-case ou PascalCase (componentes)
- **Exports:** Named exports (não default)

## 🤝 Contribuindo

1. Siga as convenções de código
2. Adicione tipagens explícitas
3. Documente com JSDoc
4. Escreva testes
5. Mantenha componentes pequenos (< 200 linhas)

## 📚 Recursos

- [Análise Completa (DASHBOARD_REFACTORING_ANALYSIS.md)](../../../DASHBOARD_REFACTORING_ANALYSIS.md)
- [shadcn/ui](https://ui.shadcn.com/)
- [React Query](https://tanstack.com/query/latest)
- [Recharts](https://recharts.org/)

---

**Versão:** 1.0.0
**Autor:** Engenheiro Frontend Sênior
**Data:** 15 de Janeiro de 2026
