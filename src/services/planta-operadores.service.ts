import { api } from '@/config/api';

export interface PlantaOperadorVinculo {
  id: string;
  planta_id: string;
  usuario_id: string;
  created_at?: string;
  usuario?: {
    id: string;
    nome: string;
    email: string;
    telefone?: string;
    is_active: boolean;
    status: string;
  };
}

export const plantaOperadoresService = {
  async list(plantaId: string): Promise<PlantaOperadorVinculo[]> {
    const res = await api.get(`/plantas/${plantaId}/operadores`);
    return res.data ?? res;
  },

  async add(plantaId: string, usuarioId: string) {
    const res = await api.post(`/plantas/${plantaId}/operadores`, { usuario_id: usuarioId });
    return res.data ?? res;
  },

  async remove(plantaId: string, usuarioId: string) {
    const res = await api.delete(`/plantas/${plantaId}/operadores/${usuarioId}`);
    return res.data ?? res;
  },
};
