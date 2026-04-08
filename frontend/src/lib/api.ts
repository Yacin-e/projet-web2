import axios from "axios";
import { clearTokens, getTokens, setTokens } from "./auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const tokens = getTokens();
  if (tokens?.access) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${tokens.access}`;
  }
  return config;
});

let refreshing: Promise<string> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const status = err?.response?.status;
    const original = err?.config;

    if (status !== 401 || !original || original.__isRetryRequest) {
      throw err;
    }

    const tokens = getTokens();
    if (!tokens?.refresh) {
      clearTokens();
      throw err;
    }

    original.__isRetryRequest = true;

    refreshing =
      refreshing ??
      (async () => {
        const r = await axios.post(`${API_BASE_URL}/api/auth/refresh/`, { refresh: tokens.refresh });
        const newAccess = r.data?.access as string | undefined;
        if (!newAccess) throw new Error("Refresh failed");
        setTokens({ access: newAccess, refresh: tokens.refresh });
        return newAccess;
      })().finally(() => {
        refreshing = null;
      });

    const newAccess = await refreshing;
    original.headers = original.headers ?? {};
    original.headers.Authorization = `Bearer ${newAccess}`;
    return api.request(original);
  }
);

