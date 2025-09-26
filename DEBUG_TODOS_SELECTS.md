# 🔍 DEBUG TODOS OS SELECTS - Plantas, Equipamentos e Prioridade

## 🎯 Situação: Nenhum dos 3 selects mostra valor selecionado

### 📋 TESTE PASSO A PASSO:

#### 1. 🌐 Abra DevTools (F12) → Console
#### 2. 🗂️ Vá para Anomalias e clique em "Editar" uma anomalia
#### 3. 👀 Observe TODOS os logs na ordem correta

---

### 📊 LOGS ESPERADOS POR CATEGORIA:

#### A. **DADOS INICIAIS**
```
✏️ [AnomaliasPage] Clicou em Editar: {id: "123", ...}
✏️ [AnomaliasPage] Campos relevantes: {
  plantaId: ?, 
  equipamentoId: ?, 
  prioridade: ?,     ← ANOTE ESTE VALOR
  condicao: ?,
  origem: ?
}
```

#### B. **TRANSFORMAÇÃO**
```
📤 Transformed entity: {id: "123", prioridade: "ALTA", ...}
🎯 Localizacao object will be: {plantaId: "...", equipamentoId: "..."}
```

#### C. **MODAL/FORM**
```
🔄 [BASE MODAL] Dados iniciais definidos: {
  id: "123",
  prioridade: "ALTA",    ← DEVE SER O MESMO DE A
  localizacao: {plantaId: "456", equipamentoId: "789"}
}
```

#### D. **SELECTS DO BASEFORM** (Prioridade, Condição, Origem)
```
🔽 [BaseForm SELECT] Field "prioridade": {
  currentValue: "ALTA",     ← DEVE TER VALOR
  valueType: "string",
  options: [{value: "BAIXA", label: "Baixa"}, {value: "MEDIA", label: "Média"}, ...]
}
🔽 [BaseForm SELECT] Option "Baixa" (BAIXA) - Selected: false
🔽 [BaseForm SELECT] Option "Média" (MEDIA) - Selected: false  
🔽 [BaseForm SELECT] Option "Alta" (ALTA) - Selected: true     ← DEVE SER TRUE
🔽 [BaseForm SELECT] Option "Crítica" (CRITICA) - Selected: false
```

#### E. **LOCALIZACAO CONTROLLER**
```
🏭 [LocalizacaoController] Equipamentos carregados: 25    ← DEVE SER > 0
🔄 [LocalizacaoController] Value prop changed: {plantaId: "456", equipamentoId: "789"}
🏭 [LocalizacaoController] Available plantas: [{id: "456", nome: "Planta A"}]
🏭 [SELECT] Planta A (ID: 456, Value: "456") - Selected: true
⚙️ [SELECT] Equipamento B (ID: 789, Value: "789") - Selected: true
```

---

### 🚨 POSSÍVEIS PROBLEMAS E SOLUÇÕES:

#### PROBLEMA 1: **Nenhum log de BaseForm SELECT aparece**
**Causa**: Os campos não estão sendo renderizados como 'select'
**Solução**: Verificar se form-config.tsx tem `type: 'select'`

#### PROBLEMA 2: **BaseForm SELECT mostra currentValue: undefined**
```
🔽 [BaseForm SELECT] Field "prioridade": {
  currentValue: undefined,    ← PROBLEMA AQUI
}
```
**Causa**: Dados não chegaram no formulário
**Solução**: Verificar transformação em getModalEntity()

#### PROBLEMA 3: **BaseForm SELECT mostra valor mas Selected: false**
```
🔽 [BaseForm SELECT] Field "prioridade": {currentValue: "ALTA"}
🔽 [BaseForm SELECT] Option "Alta" (ALTA) - Selected: false  ← PROBLEMA
```
**Causa**: Comparação de tipos (string vs algo else)
**Solução**: Verificar se value e option.value são mesmo tipo

#### PROBLEMA 4: **LocalizacaoController não carrega equipamentos**
```
🏭 [LocalizacaoController] Equipamentos carregados: 0     ← PROBLEMA
```
**Causa**: Hook useEquipamentos() não está funcionando
**Solução**: Verificar se API de equipamentos está respondendo

#### PROBLEMA 5: **LocalizacaoController não recebe value**
```
🔄 [LocalizacaoController] Value prop changed: undefined  ← PROBLEMA
```
**Causa**: Campo 'localizacao' não está sendo passado
**Solução**: Verificar se BaseForm está renderizando custom fields

---

### 🔧 CHECKLIST DE VERIFICAÇÃO:

**PRIORIDADE/CONDIÇÃO/ORIGEM:**
- [ ] Logs de BaseForm SELECT aparecem?
- [ ] currentValue tem o valor correto?
- [ ] Pelo menos uma option mostra Selected: true?
- [ ] Select no browser mostra a opção selecionada?

**PLANTAS:**
- [ ] LocalizacaoController carrega equipamentos (> 0)?
- [ ] Value prop chega no LocalizacaoController?
- [ ] Available plantas tem pelo menos 1 item?
- [ ] plantaId corresponde a algum ID das plantas?
- [ ] Log mostra Selected: true para alguma planta?

**EQUIPAMENTOS:**
- [ ] plantaId está definido (não vazio)?
- [ ] equipamentosDisponiveis tem itens para a planta selecionada?
- [ ] equipamentoId corresponde a algum ID dos equipamentos?
- [ ] Log mostra Selected: true para algum equipamento?

---

### 📝 COLE OS LOGS AQUI:

```
[Cole TODOS os logs que aparecerem no console]
```

---

### 🎯 AÇÕES BASEADAS NOS RESULTADOS:

Baseado nos logs que você colar, posso identificar exatamente qual é o problema:

1. **Se não aparecer logs de BaseForm SELECT**: Problema na configuração dos campos
2. **Se currentValue for undefined**: Problema na transformação de dados  
3. **Se Selected sempre for false**: Problema de comparação de tipos
4. **Se equipamentos for 0**: Problema na API ou hook
5. **Se value não chegar no LocalizacaoController**: Problema no BaseForm

**Execute o teste e cole os logs completos aqui!** 🎯