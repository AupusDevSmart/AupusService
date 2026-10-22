import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BaseForm } from '@/core/components/common/base-modal/BaseForm';
import type { FormField, GrupoDoFormulario } from '@/core/types/base';

describe('BaseForm: título do grupo', () => {
  const fields = [
    { key: 'nota', label: 'Nota', type: 'text', group: 'historico' },
    { key: 'potencia', label: 'Potência', type: 'text', group: 'dados_tecnicos' },
  ] as FormField[];

  const formulario = (groups?: GrupoDoFormulario[]) => (
    <BaseForm fields={fields} data={{}} errors={{}} disabled={false} onChange={vi.fn()} mode="edit" groups={groups} />
  );

  it('o título escrito sai como está', () => {
    render(formulario([{ key: 'historico', title: 'Histórico da OS', fields: ['nota'] }]));
    // Com `capitalize` em todo título, "Histórico da OS" aparecia "Histórico Da OS"
    expect(screen.getByRole('heading', { name: 'Histórico da OS' })).not.toHaveClass('capitalize');
  });

  it('sem grupos declarados, a chave crua do grupo ganha maiúsculas', () => {
    render(formulario());
    expect(screen.getByRole('heading', { name: 'dados tecnicos' })).toHaveClass('capitalize');
  });
});
