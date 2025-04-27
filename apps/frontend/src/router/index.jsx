import { createBrowserRouter } from "react-router-dom";
import Login from "import../";
import Inicio from "import../";
import NotFound from "import../";
import Dashboard from "import../";
import Alertas from "import../";
import Peticiones from "import../";
import Ventas from "import../";
import Categorias from "import../";
import Locaciones from "import../";
import AdmisionesCuerpo from "import../";
import ProductosCuerpo from "import../";
import SucursalesCuerpo from "import../";
import EditarAdmisiones from "import../";
import EditarProductos from "import../";
import EditarSucursales from "import../";
import PaginaInicialInicio from "import../";
import Handpicked from "import../";
import HandpickedProductos from "import../";
import Carrito from "import../";
import CustomerLogin from "import../";
import CustomerRegister from "import../";
import OrderConfirmation from "import../";
import PerfilUsuario from "import../";
import RequireAuth from "import../";

//admin2
import Login2 from "import../";
import Inicio2 from "import../";
import Dashboard2 from "import../";
import Alertas2 from "import../";
import Envios from "import../";
import Horarios from "import../";

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
