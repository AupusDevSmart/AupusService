# 🔍 DEBUG SELECTS ANOMALIAS - Problema de Opções

## 🎯 Objetivo: Identificar por que os selects não mostram a opção correta

### 📋 PASSO A PASSO PARA TESTAR:

#### 1. 🌐 Abra o DevTools (F12) e vá na aba Console
#### 2. 🗂️ Vá para a página de Anomalias
#### 3. ✏️ Clique em "Editar" uma anomalia que tem planta e equipamento
#### 4. 👀 Observe os logs no console na seguinte ordem:

---

### 📊 LOGS ESPERADOS E COMO INTERPRETAR:

#### A. **LOGS INICIAIS** (dados chegando):
```
✏️ [AnomaliasPage] Clicou em Editar: {id: "123", ...}
✏️ [AnomaliasPage] Campos relevantes: {
  plantaId: ?,           ← ANOTE ESTE VALOR
  equipamentoId: ?,      ← ANOTE ESTE VALOR  
  planta_id: ?,          ← ANOTE ESTE VALOR
  equipamento_id: ?,     ← ANOTE ESTE VALOR
  local: "Local ABC",
  ativo: "Ativo XYZ"
}
```

#### B. **LOGS DE TRANSFORMAÇÃO**:
```
📤 Transformed entity: {id: "123", localizacao: {...}}
🎯 Localizacao object will be: {
  plantaId: "456",       ← ANOTE ESTE VALOR (deve ser diferente de A?)
  equipamentoId: "789",  ← ANOTE ESTE VALOR (deve ser diferente de A?)
  local: "Local ABC",
  ativo: "Ativo XYZ"
}
```

#### C. **LOGS DO CONTROLLER** (valores sendo definidos):
```
🔄 [LocalizacaoController] Setting values: {
  newPlantaId: "456",    ← DEVE SER IGUAL A B
  newEquipamentoId: "789" ← DEVE SER IGUAL A B
}
```

#### D. **LOGS DAS OPÇÕES DISPONÍVEIS**:
```
🏭 [LocalizacaoController] Available plantas: [
  {id: "001", nome: "Planta A"},
  {id: "456", nome: "Planta B"},    ← PROCURE SE TEM O ID DE C
  {id: "789", nome: "Planta C"}
]
🏭 [LocalizacaoController] Looking for planta with ID: "456"

⚙️ [LocalizacaoController] Available equipamentos: [
  {id: "100", nome: "Equip A", plantaId: "001"},
  {id: "789", nome: "Equip B", plantaId: "456"},  ← PROCURE SE TEM O ID DE C
  {id: "999", nome: "Equip C", plantaId: "456"}
]
⚙️ [LocalizacaoController] Looking for equipamento with ID: "789"
```

#### E. **LOGS DOS SELECTS** (renderização):
```
🏭 [SELECT] Planta A (ID: 001) - Selected: false (current value: 456)
🏭 [SELECT] Planta B (ID: 456) - Selected: true (current value: 456)   ← DEVE TER true
🏭 [SELECT] Planta C (ID: 789) - Selected: false (current value: 456)

⚙️ [SELECT] Equip A (ID: 100) - Selected: false (current value: 789)
⚙️ [SELECT] Equip B (ID: 789) - Selected: true (current value: 789)    ← DEVE TER true  
⚙️ [SELECT] Equip C (ID: 999) - Selected: false (current value: 789)
```

---

### 🚨 POSSÍVEIS PROBLEMAS E SINTOMAS:

#### PROBLEMA 1: **Dados não vêm do banco**
**Sintoma**: 
```
✏️ [AnomaliasPage] Campos relevantes: {
  plantaId: undefined,
  planta_id: undefined,
  equipamento_id: undefined
}
```
**Causa**: API não retorna planta_id/equipamento_id ou a anomalia não tem estes campos no banco
**Solução**: Verificar banco de dados e endpoint da API

#### PROBLEMA 2: **Transformação errada** 
**Sintoma**:
```
✏️ [AnomaliasPage] Campos relevantes: {planta_id: "123"}
🎯 Localizacao object will be: {plantaId: ""}  ← VAZIO!
```
**Causa**: Lógica de transformação em `getModalEntity()` não está funcionando
**Solução**: Corrigir mapeamento dos campos

#### PROBLEMA 3: **IDs não coincidem com as opções**
**Sintoma**:
```
🔄 [LocalizacaoController] Setting values: {newPlantaId: "999"}
🏭 [LocalizacaoController] Available plantas: [
  {id: "001", nome: "Planta A"},
  {id: "456", nome: "Planta B"}
]
← O ID "999" não existe nas opções disponíveis!
```
**Causa**: ID da anomalia não corresponde aos IDs das plantas/equipamentos carregados
**Solução**: Verificar se `useEquipamentos()` está carregando os dados corretos

#### PROBLEMA 4: **Tipo de dados diferente**
**Sintoma**:
```
🏭 [SELECT] Planta B (ID: 456) - Selected: false (current value: "456")
```
Note: `ID: 456` (número) vs `current value: "456"` (string)
**Causa**: Comparação entre number e string
**Solução**: Garantir que ambos são string ou number

#### PROBLEMA 5: **Select não atualiza visualmente**
**Sintoma**:
```
🏭 [SELECT] Planta B (ID: 456) - Selected: true (current value: 456)
```
Mas no browser o select ainda mostra "Selecione a planta..."
**Causa**: Problema de rendering ou estado não sincronizado
**Solução**: Forçar re-render ou usar key prop

---

### 📝 COLE AQUI OS LOGS QUE VOCÊ VIU:

```
[Cole todos os logs do console aqui]
```

---

### 📋 CHECKLIST DE VERIFICAÇÃO:

- [ ] Os dados originais têm planta_id/equipamento_id?
- [ ] A transformação está funcionando corretamente?  
- [ ] Os IDs transformados existem nas opções disponíveis?
- [ ] Os tipos de dados (string/number) são consistentes?
- [ ] Os logs mostram "Selected: true" para as opções corretas?
- [ ] Os selects no browser mostram as opções corretas visualmente?

---

### 🔧 PRÓXIMOS PASSOS:

Baseado nos logs, eu conseguirei identificar exatamente onde está o problema e aplicar a correção específica.

**Teste agora e cole os logs aqui!** 🎯