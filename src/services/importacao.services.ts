import { api } from '@/config/api';
import type {
  CadastroImportavel,
  RegistroDaPlanilha,
  ResultadoDaImportacao,
} from '@/lib/planilha/tipos';

export const ImportacaoService = {
  /**
   * Prévia (`confirmar: false`) ou gravação. O servidor roda o mesmo caminho
   * nos dois casos e só no fim decide se grava — e não grava nada se houver
   * qualquer erro.
   */
  async importar(
    cadastro: CadastroImportavel,
    registros: RegistroDaPlanilha[],
    confirmar: boolean,
  ): Promise<ResultadoDaImportacao> {
    const { data } = await api.post<ResultadoDaImportacao | { data: ResultadoDaImportacao }>(
      `/importacao/${cadastro}`,
      {
        confirmar,
        // O mapa de linhas é do front: serve para apontar o erro, não ao servidor.
        registros: registros.map(({ linhasDosCampos: _linhas, ...registro }) => registro),
      },
    );

    // O interceptor de `@/config/api` já tira o `{ success, data }`; o `data`
    // a mais só aparece se a resposta vier sem o embrulho padrão.
    return 'confirmado' in data ? data : data.data;
  },
};
