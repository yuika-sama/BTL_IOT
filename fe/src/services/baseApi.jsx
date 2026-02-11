import axios from 'axios';

const baseApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor
baseApi.interceptors.request.use(
  (config) => {
    // Có thể thêm token vào header ở đây nếu cần
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
baseApi.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const message = error.response?.data?.message || error.message || 'Có lỗi xảy ra';
    console.error('API Error:', message);
    return Promise.reject(error);
  }
);

export default baseApi;