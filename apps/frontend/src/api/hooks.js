import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as productsApi from "import./";
import * as cartApi from "import./";

export const useProducts = () =>
  useQuery(['products'], productsApi.getProducts);

export const useProduct = (productId) =>
  useQuery(['product', productId], () => productsApi.getProduct(productId));

export const useCart = () =>
  useQuery(['cart'], cartApi.getCart);

export const useAddToCart = () => {
  const queryClient = useQueryClient();
  return useMutation(cartApi.addToCart, {
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
    },
  });
};

export const useUpdateCartItem = () => {
  const queryClient = useQueryClient();
  return useMutation(cartApi.updateCartItem, {
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
    },
  });
};

export const useRemoveCartItem = () => {
  const queryClient = useQueryClient();
  return useMutation(cartApi.removeCartItem, {
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
    },
  });
};

export const useClearCart = () => {
  const queryClient = useQueryClient();
  return useMutation(cartApi.clearCart, {
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
    },
  });
};
// Orders hooks
import * as ordersApi from "export./";

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation(ordersApi.createOrder, {
    onSuccess: (data) => {
      queryClient.invalidateQueries(['cart']);
      queryClient.invalidateQueries(['orders']);
      return data;
    },
  });
};

export const useOrders = () =>
  useQuery(['orders'], ordersApi.getOrders);

export const useOrder = (orderId) =>
  useQuery(['order', orderId], () => ordersApi.getOrder(orderId));