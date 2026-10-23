import { useEffect } from 'react';
import { AuthService } from '@/services/auth.service';
import { useUserStore } from '@/store/useUserStore';

let atualizadaNestaCarga = false;

/**
 * Relê o usuário (`/auth/me`) uma vez por carga da página. O store guarda as
 * permissões do login no localStorage e nada as atualizava: permissão dada,
 * tirada ou renomeada (o sync-rbac do SN-32) só valia depois de sair e entrar —
 * até lá a tela dizia "Sem acesso" ou mostrava botão que o backend recusa.
 * Recarregar a página basta. Falha de rede: o interceptor já avisa, e a
 * próxima carga tenta de novo; 401 desloga pelo interceptor.
 */
export function useSessaoAtualizada(logado: boolean) {
  const updateUser = useUserStore((s) => s.updateUser);

  useEffect(() => {
    if (!logado || atualizadaNestaCarga) return;
    atualizadaNestaCarga = true;
    AuthService.getCurrentUser()
      .then((usuario) => updateUser(usuario))
      .catch((erro: unknown) => {
        atualizadaNestaCarga = false;
        console.error('Não foi possível atualizar as permissões da sessão:', erro);
      });
  }, [logado, updateUser]);
}

/** Só para os testes: cada um começa como uma carga nova da página */
export function reiniciarSessaoAtualizada() {
  atualizadaNestaCarga = false;
}
