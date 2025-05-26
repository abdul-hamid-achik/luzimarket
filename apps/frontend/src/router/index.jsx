import { createBrowserRouter } from "react-router-dom";
import Login from '@/pages/login';
import Inicio from '@/layout/inicio';
import NotFound from '@/pages/not_found';
import Dashboard from '@/pages/dashboard';
import Alertas from '@/pages/alertas';
import Peticiones from '@/pages/peticiones';
import Ventas from '@/pages/ventas';
import Categorias from '@/pages/categorias';
import CategoriasCustomer from '@/pages/inicio/pages/categorias';
import Locaciones from '@/pages/locaciones';
import AdmisionesCuerpo from '@/components/peticiones/admisiones/cuerpo_admisiones';
import ProductosCuerpo from '@/components/peticiones/productos/cuerpo_producto';
import SucursalesCuerpo from '@/components/peticiones/sucursales/cuerpo_sucursales';
import EditarAdmisiones from '@/pages/editar_admisiones';
import EditarProductos from '@/pages/editar_producto';
import EditarSucursales from '@/pages/editar_sucursales';
import PaginaInicialInicio from '@/pages/inicio/layout/inicio';
import BodyLuzi from '@/pages/inicio/pages/body_luzi';
import Handpicked from '@/pages/inicio/pages/hand_picked';
import HandpickedProductos from '@/pages/inicio/pages/productos';
import BestSellersPage from '@/pages/inicio/pages/best_sellers';
import Carrito from '@/pages/inicio/pages/cart';
import CustomerLogin from '@/pages/inicio/pages/login_customer';
import CustomerRegister from '@/pages/inicio/pages/register_customer';
import OrderConfirmation from '@/pages/inicio/pages/order_confirmation';
import PerfilUsuario from '@/pages/inicio/pages/perfil_usuario';
import TiendasMarcas from '@/pages/inicio/pages/tiendas_marcas';
import Ocasiones from '@/pages/inicio/pages/ocasiones';
import Editorial from '@/pages/inicio/pages/editorial';
import Favoritos from '@/pages/inicio/pages/favoritos';
import CategoryPage from '@/pages/inicio/pages/category';
import RequireAuth from '@/components/require_auth';
import RequireRole from '@/components/require_role';
import CheckoutPage from '@/pages/inicio/pages/checkout';

// Dashboard components
import Inicio2 from '@/pages/empleados/inicio';
import Dashboard2 from '@/pages/empleados/pages/dashboard';
import Alertas2 from '@/pages/empleados/pages/alertas';
import Envios from '@/pages/empleados/pages/envios';
import Horarios from '@/pages/empleados/pages/horarios';
import Productos from '@/pages/empleados/pages/productos';
import Dinero from '@/pages/empleados/pages/dinero';
import { StripeProvider } from '@/context/StripeContext';

// CMS Components
import AdminLayout from '@/components/cms/admin_layout';
import ProductManagement from '@/components/cms/product_management';
import VendorManagement from '@/components/cms/vendor_management';
import HomepageSlidesManagement from '@/components/cms/homepage_slides_management';

export const router = createBrowserRouter([
  /*PAGINA PRINCIPAL*/
  /*---------------------------------------*/
  {
    path: "/",
    element: <PaginaInicialInicio />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <BodyLuzi /> },
      { path: "best-sellers", element: <BestSellersPage /> },
      { path: "handpicked/productos", element: <HandpickedProductos /> },
      { path: "handpicked/productos/:id", element: <Handpicked /> },
      { path: "carrito", element: <Carrito /> },
      { path: "checkout", element: <RequireAuth><StripeProvider><CheckoutPage /></StripeProvider></RequireAuth> },
      { path: "login", element: <CustomerLogin /> },
      { path: "register", element: <CustomerRegister /> },
      { path: "perfil", element: <RequireAuth><PerfilUsuario /></RequireAuth> },
      { path: "order-confirmation/:id", element: <RequireAuth><OrderConfirmation /></RequireAuth> },
      { path: "tiendas-marcas", element: <TiendasMarcas /> },
      { path: "categorias", element: <CategoriasCustomer /> },
      { path: "categorias/:slug", element: <CategoryPage /> },
      { path: "ocasiones", element: <Ocasiones /> },
      { path: "editorial", element: <Editorial /> },
      { path: "favoritos", element: <Favoritos /> },
      // Catch-all route for main site invalid URLs
      { path: "*", element: <NotFound /> },
    ],
  },

  /*---------------------------------------*/
  /* PAGINA ADMINISTRADOR */
  {
    path: "/admin",
    element: <Login />,
    errorElement: <NotFound />,
  },

  /*---------------------------------------*/
  /* CMS ADMIN ROUTES */
  {
    path: "/admin/cms",
    element: <RequireRole allowedRoles={['admin']}><AdminLayout /></RequireRole>,
    errorElement: <NotFound />,
    children: [
      { path: "products", element: <ProductManagement /> },
      { path: "vendors", element: <VendorManagement /> },
      { path: "homepage", element: <HomepageSlidesManagement /> },
      // Add more CMS routes as components are created
      // { path: "dashboard", element: <CMSDashboard /> },
      // { path: "categories", element: <CategoryManagement /> },
      // { path: "orders", element: <OrderManagement /> },
      // { path: "users", element: <UserManagement /> },
      // { path: "photos", element: <MediaLibrary /> },
      // { path: "settings", element: <CMSSettings /> },
      // Catch-all route for CMS admin invalid URLs
      { path: "*", element: <NotFound /> },
    ],
  },

  {
    path: "/inicio",
    element: <Inicio />,
    errorElement: <NotFound />,
    children: [
      {
        path: "dashboard",
        element: <Dashboard />,
        index: true,
      },
      {
        path: "alertas",
        element: <Alertas />,
      },
      {
        path: "peticiones",
        element: <Peticiones />,
      },
      //RUTAS DE PETICIONES
      {
        path: "peticiones/admisiones",
        element: <AdmisionesCuerpo />,
      },
      {
        path: "peticiones/admisiones/editar",
        element: <EditarAdmisiones />,
      },
      {
        path: "peticiones/productos",
        element: <ProductosCuerpo />,
      },
      {
        path: "peticiones/productos/editar",
        element: <EditarProductos />,
      },
      {
        path: "peticiones/sucursales",
        element: <SucursalesCuerpo />,
      },
      {
        path: "peticiones/sucursales/editar",
        element: <EditarSucursales />,
      },
      {
        path: "ventas",
        element: <Ventas />,
      },
      {
        path: "categorias",
        element: <Categorias />,
      },
      {
        path: "locaciones",
        element: <Locaciones />,
      },
      // Catch-all route for admin invalid URLs
      { path: "*", element: <NotFound /> },
    ],
  },

  /*---------------------------------------*/
  /* DASHBOARD - EMPLOYEES & ADMINS */
  {
    path: "/dashboard",
    element: <RequireRole allowedRoles={['employee', 'admin']}><Inicio2 /></RequireRole>,
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: <Dashboard2 />,
      },
      {
        path: "alertas",
        element: <Alertas2 />,
      },
      {
        path: "productos",
        element: <Productos />,
      },
      {
        path: "envios",
        element: <Envios />,
      },
      {
        path: "dinero",
        element: <Dinero />,
      },
      {
        path: "horarios",
        element: <Horarios />,
      },
      // Catch-all route for dashboard invalid URLs
      { path: "*", element: <NotFound /> },
    ],
  },

  // Global catch-all route for any other unmatched URLs
  {
    path: "*",
    element: <NotFound />,
  },
]);
