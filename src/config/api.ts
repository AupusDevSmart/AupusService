//src/config/api.ts
import axios, { InternalAxiosRequestConfig } from 'axios';
import { env } from '@/config/env';
import { useUserStore } from '@/store/useUserStore';
import { toast } from '@/hooks/use-toast';
import { AuthService } from '@/services/auth.service';
import qs from 'qs';

/**
 * Flag para controlar se já está fazendo refresh
 * Evita múltiplas tentativas simultâneas
 */
let isRefreshing = false;

/**
 * Fila de requisições que falharam e estão aguardando o refresh
 */
let failedQueue: Array<{
  resolve: (token: string | null) => void;
  reject: (error: any) => void;
}> = [];

/**
 * Processa a fila de requisições após refresh bem-sucedido ou falha
 */
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

export const api = axios.create({
  baseURL: env.VITE_API_URL,
  withCredentials: true,
  withXSRFToken: true,

  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Interceptor de REQUEST
 * Adiciona o token de autenticação automaticamente
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = AuthService.getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axios.defaults.paramsSerializer = params => {
  return qs.stringify(params, { arrayFormat: 'repeat' });
};

/**
 * @deprecated Esta função não é mais necessária pois o interceptor já adiciona o token automaticamente
 */
export function configureAxios() {
  const token = AuthService.getToken();
  if (token) {
    api.defaults.headers['Authorization'] = `Bearer ${token}`;
  }
}

/**
 * Interceptor de RESPONSE
 * Trata erro 401, tenta renovar token e reprocessa requisições
 */
api.interceptors.response.use(
  (response) => {
    // Log para debug de programacao-os
    if (response.config.url?.includes('programacao-os')) {
    }

    // Desempacotar resposta padrão da API: { success: true, data: {...}, meta: {...} }
    if (response.data && response.data.success && response.data.data !== undefined) {
      return { ...response, data: response.data.data };
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Se erro 401 e não é tentativa de login ou refresh
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      // Se já está fazendo refresh, adiciona na fila
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      // Marca que está fazendo refresh
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log('🔄 [API INTERCEPTOR] Token expirado, tentando renovar...');

        // Tenta renovar o token
        const { access_token } = await AuthService.refreshToken();

        console.log('✅ [API INTERCEPTOR] Token renovado com sucesso');

        // Processa fila de requisições pendentes
        processQueue(null, access_token);

        // Retenta a requisição original com novo token
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error('❌ [API INTERCEPTOR] Falha ao renovar token:', refreshError);

        // Processa fila com erro
        processQueue(refreshError, null);

        // Limpa dados do usuário e redireciona para login
        const { clearUser } = useUserStore.getState();
        clearUser();
        AuthService.clearTokens();

        const currentPath = window.location.pathname;
        if (currentPath !== '/login') {
          window.location.href = `/login?redirectTo=${currentPath}`;
        }

        toast({
          variant: 'destructive',
          title: 'Sessão expirada',
          description: 'Por favor, faça login novamente.',
        });

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Tratamento global de erros da API
    const errorMessage = error.response?.data?.error?.message
      || error.response?.data?.message
      || error.message
      || 'Erro ao processar requisição';

    const errorCode = error.response?.data?.error?.code
      || error.response?.status
      || 'UNKNOWN_ERROR';

    // Mostrar toast com o erro (exceto para erros 401 que são tratados acima)
    if (error.response?.status !== 401) {
      toast({
        variant: 'destructive',
        title: `Erro ${errorCode}`,
        description: errorMessage,
      });
    }

    // Log detalhado no console para debug
    console.error('❌ [API Error]', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      code: errorCode,
      message: errorMessage,
      fullError: error.response?.data,
    });

    return Promise.reject(error);
  },
);