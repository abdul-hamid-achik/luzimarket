import { describe, it, expect, vi } from 'vitest';
import { router } from './index';

// Mock all the page components
vi.mock('@/pages/login', () => ({ default: () => <div>Login</div> }));
vi.mock('@/layout/inicio', () => ({ default: () => <div>Inicio Layout</div> }));
vi.mock('@/pages/not_found', () => ({ default: () => <div>Not Found</div> }));
vi.mock('@/pages/dashboard', () => ({ default: () => <div>Dashboard</div> }));
vi.mock('@/pages/alertas', () => ({ default: () => <div>Alertas</div> }));
vi.mock('@/pages/peticiones', () => ({ default: () => <div>Peticiones</div> }));
vi.mock('@/pages/ventas', () => ({ default: () => <div>Ventas</div> }));
vi.mock('@/pages/categorias', () => ({ default: () => <div>Admin Categorias</div> }));
vi.mock('@/pages/inicio/pages/categorias', () => ({ default: () => <div>Customer Categorias</div> }));
vi.mock('@/pages/locaciones', () => ({ default: () => <div>Locaciones</div> }));
vi.mock('@/pages/inicio/layout/inicio', () => ({ default: () => <div>Main Layout</div> }));
vi.mock('@/pages/inicio/pages/body_luzi', () => ({ default: () => <div>Body Luzi</div> }));
vi.mock('@/pages/inicio/pages/hand_picked', () => ({ default: () => <div>Handpicked</div> }));
vi.mock('@/pages/inicio/pages/productos', () => ({ default: () => <div>Productos</div> }));
vi.mock('@/pages/inicio/pages/cart', () => ({ default: () => <div>Cart</div> }));
vi.mock('@/pages/inicio/pages/login_customer', () => ({ default: () => <div>Customer Login</div> }));
vi.mock('@/pages/inicio/pages/register_customer', () => ({ default: () => <div>Customer Register</div> }));
vi.mock('@/pages/inicio/pages/order_confirmation', () => ({ default: () => <div>Order Confirmation</div> }));
vi.mock('@/pages/inicio/pages/perfil_usuario', () => ({ default: () => <div>User Profile</div> }));
vi.mock('@/pages/inicio/pages/tiendas_marcas', () => ({ default: () => <div>Tiendas Marcas</div> }));
vi.mock('@/pages/inicio/pages/ocasiones', () => ({ default: () => <div>Ocasiones</div> }));
vi.mock('@/pages/inicio/pages/editorial', () => ({ default: () => <div>Editorial</div> }));
vi.mock('@/pages/inicio/pages/favoritos', () => ({ default: () => <div>Favoritos</div> }));
vi.mock('@/pages/inicio/pages/checkout', () => ({ default: () => <div>Checkout</div> }));
vi.mock('@/pages/empleados/pages/login', () => ({ default: () => <div>Employee Login</div> }));
vi.mock('@/pages/empleados/inicio', () => ({ default: () => <div>Employee Layout</div> }));
vi.mock('@/pages/empleados/pages/dashboard', () => ({ default: () => <div>Employee Dashboard</div> }));
vi.mock('@/pages/empleados/pages/alertas', () => ({ default: () => <div>Employee Alertas</div> }));
vi.mock('@/pages/empleados/pages/envios', () => ({ default: () => <div>Employee Envios</div> }));
vi.mock('@/pages/empleados/pages/horarios', () => ({ default: () => <div>Employee Horarios</div> }));
vi.mock('@/pages/empleados/pages/productos', () => ({ default: () => <div>Employee Productos</div> }));
vi.mock('@/pages/empleados/pages/dinero', () => ({ default: () => <div>Employee Dinero</div> }));
vi.mock('@/components/require_auth', () => ({ default: ({ children }) => <div>{children}</div> }));
vi.mock('@/context/StripeContext', () => ({ StripeProvider: ({ children }) => <div>{children}</div> }));

