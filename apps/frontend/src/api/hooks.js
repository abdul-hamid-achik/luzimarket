import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as productsApi from "./products";
import * as cartApi from "./cart";
import * as ordersApi from "./orders";
import * as salesApi from "./sales";
import * as petitionsAdmissionsApi from "./petitionsAdmissions";
import * as petitionsProductsApi from "./petitionsProducts";
import * as petitionsBranchesApi from "./petitionsBranches";
import * as petitionsApi from "./petitions";
import * as statesApi from "./states";
import * as adminOrdersApi from "./adminOrders";

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

export const useAdminOrders = () =>
  useQuery(['adminOrders'], adminOrdersApi.getAdminOrders);

export const useOrder = (orderId) =>
  useQuery(['order', orderId], () => ordersApi.getOrder(orderId));
  
export const useSales = () =>
  useQuery(['sales'], salesApi.getSales);
  
export const useAdmissionPetitions = () =>
  useQuery(['admissionPetitions'], petitionsAdmissionsApi.getAdmissionPetitions);

export const useProductPetitions = () =>
  useQuery(['productPetitions'], petitionsProductsApi.getProductPetitions);

export const useBranchPetitions = () =>
  useQuery(['branchPetitions'], petitionsBranchesApi.getBranchPetitions);
  
export const usePetitions = () =>
  useQuery(['petitions'], petitionsApi.getPetitions);
  
export const useStates = () =>
  useQuery(['states'], statesApi.getStates);
  