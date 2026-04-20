const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ||
  'http://localhost:5000/api';

type Primitive = string | number | boolean | null | undefined;

interface ApiEnvelope<T = unknown> {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
  [key: string]: unknown;
}

type ApiOptions = RequestInit & {
  unwrapKey?: string;
  rawResponse?: boolean;
};

export interface AuthUser {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role: 'user' | 'seller' | 'admin';
}

export interface AuthPayload {
  token: string;
  user: AuthUser;
}

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  pincode: string;
}

export interface OrderItemInput {
  product: string;
  quantity: number;
  price: number;
}

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function parseResponsePayload(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (isJson) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  try {
    const text = await response.text();
    return text || null;
  } catch {
    return null;
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function extractErrorMessage(payload: unknown, fallback: string) {
  if (!isPlainObject(payload)) return fallback;

  const message = payload.message;
  const error = payload.error;

  if (typeof message === 'string' && message.trim()) return message;
  if (typeof error === 'string' && error.trim()) return error;

  return fallback;
}

function unwrapPayload<T>(payload: unknown, unwrapKey?: string): T {
  if (!isPlainObject(payload)) {
    return payload as T;
  }

  const envelope = payload as ApiEnvelope<T>;

  if (unwrapKey && unwrapKey in envelope) {
    return envelope[unwrapKey] as T;
  }

  if ('data' in envelope) {
    return envelope.data as T;
  }

  return payload as T;
}

function buildHeaders(options: RequestInit) {
  const headers = new Headers(options.headers);

  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  return headers;
}

async function apiRequest<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { unwrapKey, rawResponse, ...requestOptions } = options;
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...requestOptions,
      headers: buildHeaders(requestOptions),
    });

    const payload = await parseResponsePayload(response);

    if (!response.ok) {
      throw new ApiError(
        extractErrorMessage(
          payload,
          `API request to ${endpoint} failed (${response.status} ${response.statusText || 'error'})`
        ),
        response.status
      );
    }

    if (isPlainObject(payload) && payload.success === false) {
      throw new ApiError(extractErrorMessage(payload, `Request to ${endpoint} failed`), response.status);
    }

    if (rawResponse) {
      return (payload ?? null) as T;
    }

    return unwrapPayload<T>(payload, unwrapKey);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(`Unable to reach the backend for ${endpoint}. Check that the API server is running.`);
  }
}

export function normalizeUser<T extends Partial<AuthUser>>(user: T | null | undefined) {
  if (!user) return null;

  const fullName = typeof user.name === 'string' ? user.name.trim() : '';
  const [firstName = '', ...rest] = fullName.split(/\s+/).filter(Boolean);
  const lastName = rest.join(' ');

  return {
    ...user,
    id: user.id || user._id || '',
    name: fullName,
    firstName,
    lastName,
  };
}

function toSearchParams(params?: Record<string, Primitive>) {
  if (!params) return '';

  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  }

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export const authApi = {
  login: (email: string, password: string) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  verifyOtp: (email: string, otp: string) =>
    apiRequest<AuthPayload>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    }),

  register: (userData: {
    name: string;
    email: string;
    password: string;
    role: 'user' | 'seller';
  }) =>
    apiRequest<AuthPayload>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
};

