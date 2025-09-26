# 🔍 TESTE DEBUG - Anomalias View/Edit

## Como testar o problema passo a passo

### 1. 📂 Abra o DevTools do Browser
- Pressione **F12** ou **Ctrl+Shift+I**
- Vá na aba **Console**
- Limpe o console (Ctrl+L)

### 2. 🌐 Acesse a página de Anomalias
- Navegue para `/anomalias`
- Aguarde a lista carregar

### 3. 👁️ Clique em "Visualizar" uma anomalia
- Você verá esta sequência de logs:

```
👁️ [AnomaliasPage] Clicou em Visualizar: {id: "...", descricao: "...", ...}
👁️ [AnomaliasPage] Campos relevantes: {plantaId: ..., equipamentoId: ..., local: ..., ativo: ...}
🔄 [AnomaliasPage] Entity transformed for modal:
📥 Original entity: {id: "...", ...}
📤 Transformed entity: {id: "...", localizacao: {...}, ...}
🎯 Localizacao object will be: {plantaId: "...", equipamentoId: "...", local: "...", ativo: "..."}
🔄 [BASE MODAL] Dados iniciais definidos: {id: "...", localizacao: {...}, ...}
🔄 [LocalizacaoController] Value prop changed: {plantaId: "...", equipamentoId: "...", ...}
🔄 [LocalizacaoController] Setting values: {newPlantaId: "...", newEquipamentoId: "..."}
```

### 4. 🔍 Analise os valores nos logs:

#### A. **Verifique se os dados originais existem:**
```
👁️ [AnomaliasPage] Campos relevantes: {
  plantaId: ?, 
  equipamentoId: ?,
  planta_id: ?,      ← Procure por estes campos
  equipamento_id: ?,
  local: ?,
  ativo: ?
}
```

#### B. **Verifique se a transformação funcionou:**
```
🎯 Localizacao object will be: {
  plantaId: "123",    ← Deve ter um valor válido
  equipamentoId: "456", ← Deve ter um valor válido
  local: "Local ABC",
  ativo: "Ativo XYZ"
}
```

#### C. **Verifique se chegou no LocalizacaoController:**
```
🔄 [LocalizacaoController] Value prop changed: {
  plantaId: "123",    ← Deve ter o mesmo valor
  equipamentoId: "456"
}
```

### 5. 📊 Interpretação dos Resultados:

#### ✅ CENÁRIO 1: Dados aparecem vazios no início
```
👁️ [AnomaliasPage] Campos relevantes: {
  plantaId: undefined,
  equipamentoId: undefined,
  planta_id: undefined,
  equipamento_id: undefined
}
```
**PROBLEMA**: Os dados não estão vindo da API ou da tabela

#### ✅ CENÁRIO 2: Dados existem mas não chegam transformados
```
👁️ [AnomaliasPage] Campos relevantes: {plantaId: "123", local: "ABC"}
🎯 Localizacao object will be: {plantaId: "", equipamentoId: ""}
```
**PROBLEMA**: Erro na transformação `getModalEntity()`

#### ✅ CENÁRIO 3: Dados chegam transformados mas não no controller
```
🎯 Localizacao object will be: {plantaId: "123", equipamentoId: "456"}
🔄 [LocalizacaoController] Value prop changed: undefined
```
**PROBLEMA**: BaseForm não está passando o campo 'localizacao' corretamente

#### ✅ CENÁRIO 4: Dados chegam no controller mas não aparecem nos selects
```
🔄 [LocalizacaoController] Setting values: {newPlantaId: "123", newEquipamentoId: "456"}
```
Mas os selects continuam vazios
**PROBLEMA**: Os valores não correspondem aos IDs das plantas/equipamentos carregados

### 6. ✏️ Repita o teste clicando em "Editar"
- Os logs devem ser similares, mas começando com ✏️

### 7. 📝 Compare os inputs do formulário
- Verifique se os campos de texto (descrição, observações) aparecem preenchidos
- Verifique se apenas os selects de planta/equipamento estão vazios

## 🎯 Possíveis Causas e Soluções

### Causa 1: Dados não vêm da API
**Solução**: Verificar se a API retorna planta_id e equipamento_id

### Causa 2: Transformação não funciona
**Solução**: Corrigir lógica em getModalEntity()

### Causa 3: Campo 'localizacao' não passa para o controller
**Solução**: Verificar se BaseForm está passando o valor correto

### Causa 4: IDs não correspondem às plantas/equipamentos disponíveis
**Solução**: Verificar se useEquipamentos() está carregando os dados corretos

## 📋 Cole aqui os logs que você viu:

```
[Cole aqui os logs do console quando testar]
```

## 🚨 Status Atual dos Fixes Aplicados:

✅ **LocalizacaoController atualiza quando value muda** (useEffect adicionado)
✅ **Logs detalhados adicionados** para debug completo
✅ **Transformação de dados melhorada** (getModalEntity)
❓ **Teste pendente** para identificar causa raiz