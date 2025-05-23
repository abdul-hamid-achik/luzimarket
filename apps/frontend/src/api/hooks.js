import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as productsApi from "@/api/products";
import * as cartApi from "@/api/cart";
import * as ordersApi from "@/api/orders";
import * as salesApi from "@/api/sales";
import * as petitionsAdmissionsApi from "@/api/petitionsAdmissions";
import * as petitionsProductsApi from "@/api/petitionsProducts";
import * as petitionsBranchesApi from "@/api/petitionsBranches";
import * as petitionsApi from "@/api/petitions";
import * as statesApi from "@/api/states";
import * as adminOrdersApi from "@/api/adminOrders";
import * as categoriesApi from "@/api/categories";
import { getProductDetails } from "@/api/productDetails";
import * as articlesApi from "@/api/articles";
import * as brandsApi from "@/api/brands";
import * as favoritesApi from "@/api/favorites";
import * as deliveryZonesApi from "@/api/deliveryZones";
import * as paymentMethodsApi from "@/api/paymentMethods";
import * as bestSellersApi from "@/api/bestSellers";

export const useProducts = (filters = {}) =>
  useQuery(['products', filters], () => productsApi.getProducts(filters));

export const useProduct = (productId) =>
  useQuery(['product', productId], () => productsApi.getProduct(productId));

export const useBestSellers = () =>
  useQuery(['bestSellers'], bestSellersApi.getBestSellers, {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
  });

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

export const useMergeCart = () => {
  const queryClient = useQueryClient();
  return useMutation(cartApi.mergeCart, {
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

export const useCategories = () =>
  useQuery(['categories'], categoriesApi.getCategories);

export const useProductDetails = (productId) =>
  useQuery(['productDetails', productId], () => getProductDetails(productId));

export const useArticles = () =>
  useQuery(['articles'], articlesApi.getArticles);

export const useArticle = (articleId) =>
  useQuery(['article', articleId], () => articlesApi.getArticle(articleId));

export const useBrands = () =>
  useQuery(['brands'], brandsApi.getBrands);

export const useFavorites = () =>
  useQuery(['favorites'], favoritesApi.getFavorites);

export const useDeliveryZones = () =>
  useQuery(['deliveryZones'], deliveryZonesApi.getDeliveryZones);

export const usePaymentMethods = () =>
  useQuery(['paymentMethods'], paymentMethodsApi.getPaymentMethods);
