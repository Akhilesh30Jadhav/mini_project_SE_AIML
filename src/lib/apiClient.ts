import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: { "Content-Type": "application/json" },
});

// Attach access token to every request
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem("cs_access_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auto-refresh on 401
apiClient.interceptors.response.use(
    (res) => res,
    async (error) => {
        const original = error.config;
        if (error.response?.status === 401 && !original._retry) {
            original._retry = true;
            const refreshToken = localStorage.getItem("cs_refresh_token");
            if (refreshToken) {
                try {
                    const res = await axios.post(`${BASE_URL}/auth/refresh`, {
                        refresh_token: refreshToken,
                    });
                    const { access_token, refresh_token } = res.data;
                    localStorage.setItem("cs_access_token", access_token);
                    localStorage.setItem("cs_refresh_token", refresh_token);
                    original.headers.Authorization = `Bearer ${access_token}`;
                    return apiClient(original);
                } catch {
                    // Refresh failed — clear auth
                    localStorage.removeItem("cs_access_token");
                    localStorage.removeItem("cs_refresh_token");
                    localStorage.removeItem("cs_user");
                    window.location.href = "/login";
                }
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;
