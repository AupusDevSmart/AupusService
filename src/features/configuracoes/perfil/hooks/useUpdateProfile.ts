import { useState } from 'react';
import { toast } from 'sonner';
import { profileService } from '@/services/profile.service';
import { useUserStore } from '@/store/useUserStore';
import { UpdateUsuarioDto, ChangePasswordDto } from '@/types/dtos/usuarios-dto';
import { AuthService } from '@/services/auth.service';

/**
 * Hook for managing user profile updates
 * Provides methods for updating profile data, changing password, and uploading profile images
 */
export function useUpdateProfile() {
  const { user, setUser, updateUser } = useUserStore();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  /**
   * Updates user profile data
   */
  const updateProfile = async (data: UpdateUsuarioDto) => {
    if (!user?.id) {
      toast.error('Usuário não encontrado');
      return { success: false };
    }

    setIsUpdating(true);
    try {
      const updatedUser = await profileService.updateProfile(user.id, data);

      // Update user in store
      updateUser(updatedUser);

      toast.success('Perfil atualizado com sucesso!');
      return { success: true, data: updatedUser };
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      const errorMessage = error?.response?.data?.message || 'Erro ao atualizar perfil';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * Changes user password
   */
  const changePassword = async (data: ChangePasswordDto) => {
    if (!user?.id) {
      toast.error('Usuário não encontrado');
      return { success: false };
    }

    setIsChangingPassword(true);
    try {
      await profileService.changePassword(user.id, data);

      toast.success('Senha alterada com sucesso!');
      return { success: true };
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      const errorMessage = error?.response?.data?.message || 'Erro ao alterar senha';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsChangingPassword(false);
    }
  };

  /**
   * Uploads profile image
   */
  const uploadProfileImage = async (file: File) => {
    if (!user?.id) {
      toast.error('Usuário não encontrado');
      return { success: false };
    }

    // Validate file size (max 2MB)
    const maxSizeInBytes = 2 * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      toast.error('A imagem deve ter no máximo 2MB');
      return { success: false, error: 'File too large' };
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Formato de imagem inválido. Use JPG, PNG ou GIF');
      return { success: false, error: 'Invalid file type' };
    }

    setIsUploadingImage(true);
    try {
      const result = await profileService.uploadProfileImage(user.id, file);

      // Update user avatar in store
      updateUser({ avatar_url: result.imageUrl });

      // Refresh user data from server to ensure sync
      try {
        const refreshedUser = await AuthService.refreshUserData();
        if (refreshedUser) {
          setUser(refreshedUser);
        }
      } catch (refreshError) {
        console.warn('Failed to refresh user data:', refreshError);
      }

      toast.success('Foto de perfil atualizada com sucesso!');
      return { success: true, imageUrl: result.imageUrl };
    } catch (error: any) {
      console.error('Erro ao fazer upload da imagem:', error);
      const errorMessage = error?.response?.data?.message || 'Erro ao fazer upload da imagem';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsUploadingImage(false);
    }
  };

  return {
    updateProfile,
    changePassword,
    uploadProfileImage,
    isUpdating,
    isChangingPassword,
    isUploadingImage,
    isLoading: isUpdating || isChangingPassword || isUploadingImage,
  };
}
