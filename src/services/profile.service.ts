import { api } from '@/config/api';
import { UsuarioDTO, UpdateUsuarioDto, ChangePasswordDto } from '@/types/dtos/usuarios-dto';

/**
 * Service for managing user profile operations
 */
export const profileService = {
  /**
   * Updates user profile data
   * @param userId - The ID of the user to update
   * @param data - The profile data to update
   * @returns Updated user data
   */
  async updateProfile(userId: string, data: UpdateUsuarioDto): Promise<UsuarioDTO> {
    const response = await api.patch<any>(`/usuarios/${userId}`, data);
    return response.data?.data || response.data;
  },

  /**
   * Changes user password
   * @param userId - The ID of the user
   * @param data - Current and new password data
   * @returns Success message
   */
  async changePassword(
    userId: string,
    data: ChangePasswordDto
  ): Promise<{ message: string }> {
    const response = await api.patch<any>(`/usuarios/${userId}/change-password`, data);
    return response.data?.data || response.data;
  },

  /**
   * Uploads a new profile image
   * @param userId - The ID of the user
   * @param file - The image file to upload
   * @returns URL of the uploaded image
   */
  async uploadProfileImage(userId: string, file: File): Promise<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<any>(`/usuarios/${userId}/upload-avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data?.data || response.data;
  },
};
