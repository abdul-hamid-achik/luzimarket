import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from "@/context/auth_context";
import { Spinner } from 'react-bootstrap';

const RequireRole = ({ children, allowedRoles = [] }) => {
    const { isAuthenticated, isLoading, user } = useAuth();
    const location = useLocation();

    // Show loading spinner while authentication state is being determined
    if (isLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    // Check if user has required role
    const userRole = user?.role;
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        return (
            <div className="container mt-5 text-center">
                <h3>Acceso Denegado</h3>
                <p>No tienes permisos para acceder a esta página.</p>
                <p>Tu rol actual: <strong>{userRole}</strong></p>
                <p>Roles requeridos: <strong>{allowedRoles.join(', ')}</strong></p>
            </div>
        );
    }

    return children;
};

export default RequireRole; 