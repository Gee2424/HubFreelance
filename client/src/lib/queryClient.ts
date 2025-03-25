import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest<T = any>(
  url: string,
  options?: RequestInit
): Promise<T> {
  // Get auth token from localStorage if available
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');
  let userId = null;
  
  if (userString) {
    try {
      const userData = JSON.parse(userString);
      userId = userData.id;
    } catch (e) {
      console.error('Failed to parse user data from localStorage', e);
    }
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      "Content-Type": "application/json",
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(userId ? { 'user-id': userId.toString() } : {})
    },
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return await res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Get auth token and user ID from localStorage if available
    const token = localStorage.getItem('token');
    const userString = localStorage.getItem('user');
    let userId = null;
    
    if (userString) {
      try {
        const userData = JSON.parse(userString);
        userId = userData.id;
      } catch (e) {
        console.error('Failed to parse user data from localStorage', e);
      }
    }

    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(userId ? { 'user-id': userId.toString() } : {})
      }
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
