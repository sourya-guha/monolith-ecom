const API_BASE_URL = 'http://localhost:5000/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add auth token if available
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  try {
    const response = await fetch(url, config);
    const data: ApiResponse<T> = await response.json();

    if (!response.ok) {
      throw new ApiError(data.message || 'API request failed', response.status);
    }

    if (!data.success) {
      throw new ApiError(data.message || 'Request failed');
    }

    return data.data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Network error');
  }
}

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    apiRequest<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (userData: {
    name: string;
    email: string;
    password: string;
    role: 'user' | 'seller';
  }) =>
    apiRequest<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  getProfile: () => apiRequest('/auth/profile'),
};

// User API
export const userApi = {
  getProfile: () => apiRequest('/user/profile'),
  updateProfile: (data: any) => apiRequest('/user/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  getOrders: () => apiRequest('/user/orders'),
  getOrder: (id: string) => apiRequest(`/user/orders/${id}`),
  cancelOrder: (id: string) => apiRequest(`/user/orders/${id}/cancel`, {
    method: 'POST',
  }),
  getProducts: () => apiRequest('/user/products'),
  getProduct: (id: string) => apiRequest(`/user/products/${id}`),
  createOrder: (data: any) => apiRequest('/checkout', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// Seller API
export const sellerApi = {
  getDashboard: () => apiRequest('/seller/dashboard'),
  getProducts: () => apiRequest('/seller/products'),
  addProduct: (data: any) => apiRequest('/seller/products', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  createProduct: (data: any) => apiRequest('/seller/products', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateProduct: (id: string, data: any) => apiRequest(`/seller/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteProduct: (id: string) => apiRequest(`/seller/products/${id}`, {
    method: 'DELETE',
  }),
};

// Admin API
export const adminApi = {
  getDashboard: () => apiRequest('/admin/dashboard'),
  getUsers: () => apiRequest('/admin/users'),
  getSellers: () => apiRequest('/admin/sellers'),
  updateUserRole: (id: string, role: string) => apiRequest(`/admin/users/${id}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role }),
  }),
  deleteUser: (id: string) => apiRequest(`/admin/users/${id}`, {
    method: 'DELETE',
  }),
  getProducts: () => apiRequest('/admin/products'),
  updateProductStatus: (id: string, status: string) => apiRequest(`/admin/products/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  }),
  deleteProduct: (id: string) => apiRequest(`/admin/products/${id}`, {
    method: 'DELETE',
  }),
  getOrders: () => apiRequest('/admin/orders'),
  updateOrderStatus: (id: string, status: string) => apiRequest(`/admin/orders/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  }),
};

// Product API
export const productApi = {
  getAll: (params?: any) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return apiRequest(`/products${query}`);
  },
  getById: (id: string) => apiRequest(`/products/${id}`),
  getProduct: (id: string) => apiRequest(`/products/${id}`),
  getProducts: () => apiRequest(`/products`),
  search: (query: string) => apiRequest(`/products/search?q=${encodeURIComponent(query)}`),
  getCategories: () => apiRequest('/products/categories'),
};

// Cart API (if backend supports it)
export const cartApi = {
  getCart: () => apiRequest('/cart'),
  addToCart: (productId: string, quantity: number) => apiRequest('/cart', {
    method: 'POST',
    body: JSON.stringify({ productId, quantity }),
  }),
  updateCartItem: (productId: string, quantity: number) => apiRequest(`/cart/${productId}`, {
    method: 'PUT',
    body: JSON.stringify({ quantity }),
  }),
  removeFromCart: (productId: string) => apiRequest(`/cart/${productId}`, {
    method: 'DELETE',
  }),
  clearCart: () => apiRequest('/cart', { method: 'DELETE' }),
};

// Checkout API
export const checkoutApi = {
  createOrder: (orderData: any) => apiRequest('/checkout', {
    method: 'POST',
    body: JSON.stringify(orderData),
  }),
};

export { ApiError };