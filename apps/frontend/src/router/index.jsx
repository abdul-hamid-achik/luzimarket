import { createBrowserRouter } from "react-router-dom";
import Login from "../pages/login";
import Inicio from "../layout/inicio";
import NotFound from "../pages/not_found";
import Dashboard from "../pages/dashboard";
import Alertas from "../pages/alertas";
import Peticiones from "../pages/peticiones";
import Ventas from "../pages/ventas";
import Categorias from "../pages/categorias";
import Locaciones from "../pages/locaciones";
import AdmisionesCuerpo from "../components/peticiones/admisiones/cuerpo_admisiones";
import ProductosCuerpo from "../components/peticiones/productos/cuerpo_producto";
import SucursalesCuerpo from "../components/peticiones/sucursales/cuerpo_sucursales";
import EditarAdmisiones from "../pages/editar_admisiones";
import EditarProductos from "../pages/editar_producto";
import EditarSucursales from "../pages/editar_sucursales";
import PaginaInicialInicio from "../pagina_principal/src/pages/body_luzi";
import Handpicked from "../pagina_principal/src/pages/hand_picked";
import HandpickedProductos from "../pagina_principal/src/pages/productos";
import Carrito from "../pagina_principal/src/pages/cart";
import CustomerLogin from "../pagina_principal/src/pages/login_customer";
import CustomerRegister from "../pagina_principal/src/pages/register_customer";
import OrderConfirmation from "../pagina_principal/src/pages/order_confirmation";
import PerfilUsuario from "../pagina_principal/src/pages/perfil_usuario";
import RequireAuth from "../components/require_auth";

// Admin empleados
import Login2 from "../empleados/pages/login";
import Inicio2 from "../empleados/inicio";
import Dashboard2 from "../empleados/pages/dashboard";
import Alertas2 from "../empleados/pages/alertas";
import Envios from "../empleados/pages/envios";
import Horarios from "../empleados/pages/horarios";

export const router = createBrowserRouter([
  /*PAGINA PRINCIPAL*/
  /*---------------------------------------*/
  {
    path: "/",
    element: <PaginaInicialInicio />,
    errorElement: <NotFound />,
    index: true,
  },
  {
    path: "handpicked/productos",
    element: <HandpickedProductos />,
    errorElement: <NotFound />,
  },
  {
    path: "handpicked/productos/:id",
    element: <Handpicked />,
    errorElement: <NotFound />,
  },
  {
    path: "carrito",
    element: (
      <RequireAuth>
        <Carrito />
      </RequireAuth>
    ),
    errorElement: <NotFound />
  },
  {
    path: "login",
    element: <CustomerLogin />,
    errorElement: <NotFound />
  },
  {
    path: "register",
    element: <CustomerRegister />,
    errorElement: <NotFound />
  },
  {
    path: "perfil",
    element: (
      <RequireAuth>
        <PerfilUsuario />
      </RequireAuth>
    ),
    errorElement: <NotFound />
  },
  {
    path: "order-confirmation/:id",
    element: (
      <RequireAuth>
        <OrderConfirmation />
      </RequireAuth>
    ),
    errorElement: <NotFound />
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
