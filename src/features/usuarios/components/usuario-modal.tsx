// src/features/usuarios/components/usuario-modal.tsx
import { useState } from 'react';
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
  Settings,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Usuario, ModalMode, UsuarioFormData } from '../types';
import { usuariosFormFields } from '../config/form-config';
import { useUsuarios } from '../hooks/useUsuarios';

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

  // Hook para operações CRUD
  const { 
    createUsuario, 
    updateUsuario, 
    usuarioToFormData,
    error,
    clearError
  } = useUsuarios();

  // Estado local para feedback
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const handleSubmit = async (data: any) => {
    console.log('🚀 Iniciando handleSubmit do modal');
    console.log('📝 Dados do usuário para salvar:', data);
    console.log('🔧 Mode:', mode);
    console.log('👤 Usuário atual:', usuario);
    
    // Limpar erros anteriores
    setSubmitError(null);
    setSubmitSuccess(null);
    clearError();
    
    try {
      let resultado;
      
      if (isCreateMode) {
        console.log('✨ Criando novo usuário...');
        resultado = await createUsuario(data as UsuarioFormData);
        console.log('✅ Usuário criado com sucesso:', resultado);
        setSubmitSuccess(`Usuário ${resultado.nome} criado com sucesso! Senha padrão: ${resultado.senhaTemporaria || 'Aupus123!'}`);
      } else if (isEditMode && usuario) {
        console.log('📝 Atualizando usuário existente...');
        resultado = await updateUsuario(usuario.id, data as Partial<UsuarioFormData>);
        console.log('✅ Usuário atualizado com sucesso:', resultado);
        setSubmitSuccess(`Usuário ${resultado.nome} atualizado com sucesso!`);
      }
      
      // Aguardar um momento para mostrar a mensagem
      setTimeout(() => {
        console.log('🎉 Chamando onSuccess');
        onSuccess();
      }, 2000);
      
    } catch (error) {
      console.error('❌ Erro no handleSubmit:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao salvar usuário';
      setSubmitError(errorMessage);
      throw error; // Re-throw para o BaseModal tratar
    }
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

  const formGroups = [
    { key: 'informacoes_basicas', title: 'Informações Básicas' },
    { key: 'localizacao', title: 'Localização' },
    { key: 'configuracoes', title: 'Configurações do Sistema' },
    { key: 'permissoes', title: 'Permissões' },
    { key: 'organizacional', title: 'Informações Organizacionais' }
  ];

  // ✅ MAPEAR DADOS DO USUÁRIO PARA FORM DATA QUANDO NECESSÁRIO
  const entityForModal = usuario && (isViewMode || isEditMode) 
    ? usuarioToFormData(usuario)
    : usuario;

  // console.log('👤 Usuário original:', usuario);
  // console.log('📝 Dados mapeados para o modal:', entityForModal);

  return (
    <BaseModal
      isOpen={isOpen}
      mode={mode}
      entity={entityForModal as any} // ✅ CORREÇÃO: Cast necessário para compatibilidade
      title={getModalTitle()}
      icon={getModalIcon()}
      formFields={usuariosFormFields}
      groups={formGroups}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      {/* ✅ FEEDBACK DE ERRO */}
      {(submitError || error) && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-950 dark:border-red-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-900 dark:text-red-100">
                Erro ao salvar usuário
              </h4>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {submitError || error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ✅ FEEDBACK DE SUCESSO */}
      {submitSuccess && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-950 dark:border-green-800">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-900 dark:text-green-100">
                Sucesso!
              </h4>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                {submitSuccess}
              </p>
            </div>
          </div>
        </div>
      )}

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