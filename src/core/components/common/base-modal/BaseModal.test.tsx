import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BaseModal } from '@/core/components/common/base-modal/BaseModal';
import { CampoDeNumero } from '@/components/common/CampoDeNumero';
import type { FormField } from '@/core/types/base';

const toast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({ toast: (...args: unknown[]) => toast(...args) }));

/** Um campo de número como os dos cartões de custo (material, equipe, outros custos) */
function Valor({ value, onChange }: { value?: number | null; onChange: (v: number | null) => void }) {
  const [valor, setValor] = useState<number | null>(value ?? null);
  return (
    <CampoDeNumero
      aria-label="Valor"
      value={valor}
      onChange={(v) => {
        setValor(v);
        onChange(v);
      }}
    />
  );
}

const campos = [{ key: 'valor', label: 'Valor', type: 'custom', component: Valor }] as FormField[];

describe('BaseModal: número ilegível não se salva', () => {
  it('o texto que não dá para ler trava o Salvar, com aviso; corrigido, salva o número', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <BaseModal isOpen mode="edit" entity={{ id: 'E1', valor: 10 }} title="Teste" formFields={campos} onClose={vi.fn()} onSubmit={onSubmit} />,
    );
    const campo = screen.getByLabelText('Valor');

    // Antes: o aviso ficava no campo e o formulário salvava o 10 de antes, calado
    fireEvent.change(campo, { target: { value: '1,2,3' } });
    fireEvent.blur(campo);
    fireEvent.click(screen.getByRole('button', { name: /Salvar/ }));
    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({ description: expect.stringContaining('Corrija o número') })));
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.change(campo, { target: { value: '12,5' } });
    fireEvent.blur(campo);
    fireEvent.click(screen.getByRole('button', { name: /Salvar/ }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ valor: 12.5 })));
  });
});