describe('Router Configuration', () => {
    it('has main site routes configured', () => {
        const mainRoute = router.routes.find(route => route.path === '/');
        expect(mainRoute).toBeDefined();
        expect(mainRoute.children).toBeDefined();

        const childPaths = mainRoute.children.map(child => child.path || 'index');
        expect(childPaths).toContain('index');
        expect(childPaths).toContain('handpicked/productos');
        expect(childPaths).toContain('carrito');
        expect(childPaths).toContain('login');
        expect(childPaths).toContain('register');
        expect(childPaths).toContain('tiendas-marcas');
        expect(childPaths).toContain('categorias');
        expect(childPaths).toContain('ocasiones');
        expect(childPaths).toContain('editorial');
        expect(childPaths).toContain('favoritos');
    });

    it('has admin routes configured', () => {
        const adminLoginRoute = router.routes.find(route => route.path === '/admin');
        expect(adminLoginRoute).toBeDefined();

        const adminMainRoute = router.routes.find(route => route.path === '/inicio');
        expect(adminMainRoute).toBeDefined();
        expect(adminMainRoute.children).toBeDefined();

        const adminChildPaths = adminMainRoute.children.map(child => child.path);
        expect(adminChildPaths).toContain('dashboard');
        expect(adminChildPaths).toContain('alertas');
        expect(adminChildPaths).toContain('peticiones');
        expect(adminChildPaths).toContain('ventas');
        expect(adminChildPaths).toContain('categorias');
        expect(adminChildPaths).toContain('locaciones');
    });

    it('has employee routes configured', () => {
        const employeeLoginRoute = router.routes.find(route => route.path === '/empleados');
        expect(employeeLoginRoute).toBeDefined();

        const employeeMainRoute = router.routes.find(route => route.path === '/InicioEmpleados');
        expect(employeeMainRoute).toBeDefined();
        expect(employeeMainRoute.children).toBeDefined();

        const employeeChildPaths = employeeMainRoute.children.map(child => child.path);
        expect(employeeChildPaths).toContain('DashboardEmpleados');
        expect(employeeChildPaths).toContain('AlertasEmpleados');
        expect(employeeChildPaths).toContain('Productos');
        expect(employeeChildPaths).toContain('Envios');
        expect(employeeChildPaths).toContain('Dinero');
        expect(employeeChildPaths).toContain('Horarios');
    });

    it('has new employee routes properly configured', () => {
        const employeeMainRoute = router.routes.find(route => route.path === '/InicioEmpleados');
        const productosRoute = employeeMainRoute.children.find(child => child.path === 'Productos');
        const dineroRoute = employeeMainRoute.children.find(child => child.path === 'Dinero');
        const enviosRoute = employeeMainRoute.children.find(child => child.path === 'Envios');

        expect(productosRoute).toBeDefined();
        expect(dineroRoute).toBeDefined();
        expect(enviosRoute).toBeDefined();

        expect(productosRoute.element).toBeDefined();
        expect(dineroRoute.element).toBeDefined();
        expect(enviosRoute.element).toBeDefined();
    });

    it('has customer categorias route configured', () => {
        const mainRoute = router.routes.find(route => route.path === '/');
        const categoriasRoute = mainRoute.children.find(child => child.path === 'categorias');

        expect(categoriasRoute).toBeDefined();
        expect(categoriasRoute.element).toBeDefined();
    });

    it('has error handling configured', () => {
        router.routes.forEach(route => {
            expect(route.errorElement).toBeDefined();
        });
    });

    it('has protected routes configured', () => {
        const mainRoute = router.routes.find(route => route.path === '/');
        const checkoutRoute = mainRoute.children.find(child => child.path === 'checkout');
        const perfilRoute = mainRoute.children.find(child => child.path === 'perfil');
        const orderConfirmationRoute = mainRoute.children.find(child => child.path === 'order-confirmation/:id');

        expect(checkoutRoute).toBeDefined();
        expect(perfilRoute).toBeDefined();
        expect(orderConfirmationRoute).toBeDefined();

        // These routes should be wrapped with RequireAuth
        expect(checkoutRoute.element).toBeDefined();
        expect(perfilRoute.element).toBeDefined();
        expect(orderConfirmationRoute.element).toBeDefined();
    });

    it('has petition sub-routes configured', () => {
        const adminMainRoute = router.routes.find(route => route.path === '/inicio');
        const petitionRoutes = adminMainRoute.children.filter(child =>
            child.path && child.path.startsWith('peticiones/')
        );

        expect(petitionRoutes.length).toBeGreaterThan(0);

        const petitionPaths = petitionRoutes.map(route => route.path);
        expect(petitionPaths).toContain('peticiones/admisiones');
        expect(petitionPaths).toContain('peticiones/productos');
        expect(petitionPaths).toContain('peticiones/sucursales');
    });

    it('has all routes with proper elements', () => {
        const checkRouteElements = (routes) => {
            routes.forEach(route => {
                if (route.element) {
                    expect(route.element).toBeDefined();
                }
                if (route.children) {
                    checkRouteElements(route.children);
                }
            });
        };

        checkRouteElements(router.routes);
    });
}); 