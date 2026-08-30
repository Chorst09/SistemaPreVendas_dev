const getApiBaseUrl = () => {
  const explicitApiUrl = String(process.env.NEXT_PUBLIC_API_URL || '').trim();
  if (explicitApiUrl) return explicitApiUrl.replace(/\/+$/, '');
  return '/api';
};

export const API_BASE_URL = getApiBaseUrl();

export const buildApiUrl = (endpoint) => {
  const base = String(API_BASE_URL || '/api').replace(/\/+$/, '');
  const path = String(endpoint || '/').startsWith('/') ? String(endpoint || '/') : `/${String(endpoint || '/')}`;
  return `${base}${path}`;
};

export const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};
