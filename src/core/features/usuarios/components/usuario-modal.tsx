// src/features/usuarios/components/usuario-modal.tsx
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { BaseModal } from '@/core/components/common/base-modal/BaseModal';
import { Button } from '@/core/components/ui/button';
import {
  Users,
  Building2,
  BarChart3,
  Wrench,
  Shield,
  UserCheck,
  Trash2
} from 'lucide-react';
import { Usuario, ModalMode, UsuarioFormData } from '../types';
import { usuariosFormFields } from '../config/form-config';
import { useUsuarios } from '@/core/context/hooks';
import { UsuarioPlantasTab } from './UsuarioPlantasTab';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/core/components/ui/alert-dialog';
import { formatApiError } from '@/utils/api-error';

interface UsuarioModalProps {
  isOpen: boolean;
  mode: ModalMode;
  usuario: Usuario | null;
  onClose: () => void;
  onSuccess: () => void;
  onGerenciarPlantas?: (usuario: Usuario) => void;
}

/** Identifica se o usuario tem role "operador" considerando os varios formatos do backend. */
function isOperador(usuario: Usuario | null): boolean {
  if (!usuario) return false;
  if (usuario.role_details?.name === 'operador') return true;
  if (Array.isArray(usuario.roles)) {
    // O tipo diz string[], mas o backend manda {id, name, guard_name}
    return (usuario.roles as unknown[]).some((r) =>
      typeof r === 'string' ? r === 'operador' : (r as { name?: string })?.name === 'operador',
    );
  }
  return (usuario as Usuario & { role?: string }).role === 'operador';
}

