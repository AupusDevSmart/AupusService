# Correção para o Erro de Constraint de Role

## Problema
O erro indica que o constraint `usuarios_role_check` não permite o valor `"proprietario"` na coluna `role`. 

## Soluções Possíveis

### Opção 1: Mapeamento no Backend (Recomendado)

No seu `usuarios.service.ts`, adicione um método para mapear roles do Spatie para valores válidos do constraint:

```typescript
// Adicionar no UsuariosService
private mapSpatieRoleToValidDbRole(spatieRoleName: string): string {
  const mapping = {
    'proprietario': 'gerente', // proprietario do Spatie vira gerente na coluna legacy
    'user': 'vendedor',
    
    'admin': 'admin',
    'consultor': 'consultor',
    'gerente': 'gerente',
    'vendedor': 'vendedor',
  };
  
  return mapping[spatieRoleName] || 'vendedor'; // fallback seguro
}

// Modificar o método assignRole (linha 734 aprox)
// 3. Coluna legacy - sincronizar para compatibilidade com outra aplicação
await tx.usuarios.update({
  where: { id: userId },
  data: { 
    role: this.mapSpatieRoleToValidDbRole(role.name), // ✅ Usar mapeamento
    updated_at: new Date()
  }
});
```

### Opção 2: Descobrir Constraint Atual

Execute esta query no seu banco para ver quais valores são permitidos:

```sql
SELECT 
  conname, 
  pg_get_constraintdef(oid) as constraint_def
FROM pg_constraint 
WHERE conrelid = 'usuarios'::regclass 
AND contype = 'c'
AND conname = 'usuarios_role_check';
```

### Opção 3: Atualizar Constraint (se necessário)

Se quiser permitir "proprietario" na coluna legacy:

```sql
-- Remover constraint atual
ALTER TABLE usuarios DROP CONSTRAINT usuarios_role_check;

-- Criar novo constraint incluindo proprietario
ALTER TABLE usuarios ADD CONSTRAINT usuarios_role_check 
CHECK (role IN ('admin', 'consultor', 'gerente', 'vendedor', 'proprietario'));
```

## Implementação Recomendada (Backend)

```typescript
// usuarios.service.ts - Método auxiliar
private mapSpatieRoleToDbRole(spatieRole: any): string {
  if (!spatieRole || !spatieRole.name) return 'vendedor';
  
  const roleName = spatieRole.name.toLowerCase();
  const mapping = {
    'proprietario': 'gerente',
    'owner': 'gerente',
    'user': 'vendedor',
    'admin': 'admin',
    'administrator': 'admin',
    'consultor': 'consultor',
    'analyst': 'consultor',
    'gerente': 'gerente',
    'manager': 'gerente',
    'vendedor': 'vendedor',
    'seller': 'vendedor',
  };
  
  return mapping[roleName] || 'vendedor';
}

// Usar no assignRole:
await tx.usuarios.update({
  where: { id: userId },
  data: { 
    role: this.mapSpatieRoleToDbRole(role),
    updated_at: new Date()
  }
});
```

## Frontend - Já Corrigido

O frontend já foi ajustado para lidar com essa situação:

- ✅ Mapeia `proprietario` → `Proprietário` na exibição
- ✅ Entende que `proprietario` no Spatie pode ser `gerente` na coluna legacy  
- ✅ Exibe roles corretamente mesmo com essa dualidade

## Teste

Após implementar o mapeamento no backend, teste:

1. Criar usuário com role "proprietario" no sistema Spatie
2. Verificar se a coluna `role` recebe "gerente" (valor válido)
3. Confirmar que o frontend exibe "Proprietário" corretamente