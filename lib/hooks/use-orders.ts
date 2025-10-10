import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

interface OrdersQueryParams {
  search?: string;
  status?: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'all';
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

interface Order {
  id: string;
  orderNumber: string;
  total: string;
  subtotal: string;
  tax: string;
  shipping: string;
  status: string;
  paymentStatus: string | null;
  createdAt: string;
  vendor: {
    businessName: string;
  };
  items: Array<{
    id: string;
    quantity: number;
    price: string;
    total: string;
    product: {
      name: string;
      images: string[];
      slug: string;
    };
  }>;
}

interface OrderDetail extends Order {
  paymentIntentId: string | null;
  trackingNumber: string | null;
  carrier: string | null;
  estimatedDeliveryDate: string | null;
  actualDeliveryDate: string | null;
  updatedAt: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  } | null;
  billingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  } | null;
  notes: string | null;
  userId: string | null;
  guestEmail: string | null;
  guestName: string | null;
  guestPhone: string | null;
  vendor: {
    id: string;
    businessName: string;
    email: string;
    phone: string | null;
  };
  user: {
    name: string;
    email: string;
  } | null;
}

interface OrdersResponse {
  orders: Order[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
    limit: number;
  };
}

// Custom fetch function with error handling
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    ...options,
    credentials: 'include', // Include cookies for authentication
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    const error = new Error(errorData.error || `HTTP ${response.status}`);
    (error as any).status = response.status;
    throw error;
  }

  return response.json();
}

// Hook for fetching user orders with pagination and filters
export function useOrders(params: OrdersQueryParams = {}) {
  const { data: session } = useSession();

  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, value.toString());
    }
  });

  return useQuery<OrdersResponse>({
    queryKey: ['orders', params],
    queryFn: () => fetchWithAuth(`/api/orders?${queryParams.toString()}`),
    enabled: !!session?.user,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook for fetching infinite orders (for pagination)
export function useInfiniteOrders(params: Omit<OrdersQueryParams, 'page'> = {}) {
  const { data: session } = useSession();

  return useInfiniteQuery<OrdersResponse>({
    queryKey: ['orders', 'infinite', params],
    queryFn: ({ pageParam = 1 }) => {
      const queryParams = new URLSearchParams();
      Object.entries({ ...params, page: pageParam }).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
      return fetchWithAuth(`/api/orders?${queryParams.toString()}`);
    },
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasNext 
        ? lastPage.pagination.currentPage + 1 
        : undefined;
    },
    enabled: !!session?.user,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    initialPageParam: 1,
  });
}

// Related order (for multi-vendor tracking)
interface RelatedOrder {
  id: string;
  orderNumber: string;
  status: string;
  total: string;
  trackingNumber: string | null;
  carrier: string | null;
  vendor: {
    id: string;
    businessName: string;
  };
  items: Array<{
    id: string;
    quantity: number;
    product: {
      name: string;
    };
  }>;
}

// Hook for fetching single order details
export function useOrder(orderNumber: string) {
  const { data: session } = useSession();

  return useQuery<{ order: OrderDetail; relatedOrders?: RelatedOrder[] }>({
    queryKey: ['order', orderNumber],
    queryFn: () => fetchWithAuth(`/api/orders/${orderNumber}`),
    enabled: !!session?.user && !!orderNumber,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook for fetching a guest order (no auth) via email + orderNumber
export function useGuestOrder(orderNumber: string, email: string | null) {
  return useQuery<{ order: OrderDetail; relatedOrders?: RelatedOrder[] }>({
    queryKey: ['guest-order', orderNumber, email],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (email) params.set('email', email);
      return fetchWithAuth(`/api/orders/guest/${orderNumber}?${params.toString()}`);
    },
    enabled: !!orderNumber && !!email,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// Hook for order statistics (useful for dashboard)
export function useOrderStats() {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['orders', 'stats'],
    queryFn: async () => {
      const [pending, paid, shipped, delivered] = await Promise.all([
        fetchWithAuth('/api/orders?status=pending&limit=1'),
        fetchWithAuth('/api/orders?status=paid&limit=1'),
        fetchWithAuth('/api/orders?status=shipped&limit=1'),
        fetchWithAuth('/api/orders?status=delivered&limit=1'),
      ]);

      return {
        pending: pending.pagination.totalCount,
        paid: paid.pagination.totalCount,
        shipped: shipped.pagination.totalCount,
        delivered: delivered.pagination.totalCount,
        total: pending.pagination.totalCount + paid.pagination.totalCount + 
               shipped.pagination.totalCount + delivered.pagination.totalCount,
      };
    },
    enabled: !!session?.user,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}