export function UsuarioModal({
  isOpen,
  mode,
  usuario,
  onClose,
  onSuccess,
}: UsuarioModalProps) {
  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';
  const isCreateMode = mode === 'create';

  // Hook para operações CRUD
  const {
    createUsuario,
    updateUsuario,
    deleteUsuario,
    usuarioToFormData,
    usuarioToFormDataAsync,
    findUsuario,
    clearError
  } = useUsuarios();

  // Estado local
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // ✅ Estado para armazenar dados do usuário com IDs do IBGE
  const [entityWithIds, setEntityWithIds] = useState<UsuarioFormData | Usuario | null>(null);

  const handleSubmit = async (data: UsuarioFormData) => {
    // Limpar erros anteriores
    clearError();

    try {
      let resultado;

      if (isCreateMode) {
        resultado = await createUsuario(data);

        // ✅ Toast de sucesso
        // A senha provisória é própria deste usuário e vai por e-mail; aparece
        // aqui uma vez, para quem cadastrou passar adiante se o e-mail falhar.
        toast.success('Usuário criado com sucesso!', {
          description: resultado.senhaTemporaria
            ? `${resultado.nome} foi criado. Senha provisória: ${resultado.senhaTemporaria} (também enviada por e-mail).`
            : `${resultado.nome} foi criado. A senha provisória foi enviada por e-mail.`,
          duration: 15000,
        });
      } else if (isEditMode && usuario) {
        resultado = await updateUsuario(usuario.id, data);

        // ✅ Toast de sucesso
        toast.success('Usuário atualizado!', {
          description: `${resultado.nome} foi atualizado com sucesso.`,
          duration: 4000,
        });
      }

      // Fechar modal e recarregar dados
      onSuccess();

    } catch (error) {
      toast.error('Erro ao salvar usuário', {
        description: formatApiError(error),
        duration: 6000,
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!usuario) return;

    setIsDeleting(true);

    try {
      await deleteUsuario(usuario.id);

      // ✅ Toast de sucesso
      toast.success('Usuário deletado!', {
        description: `${usuario.nome} foi removido do sistema.`,
        duration: 4000,
      });

      setShowDeleteDialog(false);
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('Erro ao deletar usuário', {
        description: formatApiError(error),
        duration: 6000,
      });

      setShowDeleteDialog(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const getModalTitle = () => {
    const titles = {
      create: 'Novo Usuário',
      edit: 'Editar Usuário', 
      view: 'Visualizar Usuário'
    };
    return titles[mode as keyof typeof titles];
  };

  const getModalIcon = () => {
    if (!usuario) return <Users className="h-5 w-5" />;
    
    const icons = {
      'Proprietário': <Building2 className="h-5 w-5 text-blue-600" />,
      'Administrador': <Shield className="h-5 w-5 text-purple-600" />,
      'Analista': <BarChart3 className="h-5 w-5 text-green-600" />,
      'Técnico': <Wrench className="h-5 w-5 text-orange-600" />,
      'Técnico externo': <UserCheck className="h-5 w-5 text-gray-600" />
    };
    
    return icons[usuario.perfil as keyof typeof icons] || <Users className="h-5 w-5" />;
  };

  const formGroups = [
    {
      key: 'informacoes_basicas',
      title: 'Informações Básicas',
      fields: ['nome', 'email', 'telefone', 'instagram', 'cpfCnpj']
    },
    {
      key: 'localizacao',
      title: 'Localização',
      fields: ['cep', 'estadoId', 'cidadeId', 'endereco']
    },
    {
      key: 'configuracoes',
      title: 'Configurações do Sistema',
      fields: ['roleNames', 'status']
    },
    {
      key: 'permissoes',
      title: 'Permissões',
      fields: ['permissions']
    }
  ];

  // Carrega dados completos do usuario ao editar/visualizar.
  // O endpoint LIST (/usuarios?...) retorna all_permissions vazio por performance,
  // entao precisamos refazer fetch GET /usuarios/:id para popular perms+roles.
  useEffect(() => {
    const loadUserDataWithIds = async () => {
      if (usuario && (isViewMode || isEditMode)) {
        try {
          // Refetch para garantir all_permissions populado (lista vem com [] otimizado)
          let usuarioCompleto: Usuario;
          try {
            usuarioCompleto = await findUsuario(usuario.id);
          } catch (erro) {
            // Não abre com a linha da lista: ela vem sem as permissões e com o
            // tipo da coluna antiga, e salvar mandaria isso (revisão do SN-46;
            // antes era um catch vazio). Como na edição de instrução.
            toast.error('Não foi possível abrir o usuário', { description: formatApiError(erro) });
            onClose();
            return;
          }
          const formData = await usuarioToFormDataAsync(usuarioCompleto);
          setEntityWithIds(formData);
        } catch {
          setEntityWithIds(usuarioToFormData(usuario));
        }
      } else {
        setEntityWithIds(usuario);
      }
    };

    loadUserDataWithIds();
  }, [usuario, isViewMode, isEditMode, usuarioToFormDataAsync, usuarioToFormData, findUsuario, onClose]);

  return (
    <BaseModal
      isOpen={isOpen}
      mode={mode}
      // O BaseModal tipa a entidade como a linha da tabela; aqui vai o formData
      // (com os ids do IBGE) no editar/ver, ou null no criar
      entity={entityWithIds as Usuario}
      title={getModalTitle()}
      icon={getModalIcon()}
      formFields={usuariosFormFields}
      groups={formGroups}
      onClose={onClose}
      onSubmit={handleSubmit}
      width="w-[95vw] sm:w-[600px] lg:w-[700px] xl:w-[800px]"
    >
      {/* PLANTAS ATRIBUIDAS - so para operador, em edit/view */}
      {!isCreateMode && usuario?.id && isOperador(usuario) && (
        <div className="mt-6 pt-4 border-t border-border">
          <UsuarioPlantasTab usuarioId={usuario.id} />
        </div>
      )}

      {/* BOTÃO DE DELETAR - Apenas no modo de edição */}
      {isEditMode && usuario && (
        <div className="mb-4 flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isDeleting}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {isDeleting ? 'Deletando...' : 'Excluir Usuário'}
          </Button>
        </div>
      )}

      {/* Informações sobre senha padrão - Responsivo */}
      {isCreateMode && (
        <div className="mt-4 md:mt-6 space-y-3 md:space-y-4">
          <h3 className="text-sm md:text-base font-semibold flex items-center gap-2 border-b pb-2">
            <Shield className="h-3 w-3 md:h-4 md:w-4" />
            Informações de Acesso
          </h3>

          <div className="p-3 md:p-4">
            <div className="text-xs md:text-sm text-muted-foreground space-y-1">
              <p>
                Uma senha provisória, só deste usuário, é gerada e enviada para o e-mail cadastrado.
              </p>
              <p>
                No primeiro acesso, ele troca essa senha por uma que só ele saiba antes de usar o sistema.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* DIALOG DE CONFIRMAÇÃO DE DELETE */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Excluir permanentemente o usuário <span className="font-semibold">{usuario?.nome}</span>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </BaseModal>
  );
}