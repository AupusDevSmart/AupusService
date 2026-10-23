import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { avisoGlobalDeErro, detectarAvisosDoSonner, ESPERA_DO_AVISO_GLOBAL_MS, telaAvisouErro } from './aviso-de-erro';
import { toast as toastDoApp } from '@/hooks/use-toast';
import { toast as toastDoCore } from '@/core/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { erroParaATela, formatApiError } from '@/utils/api-error';

/**
 * SN-43: um erro da API dava dois avisos, o global do interceptor e o da tela.
 * O global agora espera um instante e some se a tela avisar o erro.
 */
describe('aviso global de erro da API', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('sem aviso da tela, o global aparece depois da espera', () => {
    const mostrar = vi.fn();
    avisoGlobalDeErro(mostrar);
    vi.advanceTimersByTime(ESPERA_DO_AVISO_GLOBAL_MS - 1);
    expect(mostrar).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(mostrar).toHaveBeenCalledTimes(1);
  });

  it('o aviso de erro da tela (shadcn, destructive) cancela o global', () => {
    const mostrar = vi.fn();
    avisoGlobalDeErro(mostrar);
    toastDoApp({ variant: 'destructive', title: 'Erro ao salvar componente UAR.' });
    vi.advanceTimersByTime(ESPERA_DO_AVISO_GLOBAL_MS * 2);
    expect(mostrar).not.toHaveBeenCalled();
  });

  it('o toast.error do Sonner também cancela; a detecção se liga uma vez só', () => {
    const original = vi.fn();
    const sonner = { error: original as (...args: never[]) => unknown };
    detectarAvisosDoSonner(sonner);
    detectarAvisosDoSonner(sonner);

    const mostrar = vi.fn();
    avisoGlobalDeErro(mostrar);
    (sonner.error as (m: string) => unknown)('Erro ao excluir equipamento');
    vi.advanceTimersByTime(ESPERA_DO_AVISO_GLOBAL_MS * 2);

    expect(mostrar).not.toHaveBeenCalled();
    expect(original).toHaveBeenCalledTimes(1);
    expect(original).toHaveBeenCalledWith('Erro ao excluir equipamento');
  });

  it('aviso de sucesso da tela não cancela o global do erro', () => {
    const mostrar = vi.fn();
    avisoGlobalDeErro(mostrar);
    toastDoApp({ title: 'Planta salva' });
    vi.advanceTimersByTime(ESPERA_DO_AVISO_GLOBAL_MS);
    expect(mostrar).toHaveBeenCalledTimes(1);
  });

  it('o aviso global, ao aparecer, não cancela outro global que ainda espera', () => {
    const primeiro = vi.fn(() => toastDoApp({ variant: 'destructive', title: 'Não foi possível concluir' }));
    const segundo = vi.fn();
    avisoGlobalDeErro(primeiro);
    vi.advanceTimersByTime(100);
    avisoGlobalDeErro(segundo);
    vi.advanceTimersByTime(ESPERA_DO_AVISO_GLOBAL_MS);
    expect(primeiro).toHaveBeenCalledTimes(1);
    expect(segundo).toHaveBeenCalledTimes(1);
  });

  it('erroParaATela (o erro no próprio formulário) devolve a mensagem e cancela o global desse erro', () => {
    const mostrar = vi.fn();
    const erro = { response: { status: 400, data: { success: false, error: { code: 'BAD_REQUEST', message: 'O campo "x" não é aceito aqui.' } } } };
    avisoGlobalDeErro(mostrar, undefined, erro);
    expect(erroParaATela(erro)).toBe('O campo "x" não é aceito aqui.');
    expect(erroParaATela({ message: 'Network Error' }, 'Não foi possível remover')).toBe('Não foi possível remover');
    vi.advanceTimersByTime(ESPERA_DO_AVISO_GLOBAL_MS * 2);
    expect(mostrar).not.toHaveBeenCalled();
  });

  it('duas falhas juntas, uma tratada pela tela: a outra continua com o aviso global', () => {
    const tratada = { response: { status: 400, data: { error: { message: 'Tratada' } } } };
    const solta = { response: { status: 500, data: { error: { message: 'Solta' } } } };
    const avisoDaTratada = vi.fn();
    const avisoDaSolta = vi.fn();
    avisoGlobalDeErro(avisoDaTratada, undefined, tratada);
    avisoGlobalDeErro(avisoDaSolta, undefined, solta);
    // A tela lê a mensagem do erro dela e avisa: sai só o global dele, mesmo não sendo o mais recente
    toastDoApp({ variant: 'destructive', title: 'Erro ao salvar', description: formatApiError(tratada) });
    vi.advanceTimersByTime(ESPERA_DO_AVISO_GLOBAL_MS);
    expect(avisoDaTratada).not.toHaveBeenCalled();
    expect(avisoDaSolta).toHaveBeenCalledTimes(1);
  });

  it('erroParaATela de um erro sem aviso global (semAvisoGlobal) não cancela o de outro', () => {
    const outro = { response: { status: 500 } };
    const avisoDoOutro = vi.fn();
    avisoGlobalDeErro(avisoDoOutro, undefined, outro);
    erroParaATela({ response: { status: 404, data: { error: { message: 'Código não encontrado' } } } });
    vi.advanceTimersByTime(ESPERA_DO_AVISO_GLOBAL_MS);
    expect(avisoDoOutro).toHaveBeenCalledTimes(1);
  });

  it('telaAvisouErro sem nada esperando não quebra', () => {
    expect(() => telaAvisouErro()).not.toThrow();
  });
});

describe('o toast do núcleo aparece na tela', () => {
  it('é o mesmo do app: o aviso de Plantas e Concessionárias aparece no Toaster do App (nunca aparecia)', () => {
    render(<Toaster />);
    act(() => {
      toastDoCore({ title: 'Planta salva', description: 'Usina Norte' });
    });
    expect(screen.getByText('Planta salva')).toBeInTheDocument();
    expect(screen.getByText('Usina Norte')).toBeInTheDocument();
  });
});
