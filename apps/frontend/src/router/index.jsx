import { createBrowserRouter } from "react-router-dom";
import Login from '@/pages/login';
import Inicio from '@/layout/inicio';
import NotFound from '@/pages/not_found';
import Dashboard from '@/pages/dashboard';
import Alertas from '@/pages/alertas';
import Peticiones from '@/pages/peticiones';
import Ventas from '@/pages/ventas';
import Categorias from '@/pages/categorias';
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
import Carrito from '@/pages/inicio/pages/cart';
import CustomerLogin from '@/pages/inicio/pages/login_customer';
import CustomerRegister from '@/pages/inicio/pages/register_customer';
import OrderConfirmation from '@/pages/inicio/pages/order_confirmation';
import PerfilUsuario from '@/pages/inicio/pages/perfil_usuario';
import TiendasMarcas from '@/pages/inicio/pages/tiendas_marcas';
import Ocasiones from '@/pages/inicio/pages/ocasiones';
import Editorial from '@/pages/inicio/pages/editorial';
import Favoritos from '@/pages/inicio/pages/favoritos';
import RequireAuth from '@/components/require_auth';

// Admin empleados
import Login2 from '@/pages/empleados/pages/login';
import Inicio2 from '@/pages/empleados/inicio';
import Dashboard2 from '@/pages/empleados/pages/dashboard';
import Alertas2 from '@/pages/empleados/pages/alertas';
import Envios from '@/pages/empleados/pages/envios';
import Horarios from '@/pages/empleados/pages/horarios';

export const router = createBrowserRouter([
  /*PAGINA PRINCIPAL*/
  /*---------------------------------------*/
  {
    path: "/",
    element: <PaginaInicialInicio />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <BodyLuzi /> },
      { path: "handpicked/productos", element: <HandpickedProductos /> },
      { path: "handpicked/productos/:id", element: <Handpicked /> },
      { path: "carrito", element: <RequireAuth><Carrito /></RequireAuth> },
      { path: "login", element: <CustomerLogin /> },
      { path: "register", element: <CustomerRegister /> },
      { path: "perfil", element: <RequireAuth><PerfilUsuario /></RequireAuth> },
      { path: "order-confirmation/:id", element: <RequireAuth><OrderConfirmation /></RequireAuth> },
      { path: "tiendas-marcas", element: <TiendasMarcas /> },
      { path: "ocasiones", element: <Ocasiones /> },
      { path: "editorial", element: <Editorial /> },
      { path: "favoritos", element: <Favoritos /> },
    ],
  },

  /*---------------------------------------*/
  /* PAGINA ADMINISTRADOR */
  {
    path: "/admin",
    element: <Login />,
    errorElement: <NotFound />,
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
    ],
  },

  /*---------------------------------------*/
  /* PAGINA ADMINISTRADOR 2*/

  {
    path: "/empleados",
    element: <Login2 />,
    errorElement: <NotFound />,
  },

  {
    path: "/InicioEmpleados",
    element: <Inicio2 />,
    errorElement: <NotFound />,
    children: [
      {
        path: "DashboardEmpleados",
        element: <Dashboard2 />,
        index: true,
      },
      {
        path: "AlertasEmpleados",
        element: <Alertas2 />,
      },
      {
        path: "Envios",
        element: <Envios />,
      },
      {
        path: "Horarios",
        element: <Horarios />,
      },
    ],
  },
]);
