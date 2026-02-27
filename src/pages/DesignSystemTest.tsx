// src/pages/DesignSystemTest.tsx - Página de teste do Minimal Design System
import { Layout } from '@/components/common/Layout';
import { TitleCard } from '@/components/common/title-card';

export default function DesignSystemTest() {
  return (
    <Layout>
      <div className="p-6 space-y-8">
        <TitleCard
          title="Teste do Minimal Design System"
          description="Validação visual dos componentes do design system"
        />

        {/* Botões */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Botões</h2>
          <div className="flex gap-3 flex-wrap">
            <button className="btn-minimal-primary h-9">
              Primary Button
            </button>
            <button className="btn-minimal-outline h-9">
              Outline Button
            </button>
            <button className="btn-minimal-ghost h-9">
              Ghost Button
            </button>
            <button className="btn-minimal-primary h-9" disabled>
              Disabled
            </button>
          </div>
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Inputs</h2>
          <div className="grid grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Input normal"
              className="input-minimal"
            />
            <input
              type="text"
              placeholder="Input disabled"
              className="input-minimal"
              disabled
            />
            <select className="select-minimal">
              <option>Opção 1</option>
              <option>Opção 2</option>
              <option>Opção 3</option>
            </select>
          </div>
        </div>

        {/* Alerts */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Alerts</h2>
          <div className="space-y-3">
            <div className="alert-minimal alert-info">
              ℹ️ Alert informativo
            </div>
            <div className="alert-minimal alert-success">
              ✅ Alert de sucesso
            </div>
            <div className="alert-minimal alert-warning">
              ⚠️ Alert de aviso
            </div>
            <div className="alert-minimal alert-error">
              ❌ Alert de erro
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Badges</h2>
          <div className="flex gap-3 flex-wrap">
            <span className="badge-minimal badge-default">Default</span>
            <span className="badge-minimal badge-success">Success</span>
            <span className="badge-minimal badge-warning">Warning</span>
            <span className="badge-minimal badge-error">Error</span>
            <span className="badge-minimal badge-info">Info</span>
          </div>
        </div>

        {/* Table */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Tabela</h2>
          <table className="table-minimal">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>João Silva</td>
                <td>joao@example.com</td>
                <td><span className="badge-minimal badge-success">Ativo</span></td>
                <td>
                  <button className="btn-minimal-ghost h-8 text-xs">Editar</button>
                </td>
              </tr>
              <tr>
                <td>Maria Santos</td>
                <td>maria@example.com</td>
                <td><span className="badge-minimal badge-warning">Pendente</span></td>
                <td>
                  <button className="btn-minimal-ghost h-8 text-xs">Editar</button>
                </td>
              </tr>
              <tr>
                <td>Pedro Costa</td>
                <td>pedro@example.com</td>
                <td><span className="badge-minimal badge-error">Inativo</span></td>
                <td>
                  <button className="btn-minimal-ghost h-8 text-xs">Editar</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Cards */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Cards</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="card-minimal">
              <h3 className="font-semibold mb-2">Card 1</h3>
              <p className="text-sm text-muted-foreground">
                Conteúdo do card com texto descritivo.
              </p>
            </div>
            <div className="card-minimal">
              <h3 className="font-semibold mb-2">Card 2</h3>
              <p className="text-sm text-muted-foreground">
                Conteúdo do card com texto descritivo.
              </p>
            </div>
            <div className="card-minimal">
              <h3 className="font-semibold mb-2">Card 3</h3>
              <p className="text-sm text-muted-foreground">
                Conteúdo do card com texto descritivo.
              </p>
            </div>
          </div>
        </div>

        {/* Light/Dark Mode Test */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Teste de Tema</h2>
          <p className="text-sm text-muted-foreground">
            Todos os componentes acima devem se adaptar automaticamente ao tema light/dark.
            Use o botão de troca de tema no menu superior para testar.
          </p>
          <div className="p-4 border rounded">
            <p className="text-foreground">Texto com cor automática (foreground)</p>
            <p className="text-muted-foreground">Texto secundário (muted-foreground)</p>
            <div className="mt-2 p-3 bg-muted rounded">
              Background com cor automática (muted)
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="p-4 border rounded bg-green-50 dark:bg-green-950">
          <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
            ✅ Minimal Design System Ativo!
          </h3>
          <p className="text-sm text-green-800 dark:text-green-200">
            Se você está vendo os estilos minimalistas acima, o design system está funcionando corretamente.
            Todos os componentes devem ter bordas discretas (4px), inputs finos (h-9), e cores neutras.
          </p>
        </div>
      </div>
    </Layout>
  );
}
