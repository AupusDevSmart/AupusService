// src/features/usuarios/components/usuario-modal.tsx
import { BaseModal } from '@/components/common/base-modal/BaseModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Building2, 
  BarChart3, 
  Wrench, 
  Shield, 
  UserCheck, 
  Leaf, 
  Settings 
} from 'lucide-react';
import { Usuario, ModalMode } from '../types';
import { usuariosFormFields } from '../config/form-config';

interface UsuarioModalProps {
  isOpen: boolean;
  mode: ModalMode;
  usuario: Usuario | null;
  onClose: () => void;
  onSuccess: () => void;
  onGerenciarPlantas?: (usuario: Usuario) => void;
}

export function UsuarioModal({ 
  isOpen, 
  mode, 
  usuario, 
  onClose, 
  onSuccess,
  onGerenciarPlantas
}: UsuarioModalProps) {
  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';
  const isCreateMode = mode === 'create';

  const handleSubmit = async (data: any) => {
    console.log('Dados do usuário para salvar:', data);
    
    // ✅ NOVO: Para novos usuários, adicionar configurações de senha padrão
    if (isCreateMode) {
      const dadosCompletos = {
        ...data,
        senhaTemporaria: 'Aupus123!', // Senha padrão
        primeiroAcesso: true, // Deve trocar no primeiro login
        ultimoLogin: null
      };
      console.log('Usuário será criado com senha padrão:', dadosCompletos);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    onSuccess();
  };

  const handleGerenciarPlantas = () => {
    if (usuario && onGerenciarPlantas) {
      console.log('Abrindo gerenciamento de plantas para:', usuario.nome);
      onGerenciarPlantas(usuario);
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

  return (
    <BaseModal
      isOpen={isOpen}
      mode={mode}
      entity={usuario}
      title={getModalTitle()}
      icon={getModalIcon()}
      formFields={usuariosFormFields}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      {/* ✅ NOVO: Informações sobre senha padrão para novos usuários */}
      {isCreateMode && (
        <div className="mt-6 space-y-4">
          <h3 className="text-base font-semibold flex items-center gap-2 border-b pb-2">
            <Shield className="h-4 w-4" />
            Informações de Acesso
          </h3>
          
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 dark:bg-blue-950 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="space-y-2">
                <h4 className="font-medium text-blue-900 dark:text-blue-100">
                  Senha Padrão
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  O usuário será criado com a senha padrão: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded font-mono">Aupus123!</code>
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  No primeiro acesso, o usuário será obrigatoriamente solicitado a alterar sua senha.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Seção de plantas - apenas para proprietários no modo visualização/edição */}
      {(isViewMode || isEditMode) && 
       usuario && 
       (usuario.tipo === 'Proprietário' || usuario.perfil === 'Proprietário') && (
        <div className="mt-6 space-y-4">
          <h3 className="text-base font-semibold flex items-center gap-2 border-b pb-2">
            <Leaf className="h-4 w-4" />
            Plantas
          </h3>
          
          <div className="bg-muted/30 rounded-lg p-4 border border-dashed border-muted-foreground/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-lg px-2 py-1 font-bold">
                  {usuario.plantas || 0}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {(usuario.plantas || 0) === 1 ? 'planta' : 'plantas'}
                </span>
              </div>
            </div>
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGerenciarPlantas}
              className="w-full flex items-center gap-2"
              disabled={!onGerenciarPlantas}
            >
              <Settings className="h-4 w-4" />
              Gerenciar Plantas de {usuario.nome}
            </Button>
          </div>
        </div>
      )}
    </BaseModal>
  );
}