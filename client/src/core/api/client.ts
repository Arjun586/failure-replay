import axios from 'axios';
import type { AxiosInstance } from 'axios';

// Initializes a pre-configured Axios instance for global API communication 
export const apiClient: AxiosInstance = axios.create({
    // Configures the base URL with a fallback for local development 
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    // Enables cross-site Access-Control requests using credentials such as cookies 
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});



// Interceptor to handle global 401 Unauthorized errors and session expiration
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // Automatically clears session data and redirects to login if the token is invalid or expired
        if (error.response?.status === 401) {
            // Removes stale authentication data from local storage
            localStorage.removeItem('jwt_token');
            localStorage.removeItem('user');
            localStorage.removeItem('active_org');
            
            // Prevents infinite redirect loops by checking the current pathname
            if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
                window.location.href = '/login';
            }
        }
        
        return Promise.reject(error);
    }
);