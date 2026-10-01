import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const BASE_URL = "/api/v1";

export const api = axios.create({ baseURL: BASE_URL });

function getTokens() {
  return {
    access: localStorage.getItem("access_token"),
    refresh: localStorage.getItem("refresh_token"),
  };
}

function setTokens(access: string, refresh: string) {
  localStorage.setItem("access_token", access);
  localStorage.setItem("refresh_token", refresh);
}

export function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const { access } = getTokens();
  if (access) {
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const { refresh } = getTokens();
  if (!refresh) return null;
  try {
    const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refresh_token: refresh });
    setTokens(data.access_token, data.refresh_token);
    return data.access_token;
  } catch {
    clearTokens();
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      if (!refreshing) {
        refreshing = refreshAccessToken().finally(() => {
          refreshing = null;
        });
      }
      const newToken = await refreshing;
      if (newToken) {
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export { setTokens };
