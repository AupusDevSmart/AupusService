# ✅ Correção - Cálculos de Custos Totais ao Carregar Dados

## 🎯 Problema Identificado

**❌ Problema:**
- Ao **criar** materiais/técnicos: custos totais calculados e exibidos corretamente ✅
- Ao **carregar** dados da API: custos totais apareciam como 0.00 ❌

**🔍 Causa Raiz:**
Os campos `custo_total` não estavam sendo recalculados quando os dados eram carregados da API no método `getModalEntity()` do `ProgramacaoOSPage.tsx`.

---

## 🛠️ Solução Implementada

### **1. Criação de Funções Utilitárias**

**📁 Novo arquivo:** `src/utils/recursos.utils.ts`

```typescript
// Cálculo para materiais
export const calcularCustoTotalMaterial = (material: {
  quantidade_planejada?: number;
  custo_unitario?: number;
}): number => {
  const quantidade = material.quantidade_planejada || 0;
  const custoUnitario = material.custo_unitario || 0;
  return quantidade * custoUnitario;
};

// Cálculo para técnicos
export const calcularCustoTotalTecnico = (tecnico: {
  horas_estimadas?: number;
  horas_trabalhadas?: number;
  custo_hora?: number;
}, mode: 'planejamento' | 'execucao' = 'planejamento'): number => {
  const custo_hora = tecnico.custo_hora || 0;

  if (mode === 'execucao' && tecnico.horas_trabalhadas !== undefined) {
    return tecnico.horas_trabalhadas * custo_hora;
  }

  const horas_estimadas = tecnico.horas_estimadas || 0;
  return horas_estimadas * custo_hora;
};

// Processamento de listas com cálculos
export const processarMateriaisComCustos = (materiais: any[]): any[] => {
  return materiais.map(material => ({
    ...material,
    custo_total: calcularCustoTotalMaterial(material),
    custoTotal: calcularCustoTotalMaterial(material) // Alias para compatibilidade
  }));
};

export const processarTecnicosComCustos = (tecnicos: any[], mode: 'planejamento' | 'execucao' = 'planejamento'): any[] => {
  return tecnicos.map(tecnico => ({
    ...tecnico,
    custo_total: calcularCustoTotalTecnico(tecnico, mode),
    custoTotal: calcularCustoTotalTecnico(tecnico, mode) // Alias para compatibilidade
  }));
};
```

### **2. Atualização do ProgramacaoOSPage.tsx**

**❌ Antes:**
```typescript
// Materiais sem cálculo de custo_total
materiais: entity.materiais?.map((material: any) => ({
  id: material.id,
  descricao: material.descricao,
  quantidade_planejada: material.quantidade_planejada,
  custo_unitario: material.custo_unitario,
  // ❌ custo_total: FALTANDO
})) || [],

// Técnicos sem cálculo de custo_total
tecnicos: entity.tecnicos?.map((tecnico: any) => ({
  id: tecnico.id,
  nome: tecnico.nome,
  horas_estimadas: tecnico.horas_estimadas,
  custo_hora: tecnico.custo_hora,
  // ❌ custo_total: FALTANDO
})) || [],
```

**✅ Depois:**
```typescript
// Materiais COM cálculo automático
materiais: processarMateriaisComCustos(
  entity.materiais?.map((material: any) => ({
    id: material.id,
    descricao: material.descricao,
    quantidade_planejada: material.quantidade_planejada || 0,
    custo_unitario: material.custo_unitario || 0,
    unidade: material.unidade,
    status: material.status || 'PLANEJADO',
    confirmado: material.confirmado || false,
    disponivel: material.disponivel !== false,
    observacoes: material.observacoes || ''
  })) || []
),

// Técnicos COM cálculo automático
tecnicos: processarTecnicosComCustos(
  entity.tecnicos?.map((tecnico: any) => ({
    id: tecnico.id,
    nome: tecnico.nome,
    especialidade: tecnico.especialidade,
    horas_estimadas: tecnico.horas_estimadas || 0,
    custo_hora: tecnico.custo_hora || 0,
    tecnico_id: tecnico.tecnico_id,
    status: tecnico.status || 'PLANEJADO',
    confirmado: tecnico.confirmado || false,
    disponivel: tecnico.disponivel !== false,
    observacoes: tecnico.observacoes || ''
  })) || [],
  'planejamento' // Modo padrão
),
```

---

## 🎯 Resultados

### **✅ Materiais**
- **Criação**: ✅ Funcionava (quantidade × custo_unitario)
- **Carregamento**: ✅ **CORRIGIDO** - agora calcula automaticamente

### **✅ Técnicos**
- **Criação**: ✅ Funcionava (horas_estimadas × custo_hora)
- **Carregamento**: ✅ **CORRIGIDO** - agora calcula automaticamente

### **✅ Flexibilidade**
- **Planejamento**: usa `horas_estimadas`
- **Execução**: pode usar `horas_trabalhadas` (futuro)
- **Compatibilidade**: mantém aliases `custoTotal` e `custo_total`

---

## 🔧 Exemplos de Funcionamento

### **Material Carregado da API:**
```json
// Dados da API
{
  "id": "123",
  "descricao": "Parafuso M6",
  "quantidade_planejada": 10,
  "custo_unitario": 2.50,
  "unidade": "UN"
}

// Após processamento
{
  "id": "123",
  "descricao": "Parafuso M6",
  "quantidade_planejada": 10,
  "custo_unitario": 2.50,
  "custo_total": 25.00, // ✅ CALCULADO: 10 × 2.50
  "custoTotal": 25.00,  // ✅ Alias para compatibilidade
  "unidade": "UN"
}
```

### **Técnico Carregado da API:**
```json
// Dados da API
{
  "id": "456",
  "nome": "João Silva",
  "especialidade": "Elétrica",
  "horas_estimadas": 8,
  "custo_hora": 35.00
}

// Após processamento
{
  "id": "456",
  "nome": "João Silva",
  "especialidade": "Elétrica",
  "horas_estimadas": 8,
  "custo_hora": 35.00,
  "custo_total": 280.00, // ✅ CALCULADO: 8 × 35.00
  "custoTotal": 280.00,  // ✅ Alias para compatibilidade
}
```

---

## 📍 Onde Aplicar No Futuro

### **✅ Já Implementado:**
- `ProgramacaoOSPage.tsx` - Modal de visualização/edição

### **🔄 Pode ser Aplicado:**
- `ExecucaoOSPage.tsx` - Se carregar dados de programação
- Qualquer componente que carregue materiais/técnicos da API
- Relatórios que mostram custos totais

### **💡 Como Usar:**
```typescript
// Import
import { processarMateriaisComCustos, processarTecnicosComCustos } from '@/utils/recursos.utils';

// Para materiais
const materiaisComCustos = processarMateriaisComCustos(dadosDaAPI.materiais);

// Para técnicos
const tecnicosComCustos = processarTecnicosComCustos(dadosDaAPI.tecnicos, 'planejamento');
```

---

## 🎉 Status: ✅ CONCLUÍDO

- ✅ **Funções utilitárias criadas** e testadas
- ✅ **ProgramacaoOSPage.tsx atualizado** com cálculos automáticos
- ✅ **Compatibilidade mantida** com aliases
- ✅ **Flexibilidade** para diferentes modos (planejamento/execução)
- ✅ **Sem erros de TypeScript**
- ✅ **Código reutilizável** para outras features

**Resultado:** Custos totais agora são calculados corretamente tanto na **criação** quanto no **carregamento** de dados! 🎯