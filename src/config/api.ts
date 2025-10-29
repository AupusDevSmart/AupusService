//src/config/api.ts
import axios from 'axios';
import { env } from '@/config/env';
import { useUserStore } from '@/store/useUserStore';
import qs from 'qs';

const { clearUser } = useUserStore.getState();

// Função para obter token válido
const getAuthToken = () => {
  const token = localStorage.getItem('authToken');
  return token && token !== 'null' && token !== 'undefined' ? token : null;
};

export const api = axios.create({
  baseURL: "http://localhost:3000/api/v1",
  withCredentials: true,
  withXSRFToken: true,

  headers: {
    'Content-Type': 'application/json',
  },
});

// Configurar interceptor para adicionar token dinamicamente
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axios.defaults.paramsSerializer = params => {
  return qs.stringify(params, { arrayFormat: 'repeat' });
};

export function configureAxios() {
  const token = localStorage.getItem('authToken');
  if (token) {
    api.defaults.headers['Authorization'] = `Bearer ${token}`;
  }
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearUser();
      localStorage.removeItem('authToken');

      const from = window.location.pathname;
      if (from !== 'login') {
        window.location.href = `/login?redirectTo=${from}`;
      }
    }

    return Promise.reject(error);
  },
);