export const userApi = {
  getProfile: () => apiRequest('/user/profile'),
  updateProfile: (data: { firstName: string; lastName: string; email: string }) =>
    apiRequest('/user/profile', {
      method: 'PUT',
      body: JSON.stringify({
        name: `${data.firstName} ${data.lastName}`.trim(),
        email: data.email,
      }),
      unwrapKey: 'user',
    }),
  getOrders: () => apiRequest('/user/orders'),
  cancelOrder: (id: string) =>
    apiRequest(`/user/orders/${id}/cancel`, {
      method: 'PUT',
    }),
  getProducts: () => apiRequest('/user/products'),
  getProduct: (id: string) => apiRequest(`/user/products/${id}`),
  createOrder: (data: { items: OrderItemInput[]; shippingAddress: ShippingAddress }) =>
    apiRequest('/user/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const sellerApi = {
  getProducts: () => apiRequest('/seller/products', { unwrapKey: 'products' }),
  getProduct: (id: string) =>
    apiRequest(`/seller/products/${id}`, {
      unwrapKey: 'product',
    }),
  uploadImages: (formData: FormData) =>
    apiRequest<{ images: string[] }>('/seller/upload', {
      method: 'POST',
      body: formData,
    }),
  addProduct: (data: unknown) =>
    apiRequest('/seller/products', {
      method: 'POST',
      body: JSON.stringify(data),
      unwrapKey: 'product',
    }),
  createProduct: (data: unknown) =>
    apiRequest('/seller/products', {
      method: 'POST',
      body: JSON.stringify(data),
      unwrapKey: 'product',
    }),
  updateProduct: (id: string, data: unknown) =>
    apiRequest(`/seller/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      unwrapKey: 'product',
    }),
  deleteProduct: (id: string) =>
    apiRequest(`/seller/products/${id}`, {
      method: 'DELETE',
      rawResponse: true,
    }),
};

export const adminApi = {
  getUsers: () => apiRequest('/admin/users', { unwrapKey: 'users' }),
  getSellers: () => apiRequest('/admin/sellers', { unwrapKey: 'sellers' }),
  updateUserRole: (id: string, role: string) =>
    apiRequest(`/admin/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
      unwrapKey: 'user',
    }),
  deleteUser: (id: string) =>
    apiRequest(`/admin/users/${id}`, {
      method: 'DELETE',
      rawResponse: true,
    }),
  getProducts: () => apiRequest('/admin/products', { unwrapKey: 'products' }),
  deleteProduct: (id: string) =>
    apiRequest(`/admin/products/${id}`, {
      method: 'DELETE',
      rawResponse: true,
    }),
  getOrders: () => apiRequest('/admin/orders', { unwrapKey: 'orders' }),
  updateOrderStatus: (id: string, status: string) =>
    apiRequest(`/admin/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
      unwrapKey: 'order',
    }),
};

export const productApi = {
  getAll: async (params?: Record<string, Primitive>) => {
    const products = (await userApi.getProducts()) as Array<Record<string, unknown>>;
    const category = String(params?.category || '').trim().toLowerCase();

    if (!category) return products;

    return products.filter(
      (product) => String(product.category || '').trim().toLowerCase() === category
    );
  },
  getById: (id: string) => userApi.getProduct(id),
  getProduct: (id: string) => userApi.getProduct(id),
  getProducts: () => userApi.getProducts(),
  search: async (query: string) => {
    const products = (await userApi.getProducts()) as Array<Record<string, unknown>>;
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) return products;

    return products.filter((product) => {
      const name = String(product.name || '').toLowerCase();
      const description = String(product.description || '').toLowerCase();
      const category = String(product.category || '').toLowerCase();

      return (
        name.includes(normalizedQuery) ||
        description.includes(normalizedQuery) ||
        category.includes(normalizedQuery)
      );
    });
  },
  getCategories: async () => {
    const products = (await userApi.getProducts()) as Array<Record<string, unknown>>;
    return [...new Set(products.map((product) => String(product.category || '')).filter(Boolean))];
  },
};

export const checkoutApi = {
  createOrder: userApi.createOrder,
};

export const chatApi = {
  startForProduct: (productId: string) =>
    apiRequest('/chat/start', {
      method: 'POST',
      body: JSON.stringify({ productId }),
      unwrapKey: 'conversation',
    }),
  listConversations: () => apiRequest('/chat/conversations', { unwrapKey: 'conversations' }),
  getMessages: (conversationId: string) =>
    apiRequest(`/chat/conversations/${conversationId}/messages`, { unwrapKey: 'messages' }),
};

export { ApiError, toSearchParams };
