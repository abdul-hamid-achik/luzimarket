import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth_context';
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
import * as vendorsApi from "@/api/vendors";
import * as photosApi from "@/api/photos";
import * as homepageSlidesApi from "@/api/homepageSlides";
import * as analyticsApi from "@/api/analytics";
import * as authApi from "@/api/auth";
import * as notificationsApi from "./notifications";

export const useProducts = (filters = {}) =>
  useQuery(['products', filters], () => productsApi.getProducts(filters));

export const useProduct = (productId) =>
  useQuery(
    ['product', productId],
    () => productsApi.getProduct(productId),
    {
      retry: (failureCount, error) => {
        // Don't retry on 404 errors (product not found)
        if (error?.response?.status === 404) {
          return false;
        }
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Don't show error UI immediately for 404s, let the component handle it
      useErrorBoundary: (error) => {
        // Only use error boundary for non-404 errors
        return error?.response?.status !== 404;
      }
    }
  );

export const useBestSellers = () =>
  useQuery(['bestSellers'], bestSellersApi.getBestSellers, {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
  });

export const useCart = () => {
  const { isLoading: authLoading } = useAuth();

  return useQuery(['cart'], cartApi.getCart, {
    enabled: !authLoading, // Only run when auth initialization is complete
  });
};

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

export const useOrders = () => {
  const { isLoading: authLoading } = useAuth();

  return useQuery(['orders'], ordersApi.getOrders, {
    enabled: !authLoading, // Only run when auth initialization is complete
  });
};

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

export const useCategory = (categoryId) =>
  useQuery(['category', categoryId], () => categoriesApi.getCategory(categoryId), {
    enabled: !!categoryId
  });

export const useCategoryBySlug = (slug) =>
  useQuery(['category', 'slug', slug], () => categoriesApi.getCategoryBySlug(slug), {
    enabled: !!slug
  });

export const useProductDetails = (productId) =>
  useQuery(['productDetails', productId], () => getProductDetails(productId));

export const useArticles = () =>
  useQuery(['articles'], articlesApi.getArticles);

export const useArticle = (articleId) =>
  useQuery(['article', articleId], () => articlesApi.getArticle(articleId));

export const useBrands = () =>
  useQuery(['brands'], brandsApi.getBrands);

export const useFavorites = () => {
  const { isLoading: authLoading, isAuthenticated } = useAuth();

  return useQuery(['favorites'], favoritesApi.getFavorites, {
    enabled: !authLoading && isAuthenticated, // Only run when auth complete AND user is authenticated
    retry: (failureCount, error) => {
      // Don't retry on 401 errors (user not authenticated)
      if (error?.response?.status === 401) {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
    // Don't show error UI for 401s, let the component handle it
    useErrorBoundary: (error) => {
      // Only use error boundary for non-401 errors
      return error?.response?.status !== 401;
    }
  });
};

export const useAddToFavorites = () => {
  const queryClient = useQueryClient();
  return useMutation(favoritesApi.addToFavorites, {
    onSuccess: () => {
      queryClient.invalidateQueries(['favorites']);
    },
  });
};

export const useRemoveFromFavorites = () => {
  const queryClient = useQueryClient();
  return useMutation(favoritesApi.removeFromFavorites, {
    onSuccess: () => {
      queryClient.invalidateQueries(['favorites']);
    },
  });
};

export const useFavoritesAnalytics = (limit = 10) =>
  useQuery(['favoritesAnalytics', limit], () => favoritesApi.getFavoritesAnalytics(limit), {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    enabled: true
  });

export const useDeliveryZones = (params = {}) =>
  useQuery(
    ['deliveryZones', params],
    () => deliveryZonesApi.getDeliveryZones(params),
    {
      enabled: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

export const useUpdateSessionDeliveryZone = () => {
  const queryClient = useQueryClient();
  return useMutation(authApi.updateSessionDeliveryZone, {
    onSuccess: () => {
      // Invalidate any queries that depend on delivery zone
      queryClient.invalidateQueries(['cart']);
      queryClient.invalidateQueries(['product']); // Re-fetch all product data to update delivery info
      queryClient.invalidateQueries(['products']); // Also invalidate product listings
      queryClient.invalidateQueries(['productDeliveryZones']); // Update delivery zone availability
    },
  });
};

export const useRestoreUserPreferences = () => {
  const queryClient = useQueryClient();
  return useMutation(authApi.restoreUserPreferences, {
    onSuccess: () => {
      // Invalidate cart and other location-dependent queries
      queryClient.invalidateQueries(['cart']);
    },
  });
};

export const usePaymentMethods = () =>
  useQuery(['paymentMethods'], paymentMethodsApi.getPaymentMethods);

// =============== CMS HOOKS ===============

// Vendors
export const useVendors = () =>
  useQuery(['vendors'], vendorsApi.getVendors);

export const useVendor = (vendorId) =>
  useQuery(['vendor', vendorId], () => vendorsApi.getVendor(vendorId), {
    enabled: !!vendorId
  });

export const useCreateVendor = () => {
  const queryClient = useQueryClient();
  return useMutation(vendorsApi.createVendor, {
    onSuccess: () => {
      queryClient.invalidateQueries(['vendors']);
    },
  });
};

export const useUpdateVendor = () => {
  const queryClient = useQueryClient();
  return useMutation(vendorsApi.updateVendor, {
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['vendors']);
      queryClient.invalidateQueries(['vendor', variables.vendorId]);
    },
  });
};

export const useDeleteVendor = () => {
  const queryClient = useQueryClient();
  return useMutation(vendorsApi.deleteVendor, {
    onSuccess: () => {
      queryClient.invalidateQueries(['vendors']);
    },
  });
};

// Enhanced Products for CMS
export const useCMSProducts = (filters = {}) =>
  useQuery(['cms-products', filters], () => productsApi.getProducts(filters));

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation(productsApi.createProduct, {
    onSuccess: () => {
      queryClient.invalidateQueries(['cms-products']);
      queryClient.invalidateQueries(['products']);
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation(productsApi.updateProduct, {
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['cms-products']);
      queryClient.invalidateQueries(['products']);
      queryClient.invalidateQueries(['product', variables.productId]);
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  return useMutation(productsApi.deleteProduct, {
    onSuccess: () => {
      queryClient.invalidateQueries(['cms-products']);
      queryClient.invalidateQueries(['products']);
    },
  });
};

// Photos
export const usePhotos = (filters = {}) =>
  useQuery(['photos', filters], () => photosApi.getPhotos(filters));

export const useUploadPhoto = () => {
  const queryClient = useQueryClient();
  return useMutation(photosApi.uploadPhoto, {
    onSuccess: () => {
      queryClient.invalidateQueries(['photos']);
    },
  });
};

export const useDeletePhoto = () => {
  const queryClient = useQueryClient();
  return useMutation(photosApi.deletePhoto, {
    onSuccess: () => {
      queryClient.invalidateQueries(['photos']);
    },
  });
};

// Homepage Slides
export const useHomepageSlides = () =>
  useQuery(['homepageSlides'], homepageSlidesApi.getHomepageSlides, {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
  });

export const useAllHomepageSlides = () =>
  useQuery(['allHomepageSlides'], homepageSlidesApi.getAllHomepageSlides);

export const useHomepageSlide = (slideId) =>
  useQuery(['homepageSlide', slideId], () => homepageSlidesApi.getHomepageSlide(slideId), {
    enabled: !!slideId
  });

export const useCreateHomepageSlide = (customOptions = {}) => {
  const queryClient = useQueryClient();
  return useMutation(homepageSlidesApi.createHomepageSlide, {
    onSuccess: (data, variables, context) => {
      // Default success behavior
      queryClient.invalidateQueries(['homepageSlides']);
      queryClient.invalidateQueries(['allHomepageSlides']);

      // Call custom onSuccess if provided
      if (customOptions.onSuccess) {
        customOptions.onSuccess(data, variables, context);
      }
    },
    ...customOptions // Merge other custom options
  });
};

export const useUpdateHomepageSlide = (customOptions = {}) => {
  const queryClient = useQueryClient();
  return useMutation(homepageSlidesApi.updateHomepageSlide, {
    onSuccess: (data, variables, context) => {
      // Default success behavior
      queryClient.invalidateQueries(['homepageSlides']);
      queryClient.invalidateQueries(['allHomepageSlides']);
      queryClient.invalidateQueries(['homepageSlide', variables.slideId]);

      // Call custom onSuccess if provided
      if (customOptions.onSuccess) {
        customOptions.onSuccess(data, variables, context);
      }
    },
    ...customOptions // Merge other custom options
  });
};

export const useDeleteHomepageSlide = (customOptions = {}) => {
  const queryClient = useQueryClient();
  return useMutation(homepageSlidesApi.deleteHomepageSlide, {
    onSuccess: (data, variables, context) => {
      // Default success behavior
      queryClient.invalidateQueries(['homepageSlides']);
      queryClient.invalidateQueries(['allHomepageSlides']);

      // Call custom onSuccess if provided
      if (customOptions.onSuccess) {
        customOptions.onSuccess(data, variables, context);
      }
    },
    ...customOptions // Merge other custom options
  });
};

// =============== ANALYTICS HOOKS ===============

// Sales Analytics
export const useSalesAnalytics = (params = {}) =>
  useQuery(['salesAnalytics', params], () => analyticsApi.getSalesAnalytics(params), {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    enabled: true
  });

// Order Status Analytics
export const useOrderStatusAnalytics = (params = {}) =>
  useQuery(['orderStatusAnalytics', params], () => analyticsApi.getOrderStatusAnalytics(params), {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    enabled: true
  });

// Vendor Performance Analytics
export const useVendorAnalytics = (params = {}) =>
  useQuery(['vendorAnalytics', params], () => analyticsApi.getVendorAnalytics(params), {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    enabled: true
  });

// Category Performance Analytics
export const useCategoryAnalytics = (params = {}) =>
  useQuery(['categoryAnalytics', params], () => analyticsApi.getCategoryAnalytics(params), {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    enabled: true
  });

// Product Performance Analytics
export const useProductAnalytics = (params = {}) =>
  useQuery(['productAnalytics', params], () => analyticsApi.getProductAnalytics(params), {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    enabled: true
  });

// Product Delivery Zones
export const useProductDeliveryZones = (productId) =>
  useQuery(['productDeliveryZones', productId], () => productsApi.getProductDeliveryZones(productId), {
    enabled: !!productId
  });

export const useUpdateProductDeliveryZones = () => {
  const queryClient = useQueryClient();
  return useMutation(productsApi.updateProductDeliveryZones, {
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['productDeliveryZones', variables.productId]);
      // Also invalidate the product query to refresh delivery info
      queryClient.invalidateQueries(['product', variables.productId]);
    },
  });
};

// Notifications hooks
export const useNotifications = (params = {}) =>
  useQuery(
    ['notifications', params],
    () => notificationsApi.getNotifications(params),
    {
      enabled: true,
      refetchInterval: 30 * 1000, // Refetch every 30 seconds for real-time updates
      staleTime: 10 * 1000, // 10 seconds
    }
  );

export const useCreateNotification = () =>
  useMutation(notificationsApi.createNotification);

export const useMarkNotificationAsRead = () =>
  useMutation(({ id, isRead }) => notificationsApi.markNotificationAsRead(id, isRead));

export const useDeleteNotification = () =>
  useMutation(notificationsApi.deleteNotification);
