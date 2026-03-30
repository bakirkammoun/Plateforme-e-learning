import axios from 'axios';
import { toast } from 'react-hot-toast';

// Create axios instance with custom config
const api = axios.create({
    baseURL: 'http://localhost:5000',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    withCredentials: true
});

// Request interceptor for adding auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor for handling errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('Response error:', error);
        
        if (error.response) {
            // Handle specific error cases
            switch (error.response.status) {
                case 401:
                    // Unauthorized - clear token and redirect to login
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/sign-in';
                    break;
                case 403:
                    toast.error('Access denied');
                    break;
                case 404:
                    toast.error('Resource not found');
                    break;
                case 500:
                    toast.error('Server error occurred');
                    break;
                default:
                    toast.error(error.response.data?.message || 'An error occurred');
            }
        } else if (error.request) {
            // Network error
            toast.error('Network error - please check your connection');
        } else {
            toast.error('An error occurred');
        }
        
        return Promise.reject(error);
    }
);

export default api; 