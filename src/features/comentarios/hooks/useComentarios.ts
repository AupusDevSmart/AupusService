import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { comentariosApi, type AlvoDoComentario } from '@/services/comentarios.services';
import { soRepeteFalhaDeRede } from '@/utils/api-error';

const chave = (alvo: AlvoDoComentario, registroId: string) => ['comentarios', alvo, registroId.trim()] as const;

/**
 * Os comentários de uma OS ou solicitação (SN-48). Sempre frescos ao abrir o
 * sheet (o padrão do app guarda 15 min); depois de comentar, editar ou
 * excluir, a lista recarrega do servidor.
 */
export function useComentarios(alvo: AlvoDoComentario, registroId: string) {
  const queryClient = useQueryClient();
  const recarregar = () => queryClient.invalidateQueries({ queryKey: chave(alvo, registroId) });

  const lista = useQuery({
    queryKey: chave(alvo, registroId),
    queryFn: () => comentariosApi.listar(alvo, registroId),
    staleTime: 0,
    refetchOnMount: 'always',
    // 403/404 não melhoram tentando de novo: só falha de rede repete
    retry: soRepeteFalhaDeRede,
  });
  const comentar = useMutation({
    mutationFn: (dados: { comentario: string; interno: boolean }) => comentariosApi.comentar(alvo, registroId, dados.comentario, dados.interno),
    onSuccess: recarregar,
  });
  const editar = useMutation({
    mutationFn: (dados: { id: string; comentario: string }) => comentariosApi.editar(alvo, registroId, dados.id, dados.comentario),
    onSettled: recarregar,
  });
  const excluir = useMutation({
    mutationFn: (id: string) => comentariosApi.excluir(alvo, registroId, id),
    onSettled: recarregar,
  });

  return { lista, comentar, editar, excluir };
}
