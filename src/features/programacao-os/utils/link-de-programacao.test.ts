import { describe, expect, it } from 'vitest';
import { atalhoDaOrigem, atalhoDaUrl, linkDeProgramacao } from './link-de-programacao';

describe('atalhoDaOrigem', () => {
  it('registrada: Programar, com permissão de criar programação', () => {
    expect(atalhoDaOrigem('REGISTRADA')).toEqual({ rotulo: 'Programar', permissao: 'programacao_os.manage' });
  });

  it('programada: Ver programação, com permissão de ver', () => {
    expect(atalhoDaOrigem('PROGRAMADA')).toEqual({ rotulo: 'Ver programação', permissao: 'programacao_os.view' });
  });

  it('finalizada ou sem status: nenhum atalho', () => {
    expect(atalhoDaOrigem('FINALIZADA')).toBeNull();
    expect(atalhoDaOrigem(undefined)).toBeNull();
  });
});

describe('linkDeProgramacao / atalhoDaUrl', () => {
  it('monta o link com a origem e o id', () => {
    expect(linkDeProgramacao('ANOMALIA', 'ANOM0000000000000000000001')).toBe(
      '/programacao-os?origem=ANOMALIA&id=ANOM0000000000000000000001',
    );
  });

  it('tira o espaço do fim do id (Char(26) com padding)', () => {
    expect(linkDeProgramacao('SOLICITACAO_SERVICO', 'cmsqgt8ln005x2fp0as7nlide ')).toBe(
      '/programacao-os?origem=SOLICITACAO_SERVICO&id=cmsqgt8ln005x2fp0as7nlide',
    );
  });

  it('lê de volta o que montou', () => {
    const url = new URL(linkDeProgramacao('PLANO_MANUTENCAO', 'PLANO000000000000000000001'), 'http://x');
    expect(atalhoDaUrl(url.searchParams)).toEqual({ tipo: 'PLANO_MANUTENCAO', id: 'PLANO000000000000000000001' });
  });

  it('ignora origem desconhecida ou sem id', () => {
    expect(atalhoDaUrl(new URLSearchParams('origem=MANUAL&id=x'))).toBeNull();
    expect(atalhoDaUrl(new URLSearchParams('origem=ANOMALIA'))).toBeNull();
    expect(atalhoDaUrl(new URLSearchParams('programacaoId=abc'))).toBeNull();
  });
});
