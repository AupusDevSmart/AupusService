# 🔍 ANOMALIAS DATA FLOW - Como a Aplicação Está Funcionando

## 📊 FLUXO COMPLETO DE DADOS: Visualizar/Editar Anomalia

### STEP 1: 🎯 Clique no Botão "Visualizar/Editar"

```typescript
// Arquivo: AnomaliasPage.tsx, linha 174-181
const handleView = (anomalia: Anomalia) => {
  console.log('Clicou em Visualizar:', anomalia);
  openModal('view', anomalia); // ← Passa a anomalia da tabela
};

const handleEdit = (anomalia: Anomalia) => {
  console.log('Clicou em Editar:', anomalia);
  openModal('edit', anomalia); // ← Passa a anomalia da tabela
};
```

**🔍 DADOS RECEBIDOS**: A `anomalia` aqui vem da **tabela** (que já tem os dados da API).

### STEP 2: 🏗️ Transformação dos Dados no Modal

```typescript
// Arquivo: AnomaliasPage.tsx, linha 125-150
const getModalEntity = () => {
  const entity = modalState.entity;
  
  if (entity && (modalState.mode === 'edit' || modalState.mode === 'view')) {
    // Transform API data to form-compatible format
    const transformed = {
      ...entity,
      // Flatten nested location data for the form
      plantaId: entity.planta_id || entity.plantaId || '',
      equipamentoId: entity.equipamento_id || entity.equipamentoId || '',
      local: entity.local || '',
      ativo: entity.ativo || '',
      // Ensure localizacao object exists for the LocalizacaoController
      localizacao: {
        plantaId: entity.planta_id || entity.plantaId || '',
        equipamentoId: entity.equipamento_id || entity.equipamentoId || '',
        local: entity.local || '',
        ativo: entity.ativo || ''
      }
    };
    
    console.log('🔄 [AnomaliasPage] Entity transformed for modal:', {
      original: entity,
      transformed: transformed
    });
    
    return transformed;
  }
  
  return entity;
};
```

**🔍 TRANSFORMAÇÃO**: Os dados da API são transformados para formato compatível com o formulário.

### STEP 3: 📝 BaseModal Recebe os Dados

```typescript
// Arquivo: AnomaliasPage.tsx, linha 449-452
<BaseModal
  isOpen={modalState.isOpen}
  mode={modalState.mode}
  entity={getModalEntity() as any} // ← Dados transformados
  formFields={anomaliasFormFields}
  onSubmit={handleSubmit}
/>
```

### STEP 4: 🎨 BaseModal Inicializa o Formulário

```typescript
// Arquivo: BaseModal.tsx, linha 115-133
useEffect(() => {
  if (isOpen) {
    let initialData: any = {};

    if (entity && (isViewMode || isEditMode)) {
      // Modo view/edit com entidade existente
      initialData = { ...entity }; // ← Copia TODOS os dados da entidade
    }

    setFormData(initialData); // ← Define os dados do formulário
    initialDataRef.current = initialData;
    setErrors({});
    setHasUnsavedChanges(false);
    
    console.log('🔄 [BASE MODAL] Dados iniciais definidos:', initialData);
  }
}, [isOpen, entity, mode]);
```

### STEP 5: 🏗️ BaseForm Renderiza os Campos

```typescript
// Arquivo: BaseForm.tsx, linha 50-70
const handleFieldChange = (key: string, value: unknown) => {
  if (key.includes('.')) {
    // Nested field (ex: "localizacao.plantaId")
    const [parent, child] = key.split('.');
    const newData = {
      ...data,
      [parent]: {
        ...(data[parent] as Record<string, unknown> || {}),
        [child]: value
      }
    };
    onChange(newData);
  } else {
    // Simple field
    onChange({ ...data, [key]: value });
  }
};
```

### STEP 6: 📍 LocalizacaoController Específico

