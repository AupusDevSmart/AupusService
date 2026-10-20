import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { server } from '@/test-mocks/server';
import { documentosVeiculosService } from './documentos-veiculos.service';

/**
 * SN-78: o documento do veículo. A data digitada vai como está; sem ela, o
 * padrão "daqui a um ano" é contado no dia de quem está na tela (o dia UTC,
 * depois das 21h em Brasília, já era o seguinte).
 */
describe('documentosVeiculosService.uploadDocumento: vencimento', () => {
  const corpos: Record<string, unknown>[] = [];

  beforeEach(() => {
    corpos.length = 0;
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-20T22:30:00-03:00'));
    server.use(
      http.post('*/veiculos/:id/documentacao', async ({ request }) => {
        corpos.push((await request.json()) as Record<string, unknown>);
        return HttpResponse.json({ success: true, data: { id: 'doc1' } });
      }),
      http.post('*/veiculos/:id/documentacao/:doc/upload', () => HttpResponse.json({ success: true, data: { id: 'doc1' } })),
    );
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const arquivo = () => new File(['%PDF-1.4'], 'crlv.pdf', { type: 'application/pdf' });

  it('a data digitada vai; sem ela, daqui a um ano pelo dia da tela', async () => {
    await documentosVeiculosService.uploadDocumento('v1', { file: arquivo(), categoria: 'licenciamento', dataVencimento: '2027-05-31' }).catch(() => undefined);
    await documentosVeiculosService.uploadDocumento('v1', { file: arquivo(), categoria: 'licenciamento' }).catch(() => undefined);

    expect(corpos.map((c) => c.dataVencimento)).toEqual(['2027-05-31', '2027-10-20']);
  });
});
