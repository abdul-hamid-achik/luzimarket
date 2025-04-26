import { createBrowserRouter } from "react-router-dom";
import Login from "../pages/Login";
import Inicio from "../layout/Inicio";
import NotFound from "../pages/NotFound";
import Dashboard from "../pages/Dashboard";
import Alertas from "../pages/Alertas";
import Peticiones from "../pages/Peticiones";
import Ventas from "../pages/Ventas";
import Categorias from "../pages/Categorias";
import Locaciones from "../pages/Locaciones";
import AdmisionesCuerpo from "../components/peticiones/Admisiones/CuerpoAdmisiones";
import ProductosCuerpo from "../components/peticiones/Productos/CuerpoProducto";
import SucursalesCuerpo from "../components/peticiones/Sucursales/CuerpoSucursales";
import EditarAdmisiones from "../pages/EditarAdmisiones";
import EditarProductos from "../pages/EditarProducto";
import EditarSucursales from "../pages/EditarSucursales";
import PaginaInicialInicio from "../PaginaPrincipal/src/Layout/inicio";
import Handpicked from "../PaginaPrincipal/src/pages/HandPicked";
import HandpickedProductos from "../PaginaPrincipal/src/pages/Productos";
import Carrito from "../PaginaPrincipal/src/pages/Cart";
import CustomerLogin from "../PaginaPrincipal/src/pages/LoginCustomer";
import CustomerRegister from "../PaginaPrincipal/src/pages/RegisterCustomer";
import OrderConfirmation from "../PaginaPrincipal/src/pages/OrderConfirmation";
import PerfilUsuario from "../PaginaPrincipal/src/pages/PerfilUsuario";
import RequireAuth from "../components/RequireAuth";

//admin2
import Login2 from "../Empleados/pages/Login";
import Inicio2 from "../Empleados/inicio";
import Dashboard2 from "../Empleados/Pages/Dashboard";
import Alertas2 from "../Empleados/Pages/Alertas";
import Envios from "../Empleados/Pages/Envios";
import Horarios from "../Empleados/Pages/Horarios";

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