```typescript
// Arquivo: LocalizacaoController.tsx, linha 17-21
export const LocalizacaoController = ({ value, onChange, disabled }: FormFieldProps) => {
  // Garantir que value é tratado como LocalizacaoValue com valores seguros
  const localizacaoValue = (value || {}) as LocalizacaoValue;
  
  const [plantaId, setPlantaId] = React.useState(localizacaoValue.plantaId?.toString() || '');
  const [equipamentoId, setEquipamentoId] = React.useState(localizacaoValue.equipamentoId?.toString() || '');
```

## 🐛 PROBLEMA IDENTIFICADO: Dados Não Aparecem nos Inputs

### 🔍 ANÁLISE DOS LOGS

Para identificar exatamente onde os dados se perdem, vamos analisar os console.logs:

1. **LOG 1**: `console.log('Clicou em Visualizar:', anomalia)`
   - **Onde**: AnomaliasPage.tsx, linha 175
   - **Mostra**: Os dados originais da anomalia da tabela

2. **LOG 2**: `console.log('🔄 [AnomaliasPage] Entity transformed for modal:', { original, transformed })`
   - **Onde**: AnomaliasPage.tsx, linha 163
   - **Mostra**: Como os dados foram transformados

3. **LOG 3**: `console.log('🔄 [BASE MODAL] Dados iniciais definidos:', initialData)`
   - **Onde**: BaseModal.tsx, linha 131
   - **Mostra**: Os dados que chegaram no formulário

## 🔧 POSSÍVEIS CAUSAS DO PROBLEMA

### 1. **Dados da Tabela não têm campos necessários**
```typescript
// Se a tabela não carrega planta_id, equipamento_id, etc.
// a transformação vai resultar em strings vazias
plantaId: entity.planta_id || entity.plantaId || '', // ← Pode ser ''
```

### 2. **LocalizacaoController não detecta mudanças no `value`**
```typescript
// LocalizacaoController.tsx
const [plantaId, setPlantaId] = React.useState(localizacaoValue.plantaId?.toString() || '');
// ↑ Se localizacaoValue muda, useState NÃO atualiza automaticamente
```

### 3. **Campos do formulário com keys erradas**
```typescript
// form-config.tsx - Campo localizacao
{
  key: 'localizacao', // ← Este campo deve receber o objeto completo
  render: ({ value, onChange }) => (
    <LocalizacaoController value={value} onChange={onChange} />
  )
}
```

## 🎯 COMO VERIFICAR O PROBLEMA

### 1. Abra o DevTools (F12)
### 2. Clique em "Visualizar" uma anomalia
### 3. Veja os console.logs na ordem:

```
Clicou em Visualizar: { id: "123", descricao: "...", local: "...", ... }
🔄 [AnomaliasPage] Entity transformed for modal: { original: {...}, transformed: {...} }
🔄 [BASE MODAL] Dados iniciais definidos: { ... }
```

### 4. Verifique se os dados estão sendo perdidos entre os logs

## 🛠️ SOLUÇÕES POSSÍVEIS

### 1. **Corrigir LocalizacaoController useState**
```typescript
// Adicionar useEffect para atualizar quando value muda
useEffect(() => {
  setPlantaId(localizacaoValue.plantaId?.toString() || '');
  setEquipamentoId(localizacaoValue.equipamentoId?.toString() || '');
}, [localizacaoValue.plantaId, localizacaoValue.equipamentoId]);
```

### 2. **Melhorar transformação de dados**
```typescript
// Garantir que os dados necessários existem antes de transformar
if (entity.planta_id || entity.equipamento_id) {
  // fazer transformação
}
```

### 3. **Debug completo do fluxo**
```typescript
// Adicionar logs em cada etapa para rastrear onde os dados se perdem
```

## 📊 STATUS ATUAL

- ✅ **API funcionando**: Service layer está correto
- ✅ **Dados chegam na tabela**: Lista carrega normalmente  
- ❓ **Transformação funcionando**: Precisa verificar logs
- ❓ **Formulário recebe dados**: Precisa verificar logs
- ❌ **Inputs mostram dados**: **ESTE É O PROBLEMA**

O problema está provavelmente na inicialização dos inputs específicos (LocalizacaoController) que não detectam as mudanças no `value` prop.