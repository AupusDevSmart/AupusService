import { useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { equipamentosApi } from '@/services/equipamentos.services';
import { transformApiToFrontend } from '@/features/equipamentos/hooks/useEquipamentos';
import type { Equipamento } from '@/core/features/equipamentos/types';

export const PARAMETRO_DO_EQUIPAMENTO = 'equipamento';

/**
 * `/cadastros/equipamentos?equipamento=<id>` abre o sheet daquele equipamento
 * — é o endereço do QR da etiqueta (SN-67). A API busca com o escopo de quem
 * lê: fora das plantas dele é "Equipamento não encontrado", que o interceptor
 * mostra. Fechar o sheet tira o parâmetro, para recarregar a página não
 * reabrir.
 *
 * Busca pelo service, não pelo `getEquipamento` do hook: aquele grava o erro no
 * estado da lista, e a faixa de erro ficava aberta sobre ela.
 */
export function useEquipamentoDaUrl(abrir: (equipamento: Equipamento) => void) {
  const location = useLocation();
  const navigate = useNavigate();
  const id = new URLSearchParams(location.search).get(PARAMETRO_DO_EQUIPAMENTO)?.trim() || null;
  // Um id, uma abertura (o StrictMode roda o efeito duas vezes no dev)
  const aberto = useRef<string | null>(null);
  const abrirAtual = useRef(abrir);
  abrirAtual.current = abrir;

  const limparDaUrl = useCallback(() => {
    const params = new URLSearchParams(location.search);
    if (!params.has(PARAMETRO_DO_EQUIPAMENTO)) return;
    params.delete(PARAMETRO_DO_EQUIPAMENTO);
    aberto.current = null;
    const busca = params.toString();
    navigate({ pathname: location.pathname, search: busca ? `?${busca}` : '' }, { replace: true });
  }, [location.pathname, location.search, navigate]);

  useEffect(() => {
    if (!id || aberto.current === id) return;
    aberto.current = id;
    equipamentosApi
      .findOne(id)
      .then((resposta) => abrirAtual.current(transformApiToFrontend(resposta)))
      .catch(() => {
        // O interceptor já avisou ("Equipamento não encontrado"); o parâmetro sai
        limparDaUrl();
      });
  }, [id, limparDaUrl]);

  return { limparDaUrl };
}
