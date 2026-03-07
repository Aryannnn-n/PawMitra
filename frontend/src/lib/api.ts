const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export const apiFetch = async <T = unknown>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> => {
  const token = localStorage.getItem('token');

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  let data: unknown = null;

  try {
    data = await res.json();
  } catch {
    // response had no JSON
  }

  if (!res.ok) {
    const message =
      typeof data === 'object' && data && 'msg' in data
        ? (data as { msg?: string }).msg
        : 'Something went wrong';

    throw new Error(message ?? 'Something went wrong');
  }

  return data as T;
};
