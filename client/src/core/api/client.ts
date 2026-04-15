import axios from 'axios';
import type { AxiosInstance } from 'axios';

// Initializes a pre-configured Axios instance for global API communication [cite: 4225, 4229]
export const apiClient: AxiosInstance = axios.create({
    // Configures the base URL with a fallback for local development [cite: 4225, 4229]
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    // Enables cross-site Access-Control requests using credentials such as cookies [cite: 4225, 4229]
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to inject the JWT authorization token into every outgoing request [cite: 4226, 4230]
apiClient.interceptors.request.use(
    (config) => {
        // Retrieves the current session token from local storage [cite: 4226, 4230]
        const token = localStorage.getItem('jwt_token');
        
        // Appends the token to the Authorization header if it exists [cite: 4226, 4231]
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor to handle global 401 Unauthorized errors and session expiration [cite: 4227, 4232]
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // Automatically clears session data and redirects to login if the token is invalid or expired [cite: 4227]
        if (error.response?.status === 401) {
            // Removes stale authentication data from local storage [cite: 4227]
            localStorage.removeItem('jwt_token');
            localStorage.removeItem('user');
            localStorage.removeItem('active_org');
            
            // Prevents infinite redirect loops by checking the current pathname [cite: 4227]
            if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
                window.location.href = '/login';
            }
        }
        
        return Promise.reject(error);
    }
);