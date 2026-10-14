import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test-utils';
import { server } from '@/test-mocks/server';
import { ResponsavelDaOS } from './ResponsavelDaOS';
import { TecnicosDaPlanta } from './TecnicosDaPlanta';
import { BaseForm } from '@/core/components/common/base-modal/BaseForm';
import type { FormField as CoreFormField } from '@/core/types/base';
import { programacaoOSFormFields } from '../config/form-config';

// Radix e cmdk usam APIs que o jsdom não tem
beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  Element.prototype.scrollIntoView ??= () => {};
});

const consultas: (string | null)[] = [];
const comPessoas = (equipe: { id: string; nome: string }[]) =>
  server.use(
    http.get('*/programacao-os/pessoas', ({ request }) => {
      consultas.push(new URL(request.url).searchParams.get('planta_id'));
      return HttpResponse.json({
        success: true,
        data: {
          equipe: equipe.map((p) => ({ ...p, email: null, papel: 'operador' })),
          apoio: [{ id: 'pla-paula', nome: 'Paula Planejadora', email: null, papel: 'analista' }],
        },
      });
    }),
  );

// O gatilho do combobox não tira o nome do texto (papel combobox): acha pelo texto
const gatilho = async (texto: RegExp | string) => (await screen.findByText(texto)).closest('button')!;
const seletoresDePessoa = () => document.querySelectorAll('button[role="combobox"]');

const abrir = async (texto: RegExp | string) => {
  const usuario = userEvent.setup();
  await usuario.click(await gatilho(texto));
  return usuario;
};

/**
 * SN-31: responsável e técnicos da programação vêm da equipe da planta ou do
 * apoio, e o que se grava é o usuário (id) com o nome.
 */
describe('ResponsavelDaOS', () => {
  beforeEach(() => {
    consultas.length = 0;
    comPessoas([{ id: 'tec-ana', nome: 'Ana Técnica' }]);
  });

  it('mostra a equipe da planta e o apoio, e grava id e nome juntos', async () => {
    const mudou = vi.fn();
    renderWithProviders(<ResponsavelDaOS formData={{ origem: { plantaId: 'planta-1' } }} onMultipleChange={mudou} />);

    const usuario = await abrir(/Escolha quem responde/);
    expect(await screen.findByText('Equipe da planta')).toBeInTheDocument();
    expect(screen.getByText('Planejamento e gestão')).toBeInTheDocument();
    await usuario.click(screen.getByRole('option', { name: 'Ana Técnica' }));

    expect(mudou).toHaveBeenCalledWith({ responsavel_id: 'tec-ana', responsavel: 'Ana Técnica' });
    expect(consultas).toEqual(['planta-1']);
  });

  it('planta sem técnicos na equipe: diz onde incluir', async () => {
    comPessoas([]);
    renderWithProviders(<ResponsavelDaOS formData={{ origem: { plantaId: 'planta-1' } }} />);
    expect(await screen.findByText(/ainda não tem técnicos na equipe/)).toBeInTheDocument();
  });

  it('sem planta: avisa que só o planejamento aparece', async () => {
    renderWithProviders(<ResponsavelDaOS formData={{}} />);
    expect(await screen.findByText(/Sem planta na origem/)).toBeInTheDocument();
    expect(consultas).toEqual([null]);
  });

  it('texto antigo, sem usuário, aparece sinalizado', async () => {
    renderWithProviders(<ResponsavelDaOS formData={{ origem: { plantaId: 'planta-1' }, responsavel: 'Ailton' }} />);
    expect(await gatilho('Ailton (sem usuário)')).toHaveAttribute('role', 'combobox');
  });

  it('na leitura, só o nome, sem consultar ninguém', () => {
    renderWithProviders(<ResponsavelDaOS disabled formData={{ responsavel: 'Paula Planejadora' }} value="pla-paula" />);
    expect(screen.getByText('Paula Planejadora')).toBeInTheDocument();
    expect(seletoresDePessoa()).toHaveLength(0);
    expect(consultas).toEqual([]);
  });
});

describe('TecnicosDaPlanta', () => {
  beforeEach(() => comPessoas([{ id: 'tec-ana', nome: 'Ana Técnica' }]));

  it('escala uma pessoa na linha do perfil: grava tecnico_id e nome', async () => {
    const mudou = vi.fn();
    renderWithProviders(
      <TecnicosDaPlanta
        value={[{ id: 'l1', nome: '', especialidade: 'Técnico Elétrico', horas_estimadas: 4 }]}
        onChange={mudou}
        formData={{ origem: { plantaId: 'planta-1' } }}
      />,
    );

    const usuario = await abrir('A definir');
    await usuario.click(await screen.findByRole('option', { name: 'Ana Técnica' }));

    expect(mudou).toHaveBeenLastCalledWith([
      expect.objectContaining({ especialidade: 'Técnico Elétrico', tecnico_id: 'tec-ana', nome: 'Ana Técnica' }),
    ]);
  });

  it('na leitura, o nome gravado e nenhum seletor', () => {
    renderWithProviders(
      <TecnicosDaPlanta
        disabled
        value={[{ id: 'l1', nome: 'Ana Técnica', especialidade: 'Técnico Elétrico', horas_estimadas: 4, tecnico_id: 'tec-ana' }]}
        onChange={vi.fn()}
        formData={{}}
      />,
    );
    expect(screen.getByDisplayValue('Ana Técnica')).toBeInTheDocument();
    expect(seletoresDePessoa()).toHaveLength(0);
  });
});

/**
 * Pelo formulário de verdade: o BaseForm só passa formData e onMultipleChange
 * para campo com `render`. Com `component` o seletor aparecia, mas a escolha
 * não chegava ao formulário e a planta da programação salva não era vista.
 */
describe('no formulário da programação', () => {
  beforeEach(() => {
    consultas.length = 0;
    comPessoas([{ id: 'tec-ana', nome: 'Ana Técnica' }]);
  });

  const campos = programacaoOSFormFields.filter((c) => ['responsavel_id', 'tecnicos'].includes(c.key)) as unknown as CoreFormField[];

  it('usa a planta da programação salva e grava responsável com id e nome', async () => {
    const mudou = vi.fn();
    renderWithProviders(
      <BaseForm
        fields={campos}
        data={{ status: 'PENDENTE', origem: { plantaId: '' }, planta_id: 'planta-1 ', tecnicos: [] }}
        errors={{}}
        disabled={false}
        onChange={mudou}
        mode="edit"
      />,
    );

    const usuario = await abrir(/Escolha quem responde/);
    await usuario.click(await screen.findByRole('option', { name: 'Ana Técnica' }));

    expect(consultas).toContain('planta-1');
    expect(mudou).toHaveBeenLastCalledWith(expect.objectContaining({ responsavel_id: 'tec-ana', responsavel: 'Ana Técnica' }));
  });
});
